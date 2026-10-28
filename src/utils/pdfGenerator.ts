/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import { MaterialItem, MachineEquipment, ExternalUnitGUE, AuditLogEntry, UserProfile, ServiceOrderOS, LaundryRecord } from '../types';

export function exportGeneralInventoryPDF(params: {
  materials: MaterialItem[];
  machines: MachineEquipment[];
  osList: ServiceOrderOS[];
  laundryRecords: LaundryRecord[];
  currentUser: UserProfile;
  minThreshold: number;
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner - Deep Corporate Navy Blue (#1E3A8A)
  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, pageWidth, 26, 'F');

  // Red Accent Line (#DC2626)
  doc.setFillColor(220, 38, 38);
  doc.rect(0, 26, pageWidth, 2.5, 'F');

  // Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('ESTOQUE CENTRAL | RELATÓRIO EXECUTIVO GERAL', 14, 12);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Emissão: ${new Date().toLocaleString('pt-BR')}  |  Emitido por: ${params.currentUser.name} (${params.currentUser.role})`, 14, 20);

  let y = 36;

  // KPI Summary Cards
  const criticalItems = params.materials.filter(m => m.currentStock <= params.minThreshold);
  const totalStockValue = params.materials.reduce((acc, m) => acc + (m.currentStock * m.unitPrice), 0);
  const defectiveMachines = params.machines.filter(m => m.operationalCondition === 'COM_DEFEITO' || m.status === 'MANUTENCAO_OS');
  const pendingLaundry = params.laundryRecords.filter(l => l.status === 'PECA_PENDENTE');

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, y, pageWidth - 28, 22, 2, 2, 'F');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMO EXECUTIVO DE OPERAÇÕES EM TEMPO REAL', 18, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Total de Itens: ${params.materials.length}`, 18, y + 14);
  doc.text(`Valor Avaliado em Estoque: R$ ${totalStockValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 65, y + 14);
  
  // Highlight critical alerts in red
  doc.setTextColor(220, 38, 38);
  doc.setFont('helvetica', 'bold');
  doc.text(`Alertas de Estoque Mínimo (<= ${params.minThreshold}): ${criticalItems.length}`, 18, y + 19);
  doc.text(`Máquinas c/ Avaria/OS: ${defectiveMachines.length}`, 95, y + 19);
  doc.text(`Pendências Lavanderia: ${pendingLaundry.length}`, 145, y + 19);

  y += 28;

  // SECTION 1: CRITICAL STOCK ALERTS
  doc.setFillColor(220, 38, 38);
  doc.rect(14, y, pageWidth - 28, 6.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('1. ALERTAS CRÍTICOS - ITENS COM SALDO IGUAL OU ABAIXO DO MÍNIMO', 18, y + 4.5);

  y += 9;

  // Table Header
  doc.setFillColor(226, 232, 240);
  doc.rect(14, y, pageWidth - 28, 6, 'F');
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('CÓDIGO', 16, y + 4);
  doc.text('DESCRIÇÃO DO MATERIAL', 45, y + 4);
  doc.text('LOCALIZAÇÃO', 115, y + 4);
  doc.text('SALDO ATUAL', 145, y + 4);
  doc.text('LIMITE MÍN.', 175, y + 4);

  y += 7;

  if (criticalItems.length === 0) {
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'italic');
    doc.text('Nenhum item em estado crítico no momento. Estoque plenamente abastecido.', 16, y + 4);
    y += 8;
  } else {
    criticalItems.forEach((item) => {
      doc.setFillColor(254, 242, 242);
      doc.rect(14, y - 1, pageWidth - 28, 5.5, 'F');

      doc.setTextColor(185, 28, 28);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(item.code, 16, y + 3);

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'normal');
      doc.text(item.name.substring(0, 40), 45, y + 3);
      doc.text(item.shelfLocation, 115, y + 3);

      doc.setTextColor(220, 38, 38);
      doc.setFont('helvetica', 'bold');
      doc.text(`${item.currentStock} ${item.unit}`, 145, y + 3);

      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'normal');
      doc.text(`${item.minimumStock}`, 175, y + 3);

      y += 6;
    });
  }

  y += 6;

  // SECTION 2: INVENTORY TABLE
  doc.setFillColor(30, 58, 138);
  doc.rect(14, y, pageWidth - 28, 6.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('2. CATÁLOGO COMPLETO DE MATERIAIS NO ESTOQUE CENTRAL', 18, y + 4.5);

  y += 9;

  doc.setFillColor(226, 232, 240);
  doc.rect(14, y, pageWidth - 28, 6, 'F');
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('CÓDIGO', 16, y + 4);
  doc.text('NOME DO MATERIAL', 45, y + 4);
  doc.text('CATEGORIA', 105, y + 4);
  doc.text('PRATELEIRA', 145, y + 4);
  doc.text('SALDO', 178, y + 4);

  y += 7;

  params.materials.forEach((m) => {
    if (y > 275) {
      doc.addPage();
      y = 20;
    }

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(m.code, 16, y + 3);
    doc.text(m.name.substring(0, 35), 45, y + 3);
    doc.text(m.category.substring(0, 20), 105, y + 3);
    doc.text(m.shelfLocation, 145, y + 3);

    if (m.currentStock <= params.minThreshold) {
      doc.setTextColor(220, 38, 38);
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setTextColor(16, 185, 129);
      doc.setFont('helvetica', 'bold');
    }
    doc.text(`${m.currentStock}`, 178, y + 3);

    y += 5.5;
  });

  // Footer on last page
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Documento gerado pelo Sistema Corporativo ESTOQUE CENTRAL - Criptografia SHA-256 e Trilha de Auditoria Ativa.', 14, 290);

  doc.save(`Relatorio_Estoque_Central_${new Date().toISOString().substring(0, 10)}.pdf`);
}

export function exportGUEConsumptionPDF(params: {
  gues: ExternalUnitGUE[];
  currentUser: UserProfile;
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, pageWidth, 26, 'F');
  doc.setFillColor(220, 38, 38);
  doc.rect(0, 26, pageWidth, 2.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('ESTOQUE CENTRAL | CONSUMO DE UNIDADES EXTERNAS (GUE)', 14, 12);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Data: ${new Date().toLocaleString('pt-BR')}  |  Gestor: ${params.currentUser.name}`, 14, 20);

  let y = 36;

  params.gues.forEach((gue, idx) => {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    // GUE Header Box
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, y, pageWidth - 28, 14, 2, 2, 'F');

    doc.setTextColor(30, 58, 138);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`${idx + 1}. [${gue.code}] ${gue.name}`, 18, y + 6);

    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Responsável: ${gue.responsibleName}  |  Contato: ${gue.contactPhone}  |  Endereço: ${gue.address}`, 18, y + 11);

    y += 18;

    // Sub-Stock Table
    doc.setFillColor(30, 58, 138);
    doc.rect(14, y, pageWidth - 28, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('CÓDIGO MATERIAL', 18, y + 4);
    doc.text('DESCRIÇÃO DO ITEM NO SUB-ESTOQUE GUE', 60, y + 4);
    doc.text('QUANTIDADE ALOCADA', 150, y + 4);

    y += 7;

    if (gue.subStock.length === 0) {
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.text('Nenhum item atualmente alocado no sub-estoque desta unidade.', 18, y + 4);
      y += 8;
    } else {
      gue.subStock.forEach((sub) => {
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text(sub.itemCode, 18, y + 3);
        doc.text(sub.itemName, 60, y + 3);
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 58, 138);
        doc.text(`${sub.quantity} unidades`, 150, y + 3);
        y += 5.5;
      });
    }

    y += 8;
  });

  doc.save(`Relatorio_Consumo_GUEs_${new Date().toISOString().substring(0, 10)}.pdf`);
}

export function exportAuditTrailPDF(params: {
  logs: AuditLogEntry[];
  currentUser: UserProfile;
  filterUser?: string;
  filterCRUD?: string;
  filterModule?: string;
}) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, pageWidth, 24, 'F');
  doc.setFillColor(220, 38, 38);
  doc.rect(0, 24, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('ESTOQUE CENTRAL | TRILHA DE AUDITORIA E CONFORMIDADE REGULATÓRIA (CRUD)', 14, 11);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Gerado em: ${new Date().toLocaleString('pt-BR')}  |  Auditado por: ${params.currentUser.name} (${params.currentUser.role})  |  Total de Registros: ${params.logs.length}`,
    14,
    19
  );

  let y = 32;

  // Filter Summary Box
  doc.setFillColor(248, 250, 252);
  doc.rect(14, y, pageWidth - 28, 8, 'F');
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(7.5);
  doc.text(`Filtros Ativos: [Usuário: ${params.filterUser || 'Todos'}] | [Operação: ${params.filterCRUD || 'Todas'}] | [Módulo: ${params.filterModule || 'Todos'}]`, 18, y + 5);

  y += 12;

  // Table Columns Header
  doc.setFillColor(30, 58, 138);
  doc.rect(14, y, pageWidth - 28, 6.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);

  doc.text('DATA/HORA', 16, y + 4.5);
  doc.text('USUÁRIO RESPONSÁVEL', 50, y + 4.5);
  doc.text('PERFIL', 95, y + 4.5);
  doc.text('TIPO CRUD', 115, y + 4.5);
  doc.text('MÓDULO', 138, y + 4.5);
  doc.text('RECURSO', 165, y + 4.5);
  doc.text('DETALHAMENTO DA OPERAÇÃO / HISTÓRICO DE AUDITORIA', 195, y + 4.5);

  y += 8;

  params.logs.forEach((log) => {
    if (y > 190) {
      doc.addPage();
      y = 15;

      // Repeat Table Header
      doc.setFillColor(30, 58, 138);
      doc.rect(14, y, pageWidth - 28, 6.5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('DATA/HORA', 16, y + 4.5);
      doc.text('USUÁRIO RESPONSÁVEL', 50, y + 4.5);
      doc.text('PERFIL', 95, y + 4.5);
      doc.text('TIPO CRUD', 115, y + 4.5);
      doc.text('MÓDULO', 138, y + 4.5);
      doc.text('RECURSO', 165, y + 4.5);
      doc.text('DETALHAMENTO DA OPERAÇÃO / HISTÓRICO DE AUDITORIA', 195, y + 4.5);
      y += 8;
    }

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);

    doc.text(log.formattedDate, 16, y + 3);
    doc.text(log.userName.substring(0, 22), 50, y + 3);
    doc.text(log.userRole, 95, y + 3);

    // Color code CRUD types
    if (log.crudType === 'ELIMINAR') {
      doc.setTextColor(220, 38, 38);
      doc.setFont('helvetica', 'bold');
    } else if (log.crudType === 'CRIAR') {
      doc.setTextColor(16, 185, 129);
      doc.setFont('helvetica', 'bold');
    } else if (log.crudType === 'APROVACAO') {
      doc.setTextColor(124, 58, 237);
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setTextColor(37, 99, 235);
      doc.setFont('helvetica', 'normal');
    }
    doc.text(log.crudType, 115, y + 3);

    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.text(log.module, 138, y + 3);
    doc.text(log.resourceId ? log.resourceId.substring(0, 14) : '-', 165, y + 3);

    doc.setTextColor(15, 23, 42);
    doc.text(log.details.substring(0, 68), 195, y + 3);

    y += 5.5;
  });

  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Trilha de Auditoria Imutável do Estoque Central para Conformidade Regulatória e Resolução de Disputas Corporativas.', 14, 200);

  doc.save(`Auditoria_Estoque_Central_${new Date().toISOString().substring(0, 10)}.pdf`);
}

export function exportSingleQRLabelPDF(params: {
  code: string;
  title: string;
  subtitle: string;
  location: string;
}) {
  // Label format: 100mm width x 60mm height (standard thermal / adhesive label)
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [100, 60] });

  // Border & Header
  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(0.8);
  doc.rect(3, 3, 94, 54);

  // Top header bar
  doc.setFillColor(30, 58, 138);
  doc.rect(3, 3, 94, 9, 'F');
  doc.setFillColor(220, 38, 38);
  doc.rect(3, 12, 94, 1.2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('ESTOQUE CENTRAL | ALMOXARIFADO', 6, 9);

  // Shelf / Location pill
  doc.setFillColor(220, 38, 38);
  doc.roundedRect(62, 5, 32, 5.5, 1, 1, 'F');
  doc.setFontSize(7);
  doc.text(params.location.substring(0, 16), 64, 9);

  // Draw simulated QR matrix vector in label
  const qrX = 6;
  const qrY = 16;
  const qrSize = 34;

  doc.setFillColor(255, 255, 255);
  doc.rect(qrX, qrY, qrSize, qrSize, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.rect(qrX, qrY, qrSize, qrSize);

  // QR Finders
  doc.setFillColor(15, 23, 42);
  // Top-left finder
  doc.rect(qrX + 2, qrY + 2, 8, 8, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(qrX + 3.5, qrY + 3.5, 5, 5, 'F');
  doc.setFillColor(15, 23, 42);
  doc.rect(qrX + 4.5, qrY + 4.5, 3, 3, 'F');

  // Top-right finder
  doc.rect(qrX + qrSize - 10, qrY + 2, 8, 8, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(qrX + qrSize - 8.5, qrY + 3.5, 5, 5, 'F');
  doc.setFillColor(15, 23, 42);
  doc.rect(qrX + qrSize - 7.5, qrY + 4.5, 3, 3, 'F');

  // Bottom-left finder
  doc.rect(qrX + 2, qrY + qrSize - 10, 8, 8, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(qrX + 3.5, qrY + qrSize - 8.5, 5, 5, 'F');
  doc.setFillColor(15, 23, 42);
  doc.rect(qrX + 4.5, qrY + qrSize - 7.5, 3, 3, 'F');

  // Barcode grid pattern
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      if ((r * 7 + c * 13) % 2 === 0) {
        doc.rect(qrX + 13 + c * 1.8, qrY + 4 + r * 1.8, 1.4, 1.4, 'F');
      }
      if ((r * 11 + c * 5) % 3 === 0) {
        doc.rect(qrX + 4 + c * 1.8, qrY + 13 + r * 1.8, 1.4, 1.4, 'F');
      }
      if ((r * 3 + c * 17) % 2 === 0) {
        doc.rect(qrX + 13 + c * 2.8, qrY + 16 + r * 2.8, 2, 2, 'F');
      }
    }
  }

  // Right Side - Code & Item Details
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(params.code, 43, 22);

  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  const titleLines = doc.splitTextToSize(params.title, 50);
  doc.text(titleLines.slice(0, 2), 43, 28);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(params.subtitle.substring(0, 36), 43, 38);

  // Barcode horizontal visual representation
  doc.setFillColor(15, 23, 42);
  const barX = 43;
  const barY = 41;
  const barWidths = [1, 2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 2, 1, 1, 3, 1, 2, 1, 1, 2, 3, 1, 2, 1, 3, 1, 2, 1];
  let curX = barX;
  barWidths.forEach((w, i) => {
    if (i % 2 === 0) {
      doc.rect(curX, barY, w * 0.5, 6, 'F');
    }
    curX += w * 0.5;
  });

  // Footer label text
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text(`IMPRESSÃO AUDITADA  |  DATA: ${new Date().toLocaleDateString('pt-BR')}`, 43, 52);

  doc.save(`Etiqueta_${params.code}_${new Date().toISOString().substring(0, 10)}.pdf`);
}

export function exportABCAnalysisPDF(params: {
  analysis: import('./abcAnalysis').ABCAnalysisResult;
  currentUser: UserProfile;
}) {
  const { analysis, currentUser } = params;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header Banner - Corporate Navy Blue (#1E3A8A)
  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, pageWidth, 26, 'F');

  // Red Accent Line (#DC2626)
  doc.setFillColor(220, 38, 38);
  doc.rect(0, 26, pageWidth, 2.5, 'F');

  // Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('ESTOQUE CENTRAL | MATRIZ CURVA ABC & PREVISÃO DE AUTONOMIA', 14, 12);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Emissão: ${new Date().toLocaleString('pt-BR')}  |  Emitido por: ${currentUser.name} (${currentUser.role})`, 14, 20);

  let y = 35;

  // Executive KPI Summary Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, pageWidth - 28, 26, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y, pageWidth - 28, 26, 2, 2, 'S');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('BALANÇO EXECUTIVO DO INVENTÁRIO (PARETO 80/15/5)', 18, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Capital Imobilizado Total: R$ ${analysis.totalStockValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 18, y + 13);
  doc.text(`Total de SKUs Analisados: ${analysis.items.length}`, 115, y + 13);

  // Breakdown by Class
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text(`Classe A: ${analysis.classA.count} itens (${analysis.classA.percentValue}% val / ${analysis.classA.percentItems}% SKUs)`, 18, y + 19);

  doc.setTextColor(13, 148, 136);
  doc.text(`Classe B: ${analysis.classB.count} itens (${analysis.classB.percentValue}%)`, 95, y + 19);

  doc.setTextColor(100, 116, 139);
  doc.text(`Classe C: ${analysis.classC.count} itens (${analysis.classC.percentValue}%)`, 145, y + 19);

  // Critical alerts line
  doc.setFontSize(7.5);
  doc.setTextColor(220, 38, 38);
  doc.text(`Itens em Risco Iminente de Ruptura (< 5 dias): ${analysis.riskCriticalCount}   |   Ponto de Reposição (< 15 dias): ${analysis.riskWarningCount}`, 18, y + 24);

  y += 32;

  // Table Title
  doc.setFillColor(30, 58, 138);
  doc.rect(14, y, pageWidth - 28, 6.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('RANKING DE ITENS: VALORIZAÇÃO, CONSUMO E PROJEÇÃO DE AUTONOMIA', 18, y + 4.5);

  y += 9;

  // Table Header
  const renderTableHeader = (currentY: number) => {
    doc.setFillColor(226, 232, 240);
    doc.rect(14, currentY, pageWidth - 28, 6, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('CLASSE', 16, currentY + 4);
    doc.text('CÓDIGO', 30, currentY + 4);
    doc.text('MATERIAL', 50, currentY + 4);
    doc.text('ESTOQUE', 105, currentY + 4);
    doc.text('GIRO/DIA', 125, currentY + 4);
    doc.text('AUTONOMIA', 145, currentY + 4);
    doc.text('SUG. COMPRA', 168, currentY + 4);
    doc.text('VALOR TOTAL', 194, currentY + 4, { align: 'right' });
    return currentY + 7;
  };

  y = renderTableHeader(y);

  // Table Body Rows
  analysis.items.forEach((item, idx) => {
    if (y > pageHeight - 20) {
      doc.addPage();
      y = 15;
      y = renderTableHeader(y);
    }

    // Row alternating background
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 2, pageWidth - 28, 6.5, 'F');
    }

    // Class pill background
    if (item.abcClass === 'A') {
      doc.setFillColor(219, 234, 254);
      doc.setTextColor(30, 58, 138);
    } else if (item.abcClass === 'B') {
      doc.setFillColor(204, 251, 241);
      doc.setTextColor(15, 118, 110);
    } else {
      doc.setFillColor(241, 245, 249);
      doc.setTextColor(71, 85, 105);
    }
    doc.roundedRect(16, y - 1, 10, 4, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text(`CL ${item.abcClass}`, 17.5, y + 2);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(item.code, 30, y + 2);

    // Truncate name
    const shortName = item.name.length > 30 ? item.name.substring(0, 30) + '...' : item.name;
    doc.text(shortName, 50, y + 2);

    doc.text(`${item.currentStock} ${item.unit}`, 105, y + 2);
    doc.text(`${item.dailyConsumption}/dia`, 125, y + 2);

    // Color code autonomy
    if (item.riskLevel === 'CRITICO') {
      doc.setTextColor(220, 38, 38);
      doc.setFont('helvetica', 'bold');
    } else if (item.riskLevel === 'ATENCAO') {
      doc.setTextColor(217, 119, 6);
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setTextColor(22, 101, 52);
      doc.setFont('helvetica', 'normal');
    }
    const runwayText = item.daysOfRunway >= 999 ? 'Sem giro' : `${item.daysOfRunway} dias`;
    doc.text(runwayText, 145, y + 2);

    // Suggested purchase
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.text(item.suggestedReorderQty > 0 ? `+${item.suggestedReorderQty} ${item.unit}` : 'Abastecido', 168, y + 2);

    // Valuation
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`R$ ${item.totalValuation.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 194, y + 2, { align: 'right' });

    y += 6.5;
  });

  // Footer on current page
  if (y > pageHeight - 15) {
    doc.addPage();
    y = 15;
  }
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.text(`ESTOQUE CENTRAL - SISTEMA CORPORATIVO | DOCUMENTO GERADO EM ${new Date().toLocaleString('pt-BR')} | AUDITORIA ATIVA`, 14, pageHeight - 8);

  doc.save(`Curva_ABC_EstoqueCentral_${new Date().toISOString().substring(0, 10)}.pdf`);
}


