/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Shirt,
  Send,
  CheckCircle,
  AlertTriangle,
  Clock,
  Calendar,
  User,
  Plus,
  ArrowRight,
  RotateCcw,
  X,
  FileCheck2,
  Info
} from 'lucide-react';
import { LaundryRecord, UserProfile } from '../types';
import { StorageService } from '../services/storage';

interface LaundryViewProps {
  laundryRecords: LaundryRecord[];
  currentUser: UserProfile;
}

export const LaundryView: React.FC<LaundryViewProps> = ({ laundryRecords, currentUser }) => {
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<LaundryRecord | null>(null);

  // Mandatory fields for dispatch form
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().substring(0, 10));
  const [dispatchTime, setDispatchTime] = useState(
    `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`
  );
  const [senderCollaborator, setSenderCollaborator] = useState(currentUser.name);
  const [laundryEmployee, setLaundryEmployee] = useState('');
  const [nightShiftQty, setNightShiftQty] = useState<string>('0');
  const [dayShiftQty, setDayShiftQty] = useState<string>('0');
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  // Return form fields
  const [returnDate, setReturnDate] = useState(new Date().toISOString().substring(0, 10));
  const [returnTime, setReturnTime] = useState(
    `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`
  );
  const [returnedQty, setReturnedQty] = useState<number>(0);
  const [receiverCollaborator, setReceiverCollaborator] = useState(currentUser.name);
  const [pendingNotes, setPendingNotes] = useState('');
  const [returnError, setReturnError] = useState<string | null>(null);

  const openDispatch = () => {
    setDispatchDate(new Date().toISOString().substring(0, 10));
    setDispatchTime(
      `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`
    );
    setSenderCollaborator(currentUser.name);
    setLaundryEmployee('');
    setNightShiftQty('');
    setDayShiftQty('');
    setDispatchError(null);
    setShowDispatchModal(true);
  };

  const handleConfirmDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    setDispatchError(null);

    // Strict validation rules as specified in the business requirements:
    if (!dispatchDate) {
      setDispatchError('A Data de envio é de preenchimento estritamente obrigatório.');
      return;
    }
    if (!dispatchTime) {
      setDispatchError('A Hora de envio é de preenchimento estritamente obrigatório.');
      return;
    }
    if (nightShiftQty === '' || isNaN(Number(nightShiftQty)) || Number(nightShiftQty) < 0) {
      setDispatchError('A Quantidade de Enxoval Noturno é obrigatória e deve ser preenchida antes do envio.');
      return;
    }
    if (dayShiftQty === '' || isNaN(Number(dayShiftQty)) || Number(dayShiftQty) < 0) {
      setDispatchError('A Quantidade de Enxoval Diurno é obrigatória e deve ser preenchida antes do envio.');
      return;
    }
    if (Number(nightShiftQty) === 0 && Number(dayShiftQty) === 0) {
      setDispatchError('É obrigatório informar ao menos uma peça no Enxoval Noturno ou Diurno.');
      return;
    }
    if (!senderCollaborator.trim()) {
      setDispatchError('O Nome do Colaborador do Estoque é obrigatório.');
      return;
    }
    if (!laundryEmployee.trim()) {
      setDispatchError('O Nome do Funcionário da Lavanderia que recebeu é obrigatório.');
      return;
    }

    const res = StorageService.registerLaundryDispatch({
      date: dispatchDate,
      time: dispatchTime,
      senderCollaborator,
      laundryEmployee,
      nightShiftQty: Number(nightShiftQty),
      dayShiftQty: Number(dayShiftQty),
      actor: currentUser
    });

    if (!res.success) {
      setDispatchError(res.error || 'Erro ao registrar envio.');
    } else {
      setShowDispatchModal(false);
    }
  };

  const openReturn = (rec: LaundryRecord) => {
    setSelectedRecord(rec);
    setReturnDate(new Date().toISOString().substring(0, 10));
    setReturnTime(
      `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`
    );
    setReturnedQty(rec.totalSent); // Defaults to full return
    setReceiverCollaborator(currentUser.name);
    setPendingNotes('');
    setReturnError(null);
    setShowReturnModal(true);
  };

  const handleConfirmReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    setReturnError(null);

    if (returnedQty < 0) {
      setReturnError('Quantidade devolvida inválida.');
      return;
    }

    if (returnedQty < selectedRecord.totalSent && !pendingNotes.trim()) {
      setReturnError('Como há divergência/peça faltante, é OBRIGATÓRIO preencher o motivo da pendência nas notas.');
      return;
    }

    const res = StorageService.registerLaundryReturn({
      recordId: selectedRecord.id,
      returnDate,
      returnTime,
      returnedQty,
      receiverCollaborator,
      pendingNotes,
      actor: currentUser
    });

    if (!res.success) {
      setReturnError(res.error || 'Erro ao registrar retorno.');
    } else {
      setShowReturnModal(false);
    }
  };

  const totalEnviado = laundryRecords.reduce((acc, r) => acc + r.totalSent, 0);
  const totalDevolvido = laundryRecords.reduce((acc, r) => acc + (r.returnedQty || 0), 0);
  const pendenciasAtivas = laundryRecords.filter(r => r.status === 'PECA_PENDENTE');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Shirt className="w-5 h-5 text-blue-900" />
            Central de Lavanderia & Higienização de Enxoval
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Controlo rigoroso por turnos (Noturno e Diurno), validação prévia obrigatória e rastreamento de peças pendentes.
          </p>
        </div>

        <button
          onClick={openDispatch}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-md transition active:scale-95"
        >
          <Send className="w-4 h-4 text-red-400" />
          <span>Novo Envio para Lavanderia</span>
        </button>
      </div>

      {/* Discrepancy Alert Banner */}
      {pendenciasAtivas.length > 0 && (
        <div className="rounded-xl bg-red-50 border-2 border-red-500 p-4 shadow-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <h3 className="font-black text-red-900 uppercase">
              Alerta de Peças Pendentes na Lavanderia ({pendenciasAtivas.length} registros com falta)
            </h3>
            <p className="text-red-700 mt-0.5 leading-relaxed">
              Existem lotes conferidos com quantidade devolvida inferior à enviada. O painel do gestor foi notificado automaticamente para cobrança de reposição.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Total Enviado Acumulado</span>
          <div className="text-2xl font-black text-blue-900 mt-1">{totalEnviado} peças</div>
          <div className="text-[10px] text-slate-400 mt-1">Enxoval Hospitalar e Hoteleiro</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Total Retornado & Higienizado</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{totalDevolvido} peças</div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-1">Devoluções aprovadas e auditadas</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Divergências / Peças Pendentes</span>
          <div className={`text-2xl font-black mt-1 ${pendenciasAtivas.length > 0 ? 'text-red-600' : 'text-slate-800'}`}>
            {pendenciasAtivas.reduce((acc, p) => acc + (p.pendingQty || 0), 0)} peças
          </div>
          <div className="text-[10px] text-red-700 font-bold mt-1">
            {pendenciasAtivas.length > 0 ? 'Alerta imediato em aberto!' : 'Nenhuma pendência ativa'}
          </div>
        </div>
      </div>

      {/* Laundry Operations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-900" />
            <h3 className="font-bold text-sm text-slate-900">Histórico de Envios e Devoluções por Turno</h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">{laundryRecords.length} operações registradas</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-blue-900 text-white uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Data / Hora Envio</th>
                <th className="px-5 py-3.5">Colaborador Estoque</th>
                <th className="px-5 py-3.5">Recebedor Lavanderia</th>
                <th className="px-5 py-3.5 text-center">Enxoval Noturno</th>
                <th className="px-5 py-3.5 text-center">Enxoval Diurno</th>
                <th className="px-5 py-3.5 text-center">Total Enviado</th>
                <th className="px-5 py-3.5 text-center">Devolvido</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {laundryRecords.map((rec) => {
                const isPending = rec.status === 'PECA_PENDENTE';
                const isSentOnly = rec.status === 'ENVIADO';

                return (
                  <tr key={rec.id} className={`hover:bg-blue-50/20 transition ${isPending ? 'bg-red-50/40' : ''}`}>
                    <td className="px-5 py-3.5 font-mono text-slate-700">
                      <div className="font-bold text-slate-900">{rec.date}</div>
                      <div className="text-[10px] text-slate-400">{rec.time}</div>
                    </td>

                    <td className="px-5 py-3.5 font-medium text-slate-900">
                      {rec.senderCollaborator}
                    </td>

                    <td className="px-5 py-3.5 text-slate-700 font-medium">
                      {rec.laundryEmployee}
                    </td>

                    <td className="px-5 py-3.5 text-center font-mono font-bold text-blue-900">
                      {rec.nightShiftQty} un
                    </td>

                    <td className="px-5 py-3.5 text-center font-mono font-bold text-indigo-900">
                      {rec.dayShiftQty} un
                    </td>

                    <td className="px-5 py-3.5 text-center font-mono font-black text-slate-900 bg-slate-50">
                      {rec.totalSent} un
                    </td>

                    <td className="px-5 py-3.5 text-center font-mono">
                      {rec.returnedQty !== undefined ? (
                        <div>
                          <span className={`font-bold ${isPending ? 'text-red-600' : 'text-emerald-700'}`}>
                            {rec.returnedQty} un
                          </span>
                          {isPending && (
                            <span className="block text-[9px] font-bold text-red-600">
                              (-{rec.pendingQty} faltantes)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Em lavagem</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      {isPending ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-300">
                          <AlertTriangle className="w-3 h-3" />
                          Peça Pendente
                        </span>
                      ) : isSentOnly ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                          Enviado / Em Lavagem
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle className="w-3 h-3" />
                          Devolvido 100%
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      {isSentOnly || isPending ? (
                        <button
                          onClick={() => openReturn(rec)}
                          className="px-3 py-1 rounded-md bg-blue-900 hover:bg-blue-800 text-white text-[11px] font-bold transition flex items-center gap-1 mx-auto"
                        >
                          <RotateCcw className="w-3 h-3 text-red-400" />
                          <span>Conferir Retorno</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-emerald-700 font-semibold flex items-center justify-center gap-1">
                          <FileCheck2 className="w-3.5 h-3.5" /> Concluído
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DISPATCH MODAL (Enforce Shift & Date rules strictly) */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-blue-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shirt className="w-5 h-5 text-red-400" />
                <h3 className="font-bold text-sm">Registrar Envio de Enxoval para Lavanderia</h3>
              </div>
              <button onClick={() => setShowDispatchModal(false)} className="text-white/80 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmDispatch} className="p-6 space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <p>
                  <strong>Regra de Negócio:</strong> É obrigatório o preenchimento detalhado da <strong>Data</strong>, da <strong>Quantidade do Enxoval Noturno</strong> e da <strong>Quantidade do Enxoval Diurno</strong> antes de confirmar o envio.
                </p>
              </div>

              {dispatchError && (
                <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-lg text-xs font-semibold">
                  {dispatchError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Data do Envio *</label>
                  <input
                    type="date"
                    required
                    value={dispatchDate}
                    onChange={(e) => setDispatchDate(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 font-mono focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hora do Envio *</label>
                  <input
                    type="time"
                    required
                    value={dispatchTime}
                    onChange={(e) => setDispatchTime(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 font-mono focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Obligatory Shift Quantities */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-black text-blue-900 mb-1">
                    Qtd. Enxoval Noturno *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="Ex: 85"
                    value={nightShiftQty}
                    onChange={(e) => setNightShiftQty(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 font-mono font-bold focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-500">Lençóis, fronhas do turno da noite</span>
                </div>

                <div>
                  <label className="block text-xs font-black text-indigo-900 mb-1">
                    Qtd. Enxoval Diurno *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="Ex: 110"
                    value={dayShiftQty}
                    onChange={(e) => setDayShiftQty(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 font-mono font-bold focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-500">Camisolas, toalhas, campos do turno diurno</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs px-2 font-bold text-slate-800">
                <span>Total de Peças a Enviar:</span>
                <span className="font-mono text-base text-red-600 font-black">
                  {(Number(nightShiftQty) || 0) + (Number(dayShiftQty) || 0)} peças
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Colaborador do Estoque Responsável *</label>
                <input
                  type="text"
                  required
                  value={senderCollaborator}
                  onChange={(e) => setSenderCollaborator(e.target.value)}
                  placeholder="Nome do colaborador que realizou a contagem"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Funcionário da Lavanderia *</label>
                <input
                  type="text"
                  required
                  value={laundryEmployee}
                  onChange={(e) => setLaundryEmployee(e.target.value)}
                  placeholder="Ex: Marcos Vinicius (Motorista / Recebedor)"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-md transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5 text-red-400" />
                  Confirmar Envio Auditado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RETURN CONFERRAL MODAL (With "Peça Pendente" Flagging) */}
      {showReturnModal && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-blue-900 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Conferência de Retorno da Lavanderia</h3>
              <button onClick={() => setShowReturnModal(false)} className="text-white/80 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReturn} className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <p><strong>Lote de Envio:</strong> {selectedRecord.date} às {selectedRecord.time}</p>
                <p><strong>Total Enviado:</strong> {selectedRecord.totalSent} peças (Noturno: {selectedRecord.nightShiftQty}, Diurno: {selectedRecord.dayShiftQty})</p>
                <p><strong>Entregue por:</strong> {selectedRecord.laundryEmployee}</p>
              </div>

              {returnError && (
                <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-lg text-xs font-semibold">
                  {returnError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Data do Retorno</label>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 font-mono focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hora do Retorno</label>
                  <input
                    type="time"
                    value={returnTime}
                    onChange={(e) => setReturnTime(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 font-mono focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Quantidade Total Efetivamente Devolvida (Peças Conferidas)
                </label>
                <input
                  type="number"
                  min="0"
                  max={selectedRecord.totalSent}
                  value={returnedQty}
                  onChange={(e) => setReturnedQty(parseInt(e.target.value, 10) || 0)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 font-mono font-bold text-base focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              {returnedQty < selectedRecord.totalSent && (
                <div className="p-3 bg-red-50 border border-red-300 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-red-700">
                    <AlertTriangle className="w-4 h-4" />
                    <span>DIVERGÊNCIA: Faltam {selectedRecord.totalSent - returnedQty} peças!</span>
                  </div>
                  <p className="text-red-600 text-[11px]">
                    Este registro será classificado como <strong>"Peça Pendente"</strong> e disparará um alerta imediato no Painel do Gestor.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Colaborador que Conferiu a Devolução</label>
                <input
                  type="text"
                  value={receiverCollaborator}
                  onChange={(e) => setReceiverCollaborator(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {returnedQty < selectedRecord.totalSent ? 'Observações e Motivo da Falta (Obrigatório)' : 'Observações Gerais'}
                </label>
                <textarea
                  rows={2}
                  value={pendingNotes}
                  onChange={(e) => setPendingNotes(e.target.value)}
                  placeholder={returnedQty < selectedRecord.totalSent ? 'Ex: Lavanderia reteve 15 lençóis para relavagem profunda, retorno prometido em 24h...' : 'Conferência 100% íntegra...'}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

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
                    returnedQty < selectedRecord.totalSent
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-emerald-700 hover:bg-emerald-800'
                  }`}
                >
                  Confirmar Retorno {returnedQty < selectedRecord.totalSent ? 'com Pendência' : 'Conforme'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
