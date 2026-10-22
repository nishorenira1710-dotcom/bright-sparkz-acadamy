import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/data-service';
import { useAuth } from '../../hooks/useAuth';
import { AppNotification } from '../../types';
import { formatDateTime } from '../../utils/dates';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';
import { EmptyState } from '../../components/feedback/EmptyState';
import {
  Bell,
  Check,
  CheckCheck,
  ClipboardCheck,
  CreditCard,
  Megaphone,
  Info,
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filterUnread, setFilterUnread] = useState(false);

  const loadData = async () => {
    if (!currentUser) return;
    try {
      const list = await dataService.getNotifications(currentUser.uid);
      setNotifications(list);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleMarkAsRead = async (id: string) => {
    await dataService.markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
    );
  };

  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    await dataService.markAllNotificationsAsRead(currentUser.uid);
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))
    );
  };

  if (loading) {
    return <LoadingSpinner message="Loading notification stream..." />;
  }

  const unreadCount = notifications.filter((n) => !n.readAt).length;
  const filtered = notifications.filter((n) => (filterUnread ? !n.readAt : true));

  const getIcon = (type: string) => {
    switch (type) {
      case 'ATTENDANCE':
        return <ClipboardCheck className="w-5 h-5 text-emerald-600" />;
      case 'PAYMENT':
      case 'FEE':
        return <CreditCard className="w-5 h-5 text-blue-600" />;
      case 'ANNOUNCEMENT':
        return <Megaphone className="w-5 h-5 text-orange-600" />;
      default:
        return <Info className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Notifications</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-orange-100 text-orange-800 rounded-full">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time activity alerts, fee receipts, session reminders, and administrative logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
            >
              <CheckCheck className="w-4 h-4 text-slate-600" />
              Mark All Read
            </button>
          )}
          <button
            onClick={() => setFilterUnread(!filterUnread)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              filterUnread
                ? 'bg-orange-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {filterUnread ? 'Showing Unread' : 'Filter Unread'}
          </button>
        </div>
      </div>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No Notifications"
          description={filterUnread ? 'You have read all your notifications!' : 'Your notification ledger is clean.'}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {filtered.map((n) => {
            const isUnread = !n.readAt;
            return (
              <div
                key={n.id}
                className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition ${
                  isUnread ? 'bg-orange-50/40' : 'hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-xs shrink-0">
                    {getIcon(n.type)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">{n.title}</h4>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0"></span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">{n.message}</p>
                    <span className="text-[11px] text-slate-400 block pt-0.5">
                      {formatDateTime(n.createdAt)}
                    </span>
                  </div>
                </div>

                {isUnread && (
                  <button
                    onClick={() => handleMarkAsRead(n.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-white transition cursor-pointer shrink-0"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
