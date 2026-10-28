/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { StorageService, INITIAL_USERS, INITIAL_MATERIALS, INITIAL_MACHINES, INITIAL_GUES } from './storage';
import { UserProfile, MaterialItem, MachineEquipment } from '../types';

// Mock localStorage in Node environment if missing
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, value: string) => store.set(key, String(value)),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] || null,
    get length() { return store.size; }
  };
}

const adminUser = INITIAL_USERS[0];
const colabUser = INITIAL_USERS[1];

test('StorageService initializes with default seed data', () => {
  StorageService.init();
  const users = StorageService.getUsers();
  const materials = StorageService.getMaterials();
  const machines = StorageService.getMachines();

  assert.ok(users.length >= 4, 'Users should be populated');
  assert.ok(materials.length >= 8, 'Materials should be populated');
  assert.ok(machines.length >= 4, 'Machines should be populated');
});

test('Atomic Stock Movements: Entrada increments stock and registers movement', () => {
  StorageService.init();
  const materials = StorageService.getMaterials();
  const item = materials[0];
  const prevStock = item.currentStock;

  const result = StorageService.performStockMovement({
    type: 'ENTRADA',
    itemId: item.id,
    quantity: 20,
    reason: 'Test purchase batch',
    supplierOrReceiver: 'Distribuidora Test',
    documentNumber: 'NF-TEST-001',
    actor: adminUser
  });

  assert.equal(result.success, true);
  assert.equal(result.movement?.newStock, prevStock + 20);

  const updatedMaterials = StorageService.getMaterials();
  const updatedItem = updatedMaterials.find(m => m.id === item.id);
  assert.equal(updatedItem?.currentStock, prevStock + 20);
});

test('Atomic Stock Movements: Saida rejects if quantity exceeds current stock', () => {
  StorageService.init();
  const materials = StorageService.getMaterials();
  const item = materials[0];

  const result = StorageService.performStockMovement({
    type: 'SAIDA',
    itemId: item.id,
    quantity: item.currentStock + 5000,
    reason: 'Excessive request test',
    supplierOrReceiver: 'Setor Test',
    documentNumber: 'REQ-TEST-ERR',
    actor: colabUser
  });

  assert.equal(result.success, false);
  assert.match(result.error || '', /Saldo insuficiente/);
});

test('Laundry Validation: Requires shift quantities and employee names', () => {
  StorageService.init();

  // Test zero shift validation
  const invalidResult = StorageService.registerLaundryDispatch({
    date: '2026-10-27',
    time: '10:00',
    senderCollaborator: 'Carlos',
    laundryEmployee: 'Marcos',
    nightShiftQty: 0,
    dayShiftQty: 0,
    actor: adminUser
  });
  assert.equal(invalidResult.success, false);
  assert.match(invalidResult.error || '', /ao menos uma peça/);

  // Test valid dispatch
  const validResult = StorageService.registerLaundryDispatch({
    date: '2026-10-27',
    time: '10:00',
    senderCollaborator: 'Carlos',
    laundryEmployee: 'Marcos',
    nightShiftQty: 40,
    dayShiftQty: 60,
    actor: adminUser
  });
  assert.equal(validResult.success, true);
  assert.equal(validResult.record?.totalSent, 100);

  // Test return discrepancy detection (Peça Pendente)
  const returnRes = StorageService.registerLaundryReturn({
    recordId: validResult.record!.id,
    returnDate: '2026-10-27',
    returnTime: '18:00',
    returnedQty: 85, // Missing 15 pieces!
    receiverCollaborator: 'Mariana',
    pendingNotes: 'Faltam 15 peças em relavagem',
    actor: colabUser
  });
  assert.equal(returnRes.success, true);

  const records = StorageService.getLaundryRecords();
  const updatedRecord = records.find(r => r.id === validResult.record!.id);
  assert.equal(updatedRecord?.status, 'PECA_PENDENTE');
  assert.equal(updatedRecord?.pendingQty, 15);
});

test('Machines: Defect automatically generates Service Order and locks checkout', () => {
  StorageService.init();
  const machines = StorageService.getMachines();
  const availableMachine = machines.find(m => m.status === 'DISPONIVEL');
  assert.ok(availableMachine, 'Must have an available machine');

  // Flag defect
  const defectRes = StorageService.flagMachineDefectAndCreateOS({
    machineId: availableMachine.id,
    issueDescription: 'Motor superaquecendo com vibração excessiva',
    priority: 'CRITICA',
    technicianAssigned: 'Engenharia Clínica',
    actor: colabUser
  });

  assert.equal(defectRes.success, true);
  assert.ok(defectRes.os?.id.startsWith('OS-2026-'));

  // Attempt checkout should be blocked!
  const checkoutAttempt = StorageService.checkoutMachine({
    machineId: availableMachine.id,
    collaboratorName: 'Operador Teste',
    sector: 'Setor A',
    actor: colabUser
  });
  assert.equal(checkoutAttempt.success, false);
  assert.match(checkoutAttempt.error || '', /Operação Bloqueada/);

  // ADM resolution and reactivation
  const resolveRes = StorageService.resolveOSAndReactivateMachine({
    osId: defectRes.os!.id,
    resolutionNotes: 'Troca de rolamento e recalibração concluída',
    actor: adminUser
  });
  assert.equal(resolveRes.success, true);

  const reactivated = StorageService.getMachines().find(m => m.id === availableMachine.id);
  assert.equal(reactivated?.status, 'DISPONIVEL');
  assert.equal(reactivated?.operationalCondition, 'BOM_ESTADO');
});

test('GUE Requests: Approval debits central and Rejection enforces reason', () => {
  StorageService.init();
  const gues = StorageService.getGUEs();
  const materials = StorageService.getMaterials();
  const targetGUE = gues[0];
  const targetMat = materials.find(m => m.currentStock > 30)!;

  // Create request
  const reqRes = StorageService.requestGUEMaterial({
    gueId: targetGUE.id,
    itemId: targetMat.id,
    quantity: 10,
    justification: 'Atendimento de emergência na UPA',
    actor: colabUser
  });
  assert.equal(reqRes.success, true);
  const req = reqRes.request!;

  // Test rejection without reason -> MUST FAIL
  const emptyReasonReject = StorageService.reviewGUERequest({
    requestId: req.id,
    action: 'RECUSAR',
    rejectionReason: '   ',
    actor: adminUser
  });
  assert.equal(emptyReasonReject.success, false);
  assert.match(emptyReasonReject.error || '', /OBRIGATÓRIO preencher o motivo/);

  // Test valid approval -> debits central stock
  const prevCentralStock = targetMat.currentStock;
  const approveRes = StorageService.reviewGUERequest({
    requestId: req.id,
    action: 'APROVAR',
    actor: adminUser
  });
  assert.equal(approveRes.success, true);

  const updatedMat = StorageService.getMaterials().find(m => m.id === targetMat.id);
  assert.equal(updatedMat?.currentStock, prevCentralStock - 10);
});

test('Audit Trail: Logs CRUD operations with timestamps', () => {
  StorageService.init();
  const logsBefore = StorageService.getAuditLogs().length;

  StorageService.logAudit({
    actor: adminUser,
    crudType: 'ELIMINAR',
    module: 'ESTOQUE',
    resourceId: 'TEST-SKU-99',
    actionName: 'EXCLUSAO_ITEM_TESTE',
    details: 'Exclusão de item de teste para verificação de auditoria.',
    metadata: { test: true }
  });

  const logsAfter = StorageService.getAuditLogs();
  assert.equal(logsAfter.length, logsBefore + 1);
  const latest = logsAfter[0];
  assert.equal(latest.crudType, 'ELIMINAR');
  assert.equal(latest.resourceId, 'TEST-SKU-99');
  assert.equal(latest.userEmail, adminUser.email);
  assert.ok(latest.formattedDate.length > 10);
});
