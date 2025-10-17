'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { InvestorType, InvestorRecommendation, EntryAnalysis } from '@/lib/investment-rules';
import { TrendArrow, ChevronLeftIcon, ChevronRightIcon, CloseIcon } from '@/components/icons';
import TechnicalLevelsCard from '@/components/TechnicalLevelsCard';
import FundamentalsCard from '@/components/FundamentalsCard';
import PriceChart from '@/components/PriceChart';

interface InvestorAnalysisResultsProps {
  symbol: string;
  recommendation: InvestorRecommendation;
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

export default function InvestorAnalysisResults({
  symbol,
  recommendation,
  technicals,
  fundamentals
}: InvestorAnalysisResultsProps) {
  const router = useRouter();
  const [showDetails, setShowDetails] = React.useState(false);

  const handleConvertToIdea = () => {
    // Calculate suggested entry price, stop loss, and target
    const entryPrice = technicals?.lastPrice || '';
    const stopLoss = technicals?.sma50 || technicals?.sma20 || '';
    const target = entryPrice && stopLoss ? (entryPrice + (entryPrice - stopLoss) * 1.5).toFixed(2) : '';

    // Build analysis text based on suitable investor types
    let analysisText = 'Investment Analysis:\n\n';

    if (recommendation.suitableFor.length > 0) {
      analysisText += `✓ Suitable for: ${recommendation.suitableFor.map(type => investorTypeInfo[type].name).join(', ')}\n\n`;

      // Add details for each suitable type
      recommendation.suitableFor.forEach(type => {
        const analysis = recommendation.details[type];
        const info = investorTypeInfo[type];
        analysisText += `${info.icon} ${info.name}:\n`;
        analysisText += `- ${info.description}\n`;
        analysisText += `- Investment horizon: ${info.horizon}\n`;
        analysisText += `- Criteria met: ${analysis.met}/${analysis.total}\n\n`;
      });
    } else {
      analysisText += '⚠️ No suitable investor type found for current market conditions.\n\n';
    }

    // Add key technical levels
    analysisText += 'Key Levels:\n';
    if (technicals) {
      if (technicals.lastPrice) analysisText += `- Current Price: ₹${technicals.lastPrice.toFixed(2)}\n`;
      if (technicals.sma50) analysisText += `- 50 MA: ₹${technicals.sma50.toFixed(2)}\n`;
      if (technicals.sma200) analysisText += `- 200 MA: ₹${technicals.sma200.toFixed(2)}\n`;
      if (technicals.rsi) analysisText += `- RSI: ${technicals.rsi.toFixed(2)}\n`;
    }

    // Add fundamental highlights
    if (fundamentals) {
      analysisText += '\nFundamental Highlights:\n';
      if (fundamentals.sector) analysisText += `- Sector: ${fundamentals.sector}\n`;
      if (fundamentals.pe) analysisText += `- P/E Ratio: ${fundamentals.pe.toFixed(2)}\n`;
      if (fundamentals.roe) analysisText += `- ROE: ${fundamentals.roe.toFixed(2)}%\n`;
      if (fundamentals.dividendYield) analysisText += `- Dividend Yield: ${fundamentals.dividendYield.toFixed(2)}%\n`;
    }

    // Build query parameters
    const params = new URLSearchParams({
      symbol: symbol,
      ...(analysisText && { analysis: analysisText }),
      ...(entryPrice && { entryPrice: entryPrice.toString() }),
      ...(stopLoss && { stopLoss: stopLoss.toString() }),
      ...(target && { target: target.toString() })
    });

    // Navigate to new idea page with pre-filled data
    router.push(`/ideas/new?${params.toString()}`);
  };

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
    <div className="w-full max-w-7xl mx-auto">
      <div className="bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 dark:bg-[#0f1419] border-b border-gray-200 dark:border-[#30363d] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-[#ff8c42]">{symbol}</span>
            {technicals?.lastPrice && (
              <span className="text-lg font-bold text-gray-900 dark:text-white">(₹{technicals.lastPrice.toFixed(2)})</span>
            )}
            {fundamentals?.sector && (
              <span className="text-sm text-gray-600 dark:text-[#8b949e]">- {fundamentals.sector}</span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Price Chart - Full Width */}
          <div className="mb-4">
            <div className="bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Price Chart (1 Year)
                </h3>
                {technicals?.lastPrice && (
                  <span className="text-xs font-semibold text-[#ff8c42]">
                    LTP: ₹{technicals.lastPrice.toFixed(2)}
                  </span>
                )}
              </div>
              <PriceChart symbol={symbol} days={365} height="400px" />
            </div>
          </div>

          {/* Technical & Fundamentals Cards - Below Chart (Side by Side) */}
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Technical Levels Card */}
            {technicals && (
              <div className="bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <TechnicalLevelsCard technicals={technicals} />
              </div>
            )}

            {/* Fundamentals Card */}
            {fundamentals && (
              <div className="bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <FundamentalsCard fundamentals={fundamentals} showBorder={false} />
              </div>
            )}
          </div>

          {/* Summary */}
          {recommendation.suitableFor.length > 0 ? (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
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
            <div className="mb-4 p-3 bg-gray-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm font-semibold text-gray-600 dark:text-[#8b949e]">
                No suitable investor type found
              </p>
              <p className="text-xs text-gray-600 dark:text-[#8b949e] mt-1">
                System computed. Review the criteria below to see what conditions are not met
              </p>
            </div>
          )}

          {/* Detailed Analysis Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {Object.entries(recommendation.details).map(([type, analysis]) =>
              renderAnalysisCard(type as InvestorType, analysis)
            )}
          </div>

          {/* Footer Note */}
          <div className="mb-3 p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-xs text-blue-600 dark:text-blue-400">
              <strong>Note:</strong> This analysis is based on technical and fundamental data.
              Always do your own research and consider your personal risk tolerance before investing.
            </p>
          </div>

          {/* Action Button */}
          <div className="flex justify-center">
            <button
              onClick={handleConvertToIdea}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#ff8c42] hover:bg-[#ff9a58] border border-[#ff8c42] text-white text-sm font-bold rounded-lg transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 2L8 14M2 8L14 8" strokeLinecap="round"/>
              </svg>
              <span>Convert to Idea</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
