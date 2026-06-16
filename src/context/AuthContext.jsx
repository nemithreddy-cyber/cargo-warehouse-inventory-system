import { createContext, useContext, useState, useEffect } from 'react';
import { canAccess, hasRole } from '../config/permissions';
import api from '../utils/api';

const AuthContext = createContext(null);

// Storage key
const STORAGE_KEY = 'cwis_user';
const TOKEN_KEY = 'cwis_token';

/**
 * Try to login via real backend API.
 * Returns { user, token } on success or throws.
 */
const apiLogin = async (email, password) => {
  const res = await api.post('/auth/login', { email, password });
  // Backend returns { success, data: { user, token } }
  return res.data.data || res.data;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from storage
  useEffect(() => {
    const storedUser =
      localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    const storedToken =
      localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch {
        // Corrupted — clear
        localStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const saveSession = (userData, tokenValue, remember) => {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(STORAGE_KEY, JSON.stringify(userData));
    storage.setItem(TOKEN_KEY, tokenValue || '');
    setUser(userData);
    setToken(tokenValue);
  };

  /**
   * Login: tries real backend.
   */
  const login = async (email, password, remember = false) => {
    if (!email || !password) {
      return { success: false, message: 'Please fill in all fields.' };
    }

    try {
      const { user: apiUser, token: apiToken } = await apiLogin(email, password);
      saveSession(apiUser, apiToken, remember);
      return { success: true };
    } catch (apiErr) {
      return {
        success: false,
        message: apiErr.response?.data?.message || apiErr.message || 'Invalid email or password.',
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  };

  const updateUser = (data) => {
    const updated = { ...user, ...data };
    setUser(updated);
    if (localStorage.getItem(STORAGE_KEY))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    else sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  /** Check if current user has a permission */
  const userCan = (permission) => canAccess(user?.role, permission);

  /** Check if current user is one of the given roles */
  const userHasRole = (...roles) => hasRole(user?.role, ...roles);

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout, updateUser, userCan, userHasRole }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
