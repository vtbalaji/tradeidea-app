import React from 'react';

interface ChevronLeftIconProps {
  size?: number;
  className?: string;
}

/**
 * ChevronLeftIcon - Left-pointing chevron for navigation
 */
export const ChevronLeftIcon: React.FC<ChevronLeftIconProps> = ({
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
        d="M15 19l-7-7 7-7"
      />
    </svg>
  );
};

export default ChevronLeftIcon;
