import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarDays,
  Clock,
  ClipboardCheck,
  CreditCard,
  Receipt,
  Megaphone,
  Bell,
  BarChart3,
  UserMinus,
  ScrollText,
  Settings,
  UserCheck,
} from 'lucide-react';

interface SidebarItem {
  name: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const Sidebar: React.FC = () => {
  const { isAdmin } = useAuth();

  const adminNavItems: SidebarItem[] = [
    { name: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Students', to: '/admin/students', icon: Users },
    { name: 'Parents & Guardians', to: '/admin/parents', icon: UserCheck },
    { name: 'Batches', to: '/admin/batches', icon: CalendarDays },
    { name: 'Class Sessions', to: '/admin/sessions', icon: Clock },
    { name: 'Mark Attendance', to: '/admin/attendance', icon: ClipboardCheck },
    { name: 'Fee Dues', to: '/admin/fees', icon: CreditCard },
    { name: 'Record Payments', to: '/admin/payments', icon: Receipt },
    { name: 'Receipts Archive', to: '/admin/receipts', icon: ScrollText },
    { name: 'Announcements', to: '/admin/announcements', icon: Megaphone },
    { name: 'Notifications', to: '/admin/notifications', icon: Bell },
    { name: 'Reports & Export', to: '/admin/reports', icon: BarChart3 },
    { name: 'Student Exit', to: '/admin/student-exit', icon: UserMinus },
    { name: 'Audit Trail', to: '/admin/audit-logs', icon: ScrollText },
    { name: 'Center Settings', to: '/admin/settings', icon: Settings },
  ];

  const parentNavItems: SidebarItem[] = [
    { name: 'Dashboard', to: '/parent/dashboard', icon: LayoutDashboard },
    { name: 'My Children', to: '/parent/children', icon: Users },
    { name: 'Attendance Record', to: '/parent/attendance', icon: ClipboardCheck },
    { name: 'Fee Ledger', to: '/parent/fees', icon: CreditCard },
    { name: 'Payment History', to: '/parent/payments', icon: Receipt },
    { name: 'Official Receipts', to: '/parent/receipts', icon: ScrollText },
    { name: 'Announcements', to: '/parent/announcements', icon: Megaphone },
    { name: 'Notifications', to: '/parent/notifications', icon: Bell },
    { name: 'My Profile', to: '/parent/profile', icon: Settings },
  ];

  const navItems = isAdmin ? adminNavItems : parentNavItems;

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200/80 min-h-[calc(100vh-4rem)] shrink-0 py-4 px-3 select-none">
      <div className="px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
        {isAdmin ? 'Tuition Administrator' : 'Parent Portal'}
      </div>

      <nav className="space-y-1 flex-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-orange-500 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    isActive ? 'text-white scale-110' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span className="truncate">{item.name}</span>
                {item.badge && (
                  <span
                    className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Center Footnote */}
      <div className="pt-4 mt-2 border-t border-slate-100 px-3 text-[11px] text-slate-400">
        <p className="font-bold text-slate-800">Bright Sparkz Academy</p>
        <p className="text-[10px] text-orange-600 font-semibold">Learn Smarter, Shine Brighter</p>
      </div>
    </aside>
  );
};
