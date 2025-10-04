import React from 'react';

interface EyeIconProps {
  size?: number;
  color?: string;
  className?: string;
}

export const EyeIcon: React.FC<EyeIconProps> = ({
  size = 64,
  color = '#58a6ff',
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

      {/* Eye outline */}
      <path
        d="M16 32C16 32 22 22 32 22C42 22 48 32 48 32C48 32 42 42 32 42C22 42 16 32 16 32Z"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Iris */}
      <circle
        cx="32"
        cy="32"
        r="6"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />

      {/* Pupil */}
      <circle
        cx="32"
        cy="32"
        r="3"
        fill={color}
      />

      {/* Eye shine */}
      <circle
        cx="34"
        cy="30"
        r="1.5"
        fill="#ffffff"
      />
    </svg>
  );
};

export default EyeIcon;
