'use client';

import { useRouter } from 'next/navigation';
import { MyPortfolioIcon } from '@/components/icons';
import Logo from './Logo';

/**
 * Landing page content component
 * Note: This needs to remain a client component for the interactive buttons
 * However, the page structure will be pre-rendered by making the parent a server component
 */
export default function LandingPageContent() {
  const router = useRouter();

  return (
    <>
      {/* Navigation */}
      <nav className="border-b border-gray-200 dark:border-[#30363d]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Logo size={40} />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">TradeIdea</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 text-gray-700 dark:text-white hover:text-[#ff8c42] transition-colors font-semibold"
            >
              Login
            </button>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-2 bg-[#ff8c42] hover:bg-[#ff9a58] text-white font-semibold rounded-lg transition-colors"
            >
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      {/* Rest of the landing page content will be inserted here */}
    </>
  );
}
