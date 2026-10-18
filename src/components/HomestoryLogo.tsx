import React from 'react';

interface HomestoryLogoProps {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  onClick?: () => void;
  variant?: 'light' | 'dark';
  markOnly?: boolean;
}

export const HomestoryLogoMark: React.FC<{ className?: string }> = ({ className = 'w-8 h-8 sm:w-9 sm:h-9' }) => (
  <svg
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} shrink-0 select-none drop-shadow-xs`}
    aria-hidden="true"
  >
    <defs>
      {/* Roof Left: Yellow to Orange Gradient */}
      <linearGradient id="roof-yellow-orange" x1="10" y1="65" x2="65" y2="20" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FBBF24" />
        <stop offset="25%" stopColor="#F59E0B" />
        <stop offset="70%" stopColor="#F97316" />
        <stop offset="100%" stopColor="#EF4444" />
      </linearGradient>

      {/* Roof Right & Right Wall: Cobalt to Cyan-Blue Gradient */}
      <linearGradient id="wall-blue" x1="45" y1="20" x2="95" y2="95" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1E40AF" />
        <stop offset="30%" stopColor="#2563EB" />
        <stop offset="70%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#60A5FA" />
      </linearGradient>

      {/* Left Wall & Floor: Vibrant Emerald to Forest Green Gradient */}
      <linearGradient id="wall-green" x1="15" y1="60" x2="55" y2="105" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#22C55E" />
        <stop offset="50%" stopColor="#16A34A" />
        <stop offset="100%" stopColor="#15803D" />
      </linearGradient>

      {/* Top-Right AI Sparkle Star: Electric Blue to Magenta-Violet */}
      <linearGradient id="star-gradient" x1="72" y1="5" x2="105" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="35%" stopColor="#6366F1" />
        <stop offset="70%" stopColor="#A855F7" />
        <stop offset="100%" stopColor="#EC4899" />
      </linearGradient>

      {/* Window Blue */}
      <linearGradient id="window-blue" x1="32" y1="55" x2="58" y2="82" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#1D4ED8" />
      </linearGradient>
    </defs>

    {/* 1. LEFT WALL & BOTTOM FLOOR (Green Ribbon) */}
    <path
      d="M15 62 V88 C15 99 24 105 34 105 H50 C44 105 35 101 27 95 C22 91 21 86 21 78 V62 C21 57 15 57 15 62 Z"
      fill="url(#wall-green)"
    />
    <path
      d="M15 62 C15 56 25 56 25 62 V85 C25 93 33 97 45 97 H52 C45 102 36 105 28 105 C18 105 15 97 15 88 Z"
      fill="url(#wall-green)"
    />

    {/* 2. RIGHT ROOF & RIGHT WALL (Blue Ribbon) */}
    <path
      d="M48 30 L74 53 C84 62 89 71 89 82 V94 C89 100 80 102 75 97 C72 94 72 88 72 82 V60 C72 52 68 46 60 39 L46 27 C42 24 45 18 51 21 L78 44 C88 53 94 65 94 78 V88 C94 100 83 108 72 104 C65 101 62 95 62 88 V66 L44 50 L48 30 Z"
      fill="url(#wall-blue)"
    />
    <path
      d="M48 24 L78 48 C87 56 92 67 92 79 V90 C92 101 82 106 73 101 C68 98 67 92 67 85 V62 C67 55 63 49 56 43 L42 30 C38 27 42 20 48 24 Z"
      fill="url(#wall-blue)"
    />

    {/* 3. LEFT ROOF SLANT (Yellow to Orange Ribbon) */}
    <path
      d="M8 53 C4 48 7 40 14 36 L52 13 C59 9 67 14 65 22 C63 29 57 32 50 36 L19 55 C14 58 9 57 8 53 Z"
      fill="url(#roof-yellow-orange)"
    />

    {/* 4. FOUR CENTER WINDOW PANES (2x2 Grid) */}
    <rect x="36" y="58" width="10" height="11" rx="3" fill="url(#window-blue)" />
    <rect x="49" y="58" width="10" height="11" rx="3" fill="url(#window-blue)" />
    <rect x="36" y="72" width="10" height="11" rx="3" fill="url(#window-blue)" />
    <rect x="49" y="72" width="10" height="11" rx="3" fill="url(#window-blue)" />

    {/* 5. TOP-RIGHT AI SPARKLE STAR (Gemini 4-Pointed Star) */}
    <path
      d="M88 4 Q88 19 103 19 Q88 19 88 34 Q88 19 73 19 Q88 19 88 4 Z"
      fill="url(#star-gradient)"
    />
  </svg>
);

export const HomestoryLogo: React.FC<HomestoryLogoProps> = ({
  className = '',
  markClassName = 'w-8 h-8 sm:w-9 sm:h-9',
  textClassName = 'text-lg sm:text-2xl',
  onClick,
  variant = 'light',
  markOnly = false,
}) => {
  return (
    <div
      onClick={onClick}
      onDoubleClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      className={`inline-flex items-center gap-2.5 select-none transition-opacity ${
        onClick ? 'cursor-pointer hover:opacity-95' : ''
      } ${className}`}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      <HomestoryLogoMark className={markClassName} />

      {/* Constant HomeStory Wordmark with Vibrant Gradient Accent */}
      {!markOnly && (
        <span
          className={`font-serif font-extrabold tracking-tight flex items-baseline pointer-events-none select-none ${textClassName} ${
            variant === 'dark' ? 'text-white' : 'text-[#1E2A44]'
          }`}
          style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
        >
          <span>Home</span>
          <span className="bg-gradient-to-r from-[#2563EB] via-[#F97316] to-[#EF4444] bg-clip-text text-transparent">
            story
          </span>
          <span className="font-sans font-bold text-[10px] tracking-widest text-[#6366F1] uppercase ml-1 px-1.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200/60 leading-none">
            AI
          </span>
        </span>
      )}
    </div>
  );
};
