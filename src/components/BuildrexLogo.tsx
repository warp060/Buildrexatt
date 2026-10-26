import React from 'react';

export interface BuildrexLogoProps {
  /**
   * 'badge': Full circular neon emblem (ring + monogram + BUILDREX + tagline)
   * 'icon': Focused cyber-circuit 'B' monogram
   * 'full': Logo emblem paired with typography
   */
  variant?: 'badge' | 'icon' | 'full';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showWordmark?: boolean;
  showTagline?: boolean;
  tagline?: string;
  glow?: boolean;
  className?: string;
  wordmarkClassName?: string;
  taglineClassName?: string;
  onClick?: () => void;
}

const sizeMap = {
  xs: {
    container: 'w-6 h-6',
    img: 'w-6 h-6',
    text: 'text-xs',
    tagline: 'text-[8px]',
  },
  sm: {
    container: 'w-8 h-8 sm:w-9 sm:h-9',
    img: 'w-8 h-8 sm:w-9 sm:h-9',
    text: 'text-sm sm:text-base',
    tagline: 'text-[9px] sm:text-[10px]',
  },
  md: {
    container: 'w-10 h-10 sm:w-11 sm:h-11',
    img: 'w-10 h-10 sm:w-11 sm:h-11',
    text: 'text-base sm:text-lg',
    tagline: 'text-[10px] sm:text-[11px]',
  },
  lg: {
    container: 'w-12 h-12 sm:w-14 sm:h-14',
    img: 'w-12 h-12 sm:w-14 sm:h-14',
    text: 'text-lg sm:text-xl',
    tagline: 'text-[11px] sm:text-xs',
  },
  xl: {
    container: 'w-16 h-16 sm:w-20 sm:h-20',
    img: 'w-16 h-16 sm:w-20 sm:h-20',
    text: 'text-xl sm:text-2xl',
    tagline: 'text-xs sm:text-sm',
  },
  '2xl': {
    container: 'w-24 h-24 sm:w-28 sm:h-28',
    img: 'w-24 h-24 sm:w-28 sm:h-28',
    text: 'text-2xl sm:text-3xl',
    tagline: 'text-sm sm:text-base',
  },
};

export const BuildrexLogo: React.FC<BuildrexLogoProps> = ({
  variant = 'badge',
  size = 'sm',
  showWordmark = false,
  showTagline = false,
  tagline = 'FOR BUILDERS. • BY BUILDERS.',
  glow = true,
  className = '',
  wordmarkClassName = '',
  taglineClassName = '',
  onClick,
}) => {
  const currentSize = sizeMap[size];
  const imgSrc = variant === 'icon' ? '/buildrex-icon.png' : '/buildrex-logo-circle.png';

  const glowStyles = glow
    ? 'shadow-[0_0_16px_rgba(139,92,246,0.25)] hover:shadow-[0_0_22px_rgba(6,182,212,0.4)]'
    : '';

  const logoGraphic = (
    <div
      className={`relative rounded-full bg-slate-950 flex items-center justify-center p-0.5 ring-1 ring-purple-500/30 transition-all duration-300 ${currentSize.container} ${glowStyles} ${
        onClick ? 'cursor-pointer hover:scale-105' : ''
      } ${className}`}
      onClick={onClick}
    >
      <img
        src={imgSrc}
        alt="BUILDREX Logo"
        className="w-full h-full object-contain rounded-full select-none"
        loading="eager"
      />
    </div>
  );

  if (!showWordmark && !showTagline) {
    return logoGraphic;
  }

  return (
    <div
      className={`inline-flex items-center gap-2.5 select-none ${
        onClick ? 'cursor-pointer group' : ''
      }`}
      onClick={onClick}
    >
      {logoGraphic}
      <div className="flex flex-col justify-center">
        {showWordmark && (
          <div className="flex items-center gap-1 leading-none">
            <span
              className={`font-black tracking-tight text-slate-900 ${currentSize.text} ${wordmarkClassName}`}
            >
              BUILDRE
            </span>
            <span
              className={`font-black tracking-tight bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-500 bg-clip-text text-transparent ${currentSize.text}`}
            >
              X
            </span>
          </div>
        )}
        {showTagline && (
          <span
            className={`font-bold tracking-wider uppercase mt-0.5 bg-gradient-to-r from-purple-700 via-indigo-600 to-cyan-600 bg-clip-text text-transparent ${currentSize.tagline} ${taglineClassName}`}
          >
            {tagline}
          </span>
        )}
      </div>
    </div>
  );
};
