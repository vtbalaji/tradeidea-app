import React from 'react';

interface TrendingIconProps {
  size?: number;
  color?: string;
  className?: string;
}

export const TrendingIcon: React.FC<TrendingIconProps> = ({
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
      {/* Portfolio briefcase */}
      <rect x="3" y="7" width="18" height="13" rx="2" stroke={color} strokeWidth="2"/>
      <path d="M8 7V5C8 3.89543 8.89543 3 10 3H14C15.1046 3 16 3.89543 16 5V7" stroke={color} strokeWidth="2"/>
      <path d="M3 11H21" stroke={color} strokeWidth="2"/>
      {/* Chart overlay */}
      <path d="M9 15L11 13L13 15L15 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

export default TrendingIcon;
