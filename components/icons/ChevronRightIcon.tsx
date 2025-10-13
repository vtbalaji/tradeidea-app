import React from 'react';

interface ChevronRightIconProps {
  size?: number;
  className?: string;
}

/**
 * ChevronRightIcon - Right-pointing chevron for navigation
 */
export const ChevronRightIcon: React.FC<ChevronRightIconProps> = ({
  size = 16,
  className = ''
}) => {
  return (
    <svg
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
};

export default ChevronRightIcon;
