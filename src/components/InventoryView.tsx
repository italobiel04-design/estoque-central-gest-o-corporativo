/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Package,
  Plus,
  Minus,
  Search,
  Filter,
  Scan,
  Printer,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle,
  X,
  Edit2,
  Trash2,
  Tag,
  MapPin,
  TrendingUp
} from 'lucide-react';
import { MaterialItem, MaterialCategory, UserProfile } from '../types';
import { StorageService } from '../services/storage';

interface InventoryViewProps {
  materials: MaterialItem[];
  currentUser: UserProfile;
  minThreshold: number;
  onOpenScanner: () => void;
  onOpenLabels: (code?: string) => void;
  onOpenABCAnalysis?: () => void;
  filterCode?: string;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  materials,
  currentUser,
  minThreshold,
  onOpenScanner,
  onOpenLabels,
  onOpenABCAnalysis,
  filterCode
}) => {
  const [searchTerm, setSearchTerm] = useState(filterCode || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Modals
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [movementType, setMovementType] = useState<'ENTRADA' | 'SAIDA'>('ENTRADA');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(materials[0]?.id || '');
  const [movementQty, setMovementQty] = useState<number>(1);
  const [movementReason, setMovementReason] = useState('');
  const [movementDoc, setMovementDoc] = useState('');
  const [movementThirdParty, setMovementThirdParty] = useState('');
  const [movementError, setMovementError] = useState<string | null>(null);

  // Material Creation / Edit Modal
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialItem | null>(null);
  const [matCode, setMatCode] = useState('');
  const [matName, setMatName] = useState('');
  const [matCategory, setMatCategory] = useState<MaterialCategory>('EPIs e Segurança');
  const [matUnit, setMatUnit] = useState('Unidade');
  const [matStock, setMatStock] = useState<number>(100);
  const [matMinStock, setMatMinStock] = useState<number>(minThreshold);
  const [matShelf, setMatShelf] = useState('PRAT-A01-N1');
  const [matPrice, setMatPrice] = useState<number>(10.0);
  const [matDesc, setMatDesc] = useState('');
  const [matError, setMatError] = useState<string | null>(null);

  // Filter materials
  const filteredMaterials = materials.filter((m) => {
    const matchesSearch =
      m.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.shelfLocation.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'TODAS' || m.category === selectedCategory;
    const matchesLowStock = !showLowStockOnly || m.currentStock <= minThreshold;

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const openMovement = (type: 'ENTRADA' | 'SAIDA', preselectId?: string) => {
    setMovementType(type);
    setSelectedMaterialId(preselectId || materials[0]?.id || '');
    setMovementQty(1);
    setMovementReason('');
    setMovementDoc('');
    setMovementThirdParty(type === 'ENTRADA' ? 'Distribuidora Oficial' : 'Setor Operacional');
    setMovementError(null);
    setShowMovementModal(true);
  };

  const handleConfirmMovement = (e: React.FormEvent) => {
    e.preventDefault();
    setMovementError(null);

    const result = StorageService.performStockMovement({
      type: movementType,
      itemId: selectedMaterialId,
      quantity: Number(movementQty),
      reason: movementReason || (movementType === 'ENTRADA' ? 'Entrada regular de estoque' : 'Consumo regular interno'),
      supplierOrReceiver: movementThirdParty || 'Não especificado',
      documentNumber: movementDoc || `DOC-${Date.now().toString().slice(-5)}`,
      actor: currentUser
    });

    if (!result.success) {
      setMovementError(result.error || 'Erro ao processar movimentação.');
    } else {
      setShowMovementModal(false);
    }
  };

  const openNewMaterial = () => {
    setEditingMaterial(null);
    setMatCode(`MAT-${Math.floor(100 + Math.random() * 900)}`);
    setMatName('');
    setMatCategory('EPIs e Segurança');
    setMatUnit('Unidade');
    setMatStock(50);
    setMatMinStock(minThreshold);
    setMatShelf('PRAT-A01-N1');
    setMatPrice(25.0);
    setMatDesc('');
    setMatError(null);
    setShowMaterialModal(true);
  };

  const openEditMaterial = (m: MaterialItem) => {
    setEditingMaterial(m);
    setMatCode(m.code);
    setMatName(m.name);
    setMatCategory(m.category);
    setMatUnit(m.unit);
    setMatStock(m.currentStock);
    setMatMinStock(m.minimumStock);
    setMatShelf(m.shelfLocation);
    setMatPrice(m.unitPrice);
    setMatDesc(m.description || '');
    setMatError(null);
    setShowMaterialModal(true);
  };

  const handleSaveMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    setMatError(null);

    if (!matCode.trim() || !matName.trim()) {
      setMatError('Código e Nome do material são obrigatórios.');
      return;
    }

    const payload: MaterialItem = {
      id: editingMaterial ? editingMaterial.id : `mat-${Date.now()}`,
      code: matCode.trim().toUpperCase(),
      name: matName.trim(),
      category: matCategory,
      unit: matUnit,
      currentStock: Number(matStock),
      minimumStock: Number(matMinStock),
      shelfLocation: matShelf.trim().toUpperCase(),
      unitPrice: Number(matPrice),
      description: matDesc.trim(),
      lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    const res = StorageService.saveMaterial(payload, currentUser);
    if (!res.success) {
      setMatError(res.error || 'Erro ao salvar material.');
    } else {
      setShowMaterialModal(false);
    }
  };

  const handleDeleteMaterial = (m: MaterialItem) => {
    if (confirm(`Tem certeza que deseja excluir o material ${m.code} - ${m.name}? Essa ação será registrada na trilha de auditoria.`)) {
      StorageService.deleteMaterial(m.id, currentUser);
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-900" />
            Catálogo & Movimentação de Estoque Central
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Registro transacional de entradas, saídas com código de barras/QR e prateleiras.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {currentUser.role === 'ADM' && (
            <button
              onClick={openNewMaterial}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition shadow-xs"
            >
              <Plus className="w-4 h-4 text-red-400" />
              <span>Novo Material</span>
            </button>
          )}

          <button
            onClick={() => openMovement('ENTRADA')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>Registrar Entrada</span>
          </button>

          <button
            onClick={() => openMovement('SAIDA')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-xs"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Registrar Saída</span>
          </button>

          <button
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
          >
            <Scan className="w-4 h-4 text-red-400" />
            <span>Escanear QR</span>
          </button>

          <button
            onClick={() => onOpenLabels()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold transition"
          >
            <Printer className="w-4 h-4 text-blue-700" />
            <span>Etiquetas</span>
          </button>

          {onOpenABCAnalysis && (
            <button
              onClick={onOpenABCAnalysis}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition shadow-xs"
              title="Abrir Análise de Curva ABC e Previsão de Autonomia"
            >
              <TrendingUp className="w-4 h-4 text-blue-200" />
              <span>Curva ABC (Pareto)</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por código, nome ou prateleira..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-700 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
          >
            <option value="TODAS">Todas as Categorias</option>
            <option value="EPIs e Segurança">EPIs e Segurança</option>
            <option value="Higienização e Limpeza">Higienização e Limpeza</option>
            <option value="Enxoval e Rouparia">Enxoval e Rouparia</option>
            <option value="Insumos Hospitalares">Insumos Hospitalares</option>
            <option value="Manutenção e Peças">Manutenção e Peças</option>
          </select>

          {/* Toggle Low Stock */}
          <button
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition ${
              showLowStockOnly
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Apenas Críticos (&le; {minThreshold})</span>
          </button>
        </div>
      </div>

      {/* Materials Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-blue-900 text-white uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Código / QR</th>
                <th className="px-5 py-3.5">Descrição do Material</th>
                <th className="px-5 py-3.5">Categoria</th>
                <th className="px-5 py-3.5">Prateleira / Nicho</th>
                <th className="px-5 py-3.5 text-right">Saldo Atual</th>
                <th className="px-5 py-3.5 text-center">Nível</th>
                <th className="px-5 py-3.5 text-right">Valor Unit.</th>
                <th className="px-5 py-3.5 text-center">Ações Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-500">
                    Nenhum material localizado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((item) => {
                  const isCritical = item.currentStock <= minThreshold;
                  const isModerate = item.currentStock > minThreshold && item.currentStock <= 100;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-blue-50/30 transition ${isCritical ? 'bg-red-50/30' : ''}`}
                    >
                      <td className="px-5 py-3.5 font-mono font-bold">
                        <span className="text-blue-950 font-black">{item.code}</span>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        {item.description && (
                          <div className="text-[10px] text-slate-500 truncate max-w-xs">{item.description}</div>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-slate-600 font-medium">{item.category}</td>

                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          <MapPin className="w-3 h-3 text-red-500" />
                          {item.shelfLocation}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <span
                          className={`font-black font-mono text-sm ${
                            isCritical ? 'text-red-600' : isModerate ? 'text-amber-600' : 'text-emerald-700'
                          }`}
                        >
                          {item.currentStock} {item.unit}
                        </span>
                        <div className="text-[10px] text-slate-400">Mín: {item.minimumStock}</div>
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        {isCritical ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
                            Crítico
                          </span>
                        ) : isModerate ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                            Moderado
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Conforme
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-right font-mono text-slate-700">
                        R$ {item.unitPrice.toFixed(2)}
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openMovement('ENTRADA', item.id)}
                            className="p-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                            title="Entrada rápida"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => openMovement('SAIDA', item.id)}
                            className="p-1 rounded bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                            title="Saída rápida"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onOpenLabels(item.code)}
                            className="p-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                            title="Imprimir Etiqueta QR"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {currentUser.role === 'ADM' && (
                            <>
                              <button
                                onClick={() => openEditMaterial(item)}
                                className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200"
                                title="Editar dados"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteMaterial(item)}
                                className="p-1 rounded bg-red-50 text-red-600 hover:bg-red-100"
                                title="Excluir material"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Movement Modal (Entrada / Saída) */}
      {showMovementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className={`px-6 py-4 text-white flex items-center justify-between ${
              movementType === 'ENTRADA' ? 'bg-emerald-700' : 'bg-red-600'
            }`}>
              <div className="flex items-center gap-2">
                {movementType === 'ENTRADA' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                <h3 className="font-bold text-sm">
                  {movementType === 'ENTRADA' ? 'Registrar Entrada de Material no Estoque' : 'Registrar Saída / Baixa Operacional'}
                </h3>
              </div>
              <button onClick={() => setShowMovementModal(false)} className="text-white/80 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmMovement} className="p-6 space-y-4">
              {movementError && (
                <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-lg text-xs font-semibold">
                  {movementError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Material Selecionado</label>
                <select
                  value={selectedMaterialId}
                  onChange={(e) => setSelectedMaterialId(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white font-medium focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      [{m.code}] {m.name} — Saldo: {m.currentStock} {m.unit} ({m.shelfLocation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quantidade</label>
                  <input
                    type="number"
                    min="1"
                    value={movementQty}
                    onChange={(e) => setMovementQty(parseInt(e.target.value, 10) || 1)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 font-bold font-mono focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nº do Documento (NF-e / REQ)</label>
                  <input
                    type="text"
                    placeholder="Ex: NF-8912 ou REQ-44"
                    value={movementDoc}
                    onChange={(e) => setMovementDoc(e.target.value.toUpperCase())}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 font-mono focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {movementType === 'ENTRADA' ? 'Fornecedor / Origem' : 'Destinatário / Setor Requisitante'}
                </label>
                <input
                  type="text"
                  placeholder={movementType === 'ENTRADA' ? 'Ex: Distribuidora MedSupply Ltda' : 'Ex: UTI Neonatal, Bloco Cirúrgico, Dr. Marcos'}
                  value={movementThirdParty}
                  onChange={(e) => setMovementThirdParty(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Motivo / Justificativa</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Reposição periódica de lote, consumo para cirurgia agendada..."
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMovementModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-xs font-bold text-white rounded-lg shadow-md transition ${
                    movementType === 'ENTRADA' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Confirmar {movementType === 'ENTRADA' ? 'Entrada' : 'Saída'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Material Creation / Edit Modal */}
      {showMaterialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="bg-blue-900 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingMaterial ? 'Editar Cadastro de Material' : 'Cadastrar Novo Material no Estoque Central'}
              </h3>
              <button onClick={() => setShowMaterialModal(false)} className="text-white/80 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMaterial} className="p-6 space-y-4">
              {matError && (
                <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-lg text-xs font-semibold">
                  {matError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Código do Item (SKU)</label>
                  <input
                    type="text"
                    value={matCode}
                    onChange={(e) => setMatCode(e.target.value.toUpperCase())}
                    placeholder="Ex: MAT-EPI-01"
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 font-mono uppercase font-bold focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Categoria</label>
                  <select
                    value={matCategory}
                    onChange={(e) => setMatCategory(e.target.value as MaterialCategory)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  >
                    <option value="EPIs e Segurança">EPIs e Segurança</option>
                    <option value="Higienização e Limpeza">Higienização e Limpeza</option>
                    <option value="Enxoval e Rouparia">Enxoval e Rouparia</option>
                    <option value="Insumos Hospitalares">Insumos Hospitalares</option>
                    <option value="Manutenção e Peças">Manutenção e Peças</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Material / Descrição Curta</label>
                <input
                  type="text"
                  value={matName}
                  onChange={(e) => setMatName(e.target.value)}
                  placeholder="Ex: Luva de Nitrílica Descartável Tamanho G"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 font-medium focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unidade</label>
                  <input
                    type="text"
                    value={matUnit}
                    onChange={(e) => setMatUnit(e.target.value)}
                    placeholder="Unidade, Caixa 100un, Frasco 1L"
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Saldo Atual</label>
                  <input
                    type="number"
                    value={matStock}
                    onChange={(e) => setMatStock(parseInt(e.target.value, 10) || 0)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 font-mono font-bold focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Estoque Mínimo</label>
                  <input
                    type="number"
                    value={matMinStock}
                    onChange={(e) => setMatMinStock(parseInt(e.target.value, 10) || 50)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 font-mono font-bold focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Localização (Prateleira / Nicho)</label>
                  <input
                    type="text"
                    value={matShelf}
                    onChange={(e) => setMatShelf(e.target.value.toUpperCase())}
                    placeholder="Ex: PRAT-B02-N3"
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 font-mono uppercase focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Preço Unitário (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={matPrice}
                    onChange={(e) => setMatPrice(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 font-mono focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Detalhes Adicionais</label>
                <textarea
                  rows={2}
                  value={matDesc}
                  onChange={(e) => setMatDesc(e.target.value)}
                  placeholder="Informações técnicas, instruções de armazenamento..."
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMaterialModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-md transition"
                >
                  Salvar no Catálogo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
