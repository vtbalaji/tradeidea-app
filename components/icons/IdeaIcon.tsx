import React from 'react';

interface IdeaIconProps {
  size?: number;
  color?: string;
  className?: string;
}

export const IdeaIcon: React.FC<IdeaIconProps> = ({
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
      {/* Lightbulb outline */}
      <path
        d="M9 21H15M12 3C8.68629 3 6 5.68629 6 9C6 10.8954 6.8429 12.5907 8.17071 13.6631C8.59554 14.0132 9 14.5324 9 15.1707V16C9 16.5523 9.44772 17 10 17H14C14.5523 17 15 16.5523 15 16V15.1707C15 14.5324 15.4045 14.0132 15.8293 13.6631C17.1571 12.5907 18 10.8954 18 9C18 5.68629 15.3137 3 12 3Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Light rays */}
      <path d="M12 1V2" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M4.22 4.22L4.93 4.93" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M1 12H2" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M22 12H23" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M19.07 4.93L19.78 4.22" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
};

export default IdeaIcon;
