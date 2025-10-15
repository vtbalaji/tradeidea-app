import React from 'react';

export default function TechnicalAnalysis() {
  return (
        <section id="technical-analysis" className="mb-12 scroll-mt-20">
          <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">📊</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Technical Analysis</h2>
            </div>
            <p className="text-gray-600 dark:text-[#8b949e] mb-6">
              Automated real-time technical indicators for every stock in your portfolio.
            </p>

            <div className="space-y-4">
              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Moving Averages & EMAs</h3>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li><strong>50 EMA</strong> - Short-term trend indicator</li>
                  <li><strong>100 MA</strong> - Medium-term support/resistance</li>
                  <li><strong>200 MA</strong> - Long-term trend (bull/bear market indicator)</li>
                  <li><strong>Golden Cross</strong> - 50 EMA crosses above 200 MA (bullish)</li>
                  <li><strong>Death Cross</strong> - 50 EMA crosses below 200 MA (bearish)</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Momentum Indicators</h3>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li><strong>RSI (Relative Strength Index)</strong> - Overbought (&gt;70) / Oversold (&lt;30)</li>
                  <li><strong>MACD</strong> - Trend following momentum with signal line</li>
                  <li><strong>Bollinger Bands</strong> - Volatility and price range analysis</li>
                  <li><strong>Supertrend</strong> - Daily trend with buy/sell signals</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">How to View</h3>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li>All indicators are automatically calculated daily via batch job</li>
                  <li>View on portfolio page in the technical column</li>
                  <li>Click position details for full technical analysis</li>
                  <li>Color-coded signals (green = bullish, red = bearish)</li>
                </ul>
              </div>

              <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 rounded-lg p-4">
                <h3 className="font-semibold text-orange-900 dark:text-orange-400 mb-2">⏰ Important Note</h3>
                <p className="text-sm text-orange-800 dark:text-orange-300 mb-2">
                  Technical analysis data is updated daily through our automated batch job. When you first add a position,
                  the technical indicators will be calculated and appear within 24 hours (typically updated every evening).
                </p>
                <p className="text-xs text-orange-700 dark:text-orange-400 font-semibold mt-2">
                  🎯 No manual calculations needed - we do all the complex technical analysis for you automatically!
                </p>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📋 Exit/Accumulate Recommendations</h3>
                <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-3">
                  Our system automatically generates Exit or Accumulate recommendations based on your configured exit criteria:
                </p>
                <div className="space-y-2 text-sm">
                  <div className="bg-gray-50 dark:bg-[#0f1419] p-3 rounded border-l-4 border-red-500">
                    <div className="font-semibold text-red-600 dark:text-red-400 mb-1">🔴 EXIT Recommendation</div>
                    <p className="text-gray-600 dark:text-[#8b949e] text-xs">
                      Triggered when ANY of your enabled exit criteria are met:
                    </p>
                    <ul className="mt-2 ml-4 space-y-1 text-xs text-gray-600 dark:text-[#8b949e] list-disc">
                      <li>Price hits or goes below stop-loss level</li>
                      <li>Target price is reached or exceeded</li>
                      <li>Price closes below 50 EMA (if enabled)</li>
                      <li>Price closes below 100 MA (if enabled)</li>
                      <li>Price closes below 200 MA (if enabled)</li>
                      <li>Daily Supertrend turns bearish/red (if enabled)</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#0f1419] p-3 rounded border-l-4 border-green-500">
                    <div className="font-semibold text-green-600 dark:text-green-400 mb-1">🟢 ACCUMULATE Recommendation</div>
                    <p className="text-gray-600 dark:text-[#8b949e] text-xs">
                      Suggested when ALL of the following conditions are met:
                    </p>
                    <ul className="mt-2 ml-4 space-y-1 text-xs text-gray-600 dark:text-[#8b949e] list-disc">
                      <li>Price is above stop-loss (not in danger zone)</li>
                      <li>Price is below target (room to grow)</li>
                      <li>Price is above 50 EMA (short-term bullish)</li>
                      <li>Price is above 200 MA (long-term bullish)</li>
                      <li>Daily Supertrend is bullish/green (daily momentum)</li>
                      <li>Golden Cross present (50 EMA above 200 MA)</li>
                    </ul>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-500/10 p-3 rounded border-l-4 border-blue-500">
                    <div className="font-semibold text-blue-600 dark:text-blue-400 mb-1">💡 Pro Tip</div>
                    <p className="text-gray-600 dark:text-[#8b949e] text-xs">
                      These are automated suggestions based on technical signals. Always consider fundamental analysis,
                      market conditions, and your own research before making investment decisions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
  );
}
