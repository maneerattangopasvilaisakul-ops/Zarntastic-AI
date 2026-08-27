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
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('app_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        // Do not auto-remember or restore Admin session (Must re-login freshly every time)
        if (parsed?.role !== 'admin') {
          setUser(parsed);
        } else {
          localStorage.removeItem('app_user');
          setUser(null);
        }
      } catch (e) {
        localStorage.removeItem('app_user');
      }
    }
  }, []);

  const login = (newUser: UserProfile) => {
    setUser(newUser);
    // If Admin role, do NOT persist to localStorage so credentials are required freshly next time
    if (newUser.role !== 'admin') {
      localStorage.setItem('app_user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('app_user');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('app_user');
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
