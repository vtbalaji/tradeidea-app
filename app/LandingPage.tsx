'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Auto-redirect authenticated users
  if (!loading && user) {
    if (user.emailVerified) {
      router.push('/ideas');
    } else {
      router.push('/verify');
    }
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0f1419] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4">
            <Logo size={80} />
          </div>
          <div className="inline-block w-8 h-8 border-4 border-[#ff8c42] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

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

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        {/* Made in India Badge */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-100 to-green-100 dark:from-orange-900/30 dark:to-green-900/30 border-2 border-orange-500 dark:border-orange-400 rounded-full">
            <span className="text-2xl">🇮🇳</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">Made in India for Indian Investors</span>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 border border-blue-500 dark:border-blue-400 rounded-full">
            <span className="text-sm font-bold text-blue-900 dark:text-blue-300">NSE/BSE Stocks Only</span>
          </div>
        </div>

        {/* Anti-Scam Warning */}
        <div className="mb-6 inline-block">
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 px-4 py-2 rounded">
            <p className="text-sm font-semibold text-red-800 dark:text-red-300">
              ⚠️ NOT a Forex Trading Platform • Portfolio Tracking Tool Only • We Never Ask for Trading Passwords
            </p>
          </div>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
          Never Miss Another Entry or Exit<br />
          <span className="text-[#ff8c42]">Automated Alerts for Indian Stock Traders</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-[#8b949e] mb-10 max-w-3xl mx-auto">
          Track NSE/BSE stocks with automated technical & fundamental analysis.
          Get instant email alerts when stocks hit your entry, target, or stop-loss levels.
          Import from Zerodha/ICICI in one click.
        </p>

        <div className="flex gap-4 justify-center flex-wrap">
          <div className="relative">
            <button
              onClick={() => router.push('/login')}
              className="px-8 py-4 bg-[#ff8c42] hover:bg-[#ff9a58] text-white text-lg font-bold rounded-lg transition-all shadow-lg hover:shadow-xl hover:scale-105 relative group"
            >
              <span className="flex items-center gap-2">
                Start Free - No Credit Card
                <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
              </span>
            </button>
            <div className="absolute -top-3 -right-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
              FREE
            </div>
          </div>
          <button
            onClick={() => router.push('/ideas')}
            className="px-8 py-4 bg-gray-100 dark:bg-[#1c2128] hover:bg-gray-200 dark:hover:bg-[#30363d] border-2 border-gray-300 dark:border-[#30363d] text-gray-900 dark:text-white text-lg font-semibold rounded-lg transition-all hover:border-[#ff8c42] dark:hover:border-[#ff8c42]"
          >
            View Live Ideas
          </button>
        </div>

        {/* Micro Social Proof */}
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-[#8b949e]">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white dark:border-[#0f1419] flex items-center justify-center text-white text-xs font-bold">
              A
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-white dark:border-[#0f1419] flex items-center justify-center text-white text-xs font-bold">
              B
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 border-2 border-white dark:border-[#0f1419] flex items-center justify-center text-white text-xs font-bold">
              C
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 border-2 border-white dark:border-[#0f1419] flex items-center justify-center text-white text-xs font-bold">
              +
            </div>
          </div>
          <span className="font-medium">Join traders already tracking portfolios</span>
        </div>

        {/* Trust Signals - Quick Benefits */}
        <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm font-semibold text-gray-700 dark:text-[#8b949e]">
          <div className="flex items-center gap-2">
            <span className="text-green-500 text-lg">✓</span>
            <span>Free Forever Plan</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500 text-lg">✓</span>
            <span>No Credit Card Required</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500 text-lg">✓</span>
            <span>Bank-Grade Security</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500 text-lg">✓</span>
            <span>Import from Any Broker</span>
          </div>
        </div>
      </section>
    </>
  );
}
