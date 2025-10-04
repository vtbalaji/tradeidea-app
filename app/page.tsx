'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/ideas');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#ff8c42] flex items-center justify-center text-4xl">
          📈
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Loading TradeIdea...</h1>
        <div className="inline-block w-8 h-8 border-4 border-[#ff8c42] border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
}
