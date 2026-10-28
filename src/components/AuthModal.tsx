/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Shield, User, Key, CheckCircle, LogIn, ArrowRight } from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { StorageService } from '../services/storage';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  users: UserProfile[];
  onUserChanged: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  onUserChanged
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSelectPredefined = (u: UserProfile) => {
    StorageService.setCurrentUser(u);
    onUserChanged(u);
    onClose();
  };

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const found = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!found) {
      setErrorMsg('Usuário não cadastrado no Estoque Central.');
      return;
    }
    if (!found.active) {
      setErrorMsg('Este usuário foi desativado pelo administrador.');
      return;
    }
    StorageService.setCurrentUser(found);
    onUserChanged(found);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-blue-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-md">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base tracking-wide">ESTOQUE CENTRAL</h3>
              <p className="text-xs text-blue-200">Autenticação Corporativa & Perfis</p>
            </div>
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Active User Card */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${currentUser.role === 'ADM' ? 'bg-red-600' : 'bg-blue-600'}`}>
                {currentUser.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">{currentUser.name}</p>
                <p className="text-[10px] text-slate-500">{currentUser.email}</p>
              </div>
            </div>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${currentUser.role === 'ADM' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
              {currentUser.role} ATIVO
            </span>
          </div>

          {/* Quick Profile Switch (Simulates Real Multi-User Workplace) */}
          <div>
            <span className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
              Alternar Usuário Rápido (Simulação de Multi-Colaboradores)
            </span>
            <div className="space-y-2">
              {users.map((u) => {
                const isCurrent = u.id === currentUser.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => handleSelectPredefined(u)}
                    className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between ${
                      isCurrent
                        ? 'border-blue-600 bg-blue-50/70'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                          u.role === 'ADM' ? 'bg-red-600' : 'bg-blue-800'
                        }`}
                      >
                        {u.role === 'ADM' ? 'ADM' : 'COL'}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-900 truncate">{u.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{u.assignedSector}</p>
                      </div>
                    </div>
                    {isCurrent ? (
                      <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                    ) : (
                      <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Manual Credential Login */}
          <div className="border-t border-slate-200 pt-4">
            <span className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
              Ou Entrar com Credenciais Individuais
            </span>
            {errorMsg && (
              <div className="p-2 mb-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                {errorMsg}
              </div>
            )}
            <form onSubmit={handleFormLogin} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">E-mail Corporativo</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ex: usuario@estoquecentral.com"
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Senha de Acesso</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <LogIn className="w-4 h-4 text-red-400" />
                Autenticar no Estoque Central
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
