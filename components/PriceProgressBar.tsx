'use client';

import React from 'react';

interface PriceProgressBarProps {
  currentPrice: number;
  entryPrice: number;
  stopLoss: number;
  target: number;
  showCurrentPrice?: boolean;
  showPerformance?: boolean;
  performanceText?: string;
  performanceColor?: string;
  isActiveStatus?: boolean;
}

export default function PriceProgressBar({
  currentPrice,
  entryPrice,
  stopLoss,
  target,
  showCurrentPrice = true,
  showPerformance = false,
  performanceText,
  performanceColor,
  isActiveStatus = false
}: PriceProgressBarProps) {
  // Calculate positions (0-100%)
  const totalRange = target - stopLoss;
  const entryPosition = ((entryPrice - stopLoss) / totalRange) * 100;
  const currentPosition = ((currentPrice - stopLoss) / totalRange) * 100;

  // Clamp positions between 0-100
  const clampedCurrentPosition = Math.max(0, Math.min(100, currentPosition));

  // Calculate risk and reward
  const riskAmount = Math.abs(entryPrice - stopLoss);
  const targetPercent = ((target - entryPrice) / entryPrice * 100).toFixed(1);
  const toTargetAmount = Math.abs(target - currentPrice);
  const toTargetPercent = ((target - currentPrice) / currentPrice * 100).toFixed(1);

  return (
    <div>
      {/* Price Display - Entry Price for Active, Current Price for Others */}
      {showCurrentPrice && (
        <div className="flex items-center justify-center gap-3 mb-2">
          {isActiveStatus ? (
            <>
              <div className="text-sm text-gray-600 dark:text-[#8b949e] font-semibold">Entry Price</div>
              <div className="text-4xl font-bold text-gray-900 dark:text-white">
                ₹{Math.round(entryPrice)}
              </div>
            </>
          ) : (
            <>
              <div className="text-sm text-gray-600 dark:text-[#8b949e] font-semibold">Current Price</div>
              <div className="text-4xl font-bold text-gray-900 dark:text-white">
                ₹{Math.round(currentPrice)}
              </div>
              {showPerformance && performanceText && (
                <span className={`text-base font-bold ${performanceColor}`}>
                  {performanceText} from entry
                </span>
              )}
            </>
          )}
        </div>
      )}


      {/* Visual Progress Bar */}
      <div className="mb-3">
        {/* Progress Bar */}
        <div className="relative h-2 bg-gradient-to-r from-red-300 via-gray-200 to-green-300 dark:from-red-900 dark:via-gray-700 dark:to-green-900 rounded-full mb-3">
          {/* Entry Point Marker (Blue Circle) */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 border-2 border-white dark:border-gray-900 rounded-full z-10"
            style={{ left: `${entryPosition}%`, transform: 'translate(-50%, -50%)' }}
          />

          {/* Current Price Marker (Triangle Pointing Down) */}
          <div
            className="absolute -top-3 z-20"
            style={{ left: `${clampedCurrentPosition}%`, transform: 'translateX(-50%)' }}
          >
            <div className="relative">
              {/* Triangle - Made bigger */}
              <div
                className={`w-0 h-0 border-l-[10px] border-r-[10px] border-t-[14px] ${
                  currentPrice >= entryPrice
                    ? 'border-l-transparent border-r-transparent border-t-green-600 dark:border-t-green-500'
                    : 'border-l-transparent border-r-transparent border-t-red-600 dark:border-t-red-500'
                }`}
              />
            </div>
          </div>

          {/* Target Marker (Green Circle at end) */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-green-600 border-2 border-white dark:border-gray-900 rounded-full z-10"
            style={{ left: '100%', transform: 'translate(-50%, -50%)' }}
          />
        </div>

        {/* Labels */}
        <div className="flex justify-between items-start text-xs">
          {/* Stop Loss */}
          <div className="flex-1">
            <div className="text-red-600 dark:text-red-400 font-semibold mb-1">Stop Loss</div>
            <div className="font-bold text-gray-900 dark:text-white">₹{Math.round(stopLoss)}</div>
            <div className="text-gray-600 dark:text-[#8b949e]">Risk: ₹{Math.round(riskAmount)}</div>
          </div>

          {/* Entry / Current Price */}
          <div className="flex-1 text-center">
            <div className="text-blue-600 dark:text-blue-400 font-semibold mb-1">
              {isActiveStatus ? 'Current Price' : 'Entry'}
            </div>
            <div className="font-bold text-gray-900 dark:text-white">
              ₹{Math.round(isActiveStatus ? currentPrice : entryPrice)}
            </div>
          </div>

          {/* Target */}
          <div className="flex-1 text-right">
            <div className="text-green-600 dark:text-green-400 font-semibold mb-1">Target</div>
            <div className="font-bold text-gray-900 dark:text-white">₹{Math.round(target)} +{targetPercent}%</div>
            <div className="text-gray-600 dark:text-[#8b949e]">To Target: ₹{Math.round(toTargetAmount)} ({toTargetPercent}%)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
