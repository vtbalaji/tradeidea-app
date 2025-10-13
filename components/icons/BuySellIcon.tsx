import React from 'react';

interface BuySellIconProps {
  size?: number;
  className?: string;
}

/**
 * BuySellIcon - Bidirectional arrow icon for buy/sell transactions
 */
export const BuySellIcon: React.FC<BuySellIconProps> = ({
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
        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
      />
    </svg>
  );
};

export default BuySellIcon;
