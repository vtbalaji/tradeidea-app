import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FinancialData {
  debtToEquity?: number;
  piotroskiScore?: number;
  financialRating?: 'STRONG' | 'AVERAGE' | 'WEAK';
}

interface FinancialCardProps {
  financial: FinancialData;
  className?: string;
  showBorder?: boolean;
  defaultExpanded?: boolean;
}

/**
 * FinancialCard - Displays financial health metrics
 * Reusable component for showing Debt-to-Equity and Piotroski Score
 * Rating based on Piotroski F-Score
 */
export const FinancialCard: React.FC<FinancialCardProps> = ({
  financial,
  className = '',
  showBorder = true,
  defaultExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Piotroski Score color coding and rating
  const getPiotroskiRating = (score?: number): { rating: string; color: string; bgColor: string } => {
    if (!score && score !== 0) return { rating: 'N/A', color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-500/20' };

    if (score >= 7) {
      return {
        rating: 'STRONG',
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-600/20'
      };
    }
    if (score >= 4) {
      return {
        rating: 'AVERAGE',
        color: 'text-yellow-600 dark:text-yellow-500',
        bgColor: 'bg-yellow-500/20'
      };
    }
    return {
      rating: 'WEAK',
      color: 'text-red-600 dark:text-red-500',
      bgColor: 'bg-red-500/20'
    };
  };

  // Debt to Equity color coding
  const getDebtToEquityColor = (value?: number) => {
    if (!value && value !== 0) return 'text-gray-600 dark:text-gray-400';
    if (value < 0.5) return 'text-green-600 dark:text-green-400';
    if (value < 1.0) return 'text-yellow-600 dark:text-yellow-500';
    return 'text-red-600 dark:text-red-500';
  };

  const piotroskiRating = getPiotroskiRating(financial.piotroskiScore);

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
          <p className="text-xs font-bold text-[#ff8c42]">Financial Health</p>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          )}
        </div>
        <span className={`px-2 py-1 text-xs font-bold rounded ${piotroskiRating.bgColor} ${piotroskiRating.color}`}>
          {piotroskiRating.rating}
        </span>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Piotroski F-Score */}
          {financial.piotroskiScore !== undefined && (
            <div>
              <span className="text-gray-600 dark:text-[#8b949e]">Piotroski Score:</span>
              <span className={`ml-1 font-bold ${piotroskiRating.color}`}>
                {financial.piotroskiScore}/9
              </span>
            </div>
          )}

          {/* Debt to Equity */}
          {financial.debtToEquity !== undefined && financial.debtToEquity !== null && (
            <div>
              <span className="text-gray-600 dark:text-[#8b949e]">Debt-to-Equity:</span>
              <span className={`ml-1 font-semibold ${getDebtToEquityColor(financial.debtToEquity)}`}>
                {financial.debtToEquity.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FinancialCard;
