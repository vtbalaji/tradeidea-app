import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * Portfolio Shield Logo Component
 * Represents: Trust & Security (shield), Growth (bars), Community (dots), Smart Tracking (checkmark)
 */
export const Logo: React.FC<LogoProps> = ({ size = 40, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background circle */}
      <circle cx="32" cy="32" r="32" fill="#ff8c42"/>

      {/* Shield shape (protection/trust) */}
      <path d="M 32 10 L 50 17 L 50 32 Q 50 45, 32 54 Q 14 45, 14 32 L 14 17 Z"
            fill="white"/>

      {/* Rising chart inside shield */}
      <g>
        <rect x="20" y="33" width="4" height="13" fill="#ff8c42" rx="1"/>
        <rect x="26" y="28" width="4" height="18" fill="#ff9a58" rx="1"/>
        <rect x="32" y="23" width="4" height="23" fill="#ffa066" rx="1"/>
        <rect x="38" y="18" width="4" height="28" fill="#ffb080" rx="1"/>
      </g>

      {/* Community dots at top */}
      <g>
        <circle cx="28" cy="17" r="1.5" fill="#ff8c42"/>
        <circle cx="32" cy="15" r="1.5" fill="#ff8c42"/>
        <circle cx="36" cy="17" r="1.5" fill="#ff8c42"/>
      </g>

      {/* Checkmark for smart tracking */}
      <path d="M 21 38 L 24 41 L 30 34"
            stroke="#ff8c42"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.5"/>
    </svg>
  );
};

export default Logo;
