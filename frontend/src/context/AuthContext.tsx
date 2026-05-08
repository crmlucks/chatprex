import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'propietario' | 'administrador' | 'usuario';
  status: string;
  avatar: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  needsSetup: boolean;
  login: (email: string, password: string) => Promise<void>;
  setup: (data: { name: string; email: string; password: string; phone?: string }) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: string[]) => boolean;
  refreshUser: () => Promise<void>;
  demoLogin: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('chatprex_token'));
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  // Al montar, verificar si ya hay sesión o si necesita setup
  useEffect(() => {
    (async () => {
      try {
        // Verificar si necesita setup inicial
        const setupRes = await fetch(`${API_URL}/api/auth/check-setup`);
        const setupData = await setupRes.json();
        if (setupData.needsSetup) {
          setNeedsSetup(true);
          setLoading(false);
          return;
        }

        // Si hay token, intentar obtener el usuario
        if (token) {
          const meRes = await fetch(`${API_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (meRes.ok) {
            const meData = await meRes.json();
            setUser(meData.user);
          } else {
            // Token inválido, limpiar
            localStorage.removeItem('chatprex_token');
            setToken(null);
          }
        }
      } catch (err) {
        console.error('Error verificando sesión:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión');
    localStorage.setItem('chatprex_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const setup = async (formData: { name: string; email: string; password: string; phone?: string }) => {
    const res = await fetch(`${API_URL}/api/auth/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al configurar');
    localStorage.setItem('chatprex_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setNeedsSetup(false);
  };

  const logout = () => {
    localStorage.removeItem('chatprex_token');
    setToken(null);
    setUser(null);
  };

  const hasRole = (...roles: string[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch {}
  };

  const demoLogin = () => {
    const dummyUser: User = {
      id: 999,
      name: 'Usuario Demo',
      email: 'demo@chatprex.com',
      phone: '+51 900 000 000',
      role: 'propietario',
      status: 'activo',
      avatar: ''
    };
    localStorage.setItem('chatprex_token', 'demo-token-123');
    setToken('demo-token-123');
    setUser(dummyUser);
    setNeedsSetup(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, needsSetup, login, setup, logout, hasRole, refreshUser, demoLogin }}>
      {children}
    </AuthContext.Provider>
  );
}
