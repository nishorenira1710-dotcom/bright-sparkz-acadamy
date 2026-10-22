import React from 'react';

interface CenterLogoProps {
  logoUrl?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  animated?: boolean;
  className?: string;
}

export const CenterLogo: React.FC<CenterLogoProps> = ({
  logoUrl = '/logo.jpg',
  name = 'Bright Sparkz Academy',
  size = 'md',
  animated = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-9 h-9 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl',
    '2xl': 'w-32 h-32 text-4xl',
  };

  const effectiveLogoUrl = logoUrl || '/logo.jpg';
  const animationClass = animated ? 'animate-pulse' : '';

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 rounded-2xl overflow-hidden bg-white shadow-xs p-1 border border-slate-200/80 ${sizeClasses[size]} ${animationClass} ${className}`}
    >
      <img
        src={effectiveLogoUrl}
        alt={`${name} Logo`}
        className="w-full h-full object-contain"
        onError={(e) => {
          // If image load fails, fallback to root path
          const target = e.target as HTMLImageElement;
          if (target.src !== `${window.location.origin}/logo.jpg`) {
            target.src = '/logo.jpg';
          }
        }}
      />
    </div>
  );
};
