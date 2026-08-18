import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { ShieldCheck, KeyRound, UserCheck, AlertCircle, Send, RefreshCw, Lock } from 'lucide-react';

export const LoginModal = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // OTP Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [inputOtp, setInputOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isSendingMail, setIsSendingMail] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(username, password);
    if (!res.success) {
      setError(res.message);
    }
  };

  const sendApiRequest = async (endpoint, payload) => {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    return { ok: res.ok, data };
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setOtpError('');
    setOtpSuccess('');
    setIsSendingMail(true);

    try {
      const { ok, data } = await sendApiRequest('/api/auth/forgot-password/request', { email: forgotEmail });
      setIsSendingMail(false);

      if (ok) {
        setOtpSent(true);
        const recipient = data.email || forgotEmail;
        let msg = data.message || `📧 OTP sent successfully via Email to ${recipient}! Please check your Gmail inbox (and Spam folder).`;
        if (data.otpCode) {
          msg += ` [Dev OTP: ${data.otpCode}]`;
          setInputOtp(data.otpCode);
        }
        setOtpSuccess(msg);
      } else {
        setOtpError(data.message || 'Failed to request OTP. Please check your backend connection.');
      }
    } catch (err) {
      setIsSendingMail(false);
      setOtpError('Unable to connect to Spring Boot backend at http://localhost:8080. Make sure the backend server is running.');
    }
  };

  const handleVerifyReset = async (e) => {
    e.preventDefault();
    setOtpError('');
    setOtpSuccess('');

    try {
      const { ok, data } = await sendApiRequest('/api/auth/forgot-password/reset', {
        email: forgotEmail,
        otp: inputOtp,
        newPassword: newPassword
      });

      if (ok) {
        setOtpSuccess(data.message || 'Password reset successfully! You can now log in with your new password.');
        setTimeout(() => {
          setShowForgotModal(false);
          setOtpSent(false);
          setInputOtp('');
          setNewPassword('');
        }, 2500);
      } else {
        setOtpError(data.message || 'Invalid or expired OTP code.');
      }
    } catch (err) {
      setOtpError('Failed to verify OTP with backend server.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl"></div>

        <div className="text-center mb-6 relative">
          <img
            src="/tejupay-logo.svg"
            alt="TejuPay Logo"
            className="w-16 h-16 mx-auto mb-3 rounded-full shadow-lg shadow-blue-900/50"
          />
          <h2 className="text-2xl font-bold font-heading text-white">
            Teju<span className="text-blue-400">Pay</span>
          </h2>
          <p className="text-slate-400 text-xs mt-1">Smart GST Billing & Business Management Platform</p>
        </div>

        {error && (
          <div className="mb-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-lg p-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email or Username</label>
            <div className="relative">
              <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="name@company.com or username"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-medium text-slate-300">Password</label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-xs text-blue-400 hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-lg text-sm transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 mt-2"
          >
            <Lock className="w-4 h-4" /> Secure Log In
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500">
            Internal ERP Access Only • No Public Signup • Protected by JWT & Audit Logging
          </p>
        </div>
      </div>

      {/* Forgot Password OTP Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-400" /> Reset Password via OTP
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {otpSent
                ? 'Enter the 6-digit one-time password sent to your registered email along with your new password.'
                : 'Enter your account email to receive a single-use OTP code.'}
            </p>

            {otpSuccess && (
              <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-lg p-3">
                {otpSuccess}
              </div>
            )}
            {otpError && (
              <div className="mb-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-lg p-3">
                {otpError}
              </div>
            )}

            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Registered Email</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                    placeholder="name@company.com"
                    required
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingMail}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                  >
                    {isSendingMail ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sending Email...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" /> Send OTP
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyReset} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">6-Digit OTP Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={inputOtp}
                    onChange={(e) => setInputOtp(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white tracking-widest text-center font-mono"
                    placeholder="123456"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Resend
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
