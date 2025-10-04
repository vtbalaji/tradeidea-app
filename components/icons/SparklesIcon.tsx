import React from 'react';

interface SparklesIconProps {
  size?: number;
  color?: string;
  className?: string;
}

export const SparklesIcon: React.FC<SparklesIconProps> = ({
  size = 64,
  color = '#ff8c42',
  className = ''
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Dark circle background */}
      <circle cx="32" cy="32" r="32" fill="#1c2128" />

      {/* Large sparkle */}
      <path
        d="M32 18L34 26L42 28L34 30L32 38L30 30L22 28L30 26L32 18Z"
        fill={color}
      />

      {/* Small sparkle top-right */}
      <path
        d="M44 22L45 25L48 26L45 27L44 30L43 27L40 26L43 25L44 22Z"
        fill={color}
      />

      {/* Small sparkle bottom-left */}
      <path
        d="M20 38L21 41L24 42L21 43L20 46L19 43L16 42L19 41L20 38Z"
        fill={color}
      />

      {/* Tiny sparkle bottom-right */}
      <circle cx="42" cy="42" r="2" fill={color} />
    </svg>
  );
};

export default SparklesIcon;
