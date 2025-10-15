import React from 'react';
import Image from 'next/image';

interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * TradeIdea Logo Component
 * Using the official TradeIdeaIcon.png (3109 x 3109 square)
 */
export const Logo: React.FC<LogoProps> = ({ size = 40, className = '' }) => {
  return (
    <Image
      src="/logo.png"
      alt="TradeIdea Logo"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
};

export default Logo;
