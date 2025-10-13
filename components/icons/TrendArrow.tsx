import React from 'react';

interface TrendArrowProps {
  isUp: boolean;
  size?: number;
  className?: string;
}

/**
 * TrendArrow component - Displays an up or down arrow based on trend direction
 * @param isUp - true for up arrow (green), false for down arrow (red)
 * @param size - Size of the icon in pixels (default: 12)
 * @param className - Additional CSS classes
 */
export const TrendArrow: React.FC<TrendArrowProps> = ({
  isUp,
  size = 12,
  className = ''
}) => {
  const colorClass = isUp ? 'text-green-500' : 'text-red-500';

  return (
    <svg
      className={`${colorClass} ${className}`}
      width={size}
      height={size}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      {isUp ? (
        // Up arrow
        <path
          fillRule="evenodd"
          d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
          clipRule="evenodd"
        />
      ) : (
        // Down arrow
        <path
          fillRule="evenodd"
          d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      )}
    </svg>
  );
};

export default TrendArrow;
