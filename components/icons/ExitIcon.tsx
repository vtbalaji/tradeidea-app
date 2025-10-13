import React from 'react';

interface ExitIconProps {
  size?: number;
  className?: string;
}

/**
 * ExitIcon - Exit/logout arrow icon for exiting positions
 */
export const ExitIcon: React.FC<ExitIconProps> = ({
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
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  );
};

export default ExitIcon;
