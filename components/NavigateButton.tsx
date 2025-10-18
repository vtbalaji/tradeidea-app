'use client';

import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';

interface NavigateButtonProps {
  to: string;
  className?: string;
  children: ReactNode;
}

/**
 * Client component for navigation buttons
 * Allows landing page to be pre-rendered while keeping interactive navigation
 */
export default function NavigateButton({ to, className, children }: NavigateButtonProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(to)}
      className={className}
    >
      {children}
    </button>
  );
}
