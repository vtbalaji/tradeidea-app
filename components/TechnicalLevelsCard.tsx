import React from 'react';
import { TrendArrow } from './icons/TrendArrow';

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
}

interface TechnicalLevelsCardProps {
  technicals: TechnicalData;
  className?: string;
  currentPrice?: number; // Optional override for portfolio positions
}

/**
 * TechnicalLevelsCard - Displays technical indicators with trend arrows
 * Reusable component for showing EMA, SMA, Supertrend and overall signal
 */
export const TechnicalLevelsCard: React.FC<TechnicalLevelsCardProps> = ({
  technicals,
  className = '',
  currentPrice
}) => {
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
  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'STRONG_BUY':
        return 'bg-green-600/20 text-green-600 dark:text-green-400';
      case 'BUY':
        return 'bg-green-500/20 text-green-600 dark:text-green-500';
      case 'STRONG_SELL':
        return 'bg-red-600/20 text-red-600 dark:text-red-400';
      case 'SELL':
        return 'bg-red-500/20 text-red-600 dark:text-red-500';
      default:
        return 'bg-gray-500/20 text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className={className}>
      {/* Header with Overall Signal */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-[#ff8c42]">Technical Levels</p>
        {technicals.overallSignal && (
          <span className={`px-2 py-1 text-xs font-bold rounded ${getSignalColor(technicals.overallSignal)}`}>
            {technicals.overallSignal.replace('_', ' ')}
          </span>
        )}
      </div>

      {/* Technical Indicators Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* 50 EMA */}
        {technicals.ema50 && priceToCompare && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-[#8b949e]">50 EMA:</span>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-gray-900 dark:text-white">
                ₹{technicals.ema50.toFixed(2)}
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
                ₹{technicals.sma100.toFixed(2)}
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
                ₹{technicals.sma200.toFixed(2)}
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
                ₹{technicals.supertrend.toFixed(2)}
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
                  ₹{bbMiddle.toFixed(2)}
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
    </div>
  );
};

export default TechnicalLevelsCard;
