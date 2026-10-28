/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Package,
  AlertTriangle,
  Wrench,
  Shirt,
  Building2,
  FileDown,
  TrendingDown,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import {
  MaterialItem,
  MachineEquipment,
  ServiceOrderOS,
  LaundryRecord,
  ExternalUnitGUE,
  GUERequest,
  UserProfile,
  InventoryMovement
} from '../types';
import { exportGeneralInventoryPDF } from '../utils/pdfGenerator';
import { StorageService } from '../services/storage';

interface DashboardViewProps {
  materials: MaterialItem[];
  machines: MachineEquipment[];
  osList: ServiceOrderOS[];
  laundryRecords: LaundryRecord[];
  gues: ExternalUnitGUE[];
  gueRequests: GUERequest[];
  movements: InventoryMovement[];
  currentUser: UserProfile;
  minThreshold: number;
  onNavigateTab: (tab: any) => void;
  onOpenScanner: () => void;
  onOpenABCAnalysis?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  materials,
  machines,
  osList,
  laundryRecords,
  gues,
  gueRequests,
  movements,
  currentUser,
  minThreshold,
  onNavigateTab,
  onOpenScanner,
  onOpenABCAnalysis
}) => {
  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [tempThreshold, setTempThreshold] = useState(minThreshold);

  // Compute metrics
  const criticalMaterials = materials.filter(m => m.currentStock <= minThreshold);
  const totalStockValue = materials.reduce((acc, m) => acc + (m.currentStock * m.unitPrice), 0);
  const totalItemsCount = materials.reduce((acc, m) => acc + m.currentStock, 0);

  const machinesInUse = machines.filter(m => m.status === 'EM_USO').length;
  const machinesAvailable = machines.filter(m => m.status === 'DISPONIVEL').length;
  const machinesDefective = machines.filter(m => m.operationalCondition === 'COM_DEFEITO' || m.status === 'MANUTENCAO_OS').length;

  const pendingLaundryDiscrepancies = laundryRecords.filter(l => l.status === 'PECA_PENDENTE');
  const pendingGUERequests = gueRequests.filter(r => r.status === 'PENDENTE_APROVACAO');

  // Calculate movements today
  const todayStr = new Date().toISOString().substring(0, 10);
  const todayEntradas = movements
    .filter(m => m.type === 'ENTRADA' && m.date.startsWith(todayStr))
    .reduce((sum, m) => sum + m.quantity, 0);
  const todaySaidas = movements
    .filter(m => (m.type === 'SAIDA' || m.type === 'TRANSFERENCIA_GUE') && m.date.startsWith(todayStr))
    .reduce((sum, m) => sum + m.quantity, 0);

  const handleExportPDF = () => {
    StorageService.logAudit({
      actor: currentUser,
      crudType: 'LER',
      module: 'ESTOQUE',
      actionName: 'EXPORTACAO_RELATORIO_PDF',
      details: 'Exportação executiva do Relatório Geral de Estoque Central em PDF.'
    });
    exportGeneralInventoryPDF({
      materials,
      machines,
      osList,
      laundryRecords,
      currentUser,
      minThreshold
    });
  };

  const handleExportCSV = () => {
    StorageService.logAudit({
      actor: currentUser,
      crudType: 'LER',
      module: 'ESTOQUE',
      actionName: 'EXPORTACAO_PLANILHA_CSV',
      details: 'Exportação tabular de dados de estoque em formato CSV.'
    });

    const headers = ['Codigo', 'Nome', 'Categoria', 'Saldo_Atual', 'Limite_Minimo', 'Localizacao', 'Preco_Unitario_BRL'];
    const rows = materials.map(m => [
      m.code,
      `"${m.name.replace(/"/g, '""')}"`,
      m.category,
      m.currentStock,
      m.minimumStock,
      m.shelfLocation,
      m.unitPrice.toFixed(2)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Estoque_Central_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveThreshold = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempThreshold > 0) {
      StorageService.setMinimumStockThreshold(tempThreshold, currentUser);
      setShowThresholdModal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome & Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Central do Gestor de Estoque</h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
              PAINEL EM TEMPO REAL
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Monitoramento de insumos de missão crítica, controle de máquinas, ordens de serviço e lavanderia hospitalar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowThresholdModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold transition"
            title="Ajustar limite de estoque mínimo padrão"
          >
            <Settings className="w-3.5 h-3.5 text-slate-600" />
            <span>Limite Mínimo ({minThreshold} un)</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold transition"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-600" />
            <span>Planilha CSV</span>
          </button>

          {onOpenABCAnalysis && (
            <button
              onClick={onOpenABCAnalysis}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition active:scale-95"
              title="Abrir Análise de Curva ABC (Pareto) e Projeção de Autonomia"
            >
              <TrendingUp className="w-3.5 h-3.5 text-blue-200" />
              <span>Curva ABC & Autonomia</span>
            </button>
          )}

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-md transition active:scale-95"
          >
            <FileDown className="w-4 h-4 text-red-400" />
            <span>Exportar Relatório em PDF</span>
          </button>
        </div>
      </div>

      {/* CRITICAL ALERTS BANNER (If any critical condition exists) */}
      {(criticalMaterials.length > 0 || pendingLaundryDiscrepancies.length > 0 || machinesDefective > 0 || pendingGUERequests.length > 0) && (
        <div className="rounded-2xl bg-red-50 border-2 border-red-500 p-5 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-red-600 animate-ping"></span>
              <h2 className="text-sm font-black text-red-900 tracking-wide uppercase flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Alertas Corporativos Imediatos de Estoque & Operações
              </h2>
            </div>
            <span className="text-xs font-bold text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full border border-red-300">
              Ação Requerida
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Critical Stock Alert Card */}
            {criticalMaterials.length > 0 && (
              <div
                onClick={() => onNavigateTab('inventory')}
                className="cursor-pointer bg-white p-3.5 rounded-xl border border-red-300 shadow-xs hover:border-red-500 transition group"
              >
                <div className="flex items-center justify-between font-bold text-red-700 mb-1">
                  <span>Estoque Mínimo Atingido</span>
                  <span className="px-1.5 py-0.5 bg-red-600 text-white rounded text-[10px]">{criticalMaterials.length} itens</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-tight">
                  {criticalMaterials.slice(0, 2).map(m => m.name).join(', ')}
                  {criticalMaterials.length > 2 && ` e mais ${criticalMaterials.length - 2}...`}
                </p>
                <div className="mt-2 text-[10px] font-bold text-red-600 group-hover:underline flex items-center gap-1">
                  Ver itens e repor agora <ArrowUpRight className="w-3 h-3" />
                </div>
              </div>
            )}

            {/* Laundry Missing Pieces Discrepancy */}
            {pendingLaundryDiscrepancies.length > 0 && (
              <div
                onClick={() => onNavigateTab('laundry')}
                className="cursor-pointer bg-white p-3.5 rounded-xl border border-red-300 shadow-xs hover:border-red-500 transition group"
              >
                <div className="flex items-center justify-between font-bold text-red-700 mb-1">
                  <span>Peça Pendente Lavanderia</span>
                  <span className="px-1.5 py-0.5 bg-red-600 text-white rounded text-[10px]">
                    {pendingLaundryDiscrepancies.reduce((a, b) => a + (b.pendingQty || 0), 0)} faltantes
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-tight">
                  Discrepância na conferência de devolução do enxoval. Notificação imediata aberta.
                </p>
                <div className="mt-2 text-[10px] font-bold text-red-600 group-hover:underline flex items-center gap-1">
                  Auditar retorno lavanderia <ArrowUpRight className="w-3 h-3" />
                </div>
              </div>
            )}

            {/* Defective Machines & OS Alert */}
            {machinesDefective > 0 && (
              <div
                onClick={() => onNavigateTab('machines')}
                className="cursor-pointer bg-white p-3.5 rounded-xl border border-red-300 shadow-xs hover:border-red-500 transition group"
              >
                <div className="flex items-center justify-between font-bold text-red-700 mb-1">
                  <span>Máquinas c/ Avaria / OS</span>
                  <span className="px-1.5 py-0.5 bg-red-600 text-white rounded text-[10px]">{machinesDefective} bloqueadas</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-tight">
                  Equipamentos retirados de circulação sob Ordem de Serviço corretiva obrigatória.
                </p>
                <div className="mt-2 text-[10px] font-bold text-red-600 group-hover:underline flex items-center gap-1">
                  Acompanhar manutenção <ArrowUpRight className="w-3 h-3" />
                </div>
              </div>
            )}

            {/* GUE Approvals Pending */}
            {pendingGUERequests.length > 0 && (
              <div
                onClick={() => onNavigateTab('gue')}
                className="cursor-pointer bg-white p-3.5 rounded-xl border border-amber-300 shadow-xs hover:border-amber-500 transition group"
              >
                <div className="flex items-center justify-between font-bold text-amber-700 mb-1">
                  <span>Aprovação GUE Pendente</span>
                  <span className="px-1.5 py-0.5 bg-amber-500 text-white rounded text-[10px]">{pendingGUERequests.length} pedidos</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-tight">
                  Solicitações de envio de material para Unidades Externas aguardando deferimento do ADM.
                </p>
                <div className="mt-2 text-[10px] font-bold text-amber-700 group-hover:underline flex items-center gap-1">
                  Analisar e aprovar <ArrowUpRight className="w-3 h-3" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Stock Items */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total de Itens</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{totalItemsCount.toLocaleString('pt-BR')}</div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="font-semibold text-slate-700">{materials.length}</span> SKUs cadastrados
          </div>
        </div>

        {/* Stock Valuation */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Patrimônio em Estoque</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            R$ {totalStockValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 100% inventariado
          </div>
        </div>

        {/* Machine Status */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Parque de Máquinas</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{machines.length} ativas</div>
          <div className="mt-2 flex items-center gap-2 text-[10px]">
            <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">{machinesAvailable} Disp.</span>
            <span className="text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded">{machinesInUse} Em uso</span>
            {machinesDefective > 0 && (
              <span className="text-red-700 font-bold bg-red-50 px-1.5 py-0.5 rounded">{machinesDefective} Avaria</span>
            )}
          </div>
        </div>

        {/* Movements Today */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Movimentações Hoje</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-3">
            <div>
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-0.5">
                <ArrowDownRight className="w-3.5 h-3.5" /> Entradas
              </span>
              <span className="text-lg font-black text-slate-900">+{todayEntradas}</span>
            </div>
            <div className="border-l border-slate-200 pl-3">
              <span className="text-xs text-red-600 font-bold flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" /> Saídas
              </span>
              <span className="text-lg font-black text-slate-900">-{todaySaidas}</span>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-slate-400">Total movimentado em {todayStr}</div>
        </div>
      </div>

      {/* GRAPHICAL CHARTS & LOGISTICS FLOW SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Flow Chart: Entradas vs Saídas */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight">Fluxo de Materiais & Consumo Diário</h3>
              <p className="text-[11px] text-slate-500">Histórico de entradas de fornecedores versus saídas operacionais</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-blue-900">
                <span className="w-3 h-3 rounded-sm bg-blue-800"></span> Entradas
              </span>
              <span className="flex items-center gap-1.5 text-red-600">
                <span className="w-3 h-3 rounded-sm bg-red-600"></span> Saídas
              </span>
            </div>
          </div>

          {/* Clean SVG Interactive Bar Chart */}
          <div className="h-56 w-full flex items-end gap-3 sm:gap-6 pt-6 pb-2 px-2 border-b border-slate-100">
            {[
              { day: 'Seg', in: 120, out: 85 },
              { day: 'Ter', in: 60, out: 95 },
              { day: 'Qua', in: 140, out: 110 },
              { day: 'Qui', in: 40, out: 70 },
              { day: 'Sex', in: 180, out: 130 },
              { day: 'Sáb', in: 30, out: 45 },
              { day: 'Hoje', in: Math.max(todayEntradas, 35), out: Math.max(todaySaidas, 40) }
            ].map((col, i) => {
              const maxVal = 200;
              const inHeight = Math.min((col.in / maxVal) * 100, 100);
              const outHeight = Math.min((col.out / maxVal) * 100, 100);

              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <div className="w-full flex items-end justify-center gap-1.5 h-44">
                    {/* Blue bar: Entrada */}
                    <div
                      style={{ height: `${inHeight}%` }}
                      className="w-1/2 bg-blue-900 rounded-t-md hover:bg-blue-700 transition relative group-hover:scale-y-105 origin-bottom"
                      title={`Entrada ${col.day}: ${col.in} un`}
                    ></div>
                    {/* Red bar: Saída */}
                    <div
                      style={{ height: `${outHeight}%` }}
                      className="w-1/2 bg-red-600 rounded-t-md hover:bg-red-500 transition relative group-hover:scale-y-105 origin-bottom"
                      title={`Saída ${col.day}: ${col.out} un`}
                    ></div>
                  </div>
                  <span className="text-[11px] font-bold text-slate-600">{col.day}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>Média diária: 105 unidades movimentadas</span>
            <span className="font-semibold text-blue-900">Capacidade de Estocagem: 84% Ocupada</span>
          </div>
        </div>

        {/* Category Breakdown & Machine Health Gauge */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight">Distribuição por Categoria</h3>
            <p className="text-[11px] text-slate-500">Volume de estoque por segmento hospitalar</p>
          </div>

          <div className="space-y-3">
            {[
              { cat: 'Insumos Hospitalares', count: 220, color: 'bg-blue-900', pct: 40 },
              { cat: 'EPIs e Segurança', count: 212, color: 'bg-blue-600', pct: 36 },
              { cat: 'Higienização e Limpeza', count: 142, color: 'bg-emerald-600', pct: 24 },
              { cat: 'Enxoval e Rouparia', count: 84, color: 'bg-red-600', pct: 15 },
              { cat: 'Manutenção e Peças', count: 64, color: 'bg-amber-600', pct: 11 },
            ].map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span className="truncate">{item.cat}</span>
                  <span className="font-mono text-slate-900 font-bold">{item.count} un</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }}></div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-slate-800">Prateleiras Catalogadas</p>
              <p className="text-[10px] text-slate-500">Etiquetas com QR Code impressas</p>
            </div>
            <button
              onClick={onOpenScanner}
              className="px-2.5 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-[11px] font-bold transition"
            >
              Leitor Câmera
            </button>
          </div>
        </div>
      </div>

      {/* QUICK TABLE: CRITICAL MATERIALS REQUIRING ATTENTION */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <h3 className="font-bold text-sm text-slate-900">
              Itens em Nível Crítico (Saldo menor ou igual a {minThreshold} unidades)
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab('inventory')}
            className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1"
          >
            Ver Todo o Estoque <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 uppercase font-semibold text-[10px]">
              <tr>
                <th className="px-5 py-3">Código</th>
                <th className="px-5 py-3">Material</th>
                <th className="px-5 py-3">Categoria</th>
                <th className="px-5 py-3">Localização</th>
                <th className="px-5 py-3 text-right">Saldo Atual</th>
                <th className="px-5 py-3 text-right">Limite Mínimo</th>
                <th className="px-5 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {criticalMaterials.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-6 text-center text-slate-500">
                    Nenhum item com estoque crítico no momento! Todos os materiais estão acima do limite.
                  </td>
                </tr>
              ) : (
                criticalMaterials.map((item) => (
                  <tr key={item.id} className="hover:bg-red-50/40 transition">
                    <td className="px-5 py-3 font-mono font-bold text-red-700">{item.code}</td>
                    <td className="px-5 py-3 font-medium text-slate-900">{item.name}</td>
                    <td className="px-5 py-3 text-slate-600">{item.category}</td>
                    <td className="px-5 py-3 font-mono text-slate-600">
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {item.shelfLocation}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-black text-red-600 font-mono text-sm">
                      {item.currentStock} {item.unit}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-slate-500">
                      {item.minimumStock}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
                        Crítico
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Minimum Stock Threshold Modal */}
      {showThresholdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-base text-blue-900 mb-2 flex items-center gap-2">
              <Settings className="w-5 h-5 text-red-600" />
              Configurar Estoque Mínimo Padrão
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              O sistema sinaliza automaticamente alertas visuais imediatos e notificações ao gestor sempre que um material atingir ou ficar abaixo deste limite (padrão corporativo: 50 unidades).
            </p>
            <form onSubmit={handleSaveThreshold} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Limite em Unidades</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={tempThreshold}
                  onChange={(e) => setTempThreshold(parseInt(e.target.value, 10) || 50)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold font-mono focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowThresholdModal(false)}
                  className="flex-1 py-2 text-xs font-semibold border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition"
                >
                  Salvar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
