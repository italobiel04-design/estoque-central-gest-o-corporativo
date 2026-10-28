/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Printer, QrCode, Tag, Check, Copy, FileDown, CheckCircle } from 'lucide-react';
import { MaterialItem, MachineEquipment } from '../types';
import { generateQRCodeSVG } from '../utils/qrCode';
import { exportSingleQRLabelPDF } from '../utils/pdfGenerator';

interface QRLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  materials: MaterialItem[];
  machines: MachineEquipment[];
  preselectedCode?: string;
}

export const QRLabelModal: React.FC<QRLabelModalProps> = ({
  isOpen,
  onClose,
  materials,
  machines,
  preselectedCode
}) => {
  const [selectedType, setSelectedType] = useState<'MATERIAL' | 'MAQUINA' | 'PRATELEIRA'>('MATERIAL');
  const [selectedItemId, setSelectedItemId] = useState<string>(
    preselectedCode ? (materials.find(m => m.code === preselectedCode)?.id || materials[0]?.id || '') : (materials[0]?.id || '')
  );
  const [customShelf, setCustomShelf] = useState('PRAT-A01-N2');
  const [printStatus, setPrintStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentMaterial = materials.find(m => m.id === selectedItemId) || materials[0];
  const currentMachine = machines.find(m => m.id === selectedItemId) || machines[0];

  let labelCode = '';
  let labelTitle = '';
  let labelSubtitle = '';
  let labelLocation = '';

  if (selectedType === 'MATERIAL' && currentMaterial) {
    labelCode = currentMaterial.code;
    labelTitle = currentMaterial.name;
    labelSubtitle = `Categoria: ${currentMaterial.category} | Unid: ${currentMaterial.unit}`;
    labelLocation = currentMaterial.shelfLocation;
  } else if (selectedType === 'MAQUINA' && currentMachine) {
    labelCode = currentMachine.code;
    labelTitle = currentMachine.name;
    labelSubtitle = `Setor: ${currentMachine.sectorFloor} | Condição: ${currentMachine.operationalCondition}`;
    labelLocation = currentMachine.sectorFloor;
  } else {
    labelCode = customShelf;
    labelTitle = `Etiqueta de Prateleira / Nicho: ${customShelf}`;
    labelSubtitle = 'Almoxarifado Central de Suprimentos';
    labelLocation = 'Área de Estocagem Primária';
  }

  const qrSvg = generateQRCodeSVG(labelCode, 140);

  // Ultra-reliable standalone iframe printing technique (works even inside sandboxed iframes)
  const handleDirectPrint = () => {
    setPrintStatus('Enviando para a impressora...');
    try {
      const existingFrame = document.getElementById('print-label-hidden-frame');
      if (existingFrame) existingFrame.remove();

      const printIframe = document.createElement('iframe');
      printIframe.id = 'print-label-hidden-frame';
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = '0';
      document.body.appendChild(printIframe);

      const labelHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <title>Imprimir Etiqueta - ${labelCode}</title>
          <style>
            @page {
              size: 100mm 60mm;
              margin: 4mm;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: system-ui, -apple-system, sans-serif;
              background: #fff;
              color: #000;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100%;
            }
            .label-box {
              width: 92mm;
              height: 52mm;
              border: 2px solid #0f172a;
              border-radius: 6px;
              padding: 8px 12px;
              box-sizing: border-box;
              display: flex;
              gap: 12px;
              align-items: center;
            }
            .qr-col {
              width: 32mm;
              height: 32mm;
              flex-shrink: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 1px solid #cbd5e1;
              border-radius: 4px;
            }
            .qr-col svg {
              width: 100%;
              height: 100%;
            }
            .info-col {
              flex: 1;
              min-width: 0;
            }
            .header-bar {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 3px;
              margin-bottom: 4px;
            }
            .brand {
              font-size: 10px;
              font-weight: 900;
              color: #1e3a8a;
              letter-spacing: 0.5px;
            }
            .loc-pill {
              font-size: 9px;
              font-weight: bold;
              background: #dc2626;
              color: #fff;
              padding: 2px 6px;
              border-radius: 3px;
            }
            .code {
              font-size: 14px;
              font-weight: 900;
              font-family: monospace;
              letter-spacing: 0.5px;
              margin-bottom: 2px;
            }
            .title {
              font-size: 10px;
              font-weight: bold;
              line-height: 1.2;
              max-height: 24px;
              overflow: hidden;
              margin-bottom: 4px;
            }
            .sub {
              font-size: 8px;
              color: #475569;
              margin-bottom: 6px;
            }
            .footer-line {
              font-size: 7px;
              color: #94a3b8;
              font-family: monospace;
              display: flex;
              justify-content: space-between;
              border-top: 1px dashed #cbd5e1;
              padding-top: 3px;
            }
          </style>
        </head>
        <body>
          <div class="label-box">
            <div class="qr-col">
              ${qrSvg}
            </div>
            <div class="info-col">
              <div class="header-bar">
                <span class="brand">ESTOQUE CENTRAL</span>
                <span class="loc-pill">${labelLocation}</span>
              </div>
              <div class="code">${labelCode}</div>
              <div class="title">${labelTitle}</div>
              <div class="sub">${labelSubtitle}</div>
              <div class="footer-line">
                <span>AUDITADO</span>
                <span>${new Date().toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.focus();
              window.print();
            };
          </script>
        </body>
        </html>
      `;

      const frameDoc = printIframe.contentDocument || printIframe.contentWindow?.document;
      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(labelHtml);
        frameDoc.close();
      }

      setTimeout(() => {
        setPrintStatus('Etiqueta enviada para o diálogo de impressão!');
        setTimeout(() => setPrintStatus(null), 4000);
      }, 500);
    } catch (err) {
      console.warn('Iframe print error, falling back to window.print()', err);
      window.print();
      setPrintStatus('Diálogo de impressão acionado.');
      setTimeout(() => setPrintStatus(null), 3000);
    }
  };

  const handleDownloadPDFLabel = () => {
    setPrintStatus('Gerando PDF padrão 100x60mm...');
    exportSingleQRLabelPDF({
      code: labelCode,
      title: labelTitle,
      subtitle: labelSubtitle,
      location: labelLocation
    });
    setPrintStatus('PDF da etiqueta gerado e baixado com sucesso!');
    setTimeout(() => setPrintStatus(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="bg-blue-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <QrCode className="w-5 h-5 text-red-400" />
            <div>
              <h3 className="font-bold text-sm">Gerador e Impressão de Etiquetas QR Code</h3>
              <p className="text-[11px] text-blue-200">Padronização visual corporativa de prateleiras e ativos</p>
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
          {/* Feedback banner */}
          {printStatus && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-pulse">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{printStatus}</span>
            </div>
          )}

          {/* Type Selector */}
          <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => {
                setSelectedType('MATERIAL');
                if (materials[0]) setSelectedItemId(materials[0].id);
              }}
              className={`flex-1 py-2 rounded-md transition ${selectedType === 'MATERIAL' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Materiais de Estoque
            </button>
            <button
              onClick={() => {
                setSelectedType('MAQUINA');
                if (machines[0]) setSelectedItemId(machines[0].id);
              }}
              className={`flex-1 py-2 rounded-md transition ${selectedType === 'MAQUINA' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Máquinas & Equipamentos
            </button>
            <button
              onClick={() => setSelectedType('PRATELEIRA')}
              className={`flex-1 py-2 rounded-md transition ${selectedType === 'PRATELEIRA' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Nicho / Prateleira
            </button>
          </div>

          {/* Selector Dropdown */}
          {selectedType === 'MATERIAL' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Selecione o Material</label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              >
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    [{m.code}] {m.name} ({m.shelfLocation}) - Saldo: {m.currentStock} {m.unit}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedType === 'MAQUINA' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Selecione o Equipamento</label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              >
                {machines.map((m) => (
                  <option key={m.id} value={m.id}>
                    [{m.code}] {m.name} - {m.sectorFloor} ({m.status})
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedType === 'PRATELEIRA' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Código da Prateleira / Nicho</label>
              <input
                type="text"
                value={customShelf}
                onChange={(e) => setCustomShelf(e.target.value.toUpperCase())}
                placeholder="Ex: PRAT-C03-N1"
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 font-mono uppercase focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>
          )}

          {/* Printable Label Preview Box */}
          <div className="border border-slate-300 rounded-xl p-4 bg-slate-50 flex flex-col items-center">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
              Prévia da Etiqueta Padrão Térmica / Adesiva (100x60mm)
            </span>

            <div
              id="printable-label"
              className="w-full max-w-md bg-white border-2 border-slate-900 rounded-lg p-4 shadow-sm flex gap-4 items-center"
            >
              {/* QR Code Container */}
              <div
                className="w-32 h-32 flex-shrink-0 flex items-center justify-center p-1 bg-white border border-slate-300 rounded-md"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />

              {/* Label Content */}
              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                  <span className="text-[10px] font-extrabold text-blue-900 tracking-wider">ESTOQUE CENTRAL</span>
                  <span className="text-[9px] font-mono font-bold text-white bg-red-600 px-1.5 py-0.5 rounded">
                    {labelLocation}
                  </span>
                </div>

                <div className="text-base font-black font-mono text-slate-900 tracking-wide">{labelCode}</div>
                <div className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight">{labelTitle}</div>
                <div className="text-[10px] text-slate-600 truncate">{labelSubtitle}</div>

                <div className="pt-1 flex items-center justify-between text-[9px] text-slate-400 font-mono border-t border-dashed border-slate-200">
                  <span>SISTEMA AUDITADO</span>
                  <span>{new Date().toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons: Both Direct Print and PDF Download */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition"
            >
              Fechar
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadPDFLabel}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
                title="Baixar arquivo PDF padrão pronto para impressão"
              >
                <FileDown className="w-4 h-4 text-emerald-400" />
                <span>Baixar Etiqueta em PDF</span>
              </button>

              <button
                type="button"
                onClick={handleDirectPrint}
                className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-md transition active:scale-95"
              >
                <Printer className="w-4 h-4 text-red-400" />
                <span>Imprimir Agora</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
