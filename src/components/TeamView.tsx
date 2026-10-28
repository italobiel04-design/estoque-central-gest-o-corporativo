/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Key,
  CheckCircle,
  XCircle,
  Edit2,
  Lock,
  Unlock,
  Trash2,
  Phone,
  Mail,
  Building,
  Check,
  X,
  Archive,
  Download,
  Upload
} from 'lucide-react';
import { UserProfile, UserRole, UserPermissions } from '../types';
import { StorageService } from '../services/storage';

interface TeamViewProps {
  users: UserProfile[];
  currentUser: UserProfile;
  onOpenBackup: () => void;
}

export const TeamView: React.FC<TeamViewProps> = ({ users, currentUser, onOpenBackup }) => {
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  // Form states
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('COLABORADOR');
  const [userPhone, setUserPhone] = useState('');
  const [userSector, setUserSector] = useState('');
  const [userActive, setUserActive] = useState(true);
  const [userPassword, setUserPassword] = useState('123');

  // Granular permissions checkboxes
  const [permissions, setPermissions] = useState<UserPermissions>({
    canAccessDashboard: true,
    canAccessInventory: true,
    canAccessLaundry: true,
    canAccessMachines: true,
    canAccessGUE: true,
    canAccessTeam: false,
    canAccessAudit: false,
    canApproveRequests: false,
    canExportReports: true,
  });

  const [formError, setFormError] = useState<string | null>(null);

  const openNewUser = () => {
    setEditingUser(null);
    setUserName('');
    setUserEmail('');
    setUserRole('COLABORADOR');
    setUserPhone('(11) 9');
    setUserSector('Almoxarifado Central');
    setUserActive(true);
    setUserPassword('123');
    setPermissions({
      canAccessDashboard: true,
      canAccessInventory: true,
      canAccessLaundry: true,
      canAccessMachines: true,
      canAccessGUE: true,
      canAccessTeam: false,
      canAccessAudit: false,
      canApproveRequests: false,
      canExportReports: true,
    });
    setFormError(null);
    setShowUserModal(true);
  };

  const openEditUser = (u: UserProfile) => {
    setEditingUser(u);
    setUserName(u.name);
    setUserEmail(u.email);
    setUserRole(u.role);
    setUserPhone(u.phone);
    setUserSector(u.assignedSector);
    setUserActive(u.active);
    setUserPassword(u.password || '123');
    setPermissions({ ...u.permissions });
    setFormError(null);
    setShowUserModal(true);
  };

  const handleTogglePermission = (key: keyof UserPermissions) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!userName.trim() || !userEmail.trim()) {
      setFormError('Nome e E-mail são de preenchimento obrigatório.');
      return;
    }

    const payload: UserProfile = {
      id: editingUser ? editingUser.id : `usr-${Date.now()}`,
      name: userName.trim(),
      email: userEmail.trim().toLowerCase(),
      role: userRole,
      password: userPassword || '123',
      active: userActive,
      phone: userPhone.trim(),
      assignedSector: userSector.trim(),
      permissions: userRole === 'ADM'
        ? {
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
        : permissions
    };

    const res = StorageService.saveUser(payload, currentUser);
    if (!res.success) {
      setFormError(res.error || 'Erro ao salvar usuário.');
    } else {
      setShowUserModal(false);
    }
  };

  const handleToggleActive = (u: UserProfile) => {
    if (u.id === currentUser.id) {
      alert('Você não pode desativar seu próprio usuário conectado.');
      return;
    }
    const updated = { ...u, active: !u.active };
    StorageService.saveUser(updated, currentUser);
  };

  const handleDeleteUser = (u: UserProfile) => {
    if (confirm(`Tem certeza que deseja remover o colaborador ${u.name}?`)) {
      const res = StorageService.deleteUser(u.id, currentUser);
      if (!res.success) {
        alert(res.error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-900" />
            Gestão de Equipe & Administração Central
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Painel exclusivo do Administrador: controle de acessos, permissões por aba e backup/recuperação do sistema.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenBackup}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition active:scale-95"
          >
            <Archive className="w-4 h-4 text-emerald-300" />
            <span>Backup & Recuperação (JSON Comprimido)</span>
          </button>

          <button
            onClick={openNewUser}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition active:scale-95"
          >
            <UserPlus className="w-4 h-4 text-red-400" />
            <span>Novo Colaborador</span>
          </button>
        </div>
      </div>

      {/* Backup and Disaster Recovery Highlight Card */}
      <div className="bg-emerald-50/60 border border-emerald-300 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Archive className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-black text-emerald-950 text-sm">
              Camada de Backup & Recuperação de Desastre (GZIP .ecbak)
            </h4>
            <p className="text-[11px] text-emerald-800">
              Gere cópias de segurança instantâneas em JSON comprimido ou restaure dados completos a qualquer momento para garantir conformidade corporativa.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenBackup}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs transition shadow-xs shrink-0 flex items-center gap-1.5"
        >
          <span>Gerenciar Backups</span>
        </button>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((u) => {
          const isMe = u.id === currentUser.id;

          return (
            <div
              key={u.id}
              className={`bg-white rounded-2xl border shadow-xs overflow-hidden flex flex-col justify-between transition ${
                !u.active ? 'opacity-60 border-slate-300' : 'border-slate-200 hover:border-blue-400'
              }`}
            >
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-xs ${
                        u.role === 'ADM' ? 'bg-red-600' : 'bg-blue-900'
                      }`}
                    >
                      {u.role === 'ADM' ? 'ADM' : 'COL'}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        {u.name}
                        {isMe && <span className="text-[10px] text-blue-600 font-bold">(Você)</span>}
                      </h3>
                      <p className="text-[10px] text-slate-500">{u.assignedSector}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      u.active
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {u.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    <span className="font-mono text-[11px] truncate">{u.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    <span>{u.phone}</span>
                  </div>
                </div>
              </div>

              {/* Granular Permission Tags */}
              <div className="p-5 bg-slate-50 space-y-2.5 flex-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Acessos e Permissões Ativas
                </span>

                <div className="flex flex-wrap gap-1.5">
                  {u.role === 'ADM' ? (
                    <span className="px-2 py-1 rounded bg-red-100 text-red-800 text-[10px] font-bold border border-red-300">
                      ★ Acesso Total Administrativo
                    </span>
                  ) : (
                    <>
                      {u.permissions.canAccessDashboard && (
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-medium">
                          Dashboard
                        </span>
                      )}
                      {u.permissions.canAccessInventory && (
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-medium">
                          Estoque
                        </span>
                      )}
                      {u.permissions.canAccessLaundry && (
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-medium">
                          Lavanderia
                        </span>
                      )}
                      {u.permissions.canAccessMachines && (
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-medium">
                          Máquinas
                        </span>
                      )}
                      {u.permissions.canAccessGUE && (
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-medium">
                          GUE's
                        </span>
                      )}
                      {u.permissions.canAccessAudit && (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-medium">
                          Auditoria
                        </span>
                      )}
                      {u.permissions.canApproveRequests && (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-medium">
                          Aprovar GUE
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => handleToggleActive(u)}
                  disabled={isMe}
                  className={`flex items-center gap-1 font-semibold ${
                    u.active ? 'text-amber-700 hover:text-amber-800' : 'text-emerald-700 hover:text-emerald-800'
                  } disabled:opacity-40`}
                >
                  {u.active ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  <span>{u.active ? 'Desativar' : 'Reativar'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditUser(u)}
                    className="p-1 text-slate-600 hover:text-blue-900 rounded"
                    title="Editar dados e permissões"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {!isMe && (
                    <button
                      onClick={() => handleDeleteUser(u)}
                      className="p-1 text-red-600 hover:text-red-700 rounded"
                      title="Excluir usuário"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE / EDIT USER MODAL */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="bg-blue-900 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingUser ? 'Editar Usuário & Permissões' : 'Cadastrar Novo Usuário da Equipe'}
              </h3>
              <button onClick={() => setShowUserModal(false)} className="text-white/80 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-lg text-xs font-semibold">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Ex: Carlos Eduardo Lima"
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Perfil de Acesso *</label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value as UserRole)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white font-bold text-blue-950 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  >
                    <option value="COLABORADOR">Colaborador Operacional</option>
                    <option value="ADM">Administrador Geral (ADM)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">E-mail Corporativo *</label>
                  <input
                    type="email"
                    required
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="exemplo@estoquecentral.com"
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Senha de Acesso</label>
                  <input
                    type="password"
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Setor / Lotação</label>
                  <input
                    type="text"
                    value={userSector}
                    onChange={(e) => setUserSector(e.target.value)}
                    placeholder="Ex: Almoxarifado Central"
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5"
                  />
                </div>
              </div>

              {/* Granular Permissions Checkbox Matrix */}
              {userRole === 'COLABORADOR' && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 uppercase">
                      Permissões Granulares por Módulo
                    </span>
                    <span className="text-[10px] text-slate-500">Defina o que o colaborador pode acessar</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions.canAccessDashboard}
                        onChange={() => handleTogglePermission('canAccessDashboard')}
                        className="rounded text-blue-900 focus:ring-blue-600"
                      />
                      <span>Central do Gestor</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions.canAccessInventory}
                        onChange={() => handleTogglePermission('canAccessInventory')}
                        className="rounded text-blue-900 focus:ring-blue-600"
                      />
                      <span>Entrada & Saída</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions.canAccessLaundry}
                        onChange={() => handleTogglePermission('canAccessLaundry')}
                        className="rounded text-blue-900 focus:ring-blue-600"
                      />
                      <span>Lavanderia</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions.canAccessMachines}
                        onChange={() => handleTogglePermission('canAccessMachines')}
                        className="rounded text-blue-900 focus:ring-blue-600"
                      />
                      <span>Máquinas & OS</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions.canAccessGUE}
                        onChange={() => handleTogglePermission('canAccessGUE')}
                        className="rounded text-blue-900 focus:ring-blue-600"
                      />
                      <span>Unidades GUE</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions.canAccessAudit}
                        onChange={() => handleTogglePermission('canAccessAudit')}
                        className="rounded text-blue-900 focus:ring-blue-600"
                      />
                      <span>Consultar Auditoria</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions.canApproveRequests}
                        onChange={() => handleTogglePermission('canApproveRequests')}
                        className="rounded text-blue-900 focus:ring-blue-600"
                      />
                      <span>Aprovação de GUE</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions.canExportReports}
                        onChange={() => handleTogglePermission('canExportReports')}
                        className="rounded text-blue-900 focus:ring-blue-600"
                      />
                      <span>Exportação de PDFs</span>
                    </label>
                  </div>
                </div>
              )}

              {userRole === 'ADM' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
                  <strong>Perfil ADM:</strong> Possui acesso integral irrestrito a todos os módulos, aprovações soberanas, gestão de equipe e relatórios do sistema.
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-md transition"
                >
                  Salvar Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
