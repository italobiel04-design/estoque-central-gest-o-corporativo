/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'ADM' | 'COLABORADOR';

export interface UserPermissions {
  canAccessDashboard: boolean;
  canAccessInventory: boolean;
  canAccessLaundry: boolean;
  canAccessMachines: boolean;
  canAccessGUE: boolean;
  canAccessTeam: boolean;
  canAccessAudit: boolean; // Permission for compliance & audit trail
  canApproveRequests: boolean;
  canExportReports: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  active: boolean;
  phone: string;
  assignedSector: string;
  permissions: UserPermissions;
}

export type MaterialCategory = 
  | 'EPIs e Segurança'
  | 'Higienização e Limpeza'
  | 'Enxoval e Rouparia'
  | 'Insumos Hospitalares'
  | 'Manutenção e Peças';

export interface MaterialItem {
  id: string;
  code: string;
  name: string;
  category: MaterialCategory;
  unit: string;
  currentStock: number;
  minimumStock: number; // Default 50 units
  shelfLocation: string; // Ex: PRAT-B02-N3
  unitPrice: number; // R$
  description?: string;
  lastUpdated: string;
}

export type MovementType = 'ENTRADA' | 'SAIDA' | 'AJUSTE' | 'TRANSFERENCIA_GUE';

export interface InventoryMovement {
  id: string;
  type: MovementType;
  itemId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  userEmail: string;
  userName: string;
  reason: string;
  supplierOrReceiver: string;
  documentNumber: string;
  date: string;
  timestamp: number;
  synced: boolean;
}

export type LaundryStatus = 'ENVIADO' | 'DEVOLVIDO_TOTAL' | 'PECA_PENDENTE';

export interface LaundryRecord {
  id: string;
  date: string; // Mandatory YYYY-MM-DD
  time: string; // Mandatory HH:mm
  senderCollaborator: string; // Mandatory
  laundryEmployee: string; // Mandatory (Nome do Funcionário da Lavanderia)
  nightShiftQty: number; // Mandatory: Quantidade de Enxoval Noturno
  dayShiftQty: number; // Mandatory: Quantidade de Enxoval Diurno
  totalSent: number;
  status: LaundryStatus;
  returnDate?: string;
  returnTime?: string;
  returnedQty?: number;
  pendingQty?: number;
  receiverCollaborator?: string;
  pendingNotes?: string;
  createdAt: number;
}

export type MachineCondition = 'BOM_ESTADO' | 'COM_DEFEITO';
export type MachineStatus = 'DISPONIVEL' | 'EM_USO' | 'MANUTENCAO_OS' | 'EM_FALTA';

export interface MachineEquipment {
  id: string;
  code: string; // Ex: MAQ-001
  name: string;
  sectorFloor: string; // Ex: 2º Andar - Higienização
  stockCollaborator: string; // Nome do Colaborador do Estoque
  currentAssigneeUser: string; // Nome do Colaborador Utilizador
  operationalCondition: MachineCondition;
  status: MachineStatus;
  activeOSId?: string;
  lastInspectionDate: string;
}

export type OSPriority = 'CRITICA' | 'ALTA' | 'MEDIA';
export type OSStatus = 'ABERTA' | 'EM_ANDAMENTO' | 'CONCLUIDA_REPARADA' | 'CANCELADA';

export interface ServiceOrderOS {
  id: string; // Ex: OS-2026-0042
  machineId: string;
  machineCode: string;
  machineName: string;
  reportedBy: string;
  issueDescription: string;
  dateOpened: string;
  status: OSStatus;
  priority: OSPriority;
  technicianAssigned: string;
  resolutionNotes?: string;
  resolvedAt?: string;
  reactivatedByADM?: string;
}

export interface GUESubStockItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
}

export interface ExternalUnitGUE {
  id: string;
  code: string; // Ex: GUE-01
  name: string;
  responsibleName: string;
  contactPhone: string;
  address: string;
  subStock: GUESubStockItem[];
}

export type GUERequestStatus = 'PENDENTE_APROVACAO' | 'APROVADO' | 'RECUSADO';

export interface GUERequest {
  id: string;
  gueId: string;
  gueCode: string;
  gueName: string;
  requestedBy: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  justification: string;
  date: string;
  timestamp: number;
  status: GUERequestStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string; // Mandatory when RECUSADO!
}

// Comprehensive Audit Trail Types
export type AuditCRUDType = 
  | 'CRIAR'      // Create (Novo item, nova máquina, novo usuário, etc.)
  | 'LER'        // Read (Consulta de relatórios, exportação, auditoria)
  | 'ATUALIZAR'  // Update (Edição de estoque, alteração de permissão, etc.)
  | 'ELIMINAR'   // Delete (Exclusão de item ou registro)
  | 'APROVACAO'  // Approval / Rejection flow
  | 'SISTEMA';   // System events, login, offline sync

export type AuditModule = 
  | 'ESTOQUE'
  | 'LAVANDERIA'
  | 'MAQUINAS'
  | 'ORDEM_SERVICO'
  | 'GUE'
  | 'EQUIPE'
  | 'AUDITORIA'
  | 'AUTENTICACAO'
  | 'SISTEMA';

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  formattedDate: string; // ex: 27/10/2026 15:42:19
  userEmail: string;
  userName: string;
  userRole: UserRole;
  crudType: AuditCRUDType;
  module: AuditModule;
  resourceId?: string; // ex: MAT-EPI-01, OS-2026-0012, REQ-001
  actionName: string;  // ex: 'ENTRADA_MATERIAL', 'APROVACAO_PEDIDO_GUE'
  details: string;     // Detailed summary
  metadata?: Record<string, unknown>; // JSON representation for dispute resolution
}

// System Backup and Disaster Recovery Types
export interface SystemBackupPayload {
  system: 'ESTOQUE_CENTRAL';
  version: string;
  exportedAt: string;
  timestamp: number;
  exportedBy: {
    name: string;
    email: string;
    role: UserRole;
  };
  data: {
    users: UserProfile[];
    materials: MaterialItem[];
    machines: MachineEquipment[];
    osList: ServiceOrderOS[];
    laundryRecords: LaundryRecord[];
    gues: ExternalUnitGUE[];
    gueRequests: GUERequest[];
    movements: InventoryMovement[];
    auditLogs: AuditLogEntry[];
    minimumStockThreshold: number;
  };
  checksum?: string;
}

export interface BackupStats {
  materialsCount: number;
  usersCount: number;
  machinesCount: number;
  osCount: number;
  laundryCount: number;
  guesCount: number;
  gueRequestsCount: number;
  movementsCount: number;
  auditLogsCount: number;
  originalSizeBytes: number;
  compressedSizeBytes: number;
}

