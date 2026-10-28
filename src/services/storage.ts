/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  UserProfile,
  MaterialItem,
  InventoryMovement,
  LaundryRecord,
  MachineEquipment,
  ServiceOrderOS,
  ExternalUnitGUE,
  GUERequest,
  AuditLogEntry,
  AuditCRUDType,
  AuditModule
} from '../types';
import { cloudSync } from './firebaseSync';

const STORAGE_KEYS = {
  USERS: 'estoque_users_v3',
  MATERIALS: 'estoque_materials_v3',
  MOVEMENTS: 'estoque_movements_v3',
  LAUNDRY: 'estoque_laundry_v3',
  MACHINES: 'estoque_machines_v3',
  OS: 'estoque_os_v3',
  GUES: 'estoque_gues_v3',
  GUE_REQUESTS: 'estoque_gue_requests_v3',
  AUDIT_LOGS: 'estoque_audit_v3',
  CURRENT_USER: 'estoque_current_user_v3',
  MINIMUM_STOCK_THRESHOLD: 'estoque_min_threshold_v3'
};

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'usr-adm-01',
    name: 'Carlos Silva',
    email: 'admin@estoquecentral.com',
    password: 'admin',
    role: 'ADM',
    active: true,
    phone: '(11) 98765-4321',
    assignedSector: 'Diretoria de Logística & Estoque',
    permissions: {
      canAccessDashboard: true,
      canAccessInventory: true,
      canAccessLaundry: true,
      canAccessMachines: true,
      canAccessGUE: true,
      canAccessTeam: true,
      canAccessAudit: true,
      canApproveRequests: true,
      canExportReports: true,
    }
  },
  {
    id: 'usr-colab-01',
    name: 'Mariana Santos',
    email: 'mariana.santos@estoquecentral.com',
    password: '123',
    role: 'COLABORADOR',
    active: true,
    phone: '(11) 97654-3210',
    assignedSector: 'Almoxarifado Central - Prateleiras A e B',
    permissions: {
      canAccessDashboard: true,
      canAccessInventory: true,
      canAccessLaundry: true,
      canAccessMachines: true,
      canAccessGUE: true,
      canAccessTeam: false,
      canAccessAudit: false,
      canApproveRequests: false,
      canExportReports: true,
    }
  },
  {
    id: 'usr-colab-02',
    name: 'Roberto Lima',
    email: 'roberto.lima@estoquecentral.com',
    password: '123',
    role: 'COLABORADOR',
    active: true,
    phone: '(11) 96543-2109',
    assignedSector: 'Recepção de Materiais & Máquinas',
    permissions: {
      canAccessDashboard: false,
      canAccessInventory: true,
      canAccessLaundry: false,
      canAccessMachines: true,
      canAccessGUE: true,
      canAccessTeam: false,
      canAccessAudit: false,
      canApproveRequests: false,
      canExportReports: false,
    }
  },
  {
    id: 'usr-colab-03',
    name: 'Ana Paula Rocha',
    email: 'ana.paula@estoquecentral.com',
    password: '123',
    role: 'COLABORADOR',
    active: true,
    phone: '(11) 95432-1098',
    assignedSector: 'Central de Rouparia & Higienização',
    permissions: {
      canAccessDashboard: false,
      canAccessInventory: true,
      canAccessLaundry: true,
      canAccessMachines: false,
      canAccessGUE: false,
      canAccessTeam: false,
      canAccessAudit: false,
      canApproveRequests: false,
      canExportReports: false,
    }
  }
];

export const INITIAL_MATERIALS: MaterialItem[] = [
  {
    id: 'mat-001',
    code: 'MAT-EPI-01',
    name: 'Luva Nitrílica Descartável Sem Pó (Tamanho G)',
    category: 'EPIs e Segurança',
    unit: 'Caixa 100un',
    currentStock: 32, // CRITICAL: Below 50 units!
    minimumStock: 50,
    shelfLocation: 'PRAT-A01-N2',
    unitPrice: 42.50,
    description: 'Luvas de proteção química e biológica para manipulação asséptica.',
    lastUpdated: '2026-10-27 15:30'
  },
  {
    id: 'mat-002',
    code: 'MAT-HIG-02',
    name: 'Álcool Etílico Hidratado 70% INPM 1000ml',
    category: 'Higienização e Limpeza',
    unit: 'Frasco 1L',
    currentStock: 28, // CRITICAL: Below 50 units!
    minimumStock: 50,
    shelfLocation: 'PRAT-A02-N1',
    unitPrice: 8.90,
    description: 'Desinfetante hospitalar de superfícies fixas e antisséptico.',
    lastUpdated: '2026-10-27 14:10'
  },
  {
    id: 'mat-003',
    code: 'MAT-ENX-03',
    name: 'Lençol Hospitalar Branco com Elástico Percal 180F',
    category: 'Enxoval e Rouparia',
    unit: 'Unidade',
    currentStock: 45, // CRITICAL: Below 50 units!
    minimumStock: 50,
    shelfLocation: 'PRAT-B01-N3',
    unitPrice: 38.00,
    description: 'Enxoval 100% algodão para leitos de internação e repouso.',
    lastUpdated: '2026-10-27 11:20'
  },
  {
    id: 'mat-004',
    code: 'MAT-HIG-04',
    name: 'Detergente Enzimático 5 Litros Multienzimático',
    category: 'Higienização e Limpeza',
    unit: 'Galão 5L',
    currentStock: 114,
    minimumStock: 50,
    shelfLocation: 'PRAT-A03-N1',
    unitPrice: 145.00,
    description: 'Solução concentrada com 4 enzimas para limpeza de instrumentais.',
    lastUpdated: '2026-10-26 16:45'
  },
  {
    id: 'mat-005',
    code: 'MAT-EPI-05',
    name: 'Máscara de Proteção Respiratória PFF2 / N95',
    category: 'EPIs e Segurança',
    unit: 'Caixa 50un',
    currentStock: 180,
    minimumStock: 50,
    shelfLocation: 'PRAT-A01-N4',
    unitPrice: 65.00,
    description: 'Respirador purificador de ar semi facial contra partículas biológicas.',
    lastUpdated: '2026-10-25 09:15'
  },
  {
    id: 'mat-006',
    code: 'MAT-MED-06',
    name: 'Seringa Descartável 10ml com Agulha 25x7mm',
    category: 'Insumos Hospitalares',
    unit: 'Caixa 100un',
    currentStock: 220,
    minimumStock: 50,
    shelfLocation: 'PRAT-B03-N2',
    unitPrice: 58.00,
    description: 'Seringa estéril em polipropileno atóxico com bico luer lock.',
    lastUpdated: '2026-10-26 17:00'
  },
  {
    id: 'mat-007',
    code: 'MAT-ENX-07',
    name: 'Fronha Hospitalar Envelope Algodão Branco',
    category: 'Enxoval e Rouparia',
    unit: 'Unidade',
    currentStock: 39, // CRITICAL: Below 50 units!
    minimumStock: 50,
    shelfLocation: 'PRAT-B01-N1',
    unitPrice: 12.50,
    description: 'Fronha hospitalar de alta durabilidade e resistência à lavagem.',
    lastUpdated: '2026-10-27 10:00'
  },
  {
    id: 'mat-008',
    code: 'MAT-MAN-08',
    name: 'Disco Abrasivo de Limpeza e Polimento 510mm Verde',
    category: 'Manutenção e Peças',
    unit: 'Unidade',
    currentStock: 64,
    minimumStock: 50,
    shelfLocation: 'PRAT-C02-N2',
    unitPrice: 27.50,
    description: 'Acessório de reposição para enceradeiras industriais do estoque.',
    lastUpdated: '2026-10-24 13:20'
  }
];

export const INITIAL_MACHINES: MachineEquipment[] = [
  {
    id: 'maq-001',
    code: 'MAQ-001',
    name: 'Lavadora de Alta Pressão Industrial HD 585',
    sectorFloor: '1º Andar - Higienização Externa',
    stockCollaborator: 'Roberto Lima',
    currentAssigneeUser: 'Nenhum (Disponível)',
    operationalCondition: 'BOM_ESTADO',
    status: 'DISPONIVEL',
    lastInspectionDate: '2026-10-27'
  },
  {
    id: 'maq-002',
    code: 'MAQ-002',
    name: 'Enceradeira Industrial Certec 510mm',
    sectorFloor: '2º Andar - Bloco Cirúrgico',
    stockCollaborator: 'Mariana Santos',
    currentAssigneeUser: 'João Pereira (Higienização)',
    operationalCondition: 'BOM_ESTADO',
    status: 'EM_USO',
    lastInspectionDate: '2026-10-26'
  },
  {
    id: 'maq-003',
    code: 'MAQ-003',
    name: 'Autoclave Hospitalar Digital Automática 54 Litros',
    sectorFloor: '3º Andar - CME Central',
    stockCollaborator: 'Carlos Silva',
    currentAssigneeUser: 'Bloqueado (Sob OS-2026-0012)',
    operationalCondition: 'COM_DEFEITO',
    status: 'MANUTENCAO_OS',
    activeOSId: 'OS-2026-0012',
    lastInspectionDate: '2026-10-25'
  },
  {
    id: 'maq-004',
    code: 'MAQ-004',
    name: 'Aspirador de Pó e Líquidos Industrial NT 70/2',
    sectorFloor: 'Térreo - Almoxarifado Geral',
    stockCollaborator: 'Mariana Santos',
    currentAssigneeUser: 'Nenhum (Disponível)',
    operationalCondition: 'BOM_ESTADO',
    status: 'DISPONIVEL',
    lastInspectionDate: '2026-10-27'
  }
];

export const INITIAL_OS: ServiceOrderOS[] = [
  {
    id: 'OS-2026-0012',
    machineId: 'maq-003',
    machineCode: 'MAQ-003',
    machineName: 'Autoclave Hospitalar Digital Automática 54 Litros',
    reportedBy: 'Mariana Santos',
    issueDescription: 'Falha intermitente na vedação da guarnição da porta durante o ciclo de esterilização a 134°C com escape de pressão.',
    dateOpened: '2026-10-25 11:45',
    status: 'EM_ANDAMENTO',
    priority: 'CRITICA',
    technicianAssigned: 'Engenharia Clínica MedTech (Téc. Valdemar)',
    resolutionNotes: 'Aguardando substituição da gaxeta de silicone de alta caloria.'
  }
];

export const INITIAL_LAUNDRY: LaundryRecord[] = [
  {
    id: 'lau-001',
    date: '2026-10-27',
    time: '08:30',
    senderCollaborator: 'Ana Paula Rocha',
    laundryEmployee: 'Marcos Vinicius (Lavanderia CleanExpress)',
    nightShiftQty: 85,
    dayShiftQty: 110,
    totalSent: 195,
    status: 'PECA_PENDENTE',
    returnDate: '2026-10-27',
    returnTime: '16:00',
    returnedQty: 180,
    pendingQty: 15,
    receiverCollaborator: 'Mariana Santos',
    pendingNotes: 'Faltaram 15 lençóis do enxoval noturno. A lavanderia informou que ficaram em processo de relavagem e serão devolvidos amanhã cedo.',
    createdAt: Date.now() - 3600000 * 8
  },
  {
    id: 'lau-002',
    date: '2026-10-26',
    time: '09:00',
    senderCollaborator: 'Mariana Santos',
    laundryEmployee: 'Cleide Regina (Lavanderia CleanExpress)',
    nightShiftQty: 60,
    dayShiftQty: 90,
    totalSent: 150,
    status: 'DEVOLVIDO_TOTAL',
    returnDate: '2026-10-26',
    returnTime: '17:30',
    returnedQty: 150,
    pendingQty: 0,
    receiverCollaborator: 'Roberto Lima',
    pendingNotes: 'Devolução 100% conferida e higienizada.',
    createdAt: Date.now() - 3600000 * 32
  }
];

export const INITIAL_GUES: ExternalUnitGUE[] = [
  {
    id: 'gue-01',
    code: 'GUE-01',
    name: 'Unidade de Pronto Atendimento Satélite Norte',
    responsibleName: 'Dr. Marcos Valério',
    contactPhone: '(11) 98111-2233',
    address: 'Av. Paulista Norte, 1420 - Santana',
    subStock: [
      { itemId: 'mat-001', itemCode: 'MAT-EPI-01', itemName: 'Luva Nitrílica G', quantity: 24 },
      { itemId: 'mat-002', itemCode: 'MAT-HIG-02', itemName: 'Álcool 70% 1L', quantity: 18 },
      { itemId: 'mat-004', itemCode: 'MAT-HIG-04', itemName: 'Detergente Enzimático 5L', quantity: 6 }
    ]
  },
  {
    id: 'gue-02',
    code: 'GUE-02',
    name: 'Hospital Regional Anexo Sul',
    responsibleName: 'Enfª Chefe Fernanda Dias',
    contactPhone: '(11) 98222-3344',
    address: 'Rua das Palmeiras Médicas, 500 - Santo Amaro',
    subStock: [
      { itemId: 'mat-001', itemCode: 'MAT-EPI-01', itemName: 'Luva Nitrílica G', quantity: 45 },
      { itemId: 'mat-003', itemCode: 'MAT-ENX-03', itemName: 'Lençol Hospitalar Percal', quantity: 30 },
      { itemId: 'mat-006', itemCode: 'MAT-MED-06', itemName: 'Seringa Descartável 10ml', quantity: 110 }
    ]
  },
  {
    id: 'gue-03',
    code: 'GUE-03',
    name: 'Centro Cirúrgico Especializado Leste',
    responsibleName: 'Dr. Ricardo Mendes',
    contactPhone: '(11) 98333-4455',
    address: 'Av. Radial Leste, 890 - Tatuapé',
    subStock: [
      { itemId: 'mat-005', itemCode: 'MAT-EPI-05', itemName: 'Máscara N95/PFF2', quantity: 60 },
      { itemId: 'mat-004', itemCode: 'MAT-HIG-04', itemName: 'Detergente Enzimático 5L', quantity: 12 }
    ]
  }
];

export const INITIAL_GUE_REQUESTS: GUERequest[] = [
  {
    id: 'req-001',
    gueId: 'gue-01',
    gueCode: 'GUE-01',
    gueName: 'Unidade de Pronto Atendimento Satélite Norte',
    requestedBy: 'Mariana Santos',
    itemId: 'mat-002',
    itemCode: 'MAT-HIG-02',
    itemName: 'Álcool Etílico Hidratado 70% INPM 1000ml',
    quantity: 10,
    justification: 'Reposição de urgência para salas de triagem respiratória com pico de atendimento.',
    date: '2026-10-27 15:40',
    timestamp: Date.now() - 3600000 * 2,
    status: 'PENDENTE_APROVACAO'
  },
  {
    id: 'req-002',
    gueId: 'gue-02',
    gueCode: 'GUE-02',
    gueName: 'Hospital Regional Anexo Sul',
    requestedBy: 'Roberto Lima',
    itemId: 'mat-006',
    itemCode: 'MAT-MED-06',
    itemName: 'Seringa Descartável 10ml com Agulha 25x7mm',
    quantity: 20,
    justification: 'Campanha de imunização e reforço de leitos de UTI.',
    date: '2026-10-26 10:15',
    timestamp: Date.now() - 3600000 * 24,
    status: 'APROVADO',
    reviewedBy: 'Carlos Silva (ADM)',
    reviewedAt: '2026-10-26 11:00'
  },
  {
    id: 'req-003',
    gueId: 'gue-03',
    gueCode: 'GUE-03',
    gueName: 'Centro Cirúrgico Especializado Leste',
    requestedBy: 'Mariana Santos',
    itemId: 'mat-001',
    itemCode: 'MAT-EPI-01',
    itemName: 'Luva Nitrílica Descartável Sem Pó (Tamanho G)',
    quantity: 50,
    justification: 'Solicitação extra de estoque de segurança.',
    date: '2026-10-25 14:00',
    timestamp: Date.now() - 3600000 * 48,
    status: 'RECUSADO',
    reviewedBy: 'Carlos Silva (ADM)',
    reviewedAt: '2026-10-25 14:30',
    rejectionReason: 'Quantidade solicitada excede o limite mensal sem autorização da coordenação clínica. Manter reserva central.'
  }
];

export const INITIAL_MOVEMENTS: InventoryMovement[] = [
  {
    id: 'mov-001',
    type: 'ENTRADA',
    itemId: 'mat-005',
    itemCode: 'MAT-EPI-05',
    itemName: 'Máscara de Proteção Respiratória PFF2 / N95',
    quantity: 80,
    previousStock: 100,
    newStock: 180,
    userEmail: 'admin@estoquecentral.com',
    userName: 'Carlos Silva',
    reason: 'Recebimento de Lote de Compra Direta',
    supplierOrReceiver: 'Distribuidora Hospitalar BioSafe Ltda',
    documentNumber: 'NF-e 89412',
    date: '2026-10-26 14:20',
    timestamp: Date.now() - 3600000 * 26,
    synced: true
  },
  {
    id: 'mov-002',
    type: 'SAIDA',
    itemId: 'mat-001',
    itemCode: 'MAT-EPI-01',
    itemName: 'Luva Nitrílica Descartável Sem Pó (Tamanho G)',
    quantity: 18,
    previousStock: 50,
    newStock: 32,
    userEmail: 'mariana.santos@estoquecentral.com',
    userName: 'Mariana Santos',
    reason: 'Abastecimento Rotina - Bloco UTI Neonatal',
    supplierOrReceiver: 'Enfermeira Mariana (UTI Neo)',
    documentNumber: 'REQ-2026-908',
    date: '2026-10-27 10:15',
    timestamp: Date.now() - 3600000 * 8,
    synced: true
  },
  {
    id: 'mov-003',
    type: 'TRANSFERENCIA_GUE',
    itemId: 'mat-006',
    itemCode: 'MAT-MED-06',
    itemName: 'Seringa Descartável 10ml com Agulha 25x7mm',
    quantity: 20,
    previousStock: 240,
    newStock: 220,
    userEmail: 'admin@estoquecentral.com',
    userName: 'Carlos Silva',
    reason: 'Transferência Aprovada para GUE-02',
    supplierOrReceiver: 'GUE-02 Hospital Regional Anexo Sul',
    documentNumber: 'GUETRANS-002',
    date: '2026-10-26 11:00',
    timestamp: Date.now() - 3600000 * 23,
    synced: true
  }
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-001',
    timestamp: Date.now() - 3600000 * 24,
    formattedDate: new Date(Date.now() - 3600000 * 24).toLocaleString('pt-BR'),
    userEmail: 'admin@estoquecentral.com',
    userName: 'Carlos Silva',
    userRole: 'ADM',
    crudType: 'SISTEMA',
    module: 'SISTEMA' as AuditModule,
    resourceId: 'INIT-BOOT',
    actionName: 'INICIALIZACAO_SISTEMA',
    details: 'Inicialização do banco de dados de missão crítica Estoque Central com conformidade de auditoria ativa.',
    metadata: { version: '2.4.0', environment: 'production-ready', cluster: 'brazil-southeast' }
  },
  {
    id: 'aud-002',
    timestamp: Date.now() - 3600000 * 23,
    formattedDate: new Date(Date.now() - 3600000 * 23).toLocaleString('pt-BR'),
    userEmail: 'admin@estoquecentral.com',
    userName: 'Carlos Silva',
    userRole: 'ADM',
    crudType: 'APROVACAO',
    module: 'GUE',
    resourceId: 'REQ-002',
    actionName: 'APROVACAO_PEDIDO_GUE',
    details: 'Aprovada transferência de 20 un de Seringa 10ml para GUE-02 Hospital Regional Anexo Sul.',
    metadata: { gueCode: 'GUE-02', requestedBy: 'Roberto Lima', approvedQuantity: 20 }
  },
  {
    id: 'aud-003',
    timestamp: Date.now() - 3600000 * 18,
    formattedDate: new Date(Date.now() - 3600000 * 18).toLocaleString('pt-BR'),
    userEmail: 'mariana.santos@estoquecentral.com',
    userName: 'Mariana Santos',
    userRole: 'COLABORADOR',
    crudType: 'CRIAR',
    module: 'ORDEM_SERVICO',
    resourceId: 'OS-2026-0012',
    actionName: 'ABERTURA_OS_AVARIA',
    details: 'Avaria detectada na Autoclave MAQ-003. Gerada automaticamente OS-2026-0012 e equipamento bloqueado.',
    metadata: { machineCode: 'MAQ-003', condition: 'COM_DEFEITO', priority: 'CRITICA' }
  },
  {
    id: 'aud-004',
    timestamp: Date.now() - 3600000 * 8,
    formattedDate: new Date(Date.now() - 3600000 * 8).toLocaleString('pt-BR'),
    userEmail: 'mariana.santos@estoquecentral.com',
    userName: 'Mariana Santos',
    userRole: 'COLABORADOR',
    crudType: 'ATUALIZAR',
    module: 'ESTOQUE',
    resourceId: 'MAT-EPI-01',
    actionName: 'SAIDA_ESTOQUE_MATERIAL',
    details: 'Saída de 18 caixas de Luva Nitrílica G para UTI Neonatal. Saldo atual reduzido para 32 (Alerta Crítico atingido).',
    metadata: { previousStock: 50, newStock: 32, document: 'REQ-2026-908' }
  },
  {
    id: 'aud-005',
    timestamp: Date.now() - 3600000 * 4,
    formattedDate: new Date(Date.now() - 3600000 * 4).toLocaleString('pt-BR'),
    userEmail: 'ana.paula@estoquecentral.com',
    userName: 'Ana Paula Rocha',
    userRole: 'COLABORADOR',
    crudType: 'ATUALIZAR',
    module: 'LAVANDERIA',
    resourceId: 'LAU-001',
    actionName: 'DISCREPANCIA_PECA_PENDENTE',
    details: 'Conferência de retorno de lavanderia registrou falta de 15 lençóis. Notificação de pendência enviada ao gestor.',
    metadata: { sentQty: 195, returnedQty: 180, missingQty: 15, provider: 'CleanExpress' }
  }
];

let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('estoque_central_realtime_sync');
  }
} catch {
  // Ignore
}

export class StorageService {
  private static notifyListeners(type: string, data?: unknown) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('estoque_data_changed', { detail: { type, data } }));
      if (broadcastChannel) {
        broadcastChannel.postMessage({ type, data, timestamp: Date.now() });
      }
    }
  }

  public static init() {
    if (typeof window === 'undefined') return;

    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.MATERIALS)) {
      localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(INITIAL_MATERIALS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.MACHINES)) {
      localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(INITIAL_MACHINES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.OS)) {
      localStorage.setItem(STORAGE_KEYS.OS, JSON.stringify(INITIAL_OS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.LAUNDRY)) {
      localStorage.setItem(STORAGE_KEYS.LAUNDRY, JSON.stringify(INITIAL_LAUNDRY));
    }
    if (!localStorage.getItem(STORAGE_KEYS.GUES)) {
      localStorage.setItem(STORAGE_KEYS.GUES, JSON.stringify(INITIAL_GUES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.GUE_REQUESTS)) {
      localStorage.setItem(STORAGE_KEYS.GUE_REQUESTS, JSON.stringify(INITIAL_GUE_REQUESTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.MOVEMENTS)) {
      localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(INITIAL_MOVEMENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(INITIAL_USERS[0]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.MINIMUM_STOCK_THRESHOLD)) {
      localStorage.setItem(STORAGE_KEYS.MINIMUM_STOCK_THRESHOLD, '50');
    }

    if (broadcastChannel) {
      broadcastChannel.onmessage = (event) => {
        window.dispatchEvent(new CustomEvent('estoque_data_changed', { detail: event.data }));
      };
    }

    // Inicializa conexão em tempo real Firestore para sincronização multi-dispositivo
    cloudSync.init(
      (remoteMaterials) => {
        localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(remoteMaterials));
        StorageService.notifyListeners('materials', remoteMaterials);
      },
      (remoteMachines) => {
        localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(remoteMachines));
        StorageService.notifyListeners('machines', remoteMachines);
      },
      (remoteOS) => {
        localStorage.setItem(STORAGE_KEYS.OS, JSON.stringify(remoteOS));
        StorageService.notifyListeners('os', remoteOS);
      },
      (remoteLaundry) => {
        localStorage.setItem(STORAGE_KEYS.LAUNDRY, JSON.stringify(remoteLaundry));
        StorageService.notifyListeners('laundry', remoteLaundry);
      },
      (remoteGUEs) => {
        localStorage.setItem(STORAGE_KEYS.GUES, JSON.stringify(remoteGUEs));
        StorageService.notifyListeners('gues', remoteGUEs);
      },
      (remoteReqs) => {
        localStorage.setItem(STORAGE_KEYS.GUE_REQUESTS, JSON.stringify(remoteReqs));
        StorageService.notifyListeners('gue_requests', remoteReqs);
      },
      (remoteMovements) => {
        localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(remoteMovements));
        StorageService.notifyListeners('movements', remoteMovements);
      },
      (remoteAudit) => {
        localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(remoteAudit));
        StorageService.notifyListeners('audit', remoteAudit);
      },
      (remoteUsers) => {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(remoteUsers));
        StorageService.notifyListeners('users', remoteUsers);
      }
    );

    // Semeadura inicial na nuvem (se o Firestore estiver vazio)
    cloudSync.seedCloudIfEmpty(
      this.getMaterials(),
      this.getMachines(),
      this.getServiceOrders(),
      this.getLaundryRecords(),
      this.getGUEs(),
      this.getGUERequests(),
      this.getMovements(),
      this.getAuditLogs(),
      this.getUsers()
    );
  }

  // --- Comprehensive Audit Logging Engine ---
  public static logAudit(params: {
    actor: UserProfile;
    crudType: AuditCRUDType;
    module: AuditModule;
    resourceId?: string;
    actionName: string;
    details: string;
    metadata?: Record<string, unknown>;
  }) {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    const logs: AuditLogEntry[] = raw ? JSON.parse(raw) : [];

    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const newEntry: AuditLogEntry = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      formattedDate,
      userEmail: params.actor.email,
      userName: params.actor.name,
      userRole: params.actor.role,
      crudType: params.crudType,
      module: params.module,
      resourceId: params.resourceId,
      actionName: params.actionName,
      details: params.details,
      metadata: params.metadata
    };

    logs.unshift(newEntry);
    // Keep up to 500 audit records
    if (logs.length > 500) logs.pop();

    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
    cloudSync.syncAuditLog(newEntry);
    this.notifyListeners('AUDIT_LOG_ADDED', newEntry);
  }

  public static getAuditLogs(): AuditLogEntry[] {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    return raw ? JSON.parse(raw) : INITIAL_AUDIT_LOGS;
  }

  // --- Current User & Auth ---
  public static getCurrentUser(): UserProfile {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return INITIAL_USERS[0];
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_USERS[0];
    }
  }

  public static setCurrentUser(user: UserProfile) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    this.logAudit({
      actor: user,
      crudType: 'SISTEMA',
      module: 'AUTENTICACAO',
      resourceId: user.id,
      actionName: 'LOGIN_SESSAO',
      details: `Sessão ativa iniciada para o perfil ${user.role} (${user.name})`,
      metadata: { role: user.role, email: user.email, sector: user.assignedSector }
    });
    this.notifyListeners('USER_CHANGED', user);
  }

  public static getUsers(): UserProfile[] {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    return raw ? JSON.parse(raw) : INITIAL_USERS;
  }

  public static saveUser(user: UserProfile, actor: UserProfile): { success: boolean; error?: string } {
    if (actor.role !== 'ADM' && !actor.permissions.canAccessTeam) {
      return { success: false, error: 'Apenas Administradores possuem permissão para gerenciar a equipe.' };
    }
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    const isNew = idx === -1;

    if (isNew) {
      users.push(user);
    } else {
      users[idx] = user;
    }

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.logAudit({
      actor,
      crudType: isNew ? 'CRIAR' : 'ATUALIZAR',
      module: 'EQUIPE',
      resourceId: user.email,
      actionName: isNew ? 'CRIACAO_USUARIO' : 'EDICAO_USUARIO',
      details: `${isNew ? 'Criado' : 'Atualizado'} colaborador ${user.name} (${user.role}) no setor ${user.assignedSector}. Ativo: ${user.active ? 'Sim' : 'Não'}.`,
      metadata: { userId: user.id, role: user.role, permissions: user.permissions }
    });

    this.notifyListeners('USERS_UPDATED', users);
    cloudSync.syncUser(user);
    return { success: true };
  }

  public static deleteUser(userId: string, actor: UserProfile): { success: boolean; error?: string } {
    if (actor.role !== 'ADM') {
      return { success: false, error: 'Apenas Administradores podem excluir usuários.' };
    }
    if (userId === actor.id) {
      return { success: false, error: 'Não é permitido excluir o usuário atualmente conectado.' };
    }

    const users = this.getUsers();
    const target = users.find(u => u.id === userId);
    if (!target) return { success: false, error: 'Usuário não encontrado.' };

    const filtered = users.filter(u => u.id !== userId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));

    this.logAudit({
      actor,
      crudType: 'ELIMINAR',
      module: 'EQUIPE',
      resourceId: target.email,
      actionName: 'EXCLUSAO_USUARIO',
      details: `Colaborador ${target.name} (${target.email}) removido do sistema pelo administrador.`,
      metadata: { targetName: target.name, targetEmail: target.email, role: target.role }
    });

    cloudSync.deleteUser(userId);
    this.notifyListeners('USERS_UPDATED', filtered);
    return { success: true };
  }

  // --- Minimum Stock Threshold ---
  public static getMinimumStockThreshold(): number {
    const raw = localStorage.getItem(STORAGE_KEYS.MINIMUM_STOCK_THRESHOLD);
    return raw ? parseInt(raw, 10) : 50;
  }

  public static setMinimumStockThreshold(threshold: number, actor: UserProfile) {
    const prev = this.getMinimumStockThreshold();
    localStorage.setItem(STORAGE_KEYS.MINIMUM_STOCK_THRESHOLD, threshold.toString());

    this.logAudit({
      actor,
      crudType: 'ATUALIZAR',
      module: 'ESTOQUE',
      resourceId: 'CONFIG-MIN-STOCK',
      actionName: 'AJUSTE_LIMITE_MINIMO',
      details: `Limite padrão de estoque mínimo alterado de ${prev} para ${threshold} unidades.`,
      metadata: { previousThreshold: prev, newThreshold: threshold }
    });

    this.notifyListeners('THRESHOLD_UPDATED', threshold);
  }

  // --- Materials & Inventory ---
  public static getMaterials(): MaterialItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MATERIALS);
    return raw ? JSON.parse(raw) : INITIAL_MATERIALS;
  }

  public static saveMaterial(material: MaterialItem, actor: UserProfile): { success: boolean; error?: string } {
    const materials = this.getMaterials();
    const idx = materials.findIndex(m => m.id === material.id || m.code.toUpperCase() === material.code.toUpperCase());
    
    if (idx >= 0 && materials[idx].id !== material.id) {
      return { success: false, error: `Já existe um item cadastrado com o código ${material.code}.` };
    }

    const isNew = idx === -1;
    if (isNew) {
      materials.unshift(material);
    } else {
      materials[idx] = material;
    }

    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));

    this.logAudit({
      actor,
      crudType: isNew ? 'CRIAR' : 'ATUALIZAR',
      module: 'ESTOQUE',
      resourceId: material.code,
      actionName: isNew ? 'CADASTRO_MATERIAL' : 'EDICAO_MATERIAL',
      details: `${isNew ? 'Cadastrado novo material' : 'Editado material'}: [${material.code}] ${material.name}. Saldo: ${material.currentStock} ${material.unit}. Prateleira: ${material.shelfLocation}.`,
      metadata: { material }
    });

    this.notifyListeners('MATERIALS_UPDATED', materials);
    cloudSync.syncMaterial(material);
    return { success: true };
  }

  public static deleteMaterial(materialId: string, actor: UserProfile): { success: boolean; error?: string } {
    if (actor.role !== 'ADM') {
      return { success: false, error: 'Apenas Administradores têm permissão para excluir materiais do estoque central.' };
    }
    const materials = this.getMaterials();
    const target = materials.find(m => m.id === materialId);
    if (!target) return { success: false, error: 'Material não encontrado.' };

    const filtered = materials.filter(m => m.id !== materialId);
    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(filtered));

    this.logAudit({
      actor,
      crudType: 'ELIMINAR',
      module: 'ESTOQUE',
      resourceId: target.code,
      actionName: 'EXCLUSAO_MATERIAL',
      details: `Material [${target.code}] ${target.name} foi excluído do catálogo pelo administrador.`,
      metadata: { deletedItem: target }
    });

    cloudSync.deleteMaterial(materialId);
    this.notifyListeners('MATERIALS_UPDATED', filtered);
    return { success: true };
  }

  public static performStockMovement(params: {
    type: 'ENTRADA' | 'SAIDA';
    itemId: string;
    quantity: number;
    reason: string;
    supplierOrReceiver: string;
    documentNumber: string;
    actor: UserProfile;
  }): { success: boolean; error?: string; movement?: InventoryMovement } {
    if (params.quantity <= 0) {
      return { success: false, error: 'A quantidade deve ser maior que zero.' };
    }

    const materials = this.getMaterials();
    const itemIdx = materials.findIndex(m => m.id === params.itemId);
    if (itemIdx === -1) {
      return { success: false, error: 'Material não encontrado no estoque central.' };
    }

    const item = materials[itemIdx];
    const prevStock = item.currentStock;
    let newStock = prevStock;

    if (params.type === 'SAIDA') {
      if (item.currentStock < params.quantity) {
        return {
          success: false,
          error: `Saldo insuficiente no Estoque Central! Disponível: ${item.currentStock} ${item.unit}. Solicitado: ${params.quantity}.`
        };
      }
      newStock = prevStock - params.quantity;
    } else {
      newStock = prevStock + params.quantity;
    }

    item.currentStock = newStock;
    item.lastUpdated = new Date().toISOString().replace('T', ' ').substring(0, 16);
    materials[itemIdx] = item;
    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));

    const now = new Date();
    const movement: InventoryMovement = {
      id: 'mov-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      type: params.type,
      itemId: item.id,
      itemCode: item.code,
      itemName: item.name,
      quantity: params.quantity,
      previousStock: prevStock,
      newStock: newStock,
      userEmail: params.actor.email,
      userName: params.actor.name,
      reason: params.reason,
      supplierOrReceiver: params.supplierOrReceiver,
      documentNumber: params.documentNumber || `REG-${Date.now().toString().slice(-6)}`,
      date: now.toISOString().replace('T', ' ').substring(0, 16),
      timestamp: Date.now(),
      synced: navigator.onLine
    };

    const movements = this.getMovements();
    movements.unshift(movement);
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));

    this.logAudit({
      actor: params.actor,
      crudType: 'ATUALIZAR',
      module: 'ESTOQUE',
      resourceId: item.code,
      actionName: params.type === 'ENTRADA' ? 'ENTRADA_MATERIAL' : 'SAIDA_MATERIAL',
      details: `${params.type === 'ENTRADA' ? 'Entrada' : 'Saída'} operacional de ${params.quantity} ${item.unit} do item [${item.code}]. Estoque: ${prevStock} -> ${newStock}. Doc: ${movement.documentNumber}. Motivo: ${params.reason}.`,
      metadata: { movement, previousStock: prevStock, newStock: newStock }
    });

    cloudSync.syncMaterial(item);
    cloudSync.syncMovement(movement);
    this.notifyListeners('STOCK_MOVEMENT', { movement, item });
    return { success: true, movement };
  }

  public static getMovements(): InventoryMovement[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
    return raw ? JSON.parse(raw) : INITIAL_MOVEMENTS;
  }

  // --- Laundry Module ---
  public static getLaundryRecords(): LaundryRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.LAUNDRY);
    return raw ? JSON.parse(raw) : INITIAL_LAUNDRY;
  }

  public static registerLaundryDispatch(params: {
    date: string;
    time: string;
    senderCollaborator: string;
    laundryEmployee: string;
    nightShiftQty: number;
    dayShiftQty: number;
    actor: UserProfile;
  }): { success: boolean; error?: string; record?: LaundryRecord } {
    if (!params.date || !params.time) {
      return { success: false, error: 'Data e Hora são de preenchimento obrigatório.' };
    }
    if (!params.senderCollaborator.trim()) {
      return { success: false, error: 'O nome do colaborador responsável pelo envio é obrigatório.' };
    }
    if (!params.laundryEmployee.trim()) {
      return { success: false, error: 'O nome do funcionário da lavanderia que recebeu é obrigatório.' };
    }
    if (params.nightShiftQty < 0 || params.dayShiftQty < 0) {
      return { success: false, error: 'Quantidades não podem ser negativas.' };
    }
    if (params.nightShiftQty === 0 && params.dayShiftQty === 0) {
      return { success: false, error: 'É obrigatório informar ao menos uma peça no Enxoval Noturno ou Diurno.' };
    }

    const totalSent = Number(params.nightShiftQty) + Number(params.dayShiftQty);

    const record: LaundryRecord = {
      id: 'lau-' + Date.now(),
      date: params.date,
      time: params.time,
      senderCollaborator: params.senderCollaborator.trim(),
      laundryEmployee: params.laundryEmployee.trim(),
      nightShiftQty: Number(params.nightShiftQty),
      dayShiftQty: Number(params.dayShiftQty),
      totalSent: totalSent,
      status: 'ENVIADO',
      createdAt: Date.now()
    };

    const records = this.getLaundryRecords();
    records.unshift(record);
    localStorage.setItem(STORAGE_KEYS.LAUNDRY, JSON.stringify(records));

    this.logAudit({
      actor: params.actor,
      crudType: 'CRIAR',
      module: 'LAVANDERIA',
      resourceId: record.id,
      actionName: 'ENVIO_LAVANDERIA',
      details: `Despacho de enxoval para lavanderia: ${totalSent} peças (Noturno: ${params.nightShiftQty}, Diurno: ${params.dayShiftQty}). Recebedor Lavanderia: ${params.laundryEmployee}.`,
      metadata: { record }
    });

    this.notifyListeners('LAUNDRY_UPDATED', record);
    cloudSync.syncLaundryRecord(record);
    return { success: true, record };
  }

  public static registerLaundryReturn(params: {
    recordId: string;
    returnDate: string;
    returnTime: string;
    returnedQty: number;
    receiverCollaborator: string;
    pendingNotes?: string;
    actor: UserProfile;
  }): { success: boolean; error?: string } {
    const records = this.getLaundryRecords();
    const idx = records.findIndex(r => r.id === params.recordId);
    if (idx === -1) {
      return { success: false, error: 'Registro de lavanderia não encontrado.' };
    }

    const record = records[idx];
    const returned = Number(params.returnedQty);
    if (returned < 0) {
      return { success: false, error: 'Quantidade devolvida inválida.' };
    }

    record.returnDate = params.returnDate;
    record.returnTime = params.returnTime;
    record.returnedQty = returned;
    record.receiverCollaborator = params.receiverCollaborator;
    
    if (returned < record.totalSent) {
      record.status = 'PECA_PENDENTE';
      record.pendingQty = record.totalSent - returned;
      record.pendingNotes = params.pendingNotes || `Falta de ${record.pendingQty} peças na conferência de devolução.`;
    } else {
      record.status = 'DEVOLVIDO_TOTAL';
      record.pendingQty = 0;
      record.pendingNotes = params.pendingNotes || 'Devolução completa confirmada sem pendências.';
    }

    records[idx] = record;
    localStorage.setItem(STORAGE_KEYS.LAUNDRY, JSON.stringify(records));

    this.logAudit({
      actor: params.actor,
      crudType: 'ATUALIZAR',
      module: 'LAVANDERIA',
      resourceId: record.id,
      actionName: record.status === 'PECA_PENDENTE' ? 'ALERTA_PECA_PENDENTE' : 'RETORNO_LAVANDERIA_CONCLUIDO',
      details: `Retorno de lavanderia processado: ${returned} de ${record.totalSent} peças. Status: ${record.status}. ${record.status === 'PECA_PENDENTE' ? `Pendência: ${record.pendingQty} peças faltantes!` : ''}`,
      metadata: { record }
    });

    cloudSync.syncLaundryRecord(record);
    this.notifyListeners('LAUNDRY_UPDATED', record);
    return { success: true };
  }

  // --- Machines, Equipments & Automated OS ---
  public static getMachines(): MachineEquipment[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MACHINES);
    return raw ? JSON.parse(raw) : INITIAL_MACHINES;
  }

  public static getServiceOrders(): ServiceOrderOS[] {
    const raw = localStorage.getItem(STORAGE_KEYS.OS);
    return raw ? JSON.parse(raw) : INITIAL_OS;
  }

  public static saveMachine(machine: MachineEquipment, actor: UserProfile): { success: boolean; error?: string } {
    const machines = this.getMachines();
    const idx = machines.findIndex(m => m.id === machine.id || m.code.toUpperCase() === machine.code.toUpperCase());
    
    const isNew = idx === -1;
    if (isNew) {
      machines.unshift(machine);
    } else {
      machines[idx] = machine;
    }
    localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(machines));

    this.logAudit({
      actor,
      crudType: isNew ? 'CRIAR' : 'ATUALIZAR',
      module: 'MAQUINAS',
      resourceId: machine.code,
      actionName: isNew ? 'CADASTRO_MAQUINA' : 'EDICAO_MAQUINA',
      details: `${isNew ? 'Cadastrado novo equipamento' : 'Atualizado equipamento'}: [${machine.code}] ${machine.name} no setor ${machine.sectorFloor}. Condição: ${machine.operationalCondition}.`,
      metadata: { machine }
    });

    this.notifyListeners('MACHINES_UPDATED', machines);
    cloudSync.syncMachine(machine);
    return { success: true };
  }

  public static flagMachineDefectAndCreateOS(params: {
    machineId: string;
    issueDescription: string;
    priority: 'CRITICA' | 'ALTA' | 'MEDIA';
    technicianAssigned: string;
    actor: UserProfile;
  }): { success: boolean; error?: string; os?: ServiceOrderOS } {
    const machines = this.getMachines();
    const idx = machines.findIndex(m => m.id === params.machineId);
    if (idx === -1) {
      return { success: false, error: 'Equipamento não localizado.' };
    }

    const machine = machines[idx];
    const osId = `OS-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOS: ServiceOrderOS = {
      id: osId,
      machineId: machine.id,
      machineCode: machine.code,
      machineName: machine.name,
      reportedBy: params.actor.name,
      issueDescription: params.issueDescription,
      dateOpened: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'ABERTA',
      priority: params.priority,
      technicianAssigned: params.technicianAssigned || 'Técnico de Plantão'
    };

    machine.operationalCondition = 'COM_DEFEITO';
    machine.status = 'MANUTENCAO_OS';
    machine.activeOSId = osId;
    machine.currentAssigneeUser = `BLOQUEADO (Sob ${osId})`;
    machine.lastInspectionDate = new Date().toISOString().substring(0, 10);
    machines[idx] = machine;

    const osList = this.getServiceOrders();
    osList.unshift(newOS);

    localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(machines));
    localStorage.setItem(STORAGE_KEYS.OS, JSON.stringify(osList));

    this.logAudit({
      actor: params.actor,
      crudType: 'CRIAR',
      module: 'ORDEM_SERVICO',
      resourceId: osId,
      actionName: 'ABERTURA_OS_AVARIA_BLOQUEIO',
      details: `AVARIA CRÍTICA: Equipamento [${machine.code}] ${machine.name} sinalizado com defeito. Gerada automaticamente ${osId} (Prioridade: ${params.priority}). Equipamento retirado de circulação e bloqueado para novas saídas.`,
      metadata: { os: newOS, machineCode: machine.code }
    });

    cloudSync.syncMachine(machine);
    cloudSync.syncServiceOrder(newOS);
    this.notifyListeners('OS_CREATED', { os: newOS, machine });
    return { success: true, os: newOS };
  }

  public static resolveOSAndReactivateMachine(params: {
    osId: string;
    resolutionNotes: string;
    actor: UserProfile;
  }): { success: boolean; error?: string } {
    if (params.actor.role !== 'ADM' && !params.actor.permissions.canApproveRequests) {
      return { success: false, error: 'Apenas Administradores têm permissão para homologar reparos e reativar equipamentos.' };
    }

    const osList = this.getServiceOrders();
    const osIdx = osList.findIndex(o => o.id === params.osId);
    if (osIdx === -1) {
      return { success: false, error: 'Ordem de serviço não encontrada.' };
    }

    const os = osList[osIdx];
    os.status = 'CONCLUIDA_REPARADA';
    os.resolutionNotes = params.resolutionNotes;
    os.resolvedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    os.reactivatedByADM = `${params.actor.name} (${params.actor.role})`;
    osList[osIdx] = os;

    const machines = this.getMachines();
    const mIdx = machines.findIndex(m => m.id === os.machineId);
    let resolvedMachine: MachineEquipment | undefined;
    if (mIdx >= 0) {
      const machine = machines[mIdx];
      machine.operationalCondition = 'BOM_ESTADO';
      machine.status = 'DISPONIVEL';
      machine.activeOSId = undefined;
      machine.currentAssigneeUser = 'Nenhum (Disponível)';
      machine.lastInspectionDate = new Date().toISOString().substring(0, 10);
      machines[mIdx] = machine;
      resolvedMachine = machine;
      localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(machines));
    }

    localStorage.setItem(STORAGE_KEYS.OS, JSON.stringify(osList));

    this.logAudit({
      actor: params.actor,
      crudType: 'ATUALIZAR',
      module: 'ORDEM_SERVICO',
      resourceId: os.id,
      actionName: 'HOMOLOGACAO_OS_REATIVACAO',
      details: `Ordem de Serviço ${os.id} concluída e homologada pelo ADM ${params.actor.name}. Máquina [${os.machineCode}] liberada novamente para circulação.`,
      metadata: { osId: os.id, resolutionNotes: params.resolutionNotes, machineCode: os.machineCode }
    });

    cloudSync.syncServiceOrder(os);
    if (resolvedMachine) cloudSync.syncMachine(resolvedMachine);
    this.notifyListeners('OS_RESOLVED', { os });
    return { success: true };
  }

  public static checkoutMachine(params: {
    machineId: string;
    collaboratorName: string;
    sector: string;
    actor: UserProfile;
  }): { success: boolean; error?: string } {
    const machines = this.getMachines();
    const idx = machines.findIndex(m => m.id === params.machineId);
    if (idx === -1) return { success: false, error: 'Máquina não encontrada.' };

    const machine = machines[idx];
    if (machine.status === 'MANUTENCAO_OS' || machine.operationalCondition === 'COM_DEFEITO') {
      return { success: false, error: `Operação Bloqueada: ${machine.code} está sob ${machine.activeOSId || 'OS'} de manutenção corretiva.` };
    }
    if (machine.status === 'EM_USO') {
      return { success: false, error: `Máquina já está em uso por ${machine.currentAssigneeUser}.` };
    }

    machine.status = 'EM_USO';
    machine.currentAssigneeUser = params.collaboratorName;
    machine.sectorFloor = params.sector;
    machine.stockCollaborator = params.actor.name;
    machines[idx] = machine;

    localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(machines));

    this.logAudit({
      actor: params.actor,
      crudType: 'ATUALIZAR',
      module: 'MAQUINAS',
      resourceId: machine.code,
      actionName: 'LIBERACAO_MAQUINA',
      details: `Máquina [${machine.code}] liberada para uso de ${params.collaboratorName} no setor ${params.sector}.`,
      metadata: { machineCode: machine.code, assignee: params.collaboratorName, sector: params.sector }
    });

    cloudSync.syncMachine(machine);
    this.notifyListeners('MACHINES_UPDATED', machines);
    return { success: true };
  }

  public static returnMachine(params: {
    machineId: string;
    operationalCondition: 'BOM_ESTADO' | 'COM_DEFEITO';
    defectNotes?: string;
    actor: UserProfile;
  }): { success: boolean; error?: string } {
    const machines = this.getMachines();
    const idx = machines.findIndex(m => m.id === params.machineId);
    if (idx === -1) return { success: false, error: 'Máquina não encontrada.' };

    const machine = machines[idx];
    if (params.operationalCondition === 'COM_DEFEITO') {
      return this.flagMachineDefectAndCreateOS({
        machineId: machine.id,
        issueDescription: params.defectNotes || 'Avaria detectada no ato da devolução ao estoque central.',
        priority: 'ALTA',
        technicianAssigned: 'Equipe de Manutenção Interna',
        actor: params.actor
      });
    }

    machine.status = 'DISPONIVEL';
    machine.operationalCondition = 'BOM_ESTADO';
    machine.currentAssigneeUser = 'Nenhum (Disponível)';
    machine.lastInspectionDate = new Date().toISOString().substring(0, 10);
    machines[idx] = machine;

    localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(machines));

    this.logAudit({
      actor: params.actor,
      crudType: 'ATUALIZAR',
      module: 'MAQUINAS',
      resourceId: machine.code,
      actionName: 'DEVOLUCAO_MAQUINA_CONFORME',
      details: `Máquina [${machine.code}] devolvida ao estoque central em bom estado de conservação.`,
      metadata: { machineCode: machine.code, status: 'DISPONIVEL' }
    });

    cloudSync.syncMachine(machine);
    this.notifyListeners('MACHINES_UPDATED', machines);
    return { success: true };
  }

  // --- External Units (GUE's) & Approval Flow ---
  public static getGUEs(): ExternalUnitGUE[] {
    const raw = localStorage.getItem(STORAGE_KEYS.GUES);
    return raw ? JSON.parse(raw) : INITIAL_GUES;
  }

  public static saveGUE(gue: ExternalUnitGUE, actor: UserProfile): { success: boolean; error?: string } {
    const gues = this.getGUEs();
    const idx = gues.findIndex(g => g.id === gue.id);
    const isNew = idx === -1;

    if (isNew) {
      gues.push(gue);
    } else {
      gues[idx] = gue;
    }
    localStorage.setItem(STORAGE_KEYS.GUES, JSON.stringify(gues));

    this.logAudit({
      actor,
      crudType: isNew ? 'CRIAR' : 'ATUALIZAR',
      module: 'GUE',
      resourceId: gue.code,
      actionName: isNew ? 'CADASTRO_GUE' : 'EDICAO_GUE',
      details: `${isNew ? 'Cadastrada' : 'Atualizada'} Unidade Externa [${gue.code}] ${gue.name}. Responsável: ${gue.responsibleName}.`,
      metadata: { gue }
    });

    this.notifyListeners('GUES_UPDATED', gues);
    cloudSync.syncGUE(gue);
    return { success: true };
  }

  public static getGUERequests(): GUERequest[] {
    const raw = localStorage.getItem(STORAGE_KEYS.GUE_REQUESTS);
    return raw ? JSON.parse(raw) : INITIAL_GUE_REQUESTS;
  }

  public static requestGUEMaterial(params: {
    gueId: string;
    itemId: string;
    quantity: number;
    justification: string;
    actor: UserProfile;
  }): { success: boolean; error?: string; request?: GUERequest } {
    if (params.quantity <= 0) {
      return { success: false, error: 'Quantidade deve ser superior a zero.' };
    }
    if (!params.justification.trim()) {
      return { success: false, error: 'A justificativa do pedido para a GUE é obrigatória.' };
    }

    const gues = this.getGUEs();
    const gue = gues.find(g => g.id === params.gueId);
    if (!gue) return { success: false, error: 'Unidade Externa (GUE) não encontrada.' };

    const materials = this.getMaterials();
    const item = materials.find(m => m.id === params.itemId);
    if (!item) return { success: false, error: 'Material não encontrado no Estoque Central.' };

    const request: GUERequest = {
      id: 'req-' + Date.now(),
      gueId: gue.id,
      gueCode: gue.code,
      gueName: gue.name,
      requestedBy: params.actor.name,
      itemId: item.id,
      itemCode: item.code,
      itemName: item.name,
      quantity: params.quantity,
      justification: params.justification.trim(),
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      timestamp: Date.now(),
      status: 'PENDENTE_APROVACAO'
    };

    const requests = this.getGUERequests();
    requests.unshift(request);
    localStorage.setItem(STORAGE_KEYS.GUE_REQUESTS, JSON.stringify(requests));

    this.logAudit({
      actor: params.actor,
      crudType: 'CRIAR',
      module: 'GUE',
      resourceId: request.id,
      actionName: 'SOLICITACAO_MATERIAL_GUE',
      details: `Nova solicitação para ${gue.name} (${gue.code}): ${params.quantity} un de [${item.code}]. Status: Pendente de Aprovação ADM. Justificativa: "${params.justification}".`,
      metadata: { request }
    });

    cloudSync.syncGUERequest(request);
    this.notifyListeners('GUE_REQUESTS_UPDATED', request);
    return { success: true, request };
  }

  public static reviewGUERequest(params: {
    requestId: string;
    action: 'APROVAR' | 'RECUSAR';
    rejectionReason?: string;
    actor: UserProfile;
  }): { success: boolean; error?: string } {
    if (params.actor.role !== 'ADM' && !params.actor.permissions.canApproveRequests) {
      return { success: false, error: 'Apenas Administradores possuem autorização para aprovar ou recusar pedidos de GUE.' };
    }

    const requests = this.getGUERequests();
    const reqIdx = requests.findIndex(r => r.id === params.requestId);
    if (reqIdx === -1) return { success: false, error: 'Solicitação não encontrada.' };

    const req = requests[reqIdx];
    if (req.status !== 'PENDENTE_APROVACAO') {
      return { success: false, error: 'Esta solicitação já foi avaliada anteriormente.' };
    }

    if (params.action === 'RECUSAR') {
      if (!params.rejectionReason || !params.rejectionReason.trim()) {
        return { success: false, error: 'É OBRIGATÓRIO preencher o motivo da recusa para rejeitar uma solicitação de GUE.' };
      }

      req.status = 'RECUSADO';
      req.rejectionReason = params.rejectionReason.trim();
      req.reviewedBy = `${params.actor.name} (${params.actor.role})`;
      req.reviewedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
      requests[reqIdx] = req;

      localStorage.setItem(STORAGE_KEYS.GUE_REQUESTS, JSON.stringify(requests));

      this.logAudit({
        actor: params.actor,
        crudType: 'APROVACAO',
        module: 'GUE',
        resourceId: req.id,
        actionName: 'RECUSA_PEDIDO_GUE',
        details: `RECUSA: Pedido ${req.id} para ${req.gueName} RECUSADO pelo ADM. Motivo obrigatório registrado: "${req.rejectionReason}".`,
        metadata: { req, reason: req.rejectionReason }
      });

      cloudSync.syncGUERequest(req);
      this.notifyListeners('GUE_REQUESTS_UPDATED', req);
      return { success: true };
    }

    // APROVAR
    const materials = this.getMaterials();
    const matIdx = materials.findIndex(m => m.id === req.itemId);
    if (matIdx === -1) return { success: false, error: 'Item não localizado no Estoque Central.' };

    const material = materials[matIdx];
    if (material.currentStock < req.quantity) {
      return {
        success: false,
        error: `Saldo insuficiente no Estoque Central! Disponível: ${material.currentStock}, Solicitado: ${req.quantity}.`
      };
    }

    const prevStock = material.currentStock;
    material.currentStock -= req.quantity;
    materials[matIdx] = material;
    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));

    const gues = this.getGUEs();
    const gueIdx = gues.findIndex(g => g.id === req.gueId);
    let updatedGUE: ExternalUnitGUE | undefined;
    if (gueIdx >= 0) {
      const gue = gues[gueIdx];
      const subIdx = gue.subStock.findIndex(s => s.itemId === req.itemId);
      if (subIdx >= 0) {
        gue.subStock[subIdx].quantity += req.quantity;
      } else {
        gue.subStock.push({
          itemId: material.id,
          itemCode: material.code,
          itemName: material.name,
          quantity: req.quantity
        });
      }
      gues[gueIdx] = gue;
      updatedGUE = gue;
      localStorage.setItem(STORAGE_KEYS.GUES, JSON.stringify(gues));
    }

    const movement: InventoryMovement = {
      id: 'mov-' + Date.now(),
      type: 'TRANSFERENCIA_GUE',
      itemId: material.id,
      itemCode: material.code,
      itemName: material.name,
      quantity: req.quantity,
      previousStock: prevStock,
      newStock: material.currentStock,
      userEmail: params.actor.email,
      userName: params.actor.name,
      reason: `Transferência autorizada para ${req.gueName} (${req.gueCode})`,
      supplierOrReceiver: `${req.gueCode} - ${req.gueName}`,
      documentNumber: `GUE-APR-${req.id.slice(-5)}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      timestamp: Date.now(),
      synced: true
    };
    const movements = this.getMovements();
    movements.unshift(movement);
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));

    req.status = 'APROVADO';
    req.reviewedBy = `${params.actor.name} (${params.actor.role})`;
    req.reviewedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    requests[reqIdx] = req;
    localStorage.setItem(STORAGE_KEYS.GUE_REQUESTS, JSON.stringify(requests));

    this.logAudit({
      actor: params.actor,
      crudType: 'APROVACAO',
      module: 'GUE',
      resourceId: req.id,
      actionName: 'APROVACAO_PEDIDO_GUE',
      details: `APROVADO: Pedido ${req.id} para ${req.gueName}. Debitado atomicamente ${req.quantity} un de [${material.code}] do Estoque Central (${prevStock} -> ${material.currentStock}) e creditado ao sub-estoque da GUE.`,
      metadata: { req, previousCentralStock: prevStock, newCentralStock: material.currentStock }
    });

    cloudSync.syncMaterial(material);
    if (updatedGUE) cloudSync.syncGUE(updatedGUE);
    cloudSync.syncMovement(movement);
    cloudSync.syncGUERequest(req);

    this.notifyListeners('GUE_REQUESTS_UPDATED', req);
    this.notifyListeners('MATERIALS_UPDATED', materials);
    this.notifyListeners('GUES_UPDATED', gues);
    return { success: true };
  }

  // Reset to initial corporate factory state
  public static resetToDemoData(actor: UserProfile) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(INITIAL_MATERIALS));
    localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(INITIAL_MACHINES));
    localStorage.setItem(STORAGE_KEYS.OS, JSON.stringify(INITIAL_OS));
    localStorage.setItem(STORAGE_KEYS.LAUNDRY, JSON.stringify(INITIAL_LAUNDRY));
    localStorage.setItem(STORAGE_KEYS.GUES, JSON.stringify(INITIAL_GUES));
    localStorage.setItem(STORAGE_KEYS.GUE_REQUESTS, JSON.stringify(INITIAL_GUE_REQUESTS));
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(INITIAL_MOVEMENTS));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
    localStorage.setItem(STORAGE_KEYS.MINIMUM_STOCK_THRESHOLD, '50');

    this.logAudit({
      actor,
      crudType: 'SISTEMA',
      module: 'SISTEMA' as AuditModule,
      resourceId: 'RESET-ALL',
      actionName: 'RESTAURACAO_FABRICA',
      details: 'Restauração geral da base de dados para parâmetros demonstrativos de fábrica executada.',
      metadata: { actorEmail: actor.email }
    });

    this.notifyListeners('DATA_RESET', null);
  }

  // --- Compressed JSON Backup & Disaster Recovery ---
  public static async exportCompressedBackup(actor: UserProfile): Promise<{
    blob: Blob;
    filename: string;
    stats: {
      originalSizeBytes: number;
      compressedSizeBytes: number;
      compressionRatio: string;
      itemsCount: number;
    };
  }> {
    const backupData = {
      system: 'ESTOQUE_CENTRAL',
      version: '2.5.0',
      exportedAt: new Date().toISOString(),
      timestamp: Date.now(),
      exportedBy: {
        name: actor.name,
        email: actor.email,
        role: actor.role
      },
      data: {
        users: this.getUsers(),
        materials: this.getMaterials(),
        machines: this.getMachines(),
        osList: this.getServiceOrders(),
        laundryRecords: this.getLaundryRecords(),
        gues: this.getGUEs(),
        gueRequests: this.getGUERequests(),
        movements: this.getMovements(),
        auditLogs: this.getAuditLogs(),
        minimumStockThreshold: this.getMinimumStockThreshold()
      }
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const originalBytes = new TextEncoder().encode(jsonString);
    const originalSizeBytes = originalBytes.length;

    let finalBlob: Blob;
    let filenameSuffix = '.ecbak'; // Estoque Central Compressed Backup

    // Attempt native browser CompressionStream (gzip)
    if (typeof CompressionStream !== 'undefined') {
      try {
        const stream = new Blob([originalBytes], { type: 'application/json' })
          .stream()
          .pipeThrough(new CompressionStream('gzip'));
        finalBlob = await new Response(stream).blob();
      } catch (err) {
        console.warn('Gzip stream error, falling back to standard JSON blob', err);
        finalBlob = new Blob([jsonString], { type: 'application/json' });
        filenameSuffix = '.json';
      }
    } else {
      finalBlob = new Blob([jsonString], { type: 'application/json' });
      filenameSuffix = '.json';
    }

    const compressedSizeBytes = finalBlob.size;
    const compressionRatio = originalSizeBytes > 0
      ? `${(((originalSizeBytes - compressedSizeBytes) / originalSizeBytes) * 100).toFixed(1)}% de redução`
      : '0%';

    const dateStr = new Date().toISOString().substring(0, 10);
    const timeStr = new Date().toTimeString().substring(0, 5).replace(':', '-');
    const filename = `backup_estoque_central_${dateStr}_${timeStr}${filenameSuffix}`;

    // Auto-trigger browser download
    const url = URL.createObjectURL(finalBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.logAudit({
      actor,
      crudType: 'LER',
      module: 'SISTEMA',
      actionName: 'EXPORTACAO_BACKUP_COMPRIMIDO',
      details: `Backup completo do sistema gerado e baixado: ${filename} (${(compressedSizeBytes / 1024).toFixed(1)} KB, ${compressionRatio}).`,
      metadata: {
        filename,
        originalSizeBytes,
        compressedSizeBytes,
        materialsCount: backupData.data.materials.length,
        usersCount: backupData.data.users.length
      }
    });

    return {
      blob: finalBlob,
      filename,
      stats: {
        originalSizeBytes,
        compressedSizeBytes,
        compressionRatio,
        itemsCount: backupData.data.materials.length
      }
    };
  }

  public static async parseBackupFile(file: File): Promise<{
    valid: boolean;
    error?: string;
    payload?: any;
    originalSize: number;
    fileSize: number;
  }> {
    try {
      let jsonText = '';
      const fileSize = file.size;

      // Check if file is gzipped or plain json
      const isCompressed = file.name.endsWith('.ecbak') || file.name.endsWith('.gz') || file.type === 'application/gzip';

      if (isCompressed && typeof DecompressionStream !== 'undefined') {
        try {
          const stream = file.stream().pipeThrough(new DecompressionStream('gzip'));
          jsonText = await new Response(stream).text();
        } catch {
          // Fallback to text reading if not actually gzipped
          jsonText = await file.text();
        }
      } else {
        jsonText = await file.text();
      }

      const payload = JSON.parse(jsonText);

      // Verify payload structure
      if (!payload || !payload.data || payload.system !== 'ESTOQUE_CENTRAL') {
        return {
          valid: false,
          error: 'O arquivo selecionado não é um backup válido do ESTOQUE CENTRAL.',
          originalSize: 0,
          fileSize
        };
      }

      const originalSize = new TextEncoder().encode(jsonText).length;

      return {
        valid: true,
        payload,
        originalSize,
        fileSize
      };
    } catch (err: any) {
      return {
        valid: false,
        error: `Falha ao descompactar ou ler arquivo de backup: ${err.message || 'Arquivo corrompido'}`,
        originalSize: 0,
        fileSize: file.size
      };
    }
  }

  public static restoreFromBackupPayload(
    payload: any,
    actor: UserProfile,
    mode: 'REPLACE' | 'MERGE'
  ): { success: boolean; error?: string } {
    try {
      if (actor.role !== 'ADM') {
        return { success: false, error: 'Apenas Administradores têm permissão para restaurar backups do sistema.' };
      }

      const data = payload.data;
      if (!data) {
        return { success: false, error: 'Dados do backup estão incompletos.' };
      }

      if (mode === 'REPLACE') {
        if (data.users && Array.isArray(data.users)) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users));
        if (data.materials && Array.isArray(data.materials)) localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(data.materials));
        if (data.machines && Array.isArray(data.machines)) localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(data.machines));
        if (data.osList && Array.isArray(data.osList)) localStorage.setItem(STORAGE_KEYS.OS, JSON.stringify(data.osList));
        if (data.laundryRecords && Array.isArray(data.laundryRecords)) localStorage.setItem(STORAGE_KEYS.LAUNDRY, JSON.stringify(data.laundryRecords));
        if (data.gues && Array.isArray(data.gues)) localStorage.setItem(STORAGE_KEYS.GUES, JSON.stringify(data.gues));
        if (data.gueRequests && Array.isArray(data.gueRequests)) localStorage.setItem(STORAGE_KEYS.GUE_REQUESTS, JSON.stringify(data.gueRequests));
        if (data.movements && Array.isArray(data.movements)) localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(data.movements));
        if (data.auditLogs && Array.isArray(data.auditLogs)) localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(data.auditLogs));
        if (data.minimumStockThreshold) localStorage.setItem(STORAGE_KEYS.MINIMUM_STOCK_THRESHOLD, data.minimumStockThreshold.toString());
      } else {
        // MERGE Mode: merge materials, machines, users
        if (data.materials && Array.isArray(data.materials)) {
          const current = this.getMaterials();
          data.materials.forEach((item: MaterialItem) => {
            const idx = current.findIndex(m => m.id === item.id || m.code === item.code);
            if (idx >= 0) current[idx] = item;
            else current.push(item);
          });
          localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(current));
        }

        if (data.machines && Array.isArray(data.machines)) {
          const current = this.getMachines();
          data.machines.forEach((mach: MachineEquipment) => {
            const idx = current.findIndex(m => m.id === mach.id || m.code === mach.code);
            if (idx >= 0) current[idx] = mach;
            else current.push(mach);
          });
          localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(current));
        }

        if (data.gues && Array.isArray(data.gues)) {
          const current = this.getGUEs();
          data.gues.forEach((gue: ExternalUnitGUE) => {
            const idx = current.findIndex(g => g.id === gue.id || g.code === gue.code);
            if (idx >= 0) current[idx] = gue;
            else current.push(gue);
          });
          localStorage.setItem(STORAGE_KEYS.GUES, JSON.stringify(current));
        }
      }

      this.logAudit({
        actor,
        crudType: 'CRIAR',
        module: 'SISTEMA',
        actionName: 'RESTAURACAO_BACKUP',
        details: `Restauração de backup executada com sucesso no modo ${mode === 'REPLACE' ? 'Substituição Total' : 'Mesclagem'}. Origem do backup: ${payload.exportedAt} por ${payload.exportedBy?.name || 'Desconhecido'}.`,
        metadata: { backupPayloadVersion: payload.version, mode }
      });

      this.notifyListeners('DATA_RESET', null);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: `Erro durante a restauração: ${err.message}` };
    }
  }
}

