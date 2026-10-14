import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, CompanySettings, NotificationItem, UserRole } from '../types';
import { api } from '../api';

interface AuthContextType {
  user: User | null;
  companySettings: CompanySettings | null;
  isLoading: boolean;
  notifications: NotificationItem[];
  unreadCount: number;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  quickDemoLogin: (role: UserRole) => Promise<void>;
  refreshUser: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.getNotifications();
      if (res.success) {
        setNotifications(res.notifications);
      }
    } catch {
      // ignore if unauthenticated
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.getMe();
      if (res.success && res.user) {
        setUser(res.user);
        setCompanySettings(res.company_settings);
        fetchNotifications();
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [fetchNotifications]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    if (res.success && res.user) {
      if (res.token) {
        localStorage.setItem('buildrex_jwt', res.token);
      }
      setUser(res.user);
      await refreshUser();
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('buildrex_jwt');
      setUser(null);
      setNotifications([]);
    }
  };

  const quickDemoLogin = async (role: UserRole) => {
    setIsLoading(true);
    let email = 'admin@buildrex.com';
    if (role === 'employee') email = 'sarah.chen@buildrex.com';
    if (role === 'intern') email = 'intern.dev@buildrex.com';

    await login(email, 'Buildrex@2026');
  };

  const markNotificationRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: new Date().toISOString() }))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <AuthContext.Provider
      value={{
        user,
        companySettings,
        isLoading,
        notifications,
        unreadCount,
        login,
        logout,
        quickDemoLogin,
        refreshUser,
        fetchNotifications,
        markNotificationRead,
        markAllNotificationsRead,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
