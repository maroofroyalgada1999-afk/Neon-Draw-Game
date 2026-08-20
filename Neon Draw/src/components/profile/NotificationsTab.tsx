import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  ShieldCheck,
  Smartphone,
  ArrowDownToLine,
  Trophy,
  KeyRound,
  Gift,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api';
import { PlayerNotification } from '../../types/index';

export const NotificationsTab: React.FC = () => {
  const [notifications, setNotifications] = useState<PlayerNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      console.warn('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.warn('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn('Failed to mark all read:', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return <Smartphone className="w-4 h-4 text-emerald-400" />;
      case 'WITHDRAWAL':
        return <ArrowDownToLine className="w-4 h-4 text-cyan-400" />;
      case 'GAME_WIN':
        return <Trophy className="w-4 h-4 text-amber-400" />;
      case 'VERIFICATION':
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'SECURITY':
      case 'LOGIN':
        return <KeyRound className="w-4 h-4 text-purple-400" />;
      case 'PROMOTION':
        return <Gift className="w-4 h-4 text-amber-400" />;
      default:
        return <Bell className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <div id="notifications-tab-content" className="space-y-4 animate-in fade-in duration-200">
      {/* Header with unread indicator & Mark All Read */}
      <div className="flex items-center justify-between pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            Player Notifications
          </span>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-zinc-950">
              {unreadCount} Unread
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 p-1 hover:bg-white/5 rounded transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark All Read</span>
            </button>
          )}
          <button
            onClick={fetchNotifications}
            className="text-zinc-400 hover:text-white p-1 rounded hover:bg-white/5"
            title="Refresh notifications"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-zinc-400 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
          <span>Fetching alert logs...</span>
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-8 text-center text-zinc-400 text-xs rounded-2xl bg-zinc-900/40 border border-white/5">
          You are all caught up! No recent notifications.
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
              className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 text-xs cursor-pointer ${
                notif.isRead
                  ? 'bg-zinc-900/40 border-white/5 text-zinc-400'
                  : 'bg-zinc-900/90 border-emerald-500/30 text-white shadow-md'
              }`}
            >
              <div className="p-2 rounded-xl bg-zinc-950 border border-white/5 shrink-0 mt-0.5">
                {getIcon(notif.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-white text-xs">{notif.title}</h4>
                  <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300 mt-0.5 leading-relaxed">
                  {notif.message}
                </p>
              </div>

              {!notif.isRead && (
                <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 self-center" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
