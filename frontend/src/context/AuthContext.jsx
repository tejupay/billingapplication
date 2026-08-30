import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config';

const AuthContext = createContext();

const ACCOUNTS_VERSION = 'v5';

export const INITIAL_ACCOUNTS = [
  {
    id: 1,
    username: 'tejutejasteju7779@gmail.com',
    email: 'tejutejasteju7779@gmail.com',
    fullName: 'Tejas Y (Owner)',
    password: '123456789',
    role: 'OWNER',
    tenantName: 'Yashas EV Service',
    active: true
  },
  {
    id: 2,
    username: 'owner',
    email: 'tejupay@gmail.com',
    fullName: 'Tejas Y (Owner)',
    password: '123456789',
    role: 'OWNER',
    tenantName: 'Yashas EV Service',
    active: true
  }
];

const loadAccounts = () => {
  const storedVersion = localStorage.getItem('erp_accounts_version');
  if (storedVersion !== ACCOUNTS_VERSION) {
    localStorage.removeItem('erp_accounts');
    localStorage.removeItem('erp_user');
    localStorage.setItem('erp_accounts_version', ACCOUNTS_VERSION);
    return INITIAL_ACCOUNTS;
  }
  try {
    const saved = localStorage.getItem('erp_accounts');
    if (!saved) return INITIAL_ACCOUNTS;
    const parsed = JSON.parse(saved);
    const merged = [...parsed];
    INITIAL_ACCOUNTS.forEach(initAcc => {
      const idx = merged.findIndex(
        a => a.email.toLowerCase() === initAcc.email.toLowerCase()
          || a.username.toLowerCase() === initAcc.username.toLowerCase()
      );
      if (idx === -1) {
        merged.push(initAcc);
      } else {
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
      if (currentUser.token) {
        localStorage.setItem('erp_token', currentUser.token);
      }
    } else {
      localStorage.removeItem('erp_user');
      localStorage.removeItem('erp_token');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('erp_accounts', JSON.stringify(accounts));
  }, [accounts]);

  // Ensure active currentUser always has a valid JWT token
  useEffect(() => {
    const ensureValidToken = async () => {
      if (currentUser && !currentUser.token && currentUser.username) {
        try {
          const pass = currentUser.password || '123456789';
          const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: currentUser.username, password: pass })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.token) {
              setCurrentUser(prev => ({
                ...prev,
                token: data.token,
                role: data.role || prev.role,
                tenantId: data.tenantId || prev.tenantId
              }));
              localStorage.setItem('erp_token', data.token);
            }
          }
        } catch (_) {}
      }
    };
    ensureValidToken();
  }, [currentUser]);

  // Fetch & sync user accounts from backend database so all devices have identical accounts
  const fetchBackendUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('erp_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token && token !== 'undefined' && token !== 'null') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`${API_BASE_URL}/api/owner/users?tenantId=1`, { headers });
      if (res.ok) {
        const users = await res.json();
        if (Array.isArray(users) && users.length > 0) {
          setAccounts(prev => {
            const updated = [...prev];
            users.forEach(u => {
              const idx = updated.findIndex(
                a => a.id === u.id ||
                  a.username.toLowerCase() === (u.username || '').toLowerCase() ||
                  a.email.toLowerCase() === (u.email || '').toLowerCase()
              );
              const formattedUser = {
                id: u.id,
                username: u.username,
                email: u.email || u.username,
                fullName: u.fullName || u.username,
                password: u.plainPassword || u.password || '123456789',
                role: u.role || 'EMPLOYEE',
                tenantName: u.tenant?.name || 'Yashas EV Service',
                active: u.active ?? true
              };

              if (idx === -1) {
                updated.push(formattedUser);
              } else {
                updated[idx] = { ...updated[idx], ...formattedUser };
              }
            });
            return updated;
          });
        }
      }
    } catch (e) {
      console.log('Backend user sync skipped');
    }
  }, []);

  // Sync users every 3 seconds across devices & on window focus
  useEffect(() => {
    fetchBackendUsers();
    const interval = setInterval(fetchBackendUsers, 3000);
    const handleFocus = () => fetchBackendUsers();
    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchBackendUsers]);

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
      // Offline fallback below
    }

    // Refresh backend users before checking local accounts
    await fetchBackendUsers();

    // Local account fallback (uses synced accounts array)
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

  const changePassword = async (userId, newPassword) => {
    const updated = accounts.map(a => a.id === userId ? { ...a, password: newPassword } : a);
    setAccounts(updated);
    if (currentUser?.id === userId) {
      setCurrentUser(prev => ({ ...prev, password: newPassword }));
    }

    try {
      const token = localStorage.getItem('erp_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token && token !== 'undefined' && token !== 'null') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      await fetch(`${API_BASE_URL}/api/owner/users/${userId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ password: newPassword })
      });
      fetchBackendUsers();
    } catch (e) {}

    return { success: true, message: 'Password updated successfully!' };
  };

  const createStaffAccount = async (newUser) => {
    if (accounts.some(a => a.username.toLowerCase() === newUser.username.toLowerCase())) {
      return { success: false, message: 'Username already taken' };
    }

    const created = {
      id: Date.now(),
      ...newUser,
      tenantName: currentUser?.tenantName || 'Yashas EV Service',
      active: true
    };

    setAccounts(prev => [...prev, created]);

    // Save account to cloud backend database so ALL phones/laptops can log in instantly
    try {
      const token = localStorage.getItem('erp_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token && token !== 'undefined' && token !== 'null') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      await fetch(`${API_BASE_URL}/api/owner/users?tenantId=1`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          username: newUser.username,
          email: newUser.email || newUser.username,
          password: newUser.password,
          fullName: newUser.fullName,
          role: newUser.role || 'EMPLOYEE'
        })
      });
      fetchBackendUsers();
    } catch (e) {
      console.log('Account saved locally');
    }

    return { success: true, user: created };
  };

  const toggleAccountStatus = async (id) => {
    setAccounts(prev => prev.map(a => a.id === id && a.role !== 'OWNER' ? { ...a, active: !a.active } : a));
    try {
      await fetch(`${API_BASE_URL}/api/owner/users/${id}/toggle-status`, { method: 'PATCH' });
      fetchBackendUsers();
    } catch (e) {}
  };

  const updateAccount = async (id, updatedData) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updatedData } : a));
    if (currentUser?.id === id) {
      setCurrentUser(prev => ({ ...prev, ...updatedData }));
    }

    try {
      await fetch(`${API_BASE_URL}/api/owner/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      fetchBackendUsers();
    } catch (e) {}

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
      INITIAL_ACCOUNTS,
      refreshUsers: fetchBackendUsers
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
