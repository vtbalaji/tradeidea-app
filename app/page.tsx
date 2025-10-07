'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { MyPortfolioIcon } from '@/components/icons';

export default function Home() {
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

  // Show landing page for non-authenticated users
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0f1419] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#ff8c42] flex items-center justify-center">
            <MyPortfolioIcon size={48} />
          </div>
          <div className="inline-block w-8 h-8 border-4 border-[#ff8c42] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1419]">
      {/* Navigation */}
      <nav className="border-b border-gray-200 dark:border-[#30363d]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#ff8c42] flex items-center justify-center">
              <MyPortfolioIcon size={24} />
            </div>
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
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
          Community Driven<br />
          <span className="text-[#ff8c42]">Trading Ideas</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-[#8b949e] mb-10 max-w-2xl mx-auto">
          Discover, share, and track trading opportunities with a community of traders.
          Follow the best ideas and build your portfolio together.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => router.push('/login')}
            className="px-8 py-4 bg-[#ff8c42] hover:bg-[#ff9a58] text-white text-lg font-bold rounded-lg transition-colors"
          >
            Get Started Free
          </button>
          <button
            onClick={() => router.push('/ideas')}
            className="px-8 py-4 bg-gray-100 dark:bg-[#1c2128] hover:bg-gray-200 dark:hover:bg-[#30363d] border border-gray-200 dark:border-[#30363d] text-gray-900 dark:text-white text-lg font-semibold rounded-lg transition-colors"
          >
            Explore Ideas
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">Why TradeIdea?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-6 text-center">
            <div className="text-5xl mb-4">💡</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Share Trading Ideas</h3>
            <p className="text-gray-600 dark:text-[#8b949e]">
              Post detailed trade setups with entry, targets, and stop-loss levels.
              Share your analysis with the community.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-6 text-center">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Real-time Technical Analysis</h3>
            <p className="text-gray-600 dark:text-[#8b949e]">
              Automated technical indicators including 50 EMA/200 MA crossovers, Golden Cross,
              RSI, MACD, and Bollinger Bands for every stock.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-6 text-center">
            <div className="text-5xl mb-4">👥</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Follow Top Traders</h3>
            <p className="text-gray-600 dark:text-[#8b949e]">
              Discover and follow successful traders. Get notified when they share
              new ideas and learn from the best.
            </p>
          </div>
        </div>
      </section>

      {/* Coming Soon - Smart Alerts */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-r from-[#ff8c42]/10 to-purple-500/10 border-2 border-[#ff8c42] dark:border-[#ff8c42] rounded-2xl p-12 text-center relative overflow-hidden">
          <div className="absolute top-4 right-4 px-4 py-1 bg-[#ff8c42] text-white text-sm font-bold rounded-full">
            Coming Soon
          </div>
          <div className="text-6xl mb-6">🔔</div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Smart Signal Alerts
          </h2>
          <p className="text-lg text-gray-600 dark:text-[#8b949e] mb-6 max-w-3xl mx-auto">
            Set your buy/sell parameters based on technical, fundamental, and sentiment analysis.
            Our system will automatically scan the market and notify you when opportunities match your criteria.
            <strong className="block mt-2 text-gray-900 dark:text-white">No more manual tracking!</strong>
          </p>
          <div className="grid md:grid-cols-3 gap-6 mt-8 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
              <div className="text-2xl mb-2">📈</div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-1">Technical Signals</h4>
              <p className="text-sm text-gray-600 dark:text-[#8b949e]">
                EMA crossovers, RSI levels, MACD divergence, volume breakouts
              </p>
            </div>
            <div className="bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
              <div className="text-2xl mb-2">💼</div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-1">Fundamental Filters</h4>
              <p className="text-sm text-gray-600 dark:text-[#8b949e]">
                P/E ratio, market cap, revenue growth, profit margins
              </p>
            </div>
            <div className="bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
              <div className="text-2xl mb-2">💬</div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-1">Sentiment Analysis</h4>
              <p className="text-sm text-gray-600 dark:text-[#8b949e]">
                News sentiment, social media buzz, analyst ratings
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#ff8c42] flex items-center justify-center text-2xl font-bold text-white">
              1
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Create an Account</h3>
            <p className="text-gray-600 dark:text-[#8b949e]">
              Sign up for free and join our trading community in seconds.
            </p>
          </div>

          {/* Step 2 */}
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#ff8c42] flex items-center justify-center text-2xl font-bold text-white">
              2
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Explore & Share</h3>
            <p className="text-gray-600 dark:text-[#8b949e]">
              Browse trading ideas or share your own with detailed analysis.
            </p>
          </div>

          {/* Step 3 */}
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#ff8c42] flex items-center justify-center text-2xl font-bold text-white">
              3
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Track & Grow</h3>
            <p className="text-gray-600 dark:text-[#8b949e]">
              Add ideas to your portfolio and watch your trading performance grow.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {/* <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-12">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-[#ff8c42] mb-2">1000+</div>
              <div className="text-gray-600 dark:text-[#8b949e]">Trading Ideas</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#ff8c42] mb-2">500+</div>
              <div className="text-gray-600 dark:text-[#8b949e]">Active Traders</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#ff8c42] mb-2">75%</div>
              <div className="text-gray-600 dark:text-[#8b949e]">Success Rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#ff8c42] mb-2">24/7</div>
              <div className="text-gray-600 dark:text-[#8b949e]">Community Support</div>
            </div>
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Ready to Start Trading Smarter?</h2>
        <p className="text-xl text-gray-600 dark:text-[#8b949e] mb-8">
          Join TradeIdea today and connect with traders worldwide.
        </p>
        <button
          onClick={() => router.push('/login')}
          className="px-10 py-4 bg-[#ff8c42] hover:bg-[#ff9a58] text-white text-lg font-bold rounded-lg transition-colors"
        >
          Sign Up Now
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-[#30363d] mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#ff8c42] flex items-center justify-center">
                <MyPortfolioIcon size={18} />
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">TradeIdea</span>
            </div>
            <div className="text-sm text-gray-600 dark:text-[#8b949e]">
              © 2025 TradeIdea. All rights reserved.
            </div>
            <div className="flex gap-6 text-sm text-gray-600 dark:text-[#8b949e]">
              <button className="hover:text-gray-900 dark:hover:text-white transition-colors">About</button>
              <button onClick={() => router.push('/faq')} className="hover:text-gray-900 dark:hover:text-white transition-colors">FAQ</button>
              <button className="hover:text-gray-900 dark:hover:text-white transition-colors">Privacy</button>
              <button className="hover:text-gray-900 dark:hover:text-white transition-colors">Terms</button>
              <button className="hover:text-gray-900 dark:hover:text-white transition-colors">Contact</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
