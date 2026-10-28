/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  Archive,
  Download,
  Upload,
  Database,
  CheckCircle2,
  AlertTriangle,
  X,
  FileCheck,
  RefreshCw,
  HardDrive,
  ShieldCheck,
  Clock,
  User,
  Layers,
  ArrowRight
} from 'lucide-react';
import { UserProfile, BackupStats } from '../types';
import { StorageService } from '../services/storage';

interface BackupRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onBackupRestored: () => void;
}

export const BackupRecoveryModal: React.FC<BackupRecoveryModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onBackupRestored
}) => {
  const [activeTab, setActiveTab] = useState<'EXPORT' | 'IMPORT'>('EXPORT');
  const [isExporting, setIsExporting] = useState(false);
  const [exportStats, setExportStats] = useState<any>(null);

  // Import states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedBackup, setParsedBackup] = useState<any>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [restoreMode, setRestoreMode] = useState<'REPLACE' | 'MERGE'>('REPLACE');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreSuccessMsg, setRestoreSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    setRestoreSuccessMsg(null);
    try {
      const res = await StorageService.exportCompressedBackup(currentUser);
      setExportStats(res.stats);
      setTimeout(() => setIsExporting(false), 800);
    } catch (err: any) {
      alert(`Erro na exportação: ${err.message}`);
      setIsExporting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportError(null);
    setParsedBackup(null);
    setIsAnalyzing(true);
    setRestoreSuccessMsg(null);

    const res = await StorageService.parseBackupFile(file);
    setIsAnalyzing(false);

    if (!res.valid) {
      setImportError(res.error || 'Arquivo de backup inválido.');
    } else {
      setParsedBackup(res.payload);
    }
  };

  const handleExecuteRestore = () => {
    if (!parsedBackup) return;

    const confirmMsg = restoreMode === 'REPLACE'
      ? 'ATENÇÃO: A Substituição Total substituirá todos os materiais, máquinas, solicitações e configurações pelos dados do backup. Deseja prosseguir?'
      : 'Deseja mesclar os registros deste arquivo de backup com a base de dados atual?';

    if (confirm(confirmMsg)) {
      setIsRestoring(true);
      const res = StorageService.restoreFromBackupPayload(parsedBackup, currentUser, restoreMode);
      setIsRestoring(false);

      if (!res.success) {
        setImportError(res.error || 'Falha ao restaurar dados.');
      } else {
        setRestoreSuccessMsg(
          `Backup restaurado com êxito no modo ${restoreMode === 'REPLACE' ? 'Substituição Total' : 'Mesclagem'}!`
        );
        onBackupRestored();
        setTimeout(() => {
          onClose();
        }, 2200);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-blue-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Archive className="w-5 h-5 text-red-400" />
            <div>
              <h3 className="font-bold text-sm">Backup & Recuperação do Sistema (JSON Comprimido)</h3>
              <p className="text-[11px] text-blue-200">Camada corporativa extra de continuidade e contingência</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-blue-200 hover:text-white rounded-lg hover:bg-blue-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Sub-tab Switcher */}
          <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('EXPORT')}
              className={`flex-1 py-2.5 rounded-md transition flex items-center justify-center gap-2 ${
                activeTab === 'EXPORT'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Exportar Backup (.ecbak)</span>
            </button>
            <button
              onClick={() => setActiveTab('IMPORT')}
              className={`flex-1 py-2.5 rounded-md transition flex items-center justify-center gap-2 ${
                activeTab === 'IMPORT'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-4 h-4 text-amber-400" />
              <span>Importar & Restaurar Backup</span>
            </button>
          </div>

          {/* Success Notification */}
          {restoreSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2.5 shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{restoreSuccessMsg}</span>
            </div>
          )}

          {/* TAB: EXPORT COMPRESSED BACKUP */}
          {activeTab === 'EXPORT' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Snapshot Completo da Base de Dados</h4>
                    <p className="text-xs text-slate-500">
                      Exporta todo o inventário, máquinas, ordens de serviço, lavanderia, GUEs, auditoria e permissões.
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block">FORMATO</span>
                    <span className="font-mono font-bold text-blue-900">GZIP (.ecbak)</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block">COMPRESSÃO</span>
                    <span className="font-mono font-bold text-emerald-700">~75% Redução</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block">SEGURANÇA</span>
                    <span className="font-mono font-bold text-slate-800">Assinado ADM</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block">AUDITORIA</span>
                    <span className="font-mono font-bold text-slate-800">Log Registrado</span>
                  </div>
                </div>
              </div>

              {exportStats && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1.5 text-emerald-900">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Backup exportado com sucesso para a pasta de Downloads!</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 flex flex-wrap gap-4 pt-1 font-mono">
                    <span>Tamanho original: {(exportStats.originalSizeBytes / 1024).toFixed(1)} KB</span>
                    <span>Tamanho comprimido: {(exportStats.compressedSizeBytes / 1024).toFixed(1)} KB</span>
                    <span className="font-bold text-emerald-900">{exportStats.compressionRatio}</span>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={isExporting}
                  className="px-6 py-3 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition active:scale-95"
                >
                  <Download className="w-4 h-4 text-red-400" />
                  <span>{isExporting ? 'Comprimindo e Baixando...' : 'Baixar Backup Comprimido (.ecbak)'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB: IMPORT & RESTORE */}
          {activeTab === 'IMPORT' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".ecbak,.json.gz,.json,application/gzip,application/json"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-blue-600 bg-slate-50 hover:bg-blue-50/40 p-6 rounded-2xl text-center cursor-pointer transition space-y-2"
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6 text-blue-700" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-800">
                    Clique para selecionar o arquivo de backup (.ecbak ou .json)
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Suporta arquivos comprimidos pelo sistema ou backups JSON padrão
                  </p>
                </div>
                {importFile && (
                  <div className="pt-2 text-xs font-mono font-bold text-blue-900">
                    Arquivo selecionado: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>

              {/* Parsing status */}
              {isAnalyzing && (
                <div className="p-3 text-xs text-slate-600 text-center flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-900" />
                  <span>Descompactando e validando integridade do backup...</span>
                </div>
              )}

              {/* Error */}
              {importError && (
                <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Parsed Metadata Inspection (Safety preview before applying) */}
              {parsedBackup && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Backup Validado com Sucesso
                    </span>
                    <span className="font-mono text-[10px] bg-blue-100 text-blue-900 px-2 py-0.5 rounded font-bold">
                      Versão {parsedBackup.version}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-semibold">DATA DA EXPORTAÇÃO</span>
                      <span className="font-mono font-bold text-slate-800">
                        {new Date(parsedBackup.exportedAt).toLocaleDateString('pt-BR')} {new Date(parsedBackup.exportedAt).toLocaleTimeString('pt-BR')}
                      </span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-semibold">RESPONSÁVEL</span>
                      <span className="font-bold text-slate-800 truncate block">
                        {parsedBackup.exportedBy?.name} ({parsedBackup.exportedBy?.role})
                      </span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-semibold">MATERIAIS DE ESTOQUE</span>
                      <span className="font-mono font-bold text-blue-900">
                        {parsedBackup.data?.materials?.length || 0} itens
                      </span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-semibold">MÁQUINAS / OS</span>
                      <span className="font-mono font-bold text-blue-900">
                        {parsedBackup.data?.machines?.length || 0} máq. / {parsedBackup.data?.osList?.length || 0} OS
                      </span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-semibold">LAVANDERIA</span>
                      <span className="font-mono font-bold text-blue-900">
                        {parsedBackup.data?.laundryRecords?.length || 0} envios
                      </span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-semibold">TRILHA DE AUDITORIA</span>
                      <span className="font-mono font-bold text-blue-900">
                        {parsedBackup.data?.auditLogs?.length || 0} registros
                      </span>
                    </div>
                  </div>

                  {/* Mode Selector */}
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Modo de Restauração</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRestoreMode('REPLACE')}
                        className={`p-2.5 rounded-xl border text-left transition ${
                          restoreMode === 'REPLACE'
                            ? 'bg-red-50 border-red-500 text-red-900'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="font-bold flex items-center justify-between">
                          <span>Substituição Completa</span>
                          {restoreMode === 'REPLACE' && <CheckCircle2 className="w-3.5 h-3.5 text-red-600" />}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Substitui 100% da base pelos dados deste arquivo (Recomendado para recuperação de desastre).
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRestoreMode('MERGE')}
                        className={`p-2.5 rounded-xl border text-left transition ${
                          restoreMode === 'MERGE'
                            ? 'bg-blue-50 border-blue-500 text-blue-900'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="font-bold flex items-center justify-between">
                          <span>Mesclagem Inteligente</span>
                          {restoreMode === 'MERGE' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Preserva registros existentes e insere novos itens do backup.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleExecuteRestore}
                      disabled={isRestoring}
                      className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2 active:scale-95"
                    >
                      <HardDrive className="w-4 h-4" />
                      <span>{isRestoring ? 'Restaurando Base de Dados...' : 'Executar Restauração Agora'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
