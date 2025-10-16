import React from 'react';
import { ChevronDownIcon, EditIcon } from '@/components/icons';
import TechnicalLevelsCard from '@/components/TechnicalLevelsCard';
import FundamentalsCard from '@/components/FundamentalsCard';
import AnalysisButton from '@/components/AnalysisButton';
import { analyzeExitCriteria, getOverallRecommendation } from '@/lib/exitCriteriaAnalysis';

interface SummaryPositionCardProps {
  position: any;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onAnalyze: (position: any) => void;
  onBuySell: (position: any) => void;
  onEdit: (position: any) => void;
}

export function SummaryPositionCard({
  position,
  isExpanded,
  onToggleExpand,
  onAnalyze,
  onBuySell,
  onEdit,
}: SummaryPositionCardProps) {
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
    <div>
      {/* Summary Card - Clickable */}
      <div
        onClick={onToggleExpand}
        className={`bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg p-4 hover:border-[#ff8c42] transition-colors cursor-pointer ${
          isExpanded ? 'border-[#ff8c42]' : ''
        }`}
      >
        {/* First Row: Symbol, Trade Type, P&L, Expand Icon */}
        <div className="flex items-center justify-between gap-3 mb-2">
          {/* Symbol */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">{position.symbol}</h3>
              {position.smartSLTrigger === 'yes' && (
                <img
                  src="/logo.svg"
                  alt="Smart SL"
                  className="h-4 w-4 opacity-80 flex-shrink-0"
                  title="Protected by Smart SL"
                />
              )}
            </div>
            {position.fundamentals?.industry && (
              <p className="text-xs font-medium text-gray-600 dark:text-[#8b949e] mt-0.5">
                {position.fundamentals?.industry}
              </p>
            )}
          </div>

          {/* P&L and Expand Icon */}
          <div className="flex items-center gap-3">
            <div className={`text-right flex-shrink-0 ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
              <p className="text-base sm:text-lg font-bold">{isProfit ? '+' : ''}₹{pnl.toFixed(2)}</p>
              <p className="text-xs">({isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%)</p>
            </div>
            <ChevronDownIcon
              size={20}
              className={`w-5 h-5 text-gray-600 dark:text-[#8b949e] transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
            />
          </div>
        </div>

        {/* Second Row: Stop Loss Status (only if SL is hit) */}
        {stopLossHit && position.status === 'open' && alerts && (
          <div>
            {alerts
              .filter(alert =>
                alert.type === 'critical' && alert.message.includes('STOP LOSS HIT')
              )
              .map((alert, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 inline-block"
                >
                  <p className="text-xs font-bold text-red-400">
                    {alert.message}
                  </p>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Expanded Detailed View */}
      {isExpanded && (
        <div className="mt-3 bg-white dark:bg-[#0f1419] border border-[#ff8c42] rounded-xl p-5 animate-fadeIn">
          {/* Exit Reason for Closed */}
          {position.exitReason && position.status === 'closed' && (
            <div className="mb-3 px-3 py-2 bg-orange-500/20 border border-orange-500/30 rounded-lg">
              <p className="text-sm text-orange-400 font-semibold">📤 Exited: {position.exitReason}</p>
            </div>
          )}

          {/* Exit Analysis Alerts - Only SL and Target */}
          {alerts && position.status === 'open' && (
            <div className="space-y-2 mb-4">
              {alerts
                .filter(alert =>
                  alert.message.includes('SL') ||
                  alert.message.includes('TARGET') ||
                  alert.message.includes('Target') ||
                  alert.message.includes('STOP LOSS')
                )
                .map((alert, idx) => (
                  <div
                    key={idx}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                      alert.type === 'critical'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : alert.type === 'warning'
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
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
              <p className="text-sm font-semibold text-gray-900 dark:text-white">₹{position.entryPrice.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-1">LTP</p>
              <div className="flex items-baseline gap-1.5">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">₹{position.currentPrice.toFixed(2)}</p>
                {position.technicals && (
                  <p className={`text-xs font-semibold ${isPriceUp ? 'text-green-500' : 'text-red-500'}`}>
                    ({isPriceUp ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                  </p>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-1">Current Value</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">₹{currentValue.toFixed(2)}</p>
            </div>
          </div>

          {/* Technical Indicators & Fundamentals Display */}
          {(position.technicals || position.fundamentals) && position.status === 'open' && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg">
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
                onClick={(e) => {
                  e.stopPropagation();
                  onAnalyze(position);
                }}
                className="flex-1"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBuySell(position);
                }}
                className="flex-1 px-3 py-2 bg-gray-100 dark:bg-[#30363d] hover:bg-gray-200 dark:hover:bg-[#3c444d] border border-gray-200 dark:border-[#444c56] text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <EditIcon size={14} className="w-3.5 h-3.5" />
                <span>Buy/Sell</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(position);
                }}
                className="flex-1 px-3 py-2 bg-gray-100 dark:bg-[#30363d] hover:bg-gray-200 dark:hover:bg-[#3c444d] border border-gray-200 dark:border-[#444c56] text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <EditIcon size={14} className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
