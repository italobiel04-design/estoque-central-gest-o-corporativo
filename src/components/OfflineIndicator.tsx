/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useOnlineStatus } from '../hooks/usePWAInstall';
import { Wifi, WifiOff, Cloud, CloudCheck, RefreshCw } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xl border border-amber-500 animate-bounce">
      <WifiOff className="w-4 h-4 text-white animate-pulse" />
      <div>
        <p className="font-bold">Modo Offline Ativo (Offline-First)</p>
        <p className="text-[10px] text-amber-100 font-normal">Operações na fila segura do IndexedDB local. Sincronização automática para a nuvem ao reconectar.</p>
      </div>
    </div>
  );
};

export const SyncStatusBar: React.FC<{ isOnline: boolean }> = ({ isOnline }) => {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      {isOnline ? (
        <span 
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 text-[11px] font-medium shadow-sm cursor-help"
          title="Nuvem Firebase Firestore ativa: sincronização em tempo real e concorrência atômica para mais de 10 computadores e celulares simultâneos."
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <Cloud className="w-3.5 h-3.5 text-emerald-300" />
          <span className="hidden sm:inline font-semibold">Nuvem em Tempo Real (10+ Aparelhos)</span>
        </span>
      ) : (
        <span 
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/40 text-[11px] font-medium"
          title="Modo Offline: gravações locais no navegador seguras; sincronização automática com a nuvem assim que recuperar sinal."
        >
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          <WifiOff className="w-3.5 h-3.5 text-amber-300" />
          <span>Fila Offline Salva</span>
        </span>
      )}
    </div>
  );
};
