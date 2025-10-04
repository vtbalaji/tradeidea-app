import React from 'react';

interface ShareIconProps {
  size?: number;
  color?: string;
  className?: string;
}

export const ShareIcon: React.FC<ShareIconProps> = ({
  size = 64,
  color = '#ff8c42',
  className = ''
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Dark circle background */}
      <circle cx="32" cy="32" r="32" fill="#1c2128" />

      {/* Share nodes */}
      {/* Top-right node */}
      <circle cx="42" cy="24" r="5" fill={color} />

      {/* Bottom-right node */}
      <circle cx="42" cy="40" r="5" fill={color} />

      {/* Left node */}
      <circle cx="22" cy="32" r="5" fill={color} />

      {/* Connection lines */}
      <line
        x1="27"
        y1="32"
        x2="37"
        y2="26"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      <line
        x1="27"
        y1="32"
        x2="37"
        y2="38"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default ShareIcon;
