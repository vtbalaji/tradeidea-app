import React from 'react';

interface ChevronDownIconProps {
  size?: number;
  className?: string;
}

/**
 * ChevronDownIcon - Down-pointing chevron for expand/collapse functionality
 */
export const ChevronDownIcon: React.FC<ChevronDownIconProps> = ({
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
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
};

export default ChevronDownIcon;
