/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, Check } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return (
      <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-900/60 border border-blue-700/60 text-xs text-blue-200">
        <Check className="w-3.5 h-3.5 text-emerald-400" />
        <span>PWA Instalado</span>
      </div>
    );
  }

  return (
    <>
      {isInstallable && (
        <button
          onClick={install}
          className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-700 active:scale-95 transition"
          title="Instalar ESTOQUE CENTRAL no dispositivo"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Instalar App</span>
        </button>
      )}

      {isIOS && !isInstallable && (
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-800/80 hover:bg-blue-800 border border-blue-600 px-2.5 py-1.5 text-xs font-medium text-white transition"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Instalar no iOS</span>
        </button>
      )}

      {/* Manual installation hint button for Chrome / Edge if prompt not triggered yet */}
      {!isInstallable && !isIOS && !isInstalled && (
        <button
          onClick={() => alert('Para instalar o ESTOQUE CENTRAL, clique no ícone de instalação no canto da barra de endereço do seu navegador (ou no menu ⋮ > Instalar aplicativo).')}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-800/60 hover:bg-blue-800 border border-blue-700 text-xs text-blue-100 transition"
          title="Instalar PWA no Desktop / Android"
        >
          <Download className="w-3 h-3 text-red-300" />
          <span>App PWA</span>
        </button>
      )}

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-blue-900 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-600" />
                Instalar no iPhone / iPad
              </h3>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-xs leading-relaxed text-slate-600">
              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs">1</span>
                <p>Toque no botão de <strong>Compartilhar</strong> (ícone do quadrado com a seta para cima) na barra do Safari.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs">2</span>
                <p>Role para baixo nas opções e toque em <strong>"Adicionar à Tela de Início"</strong>.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs">3</span>
                <p>Confirme clicando em <strong>Adicionar</strong>. O aplicativo funcionará em tela cheia com suporte offline!</p>
              </div>
            </div>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-lg bg-blue-900 py-2.5 text-xs font-semibold text-white hover:bg-blue-800 transition"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
