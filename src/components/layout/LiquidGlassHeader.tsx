import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { CenterLogo } from '../logo/CenterLogo';
import { dataService } from '../../services/data-service';
import { AppNotification, TuitionCenterSettings } from '../../types';
import {
  Bell,
  Check,
  LogOut,
  User,
  Menu,
  X,
  ChevronDown,
  Shield,
  GraduationCap,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface LiquidGlassHeaderProps {
  onToggleMobileNav?: () => void;
  isMobileNavOpen?: boolean;
}

export const LiquidGlassHeader: React.FC<LiquidGlassHeaderProps> = ({
  onToggleMobileNav,
  isMobileNavOpen,
}) => {
  const { currentUser, role, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<TuitionCenterSettings | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchInfo = async () => {
      try {
        const s = await dataService.getSettings();
        if (isMounted) setSettings(s);
        if (currentUser) {
          const n = await dataService.getNotifications(currentUser.uid);
          if (isMounted) setNotifications(n);
        }
      } catch (err) {
        console.error('Failed to load header data:', err);
      }
    };
    fetchInfo();
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    await dataService.markAllNotificationsAsRead(currentUser.uid);
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))
    );
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-2 z-40 px-3 sm:px-6 transition-all duration-200">
      <div className="max-w-7xl mx-auto rounded-2xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_0_rgba(15,23,42,0.08),0_1px_2px_0_rgba(15,23,42,0.04),inset_0_1px_0_0_rgba(255,255,255,0.9)] transition-all">
        <div className="px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-18">
            {/* Left: Mobile hamburger & Logo / Center Name */}
            <div className="flex items-center gap-3">
              {onToggleMobileNav && (
                <button
                  type="button"
                  onClick={onToggleMobileNav}
                  className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 transition focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                  aria-label="Toggle navigation menu"
                >
                  {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              )}

              <Link
                to={isAdmin ? '/admin/dashboard' : '/parent/dashboard'}
                className="flex items-center gap-3 group focus:outline-none"
              >
                <CenterLogo
                  logoUrl={settings?.logoUrl}
                  name={settings?.centerName || 'Bright Sparkz Academy'}
                  size="md"
                  className="group-hover:scale-105 transition-transform"
                />
                <div className="hidden xs:block">
                  <div className="flex items-center gap-2">
                    <h1 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight leading-tight">
                      {settings?.centerName || 'Bright Sparkz Academy'}
                    </h1>
                  </div>
                  <p className="text-[11px] font-semibold text-orange-600 leading-none truncate max-w-[190px] sm:max-w-xs mt-0.5">
                    {settings?.tagline || 'Learn Smarter, Shine Brighter'}
                  </p>
                </div>
              </Link>
            </div>

            {/* Right: Notifications, Role Pill & User Dropdown */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Notifications Popover */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowUserMenu(false);
                  }}
                  className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 rounded-xl transition focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                  aria-label={`Notifications (${unreadCount} unread)`}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-orange-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="p-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-orange-100 text-orange-700 rounded-md">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[11px] font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3 h-3" /> Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-500">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.slice(0, 6).map((n) => (
                          <div
                            key={n.id}
                            className={`p-3 text-xs transition ${
                              n.readAt ? 'bg-white opacity-80' : 'bg-orange-50/40 font-medium'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-slate-900 font-semibold">{n.title}</span>
                              <span className="text-[10px] text-slate-400 shrink-0">
                                {new Date(n.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="mt-1 text-slate-600 leading-relaxed text-[11px]">
                              {n.message}
                            </p>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-2.5 bg-slate-50/80 border-t border-slate-100 text-center">
                      <Link
                        to={isAdmin ? '/admin/notifications' : '/parent/notifications'}
                        onClick={() => setShowNotifications(false)}
                        className="text-xs font-semibold text-orange-600 hover:text-orange-700"
                      >
                        View all notifications →
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Role Pill */}
              <span
                className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
                  isAdmin
                    ? 'bg-orange-500/15 text-orange-700 border border-orange-500/30'
                    : 'bg-blue-500/15 text-blue-700 border border-blue-500/30'
                }`}
              >
                {isAdmin ? (
                  <Shield className="w-3.5 h-3.5 text-orange-600" />
                ) : (
                  <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                )}
                {role || 'USER'}
              </span>

              {/* User Account Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(!showUserMenu);
                    setShowNotifications(false);
                  }}
                  className="flex items-center gap-2 p-1.5 sm:px-2.5 rounded-xl hover:bg-slate-100/70 transition focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                  aria-label="User account menu"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-800 to-indigo-950 text-white flex items-center justify-center font-bold text-xs ring-2 ring-white shadow-xs">
                    {currentUser?.displayName ? currentUser.displayName[0] : 'U'}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-semibold text-slate-900 leading-tight truncate max-w-[130px]">
                      {currentUser?.displayName || 'Logged In'}
                    </p>
                    <p className="text-[10px] text-slate-500 leading-tight">{role}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="p-3 bg-slate-50/80 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {currentUser?.displayName}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{currentUser?.email}</p>
                      <p className="mt-1 text-[10px] font-bold text-orange-600 uppercase">
                        Role: {role}
                      </p>
                    </div>

                    <div className="py-1">
                      {isAdmin ? (
                        <Link
                          to="/admin/settings"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50"
                        >
                          <User className="w-4 h-4 text-slate-400" />
                          Center Settings
                        </Link>
                      ) : (
                        <Link
                          to="/parent/profile"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50"
                        >
                          <User className="w-4 h-4 text-slate-400" />
                          Parent Profile
                        </Link>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 text-left cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
