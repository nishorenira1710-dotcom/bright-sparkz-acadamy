import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { LiquidGlassHeader } from './LiquidGlassHeader';
import { Sidebar } from '../navigation/Sidebar';
import { MobileNav } from '../navigation/MobileNav';

export const AppLayout: React.FC = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50/20 flex flex-col text-slate-900 selection:bg-orange-500 selection:text-white">
      {/* Modern Floating Liquid-Glass Navigation Header */}
      <LiquidGlassHeader
        onToggleMobileNav={() => setMobileNavOpen(!mobileNavOpen)}
        isMobileNavOpen={mobileNavOpen}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-2 sm:px-4">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Content Container */}
        <main className="flex-1 w-full min-w-0 p-3 sm:p-6 pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation & Drawer */}
      <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </div>
  );
};
