/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storage';
import {
  UserProfile,
  MaterialItem,
  MachineEquipment,
  ServiceOrderOS,
  LaundryRecord,
  ExternalUnitGUE,
  GUERequest,
  InventoryMovement,
  AuditLogEntry
} from './types';
import { Header, NavTab } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { InventoryView } from './components/InventoryView';
import { LaundryView } from './components/LaundryView';
import { MachinesView } from './components/MachinesView';
import { GUEView } from './components/GUEView';
import { TeamView } from './components/TeamView';
import { AuditView } from './components/AuditView';
import { AuthModal } from './components/AuthModal';
import { QRScannerModal } from './components/QRScannerModal';
import { QRLabelModal } from './components/QRLabelModal';
import { BackupRecoveryModal } from './components/BackupRecoveryModal';
import { ABCAnalysisModal } from './components/ABCAnalysisModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { useOnlineStatus } from './hooks/usePWAInstall';
import { ShieldCheck, RefreshCw, AlertTriangle, Archive } from 'lucide-react';

export default function App() {
  const isOnline = useOnlineStatus();

  // App State
  const [currentUser, setCurrentUser] = useState<UserProfile>(StorageService.getCurrentUser());
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [machines, setMachines] = useState<MachineEquipment[]>([]);
  const [osList, setOsList] = useState<ServiceOrderOS[]>([]);
  const [laundryRecords, setLaundryRecords] = useState<LaundryRecord[]>([]);
  const [gues, setGues] = useState<ExternalUnitGUE[]>([]);
  const [gueRequests, setGueRequests] = useState<GUERequest[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [minThreshold, setMinThreshold] = useState<number>(50);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Modals state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showLabelsModal, setShowLabelsModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showABCModal, setShowABCModal] = useState(false);
  const [labelPreselectedCode, setLabelPreselectedCode] = useState<string | undefined>(undefined);
  const [inventoryFilterCode, setInventoryFilterCode] = useState<string>('');

  // Reload data from local storage
  const reloadData = () => {
    setCurrentUser(StorageService.getCurrentUser());
    setUsers(StorageService.getUsers());
    setMaterials(StorageService.getMaterials());
    setMachines(StorageService.getMachines());
    setOsList(StorageService.getServiceOrders());
    setLaundryRecords(StorageService.getLaundryRecords());
    setGues(StorageService.getGUEs());
    setGueRequests(StorageService.getGUERequests());
    setMovements(StorageService.getMovements());
    setAuditLogs(StorageService.getAuditLogs());
    setMinThreshold(StorageService.getMinimumStockThreshold());
  };

  useEffect(() => {
    StorageService.init();
    reloadData();

    // Listen for real-time synchronization events (from BroadcastChannel or other tabs)
    const handleDataChanged = () => {
      reloadData();
    };

    window.addEventListener('estoque_data_changed', handleDataChanged);
    window.addEventListener('storage', handleDataChanged);

    return () => {
      window.removeEventListener('estoque_data_changed', handleDataChanged);
      window.removeEventListener('storage', handleDataChanged);
    };
  }, []);

  // Handle scanned QR code
  const handleScanResult = (code: string) => {
    // Check if code matches material, machine, or shelf
    const isMaterial = materials.some(m => m.code.toUpperCase() === code.toUpperCase());
    const isMachine = machines.some(m => m.code.toUpperCase() === code.toUpperCase());

    if (isMaterial) {
      setInventoryFilterCode(code);
      setActiveTab('inventory');
    } else if (isMachine) {
      setActiveTab('machines');
    } else {
      // Default to inventory search
      setInventoryFilterCode(code);
      setActiveTab('inventory');
    }
  };

  const handleOpenLabels = (code?: string) => {
    setLabelPreselectedCode(code);
    setShowLabelsModal(true);
  };

  const handleUserChanged = (newUser: UserProfile) => {
    setCurrentUser(newUser);
    // If user doesn't have access to current tab, redirect to permitted tab
    if (activeTab === 'team' && newUser.role !== 'ADM' && !newUser.permissions.canAccessTeam) {
      setActiveTab('inventory');
    }
    if (activeTab === 'dashboard' && newUser.role !== 'ADM' && !newUser.permissions.canAccessDashboard) {
      setActiveTab('inventory');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Offline Mode Alert Banner */}
      <OfflineIndicator />

      {/* Corporate Header with Red, White & Blue palette */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => {
          setInventoryFilterCode('');
          setActiveTab(tab);
        }}
        currentUser={currentUser}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenScanner={() => setShowScannerModal(true)}
        onOpenLabels={() => handleOpenLabels()}
        materials={materials}
        machines={machines}
        laundryRecords={laundryRecords}
        gueRequests={gueRequests}
        minThreshold={minThreshold}
        isOnline={isOnline}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            materials={materials}
            machines={machines}
            osList={osList}
            laundryRecords={laundryRecords}
            gues={gues}
            gueRequests={gueRequests}
            movements={movements}
            currentUser={currentUser}
            minThreshold={minThreshold}
            onNavigateTab={setActiveTab}
            onOpenScanner={() => setShowScannerModal(true)}
            onOpenABCAnalysis={() => setShowABCModal(true)}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryView
            materials={materials}
            currentUser={currentUser}
            minThreshold={minThreshold}
            onOpenScanner={() => setShowScannerModal(true)}
            onOpenLabels={handleOpenLabels}
            onOpenABCAnalysis={() => setShowABCModal(true)}
            filterCode={inventoryFilterCode}
          />
        )}

        {activeTab === 'laundry' && (
          <LaundryView
            laundryRecords={laundryRecords}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'machines' && (
          <MachinesView
            machines={machines}
            osList={osList}
            currentUser={currentUser}
            onOpenLabels={handleOpenLabels}
          />
        )}

        {activeTab === 'gue' && (
          <GUEView
            gues={gues}
            gueRequests={gueRequests}
            materials={materials}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'team' && (
          <TeamView
            users={users}
            currentUser={currentUser}
            onOpenBackup={() => setShowBackupModal(true)}
          />
        )}

        {activeTab === 'audit' && (
          <AuditView
            auditLogs={auditLogs}
            users={users}
            currentUser={currentUser}
          />
        )}
      </main>

      {/* Corporate Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-4 px-6 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
            <span className="font-extrabold text-white tracking-wide">ESTOQUE CENTRAL</span>
            <span className="text-slate-500">|</span>
            <span>Sistema Corporativo de Missão Crítica</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <span>Perfil Ativo: <strong className="text-white">{currentUser.name} ({currentUser.role})</strong></span>

            {currentUser.role === 'ADM' && (
              <button
                onClick={() => setShowBackupModal(true)}
                className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition"
                title="Exportar ou restaurar backup comprimido do sistema"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Backup (.ecbak)</span>
              </button>
            )}

            <button
              onClick={() => StorageService.resetToDemoData(currentUser)}
              className="text-slate-400 hover:text-red-400 transition underline"
              title="Restaurar dados iniciais para demonstração"
            >
              Restaurar Padrão Fábrica
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        currentUser={currentUser}
        users={users}
        onUserChanged={handleUserChanged}
      />

      <QRScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        onScanResult={handleScanResult}
        materials={materials}
        machines={machines}
      />

      <QRLabelModal
        isOpen={showLabelsModal}
        onClose={() => setShowLabelsModal(false)}
        materials={materials}
        machines={machines}
        preselectedCode={labelPreselectedCode}
      />

      <BackupRecoveryModal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        currentUser={currentUser}
        onBackupRestored={reloadData}
      />

      <ABCAnalysisModal
        isOpen={showABCModal}
        onClose={() => setShowABCModal(false)}
        materials={materials}
        movements={movements}
        currentUser={currentUser}
      />
    </div>
  );
}
