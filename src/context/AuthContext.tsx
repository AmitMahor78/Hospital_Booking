import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types/index.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginAsPatient: (mobile: string, otp: string, name?: string) => Promise<void>;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  quickDemoLogin: (role: Role) => Promise<void>;
  logout: () => void;
  governmentApiMode: 'DEMO_SANDBOX' | 'AUTHORIZED_GOVERNMENT_API';
  isGovernmentApiEnabled: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  loginAsPatient: async () => {},
  loginWithCredentials: async () => {},
  quickDemoLogin: async () => {},
  logout: () => {},
  governmentApiMode: 'DEMO_SANDBOX',
  isGovernmentApiEnabled: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const cached = localStorage.getItem('swasthya_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('swasthya_token') || null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [governmentApiMode, setGovernmentApiMode] = useState<'DEMO_SANDBOX' | 'AUTHORIZED_GOVERNMENT_API'>('DEMO_SANDBOX');
  const [isGovernmentApiEnabled, setIsGovernmentApiEnabled] = useState<boolean>(false);

  useEffect(() => {
    // Check backend health & government API provider mode
    fetch('/api/benefits/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.mode) {
          setGovernmentApiMode(data.mode);
          setIsGovernmentApiEnabled(data.isGovernmentApiEnabled || false);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch benefits gateway status:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const loginAsPatient = async (mobile: string, otp: string, name?: string) => {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile, otp, name }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to verify OTP');
    }

    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('swasthya_user', JSON.stringify(data.user));
    localStorage.setItem('swasthya_token', data.token);
  };

  const loginWithCredentials = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Invalid credentials');
    }

    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('swasthya_user', JSON.stringify(data.user));
    localStorage.setItem('swasthya_token', data.token);
  };

  const quickDemoLogin = async (role: Role) => {
    if (role === 'PATIENT') {
      await loginAsPatient('9876543210', '123456', 'Ramesh Kumar');
    } else if (role === 'DOCTOR') {
      await loginWithCredentials('dr.mehta@hospital.gov.in', 'doctor123');
    } else if (role === 'STAFF') {
      await loginWithCredentials('staff@hospital.gov.in', 'staff123');
    } else if (role === 'BENEFIT_DESK') {
      await loginWithCredentials('ayushman.desk@hospital.gov.in', 'ayushman123');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('swasthya_user');
    localStorage.removeItem('swasthya_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        loginAsPatient,
        loginWithCredentials,
        quickDemoLogin,
        logout,
        governmentApiMode,
        isGovernmentApiEnabled,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
