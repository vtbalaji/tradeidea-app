import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FundamentalsData {
  trailingPE?: number;
  returnOnEquity?: number;
  debtToEquity?: number;
  earningsGrowth?: number;
  operatingMargins?: number;
  fundamentalRating?: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR' | 'WEAK';
  fundamentalScore?: number;
  priceToGraham?: number;
  piotroskiScore?: number;
  pegRatios?: {
    pegHistorical3Y: number | null;
    pegForward1Y: number | null;
    pegHybrid: number | null;
    earningsCagr3Y: number | null;
    earningsGrowthForward: number | null;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    recommendation: string;
    lastCalculated?: string;
  };
}

interface FundamentalsCardProps {
  fundamentals: FundamentalsData;
  className?: string;
  showBorder?: boolean;
  defaultExpanded?: boolean;
}

/**
 * FundamentalsCard - Displays fundamental metrics and rating
 * Reusable component for showing PE, ROE, Debt-to-Equity, and Earnings Growth
 * Now with expand/collapse functionality
 */
export const FundamentalsCard: React.FC<FundamentalsCardProps> = ({
  fundamentals,
  className = '',
  showBorder = true,
  defaultExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'EXCELLENT':
        return 'bg-green-600/20 text-green-600 dark:text-green-400';
      case 'GOOD':
        return 'bg-green-500/20 text-green-600 dark:text-green-500';
      case 'AVERAGE':
        return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-500';
      case 'POOR':
        return 'bg-orange-500/20 text-orange-600 dark:text-orange-500';
      case 'WEAK':
        return 'bg-red-500/20 text-red-600 dark:text-red-500';
      default:
        return 'bg-gray-500/20 text-gray-600 dark:text-gray-400';
    }
  };

  // Graham Valuation logic
  const getGrahamValuation = (priceToGraham?: number) => {
    if (!priceToGraham) return null;

    if (priceToGraham < 1) {
      return {
        label: 'Undervalued',
        color: 'text-green-600 dark:text-green-400'
      };
    } else if (priceToGraham === 1) {
      return {
        label: 'Fair Value',
        color: 'text-yellow-600 dark:text-yellow-500'
      };
    } else {
      return {
        label: 'Overvalued',
        color: 'text-red-600 dark:text-red-500'
      };
    }
  };

  const grahamValuation = getGrahamValuation(fundamentals.priceToGraham);

  // Piotroski Score color coding
  const getPiotroskiColor = (score?: number) => {
    if (!score) return 'text-gray-600 dark:text-gray-400';
    if (score >= 7) return 'text-green-600 dark:text-green-400';
    if (score >= 4) return 'text-yellow-600 dark:text-yellow-500';
    return 'text-red-600 dark:text-red-500';
  };

  // PEG Ratio color coding (Indian market context)
  const getPegColor = (peg?: number | null) => {
    if (!peg) return 'text-gray-600 dark:text-gray-400';
    if (peg < 1.0) return 'text-green-600 dark:text-green-400';  // Undervalued
    if (peg < 1.5) return 'text-yellow-600 dark:text-yellow-500'; // Fair value
    if (peg < 2.0) return 'text-orange-600 dark:text-orange-500'; // Slightly expensive
    return 'text-red-600 dark:text-red-500'; // Overvalued
  };

  // PEG Recommendation color coding
  const getPegRecommendationColor = (recommendation: string) => {
    if (recommendation.includes('UNDERVALUED')) {
      return 'bg-green-600/20 text-green-600 dark:text-green-400';
    } else if (recommendation.includes('FAIR_VALUE')) {
      return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-500';
    } else if (recommendation.includes('SLIGHTLY_EXPENSIVE')) {
      return 'bg-orange-500/20 text-orange-600 dark:text-orange-500';
    } else if (recommendation.includes('OVERVALUED')) {
      return 'bg-red-500/20 text-red-600 dark:text-red-500';
    } else {
      return 'bg-gray-500/20 text-gray-600 dark:text-gray-400';
    }
  };

  // Confidence badge color
  const getConfidenceColor = (confidence: 'HIGH' | 'MEDIUM' | 'LOW') => {
    switch (confidence) {
      case 'HIGH':
        return 'bg-green-500/20 text-green-600 dark:text-green-400';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-500';
      case 'LOW':
        return 'bg-orange-500/20 text-orange-600 dark:text-orange-500';
      default:
        return 'bg-gray-500/20 text-gray-600 dark:text-gray-400';
    }
  };

  // Only show rating if there's meaningful fundamental data (score > 0)
  const shouldShowRating = fundamentals.fundamentalRating &&
    (fundamentals.fundamentalScore ?? 0) > 0;

  return (
    <div className={className}>
      {/* Header with Rating and Expand/Collapse */}
      <div
        className={`flex items-center justify-between mb-2 cursor-pointer ${showBorder ? 'pt-2 border-t border-gray-200 dark:border-[#30363d]' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
      >
        <div className="flex items-center gap-2">
          <p className="text-xs font-bold text-[#ff8c42]">Fundamentals</p>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          )}
        </div>
        {shouldShowRating ? (
          <span className={`px-2 py-1 text-xs font-bold rounded ${getRatingColor(fundamentals.fundamentalRating!)}`}>
            {fundamentals.fundamentalRating}
          </span>
        ) : (
          <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-500/20 text-gray-600 dark:text-gray-400">
            N/A
          </span>
        )}
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <>
          {/* Fundamentals Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
        {/* PE Ratio */}
        {fundamentals.trailingPE !== undefined && fundamentals.trailingPE !== null && (
          <div>
            <span className="text-gray-600 dark:text-[#8b949e]">PE:</span>
            <span className="ml-1 font-semibold text-gray-900 dark:text-white">
              {fundamentals.trailingPE.toFixed(2)}
            </span>
          </div>
        )}

        {/* Return on Equity */}
        {fundamentals.returnOnEquity !== undefined && fundamentals.returnOnEquity !== null && (
          <div>
            <span className="text-gray-600 dark:text-[#8b949e]">ROE:</span>
            <span className="ml-1 font-semibold text-gray-900 dark:text-white">
              {fundamentals.returnOnEquity.toFixed(1)}%
            </span>
          </div>
        )}

        {/* Earnings Growth */}
        {fundamentals.earningsGrowth !== undefined && fundamentals.earningsGrowth !== null && (
          <div>
            <span className="text-gray-600 dark:text-[#8b949e]">Earnings Growth:</span>
            <span className="ml-1 font-semibold text-gray-900 dark:text-white">
              {fundamentals.earningsGrowth.toFixed(1)}%
            </span>
          </div>
        )}

            {/* Operating Margin */}
            {fundamentals.operatingMargins !== undefined && fundamentals.operatingMargins !== null && (
              <div>
                <span className="text-gray-600 dark:text-[#8b949e]">Operating Margin:</span>
                <span className="ml-1 font-semibold text-gray-900 dark:text-white">
                  {fundamentals.operatingMargins.toFixed(1)}%
                </span>
              </div>
            )}

            {/* Graham Valuation */}
            {grahamValuation && (
              <div>
                <span className="text-gray-600 dark:text-[#8b949e]">Graham Score:</span>
                <span className={`ml-1 font-bold ${grahamValuation.color}`}>
                  {grahamValuation.label}
                </span>
              </div>
            )}
          </div>

          {/* PEG Ratios Section (Indian Market Context) */}
          {fundamentals.pegRatios && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-[#30363d]">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-[#ff8c42]">PEG Analysis (Indian Context)</p>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded ${getConfidenceColor(fundamentals.pegRatios.confidence)}`}>
                  {fundamentals.pegRatios.confidence}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* PEG Hybrid (Main Metric) */}
                {fundamentals.pegRatios.pegHybrid !== null && fundamentals.pegRatios.pegHybrid !== undefined && (
                  <div className="col-span-2">
                    <span className="text-gray-600 dark:text-[#8b949e]">PEG Hybrid:</span>
                    <span className={`ml-1 font-bold ${getPegColor(fundamentals.pegRatios.pegHybrid)}`}>
                      {fundamentals.pegRatios.pegHybrid.toFixed(2)}
                    </span>
                    <span className="ml-2 text-gray-500 dark:text-gray-400 text-xs">
                      (70% historical + 30% forward)
                    </span>
                  </div>
                )}

                {/* PEG Historical */}
                {fundamentals.pegRatios.pegHistorical3Y !== null && (
                  <div>
                    <span className="text-gray-600 dark:text-[#8b949e]">PEG Historical (3Y):</span>
                    <span className={`ml-1 font-semibold ${getPegColor(fundamentals.pegRatios.pegHistorical3Y)}`}>
                      {fundamentals.pegRatios.pegHistorical3Y.toFixed(2)}
                    </span>
                  </div>
                )}

                {/* PEG Forward */}
                {fundamentals.pegRatios.pegForward1Y !== null && (
                  <div>
                    <span className="text-gray-600 dark:text-[#8b949e]">PEG Forward (1Y):</span>
                    <span className={`ml-1 font-semibold ${getPegColor(fundamentals.pegRatios.pegForward1Y)}`}>
                      {fundamentals.pegRatios.pegForward1Y.toFixed(2)}
                    </span>
                  </div>
                )}

                {/* 3-Year CAGR */}
                {fundamentals.pegRatios.earningsCagr3Y !== null && (
                  <div>
                    <span className="text-gray-600 dark:text-[#8b949e]">3Y CAGR:</span>
                    <span className="ml-1 font-semibold text-gray-900 dark:text-white">
                      {fundamentals.pegRatios.earningsCagr3Y.toFixed(1)}%
                    </span>
                  </div>
                )}

                {/* Forward Growth */}
                {fundamentals.pegRatios.earningsGrowthForward !== null && (
                  <div>
                    <span className="text-gray-600 dark:text-[#8b949e]">Forward Growth:</span>
                    <span className="ml-1 font-semibold text-gray-900 dark:text-white">
                      {fundamentals.pegRatios.earningsGrowthForward.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FundamentalsCard;
