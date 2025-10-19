import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { TrendArrow } from './icons/TrendArrow';
import { getOverallRecommendation } from '@/lib/exitCriteriaAnalysis';

interface TechnicalData {
  lastPrice?: number;
  ema50?: number;
  sma100?: number;
  sma200?: number;
  supertrend?: number;
  supertrendDirection?: number;
  rsi?: number | null;
  rsi14?: number; // Legacy field name
  bollingerBands?: {
    upper: number;
    middle: number;
    lower: number;
  } | null;
  bollingerMiddle?: number; // Legacy field name
  overallSignal?: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  trendStructure?: 'UPTREND' | 'DOWNTREND' | 'SIDEWAYS' | 'UNKNOWN';
  pricePattern?: {
    higherHighs: boolean;
    higherLows: boolean;
    lowerHighs: boolean;
    lowerLows: boolean;
  };
  bbPositionHistory?: ('ABOVE' | 'MIDDLE' | 'BELOW')[];
}

interface TechnicalLevelsCardProps {
  technicals: TechnicalData;
  className?: string;
  currentPrice?: number; // Optional override for portfolio positions
  defaultExpanded?: boolean;
}

/**
 * TechnicalLevelsCard - Displays technical indicators with trend arrows
 * Reusable component for showing EMA, SMA, Supertrend and overall signal
 * Now with expand/collapse functionality
 */
export const TechnicalLevelsCard: React.FC<TechnicalLevelsCardProps> = ({
  technicals,
  className = '',
  currentPrice,
  defaultExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  // Debug: Log technicals to see what data is available
  React.useEffect(() => {
    console.log('TechnicalLevelsCard - technicals:', {
      rsi: technicals.rsi,
      rsi14: technicals.rsi14,
      bollingerBands: technicals.bollingerBands,
      bollingerMiddle: technicals.bollingerMiddle
    });
  }, [technicals]);

  // Use provided currentPrice or fallback to technicals.lastPrice
  const priceToCompare = currentPrice ?? technicals.lastPrice;

  // Get enhanced recommendation using price action analysis
  const { recommendation, bgColor, textColor, icon } = getOverallRecommendation({
    technicals,
    currentPrice: priceToCompare
  });

  return (
    <div className={className}>
      {/* Header with Enhanced Recommendation and Expand/Collapse */}
      <div
        className="flex items-center justify-between mb-2 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
      >
        <div className="flex items-center gap-2">
          <p className="text-xs font-bold text-[#ff8c42]">Technical Levels</p>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          )}
        </div>
        <span className={`px-2 py-1 text-xs font-bold rounded ${bgColor} ${textColor}`}>
          {icon} {recommendation}
        </span>
      </div>

      {/* Expandable Technical Indicators Grid */}
      {isExpanded && (
        <div className="grid grid-cols-2 gap-2 text-xs">
        {/* 50 EMA */}
        {technicals.ema50 && priceToCompare && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-[#8b949e]">50 EMA:</span>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-gray-900 dark:text-white">
                ₹{Math.round(technicals.ema50).toLocaleString('en-IN')}
              </span>
              <TrendArrow isUp={priceToCompare > technicals.ema50} size={12} />
            </div>
          </div>
        )}

        {/* 100 MA */}
        {technicals.sma100 && priceToCompare && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-[#8b949e]">100 MA:</span>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-gray-900 dark:text-white">
                ₹{Math.round(technicals.sma100).toLocaleString('en-IN')}
              </span>
              <TrendArrow isUp={priceToCompare > technicals.sma100} size={12} />
            </div>
          </div>
        )}

        {/* 200 MA */}
        {technicals.sma200 && priceToCompare && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-[#8b949e]">200 MA:</span>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-gray-900 dark:text-white">
                ₹{Math.round(technicals.sma200).toLocaleString('en-IN')}
              </span>
              <TrendArrow isUp={priceToCompare > technicals.sma200} size={12} />
            </div>
          </div>
        )}

        {/* Supertrend */}
        {technicals.supertrend && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-[#8b949e]">Supertrend:</span>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-gray-900 dark:text-white">
                ₹{Math.round(technicals.supertrend).toLocaleString('en-IN')}
              </span>
              <TrendArrow isUp={technicals.supertrendDirection === 1} size={12} />
            </div>
          </div>
        )}

        {/* Middle Bollinger Band */}
        {(() => {
          const bbMiddle = technicals.bollingerBands?.middle ?? technicals.bollingerMiddle;
          return bbMiddle !== undefined && bbMiddle !== null ? (
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-[#8b949e]">BB Middle:</span>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-gray-900 dark:text-white">
                  ₹{Math.round(bbMiddle).toLocaleString('en-IN')}
                </span>
                <div className="w-3" />
              </div>
            </div>
          ) : null;
        })()}

        {/* RSI */}
        {(() => {
          const rsiValue = technicals.rsi ?? technicals.rsi14;
          return rsiValue !== undefined && rsiValue !== null ? (
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-[#8b949e]">RSI:</span>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {rsiValue.toFixed(2)}
                </span>
                <div className="w-3" />
              </div>
            </div>
          ) : null;
        })()}
        </div>
      )}
    </div>
  );
};

export default TechnicalLevelsCard;
