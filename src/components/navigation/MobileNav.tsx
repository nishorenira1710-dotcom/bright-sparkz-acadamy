import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  CreditCard,
  MoreHorizontal,
  X,
  CalendarDays,
  Clock,
  Receipt,
  ScrollText,
  Megaphone,
  Bell,
  BarChart3,
  UserMinus,
  Settings,
  UserCheck,
} from 'lucide-react';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose }) => {
  const { isAdmin } = useAuth();
  const [showMoreDrawer, setShowMoreDrawer] = useState(false);

  const adminBottomTabs = [
    { name: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Students', to: '/admin/students', icon: Users },
    { name: 'Attendance', to: '/admin/attendance', icon: ClipboardCheck },
    { name: 'Fees', to: '/admin/fees', icon: CreditCard },
  ];

  const parentBottomTabs = [
    { name: 'Dashboard', to: '/parent/dashboard', icon: LayoutDashboard },
    { name: 'Children', to: '/parent/children', icon: Users },
    { name: 'Attendance', to: '/parent/attendance', icon: ClipboardCheck },
    { name: 'Fees', to: '/parent/fees', icon: CreditCard },
  ];

  const adminMoreLinks = [
    { name: 'Parents & Guardians', to: '/admin/parents', icon: UserCheck },
    { name: 'Batches', to: '/admin/batches', icon: CalendarDays },
    { name: 'Class Sessions', to: '/admin/sessions', icon: Clock },
    { name: 'Record Payments', to: '/admin/payments', icon: Receipt },
    { name: 'Receipts Archive', to: '/admin/receipts', icon: ScrollText },
    { name: 'Announcements', to: '/admin/announcements', icon: Megaphone },
    { name: 'Notifications', to: '/admin/notifications', icon: Bell },
    { name: 'Reports & Export', to: '/admin/reports', icon: BarChart3 },
    { name: 'Student Exit Workflow', to: '/admin/student-exit', icon: UserMinus },
    { name: 'Audit Trail', to: '/admin/audit-logs', icon: ScrollText },
    { name: 'Center Settings', to: '/admin/settings', icon: Settings },
  ];

  const parentMoreLinks = [
    { name: 'Payment History', to: '/parent/payments', icon: Receipt },
    { name: 'Official Receipts', to: '/parent/receipts', icon: ScrollText },
    { name: 'Announcements', to: '/parent/announcements', icon: Megaphone },
    { name: 'Notifications', to: '/parent/notifications', icon: Bell },
    { name: 'Parent Profile', to: '/parent/profile', icon: Settings },
  ];

  const bottomTabs = isAdmin ? adminBottomTabs : parentBottomTabs;
  const moreLinks = isAdmin ? adminMoreLinks : parentMoreLinks;

  return (
    <>
      {/* Fixed Bottom Tab Bar for Mobile (min 44px touch targets) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-2 py-1 flex items-center justify-around h-16"
      >
        {bottomTabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            onClick={() => setShowMoreDrawer(false)}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full min-w-[44px] min-h-[44px] rounded-xl transition text-[11px] font-semibold ${
                isActive ? 'text-orange-600' : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <tab.icon
                  className={`w-5 h-5 mb-0.5 transition-transform ${
                    isActive ? 'scale-110 text-orange-600' : 'text-slate-400'
                  }`}
                />
                <span>{tab.name}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* More Drawer Button */}
        <button
          type="button"
          onClick={() => setShowMoreDrawer(!showMoreDrawer)}
          className={`flex flex-col items-center justify-center flex-1 h-full min-w-[44px] min-h-[44px] rounded-xl transition text-[11px] font-semibold cursor-pointer ${
            showMoreDrawer ? 'text-orange-600' : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="Open more menu"
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          <span>More</span>
        </button>
      </nav>

      {/* Slide-over More Drawer for Mobile */}
      {showMoreDrawer && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 max-h-[80vh] flex flex-col p-5 pb-20 animate-in slide-in-from-bottom duration-250"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-bold text-sm text-slate-900">
                {isAdmin ? 'Tuition Admin Menu' : 'Parent Portal Menu'}
              </span>
              <button
                onClick={() => setShowMoreDrawer(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto py-3 space-y-1">
              {moreLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setShowMoreDrawer(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold min-h-[44px] transition ${
                      isActive
                        ? 'bg-orange-50 text-orange-600 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  <link.icon className="w-4 h-4 text-slate-400" />
                  <span>{link.name}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
