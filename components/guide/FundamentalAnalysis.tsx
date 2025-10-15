import React from 'react';

export default function FundamentalAnalysis() {
  return (
        <section id="fundamental-analysis" className="mb-12 scroll-mt-20">
          <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">💼</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Fundamental Analysis</h2>
            </div>
            <p className="text-gray-600 dark:text-[#8b949e] mb-6">
              Access key financial metrics to make informed investment decisions.
            </p>

            <div className="space-y-4">
              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Valuation Metrics</h3>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li><strong>P/E Ratio</strong> - Price to Earnings (valuation indicator)</li>
                  <li><strong>Market Cap</strong> - Company size classification</li>
                  <li><strong>P/B Ratio</strong> - Price to Book value</li>
                  <li><strong>Dividend Yield</strong> - Annual dividend percentage for long-term returns</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Profitability Metrics</h3>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li><strong>ROE</strong> - Return on Equity (efficiency indicator)</li>
                  <li><strong>ROA</strong> - Return on Assets</li>
                  <li><strong>Profit Margin</strong> - Net profit percentage</li>
                  <li><strong>Revenue Growth</strong> - Year-over-year growth rate</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Financial Health</h3>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li><strong>Debt to Equity</strong> - Leverage ratio</li>
                  <li><strong>Current Ratio</strong> - Short-term liquidity</li>
                  <li><strong>EPS</strong> - Earnings Per Share</li>
                  <li><strong>Book Value</strong> - Net asset value per share</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">How to Access</h3>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li>Click on any position in your portfolio</li>
                  <li>Navigate to the <strong>Fundamentals</strong> tab</li>
                  <li>View comprehensive financial data</li>
                  <li>Compare with industry averages</li>
                </ul>
              </div>

              <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 rounded-lg p-4">
                <h3 className="font-semibold text-orange-900 dark:text-orange-400 mb-2">⏰ Important Note</h3>
                <p className="text-sm text-orange-800 dark:text-orange-300">
                  Fundamental data is fetched daily through our automated batch job. When you first add a position,
                  the fundamental metrics will be available within 24 hours (typically updated every evening).
                  This ensures you always have the most recent quarterly/annual financial data.
                </p>
              </div>
            </div>
          </div>
        </section>
  );
}
