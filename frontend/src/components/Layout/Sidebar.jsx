import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Receipt, 
  Package, 
  Users, 
  UserCheck, 
  DollarSign, 
  FileText, 
  ShieldAlert,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { currentUser } = useAuth();
  const role = currentUser?.role || 'EMPLOYEE';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['OWNER', 'MANAGER', 'EMPLOYEE'] },
    { id: 'billing', label: 'Billing & Invoices', icon: Receipt, roles: ['OWNER', 'MANAGER', 'EMPLOYEE'] },
    { id: 'inventory', label: 'Stock & Inventory', icon: Package, roles: ['OWNER', 'MANAGER'] },
    { id: 'customers', label: 'Customer Ledger', icon: Users, roles: ['OWNER', 'MANAGER', 'EMPLOYEE'] },
    { id: 'employees', label: 'Employee Roster', icon: UserCheck, roles: ['OWNER', 'MANAGER'] },
    { id: 'expenses', label: 'Business Expenses', icon: DollarSign, roles: ['OWNER'] },
    { id: 'reports', label: 'Reports & Statements', icon: FileText, roles: ['OWNER', 'MANAGER'] },
    { id: 'audit', label: 'Security & Audit Logs', icon: ShieldAlert, roles: ['OWNER'] },
  ];

  const visibleItems = navItems.filter(item => item.roles.includes(role));

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)]">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Main Menu ({role})
        </div>
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-400" />}
            </button>
          );
        })}
      </div>

      {/* Role-Specific Security Note */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-400">
        <div className="font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
          Access Level: <span className="text-blue-400 font-mono">{role}</span>
        </div>
        <p className="text-[10px] text-slate-500">
          {role === 'EMPLOYEE' && 'Restricted from financial profit graphs and user creation.'}
          {role === 'MANAGER' && 'Full inventory & invoice control. Employee sales visible.'}
          {role === 'OWNER' && 'Full system control, profit analytics & user management.'}
        </p>
      </div>
    </aside>
  );
};
