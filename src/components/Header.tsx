/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Package,
  Layers,
  Wrench,
  Shirt,
  Building2,
  Users,
  FileCheck2,
  Scan,
  Printer,
  AlertTriangle,
  UserCheck,
  ShieldAlert,
  ChevronDown,
  Activity
} from 'lucide-react';
import { UserProfile, MaterialItem, MachineEquipment, LaundryRecord, GUERequest } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { SyncStatusBar } from './OfflineIndicator';

export type NavTab = 
  | 'dashboard'
  | 'inventory'
  | 'laundry'
  | 'machines'
  | 'gue'
  | 'team'
  | 'audit';

interface HeaderProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  currentUser: UserProfile;
  onOpenAuth: () => void;
  onOpenScanner: () => void;
  onOpenLabels: () => void;
  materials: MaterialItem[];
  machines: MachineEquipment[];
  laundryRecords: LaundryRecord[];
  gueRequests: GUERequest[];
  minThreshold: number;
  isOnline: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  currentUser,
  onOpenAuth,
  onOpenScanner,
  onOpenLabels,
  materials,
  machines,
  laundryRecords,
  gueRequests,
  minThreshold,
  isOnline
}) => {
  // Compute critical alert counts
  const criticalStockCount = materials.filter(m => m.currentStock <= minThreshold).length;
  const defectiveMachinesCount = machines.filter(m => m.operationalCondition === 'COM_DEFEITO' || m.status === 'MANUTENCAO_OS').length;
  const pendingLaundryCount = laundryRecords.filter(l => l.status === 'PECA_PENDENTE').length;
  const pendingGUERequestsCount = gueRequests.filter(r => r.status === 'PENDENTE_APROVACAO').length;
  const totalCriticalAlerts = criticalStockCount + defectiveMachinesCount + pendingLaundryCount + pendingGUERequestsCount;

  // Determine allowed tabs based on permissions
  const canDashboard = currentUser.role === 'ADM' || currentUser.permissions.canAccessDashboard;
  const canInventory = currentUser.permissions.canAccessInventory;
  const canLaundry = currentUser.permissions.canAccessLaundry;
  const canMachines = currentUser.permissions.canAccessMachines;
  const canGUE = currentUser.permissions.canAccessGUE;
  const canTeam = currentUser.role === 'ADM' || currentUser.permissions.canAccessTeam;
  const canAudit = currentUser.role === 'ADM' || currentUser.permissions.canAccessAudit;

  return (
    <header className="sticky top-0 z-40 bg-blue-900 border-b-2 border-red-600 text-white shadow-lg">
      {/* Top Corporate Status Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between border-b border-blue-800/80 text-xs">
        {/* Brand & Mission-Critical Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-md font-black text-sm tracking-tighter">
              EC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black tracking-wider text-sm sm:text-base text-white">ESTOQUE CENTRAL</span>
                <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/40">
                  MISSÃO CRÍTICA
                </span>
              </div>
              <p className="hidden md:block text-[10px] text-blue-200">
                Logística Hospitalar & Suprimentos Corporativos
              </p>
            </div>
          </div>

          {/* Sync indicator */}
          <div className="hidden lg:block ml-4 pl-4 border-l border-blue-700/60">
            <SyncStatusBar isOnline={isOnline} />
          </div>
        </div>

        {/* Global Critical Alerts Badge & Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {totalCriticalAlerts > 0 && (
            <div
              onClick={() => onTabChange('dashboard')}
              className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600 text-white text-[11px] font-bold shadow-md animate-pulse hover:bg-red-700 transition"
              title={`${totalCriticalAlerts} alertas críticos pendentes`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{totalCriticalAlerts} Alertas</span>
            </div>
          )}

          {/* Quick Scanner & Labels */}
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-800 hover:bg-blue-700 border border-blue-700 text-xs text-white font-medium transition shadow-xs"
            title="Escanear QR Code / Código de Barras"
          >
            <Scan className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden sm:inline">Leitor QR</span>
          </button>

          <button
            onClick={onOpenLabels}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-800 hover:bg-blue-700 border border-blue-700 text-xs text-white font-medium transition shadow-xs"
            title="Gerar e Imprimir Etiquetas de Prateleira"
          >
            <Printer className="w-3.5 h-3.5 text-blue-300" />
            <span className="hidden sm:inline">Etiquetas</span>
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Profile Switcher */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-lg bg-blue-950/70 hover:bg-blue-950 border border-blue-700/80 transition group"
          >
            <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-extrabold text-white ${currentUser.role === 'ADM' ? 'bg-red-600' : 'bg-blue-600'}`}>
              {currentUser.role === 'ADM' ? 'ADM' : 'COL'}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-[11px] font-bold text-white group-hover:text-blue-200 truncate max-w-[110px]">
                {currentUser.name}
              </div>
              <div className="text-[9px] text-blue-300">
                {currentUser.role}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-blue-300" />
          </button>
        </div>
      </div>

      {/* Main Tab Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 flex overflow-x-auto no-scrollbar">
        <nav className="flex space-x-1 py-1">
          {canDashboard && (
            <button
              onClick={() => onTabChange('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-t-lg transition whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-slate-50 text-blue-900 border-t-2 border-red-500 shadow-sm'
                  : 'text-blue-100 hover:text-white hover:bg-blue-800/60'
              }`}
            >
              <Activity className="w-4 h-4 text-red-500" />
              <span>Central do Gestor</span>
              {criticalStockCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-600 text-white">
                  {criticalStockCount}
                </span>
              )}
            </button>
          )}

          {canInventory && (
            <button
              onClick={() => onTabChange('inventory')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-t-lg transition whitespace-nowrap ${
                activeTab === 'inventory'
                  ? 'bg-slate-50 text-blue-900 border-t-2 border-red-500 shadow-sm'
                  : 'text-blue-100 hover:text-white hover:bg-blue-800/60'
              }`}
            >
              <Package className="w-4 h-4 text-blue-400" />
              <span>Entrada & Saída / Estoque</span>
            </button>
          )}

          {canLaundry && (
            <button
              onClick={() => onTabChange('laundry')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-t-lg transition whitespace-nowrap ${
                activeTab === 'laundry'
                  ? 'bg-slate-50 text-blue-900 border-t-2 border-red-500 shadow-sm'
                  : 'text-blue-100 hover:text-white hover:bg-blue-800/60'
              }`}
            >
              <Shirt className="w-4 h-4 text-blue-300" />
              <span>Central de Lavanderia</span>
              {pendingLaundryCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-600 text-white animate-pulse">
                  {pendingLaundryCount}
                </span>
              )}
            </button>
          )}

          {canMachines && (
            <button
              onClick={() => onTabChange('machines')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-t-lg transition whitespace-nowrap ${
                activeTab === 'machines'
                  ? 'bg-slate-50 text-blue-900 border-t-2 border-red-500 shadow-sm'
                  : 'text-blue-100 hover:text-white hover:bg-blue-800/60'
              }`}
            >
              <Wrench className="w-4 h-4 text-amber-400" />
              <span>Máquinas & OS</span>
              {defectiveMachinesCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-600 text-white">
                  {defectiveMachinesCount}
                </span>
              )}
            </button>
          )}

          {canGUE && (
            <button
              onClick={() => onTabChange('gue')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-t-lg transition whitespace-nowrap ${
                activeTab === 'gue'
                  ? 'bg-slate-50 text-blue-900 border-t-2 border-red-500 shadow-sm'
                  : 'text-blue-100 hover:text-white hover:bg-blue-800/60'
              }`}
            >
              <Building2 className="w-4 h-4 text-blue-300" />
              <span>Unidades Externas (GUE's)</span>
              {pendingGUERequestsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                  {pendingGUERequestsCount}
                </span>
              )}
            </button>
          )}

          {canTeam && (
            <button
              onClick={() => onTabChange('team')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-t-lg transition whitespace-nowrap ${
                activeTab === 'team'
                  ? 'bg-slate-50 text-blue-900 border-t-2 border-red-500 shadow-sm'
                  : 'text-blue-100 hover:text-white hover:bg-blue-800/60'
              }`}
            >
              <Users className="w-4 h-4 text-indigo-300" />
              <span>Gestão de Equipe</span>
            </button>
          )}

          {canAudit && (
            <button
              onClick={() => onTabChange('audit')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-t-lg transition whitespace-nowrap ${
                activeTab === 'audit'
                  ? 'bg-slate-50 text-blue-900 border-t-2 border-red-500 shadow-sm'
                  : 'text-blue-100 hover:text-white hover:bg-blue-800/60'
              }`}
            >
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              <span>Auditoria & Conformidade (CRUD)</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};
