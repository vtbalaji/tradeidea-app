import React from 'react';

interface IdeaIconProps {
  size?: number;
  color?: string;
  className?: string;
}

export const IdeaIcon: React.FC<IdeaIconProps> = ({
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

      {/* Lightbulb shape */}
      <path
        d="M32 16C26.477 16 22 20.477 22 26C22 29.5 23.5 32.5 25.5 34.5C26.5 35.5 27 36.5 27 37.5V40C27 41.105 27.895 42 29 42H35C36.105 42 37 41.105 37 40V37.5C37 36.5 37.5 35.5 38.5 34.5C40.5 32.5 42 29.5 42 26C42 20.477 37.523 16 32 16Z"
        fill={color}
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Bulb filament */}
      <line x1="32" y1="22" x2="32" y2="28" stroke="#1c2128" strokeWidth="2" strokeLinecap="round"/>
      <line x1="28" y1="26" x2="36" y2="26" stroke="#1c2128" strokeWidth="2" strokeLinecap="round"/>

      {/* Base of bulb */}
      <rect x="28" y="42" width="8" height="3" rx="1" fill={color} />
      <rect x="28" y="45" width="8" height="3" rx="1" fill={color} />
    </svg>
  );
};

export default IdeaIcon;
