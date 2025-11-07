import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: { label: string; href: string };
}

interface NotificationContextType {
  notifications: Notification[];
  unread: number;
  addNotification: (notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  // Obter user ID
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
    });
  }, []);

  // Carregar notificações existentes do banco
  useEffect(() => {
    if (!userId) return;

    const loadNotifications = async () => {
      const { data } = await supabase
        .from('system_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        const loadedNotifs: Notification[] = data.map(notif => ({
          id: notif.id,
          type: notif.type as 'info' | 'warning' | 'success' | 'error',
          title: notif.title,
          message: notif.message,
          timestamp: new Date(notif.created_at),
          read: notif.read,
          action: notif.action,
        }));
        
        setNotifications(loadedNotifs);
        setUnread(loadedNotifs.filter(n => !n.read).length);
      }
    };

    loadNotifications();
  }, [userId]);

  // Listener Realtime para novas notificações
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('system-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'system_notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[NotificationContext] New notification:', payload.new);
          
          const newNotif: Notification = {
            id: payload.new.id,
            type: payload.new.type,
            title: payload.new.title,
            message: payload.new.message,
            timestamp: new Date(payload.new.created_at),
            read: false,
            action: payload.new.action,
          };

          setNotifications(prev => [newNotif, ...prev].slice(0, 50));
          setUnread(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const addNotification = (notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: Notification = {
      ...notif,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 50)); // Limitar a 50 notificações
    setUnread(prev => prev + 1);
  };

  const markAsRead = async (id: string) => {
    // Atualizar no banco
    await supabase
      .from('system_notifications')
      .update({ read: true })
      .eq('id', id);

    // Atualizar local
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    setUnread(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    if (!userId) return;

    // Atualizar no banco
    await supabase
      .from('system_notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    // Atualizar local
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnread(0);
  };

  const clearAll = () => {
    setNotifications([]);
    setUnread(0);
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, unread, addNotification, markAsRead, markAllAsRead, clearAll }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
