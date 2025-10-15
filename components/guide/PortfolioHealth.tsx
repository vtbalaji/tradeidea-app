import React from 'react';

export default function PortfolioHealth() {
  return (
        <section id="portfolio-health" className="mb-12 scroll-mt-20">
          <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">📊</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Portfolio Health Dashboard</h2>
            </div>
            <p className="text-gray-600 dark:text-[#8b949e] mb-6">
              Get instant insights into your portfolio's health with a comprehensive single-page view.
            </p>

            <div className="space-y-4">
              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">💰 Total Value & P&L</h3>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li>Current portfolio value and total invested amount</li>
                  <li>Unrealized profit/loss with percentage gain</li>
                  <li>Daily change tracker</li>
                  <li>Per-position breakdown with color-coded indicators</li>
                </ul>
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-[#30363d]">
                  <p className="text-xs text-[#ff8c42] font-semibold">💡 See your entire portfolio health at a glance - no spreadsheet juggling!</p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">⚠️ Risk Signals</h3>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li>Positions below stop-loss levels</li>
                  <li>Stocks trading below 50 EMA, 100 MA, or 200 MA</li>
                  <li>Daily Supertrend exit signals</li>
                  <li>Warning indicators for high-risk positions</li>
                </ul>
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-[#30363d]">
                  <p className="text-xs text-[#ff8c42] font-semibold">⚡ Get instant warnings before losses pile up - protect your capital!</p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📈 Technical Health</h3>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li>Golden Cross and Death Cross indicators</li>
                  <li>EMA/MA trend analysis</li>
                  <li>RSI, MACD, and Bollinger Bands signals</li>
                  <li>Supertrend momentum indicators</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">🎯 Action Items</h3>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li>Positions near target prices</li>
                  <li>Pending exit recommendations</li>
                  <li>Buy/sell opportunities based on signals</li>
                  <li>Rebalancing suggestions</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
  );
}
