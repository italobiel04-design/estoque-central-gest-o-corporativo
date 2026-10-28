/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  FileCheck2,
  Filter,
  Search,
  Calendar,
  User,
  ShieldAlert,
  FileDown,
  Eye,
  CheckCircle,
  XCircle,
  Trash2,
  PlusCircle,
  RefreshCw,
  X,
  Code2,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { AuditLogEntry, AuditCRUDType, AuditModule, UserProfile } from '../types';
import { exportAuditTrailPDF } from '../utils/pdfGenerator';
import { StorageService } from '../services/storage';

interface AuditViewProps {
  auditLogs: AuditLogEntry[];
  users: UserProfile[];
  currentUser: UserProfile;
}

export const AuditView: React.FC<AuditViewProps> = ({ auditLogs, users, currentUser }) => {
  // Filters
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>('TODOS');
  const [selectedCRUD, setSelectedCRUD] = useState<string>('TODOS');
  const [selectedModule, setSelectedModule] = useState<string>('TODOS');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected entry for JSON inspector
  const [inspectingEntry, setInspectingEntry] = useState<AuditLogEntry | null>(null);

  // Filtered entries
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      // User filter
      if (selectedUserEmail !== 'TODOS' && log.userEmail !== selectedUserEmail) {
        return false;
      }
      // CRUD filter
      if (selectedCRUD !== 'TODOS' && log.crudType !== selectedCRUD) {
        return false;
      }
      // Module filter
      if (selectedModule !== 'TODOS' && log.module !== selectedModule) {
        return false;
      }
      // Date filter (formattedDate starts with DD/MM/YYYY)
      if (startDate || endDate) {
        const logDateObj = new Date(log.timestamp);
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (logDateObj < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (logDateObj > end) return false;
        }
      }
      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesText =
          log.details.toLowerCase().includes(q) ||
          log.userName.toLowerCase().includes(q) ||
          log.actionName.toLowerCase().includes(q) ||
          (log.resourceId && log.resourceId.toLowerCase().includes(q));
        if (!matchesText) return false;
      }

      return true;
    });
  }, [auditLogs, selectedUserEmail, selectedCRUD, selectedModule, startDate, endDate, searchQuery]);

  // Aggregate stats
  const totalCount = auditLogs.length;
  const createCount = auditLogs.filter(l => l.crudType === 'CRIAR').length;
  const updateCount = auditLogs.filter(l => l.crudType === 'ATUALIZAR').length;
  const deleteCount = auditLogs.filter(l => l.crudType === 'ELIMINAR').length;
  const approvalCount = auditLogs.filter(l => l.crudType === 'APROVACAO').length;

  const handleExportPDF = () => {
    StorageService.logAudit({
      actor: currentUser,
      crudType: 'LER',
      module: 'AUDITORIA',
      actionName: 'EXPORTACAO_AUDITORIA_PDF',
      details: `Exportação de Relatório de Auditoria e Conformidade (${filteredLogs.length} eventos).`
    });

    exportAuditTrailPDF({
      logs: filteredLogs,
      currentUser,
      filterUser: selectedUserEmail !== 'TODOS' ? selectedUserEmail : undefined,
      filterCRUD: selectedCRUD !== 'TODOS' ? selectedCRUD : undefined,
      filterModule: selectedModule !== 'TODOS' ? selectedModule : undefined
    });
  };

  const handleExportCSV = () => {
    StorageService.logAudit({
      actor: currentUser,
      crudType: 'LER',
      module: 'AUDITORIA',
      actionName: 'EXPORTACAO_AUDITORIA_CSV',
      details: `Exportação da trilha de auditoria para planilha CSV (${filteredLogs.length} eventos).`
    });

    const headers = ['Timestamp_Epoch', 'Data_Hora', 'Usuario_Nome', 'Usuario_Email', 'Perfil', 'Tipo_CRUD', 'Modulo', 'Recurso', 'Acao', 'Detalhes'];
    const rows = filteredLogs.map(l => [
      l.timestamp,
      `"${l.formattedDate}"`,
      `"${l.userName.replace(/"/g, '""')}"`,
      l.userEmail,
      l.userRole,
      l.crudType,
      l.module,
      `"${(l.resourceId || '').replace(/"/g, '""')}"`,
      l.actionName,
      `"${l.details.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Auditoria_Estoque_Central_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetFilters = () => {
    setSelectedUserEmail('TODOS');
    setSelectedCRUD('TODOS');
    setSelectedModule('TODOS');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
  };

  return (
    <div className="space-y-6">
      {/* Executive Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-emerald-600" />
              Módulo de Auditoria Abrangente & Trilha de Conformidade
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              CONFORMIDADE CORPORATIVA
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Registro imutável de todas as operações CRUD (Criar, Ler, Atualizar, Eliminar, Aprovações) com carimbo de tempo preciso para auditoria e resolução de disputas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold transition"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-600" />
            <span>Planilha CSV</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-md transition active:scale-95"
          >
            <FileDown className="w-4 h-4 text-red-400" />
            <span>Exportar Trilha em PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total de Eventos</span>
          <div className="text-xl font-black text-slate-900 mt-1 font-mono">{totalCount}</div>
          <span className="text-[10px] text-slate-500">100% catalogados</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Criações (CRIAR)</span>
          <div className="text-xl font-black text-emerald-700 mt-1 font-mono">+{createCount}</div>
          <span className="text-[10px] text-slate-500">Novos registros</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Atualizações (EDITAR)</span>
          <div className="text-xl font-black text-blue-700 mt-1 font-mono">{updateCount}</div>
          <span className="text-[10px] text-slate-500">Movimentações e edições</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Exclusões (ELIMINAR)</span>
          <div className="text-xl font-black text-red-600 mt-1 font-mono">-{deleteCount}</div>
          <span className="text-[10px] text-red-500 font-semibold">Itens removidos</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Aprovações / Julgamentos</span>
          <div className="text-xl font-black text-purple-700 mt-1 font-mono">{approvalCount}</div>
          <span className="text-[10px] text-slate-500">Decisões soberanas ADM</span>
        </div>
      </div>

      {/* Comprehensive Multi-Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Filter className="w-4 h-4 text-blue-900" />
            <span>Filtros de Auditoria & Conformidade Regulatória</span>
          </div>
          <button
            onClick={resetFilters}
            className="text-xs text-blue-700 hover:text-blue-900 font-semibold"
          >
            Limpar Todos os Filtros
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          {/* User Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Colaborador / ADM</label>
            <select
              value={selectedUserEmail}
              onChange={(e) => setSelectedUserEmail(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 bg-white font-medium text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            >
              <option value="TODOS">Todos os Utilizadores</option>
              {users.map((u) => (
                <option key={u.id} value={u.email}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {/* CRUD Operation Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo de Operação</label>
            <select
              value={selectedCRUD}
              onChange={(e) => setSelectedCRUD(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 bg-white font-bold text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            >
              <option value="TODOS">Todas as Operações CRUD</option>
              <option value="CRIAR">CRIAR (Inclusão / Cadastro)</option>
              <option value="LER">LER (Consulta / Exportação)</option>
              <option value="ATUALIZAR">ATUALIZAR (Edição / Movimento)</option>
              <option value="ELIMINAR">ELIMINAR (Exclusão Crítica)</option>
              <option value="APROVACAO">APROVAÇÃO (Deferimento/Recusa)</option>
              <option value="SISTEMA">SISTEMA (Login / Sessão)</option>
            </select>
          </div>

          {/* Module Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Módulo Alvo</label>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 bg-white font-medium text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            >
              <option value="TODOS">Todos os Módulos</option>
              <option value="ESTOQUE">Estoque & Materiais</option>
              <option value="LAVANDERIA">Central de Lavanderia</option>
              <option value="MAQUINAS">Máquinas & Equipamentos</option>
              <option value="ORDEM_SERVICO">Ordens de Serviço (OS)</option>
              <option value="GUE">Unidades Externas (GUE's)</option>
              <option value="EQUIPE">Gestão de Equipe</option>
              <option value="AUTENTICACAO">Autenticação & Sessão</option>
              <option value="AUDITORIA">Auditoria / Exportação</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Data Inicial</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Data Final</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
          </div>

          {/* Keyword Search */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Busca Textual</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="SKU, Doc, Motivo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Audit Trail Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">Trilha Auditada em Tempo Real</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 font-mono font-bold text-[10px]">
              {filteredLogs.length} de {auditLogs.length} eventos
            </span>
          </div>
          <span className="text-[11px] text-slate-500">Ordenado cronologicamente (mais recente primeiro)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-blue-900 text-white uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Carimbo de Data/Hora</th>
                <th className="px-5 py-3.5">Utilizador Responsável</th>
                <th className="px-5 py-3.5 text-center">Operação (CRUD)</th>
                <th className="px-5 py-3.5">Módulo Alvo</th>
                <th className="px-5 py-3.5">Recurso / Código</th>
                <th className="px-5 py-3.5">Detalhamento da Operação</th>
                <th className="px-5 py-3.5 text-center">Metadados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    Nenhum registro de auditoria coincide com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  let crudBadge = 'bg-slate-100 text-slate-800 border-slate-300';
                  if (log.crudType === 'CRIAR') crudBadge = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
                  if (log.crudType === 'ATUALIZAR') crudBadge = 'bg-blue-100 text-blue-800 border-blue-300 font-semibold';
                  if (log.crudType === 'ELIMINAR') crudBadge = 'bg-red-100 text-red-700 border-red-300 font-bold';
                  if (log.crudType === 'APROVACAO') crudBadge = 'bg-purple-100 text-purple-800 border-purple-300 font-bold';

                  return (
                    <tr key={log.id} className="hover:bg-blue-50/20 transition">
                      {/* Precise Timestamp */}
                      <td className="px-5 py-3.5 font-mono text-[11px] whitespace-nowrap text-slate-700">
                        <span className="font-bold text-slate-900 block">{log.formattedDate}</span>
                        <span className="text-[9px] text-slate-400">ID: {log.id}</span>
                      </td>

                      {/* User Profile */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[9px] text-white shrink-0 ${
                              log.userRole === 'ADM' ? 'bg-red-600' : 'bg-blue-800'
                            }`}
                          >
                            {log.userRole}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 block">{log.userName}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{log.userEmail}</span>
                          </div>
                        </div>
                      </td>

                      {/* CRUD Badge */}
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] border ${crudBadge}`}>
                          {log.crudType}
                        </span>
                      </td>

                      {/* Module */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="font-mono text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {log.module}
                        </span>
                      </td>

                      {/* Resource ID */}
                      <td className="px-5 py-3.5 font-mono text-xs font-bold text-blue-900 whitespace-nowrap">
                        {log.resourceId || '-'}
                      </td>

                      {/* Details */}
                      <td className="px-5 py-3.5 text-slate-800 text-xs leading-relaxed max-w-md">
                        {log.details}
                      </td>

                      {/* Inspector Action */}
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        <button
                          onClick={() => setInspectingEntry(log)}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-blue-900 hover:text-white text-slate-600 text-[10px] font-semibold transition flex items-center gap-1 mx-auto"
                          title="Inspecionar metadados JSON do evento"
                        >
                          <Code2 className="w-3 h-3" />
                          <span>JSON</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RAW JSON METADATA INSPECTION MODAL */}
      {inspectingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-blue-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Inspeção Forense de Metadados da Operação</h3>
              </div>
              <button onClick={() => setInspectingEntry(null)} className="text-white/80 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <p><strong>Evento:</strong> {inspectingEntry.actionName}</p>
                <p><strong>Timestamp:</strong> {inspectingEntry.formattedDate} (Epoch: {inspectingEntry.timestamp})</p>
                <p><strong>Responsável:</strong> {inspectingEntry.userName} ({inspectingEntry.userEmail})</p>
                <p><strong>Operação:</strong> {inspectingEntry.crudType} no módulo {inspectingEntry.module}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payload Estruturado (JSON)</label>
                <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-64 select-all">
                  {JSON.stringify(inspectingEntry, null, 2)}
                </pre>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setInspectingEntry(null)}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-md transition"
                >
                  Fechar Inspeção
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
