/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MaterialItem, InventoryMovement } from '../types';

export type ABCClass = 'A' | 'B' | 'C';
export type StockRiskLevel = 'CRITICO' | 'ATENCAO' | 'SEGURO' | 'SEM_GIRO';

export interface EnrichedABCItem {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  unitPrice: number;
  shelfLocation: string;
  totalValuation: number;
  valuePercentage: number;
  accumulatedPercentage: number;
  abcClass: ABCClass;
  rank: number;
  totalOutflow: number;
  dailyConsumption: number;
  daysOfRunway: number; // dias até esgotar
  riskLevel: StockRiskLevel;
  suggestedReorderQty: number;
}

export interface ClassSummary {
  count: number;
  totalValue: number;
  percentValue: number;
  percentItems: number;
}

export interface ABCAnalysisResult {
  items: EnrichedABCItem[];
  totalStockValue: number;
  totalItemsQuantity: number;
  classA: ClassSummary;
  classB: ClassSummary;
  classC: ClassSummary;
  riskCriticalCount: number; // < 5 dias ou estoque zero
  riskWarningCount: number;  // < 15 dias
  riskSafeCount: number;     // >= 15 dias
  stagnantCount: number;     // sem saídas
}

/**
 * Calculates consumption metrics based on historical movements.
 * Default evaluation period: 30 days.
 */
export function calculateConsumptionMetrics(
  item: MaterialItem,
  movements: InventoryMovement[],
  daysWindow: number = 30
): {
  totalOutflow: number;
  dailyConsumption: number;
  daysOfRunway: number;
  riskLevel: StockRiskLevel;
  suggestedReorderQty: number;
} {
  const windowMillis = Math.max(1, daysWindow) * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const cutoffTimestamp = now - windowMillis;

  // Filter exits & GUE transfers for this item within the window
  const outflows = movements.filter(m => {
    if (m.itemId !== item.id && m.itemCode !== item.code) return false;
    if (m.type !== 'SAIDA' && m.type !== 'TRANSFERENCIA_GUE') return false;
    const movementTime = m.timestamp || new Date(m.date).getTime();
    return movementTime >= cutoffTimestamp;
  });

  const totalOutflow = outflows.reduce((acc, m) => acc + (Number(m.quantity) || 0), 0);
  const dailyConsumption = totalOutflow > 0 ? Number((totalOutflow / daysWindow).toFixed(2)) : 0;

  let daysOfRunway = 999;
  let riskLevel: StockRiskLevel = 'SEGURO';

  if (item.currentStock <= 0) {
    daysOfRunway = 0;
    riskLevel = 'CRITICO';
  } else if (dailyConsumption > 0) {
    daysOfRunway = Math.round(item.currentStock / dailyConsumption);
    if (daysOfRunway <= 5 || item.currentStock <= item.minimumStock) {
      riskLevel = 'CRITICO';
    } else if (daysOfRunway <= 15) {
      riskLevel = 'ATENCAO';
    } else {
      riskLevel = 'SEGURO';
    }
  } else {
    // Zero consumption registered in this window
    if (item.currentStock <= item.minimumStock) {
      riskLevel = 'ATENCAO';
    } else {
      riskLevel = 'SEM_GIRO';
    }
  }

  // Suggest reorder quantity to reach safety buffer (30 days of consumption or 2x minimum stock)
  let targetStock = Math.max(item.minimumStock * 2, Math.round(dailyConsumption * 30));
  if (targetStock === 0) targetStock = item.minimumStock || 50;
  const suggestedReorderQty = Math.max(0, targetStock - item.currentStock);

  return {
    totalOutflow,
    dailyConsumption,
    daysOfRunway,
    riskLevel,
    suggestedReorderQty
  };
}

/**
 * Performs complete Pareto / ABC Analysis for all inventory items.
 * Class A: Cumulative investment up to 80%
 * Class B: Cumulative investment between 80% and 95%
 * Class C: Cumulative investment > 95%
 */
export function performABCAnalysis(
  materials: MaterialItem[],
  movements: InventoryMovement[] = [],
  daysWindow: number = 30
): ABCAnalysisResult {
  if (!materials || materials.length === 0) {
    const emptyClass: ClassSummary = { count: 0, totalValue: 0, percentValue: 0, percentItems: 0 };
    return {
      items: [],
      totalStockValue: 0,
      totalItemsQuantity: 0,
      classA: { ...emptyClass },
      classB: { ...emptyClass },
      classC: { ...emptyClass },
      riskCriticalCount: 0,
      riskWarningCount: 0,
      riskSafeCount: 0,
      stagnantCount: 0
    };
  }

  // 1. Calculate individual valuation
  const valuedItems = materials.map(item => {
    const safeStock = Math.max(0, Number(item.currentStock) || 0);
    const safePrice = Math.max(0, Number(item.unitPrice) || 0);
    const totalValuation = Number((safeStock * safePrice).toFixed(2));
    const metrics = calculateConsumptionMetrics(item, movements, daysWindow);

    return {
      item,
      totalValuation,
      metrics
    };
  });

  // 2. Sort descending by total valuation
  valuedItems.sort((a, b) => b.totalValuation - a.totalValuation);

  const totalStockValue = Number(
    valuedItems.reduce((acc, curr) => acc + curr.totalValuation, 0).toFixed(2)
  );
  const totalItemsQuantity = materials.reduce((acc, m) => acc + (Number(m.currentStock) || 0), 0);

  let accumulatedValue = 0;
  let riskCriticalCount = 0;
  let riskWarningCount = 0;
  let riskSafeCount = 0;
  let stagnantCount = 0;

  // 3. Classify into A, B, C
  const enrichedItems: EnrichedABCItem[] = valuedItems.map((valItem, index) => {
    const { item, totalValuation, metrics } = valItem;
    const startAccumulatedPct = totalStockValue > 0 
      ? Number(((accumulatedValue / totalStockValue) * 100).toFixed(2)) 
      : 0;

    accumulatedValue += totalValuation;

    const valuePercentage = totalStockValue > 0 
      ? Number(((totalValuation / totalStockValue) * 100).toFixed(2)) 
      : 0;

    const accumulatedPercentage = totalStockValue > 0
      ? Number(((accumulatedValue / totalStockValue) * 100).toFixed(2))
      : 100;

    let abcClass: ABCClass = 'C';
    if (totalStockValue <= 0) {
      abcClass = 'C';
    } else if (index === 0 || startAccumulatedPct < 80) {
      abcClass = 'A';
    } else if (startAccumulatedPct < 95) {
      abcClass = 'B';
    } else {
      abcClass = 'C';
    }

    if (metrics.riskLevel === 'CRITICO') riskCriticalCount++;
    else if (metrics.riskLevel === 'ATENCAO') riskWarningCount++;
    else if (metrics.riskLevel === 'SEM_GIRO') stagnantCount++;
    else riskSafeCount++;

    return {
      id: item.id,
      code: item.code,
      name: item.name,
      category: item.category,
      unit: item.unit,
      currentStock: item.currentStock,
      minimumStock: item.minimumStock,
      unitPrice: item.unitPrice,
      shelfLocation: item.shelfLocation,
      totalValuation,
      valuePercentage,
      accumulatedPercentage: Math.min(100, accumulatedPercentage),
      abcClass,
      rank: index + 1,
      totalOutflow: metrics.totalOutflow,
      dailyConsumption: metrics.dailyConsumption,
      daysOfRunway: metrics.daysOfRunway,
      riskLevel: metrics.riskLevel,
      suggestedReorderQty: metrics.suggestedReorderQty
    };
  });

  // 4. Summaries by class
  const summarizeClass = (targetClass: ABCClass): ClassSummary => {
    const classItems = enrichedItems.filter(i => i.abcClass === targetClass);
    const count = classItems.length;
    const classTotalValue = Number(classItems.reduce((acc, i) => acc + i.totalValuation, 0).toFixed(2));
    const percentValue = totalStockValue > 0 ? Number(((classTotalValue / totalStockValue) * 100).toFixed(1)) : 0;
    const percentItems = materials.length > 0 ? Number(((count / materials.length) * 100).toFixed(1)) : 0;

    return {
      count,
      totalValue: classTotalValue,
      percentValue,
      percentItems
    };
  };

  return {
    items: enrichedItems,
    totalStockValue,
    totalItemsQuantity,
    classA: summarizeClass('A'),
    classB: summarizeClass('B'),
    classC: summarizeClass('C'),
    riskCriticalCount,
    riskWarningCount,
    riskSafeCount,
    stagnantCount
  };
}
