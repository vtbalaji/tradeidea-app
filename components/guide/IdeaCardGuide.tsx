import React from 'react';

export default function IdeaCardGuide() {
  return (
    <section id="read-idea-card" className="mb-12 scroll-mt-20">
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-500 dark:border-green-400 rounded-xl p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-4xl">📖</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">How to Read an Idea Card</h2>
          <span className="px-3 py-1 bg-green-500 text-white text-sm font-bold rounded-full">NEW GUIDE</span>
        </div>
        <p className="text-gray-600 dark:text-[#8b949e] mb-6">
          Every idea card provides comprehensive information to help you make informed trading decisions. Learn what each field means and how to interpret the data.
        </p>

        <div className="space-y-4">
          {/* Header Section */}
          <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📌 Header Section</h3>
            <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-2 ml-4 list-disc">
              <li><strong>Symbol Name</strong> (e.g., &quot;HEG&quot;) - The stock ticker symbol on NSE</li>
              <li><strong>Industry/Sector</strong> - Business category (e.g., &quot;Electrical Equipment & Parts&quot;)</li>
              <li><strong>Status Badge</strong> (Top-right corner) - Entry readiness indicator:
                <ul className="ml-4 mt-1 space-y-1 list-none">
                  <li>🟢 <strong className="text-green-600 dark:text-green-400">Ready to Enter</strong> - All conditions met for entry</li>
                  <li>🟠 <strong className="text-orange-600 dark:text-orange-400">You can Enter</strong> - Excellent fundamentals, price below entry</li>
                  <li>⚪ <strong className="text-gray-600 dark:text-gray-400">Waiting</strong> - Conditions not yet met</li>
                </ul>
              </li>
            </ul>
          </div>

          {/* Tags Section */}
          <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">🏷️ Tags Section</h3>
            <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
              <li><strong>Risk Level</strong> - #low risk, #medium risk, or #high risk</li>
              <li><strong>Timeframe</strong> - #short term (days-weeks), #medium term (weeks-months), or #long term (months-years)</li>
              <li><strong>Analysis Type</strong> - #technical analysis, #fundamental analysis, etc.</li>
            </ul>
          </div>

          {/* Technical Levels Card */}
          <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📊 Technical Levels Card</h3>
            <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-2">
              Shows real-time technical indicators with trend arrows (↑/↓):
            </p>
            <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-2 ml-4 list-disc">
              <li><strong>Technical Signal</strong> - Overall signal: STRONG_BUY, BUY, NEUTRAL, SELL, STRONG_SELL</li>
              <li><strong>50 EMA</strong> - 50-day Exponential Moving Average (short-term trend)</li>
              <li><strong>100 MA</strong> - 100-day Simple Moving Average (medium-term support/resistance)</li>
              <li><strong>200 MA</strong> - 200-day Simple Moving Average (long-term trend indicator)</li>
              <li><strong>Supertrend</strong> - Trend-following indicator with buy/sell signals</li>
              <li><strong>BB Middle</strong> - Bollinger Bands middle line (20-day moving average)</li>
              <li><strong>RSI</strong> - Relative Strength Index (14-period):
                <ul className="ml-4 mt-1 space-y-0.5 text-xs">
                  <li>RSI &gt; 70: Overbought (potential reversal down)</li>
                  <li>RSI &lt; 30: Oversold (potential bounce up)</li>
                  <li>RSI 30-70: Normal range</li>
                </ul>
              </li>
            </ul>
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-[#30363d]">
              <p className="text-xs font-semibold text-gray-900 dark:text-white mb-1">Trend Arrows:</p>
              <ul className="text-xs text-gray-600 dark:text-[#8b949e] space-y-0.5 ml-4 list-none">
                <li>↑ <span className="text-green-600 dark:text-green-400">Green arrow</span> = Price is above the indicator (bullish signal)</li>
                <li>↓ <span className="text-red-600 dark:text-red-400">Red arrow</span> = Price is below the indicator (bearish signal)</li>
              </ul>
            </div>
          </div>

          {/* Fundamentals Card */}
          <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">💼 Fundamentals Card</h3>
            <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-2">
              Shows company financial health metrics:
            </p>
            <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-2 ml-4 list-disc">
              <li><strong>Fundamental Rating</strong> - EXCELLENT, GOOD, AVERAGE, POOR, WEAK (our proprietary score)</li>
              <li><strong>PE (Price-to-Earnings)</strong> - Valuation metric (lower is generally better, 10-20 is ideal)</li>
              <li><strong>ROE (Return on Equity)</strong> - Profitability measure (higher is better, &gt;15% is good)</li>
              <li><strong>Debt-to-Equity</strong> - Financial leverage (&lt;50 is safer, &gt;200 is risky)</li>
              <li><strong>Earnings Growth</strong> - Year-over-year earnings growth % (higher indicates growth potential)</li>
            </ul>
          </div>

          {/* Price Levels Section */}
          <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">💰 Price Levels Section</h3>
            <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-2">
              Four key price points displayed in a grid:
            </p>
            <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-2 ml-4 list-disc">
              <li><strong>LTP (Last Traded Price)</strong> - Current market price (e.g., ₹519.45)</li>
              <li><strong>Entry</strong> - Recommended entry price (e.g., ₹510)</li>
              <li><strong>Target</strong> - Price target with expected gain % (e.g., ₹585, +14.7%)</li>
              <li><strong>Stop Loss</strong> - Risk management level to limit downside (e.g., ₹495)</li>
            </ul>
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-[#30363d]">
              <p className="text-xs text-[#ff8c42] font-semibold">💡 Pro Tip: Compare LTP with Entry to see if you&apos;re buying at discount or premium!</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">🎯 Action Buttons</h3>
            <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-2 ml-4 list-disc">
              <li><strong>📊 Analysis</strong> - View detailed technical and fundamental analysis with AI-powered recommendation and investor suitability</li>
              <li><strong>➕ Add Position</strong> - Convert this idea into a live portfolio position with quantity, entry price, and exit criteria</li>
              <li><strong>✏️ Edit</strong> - Modify idea details (available only if you&apos;re the creator)</li>
            </ul>
          </div>

          {/* Footer Section */}
          <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📊 Footer Section</h3>
            <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
              <li><strong>Engagement Metrics</strong> - Likes (❤️), Comments (💬), and Post Date (📅 shows relative time)</li>
              <li><strong>Creator Info</strong> - Posted by username with colored avatar initial</li>
            </ul>
          </div>

          {/* Understanding Badge Logic */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-500 dark:border-blue-600 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-400 mb-2">🎯 Understanding Badge Logic</h3>
            <div className="space-y-3 text-sm">
              <div className="bg-white dark:bg-[#0f1419] p-3 rounded border-l-4 border-green-500">
                <div className="font-semibold text-green-600 dark:text-green-400 mb-1">🟢 Ready to Enter</div>
                <p className="text-xs text-gray-600 dark:text-[#8b949e]">All three conditions must be met:</p>
                <ul className="mt-1 ml-4 space-y-0.5 text-xs text-gray-600 dark:text-[#8b949e] list-disc">
                  <li>Technical signal is BUY or STRONG_BUY</li>
                  <li>Current price (LTP) is within 2% of entry price</li>
                  <li>Fundamental rating is AVERAGE or better</li>
                </ul>
              </div>
              <div className="bg-white dark:bg-[#0f1419] p-3 rounded border-l-4 border-orange-500">
                <div className="font-semibold text-orange-600 dark:text-orange-400 mb-1">🟠 You can Enter</div>
                <p className="text-xs text-gray-600 dark:text-[#8b949e]">Premium opportunity when:</p>
                <ul className="mt-1 ml-4 space-y-0.5 text-xs text-gray-600 dark:text-[#8b949e] list-disc">
                  <li>Current price (LTP) is below entry price (buying at discount!)</li>
                  <li>Fundamental rating is EXCELLENT</li>
                  <li>Technical signal can be any (fundamentals override technicals here)</li>
                </ul>
              </div>
              <div className="bg-white dark:bg-[#0f1419] p-3 rounded border-l-4 border-gray-500">
                <div className="font-semibold text-gray-600 dark:text-gray-400 mb-1">⚪ Waiting</div>
                <p className="text-xs text-gray-600 dark:text-[#8b949e]">
                  Shown when the above conditions are not met. Wait for better technical/fundamental alignment or price to reach optimal entry zone.
                </p>
              </div>
            </div>
          </div>

          {/* Pro Tips */}
          <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 rounded-lg p-4">
            <h3 className="font-semibold text-orange-900 dark:text-orange-400 mb-2">💡 Pro Tips for Reading Idea Cards</h3>
            <ul className="text-sm text-orange-800 dark:text-orange-300 space-y-1 ml-4 list-disc">
              <li>Look for &quot;Ready to Enter&quot; or &quot;You can Enter&quot; badges for immediate opportunities</li>
              <li>Check RSI - if &gt;70, wait for pullback; if &lt;30, good entry point</li>
              <li>Green arrows (↑) on all moving averages indicate strong uptrend</li>
              <li>EXCELLENT fundamentals with orange badge = rare opportunity to buy quality at discount</li>
              <li>Always click &quot;Analysis&quot; button to see detailed AI-powered recommendation before entering</li>
              <li>Target% shows potential gain - higher isn&apos;t always better, check risk-reward ratio</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
