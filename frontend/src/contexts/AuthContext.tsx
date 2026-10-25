import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { loginApi } from '../api/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  walletId: number | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ledgerpay_token'));
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('ledgerpay_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [walletId, setWalletId] = useState<number | null>(() => {
    const savedWallet = localStorage.getItem('ledgerpay_wallet_id');
    return savedWallet ? Number(savedWallet) : null;
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem('ledgerpay_token', token);
    } else {
      localStorage.removeItem('ledgerpay_token');
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const authData = await loginApi(email, password);
    setToken(authData.token);
    const currentUser: User = {
      id: authData.walletId,
      name: authData.name,
      email: authData.email,
    };
    setUser(currentUser);
    setWalletId(authData.walletId);
    localStorage.setItem('ledgerpay_token', authData.token);
    localStorage.setItem('ledgerpay_user', JSON.stringify(currentUser));
    localStorage.setItem('ledgerpay_wallet_id', String(authData.walletId));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setWalletId(null);
    localStorage.removeItem('ledgerpay_token');
    localStorage.removeItem('ledgerpay_user');
    localStorage.removeItem('ledgerpay_wallet_id');
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        walletId,
        isAuthenticated: !!token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
