import React from 'react';
import { EditIcon } from '@/components/icons';
import TechnicalLevelsCard from '@/components/TechnicalLevelsCard';
import FundamentalsCard from '@/components/FundamentalsCard';
import FinancialCard from '@/components/FinancialCard';
import AnalysisButton from '@/components/AnalysisButton';
import { analyzeExitCriteria, getOverallRecommendation } from '@/lib/exitCriteriaAnalysis';

interface DetailedPositionCardProps {
  position: any;
  onAnalyze: (position: any) => void;
  onBuySell: (position: any) => void;
  onEdit: (position: any) => void;
}

export function DetailedPositionCard({
  position,
  onAnalyze,
  onBuySell,
  onEdit,
}: DetailedPositionCardProps) {
  // Debug: Log smart SL data for each position
  if (typeof window !== 'undefined') {
    console.log(`[${position.symbol}] smartSLTrigger:`, position.smartSLTrigger, 'Phase:', position.smartSLPhase);
  }

  const investedAmount = position.entryPrice * position.quantity;
  const currentValue = position.currentPrice * position.quantity;
  const pnl = currentValue - investedAmount;
  const pnlPercent = (pnl / investedAmount) * 100;
  const isProfit = pnl >= 0;
  const alerts = analyzeExitCriteria(position);

  // Calculate price change from technicals data
  const priceChange = position.technicals?.change || 0;
  const priceChangePercent = position.technicals?.changePercent || 0;
  const isPriceUp = priceChange >= 0;

  // Check if stop-loss is hit (critical alert with "STOP LOSS HIT")
  const stopLossHit = alerts?.some(alert =>
    alert.type === 'critical' && alert.message.includes('STOP LOSS HIT')
  );

  return (
    <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-5 hover:border-[#ff8c42] transition-colors">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-start gap-2">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{position.symbol}</h3>
            {/* DEBUG: Show badge for all positions to test rendering */}
            {position.smartSLTrigger === 'yes' ? (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                title={`Smart SL: ${position.smartSLPhase || 'Active'} (trigger=${position.smartSLTrigger})`}
              >
                🛡️ SL
              </span>
            ) : (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                title={`No Smart SL (trigger=${position.smartSLTrigger})`}
              >
                ⚠️ NO SL
              </span>
            )}
          </div>
          {position.fundamentals?.industry && (
            <p className="text-xs font-medium text-gray-600 dark:text-[#8b949e] mt-0.5">
              {position.fundamentals?.industry}
            </p>
          )}
        </div>
        <div className={`text-right ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
          <p className="text-xl font-bold">{isProfit ? '+' : ''}₹{Math.round(pnl).toLocaleString('en-IN')}</p>
          <p className="text-sm">({isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%)</p>
        </div>
      </div>

      {/* Exit Reason for Closed */}
      {position.exitReason && position.status === 'closed' && (
        <div className="mb-3 px-3 py-2 bg-orange-500/20 border border-orange-500/30 rounded-lg">
          <p className="text-sm text-orange-400 font-semibold">📤 Exited: {position.exitReason}</p>
        </div>
      )}

      {/* Exit Analysis Alerts */}
      {alerts && position.status === 'open' && (
        <div className="space-y-2 mb-4">
          {alerts.map((alert, idx) => (
            <div
              key={idx}
              className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                alert.type === 'critical'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : alert.type === 'warning'
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  : 'bg-gray-500/20 text-gray-700 dark:text-gray-300 border border-gray-500/30'
              }`}
            >
              {alert.message}
            </div>
          ))}
        </div>
      )}

      {/* Position Details Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-1">Quantity</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{position.quantity}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-1">Avg Buy Price</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">₹{Math.round(position.entryPrice).toLocaleString('en-IN')}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-1">LTP</p>
          <div className="flex items-baseline gap-1.5">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">₹{Math.round(position.currentPrice).toLocaleString('en-IN')}</p>
            {position.technicals && (
              <p className={`text-xs font-semibold ${isPriceUp ? 'text-green-500' : 'text-red-500'}`}>
                ({isPriceUp ? '+' : ''}{priceChangePercent.toFixed(2)}%)
              </p>
            )}
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-1">Current Value</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">₹{Math.round(currentValue).toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Technical Indicators, Fundamentals & Financial Display */}
      {(position.technicals || position.fundamentals) && position.status === 'open' && (
        <div className="mb-4 p-3 bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg">
          {position.technicals && (
            <TechnicalLevelsCard
              technicals={position.technicals}
              currentPrice={position.currentPrice}
              className="mb-3"
            />
          )}
          {position.fundamentals && (
            <FundamentalsCard
              fundamentals={position.fundamentals}
              showBorder={!!position.technicals}
              className="mb-3"
            />
          )}
          {position.fundamentals && (position.fundamentals.debtToEquity !== undefined || position.fundamentals.piotroskiScore !== undefined) && (
            <FinancialCard
              financial={{
                debtToEquity: position.fundamentals.debtToEquity,
                piotroskiScore: position.fundamentals.piotroskiScore
              }}
              showBorder={!!(position.technicals || position.fundamentals)}
            />
          )}
        </div>
      )}

      {/* Warning if no technical data available */}
      {!position.technicals && position.status === 'open' && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-xs text-yellow-600 dark:text-yellow-400">
            ⚠️ Technical data not available. Waiting for next analysis cycle.
          </p>
        </div>
      )}

      {/* Actions */}
      {position.status === 'open' && (
        <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-[#30363d]">
          <AnalysisButton
            onClick={() => onAnalyze(position)}
            className="flex-1"
          />
          <button
            onClick={() => onBuySell(position)}
            className="flex-1 px-3 py-2 bg-gray-100 dark:bg-[#30363d] hover:bg-gray-200 dark:hover:bg-[#3c444d] border border-gray-200 dark:border-[#444c56] text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <EditIcon size={14} className="w-3.5 h-3.5" />
            <span>Buy/Sell</span>
          </button>
          <button
            onClick={() => onEdit(position)}
            className="flex-1 px-3 py-2 bg-gray-100 dark:bg-[#30363d] hover:bg-gray-200 dark:hover:bg-[#3c444d] border border-gray-200 dark:border-[#444c56] text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <EditIcon size={14} className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
        </div>
      )}
    </div>
  );
}
