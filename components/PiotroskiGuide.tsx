import React from 'react';

export default function PiotroskiGuide() {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800/30 rounded-xl p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">📊</span>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            Understanding Financial Strength vs Fundamental Score
          </h3>
          <p className="text-sm text-gray-600 dark:text-[#8b949e]">
            Two different metrics that measure different aspects of a company
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Financial Strength (Piotroski F-Score) */}
        <div className="bg-white dark:bg-[#0f1419] border border-blue-200 dark:border-blue-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🏥</span>
            <h4 className="font-bold text-gray-900 dark:text-white">Financial Strength (0-9)</h4>
          </div>

          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300 mb-3">
            <p><strong>What it measures:</strong> Financial health based on actual financial statements</p>
            <p><strong>Data source:</strong> Balance sheet, income statement, cash flow statements</p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 font-bold">7-9:</span>
              <span className="text-gray-700 dark:text-gray-300">Strong financial health (profitable, improving, low debt)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-yellow-600 dark:text-yellow-500 font-bold">4-6:</span>
              <span className="text-gray-700 dark:text-gray-300">Average financial health (mixed signals)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-600 dark:text-red-500 font-bold">0-3:</span>
              <span className="text-gray-700 dark:text-gray-300">Weak financial health (declining cash flow, increasing debt)</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-[#8b949e] italic">
              Based on Piotroski F-Score: 9 criteria covering profitability (4), leverage (3), operating efficiency (2)
            </p>
          </div>
        </div>

        {/* Fundamental Score */}
        <div className="bg-white dark:bg-[#0f1419] border border-blue-200 dark:border-blue-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">💎</span>
            <h4 className="font-bold text-gray-900 dark:text-white">Fundamental Score (0-100)</h4>
          </div>

          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300 mb-3">
            <p><strong>What it measures:</strong> Investment attractiveness based on market ratios</p>
            <p><strong>Data source:</strong> Market data, P/E ratio, ROE, growth rates, margins</p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 font-bold">80-100:</span>
              <span className="text-gray-700 dark:text-gray-300">Excellent - Great valuation and growth metrics</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 dark:text-green-500 font-bold">60-79:</span>
              <span className="text-gray-700 dark:text-gray-300">Good - Solid ratios and performance</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-yellow-600 dark:text-yellow-500 font-bold">40-59:</span>
              <span className="text-gray-700 dark:text-gray-300">Average - Mixed metrics</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-orange-600 dark:text-orange-500 font-bold">20-39:</span>
              <span className="text-gray-700 dark:text-gray-300">Poor - Weak ratios</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-[#8b949e] italic">
              Considers P/E, ROE, debt ratios, growth rates, margins, current ratio
            </p>
          </div>
        </div>
      </div>

      {/* Why They Can Differ */}
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-lg p-4">
        <div className="flex items-start gap-2 mb-3">
          <span className="text-lg">⚠️</span>
          <h4 className="font-bold text-amber-900 dark:text-amber-400">Why These Scores Can Differ</h4>
        </div>

        <div className="space-y-3 text-sm text-amber-900 dark:text-amber-200">
          <div className="flex items-start gap-2">
            <span className="font-bold min-w-[180px]">Strong (6/9) + Good Fundamental:</span>
            <span>✅ Ideal - Strong financial health AND attractive valuation</span>
          </div>

          <div className="flex items-start gap-2">
            <span className="font-bold min-w-[180px]">Weak (3/9) + Good Fundamental:</span>
            <span>⚠️ Warning - Looks good on ratios but has underlying financial issues (declining cash flow, increasing debt, deteriorating margins)</span>
          </div>

          <div className="flex items-start gap-2">
            <span className="font-bold min-w-[180px]">Strong (6/9) + Weak Fundamental:</span>
            <span>🤔 Mixed - Financially healthy but expensive valuation or slow growth</span>
          </div>

          <div className="flex items-start gap-2">
            <span className="font-bold min-w-[180px]">Weak (3/9) + Weak Fundamental:</span>
            <span>🚫 Avoid - Poor financial health AND unattractive metrics</span>
          </div>
        </div>
      </div>

      {/* Key Takeaway */}
      <div className="mt-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <span className="text-lg">💡</span>
          <div>
            <h4 className="font-bold text-blue-900 dark:text-blue-400 mb-2">Key Takeaway</h4>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Use both scores together!</strong> A company with GOOD Fundamental Score but Weak Financial Strength (3/9) is revealing important information -
              it may look attractive on market ratios but has deeper financial statement problems. Always check both before investing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
