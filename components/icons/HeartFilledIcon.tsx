import React from 'react';

interface HeartFilledIconProps {
  size?: number;
  className?: string;
}

/**
 * HeartFilledIcon - Simple filled heart icon for likes display
 */
export const HeartFilledIcon: React.FC<HeartFilledIconProps> = ({
  size = 14,
  className = ''
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
    >
      <path d="M8 14s-6-4.5-6-8c0-2.5 2-4 4-4 1.5 0 2 1 2 1s.5-1 2-1c2 0 4 1.5 4 4 0 3.5-6 8-6 8z"/>
    </svg>
  );
};

export default HeartFilledIcon;
