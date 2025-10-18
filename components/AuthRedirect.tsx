'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

/**
 * Client component that handles automatic redirect for authenticated users
 * This is separated from the landing page to allow the landing page to be pre-rendered
 */
export default function AuthRedirect() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      // Auto-redirect authenticated users
      if (user.emailVerified) {
        router.push('/ideas');
      } else {
        router.push('/verify');
      }
    }
  }, [user, loading, router]);

  // This component doesn't render anything visible
  return null;
}
