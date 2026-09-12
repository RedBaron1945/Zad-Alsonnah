import React from 'react';
import cleanLogo from '../assets/images/logo-clean.png';

interface TakweenLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
  glow?: boolean;
}

export const TakweenLogo: React.FC<TakweenLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  glow = false,
}) => {
  const sizeMap = {
    sm: { img: 'h-9 w-auto max-w-[40px]', text: 'text-xs' },
    md: { img: 'h-13 w-auto max-w-[58px]', text: 'text-sm' },
    lg: { img: 'h-20 w-auto max-w-[88px]', text: 'text-base' },
    xl: { img: 'h-28 w-auto max-w-[120px]', text: 'text-xl' },
    '2xl': { img: 'h-36 w-auto max-w-[160px]', text: 'text-2xl' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Visual Emblem */}
      <div className={`relative shrink-0 flex items-center justify-center ${glow ? 'p-1' : ''}`}>
        {glow && (
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-400/25 via-blue-600/20 to-amber-300/25 rounded-full blur-xl scale-125 pointer-events-none" />
        )}
        <img
          src={cleanLogo}
          alt="شعار البرنامج"
          className={`${currentSize.img} object-contain drop-shadow-xs transition-transform duration-300 hover:scale-105`}
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/logo.png';
          }}
        />
      </div>

      {/* Text beside logo if requested */}
      {showText && (
        <div className="flex flex-col text-right">
          <span className="font-black text-blue-950 tracking-tight leading-tight text-xs sm:text-sm">
            زاد السنة
          </span>
          <span className="text-[10px] text-amber-700 font-bold">
            تطبيق السنن النبوية
          </span>
        </div>
      )}
    </div>
  );
};

