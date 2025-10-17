import React from 'react';

export default function InvestorTypeGuide() {
  return (
    <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-5">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        Understanding Investor Type Analysis
      </h3>

      <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-5">
        Our system evaluates stocks against 5 different investor profiles. Each profile has specific criteria that define their investment strategy.
        A stock is marked as "Suitable" when it meets ALL required conditions for that investor type.
      </p>

      <div className="space-y-5">
        {/* Value Investor */}
        <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">💎</span>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white">Value Investor</h4>
              <p className="text-xs text-gray-600 dark:text-[#8b949e]">Long-term (2-5 years) • Medium Risk</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-4">
            Focuses on undervalued stocks with strong fundamentals trading below their intrinsic value
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <h5 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">Valuation Metrics</h5>
              <div className="space-y-1.5 text-xs">
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-blue-500">
                  <strong>Price/Book:</strong> &lt; 5.0
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-blue-500">
                  <strong>Price/Sales:</strong> &lt; 5.0
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-blue-500">
                  <strong>Forward PE:</strong> &lt; 20.0
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-blue-500">
                  <strong>Trailing PE:</strong> &lt; 25.0
                </div>
              </div>
            </div>
            <div>
              <h5 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">Quality & Technical</h5>
              <div className="space-y-1.5 text-xs">
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-green-500">
                  <strong>Fundamental Score:</strong> ≥ 60
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-green-500">
                  <strong>Profit Margins:</strong> ≥ 15%
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-green-500">
                  <strong>Operating Margins:</strong> ≥ 20%
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-green-500">
                  <strong>Debt/Equity:</strong> &lt; 1.0
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-purple-500">
                  <strong>Price vs SMA200:</strong> &lt; 110%
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-purple-500">
                  <strong>Technical Confirmation:</strong> 2 of 3 (Above SMA200, RSI 30-60, Below Bollinger Upper)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Growth Investor */}
        <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">📈</span>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white">Growth Investor</h4>
              <p className="text-xs text-gray-600 dark:text-[#8b949e]">Medium-term (6 months - 2 years) • High Risk</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-4">
            Seeks companies with high growth potential and expanding revenues
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <h5 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">Growth Score (3 of 4 required)</h5>
              <div className="space-y-1.5 text-xs">
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-green-500">
                  <strong>Earnings Growth:</strong> ≥ 15%
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-green-500">
                  <strong>Quarterly Earnings Growth:</strong> ≥ 12%
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-green-500">
                  <strong>Revenue Growth:</strong> ≥ 8%
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-green-500">
                  <strong>Price Change:</strong> &gt; 0% (positive)
                </div>
              </div>
            </div>
            <div>
              <h5 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">Momentum Score (4 of 6 required)</h5>
              <div className="space-y-1.5 text-xs">
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-purple-500">
                  <strong>Golden Cross:</strong> Present
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-purple-500">
                  <strong>MACD:</strong> Bullish
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-purple-500">
                  <strong>MACD Histogram:</strong> &gt; Signal
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-purple-500">
                  <strong>RSI:</strong> 50-70
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-purple-500">
                  <strong>Price Above EMA50:</strong> Yes
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-purple-500">
                  <strong>Supertrend:</strong> Bullish
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-[#30363d] space-y-1.5 text-xs">
            <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2">
              <strong>Additional:</strong> PEG Ratio &lt; 2.0 (or null), Price Above SMA200, Volume ≥ 50% of avg, Overall Signal: BUY/STRONG_BUY
            </div>
          </div>
        </div>

        {/* Momentum Trader */}
        <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🚀</span>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white">Momentum Trader</h4>
              <p className="text-xs text-gray-600 dark:text-[#8b949e]">Short-term (days - 2 months) • Very High Risk</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-4">
            Capitalizes on stocks with strong technical momentum and positive short-term trends
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <h5 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">Momentum Signals (5 of 7 required)</h5>
              <div className="space-y-1.5 text-xs">
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-purple-500">
                  <strong>Golden Cross:</strong> Present
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-purple-500">
                  <strong>MACD:</strong> Bullish
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-purple-500">
                  <strong>MACD Histogram:</strong> &gt; Signal
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-purple-500">
                  <strong>RSI:</strong> 50-70 (optimal)
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-purple-500">
                  <strong>Supertrend:</strong> Bullish
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-purple-500">
                  <strong>EMA50 Above SMA200:</strong> Yes
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-purple-500">
                  <strong>Price Above EMA9:</strong> Yes
                </div>
              </div>
            </div>
            <div>
              <h5 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">Additional Conditions</h5>
              <div className="space-y-1.5 text-xs">
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-blue-500">
                  <strong>Price Above SMA20:</strong> Yes
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-blue-500">
                  <strong>Price Above SMA50:</strong> Yes
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-blue-500">
                  <strong>RSI Not Overbought:</strong> &lt; 70
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-blue-500">
                  <strong>Within Bollinger Bands:</strong> Yes
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-blue-500">
                  <strong>Volume Confirmation:</strong> Spike OR ≥ 80% avg
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-blue-500">
                  <strong>Price Above Supertrend:</strong> Yes
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quality Investor */}
        <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">⭐</span>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white">Quality Investor</h4>
              <p className="text-xs text-gray-600 dark:text-[#8b949e]">Long-term (3-10 years) • Low-Medium Risk</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-4">
            Invests in financially strong companies with solid fundamentals and competitive advantages
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <h5 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">Quality Score (5 of 7 required)</h5>
              <div className="space-y-1.5 text-xs">
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-yellow-500">
                  <strong>Operating Margins:</strong> ≥ 25%
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-yellow-500">
                  <strong>Profit Margins:</strong> ≥ 20%
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-yellow-500">
                  <strong>Fundamental Rating:</strong> GOOD or EXCELLENT
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-yellow-500">
                  <strong>Fundamental Score:</strong> ≥ 65
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-yellow-500">
                  <strong>Debt/Equity:</strong> &lt; 1.5
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-yellow-500">
                  <strong>Earnings Growth:</strong> ≥ 10%
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-yellow-500">
                  <strong>Dividend Yield:</strong> &gt; 0%
                </div>
              </div>
            </div>
            <div>
              <h5 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">Additional & Technical (3 of 5)</h5>
              <div className="space-y-1.5 text-xs">
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-blue-500">
                  <strong>Beta:</strong> &lt; 1.0 (lower volatility)
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-blue-500">
                  <strong>Earnings Growth:</strong> ≥ 8%
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-blue-500">
                  <strong>Quarterly Growth:</strong> ≥ 10%
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-blue-500">
                  <strong>Forward PE:</strong> &lt; 50
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-blue-500">
                  <strong>Price/Book:</strong> &lt; 10
                </div>
              </div>
              <div className="mt-2 space-y-1.5 text-xs">
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-purple-500">
                  <strong>Technical Confirmation (3 of 5):</strong> Above SMA200, MACD Bullish, RSI 45-65, Supertrend Bullish, Overall Signal BUY/STRONG_BUY
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dividend Investor */}
        <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">💰</span>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white">Dividend Investor</h4>
              <p className="text-xs text-gray-600 dark:text-[#8b949e]">Very Long-term (5+ years) • Low Risk</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-4">
            Focuses on stable income through regular dividend payments from financially secure companies
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <h5 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">Dividend & Stability</h5>
              <div className="space-y-1.5 text-xs">
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-orange-500">
                  <strong>Dividend Yield:</strong> ≥ 2.5%
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-orange-500">
                  <strong>Payout Ratio:</strong> &gt; 0% and ≤ 70% (sustainable)
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-orange-500">
                  <strong>Earnings Growth:</strong> ≥ 0% (positive)
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-orange-500">
                  <strong>Forward PE:</strong> &lt; 25
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-orange-500">
                  <strong>Price/Book:</strong> &lt; 5
                </div>
              </div>
            </div>
            <div>
              <h5 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">Stability Score (4 of 5 required)</h5>
              <div className="space-y-1.5 text-xs">
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-green-500">
                  <strong>Debt/Equity:</strong> &lt; 1.2
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-green-500">
                  <strong>Beta:</strong> &lt; 0.8 (low volatility)
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-green-500">
                  <strong>Profit Margins:</strong> ≥ 10%
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-green-500">
                  <strong>Fundamental Score:</strong> ≥ 60
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-green-500">
                  <strong>Current Ratio:</strong> ≥ 1.5
                </div>
              </div>
              <div className="mt-2 space-y-1.5 text-xs">
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 border-l-2 border-purple-500">
                  <strong>Technical Confirmation (2 of 3):</strong> Above SMA200, RSI 35-65, MACD Bullish
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How to Read and Important Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
        <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <span className="text-lg">📖</span>
            <div>
              <h5 className="font-semibold text-blue-900 dark:text-blue-400 mb-2 text-sm">How to Read the Analysis</h5>
              <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1.5 ml-4 list-disc">
                <li><strong>Suitable:</strong> Stock meets ALL required criteria for that investor type</li>
                <li><strong>Not Suitable:</strong> Stock fails to meet one or more required conditions</li>
                <li><strong>Score:</strong> Shows number of conditions met vs total conditions (e.g., "6/7 conditions met")</li>
                <li><strong>Sub-scores:</strong> Quality Score, Momentum Score, Growth Score show how many sub-criteria are met</li>
                <li><strong>Details:</strong> Lists specific criteria that passed (✓) or failed (✗)</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <span className="text-lg">⚠️</span>
            <div>
              <h5 className="font-semibold text-orange-900 dark:text-orange-400 mb-2 text-sm">Important Notes</h5>
              <ul className="text-xs text-orange-800 dark:text-orange-300 space-y-1.5 ml-4 list-disc">
                <li>All analysis is based on latest available data from Yahoo Finance</li>
                <li>A stock can be suitable for multiple investor types simultaneously</li>
                <li>Scores in parentheses (e.g., "5 of 7") indicate sub-criteria within a condition</li>
                <li>These are automated suggestions - always conduct your own research</li>
                <li>Market conditions and company fundamentals can change rapidly</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
