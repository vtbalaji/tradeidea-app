import React from 'react';

interface BookIconProps {
  size?: number;
  color?: string;
  className?: string;
}

export const BookIcon: React.FC<BookIconProps> = ({
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
      <path d="M4 19.5C4 18.1193 5.11929 17 6.5 17H20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6.5 3H20V21H6.5C5.11929 21 4 19.8807 4 18.5V5.5C4 4.11929 5.11929 3 6.5 3Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

export default BookIcon;
