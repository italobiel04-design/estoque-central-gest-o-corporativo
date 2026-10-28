/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  X,
  TrendingUp,
  FileDown,
  Download,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  ArrowUpDown,
  ShoppingCart
} from 'lucide-react';
import { MaterialItem, InventoryMovement, UserProfile } from '../types';
import { performABCAnalysis, ABCClass, StockRiskLevel } from '../utils/abcAnalysis';
import { exportABCAnalysisPDF } from '../utils/pdfGenerator';
import { StorageService } from '../services/storage';

interface ABCAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  materials: MaterialItem[];
  movements: InventoryMovement[];
  currentUser: UserProfile;
}

export const ABCAnalysisModal: React.FC<ABCAnalysisModalProps> = ({
  isOpen,
  onClose,
  materials,
  movements,
  currentUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState<'ALL' | ABCClass>('ALL');
  const [filterRisk, setFilterRisk] = useState<'ALL' | StockRiskLevel>('ALL');
  const [daysWindow, setDaysWindow] = useState<number>(30);

  // Perform pure Pareto calculation
  const analysis = useMemo(() => {
    return performABCAnalysis(materials, movements, daysWindow);
  }, [materials, movements, daysWindow]);

  // Filtered items for the UI table
  const filteredItems = useMemo(() => {
    return analysis.items.filter(item => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesClass = filterClass === 'ALL' || item.abcClass === filterClass;
      const matchesRisk = filterRisk === 'ALL' || item.riskLevel === filterRisk;

      return matchesSearch && matchesClass && matchesRisk;
    });
  }, [analysis.items, searchTerm, filterClass, filterRisk]);

  if (!isOpen) return null;

  const handleExportPDF = () => {
    StorageService.logAudit({
      actor: currentUser,
      crudType: 'LER',
      module: 'ESTOQUE',
      actionName: 'EXPORTACAO_CURVA_ABC_PDF',
      details: 'Exportação executiva da Matriz Curva ABC e Previsão de Autonomia em PDF.'
    });

    exportABCAnalysisPDF({
      analysis,
      currentUser
    });
  };

  const handleExportCSV = () => {
    StorageService.logAudit({
      actor: currentUser,
      crudType: 'LER',
      module: 'ESTOQUE',
      actionName: 'EXPORTACAO_CURVA_ABC_CSV',
      details: 'Exportação tabular da Matriz Curva ABC e Previsão de Autonomia em formato CSV.'
    });

    const headers = [
      'Rank',
      'Classe_ABC',
      'Codigo',
      'Material',
      'Categoria',
      'Estoque_Atual',
      'Estoque_Minimo',
      'Unidade',
      'Preco_Unitario_BRL',
      'Valor_Total_BRL',
      'Pct_Valor',
      'Pct_Acumulado',
      'Consumo_Diario_Medio',
      'Dias_Autonomia',
      'Nivel_Risco',
      'Sugestao_Reabastecimento'
    ];

    const rows = analysis.items.map(i => [
      i.rank,
      i.abcClass,
      i.code,
      `"${i.name.replace(/"/g, '""')}"`,
      `"${i.category.replace(/"/g, '""')}"`,
      i.currentStock,
      i.minimumStock,
      i.unit,
      i.unitPrice.toFixed(2),
      i.totalValuation.toFixed(2),
      `${i.valuePercentage}%`,
      `${i.accumulatedPercentage}%`,
      i.dailyConsumption,
      i.daysOfRunway >= 999 ? 'Sem giro' : i.daysOfRunway,
      i.riskLevel,
      i.suggestedReorderQty
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Curva_ABC_Estoque_${new Date().toISOString().substring(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header - Corporate Navy & Red Accent */}
        <div className="bg-slate-900 border-b-2 border-red-600 px-6 py-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-white">
                  Inteligência Logística: Matriz Curva ABC (Pareto) & Autonomia
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-600 text-white">
                  Hospitalar
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Segmentação financeira 80/15/5, giro médio diário e previsão preditiva de desabastecimento
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow transition"
              title="Gerar PDF executivo"
            >
              <FileDown className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar PDF</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition border border-slate-700"
              title="Exportar planilha CSV"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition ml-2"
              aria-label="Fechar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Total Imobilizado */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Total em Estoque
              </span>
              <div className="my-1">
                <span className="text-xl font-black text-slate-900">
                  R$ {analysis.totalStockValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                {analysis.totalItemsQuantity.toLocaleString('pt-BR')} itens ({analysis.items.length} SKUs)
              </span>
            </div>

            {/* Classe A Card */}
            <div 
              onClick={() => { setFilterClass('A'); setFilterRisk('ALL'); }}
              className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                filterClass === 'A' 
                  ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20' 
                  : 'bg-white border-slate-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  Classe A (Críticos)
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-black">
                  {analysis.classA.percentValue}% R$
                </span>
              </div>
              <div className="my-1">
                <span className="text-xl font-black text-blue-900">
                  {analysis.classA.count} <span className="text-xs font-normal text-slate-500">itens</span>
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                R$ {analysis.classA.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })} ({analysis.classA.percentItems}% dos SKUs)
              </span>
            </div>

            {/* Classe B Card */}
            <div 
              onClick={() => { setFilterClass('B'); setFilterRisk('ALL'); }}
              className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                filterClass === 'B' 
                  ? 'bg-teal-50/80 border-teal-500 ring-2 ring-teal-500/20' 
                  : 'bg-white border-slate-200 hover:border-teal-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                  Classe B (Médios)
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 font-black">
                  {analysis.classB.percentValue}% R$
                </span>
              </div>
              <div className="my-1">
                <span className="text-xl font-black text-teal-900">
                  {analysis.classB.count} <span className="text-xs font-normal text-slate-500">itens</span>
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                R$ {analysis.classB.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
              </span>
            </div>

            {/* Classe C Card */}
            <div 
              onClick={() => { setFilterClass('C'); setFilterRisk('ALL'); }}
              className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                filterClass === 'C' 
                  ? 'bg-slate-100 border-slate-500 ring-2 ring-slate-500/20' 
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  Classe C (Cauda)
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-black">
                  {analysis.classC.percentValue}% R$
                </span>
              </div>
              <div className="my-1">
                <span className="text-xl font-black text-slate-800">
                  {analysis.classC.count} <span className="text-xs font-normal text-slate-500">itens</span>
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                R$ {analysis.classC.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })} ({analysis.classC.percentItems}% dos SKUs)
              </span>
            </div>

            {/* Risco Crítico Card */}
            <div 
              onClick={() => { setFilterRisk('CRITICO'); setFilterClass('ALL'); }}
              className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                filterRisk === 'CRITICO' 
                  ? 'bg-red-50/80 border-red-600 ring-2 ring-red-600/20' 
                  : 'bg-white border-slate-200 hover:border-red-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Ruptura Iminente
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-black">
                  &lt; 5 dias
                </span>
              </div>
              <div className="my-1">
                <span className="text-xl font-black text-red-600">
                  {analysis.riskCriticalCount} <span className="text-xs font-normal text-slate-500">itens</span>
                </span>
              </div>
              <span className="text-[11px] text-red-500 font-semibold">
                Requer pedido urgente
              </span>
            </div>
          </div>

          {/* Pareto Distribution Visual Progress Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                Distribuição de Capital Acumulado no Inventário (Pareto)
              </span>
              <span className="text-xs text-slate-500">
                Classe A: 80% do valor | Classe B: 15% | Classe C: 5%
              </span>
            </div>

            <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
              <div 
                style={{ width: `${analysis.classA.percentValue}%` }} 
                className="bg-blue-600 h-full transition-all duration-500 relative group cursor-pointer"
                title={`Classe A: ${analysis.classA.percentValue}% do valor`}
              />
              <div 
                style={{ width: `${analysis.classB.percentValue}%` }} 
                className="bg-teal-500 h-full transition-all duration-500 relative group cursor-pointer"
                title={`Classe B: ${analysis.classB.percentValue}% do valor`}
              />
              <div 
                style={{ width: `${analysis.classC.percentValue}%` }} 
                className="bg-slate-400 h-full transition-all duration-500 relative group cursor-pointer"
                title={`Classe C: ${analysis.classC.percentValue}% do valor`}
              />
            </div>
          </div>

          {/* Filter Bar & Controls */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => { setFilterClass('ALL'); setFilterRisk('ALL'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filterClass === 'ALL' && filterRisk === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos ({analysis.items.length})
              </button>

              <button
                onClick={() => { setFilterClass('A'); setFilterRisk('ALL'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  filterClass === 'A'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Classe A ({analysis.classA.count})
              </button>

              <button
                onClick={() => { setFilterClass('B'); setFilterRisk('ALL'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  filterClass === 'B'
                    ? 'bg-teal-600 text-white'
                    : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                Classe B ({analysis.classB.count})
              </button>

              <button
                onClick={() => { setFilterClass('C'); setFilterRisk('ALL'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  filterClass === 'C'
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                Classe C ({analysis.classC.count})
              </button>

              <button
                onClick={() => { setFilterRisk('CRITICO'); setFilterClass('ALL'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  filterRisk === 'CRITICO'
                    ? 'bg-red-600 text-white'
                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Risco Ruptura ({analysis.riskCriticalCount})
              </button>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtrar por código ou nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
                <Clock className="w-3.5 h-3.5" />
                <select
                  value={daysWindow}
                  onChange={(e) => setDaysWindow(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
                  title="Janela histórica para cálculo do consumo diário"
                >
                  <option value={7}>Últimos 7 dias</option>
                  <option value={15}>Últimos 15 dias</option>
                  <option value={30}>Últimos 30 dias</option>
                  <option value={60}>Últimos 60 dias</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3 w-14 text-center">Rank</th>
                    <th className="py-3 px-3 w-20">Classe</th>
                    <th className="py-3 px-3">Código</th>
                    <th className="py-3 px-4">Material / Categoria</th>
                    <th className="py-3 px-3 text-right">Saldo Atual</th>
                    <th className="py-3 px-3 text-right">Consumo Médio</th>
                    <th className="py-3 px-3 text-center">Autonomia</th>
                    <th className="py-3 px-3 text-center">Nível Risco</th>
                    <th className="py-3 px-3 text-right">Sugestão Compra</th>
                    <th className="py-3 px-4 text-right">Valor Total (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        Nenhum item corresponde aos filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr 
                        key={item.id} 
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="py-3 px-3 text-center font-bold text-slate-400">
                          #{item.rank}
                        </td>

                        {/* Classe Pill */}
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded font-black text-[11px] ${
                            item.abcClass === 'A'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : item.abcClass === 'B'
                              ? 'bg-teal-100 text-teal-800 border border-teal-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            Classe {item.abcClass}
                          </span>
                        </td>

                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          {item.code}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{item.name}</div>
                          <div className="text-[10px] text-slate-500">{item.category} • {item.shelfLocation}</div>
                        </td>

                        <td className="py-3 px-3 text-right font-semibold">
                          <span className={item.currentStock <= item.minimumStock ? 'text-red-600 font-bold' : 'text-slate-900'}>
                            {item.currentStock} {item.unit}
                          </span>
                          <div className="text-[10px] text-slate-400">Mín: {item.minimumStock}</div>
                        </td>

                        <td className="py-3 px-3 text-right font-medium text-slate-700">
                          {item.dailyConsumption > 0 ? (
                            <>
                              <div>{item.dailyConsumption} {item.unit}/dia</div>
                              <div className="text-[10px] text-slate-400">({item.totalOutflow} em {daysWindow}d)</div>
                            </>
                          ) : (
                            <span className="text-slate-400">Sem saídas</span>
                          )}
                        </td>

                        {/* Autonomia */}
                        <td className="py-3 px-3 text-center">
                          {item.daysOfRunway >= 999 ? (
                            <span className="text-slate-400 font-medium">Sem giro</span>
                          ) : (
                            <span className={`font-bold ${
                              item.daysOfRunway <= 5 
                                ? 'text-red-600' 
                                : item.daysOfRunway <= 15 
                                ? 'text-amber-600' 
                                : 'text-emerald-700'
                            }`}>
                              {item.daysOfRunway} {item.daysOfRunway === 1 ? 'dia' : 'dias'}
                            </span>
                          )}
                        </td>

                        {/* Nível de Risco */}
                        <td className="py-3 px-3 text-center">
                          {item.riskLevel === 'CRITICO' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                              <AlertTriangle className="w-3 h-3 text-red-600" />
                              Ruptura
                            </span>
                          )}
                          {item.riskLevel === 'ATENCAO' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Reposição
                            </span>
                          )}
                          {item.riskLevel === 'SEGURO' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Seguro
                            </span>
                          )}
                          {item.riskLevel === 'SEM_GIRO' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                              Estável
                            </span>
                          )}
                        </td>

                        {/* Sugestão de Compra */}
                        <td className="py-3 px-3 text-right">
                          {item.suggestedReorderQty > 0 ? (
                            <span className="inline-flex items-center gap-1 font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded text-[11px]">
                              <ShoppingCart className="w-3 h-3" />
                              +{item.suggestedReorderQty} {item.unit}
                            </span>
                          ) : (
                            <span className="text-emerald-600 text-[11px] font-medium">Abastecido</span>
                          )}
                        </td>

                        {/* Valor Total */}
                        <td className="py-3 px-4 text-right">
                          <div className="font-bold text-slate-900">
                            R$ {item.totalValuation.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {item.valuePercentage}% do total
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer with counts */}
            <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span>
                Mostrando <strong>{filteredItems.length}</strong> de <strong>{analysis.items.length}</strong> itens analisados
              </span>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1 text-blue-700 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span> Classe A: 80% capital
                </span>
                <span className="flex items-center gap-1 text-teal-700 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-teal-500"></span> Classe B: 15% capital
                </span>
                <span className="flex items-center gap-1 text-slate-600 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span> Classe C: 5% capital
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
