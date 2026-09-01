import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  login: (user: UserProfile) => void;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  isAdmin: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = sessionStorage.getItem('app_user') || localStorage.getItem('app_user');
      if (stored) {
        const parsedUser = JSON.parse(stored);
        if (parsedUser?.role === 'admin' && !parsedUser?.token) {
          // Force re-login for admin if token is missing
          localStorage.removeItem('app_user');
          sessionStorage.removeItem('app_user');
          return null;
        }
        return parsedUser;
      }
      return null;
    } catch {
      return null;
    }
  });

  const login = (newUser: UserProfile) => {
    setUser(newUser);
    try {
      if (newUser.role === 'admin') {
        sessionStorage.setItem('app_user', JSON.stringify(newUser));
        localStorage.setItem('app_user', JSON.stringify(newUser));
      } else {
        localStorage.setItem('app_user', JSON.stringify(newUser));
      }
    } catch (e) {
      console.error('Failed to store auth state:', e);
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem('app_user');
      sessionStorage.removeItem('app_user');
    } catch (e) {
      console.error('Failed to clear auth state:', e);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
