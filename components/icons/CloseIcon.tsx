import React from 'react';

interface CloseIconProps {
  size?: number;
  className?: string;
}

/**
 * CloseIcon - X/close icon for modal close buttons
 */
export const CloseIcon: React.FC<CloseIconProps> = ({
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
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
};

export default CloseIcon;
