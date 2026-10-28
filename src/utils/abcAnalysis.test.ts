/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateConsumptionMetrics,
  performABCAnalysis,
  EnrichedABCItem
} from './abcAnalysis';
import { MaterialItem, InventoryMovement } from '../types';

test('calculateConsumptionMetrics - correctly identifies critical risk when stock is zero', () => {
  const item: MaterialItem = {
    id: 'mat-1',
    code: 'MAT-001',
    name: 'Máscara N95',
    category: 'EPIs e Segurança',
    unit: 'un',
    currentStock: 0,
    minimumStock: 50,
    shelfLocation: 'A-01',
    unitPrice: 10,
    lastUpdated: new Date().toISOString()
  };

  const metrics = calculateConsumptionMetrics(item, [], 30);
  assert.equal(metrics.riskLevel, 'CRITICO');
  assert.equal(metrics.daysOfRunway, 0);
  assert.ok(metrics.suggestedReorderQty >= 50);
});

test('calculateConsumptionMetrics - calculates daily burn rate and days of runway from outflows', () => {
  const item: MaterialItem = {
    id: 'mat-2',
    code: 'MAT-002',
    name: 'Luva Cirúrgica',
    category: 'EPIs e Segurança',
    unit: 'cx',
    currentStock: 100,
    minimumStock: 30,
    shelfLocation: 'A-02',
    unitPrice: 25,
    lastUpdated: new Date().toISOString()
  };

  const now = Date.now();
  const movements: InventoryMovement[] = [
    {
      id: 'mov-1',
      type: 'SAIDA',
      itemId: 'mat-2',
      itemCode: 'MAT-002',
      itemName: 'Luva Cirúrgica',
      quantity: 60,
      previousStock: 160,
      newStock: 100,
      userEmail: 'admin@estoquecentral.com',
      userName: 'Admin',
      reason: 'Atendimento UTI',
      supplierOrReceiver: 'UTI 1',
      documentNumber: 'REQ-01',
      date: new Date(now - 1000 * 3600 * 24 * 5).toISOString(),
      timestamp: now - 1000 * 3600 * 24 * 5,
      synced: true
    }
  ];

  const metrics = calculateConsumptionMetrics(item, movements, 30);
  // 60 units in 30 days = 2 units / day. 100 units / 2 = 50 days runway
  assert.equal(metrics.totalOutflow, 60);
  assert.equal(metrics.dailyConsumption, 2);
  assert.equal(metrics.daysOfRunway, 50);
  assert.equal(metrics.riskLevel, 'SEGURO');
});

test('performABCAnalysis - handles empty materials gracefully', () => {
  const result = performABCAnalysis([]);
  assert.equal(result.items.length, 0);
  assert.equal(result.totalStockValue, 0);
  assert.equal(result.classA.count, 0);
  assert.equal(result.classB.count, 0);
  assert.equal(result.classC.count, 0);
});

test('performABCAnalysis - correctly classifies items into Class A, B, and C by Pareto distribution', () => {
  const materials: MaterialItem[] = [
    {
      id: 'item-high',
      code: 'HIGH-01',
      name: 'Respirador Hospitalar',
      category: 'Insumos Hospitalares',
      unit: 'un',
      currentStock: 10,
      minimumStock: 2,
      shelfLocation: 'A-1',
      unitPrice: 10000, // Total: R$ 100.000 (Majority of total stock value)
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'item-med',
      code: 'MED-01',
      name: 'Monitor Multiparamétrico',
      category: 'Insumos Hospitalares',
      unit: 'un',
      currentStock: 5,
      minimumStock: 1,
      shelfLocation: 'B-1',
      unitPrice: 3000, // Total: R$ 15.000 (~13%)
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'item-low-1',
      code: 'LOW-01',
      name: 'Álcool em Gel 500ml',
      category: 'Higienização e Limpeza',
      unit: 'frasco',
      currentStock: 200,
      minimumStock: 50,
      shelfLocation: 'C-1',
      unitPrice: 10, // Total: R$ 2.000 (~1.7%)
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'item-low-2',
      code: 'LOW-02',
      name: 'Saco de Lixo Infectante',
      category: 'Higienização e Limpeza',
      unit: 'pct',
      currentStock: 100,
      minimumStock: 20,
      shelfLocation: 'C-2',
      unitPrice: 8, // Total: R$ 800 (~0.7%)
      lastUpdated: new Date().toISOString()
    }
  ];

  const analysis = performABCAnalysis(materials);

  // Total value = 100.000 + 15.000 + 2.000 + 800 = 117.800
  assert.equal(analysis.totalStockValue, 117800);
  assert.equal(analysis.items.length, 4);

  // Highest value item should be Class A and rank 1
  const itemA = analysis.items.find(i => i.code === 'HIGH-01') as EnrichedABCItem;
  assert.ok(itemA);
  assert.equal(itemA.rank, 1);
  assert.equal(itemA.abcClass, 'A');
  assert.ok(itemA.valuePercentage > 80);

  // Medium item should be Class B
  const itemB = analysis.items.find(i => i.code === 'MED-01') as EnrichedABCItem;
  assert.ok(itemB);
  assert.equal(itemB.abcClass, 'B');

  // Low items should be Class C
  const itemC1 = analysis.items.find(i => i.code === 'LOW-01') as EnrichedABCItem;
  assert.ok(itemC1);
  assert.equal(itemC1.abcClass, 'C');

  // Verify class summary counts
  assert.equal(analysis.classA.count, 1);
  assert.equal(analysis.classB.count, 1);
  assert.equal(analysis.classC.count, 2);
});
