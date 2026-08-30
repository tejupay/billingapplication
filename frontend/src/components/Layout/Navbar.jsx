import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Shield, LogOut, PlusCircle, Building2, KeyRound, Zap } from 'lucide-react';

export const Navbar = ({ onOpenBilling, onOpenAudit, onOpenCompanyModal, onChangePassword }) => {
  const { currentUser, logout } = useAuth();
  const { shopDetails, isOnline, wsConnected } = useData();

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'OWNER': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'MANAGER': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'EMPLOYEE': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 h-16 px-6 flex items-center justify-between sticky top-0 z-30 shadow-md">
      {/* Yashas EV Service Brand Logo + Name + Live Sync Badge */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-white shadow-lg font-bold">
          <Zap className="w-5 h-5 text-emerald-400 fill-emerald-400" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span>{shopDetails?.name || 'YASHAS EV SERVICE'}</span>
            {isOnline ? (
              <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Live Sync
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full flex items-center gap-1">
                ⚡ Offline (Local Backup)
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400 font-sans">EV Service & Billing ERP</p>
        </div>
      </div>

      {/* Center Action Buttons */}
      <div className="hidden md:flex items-center gap-3">
        <button
          onClick={onOpenBilling}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition transform hover:-translate-y-0.5"
        >
          <PlusCircle className="w-4 h-4" /> Create Invoice
        </button>

        <button
          onClick={onOpenCompanyModal}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
        >
          <Building2 className="w-4 h-4 text-blue-400" /> Manage Company
        </button>

        {currentUser?.role === 'OWNER' && (
          <button
            onClick={onOpenAudit}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
          >
            <Shield className="w-4 h-4 text-purple-400" /> Audit Logs
          </button>
        )}
      </div>

      {/* Right User Profile & Controls */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-white">{currentUser?.fullName}</div>
            <div className="flex justify-end mt-0.5">
              <span className={`text-[10px] font-mono px-2 py-0.2 rounded border font-semibold ${getRoleBadgeColor(currentUser?.role)}`}>
                {currentUser?.role}
              </span>
            </div>
          </div>

          <button
            onClick={onChangePassword}
            title="Change Password"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-xl transition"
          >
            <KeyRound className="w-4 h-4" />
          </button>

          <button
            onClick={logout}
            title="Log Out"
            className="p-2 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
