import React from 'react';

interface TargetIconProps {
  size?: number;
  color?: string;
  className?: string;
}

export const TargetIcon: React.FC<TargetIconProps> = ({
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

      {/* Outer target ring */}
      <circle
        cx="32"
        cy="32"
        r="16"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />

      {/* Middle target ring */}
      <circle
        cx="32"
        cy="32"
        r="11"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />

      {/* Inner target ring */}
      <circle
        cx="32"
        cy="32"
        r="6"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />

      {/* Center bullseye */}
      <circle
        cx="32"
        cy="32"
        r="3"
        fill={color}
      />
    </svg>
  );
};

export default TargetIcon;
