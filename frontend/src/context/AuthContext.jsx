import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

const AuthContext = createContext();

// Version key — bump this whenever you change INITIAL_ACCOUNTS to force-clear stale cache
const ACCOUNTS_VERSION = 'v4';

export const INITIAL_ACCOUNTS = [
  {
    id: 1,
    username: 'tejutejasteju7779@gmail.com',
    email: 'tejutejasteju7779@gmail.com',
    fullName: 'Tejas Y (Owner)',
    password: '123456789',
    role: 'OWNER',
    tenantName: 'GreenDrive EV Motors',
    active: true
  },
  {
    id: 2,
    username: 'owner',
    email: 'tejupay@gmail.com',
    fullName: 'Tejas Y (Owner)',
    password: '123456789',
    role: 'OWNER',
    tenantName: 'GreenDrive EV Motors',
    active: true
  }
];

// Always seed fresh accounts on version mismatch, preventing stale cache issues
const loadAccounts = () => {
  const storedVersion = localStorage.getItem('erp_accounts_version');
  if (storedVersion !== ACCOUNTS_VERSION) {
    // Clear old data and reseed
    localStorage.removeItem('erp_accounts');
    localStorage.removeItem('erp_user');
    localStorage.setItem('erp_accounts_version', ACCOUNTS_VERSION);
    return INITIAL_ACCOUNTS;
  }
  try {
    const saved = localStorage.getItem('erp_accounts');
    if (!saved) return INITIAL_ACCOUNTS;
    const parsed = JSON.parse(saved);
    // Ensure every INITIAL_ACCOUNT is present with up-to-date password
    const merged = [...parsed];
    INITIAL_ACCOUNTS.forEach(initAcc => {
      const idx = merged.findIndex(
        a => a.email.toLowerCase() === initAcc.email.toLowerCase()
          || a.username.toLowerCase() === initAcc.username.toLowerCase()
      );
      if (idx === -1) {
        merged.push(initAcc);
      } else {
        // Update password and role to match latest INITIAL_ACCOUNTS
        merged[idx] = { ...merged[idx], password: initAcc.password, role: initAcc.role, active: true };
      }
    });
    return merged;
  } catch {
    return INITIAL_ACCOUNTS;
  }
};

export const AuthProvider = ({ children }) => {
  const [accounts, setAccounts] = useState(loadAccounts);

  const [currentUser, setCurrentUser] = useState(() => {
    if (localStorage.getItem('erp_accounts_version') !== ACCOUNTS_VERSION) return null;
    try {
      const saved = localStorage.getItem('erp_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('erp_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('erp_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('erp_accounts', JSON.stringify(accounts));
  }, [accounts]);

  const login = async (usernameInput, passwordInput) => {
    const cleanUser = (usernameInput || '').trim().toLowerCase();
    const cleanPass = (passwordInput || '').trim();

    if (!cleanUser || !cleanPass) {
      return { success: false, message: 'Please enter both email/username and password.' };
    }

    // Try backend REST API authentication first
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUser, password: cleanPass })
      });

      const data = await res.json();
      if (res.ok && data.token) {
        const userObj = {
          id: data.id || 1,
          username: data.username,
          email: data.email || cleanUser,
          fullName: data.fullName,
          role: data.role,
          token: data.token,
          tenantName: data.tenantName,
          active: true
        };
        setCurrentUser(userObj);
        return { success: true, user: userObj };
      }
    } catch (err) {
      // Backend offline — fallback to local accounts below
    }

    // Local account fallback — checks current in-memory accounts
    const account = accounts.find(a =>
      a.username.toLowerCase() === cleanUser ||
      a.email.toLowerCase() === cleanUser
    );

    if (!account) {
      return { success: false, message: 'No account found with that email or username.' };
    }
    if (!account.active) {
      return { success: false, message: 'This account has been deactivated.' };
    }
    if (account.password !== cleanPass) {
      return { success: false, message: 'Incorrect password. Please try again.' };
    }

    setCurrentUser(account);
    return { success: true, user: account };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const changePassword = (userId, newPassword) => {
    const updated = accounts.map(a => a.id === userId ? { ...a, password: newPassword } : a);
    setAccounts(updated);
    if (currentUser?.id === userId) {
      setCurrentUser(prev => ({ ...prev, password: newPassword }));
    }
    return { success: true, message: 'Password updated successfully!' };
  };

  const createStaffAccount = (newUser) => {
    if (accounts.some(a => a.username.toLowerCase() === newUser.username.toLowerCase())) {
      return { success: false, message: 'Username already taken' };
    }
    const created = {
      id: Date.now(),
      ...newUser,
      tenantName: currentUser?.tenantName || 'GreenDrive EV Motors',
      active: true
    };
    setAccounts(prev => [...prev, created]);
    return { success: true, user: created };
  };

  const toggleAccountStatus = (id) => {
    setAccounts(prev => prev.map(a => a.id === id && a.role !== 'OWNER' ? { ...a, active: !a.active } : a));
  };

  const updateAccount = (id, updatedData) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updatedData } : a));
    if (currentUser?.id === id) {
      setCurrentUser(prev => ({ ...prev, ...updatedData }));
    }
    return { success: true };
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      setCurrentUser,
      accounts,
      login,
      logout,
      changePassword,
      createStaffAccount,
      toggleAccountStatus,
      updateAccount,
      INITIAL_ACCOUNTS
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
