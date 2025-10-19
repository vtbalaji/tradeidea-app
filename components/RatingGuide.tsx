import React, { useState } from 'react';

export default function RatingGuide() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-5 mb-5">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left group"
      >
        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Understanding Rating Signals
        </h3>
        <svg
          className={`w-5 h-5 text-gray-600 dark:text-[#8b949e] transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-4">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Technical Score */}
        <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <span className="text-lg">📈</span>
            Technical Score Rating
          </h4>
          <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-3">
            Based on 7 technical indicators including moving averages, RSI, MACD, volume spike, and golden cross.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between bg-green-500/10 rounded px-3 py-2 border-l-4 border-green-600">
              <span className="font-semibold text-green-600 dark:text-green-400">STRONG BUY</span>
              <span className="text-xs text-gray-600 dark:text-[#8b949e]">Score ≥ 5</span>
            </div>
            <div className="flex items-center justify-between bg-green-500/10 rounded px-3 py-2 border-l-4 border-green-500">
              <span className="font-semibold text-green-500 dark:text-green-400">BUY</span>
              <span className="text-xs text-gray-600 dark:text-[#8b949e]">Score ≥ 2</span>
            </div>
            <div className="flex items-center justify-between bg-gray-500/10 rounded px-3 py-2 border-l-4 border-gray-500">
              <span className="font-semibold text-gray-500 dark:text-[#8b949e]">NEUTRAL</span>
              <span className="text-xs text-gray-600 dark:text-[#8b949e]">Score -1 to 1</span>
            </div>
            <div className="flex items-center justify-between bg-red-500/10 rounded px-3 py-2 border-l-4 border-red-500">
              <span className="font-semibold text-red-500 dark:text-red-400">SELL</span>
              <span className="text-xs text-gray-600 dark:text-[#8b949e]">Score ≤ -2</span>
            </div>
            <div className="flex items-center justify-between bg-red-500/10 rounded px-3 py-2 border-l-4 border-red-600">
              <span className="font-semibold text-red-600 dark:text-red-400">STRONG SELL</span>
              <span className="text-xs text-gray-600 dark:text-[#8b949e]">Score ≤ -5</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-[#30363d]">
            <p className="text-xs text-gray-600 dark:text-[#8b949e]">
              <strong className="text-gray-900 dark:text-white">Key factors:</strong> Price vs SMA200 (±2), RSI levels (±2), MACD signal (+1), Golden Cross (+2), Volume spike (+1)
            </p>
          </div>
        </div>

        {/* Fundamental Score */}
        <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <span className="text-lg">💼</span>
            Fundamental Score Rating
          </h4>
          <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-3">
            Weighted scoring across 8 fundamental metrics (PE, ROE, Debt/Equity, Margins, Growth, etc.) normalized to 0-100.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between bg-green-500/10 rounded px-3 py-2 border-l-4 border-green-600">
              <span className="font-semibold text-green-600 dark:text-green-400">EXCELLENT</span>
              <span className="text-xs text-gray-600 dark:text-[#8b949e]">Score ≥ 80</span>
            </div>
            <div className="flex items-center justify-between bg-green-500/10 rounded px-3 py-2 border-l-4 border-green-500">
              <span className="font-semibold text-green-500 dark:text-green-400">GOOD</span>
              <span className="text-xs text-gray-600 dark:text-[#8b949e]">Score ≥ 60</span>
            </div>
            <div className="flex items-center justify-between bg-yellow-500/10 rounded px-3 py-2 border-l-4 border-yellow-500">
              <span className="font-semibold text-yellow-500 dark:text-yellow-400">AVERAGE</span>
              <span className="text-xs text-gray-600 dark:text-[#8b949e]">Score ≥ 40</span>
            </div>
            <div className="flex items-center justify-between bg-orange-500/10 rounded px-3 py-2 border-l-4 border-orange-500">
              <span className="font-semibold text-orange-500 dark:text-orange-400">POOR</span>
              <span className="text-xs text-gray-600 dark:text-[#8b949e]">Score ≥ 20</span>
            </div>
            <div className="flex items-center justify-between bg-red-500/10 rounded px-3 py-2 border-l-4 border-red-600">
              <span className="font-semibold text-red-600 dark:text-red-400">WEAK</span>
              <span className="text-xs text-gray-600 dark:text-[#8b949e]">Score &lt; 20</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-[#30363d]">
            <p className="text-xs text-gray-600 dark:text-[#8b949e]">
              <strong className="text-gray-900 dark:text-white">Key metrics:</strong> PE Ratio, ROE, Debt/Equity, Profit Margins, Earnings Growth, Revenue Growth, Current Ratio
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <span className="text-lg">💡</span>
          <div>
            <h5 className="font-semibold text-blue-900 dark:text-blue-400 mb-1 text-sm">How to Use These Ratings</h5>
            <p className="text-xs text-blue-800 dark:text-blue-300">
              These automated ratings help you quickly assess stocks. <strong>Technical ratings</strong> indicate short-term momentum and trend strength,
              while <strong>Fundamental ratings</strong> reflect long-term financial health and value. Use both together for comprehensive analysis.
              All scores are calculated daily using data from Yahoo Finance with our proprietary algorithms.
            </p>
          </div>
        </div>
      </div>
        </div>
      )}
    </div>
  );
}
