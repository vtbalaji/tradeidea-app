import React from 'react';

export default function MarketScreeners() {
  return (
        <section id="market-screeners" className="mb-12 scroll-mt-20">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-500 dark:border-blue-400 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">🔍</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Market Screeners</h2>
              <span className="px-3 py-1 bg-blue-500 text-white text-sm font-bold rounded-full">NEW FEATURE</span>
            </div>
            <p className="text-gray-600 dark:text-[#8b949e] mb-6">
              Discover fresh trading opportunities every day with automated technical screeners that identify stocks crossing key moving averages and Supertrend levels.
            </p>

            <div className="space-y-4">
              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📊 50 MA & 200 MA Crossovers</h3>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li>Identify stocks crossing 50-day and 200-day moving averages</li>
                  <li>Bullish crossovers (Golden Cross) - potential buy signals</li>
                  <li>Bearish crossovers (Death Cross) - potential sell/exit signals</li>
                  <li>Filter by both crossovers, 50 MA only, or 200 MA only</li>
                  <li>Shows price distance from MA levels (cross percentage)</li>
                </ul>
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-[#30363d]">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">💡 Classic signals used by professional traders worldwide!</p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📈 Supertrend Crossovers</h3>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li>Powerful momentum indicator for trend reversals</li>
                  <li>Bullish Supertrend - price crosses above Supertrend line</li>
                  <li>Bearish Supertrend - price crosses below Supertrend line</li>
                  <li>Excellent for entry/exit timing on trending stocks</li>
                  <li>Shows percentage distance from Supertrend level</li>
                </ul>
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-[#30363d]">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">⚡ Catch trend reversals early for maximum gains!</p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">💡 Convert to Idea - One Click Magic</h3>
                <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-2">
                  The most powerful feature - convert any screener result into a complete trading idea with one click:
                </p>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li><strong>Smart Entry Price:</strong> Automatically set to highest support level (Supertrend or 100 MA)</li>
                  <li><strong>Intelligent Stop Loss:</strong> Placed 2% below the key support level</li>
                  <li><strong>Risk-Reward Target:</strong> Auto-calculated with 2:1 risk-reward ratio</li>
                  <li><strong>Pre-filled Analysis:</strong> Technical context with crossover details and price levels</li>
                  <li><strong>Editable:</strong> Review and adjust all levels before publishing</li>
                </ul>
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-[#30363d]">
                  <p className="text-xs text-green-600 dark:text-green-400 font-semibold">🚀 From screener to trading idea in seconds - not minutes!</p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">🎯 How to Use Screeners</h3>
                <ol className="text-sm text-gray-600 dark:text-[#8b949e] space-y-2 ml-4 list-decimal">
                  <li>Navigate to <strong>Screeners</strong> page from main navigation</li>
                  <li>Choose a tab: <strong>50 & 200 MA Both</strong>, <strong>50 MA Only</strong>, <strong>200 MA Only</strong>, or <strong>Supertrend</strong></li>
                  <li>Review the list of stocks with crossover signals for today</li>
                  <li>Each card shows:
                    <ul className="ml-4 mt-1 space-y-0.5 list-disc">
                      <li>Symbol and crossover type (Bullish/Bearish)</li>
                      <li>Yesterday and today's closing prices</li>
                      <li>Moving average or Supertrend levels</li>
                      <li>Percentage distance from support/resistance</li>
                    </ul>
                  </li>
                  <li>Click <strong>"Convert to Idea"</strong> button to create a trading idea</li>
                  <li>Click <strong>"Analysis"</strong> button to see detailed technical & fundamental analysis</li>
                </ol>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📅 Data Updates</h3>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li>Screeners are updated daily after market closes</li>
                  <li>Shows crossovers that happened today (last trading day)</li>
                  <li>Automatically filters out stale signals</li>
                  <li>Data sourced from reliable market feeds</li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-500 dark:border-green-600 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 dark:text-green-400 mb-2">💡 Pro Tips for Screeners</h3>
                <ul className="text-sm text-green-800 dark:text-green-300 space-y-1 ml-4 list-disc">
                  <li><strong>Golden Cross (Bullish 200 MA):</strong> Strong long-term buy signal - consider accumulating</li>
                  <li><strong>Death Cross (Bearish 200 MA):</strong> Exit warning - review your holdings in this stock</li>
                  <li><strong>Supertrend Bullish:</strong> Excellent for swing trades - momentum is building</li>
                  <li><strong>Supertrend Bearish:</strong> Exit signal - trend has reversed</li>
                  <li><strong>Entry at Support:</strong> System automatically sets entry at Supertrend/100MA for safety</li>
                  <li><strong>Combine with Analysis:</strong> Always check fundamentals before taking a trade</li>
                  <li><strong>2:1 Risk-Reward:</strong> Targets are set to give you 2x the risk amount</li>
                </ul>
              </div>

              <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 rounded-lg p-4">
                <h3 className="font-semibold text-orange-900 dark:text-orange-400 mb-2">⚠️ Important Notes</h3>
                <ul className="text-sm text-orange-800 dark:text-orange-300 space-y-1 ml-4 list-disc">
                  <li>Crossover signals are indicators, not guarantees - always do your own research</li>
                  <li>Review pre-filled entry, stop-loss, and target levels before confirming</li>
                  <li>Check the fundamental strength using the Analysis button</li>
                  <li>Not all crossovers lead to profitable trades - combine with other analysis</li>
                  <li>Screeners work best in trending markets, less reliable in sideways markets</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
  );
}
