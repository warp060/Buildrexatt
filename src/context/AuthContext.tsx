import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { User, CompanySettings, NotificationItem, UserRole } from '../types';
import { api } from '../api';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  companySettings: CompanySettings | null;
  isLoading: boolean;
  notifications: NotificationItem[];
  unreadCount: number;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
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
  const { showToast } = useToast();
  
  // Track known notification IDs to detect newly arrived items in real time
  const knownNotifIds = useRef<Set<string>>(new Set());
  const isFirstNotifFetch = useRef<boolean>(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.getNotifications();
      if (res.success && Array.isArray(res.notifications)) {
        // Detect newly arrived notifications
        if (isFirstNotifFetch.current) {
          res.notifications.forEach((n) => knownNotifIds.current.add(n.id));
          isFirstNotifFetch.current = false;
        } else {
          res.notifications.forEach((n) => {
            if (!knownNotifIds.current.has(n.id)) {
              knownNotifIds.current.add(n.id);
              if (!n.read_at) {
                // Instantly pop up live toast on Admin/Recipient screen
                showToast(`🔔 ${n.title}: ${n.message}`, n.type === 'warning' ? 'warning' : 'info', 6000);
              }
            }
          });
        }
        setNotifications(res.notifications);
      }
    } catch {
      // ignore if unauthenticated
    }
  }, [showToast]);

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

  // Real-time automatic background polling & window focus sync (every 6 seconds)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      fetchNotifications();
    }, 6000);

    const handleFocus = () => {
      fetchNotifications();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, fetchNotifications]);

  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    if (res.success && res.user) {
      if (res.token) {
        localStorage.setItem('buildrex_jwt', res.token);
      }
      setUser(res.user);
      isFirstNotifFetch.current = true;
      knownNotifIds.current.clear();
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
      knownNotifIds.current.clear();
      isFirstNotifFetch.current = true;
    }
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
