import React from 'react';

export default function ScoresCalculations() {
  return (
        <section id="scores-calculations" className="mb-12 scroll-mt-20">
          <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">🎯</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Understanding Scores & Ratings</h2>
            </div>
            <p className="text-gray-600 dark:text-[#8b949e] mb-6">
              Learn how we calculate technical scores, fundamental ratings, and investor suitability to help you make informed investment decisions.
            </p>

            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-400 mb-2">📊 All Scores Are Computed By Us</h3>
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  All scores and ratings you see in TradeIdea are calculated using our proprietary algorithms.
                  We fetch raw data from Yahoo Finance, but the scoring, rating, and suitability analysis are entirely our own calculations designed to help you make better investment decisions.
                </p>
              </div>

              {/* Technical Score */}
              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📈 Technical Score (Overall Signal)</h3>
                <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-3">
                  A points-based scoring system that evaluates 7 technical indicators to generate an overall buy/sell signal.
                </p>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-3 text-xs space-y-1 mb-3">
                  <div className="flex justify-between"><span className="text-gray-700 dark:text-[#c9d1d9]">Price ABOVE SMA200:</span><span className="text-green-500">+2 points</span></div>
                  <div className="flex justify-between"><span className="text-gray-700 dark:text-[#c9d1d9]">Price BELOW SMA200:</span><span className="text-red-500">-2 points</span></div>
                  <div className="flex justify-between"><span className="text-gray-700 dark:text-[#c9d1d9]">Price ABOVE EMA50:</span><span className="text-green-500">+1 point</span></div>
                  <div className="flex justify-between"><span className="text-gray-700 dark:text-[#c9d1d9]">RSI Oversold (&lt;30):</span><span className="text-green-500">+2 points</span></div>
                  <div className="flex justify-between"><span className="text-gray-700 dark:text-[#c9d1d9]">RSI Overbought (&gt;70):</span><span className="text-red-500">-2 points</span></div>
                  <div className="flex justify-between"><span className="text-gray-700 dark:text-[#c9d1d9]">MACD Bullish:</span><span className="text-green-500">+1 point</span></div>
                  <div className="flex justify-between"><span className="text-gray-700 dark:text-[#c9d1d9]">Golden Cross (SMA50 &gt; SMA200):</span><span className="text-green-500">+2 points</span></div>
                  <div className="flex justify-between"><span className="text-gray-700 dark:text-[#c9d1d9]">Volume Spike (&gt;2x avg):</span><span className="text-green-500">+1 point</span></div>
                </div>
                <div className="space-y-1 text-sm text-gray-700 dark:text-[#c9d1d9]">
                  <div><strong className="text-green-600 dark:text-green-400">Score ≥ 5:</strong> STRONG_BUY</div>
                  <div><strong className="text-green-500 dark:text-green-400">Score ≥ 2:</strong> BUY</div>
                  <div><strong className="text-gray-500 dark:text-[#8b949e]">Score -1 to 1:</strong> NEUTRAL</div>
                  <div><strong className="text-red-500 dark:text-red-400">Score ≤ -2:</strong> SELL</div>
                  <div><strong className="text-red-600 dark:text-red-400">Score ≤ -5:</strong> STRONG_SELL</div>
                </div>
              </div>

              {/* Fundamental Score */}
              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">💼 Fundamental Score (0-100)</h3>
                <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-3">
                  A weighted scoring system across 8 fundamental metrics, normalized to a 0-100 scale.
                </p>
                <div className="space-y-2 text-xs text-gray-700 dark:text-[#c9d1d9]">
                  <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2">
                    <strong className="text-gray-900 dark:text-white">PE Ratio (10 pts):</strong> 10-20 ideal (10 pts), 20-30 (7 pts), 5-10 (7 pts)
                  </div>
                  <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2">
                    <strong className="text-gray-900 dark:text-white">ROE (15 pts):</strong> ≥20% (15 pts), 15-20% (12 pts), 10-15% (8 pts)
                  </div>
                  <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2">
                    <strong className="text-gray-900 dark:text-white">Debt-to-Equity (10 pts):</strong> &lt;50 (10 pts), 50-100 (7 pts), &gt;200 (1 pt)
                  </div>
                  <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2">
                    <strong className="text-gray-900 dark:text-white">Profit Margins (10 pts):</strong> ≥15% (10 pts), 10-15% (7 pts)
                  </div>
                  <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2">
                    <strong className="text-gray-900 dark:text-white">Earnings Growth (15 pts):</strong> ≥20% (15 pts), 10-20% (12 pts)
                  </div>
                  <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2">
                    <strong className="text-gray-900 dark:text-white">Revenue Growth (10 pts):</strong> ≥15% (10 pts), 10-15% (7 pts)
                  </div>
                  <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2">
                    <strong className="text-gray-900 dark:text-white">Current Ratio (10 pts):</strong> ≥2 (10 pts), 1.5-2 (7 pts)
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-[#30363d] space-y-1 text-sm text-gray-700 dark:text-[#c9d1d9]">
                  <div><strong className="text-green-600 dark:text-green-400">≥80:</strong> EXCELLENT</div>
                  <div><strong className="text-green-500 dark:text-green-400">≥60:</strong> GOOD</div>
                  <div><strong className="text-yellow-500 dark:text-yellow-400">≥40:</strong> AVERAGE</div>
                  <div><strong className="text-orange-500 dark:text-orange-400">≥20:</strong> POOR</div>
                  <div><strong className="text-red-500 dark:text-red-400">&lt;20:</strong> WEAK</div>
                </div>
              </div>

              {/* Volume Spike Calculation */}
              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📊 Volume Spike Calculation</h3>
                <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-3">
                  Detects abnormal trading activity that often indicates institutional buying/selling or significant news events.
                </p>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-3 text-sm text-gray-700 dark:text-[#c9d1d9]">
                  <div className="mb-2"><strong className="text-gray-900 dark:text-white">Formula:</strong></div>
                  <code className="text-xs bg-white dark:bg-[#161b22] px-2 py-1 rounded border border-gray-200 dark:border-[#30363d] text-gray-800 dark:text-[#c9d1d9]">
                    Volume Spike = Today's Volume &gt; (20-Day Average Volume × 2)
                  </code>
                  <div className="mt-3 text-xs text-gray-600 dark:text-[#8b949e]">
                    <strong className="text-gray-900 dark:text-white">Example:</strong> If 20-day avg volume is 1M shares and today's volume is 2.5M shares, that's a volume spike!
                  </div>
                </div>
              </div>

              {/* Investor Type Suitability */}
              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">👥 Investor Type Suitability</h3>
                <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-3">
                  Our rule engine evaluates whether a stock matches 5 different investor profiles based on their specific criteria.
                </p>
                <div className="space-y-2 text-xs text-gray-700 dark:text-[#c9d1d9]">
                  <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 flex items-center gap-2">
                    <span className="text-lg">💎</span>
                    <div>
                      <strong className="text-gray-900 dark:text-white">Value Investor:</strong> Undervalued stocks (PE &lt; 20, P/B &lt; 3, ROE &gt; 15%)
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 flex items-center gap-2">
                    <span className="text-lg">📈</span>
                    <div>
                      <strong className="text-gray-900 dark:text-white">Growth Investor:</strong> High growth (Earnings growth &gt; 15%, Revenue growth &gt; 10%)
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 flex items-center gap-2">
                    <span className="text-lg">🚀</span>
                    <div>
                      <strong className="text-gray-900 dark:text-white">Momentum Trader:</strong> Strong technicals (RSI 50-70, MACD bullish, volume spike)
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 flex items-center gap-2">
                    <span className="text-lg">⭐</span>
                    <div>
                      <strong className="text-gray-900 dark:text-white">Quality Investor:</strong> High quality (ROE &gt; 18%, Low debt, Profit margin &gt; 12%)
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 flex items-center gap-2">
                    <span className="text-lg">💰</span>
                    <div>
                      <strong className="text-gray-900 dark:text-white">Dividend Investor:</strong> Income focus (Dividend yield &gt; 2%, Payout &lt; 60%)
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-600 dark:text-[#8b949e]">
                  <strong className="text-gray-900 dark:text-white">Click "Analyze" button</strong> on any idea card to see which investor types the stock suits!
                </div>
              </div>

              <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 rounded-lg p-4">
                <h3 className="font-semibold text-orange-900 dark:text-orange-400 mb-2">💡 Important Notes</h3>
                <ul className="text-sm text-orange-800 dark:text-orange-300 space-y-1 ml-4 list-disc">
                  <li>All raw data comes from Yahoo Finance, but scoring is our proprietary calculation</li>
                  <li>PEG Ratio is disabled because Yahoo's calculation is unreliable for Indian stocks</li>
                  <li>Scores are recalculated daily through automated batch jobs</li>
                  <li>These are decision support tools - always do your own research!</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
  );
}
