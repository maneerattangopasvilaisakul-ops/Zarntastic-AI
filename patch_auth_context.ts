import fs from 'fs';

const authContextContent = `
import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // If we already have an admin user in state (from our JWT), don't overwrite it with a Firebase user unless they log out of admin
      if (user?.role === 'admin') return;

      if (firebaseUser) {
        const newUser: UserProfile = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Google User',
          email: firebaseUser.email || '',
          phone: '',
          lineId: '',
          role: 'student'
        };
        setUser(newUser);
      } else {
        if (user?.role !== 'admin') {
          setUser(null);
        }
      }
    });
    return () => unsubscribe();
  }, [user?.role]);

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
      firebaseSignOut(auth).catch(console.error);
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
`;

fs.writeFileSync('src/contexts/AuthContext.tsx', authContextContent);
console.log('AuthContext patched');
