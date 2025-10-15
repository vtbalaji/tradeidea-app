import React from 'react';

export default function InvestmentJourney() {
  return (
    <section id="investment-journey" className="mb-12 scroll-mt-20">
      <div className="bg-gradient-to-r from-[#ff8c42]/10 to-purple-500/10 border-2 border-[#ff8c42] rounded-xl p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🚀</div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Your Investment Journey</h2>
          <p className="text-lg text-gray-600 dark:text-[#8b949e] max-w-3xl mx-auto mb-4">
            From discovering opportunities to booking profits - automated alerts guide you every step of the way
          </p>
          <div className="inline-block bg-white dark:bg-[#1c2128] border border-[#ff8c42] rounded-lg px-6 py-3">
            <p className="text-sm font-bold text-[#ff8c42]">
              Three Ways to Start: Use Screener • Create Idea • Import Portfolio
            </p>
          </div>
        </div>

        {/* Scenario 1 */}
        <div className="mb-8 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-500 rounded-xl p-6">
          <div className="text-center mb-4">
            <div className="inline-block bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-5 py-2 rounded-full font-bold text-lg mb-2">
              Scenario 1: Discover from Screener
            </div>
            <p className="text-sm text-blue-900 dark:text-blue-300 font-semibold">
              Use our automated screeners to find daily crossover opportunities
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <div className="text-center">
              <div className="text-3xl mb-1">🔍</div>
              <div className="text-sm font-bold text-gray-900 dark:text-white">Screener</div>
            </div>
            <div className="text-2xl text-[#ff8c42]">→</div>
            <div className="text-center">
              <div className="text-3xl mb-1">👀</div>
              <div className="text-sm font-bold text-gray-900 dark:text-white">Review</div>
            </div>
            <div className="text-2xl text-[#ff8c42]">→</div>
            <div className="text-center">
              <div className="text-3xl mb-1">💡</div>
              <div className="text-sm font-bold text-gray-900 dark:text-white">Create Idea</div>
            </div>
            <div className="text-2xl text-[#ff8c42]">→</div>
            <div className="text-center">
              <div className="text-3xl mb-1">🔔</div>
              <div className="text-sm font-bold text-gray-900 dark:text-white">Entry Alert</div>
            </div>
            <div className="text-2xl text-[#ff8c42]">→</div>
            <div className="text-center">
              <div className="text-3xl mb-1">📊</div>
              <div className="text-sm font-bold text-gray-900 dark:text-white">Portfolio</div>
            </div>
            <div className="text-2xl text-[#ff8c42]">→</div>
            <div className="text-center">
              <div className="text-3xl mb-1">🎯</div>
              <div className="text-sm font-bold text-gray-900 dark:text-white">Book Profit</div>
            </div>
          </div>
        </div>

        {/* Scenario 2 */}
        <div className="mb-8 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-500 rounded-xl p-6">
          <div className="text-center mb-4">
            <div className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-5 py-2 rounded-full font-bold text-lg mb-2">
              Scenario 2: Create Your Own Idea
            </div>
            <p className="text-sm text-purple-900 dark:text-purple-300 font-semibold">
              Start with your own research and create investment ideas from scratch
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <div className="text-center">
              <div className="text-3xl mb-1">💡</div>
              <div className="text-sm font-bold text-gray-900 dark:text-white">Investment Idea</div>
            </div>
            <div className="text-2xl text-[#ff8c42]">→</div>
            <div className="text-center">
              <div className="text-3xl mb-1">🔔</div>
              <div className="text-sm font-bold text-gray-900 dark:text-white">Entry Alert</div>
            </div>
            <div className="text-2xl text-[#ff8c42]">→</div>
            <div className="text-center">
              <div className="text-3xl mb-1">📊</div>
              <div className="text-sm font-bold text-gray-900 dark:text-white">Portfolio</div>
            </div>
            <div className="text-2xl text-[#ff8c42]">→</div>
            <div className="text-center">
              <div className="text-3xl mb-1">🎯</div>
              <div className="text-sm font-bold text-gray-900 dark:text-white">Book Profit</div>
            </div>
          </div>
        </div>

        {/* Scenario 3 */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-2 border-emerald-500 rounded-xl p-6">
          <div className="text-center mb-4">
            <div className="inline-block bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-5 py-2 rounded-full font-bold text-lg mb-2">
              Scenario 3: Import Existing Portfolio
            </div>
            <p className="text-sm text-emerald-900 dark:text-emerald-300 font-semibold">
              Already invested? Import your holdings from Zerodha, ICICI, or any broker
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <div className="text-center">
              <div className="text-3xl mb-1">📥</div>
              <div className="text-sm font-bold text-gray-900 dark:text-white">Import Portfolio</div>
            </div>
            <div className="text-2xl text-[#ff8c42]">→</div>
            <div className="text-center">
              <div className="text-3xl mb-1">📊</div>
              <div className="text-sm font-bold text-gray-900 dark:text-white">Portfolio</div>
            </div>
            <div className="text-2xl text-[#ff8c42]">→</div>
            <div className="text-center">
              <div className="text-3xl mb-1">🔔</div>
              <div className="text-sm font-bold text-gray-900 dark:text-white">Smart Alerts</div>
            </div>
            <div className="text-2xl text-[#ff8c42]">→</div>
            <div className="text-center">
              <div className="text-3xl mb-1">🎯</div>
              <div className="text-sm font-bold text-gray-900 dark:text-white">Book Profit</div>
            </div>
          </div>
        </div>

        {/* Key Benefits */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-[#1c2128] rounded-lg p-4 border border-gray-200 dark:border-[#30363d] text-center">
            <div className="text-3xl mb-2">⏰</div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-2">Save Time</h4>
            <p className="text-sm text-gray-600 dark:text-[#8b949e]">
              No manual tracking - automated alerts notify you at every step
            </p>
          </div>
          <div className="bg-white dark:bg-[#1c2128] rounded-lg p-4 border border-gray-200 dark:border-[#30363d] text-center">
            <div className="text-3xl mb-2">💰</div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-2">Maximize Profits</h4>
            <p className="text-sm text-gray-600 dark:text-[#8b949e]">
              Enter at perfect prices, exit at targets - never miss opportunities
            </p>
          </div>
          <div className="bg-white dark:bg-[#1c2128] rounded-lg p-4 border border-gray-200 dark:border-[#30363d] text-center">
            <div className="text-3xl mb-2">🛡️</div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-2">Protect Capital</h4>
            <p className="text-sm text-gray-600 dark:text-[#8b949e]">
              Stop-loss and technical exit alerts prevent large losses
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
