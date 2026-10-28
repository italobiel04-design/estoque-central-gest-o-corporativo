/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Wrench,
  AlertTriangle,
  CheckCircle,
  Plus,
  ArrowRight,
  RotateCcw,
  ShieldAlert,
  Clock,
  User,
  MapPin,
  Lock,
  Unlock,
  CheckCircle2,
  X,
  FileText,
  Hammer
} from 'lucide-react';
import { MachineEquipment, ServiceOrderOS, UserProfile } from '../types';
import { StorageService } from '../services/storage';

interface MachinesViewProps {
  machines: MachineEquipment[];
  osList: ServiceOrderOS[];
  currentUser: UserProfile;
  onOpenLabels: (code?: string) => void;
}

export const MachinesView: React.FC<MachinesViewProps> = ({
  machines,
  osList,
  currentUser,
  onOpenLabels
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'MACHINES' | 'SERVICE_ORDERS'>('MACHINES');

  // Checkout Modal
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<MachineEquipment | null>(null);
  const [assigneeName, setAssigneeName] = useState('');
  const [assigneeSector, setAssigneeSector] = useState('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Return Modal (Inspect condition: Bom estado vs Com defeito)
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnCondition, setReturnCondition] = useState<'BOM_ESTADO' | 'COM_DEFEITO'>('BOM_ESTADO');
  const [defectDescription, setDefectDescription] = useState('');
  const [returnError, setReturnError] = useState<string | null>(null);

  // Direct Flag Defect / Automatic OS Modal
  const [showDefectModal, setShowDefectModal] = useState(false);
  const [defectPriority, setDefectPriority] = useState<'CRITICA' | 'ALTA' | 'MEDIA'>('ALTA');
  const [defectTechnician, setDefectTechnician] = useState('Equipe Técnica de Engenharia Clínica');
  const [defectNotes, setDefectNotes] = useState('');
  const [defectError, setDefectError] = useState<string | null>(null);

  // ADM Resolve OS Modal
  const [showResolveOSModal, setShowResolveOSModal] = useState(false);
  const [selectedOS, setSelectedOS] = useState<ServiceOrderOS | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolveError, setResolveError] = useState<string | null>(null);

  const openCheckout = (m: MachineEquipment) => {
    setSelectedMachine(m);
    setAssigneeName('');
    setAssigneeSector(m.sectorFloor);
    setCheckoutError(null);
    setShowCheckoutModal(true);
  };

  const handleConfirmCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachine) return;

    if (!assigneeName.trim() || !assigneeSector.trim()) {
      setCheckoutError('Nome do colaborador utilizador e setor são obrigatórios.');
      return;
    }

    const res = StorageService.checkoutMachine({
      machineId: selectedMachine.id,
      collaboratorName: assigneeName.trim(),
      sector: assigneeSector.trim(),
      actor: currentUser
    });

    if (!res.success) {
      setCheckoutError(res.error || 'Erro ao liberar equipamento.');
    } else {
      setShowCheckoutModal(false);
    }
  };

  const openReturn = (m: MachineEquipment) => {
    setSelectedMachine(m);
    setReturnCondition('BOM_ESTADO');
    setDefectDescription('');
    setReturnError(null);
    setShowReturnModal(true);
  };

  const handleConfirmReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachine) return;

    if (returnCondition === 'COM_DEFEITO' && !defectDescription.trim()) {
      setReturnError('É OBRIGATÓRIO descrever a avaria detalhadamente para abertura automática da Ordem de Serviço.');
      return;
    }

    const res = StorageService.returnMachine({
      machineId: selectedMachine.id,
      operationalCondition: returnCondition,
      defectNotes: defectDescription,
      actor: currentUser
    });

    if (!res.success) {
      setReturnError(res.error || 'Erro ao registrar devolução.');
    } else {
      setShowReturnModal(false);
    }
  };

  const openDefectModal = (m: MachineEquipment) => {
    setSelectedMachine(m);
    setDefectPriority('ALTA');
    setDefectTechnician('Manutenção Especializada');
    setDefectNotes('');
    setDefectError(null);
    setShowDefectModal(true);
  };

  const handleConfirmDefectAndOS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachine) return;

    if (!defectNotes.trim()) {
      setDefectError('Descreva o defeito apresentado para o técnico.');
      return;
    }

    const res = StorageService.flagMachineDefectAndCreateOS({
      machineId: selectedMachine.id,
      issueDescription: defectNotes.trim(),
      priority: defectPriority,
      technicianAssigned: defectTechnician,
      actor: currentUser
    });

    if (!res.success) {
      setDefectError(res.error || 'Erro ao abrir OS.');
    } else {
      setShowDefectModal(false);
    }
  };

  const openResolveOS = (os: ServiceOrderOS) => {
    setSelectedOS(os);
    setResolutionNotes('');
    setResolveError(null);
    setShowResolveOSModal(true);
  };

  const handleConfirmResolveOS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOS) return;

    if (!resolutionNotes.trim()) {
      setResolveError('É obrigatório descrever o reparo executado para liberar a máquina.');
      return;
    }

    const res = StorageService.resolveOSAndReactivateMachine({
      osId: selectedOS.id,
      resolutionNotes: resolutionNotes.trim(),
      actor: currentUser
    });

    if (!res.success) {
      setResolveError(res.error || 'Erro ao homologar reparo.');
    } else {
      setShowResolveOSModal(false);
    }
  };

  const defectiveCount = machines.filter(m => m.operationalCondition === 'COM_DEFEITO' || m.status === 'MANUTENCAO_OS').length;
  const inUseCount = machines.filter(m => m.status === 'EM_USO').length;
  const availableCount = machines.filter(m => m.status === 'DISPONIVEL').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-900" />
            Gestão de Máquinas, Equipamentos & Ordens de Serviço
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Rastreamento de custódia, detecção de avarias, abertura automática de OS e bloqueio de circulação.
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('MACHINES')}
            className={`px-4 py-2 rounded-lg transition ${
              activeSubTab === 'MACHINES'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Inventário de Máquinas ({machines.length})
          </button>
          <button
            onClick={() => setActiveSubTab('SERVICE_ORDERS')}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-1.5 ${
              activeSubTab === 'SERVICE_ORDERS'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Ordens de Serviço (OS)</span>
            {osList.filter(o => o.status !== 'CONCLUIDA_REPARADA').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            )}
          </button>
        </div>
      </div>

      {/* Critical Defect Alert */}
      {defectiveCount > 0 && (
        <div className="p-4 bg-red-50 border-2 border-red-500 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-red-600 shrink-0" />
            <div>
              <h3 className="text-xs font-black text-red-900 uppercase">
                {defectiveCount} Equipamento(s) Retirado(s) de Circulação por Avaria
              </h3>
              <p className="text-[11px] text-red-700">
                Máquinas com defeito ficam bloqueadas no sistema. Nenhuma liberação para colaborador é autorizada até conclusão da OS e reativação pelo ADM.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveSubTab('SERVICE_ORDERS')}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition shrink-0"
          >
            Ver OS Ativas
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Equipamentos Disponíveis</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{availableCount} máquinas</div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-1">Prontas para retirada no estoque</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Em Operação / Uso</span>
          <div className="text-2xl font-black text-blue-900 mt-1">{inUseCount} máquinas</div>
          <div className="text-[10px] text-slate-500 mt-1">Com colaboradores alocados</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Bloqueadas sob OS</span>
          <div className="text-2xl font-black text-red-600 mt-1">{defectiveCount} máquinas</div>
          <div className="text-[10px] text-red-700 font-bold mt-1">Manutenção corretiva obrigatória</div>
        </div>
      </div>

      {/* VIEW: MACHINES LIST */}
      {activeSubTab === 'MACHINES' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-blue-900 text-white uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Código / Ativo</th>
                  <th className="px-5 py-3.5">Nome do Equipamento</th>
                  <th className="px-5 py-3.5">Setor / Andar</th>
                  <th className="px-5 py-3.5">Resp. Estoque</th>
                  <th className="px-5 py-3.5">Colaborador Utilizador</th>
                  <th className="px-5 py-3.5 text-center">Estado</th>
                  <th className="px-5 py-3.5 text-center">Situação</th>
                  <th className="px-5 py-3.5 text-center">Ações Operacionais</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {machines.map((m) => {
                  const isBlocked = m.status === 'MANUTENCAO_OS' || m.operationalCondition === 'COM_DEFEITO';
                  const isInUse = m.status === 'EM_USO';
                  const isAvailable = m.status === 'DISPONIVEL';

                  return (
                    <tr
                      key={m.id}
                      className={`hover:bg-blue-50/20 transition ${isBlocked ? 'bg-red-50/30' : ''}`}
                    >
                      <td className="px-5 py-3.5 font-mono font-bold">
                        <span className="text-blue-950 font-black">{m.code}</span>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">{m.name}</div>
                        <div className="text-[10px] text-slate-400">Última inspeção: {m.lastInspectionDate}</div>
                      </td>

                      <td className="px-5 py-3.5 text-slate-600 font-medium">
                        <span className="inline-flex items-center gap-1 font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          <MapPin className="w-3 h-3 text-red-500" />
                          {m.sectorFloor}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-slate-700">
                        {m.stockCollaborator}
                      </td>

                      <td className="px-5 py-3.5">
                        <span className={`font-semibold ${isInUse ? 'text-blue-900' : isBlocked ? 'text-red-700 font-mono font-bold' : 'text-slate-400'}`}>
                          {m.currentAssigneeUser}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        {m.operationalCondition === 'COM_DEFEITO' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-300">
                            <AlertTriangle className="w-3 h-3" />
                            Com Defeito
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle className="w-3 h-3" />
                            Bom Estado
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        {isBlocked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white shadow-xs animate-pulse">
                            <Lock className="w-3 h-3" />
                            Bloqueada (OS)
                          </span>
                        ) : isInUse ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                            Em Uso
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Disponível
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isAvailable && (
                            <button
                              onClick={() => openCheckout(m)}
                              className="px-2.5 py-1 rounded bg-blue-900 hover:bg-blue-800 text-white font-bold text-[11px] transition shadow-xs"
                            >
                              Liberar Saída
                            </button>
                          )}

                          {isInUse && (
                            <button
                              onClick={() => openReturn(m)}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] transition shadow-xs"
                            >
                              Devolver
                            </button>
                          )}

                          {isBlocked ? (
                            <button
                              onClick={() => setActiveSubTab('SERVICE_ORDERS')}
                              className="px-2.5 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 font-bold text-[11px] transition"
                            >
                              Ver OS
                            </button>
                          ) : (
                            <button
                              onClick={() => openDefectModal(m)}
                              className="p-1 rounded text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200"
                              title="Sinalizar Avaria / Abrir OS"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => onOpenLabels(m.code)}
                            className="p-1 rounded text-blue-700 hover:bg-blue-50"
                            title="Imprimir Etiqueta da Máquina"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: SERVICE ORDERS (OS) */}
      {activeSubTab === 'SERVICE_ORDERS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hammer className="w-4 h-4 text-blue-900" />
                <h3 className="font-bold text-sm text-slate-900">Ordens de Serviço Automáticas de Manutenção</h3>
              </div>
              <span className="text-xs text-slate-500">{osList.length} registros de manutenção</span>
            </div>

            <div className="divide-y divide-slate-100">
              {osList.map((os) => {
                const isOpen = os.status === 'ABERTA';
                const isInProgress = os.status === 'EM_ANDAMENTO';
                const isResolved = os.status === 'CONCLUIDA_REPARADA';

                return (
                  <div key={os.id} className="p-5 hover:bg-slate-50/50 transition">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-blue-900">{os.id}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-100 text-slate-800 border border-slate-300">
                            {os.machineCode}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            os.priority === 'CRITICA' ? 'bg-red-600 text-white' : os.priority === 'ALTA' ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white'
                          }`}>
                            Prioridade {os.priority}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 mt-1">{os.machineName}</h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          <strong>Descrição da Falha:</strong> {os.issueDescription}
                        </p>
                      </div>

                      <div className="flex flex-col sm:items-end gap-2 shrink-0">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          isResolved
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-red-100 text-red-700 border border-red-300 animate-pulse'
                        }`}>
                          {isResolved ? '✓ Reparo Concluído' : os.status}
                        </span>

                        {!isResolved && currentUser.role === 'ADM' && (
                          <button
                            onClick={() => openResolveOS(os)}
                            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition"
                          >
                            Homologar Reparo & Reativar
                          </button>
                        )}

                        {!isResolved && currentUser.role !== 'ADM' && (
                          <span className="text-[10px] text-slate-400 italic">
                            Apenas ADM pode homologar e reativar
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
                      <div className="flex items-center gap-3">
                        <span>Aberto por: <strong>{os.reportedBy}</strong></span>
                        <span>Data: <strong>{os.dateOpened}</strong></span>
                        <span>Técnico: <strong>{os.technicianAssigned}</strong></span>
                      </div>

                      {os.resolutionNotes && (
                        <div className="text-emerald-700 font-medium">
                          <strong>Laudo de Reparo:</strong> {os.resolutionNotes} ({os.reactivatedByADM})
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {showCheckoutModal && selectedMachine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-blue-900 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Liberação / Retirada de Equipamento</h3>
              <button onClick={() => setShowCheckoutModal(false)} className="text-white/80 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCheckout} className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div className="font-mono font-bold text-blue-900">{selectedMachine.code}</div>
                <div className="font-bold text-slate-800">{selectedMachine.name}</div>
                <div className="text-slate-500">Responsável Estoque: {currentUser.name}</div>
              </div>

              {checkoutError && (
                <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-lg text-xs font-semibold">
                  {checkoutError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Colaborador Utilizador *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João Pereira (Higienização)"
                  value={assigneeName}
                  onChange={(e) => setAssigneeName(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Setor / Andar de Destino *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 2º Andar - Bloco Cirúrgico"
                  value={assigneeSector}
                  onChange={(e) => setAssigneeSector(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-md transition"
                >
                  Confirmar Retirada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RETURN INSPECTION MODAL */}
      {showReturnModal && selectedMachine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-blue-900 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Inspeção de Devolução de Máquina</h3>
              <button onClick={() => setShowReturnModal(false)} className="text-white/80 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReturn} className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div className="font-mono font-bold text-blue-900">{selectedMachine.code}</div>
                <div className="font-bold text-slate-800">{selectedMachine.name}</div>
                <div className="text-slate-500">Em posse de: {selectedMachine.currentAssigneeUser}</div>
              </div>

              {returnError && (
                <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-lg text-xs font-semibold">
                  {returnError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Estado de Funcionamento na Devolução *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReturnCondition('BOM_ESTADO')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                      returnCondition === 'BOM_ESTADO'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span>Bom Estado</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReturnCondition('COM_DEFEITO')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                      returnCondition === 'COM_DEFEITO'
                        ? 'bg-red-50 border-red-500 text-red-800 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span>Com Defeito</span>
                  </button>
                </div>
              </div>

              {returnCondition === 'COM_DEFEITO' && (
                <div className="space-y-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <div className="text-xs font-bold text-red-800 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                    <span>Abertura Automática de Ordem de Serviço (OS)</span>
                  </div>
                  <p className="text-[11px] text-red-700">
                    O equipamento será imediatamente retirado de circulação e bloqueado.
                  </p>
                  <textarea
                    rows={3}
                    required
                    placeholder="Descreva a avaria em detalhes (ruído anormal, vazamento, falha elétrica)..."
                    value={defectDescription}
                    onChange={(e) => setDefectDescription(e.target.value)}
                    className="w-full text-xs rounded-lg border border-red-300 p-2 focus:ring-2 focus:ring-red-600 focus:outline-hidden bg-white"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-xs font-bold text-white rounded-lg shadow-md transition ${
                    returnCondition === 'COM_DEFEITO' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-700 hover:bg-emerald-800'
                  }`}
                >
                  Confirmar Devolução
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SINALIZAR DEFEITO DIRETO MODAL */}
      {showDefectModal && selectedMachine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-red-600 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-sm">Sinalizar Defeito & Gerar OS Automática</h3>
              </div>
              <button onClick={() => setShowDefectModal(false)} className="text-white/80 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmDefectAndOS} className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div className="font-mono font-bold text-blue-900">{selectedMachine.code}</div>
                <div className="font-bold text-slate-800">{selectedMachine.name}</div>
              </div>

              {defectError && (
                <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-lg text-xs font-semibold">
                  {defectError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Prioridade da OS</label>
                <select
                  value={defectPriority}
                  onChange={(e) => setDefectPriority(e.target.value as any)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white font-bold"
                >
                  <option value="CRITICA">CRÍTICA (Equipamento essencial paralisado)</option>
                  <option value="ALTA">ALTA (Falha operacional relevante)</option>
                  <option value="MEDIA">MÉDIA (Desgaste ou reparo preventivo)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Técnico / Equipe Atribuída</label>
                <input
                  type="text"
                  value={defectTechnician}
                  onChange={(e) => setDefectTechnician(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descrição do Defeito / Avaria *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Descreva o problema apresentado para orientar a manutenção..."
                  value={defectNotes}
                  onChange={(e) => setDefectNotes(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDefectModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-md transition"
                >
                  Gerar OS & Bloquear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADM RESOLVE OS & REACTIVATE MACHINE MODAL */}
      {showResolveOSModal && selectedOS && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-emerald-700 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="font-bold text-sm">Homologar Reparo & Reativar Máquina</h3>
              </div>
              <button onClick={() => setShowResolveOSModal(false)} className="text-white/80 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmResolveOS} className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <p><strong>Ordem de Serviço:</strong> {selectedOS.id}</p>
                <p><strong>Equipamento:</strong> [{selectedOS.machineCode}] {selectedOS.machineName}</p>
                <p><strong>Falha Reportada:</strong> {selectedOS.issueDescription}</p>
              </div>

              {resolveError && (
                <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-lg text-xs font-semibold">
                  {resolveError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Laudo Técnico do Reparo / Peças Substituídas *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ex: Troca da guarnição de silicone executada, teste de pressão estanque realizado com êxito a 134°C..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                Ao confirmar, o equipamento retornará automaticamente para a condição <strong>Bom Estado</strong> e situação <strong>Disponível</strong> para novas liberações.
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResolveOSModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-md transition"
                >
                  Homologar & Liberar Máquina
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
