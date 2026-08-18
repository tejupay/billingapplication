import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { KeyRound, X, Save, CheckCircle, Lock } from 'lucide-react';

export const ChangePasswordModal = ({ isOpen, onClose }) => {
  const { currentUser, changePassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setMsg(''); setErr('');

    if (!newPassword || newPassword.length < 4) {
      setErr('Password must be at least 4 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErr('New password and confirmation do not match.');
      return;
    }

    const res = changePassword(currentUser.id, newPassword);
    if (res.success) {
      setMsg(`Password updated successfully for ${currentUser.fullName}!`);
      setTimeout(() => {
        setMsg('');
        setNewPassword('');
        setConfirmPassword('');
        onClose();
      }, 1500);
    } else {
      setErr('Failed to change password.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-white font-bold">
            <KeyRound className="w-5 h-5 text-blue-400" />
            <span>Change Password ({currentUser?.fullName})</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {msg && (
          <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-lg p-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{msg}</span>
          </div>
        )}
        {err && (
          <div className="mb-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-lg p-3">
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
              placeholder="Enter new password"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
              placeholder="Confirm new password"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" /> Save Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
