import React from 'react';

export default function PortfolioCardGuide() {
  return (
    <section id="read-portfolio-card" className="mb-12 scroll-mt-20">
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-2 border-[#ff8c42] dark:border-[#ff8c42] rounded-xl p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-4xl">📊</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">How to Read Portfolio Card</h2>
          <span className="px-3 py-1 bg-[#ff8c42] text-white text-sm font-bold rounded-full">PRICE ACTION</span>
        </div>

        <p className="text-gray-700 dark:text-[#c9d1d9] mb-6">
          Portfolio cards now feature <strong>enhanced recommendation system</strong> with price action analysis.
          Each recommendation combines <strong>8 technical indicators</strong> for high-confidence signals.
        </p>

        {/* Recommendation Levels */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">5 Recommendation Levels</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-[#ff8c42]/10 border border-[#ff8c42]/30 rounded-lg">
              <span className="text-2xl">▲▲</span>
              <div className="flex-1">
                <div className="font-bold text-[#ff8c42]">STRONG BUY</div>
                <div className="text-sm text-gray-600 dark:text-[#8b949e]">
                  All 8 conditions met: Uptrend + RSI 50-70 + Above all MAs + Supertrend bullish + More
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <span className="text-2xl">▲</span>
              <div className="flex-1">
                <div className="font-bold text-green-600 dark:text-green-400">BUY</div>
                <div className="text-sm text-gray-600 dark:text-[#8b949e]">
                  Building momentum: Uptrend/Sideways + RSI &gt; 50 + Above 50MA
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <span className="text-2xl">■</span>
              <div className="flex-1">
                <div className="font-bold text-blue-600 dark:text-blue-400">HOLD</div>
                <div className="text-sm text-gray-600 dark:text-[#8b949e]">
                  Consolidating: Sideways trend + RSI 40-60 + Neutral signals
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
              <span className="text-2xl">▼</span>
              <div className="flex-1">
                <div className="font-bold text-orange-600 dark:text-orange-400">SELL</div>
                <div className="text-sm text-gray-600 dark:text-[#8b949e]">
                  Weakening: Downtrend or Below 50MA + RSI &lt; 50 + Below BB middle
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <span className="text-2xl">▼▼</span>
              <div className="flex-1">
                <div className="font-bold text-red-600 dark:text-red-400">STRONG SELL</div>
                <div className="text-sm text-gray-600 dark:text-[#8b949e]">
                  Critical: Downtrend + Extreme RSI + Below 50MA + Below BB middle 3+ days
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Feature */}
        <div className="mb-6 p-4 bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            🎯 Filter by Recommendation
            <span className="px-2 py-0.5 bg-[#ff8c42] text-white text-xs font-bold rounded">NEW</span>
          </h3>
          <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-3">
            Quickly find stocks by recommendation level using the filter dropdown on portfolio page.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-gray-100 dark:bg-[#1c2128] border border-gray-300 dark:border-[#30363d] rounded text-sm font-semibold">
              Filter: All (25) ▼
            </span>
            <span className="px-2 py-1 text-xs text-gray-500 dark:text-[#8b949e]">→ Select:</span>
            <span className="px-2 py-1 bg-[#ff8c42]/10 text-[#ff8c42] text-xs rounded">▲▲ Strong Buy</span>
            <span className="px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 text-xs rounded">▲ Buy</span>
            <span className="px-2 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs rounded">■ Hold</span>
            <span className="px-2 py-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs rounded">▼ Sell</span>
            <span className="px-2 py-1 bg-red-500/10 text-red-600 dark:text-red-400 text-xs rounded">▼▼ Strong Sell</span>
          </div>
        </div>

        {/* Example: Why RELIANCE is SELL */}
        <div className="mb-6 p-4 bg-white dark:bg-[#0f1419] border border-orange-500 dark:border-orange-500 rounded-lg">
          <h3 className="text-lg font-bold text-orange-600 dark:text-orange-400 mb-3">
            📝 Example: Why RELIANCE shows ▼ SELL
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-2">✗ Failed Conditions:</h4>
              <ul className="text-sm space-y-1 text-gray-600 dark:text-[#8b949e]">
                <li>✗ RSI: 46.7 (below 50, weak momentum)</li>
                <li>✗ Price ₹1375 &lt; 50MA ₹1385 (below support)</li>
                <li>✗ Supertrend: Bearish 🔴</li>
                <li>✗ BB: Below middle for 5 days</li>
                <li>✗ Volume: 0.75x (below average)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-2">✓ Passed Conditions:</h4>
              <ul className="text-sm space-y-1 text-gray-600 dark:text-[#8b949e]">
                <li>✓ Trend: UPTREND (pattern structure)</li>
                <li>✓ Price ₹1375 &gt; 200MA ₹1346</li>
                <li>✓ MACD: Bullish histogram</li>
              </ul>
              <p className="mt-3 text-xs font-bold text-orange-600 dark:text-orange-400">
                → Result: Only 3/8 for STRONG BUY = SELL signal instead
              </p>
            </div>
          </div>
        </div>

        {/* Priority Logic */}
        <div className="mb-6 p-4 bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">🔄 How Recommendations Are Calculated</h3>
          <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-3">
            System checks conditions in <strong>priority order</strong>. First match wins:
          </p>
          <ol className="text-sm space-y-2 text-gray-700 dark:text-[#c9d1d9]">
            <li><strong>1. STRONG SELL</strong> (Most Critical) - Checked first</li>
            <li><strong>2. SELL</strong> (Warning) - Checked second</li>
            <li><strong>3. STRONG BUY</strong> (Best Opportunity) - All 8 conditions required</li>
            <li><strong>4. BUY</strong> (Good Entry) - 4 conditions required</li>
            <li><strong>5. HOLD</strong> (Default) - Neutral/mixed signals</li>
          </ol>
        </div>

        {/* Full Guide Link */}
        <div className="p-4 bg-gradient-to-r from-[#ff8c42]/10 to-orange-500/10 border border-[#ff8c42]/30 rounded-lg text-center">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">
            📖 Complete Guide Available
          </p>
          <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-3">
            Detailed explanation of all 5 recommendation logics with examples, decision tree, and common misconceptions
          </p>
          <a
            href="https://github.com/your-repo/docs/PORTFOLIO_CARD_GUIDE.md"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 bg-[#ff8c42] hover:bg-[#ff9a58] text-white text-sm font-bold rounded-lg transition-colors"
          >
            View Full Portfolio Card Guide →
          </a>
        </div>
      </div>
    </section>
  );
}
