import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { auth } from '@/config/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import api from '@/lib/api';
import { STORAGE_KEYS, ENDPOINTS } from '@/config/constants';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateAutoMode: (autoMode: boolean) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }: any) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (_token: string) => {
    try {
      const response = await api.get(ENDPOINTS.AUTH.PROFILE);
      const userData = response.data.data.user;
      setUser(userData);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      const savedUser = localStorage.getItem(STORAGE_KEYS.USER);

      if (token && savedUser) {
        setUser(JSON.parse(savedUser));
        await fetchUserProfile(token);
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();

      localStorage.setItem(STORAGE_KEYS.TOKEN, token);

      await fetchUserProfile(token);
      toast.success('Login successful');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
      throw error;
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    try {
      const response = await api.post(ENDPOINTS.AUTH.REGISTER, {
        email,
        password,
        displayName,
      });

      const { user: userData } = response.data.data;

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseToken = await userCredential.user.getIdToken();

      localStorage.setItem(STORAGE_KEYS.TOKEN, firebaseToken);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));

      setUser(userData);
      toast.success('Registration successful');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      setUser(null);
      toast.success('Logged out successfully');
    } catch (error: any) {
      toast.error('Logout failed');
      throw error;
    }
  };

  const updateAutoMode = async (autoMode: boolean) => {
    try {
      await api.put(ENDPOINTS.AUTH.AUTO_MODE, { autoMode });
      setUser((prev: any) => (prev ? { ...prev, autoMode } : null));
      toast.success(`Auto mode ${autoMode ? 'enabled' : 'disabled'}`);
    } catch (error: any) {
      toast.error('Failed to update auto mode');
      throw error;
    }
  };

  const refreshUser = async () => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      await fetchUserProfile(token);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateAutoMode,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
