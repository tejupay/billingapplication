import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserCheck, UserPlus, Shield, CheckCircle, XCircle, Calendar, Plus, Edit3 } from 'lucide-react';

export const EmployeeManager = () => {
  const { currentUser, accounts, createStaffAccount, toggleAccountStatus, updateAccount } = useAuth();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState('EMPLOYEE');

  // Edit Account state
  const [editingAccount, setEditingAccount] = useState(null);
  const [editFullName, setEditFullName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('EMPLOYEE');

  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const handleCreateStaff = (e) => {
    e.preventDefault();
    setMsg(''); setErr('');
    const res = createStaffAccount({
      username: newUsername,
      email: newEmail,
      password: newPassword,
      fullName: newFullName,
      role: newRole
    });

    if (res.success) {
      setMsg(`Account created for ${newFullName} (${newRole})! Username: ${newUsername}`);
      setShowCreateModal(false);
      setNewUsername(''); setNewEmail(''); setNewPassword(''); setNewFullName('');
    } else {
      setErr(res.message);
    }
  };

  const handleStartEdit = (acc) => {
    setEditingAccount(acc);
    setEditFullName(acc.fullName);
    setEditUsername(acc.username);
    setEditEmail(acc.email);
    setEditRole(acc.role);
    setErr('');
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    setMsg(''); setErr('');

    if (!editFullName.trim() || !editUsername.trim() || !editEmail.trim()) {
      setErr('All fields are required.');
      return;
    }

    const res = updateAccount(editingAccount.id, {
      fullName: editFullName,
      username: editUsername,
      email: editEmail,
      role: editRole
    });

    if (res.success) {
      setMsg(`Account updated successfully for ${editFullName}!`);
      setEditingAccount(null);
    } else {
      setErr(res.message || 'Failed to update account');
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div>
          <h2 className="text-xl font-bold font-heading text-white">Employee Roster Control</h2>
          <p className="text-xs text-slate-400 mt-0.5">Owner account creation portal, name editing & staff access status.</p>
        </div>

        {currentUser?.role === 'OWNER' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30"
          >
            <UserPlus className="w-4 h-4" /> Create Staff Account
          </button>
        )}
      </div>

      {msg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl p-4 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{msg}</span>
        </div>
      )}

      {/* Staff Roster Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Active Staff Accounts</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4">Staff Member</th>
                <th className="p-4">Username / Email</th>
                <th className="p-4">System Role</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Actions / Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {accounts.map(acc => (
                <tr key={acc.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-4 font-semibold text-white">
                    <div className="flex items-center gap-2">
                      <span>{acc.fullName}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-400">
                    <div className="font-mono text-white">{acc.username}</div>
                    <div className="text-[10px] text-slate-500">{acc.email}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      acc.role === 'OWNER' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' :
                      acc.role === 'MANAGER' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {acc.role}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${acc.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {acc.active ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {(currentUser?.role === 'OWNER' || currentUser?.id === acc.id) && (
                        <button
                          onClick={() => handleStartEdit(acc)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 rounded text-[10px] font-semibold flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" /> Edit Name
                        </button>
                      )}
                      {currentUser?.role === 'OWNER' && acc.role !== 'OWNER' && (
                        <button
                          onClick={() => toggleAccountStatus(acc.id)}
                          className={`px-2.5 py-1 rounded text-[10px] font-semibold ${
                            acc.active ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {acc.active ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Account Modal */}
      {editingAccount && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Edit Account Credentials</h3>
            <p className="text-xs text-slate-400 mb-4">Modify full name, username, email or role for {editingAccount.fullName}.</p>

            {err && (
              <div className="mb-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-lg p-3">
                {err}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  placeholder="e.g. Rajesh Sharma"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Username</label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Assigned Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  disabled={editingAccount.role === 'OWNER'}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-white disabled:opacity-50"
                >
                  <option value="OWNER">OWNER (Full Business Control)</option>
                  <option value="MANAGER">MANAGER (Inventory & Store)</option>
                  <option value="EMPLOYEE">EMPLOYEE (Sales POS)</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Owner Account Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Create Staff Credentials</h3>
            <p className="text-xs text-slate-400 mb-4">No open public signup allowed. Owner must create accounts.</p>

            {err && (
              <div className="mb-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-lg p-3">
                {err}
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  placeholder="e.g. Rahul Sharma"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Username</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                    placeholder="rahuls"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    placeholder="rahul@apex.com"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Initial Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Assigned Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-white"
                  >
                    <option value="EMPLOYEE">EMPLOYEE (Sales POS)</option>
                    <option value="MANAGER">MANAGER (Inventory & Store)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
