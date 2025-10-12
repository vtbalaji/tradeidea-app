import React from 'react';

interface SparklesIconProps {
  size?: number;
  color?: string;
  className?: string;
}

export const SparklesIcon: React.FC<SparklesIconProps> = ({
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
      {/* Plus sign for new */}
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2"/>
      <path d="M12 8V16" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M8 12H16" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      {/* Sparkle accent */}
      <path d="M18 6L18.5 7.5L20 8L18.5 8.5L18 10L17.5 8.5L16 8L17.5 7.5L18 6Z" fill={color}/>
    </svg>
  );
};

export default SparklesIcon;
