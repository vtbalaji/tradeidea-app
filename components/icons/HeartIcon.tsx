import React from 'react';

interface HeartIconProps {
  size?: number;
  color?: string;
  className?: string;
  filled?: boolean;
}

export const HeartIcon: React.FC<HeartIconProps> = ({
  size = 64,
  color = '#f85149',
  className = '',
  filled = false
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

      {/* Heart shape */}
      <path
        d="M32 46C32 46 18 37 18 26C18 21.5817 21.5817 18 26 18C28.5 18 30.7 19.1 32 20.9C33.3 19.1 35.5 18 38 18C42.4183 18 46 21.5817 46 26C46 37 32 46 32 46Z"
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default HeartIcon;
