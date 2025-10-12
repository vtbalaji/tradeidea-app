import React from 'react';

interface FilterIconProps {
  size?: number;
  color?: string;
  className?: string;
}

export const FilterIcon: React.FC<FilterIconProps> = ({
  size = 18,
  color = '#ff8c42',
  className = ''
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Filter/Funnel icon */}
      <path
        d="M4 4H20L14 11.5V18L10 20V11.5L4 4Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Optional: Add dots to represent filtering */}
      <circle cx="8" cy="7" r="1" fill={color} />
      <circle cx="12" cy="7" r="1" fill={color} />
      <circle cx="16" cy="7" r="1" fill={color} />
    </svg>
  );
};

export default FilterIcon;
