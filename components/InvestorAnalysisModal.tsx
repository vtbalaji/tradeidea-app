'use client';

import React from 'react';
import { InvestorType, InvestorRecommendation, EntryAnalysis } from '@/lib/investment-rules';
import { TrendArrow } from '@/components/icons';
import TechnicalLevelsCard from '@/components/TechnicalLevelsCard';
import FundamentalsCard from '@/components/FundamentalsCard';

interface InvestorAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  recommendation: InvestorRecommendation | null;
  technicals?: any;
  fundamentals?: any;
}

const investorTypeInfo: Record<InvestorType, { name: string; icon: string; description: string; horizon: string }> = {
  value: {
    name: 'Value Investor',
    icon: '💎',
    description: 'Focus on undervalued stocks with strong fundamentals',
    horizon: 'Long-term (2-5 years)'
  },
  growth: {
    name: 'Growth Investor',
    icon: '📈',
    description: 'Target high-growth companies with strong momentum',
    horizon: 'Medium-term (6 months - 2 years)'
  },
  momentum: {
    name: 'Momentum Trader/Swing Trader',
    icon: '🚀',
    description: 'Ride short-term trends with strong technical signals',
    horizon: 'Short-term (days - 2 months)'
  },
  quality: {
    name: 'Quality Investor',
    icon: '⭐',
    description: 'Invest in high-quality businesses with strong moats',
    horizon: 'Long-term (3-10 years)'
  },
  dividend: {
    name: 'Dividend Investor',
    icon: '💰',
    description: 'Generate income through stable dividend-paying stocks',
    horizon: 'Very Long-term (5+ years)'
  }
};

export default function InvestorAnalysisModal({
  isOpen,
  onClose,
  symbol,
  recommendation,
  technicals,
  fundamentals
}: InvestorAnalysisModalProps) {
  if (!isOpen || !recommendation) return null;

  const [showDetails, setShowDetails] = React.useState(false);

  // Format camelCase to readable text while preserving acronyms
  const formatConditionName = (str: string): string => {
    return str
      // Handle common acronyms first
      .replace(/EMA/g, 'EMA ')
      .replace(/SMA/g, 'SMA ')
      .replace(/RSI/g, 'RSI ')
      .replace(/MACD/g, 'MACD ')
      .replace(/ROE/g, 'ROE ')
      .replace(/PE/g, 'PE ')
      // Then add spaces before remaining capital letters
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .trim();
  };

  const renderAnalysisCard = (type: InvestorType, analysis: EntryAnalysis) => {
    const info = investorTypeInfo[type];
    const isSuitable = analysis.canEnter;
    const completionPercent = (analysis.met / analysis.total) * 100;

    return (
      <div
        key={type}
        className={`border rounded-xl p-4 ${
          isSuitable
            ? 'bg-green-500/10 border-green-500/30'
            : 'bg-gray-50 dark:bg-[#1c2128] border-gray-200 dark:border-[#30363d]'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{info.icon}</span>
            <div>
              <h3 className={`text-sm font-bold ${isSuitable ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                {info.name}
              </h3>
              <p className="text-xs text-gray-600 dark:text-[#8b949e]">{info.horizon}</p>
            </div>
          </div>
          {isSuitable && (
            <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded">
              ✓ SUITABLE
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-3">{info.description}</p>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-600 dark:text-[#8b949e]">Criteria Met</span>
            <span className={`font-semibold ${isSuitable ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
              {analysis.met} / {analysis.total}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-[#30363d] rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                isSuitable ? 'bg-green-500' : 'bg-gray-400 dark:bg-[#8b949e]'
              }`}
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>

        {/* Failed Conditions (if not suitable) */}
        {!isSuitable && analysis.failedConditions.length > 0 && (
          <details className="text-xs">
            <summary className="cursor-pointer text-red-500 font-semibold mb-2">
              Failed Criteria ({analysis.failedConditions.length})
            </summary>
            <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-[#8b949e] pl-2">
              {analysis.failedConditions.slice(0, 5).map((condition, idx) => (
                <li key={idx}>{formatConditionName(condition)}</li>
              ))}
              {analysis.failedConditions.length > 5 && (
                <li className="text-orange-500">... and {analysis.failedConditions.length - 5} more</li>
              )}
            </ul>
          </details>
        )}

        {/* Scores (if available) */}
        {analysis.scores && Object.keys(analysis.scores).length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-[#30363d]">
            <p className="text-xs font-semibold text-gray-900 dark:text-white mb-2">Scores:</p>
            <div className="flex gap-3">
              {Object.entries(analysis.scores).map(([key, value]) => (
                <div key={key} className="text-xs">
                  <span className="text-gray-600 dark:text-[#8b949e]">
                    {formatConditionName(key)}:
                  </span>
                  <span className="ml-1 font-semibold text-gray-900 dark:text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className={`bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl w-full ${showDetails ? 'max-w-7xl' : 'max-w-4xl'} max-h-[90vh] overflow-hidden flex`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-[#1c2128] border-b border-gray-200 dark:border-[#30363d] p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Investor Type Analysis
            </h2>
            <p className="text-sm text-gray-600 dark:text-[#8b949e]">
              <span className="font-bold text-[#ff8c42]">{symbol}</span>
              {technicals?.lastPrice && (
                <span className="text-gray-600 dark:text-[#8b949e]"> (LTP: ₹{technicals.lastPrice.toFixed(2)})</span>
              )}
              {' '}- Which investor types is this suitable for?
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-[#8b949e] hover:text-gray-900 dark:hover:text-white transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Summary */}
          {recommendation.suitableFor.length > 0 ? (
            <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2">
                ✓ Suitable for {recommendation.suitableFor.length} investor type(s):
              </p>
              <div className="flex flex-wrap gap-2">
                {recommendation.suitableFor.map((type) => (
                  <span
                    key={type}
                    className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full"
                  >
                    {investorTypeInfo[type].icon} {investorTypeInfo[type].name}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                ✗ Not currently suitable for any investor type
              </p>
              <p className="text-xs text-gray-600 dark:text-[#8b949e] mt-1">
                Review the criteria below to see what conditions are not met
              </p>
            </div>
          )}

          {/* Detailed Analysis Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(recommendation.details).map(([type, analysis]) =>
              renderAnalysisCard(type as InvestorType, analysis)
            )}
          </div>

          {/* Technical Levels & Fundamentals Summary - Mobile Friendly */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Technical Levels Summary */}
            {technicals && (
              <div className="bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Technical Levels</h4>
                  <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                    recommendation.suitableFor.includes('momentum' as InvestorType)
                      ? 'bg-green-500 text-white'
                      : recommendation.suitableFor.length > 0
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-500 text-white'
                  }`}>
                    {recommendation.suitableFor.includes('momentum' as InvestorType)
                      ? 'STRONG BUY'
                      : recommendation.suitableFor.length > 0
                        ? 'BUY'
                        : 'NEUTRAL'
                    }
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {/* 50 EMA */}
                  {technicals.ema50 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-[#8b949e]">50 EMA:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-900 dark:text-white font-semibold">
                          ₹{technicals.ema50.toFixed(2)}
                        </span>
                        {technicals.lastPrice && (
                          <TrendArrow isUp={technicals.lastPrice > technicals.ema50} />
                        )}
                      </div>
                    </div>
                  )}

                  {/* 100 MA */}
                  {technicals.sma100 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-[#8b949e]">100 MA:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-900 dark:text-white font-semibold">
                          ₹{technicals.sma100.toFixed(2)}
                        </span>
                        {technicals.lastPrice && (
                          <TrendArrow isUp={technicals.lastPrice > technicals.sma100} />
                        )}
                      </div>
                    </div>
                  )}

                  {/* 200 MA */}
                  {technicals.sma200 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-[#8b949e]">200 MA:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-900 dark:text-white font-semibold">
                          ₹{technicals.sma200.toFixed(2)}
                        </span>
                        {technicals.lastPrice && (
                          <TrendArrow isUp={technicals.lastPrice > technicals.sma200} />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Supertrend */}
                  {technicals.supertrend && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-[#8b949e]">Supertrend:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-900 dark:text-white font-semibold">
                          ₹{technicals.supertrend.toFixed(2)}
                        </span>
                        {technicals.lastPrice && (
                          <TrendArrow isUp={technicals.lastPrice > technicals.supertrend} />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Fundamentals Summary */}
            {fundamentals && (
              <div className="bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Fundamentals</h4>
                  <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                    recommendation.suitableFor.includes('value' as InvestorType) || recommendation.suitableFor.includes('quality' as InvestorType)
                      ? 'bg-yellow-500 text-white'
                      : 'bg-gray-500 text-white'
                  }`}>
                    {recommendation.suitableFor.includes('value' as InvestorType) || recommendation.suitableFor.includes('quality' as InvestorType)
                      ? 'AVERAGE'
                      : 'BELOW AVG'
                    }
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {/* PE Ratio */}
                  {fundamentals.pe && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-[#8b949e]">PE:</span>
                      <span className="text-gray-900 dark:text-white font-semibold">
                        {fundamentals.pe.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Debt to Equity */}
                  {fundamentals.debtToEquity != null && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-[#8b949e]">Debt-to-Equity:</span>
                      <span className="text-gray-900 dark:text-white font-semibold">
                        {fundamentals.debtToEquity.toFixed(1)}
                      </span>
                    </div>
                  )}

                  {/* Earnings Growth */}
                  {fundamentals.earningsGrowth != null && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-[#8b949e]">Earnings Growth:</span>
                      <span className={`font-semibold ${
                        fundamentals.earningsGrowth > 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {fundamentals.earningsGrowth > 0 ? '+' : ''}{fundamentals.earningsGrowth.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Note */}
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-xs text-blue-600 dark:text-blue-400">
              <strong>Note:</strong> This analysis is based on technical and fundamental data.
              Always do your own research and consider your personal risk tolerance before investing.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-[#1c2128] border-t border-gray-200 dark:border-[#30363d] p-4 space-y-2">
          {/* Show Details Button - Desktop Only */}
          {(technicals || fundamentals) && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="hidden md:flex w-full items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-[#30363d] hover:bg-gray-200 dark:hover:bg-[#3c444d] border border-gray-200 dark:border-[#444c56] text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-colors"
            >
              {showDetails ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Hide Details</span>
                </>
              ) : (
                <>
                  <span>Show Details</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-[#30363d] hover:bg-gray-200 dark:hover:bg-[#3c444d] border border-gray-200 dark:border-[#444c56] text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Close</span>
          </button>
        </div>
        </div>

        {/* Details Panel - Desktop Only */}
        {showDetails && (technicals || fundamentals) && (
          <div className="hidden md:block w-96 border-l border-gray-200 dark:border-[#30363d] overflow-y-auto bg-gray-50 dark:bg-[#0f1419]">
            <div className="p-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Raw Data
              </h3>

              {/* Technical Levels Summary */}
              {technicals && (
                <div className="mb-6 bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Technical Levels</h4>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                      recommendation.suitableFor.includes('momentum' as InvestorType)
                        ? 'bg-green-500 text-white'
                        : recommendation.suitableFor.length > 0
                          ? 'bg-yellow-500 text-white'
                          : 'bg-gray-500 text-white'
                    }`}>
                      {recommendation.suitableFor.includes('momentum' as InvestorType)
                        ? 'STRONG BUY'
                        : recommendation.suitableFor.length > 0
                          ? 'BUY'
                          : 'NEUTRAL'
                      }
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {/* 50 EMA */}
                    {technicals.ema50 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-[#8b949e]">50 EMA:</span>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-900 dark:text-white font-semibold">
                            ₹{technicals.ema50.toFixed(2)}
                          </span>
                          {technicals.lastPrice && (
                            <TrendArrow isUp={technicals.lastPrice > technicals.ema50} />
                          )}
                        </div>
                      </div>
                    )}

                    {/* 100 MA */}
                    {technicals.sma100 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-[#8b949e]">100 MA:</span>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-900 dark:text-white font-semibold">
                            ₹{technicals.sma100.toFixed(2)}
                          </span>
                          {technicals.lastPrice && (
                            <TrendArrow isUp={technicals.lastPrice > technicals.sma100} />
                          )}
                        </div>
                      </div>
                    )}

                    {/* 200 MA */}
                    {technicals.sma200 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-[#8b949e]">200 MA:</span>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-900 dark:text-white font-semibold">
                            ₹{technicals.sma200.toFixed(2)}
                          </span>
                          {technicals.lastPrice && (
                            <TrendArrow isUp={technicals.lastPrice > technicals.sma200} />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Supertrend */}
                    {technicals.supertrend && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-[#8b949e]">Supertrend:</span>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-900 dark:text-white font-semibold">
                            ₹{technicals.supertrend.toFixed(2)}
                          </span>
                          {technicals.lastPrice && (
                            <TrendArrow isUp={technicals.lastPrice > technicals.supertrend} />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Fundamentals Summary */}
              {fundamentals && (
                <div className="mb-6 bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Fundamentals</h4>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                      recommendation.suitableFor.includes('value' as InvestorType) || recommendation.suitableFor.includes('quality' as InvestorType)
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-500 text-white'
                    }`}>
                      {recommendation.suitableFor.includes('value' as InvestorType) || recommendation.suitableFor.includes('quality' as InvestorType)
                        ? 'AVERAGE'
                        : 'BELOW AVG'
                      }
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {/* PE Ratio */}
                    {fundamentals.pe && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-[#8b949e]">PE:</span>
                        <span className="text-gray-900 dark:text-white font-semibold">
                          {fundamentals.pe.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {/* Debt to Equity */}
                    {fundamentals.debtToEquity != null && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-[#8b949e]">Debt-to-Equity:</span>
                        <span className="text-gray-900 dark:text-white font-semibold">
                          {fundamentals.debtToEquity.toFixed(1)}
                        </span>
                      </div>
                    )}

                    {/* Earnings Growth */}
                    {fundamentals.earningsGrowth != null && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-[#8b949e]">Earnings Growth:</span>
                        <span className={`font-semibold ${
                          fundamentals.earningsGrowth > 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {fundamentals.earningsGrowth > 0 ? '+' : ''}{fundamentals.earningsGrowth.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Technical Data */}
              {technicals && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-[#ff8c42] mb-3">All Technical Indicators</h4>
                  <div className="space-y-2 text-xs">
                    {Object.entries(technicals).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-1 border-b border-gray-200 dark:border-[#30363d]">
                        <span className="text-gray-600 dark:text-[#8b949e] font-medium">
                          {formatConditionName(key)}:
                        </span>
                        <span className="text-gray-900 dark:text-white font-semibold">
                          {typeof value === 'number' ? value.toFixed(2) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fundamental Data */}
              {fundamentals && (
                <div>
                  <h4 className="text-sm font-semibold text-[#ff8c42] mb-3">All Fundamental Data</h4>
                  <div className="space-y-2 text-xs">
                    {Object.entries(fundamentals).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-1 border-b border-gray-200 dark:border-[#30363d]">
                        <span className="text-gray-600 dark:text-[#8b949e] font-medium">
                          {formatConditionName(key)}:
                        </span>
                        <span className="text-gray-900 dark:text-white font-semibold">
                          {typeof value === 'number' ? value.toFixed(2) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
