import React from 'react';
import { CenterLogo } from '../logo/CenterLogo';

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
  logoUrl?: string | null;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading tuition records...',
  fullScreen = false,
  logoUrl,
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="relative">
        <CenterLogo logoUrl={logoUrl} size="lg" animated />
        <div className="absolute -inset-2 rounded-2xl border-2 border-orange-500/20 border-t-orange-500 animate-spin" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-800">{message}</p>
        <p className="text-xs text-slate-500">Securing attendance & fee ledgers...</p>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/90 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return <div className="py-12 flex justify-center">{content}</div>;
};
