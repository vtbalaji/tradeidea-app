import React from 'react';

interface EntryIconProps {
  size?: number;
  color?: string;
  className?: string;
}

export const EntryIcon: React.FC<EntryIconProps> = ({
  size = 64,
  color = '#c9d1d9',
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

      {/* Hollow circle */}
      <circle
        cx="32"
        cy="32"
        r="12"
        stroke={color}
        strokeWidth="3"
        fill="none"
      />

      {/* Entry point dot */}
      <circle
        cx="32"
        cy="32"
        r="4"
        fill={color}
      />
    </svg>
  );
};

export default EntryIcon;
