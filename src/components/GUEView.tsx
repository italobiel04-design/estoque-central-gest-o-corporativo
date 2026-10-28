/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  FileDown,
  Layers,
  Phone,
  MapPin,
  AlertCircle,
  Check,
  X,
  TrendingUp,
  Package,
  User
} from 'lucide-react';
import { ExternalUnitGUE, GUERequest, MaterialItem, UserProfile } from '../types';
import { StorageService } from '../services/storage';
import { exportGUEConsumptionPDF } from '../utils/pdfGenerator';

interface GUEViewProps {
  gues: ExternalUnitGUE[];
  gueRequests: GUERequest[];
  materials: MaterialItem[];
  currentUser: UserProfile;
}

export const GUEView: React.FC<GUEViewProps> = ({
  gues,
  gueRequests,
  materials,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'UNITS' | 'REQUESTS' | 'ANALYTICS'>('REQUESTS');

  // Request material for GUE modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqGueId, setReqGueId] = useState(gues[0]?.id || '');
  const [reqItemId, setReqItemId] = useState(materials[0]?.id || '');
  const [reqQuantity, setReqQuantity] = useState(10);
  const [reqJustification, setReqJustification] = useState('');
  const [requestError, setRequestError] = useState<string | null>(null);

  // Rejection modal (enforces compulsory rejection reason)
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedReq, setSelectedReq] = useState<GUERequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState<string | null>(null);

  // New GUE Registration Modal
  const [showNewGueModal, setShowNewGueModal] = useState(false);
  const [gueName, setGueName] = useState('');
  const [gueCode, setGueCode] = useState(`GUE-0${gues.length + 1}`);
  const [gueResponsible, setGueResponsible] = useState('');
  const [guePhone, setGuePhone] = useState('');
  const [gueAddress, setGueAddress] = useState('');
  const [newGueError, setNewGueError] = useState<string | null>(null);

  const pendingRequests = gueRequests.filter(r => r.status === 'PENDENTE_APROVACAO');
  const evaluatedRequests = gueRequests.filter(r => r.status !== 'PENDENTE_APROVACAO');

  const openRequest = () => {
    setReqGueId(gues[0]?.id || '');
    setReqItemId(materials[0]?.id || '');
    setReqQuantity(10);
    setReqJustification('');
    setRequestError(null);
    setShowRequestModal(true);
  };

  const handleConfirmRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setRequestError(null);

    if (reqQuantity <= 0) {
      setRequestError('A quantidade deve ser superior a zero.');
      return;
    }
    if (!reqJustification.trim()) {
      setRequestError('A justificativa operacional do pedido para a GUE é obrigatória.');
      return;
    }

    const res = StorageService.requestGUEMaterial({
      gueId: reqGueId,
      itemId: reqItemId,
      quantity: Number(reqQuantity),
      justification: reqJustification.trim(),
      actor: currentUser
    });

    if (!res.success) {
      setRequestError(res.error || 'Erro ao registrar solicitação.');
    } else {
      setShowRequestModal(false);
    }
  };

  const handleApprove = (req: GUERequest) => {
    if (confirm(`Deseja APROVAR a transferência de ${req.quantity} un de [${req.itemCode}] para ${req.gueName}? O saldo do Estoque Central será debitado atomicamente.`)) {
      const res = StorageService.reviewGUERequest({
        requestId: req.id,
        action: 'APROVAR',
        actor: currentUser
      });
      if (!res.success) {
        alert(res.error);
      }
    }
  };

  const openReject = (req: GUERequest) => {
    setSelectedReq(req);
    setRejectionReason('');
    setRejectionError(null);
    setShowRejectModal(true);
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;

    if (!rejectionReason.trim()) {
      setRejectionError('É OBRIGATÓRIO descrever o motivo da recusa para rejeitar a solicitação da GUE.');
      return;
    }

    const res = StorageService.reviewGUERequest({
      requestId: selectedReq.id,
      action: 'RECUSAR',
      rejectionReason: rejectionReason.trim(),
      actor: currentUser
    });

    if (!res.success) {
      setRejectionError(res.error || 'Erro ao registrar recusa.');
    } else {
      setShowRejectModal(false);
    }
  };

  const handleSaveNewGue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gueName.trim() || !gueCode.trim() || !gueResponsible.trim()) {
      setNewGueError('Nome da Unidade, Código e Responsável são obrigatórios.');
      return;
    }

    const newGue: ExternalUnitGUE = {
      id: `gue-${Date.now()}`,
      code: gueCode.trim().toUpperCase(),
      name: gueName.trim(),
      responsibleName: gueResponsible.trim(),
      contactPhone: guePhone.trim() || '(11) 90000-0000',
      address: gueAddress.trim() || 'Unidade Regional',
      subStock: []
    };

    const res = StorageService.saveGUE(newGue, currentUser);
    if (!res.success) {
      setNewGueError(res.error || 'Erro ao salvar GUE.');
    } else {
      setShowNewGueModal(false);
    }
  };

  const handleExportPDF = () => {
    StorageService.logAudit({
      actor: currentUser,
      crudType: 'LER',
      module: 'GUE',
      actionName: 'EXPORTACAO_RELATORIO_GUE_PDF',
      details: 'Exportação executiva do Relatório de Consumo por Unidades Externas (GUE).'
    });
    exportGUEConsumptionPDF({ gues, currentUser });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-900" />
            Gestão de Unidades Externas (GUE's) & Sub-Estoques
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Fluxo de requisição com aprovação mandatória do ADM, débito atômico do Estoque Central e controle de consumo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {currentUser.role === 'ADM' && (
            <button
              onClick={() => {
                setGueName('');
                setGueCode(`GUE-0${gues.length + 1}`);
                setGueResponsible('');
                setGuePhone('');
                setGueAddress('');
                setNewGueError(null);
                setShowNewGueModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold transition"
            >
              <Plus className="w-4 h-4 text-blue-900" />
              <span>Nova GUE</span>
            </button>
          )}

          <button
            onClick={openRequest}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition"
          >
            <Send className="w-4 h-4 text-red-400" />
            <span>Solicitar Material para GUE</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition"
          >
            <FileDown className="w-4 h-4" />
            <span>Exportar Relatório Consumo PDF</span>
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex border-b border-slate-200 gap-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('REQUESTS')}
          className={`pb-2.5 transition flex items-center gap-2 border-b-2 ${
            activeTab === 'REQUESTS'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Fila de Aprovação & Pedidos</span>
          {pendingRequests.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px]">
              {pendingRequests.length} pendentes
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('UNITS')}
          className={`pb-2.5 transition flex items-center gap-2 border-b-2 ${
            activeTab === 'UNITS'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Unidades Cadastradas & Sub-Estoques ({gues.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ANALYTICS')}
          className={`pb-2.5 transition flex items-center gap-2 border-b-2 ${
            activeTab === 'ANALYTICS'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Análise de Consumo por GUE</span>
        </button>
      </div>

      {/* VIEW: REQUESTS & APPROVAL QUEUE */}
      {activeTab === 'REQUESTS' && (
        <div className="space-y-4">
          {pendingRequests.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="font-bold">
                  {pendingRequests.length} solicitação(ões) de GUE aguardando aprovação prévia do Administrador.
                </span>
              </div>
              <span className="text-[11px] text-amber-700">Decisão soberana do ADM</span>
            </div>
          )}

          {/* Pending Requests Cards */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Solicitações Aguardando Decisão ({pendingRequests.length})
            </h3>

            {pendingRequests.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
                Nenhuma solicitação de transferência pendente de aprovação no momento.
              </div>
            ) : (
              pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white p-5 rounded-2xl border-2 border-amber-300 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {req.gueCode}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900">{req.gueName}</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        Aguardando ADM
                      </span>
                    </div>

                    <div className="text-xs font-medium text-slate-800">
                      Material Solicitado: <strong className="text-blue-900 font-mono">[{req.itemCode}]</strong> {req.itemName}
                    </div>

                    <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                      <strong>Justificativa:</strong> "{req.justification}"
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-3 pt-1">
                      <span>Solicitante: <strong>{req.requestedBy}</strong></span>
                      <span>Data: <strong>{req.date}</strong></span>
                      <span className="font-mono font-bold text-red-600">Qtd: {req.quantity} unidades</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
                    {currentUser.role === 'ADM' ? (
                      <>
                        <button
                          onClick={() => handleApprove(req)}
                          className="w-full sm:w-auto px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm transition flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-4 h-4" />
                          <span>Aprovar Pedido</span>
                        </button>
                        <button
                          onClick={() => openReject(req)}
                          className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg shadow-sm transition flex items-center justify-center gap-1.5"
                        >
                          <X className="w-4 h-4" />
                          <span>Recusar</span>
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-3 rounded-lg bg-slate-100 text-slate-500 text-xs font-medium">
                        Apenas o Perfil de Administrador (ADM) pode aprovar ou recusar pedidos de GUE.
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Evaluated Requests History */}
          <div className="pt-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Histórico de Solicitações Julgadas ({evaluatedRequests.length})
            </h3>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-bold text-[10px] uppercase">
                  <tr>
                    <th className="px-5 py-3">Data / Hora</th>
                    <th className="px-5 py-3">Unidade (GUE)</th>
                    <th className="px-5 py-3">Material & Qtd</th>
                    <th className="px-5 py-3">Status / Decisão</th>
                    <th className="px-5 py-3">Avaliador (ADM)</th>
                    <th className="px-5 py-3">Motivo / Parecer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {evaluatedRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-5 py-3 font-mono text-slate-600">{req.date}</td>
                      <td className="px-5 py-3 font-bold text-slate-900">
                        {req.gueCode} - {req.gueName}
                      </td>
                      <td className="px-5 py-3 font-medium">
                        [{req.itemCode}] {req.itemName} ({req.quantity} un)
                      </td>
                      <td className="px-5 py-3">
                        {req.status === 'APROVADO' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle className="w-3 h-3" /> Aprovado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-300">
                            <XCircle className="w-3 h-3" /> Recusado
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-700">{req.reviewedBy || '-'}</td>
                      <td className="px-5 py-3 text-slate-600 max-w-xs truncate">
                        {req.rejectionReason ? (
                          <span className="text-red-700 font-semibold italic">"{req.rejectionReason}"</span>
                        ) : (
                          'Transferência autorizada e debitada'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: UNITS & SUB-STOCKS */}
      {activeTab === 'UNITS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gues.map((gue) => (
            <div key={gue.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-white bg-blue-900 px-2.5 py-0.5 rounded">
                    {gue.code}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">UNIDADE EXTERNA</span>
                </div>
                <h3 className="font-bold text-sm text-slate-900">{gue.name}</h3>

                <div className="mt-3 space-y-1 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>Resp: <strong>{gue.responsibleName}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    <span>{gue.contactPhone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    <span className="truncate">{gue.address}</span>
                  </div>
                </div>
              </div>

              {/* Sub-stock List */}
              <div className="p-5 bg-slate-50 flex-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                  <span>Sub-Estoque Alocado</span>
                  <span>{gue.subStock.reduce((a, b) => a + b.quantity, 0)} unidades</span>
                </div>

                {gue.subStock.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">Nenhum material no sub-estoque desta unidade.</p>
                ) : (
                  <div className="space-y-1.5">
                    {gue.subStock.map((sub, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs">
                        <div className="truncate pr-2">
                          <span className="font-mono text-[10px] font-bold text-slate-500">[{sub.itemCode}]</span>
                          <span className="font-medium text-slate-800 ml-1 truncate">{sub.itemName}</span>
                        </div>
                        <span className="font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded shrink-0">
                          {sub.quantity} un
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW: ANALYTICS & CONSUMPTION CHARTS */}
      {activeTab === 'ANALYTICS' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">Mensuração de Consumo por Unidade Externa</h3>
              <p className="text-xs text-slate-500">Comparativo de suprimentos demandados e distribuídos</p>
            </div>
            <button
              onClick={handleExportPDF}
              className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
            >
              <FileDown className="w-3.5 h-3.5 text-red-400" />
              <span>Gerar PDF Deste Painel</span>
            </button>
          </div>

          <div className="space-y-4">
            {gues.map((gue) => {
              const totalItems = gue.subStock.reduce((a, b) => a + b.quantity, 0);
              const maxScale = 250;
              const pct = Math.min((totalItems / maxScale) * 100, 100);

              return (
                <div key={gue.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-2">
                      <span className="font-mono bg-blue-900 text-white px-2 py-0.5 rounded text-[10px]">
                        {gue.code}
                      </span>
                      <span>{gue.name}</span>
                    </span>
                    <span className="font-mono text-blue-900 text-sm font-black">{totalItems} unidades</span>
                  </div>

                  <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-blue-900 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(pct, 5)}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Responsável: {gue.responsibleName}</span>
                    <span>Itens distintos no sub-estoque: {gue.subStock.length}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* REQUEST MATERIAL MODAL */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-blue-900 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Solicitar Transferência de Material para GUE</h3>
              <button onClick={() => setShowRequestModal(false)} className="text-white/80 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmRequest} className="p-6 space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Fluxo Obrigatório:</strong> Esta solicitação entrará na Fila de Aprovação e exigirá aprovação prévia do Administrador antes de debitar o Estoque Central.
                </p>
              </div>

              {requestError && (
                <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-lg text-xs font-semibold">
                  {requestError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Unidade Externa Destino (GUE) *</label>
                <select
                  value={reqGueId}
                  onChange={(e) => setReqGueId(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white font-medium focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                >
                  {gues.map((g) => (
                    <option key={g.id} value={g.id}>
                      [{g.code}] {g.name} (Resp: {g.responsibleName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Material do Estoque Central *</label>
                <select
                  value={reqItemId}
                  onChange={(e) => setReqItemId(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white font-medium focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      [{m.code}] {m.name} — Disponível Central: {m.currentStock} {m.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Quantidade a Transferir *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={reqQuantity}
                  onChange={(e) => setReqQuantity(parseInt(e.target.value, 10) || 1)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 font-bold font-mono focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Justificativa Operacional do Pedido *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Descreva o motivo da necessidade na GUE para avaliação do ADM..."
                  value={reqJustification}
                  onChange={(e) => setReqJustification(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-md transition"
                >
                  Enviar para Aprovação ADM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECTION MODAL (MANDATORY REASON VALIDATION) */}
      {showRejectModal && selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-red-600 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                <h3 className="font-bold text-sm">Recusa de Solicitação da GUE</h3>
              </div>
              <button onClick={() => setShowRejectModal(false)} className="text-white/80 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <p><strong>Unidade:</strong> {selectedReq.gueName} ({selectedReq.gueCode})</p>
                <p><strong>Item:</strong> [{selectedReq.itemCode}] {selectedReq.itemName}</p>
                <p><strong>Quantidade:</strong> {selectedReq.quantity} unidades</p>
              </div>

              {rejectionError && (
                <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-lg text-xs font-semibold">
                  {rejectionError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-red-900 mb-1">
                  Motivo da Recusa (Preenchimento Estritamente Obrigatório) *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explique fundamentadamente o motivo da rejeição do pedido (ex: cota excedida, indisponibilidade no estoque central, falta de autorização médica)..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full text-xs rounded-lg border border-red-300 p-2.5 focus:ring-2 focus:ring-red-600 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-md transition"
                >
                  Confirmar Recusa com Justificativa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW GUE REGISTRATION MODAL */}
      {showNewGueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-blue-900 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Cadastrar Nova Unidade Externa (GUE)</h3>
              <button onClick={() => setShowNewGueModal(false)} className="text-white/80 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewGue} className="p-6 space-y-4">
              {newGueError && (
                <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-lg text-xs font-semibold">
                  {newGueError}
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Código *</label>
                  <input
                    type="text"
                    required
                    value={gueCode}
                    onChange={(e) => setGueCode(e.target.value.toUpperCase())}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 font-mono uppercase font-bold"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nome da Unidade *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Pronto Atendimento Oeste"
                    value={gueName}
                    onChange={(e) => setGueName(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Responsável *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Dra. Juliana Silveira"
                  value={gueResponsible}
                  onChange={(e) => setGueResponsible(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Telefone de Contato</label>
                <input
                  type="text"
                  placeholder="(11) 98888-7777"
                  value={guePhone}
                  onChange={(e) => setGuePhone(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Endereço da Unidade</label>
                <input
                  type="text"
                  placeholder="Rua / Avenida, Bairro..."
                  value={gueAddress}
                  onChange={(e) => setGueAddress(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewGueModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-md transition"
                >
                  Salvar Unidade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
