// Exit criteria analysis logic extracted from portfolio page
export type AlertType = 'critical' | 'warning' | 'info';

export interface ExitAlert {
  type: AlertType;
  message: string;
}

/**
 * Analyzes exit criteria for a position and returns alerts
 * @param position - The portfolio position to analyze
 * @returns Array of alerts or null if no exit criteria
 */
export function analyzeExitCriteria(position: any): ExitAlert[] | null {
  if (!position.exitCriteria) return null;

  const alerts: ExitAlert[] = [];
  const { exitCriteria, currentPrice, stopLoss, target1, technicals } = position;

  // Determine effective stop loss (highest among user SL, Supertrend, 100MA)
  let effectiveStopLoss = stopLoss;
  let stopLossSource = 'User SL';

  if (technicals?.supertrend && technicals.supertrend > effectiveStopLoss) {
    effectiveStopLoss = technicals.supertrend;
    stopLossSource = 'Supertrend';
  }

  if (technicals?.sma100 && technicals.sma100 > effectiveStopLoss) {
    effectiveStopLoss = technicals.sma100;
    stopLossSource = '100MA';
  }

  // Check stop loss
  if (exitCriteria.exitAtStopLoss) {
    if (currentPrice <= effectiveStopLoss) {
      alerts.push({ type: 'critical', message: `🚨 STOP LOSS HIT at ₹${effectiveStopLoss.toFixed(2)} (${stopLossSource})` });
    } else {
      const percentAbove = ((currentPrice - effectiveStopLoss) / effectiveStopLoss) * 100;
      if (percentAbove <= 5) {
        alerts.push({ type: 'warning', message: `⚠️ Near SL: ₹${effectiveStopLoss.toFixed(2)} (${stopLossSource})` });
      } else {
        alerts.push({ type: 'info', message: `✅ SL Safe: ₹${effectiveStopLoss.toFixed(2)} (${stopLossSource})` });
      }
    }
  }

  // Check 50 EMA
  if (exitCriteria.exitBelow50EMA) {
    if (technicals?.ema50) {
      if (currentPrice < technicals.ema50) {
        alerts.push({ type: 'critical', message: `📉 Below 50 EMA (₹${technicals.ema50.toFixed(2)}) - TIME TO EXIT` });
      } else {
        const percentAbove = ((currentPrice - technicals.ema50) / technicals.ema50) * 100;
        if (percentAbove <= 5) {
          alerts.push({ type: 'warning', message: `⚠️ Near 50 EMA: ₹${technicals.ema50.toFixed(2)} (${percentAbove.toFixed(1)}% above)` });
        } else {
          alerts.push({ type: 'info', message: `✅ Above 50 EMA: ₹${technicals.ema50.toFixed(2)} (+${percentAbove.toFixed(1)}%)` });
        }
      }
    } else {
      alerts.push({ type: 'warning', message: `⚠️ 50 EMA data not available - Run batch analysis` });
    }
  }

  // Check 100 MA
  if (exitCriteria.exitBelow100MA) {
    if (technicals?.sma100) {
      if (currentPrice < technicals.sma100) {
        alerts.push({ type: 'critical', message: `📉 Below 100 MA (₹${technicals.sma100.toFixed(2)}) - TIME TO EXIT` });
      } else {
        const percentAbove = ((currentPrice - technicals.sma100) / technicals.sma100) * 100;
        if (percentAbove <= 5) {
          alerts.push({ type: 'warning', message: `⚠️ Near 100 MA: ₹${technicals.sma100.toFixed(2)} (${percentAbove.toFixed(1)}% above)` });
        } else {
          alerts.push({ type: 'info', message: `✅ Above 100 MA: ₹${technicals.sma100.toFixed(2)} (+${percentAbove.toFixed(1)}%)` });
        }
      }
    } else {
      alerts.push({ type: 'warning', message: `⚠️ 100 MA data not available - Run batch analysis` });
    }
  }

  // Check 200 MA
  if (exitCriteria.exitBelow200MA) {
    if (technicals?.sma200) {
      if (currentPrice < technicals.sma200) {
        alerts.push({ type: 'critical', message: `📉 Below 200 MA (₹${technicals.sma200.toFixed(2)}) - TIME TO EXIT` });
      } else {
        const percentAbove = ((currentPrice - technicals.sma200) / technicals.sma200) * 100;
        if (percentAbove <= 5) {
          alerts.push({ type: 'warning', message: `⚠️ Near 200 MA: ₹${technicals.sma200.toFixed(2)} (${percentAbove.toFixed(1)}% above)` });
        } else {
          alerts.push({ type: 'info', message: `✅ Above 200 MA: ₹${technicals.sma200.toFixed(2)} (+${percentAbove.toFixed(1)}%)` });
        }
      }
    } else {
      alerts.push({ type: 'warning', message: `⚠️ 200 MA data not available - Run batch analysis` });
    }
  }

  // Check Weekly Supertrend
  if (exitCriteria.exitOnWeeklySupertrend) {
    if (technicals?.supertrend && technicals?.supertrendDirection) {
      if (technicals.supertrendDirection === -1) {
        alerts.push({ type: 'critical', message: `📉 Supertrend BEARISH (₹${technicals.supertrend.toFixed(2)}) - TIME TO EXIT` });
      } else {
        alerts.push({ type: 'info', message: `✅ Supertrend BULLISH (₹${technicals.supertrend.toFixed(2)})` });
      }
    } else {
      alerts.push({ type: 'warning', message: `⚠️ Supertrend data not available - Run batch analysis` });
    }
  }

  return alerts.length > 0 ? alerts : null;
}

/**
 * Calculates overall recommendation based on technical data
 */
export function getOverallRecommendation(position: any): {
  recommendation: 'ACCUMULATE' | 'HOLD' | 'EXIT';
  bgColor: string;
  borderColor: string;
  textColor: string;
  icon: string;
} {
  const isAbove200MA = position.technicals?.sma200 && position.currentPrice > position.technicals.sma200;
  const isSupertrendBullish = position.technicals?.supertrendDirection === 1;

  let recommendation: 'ACCUMULATE' | 'HOLD' | 'EXIT' = 'HOLD';
  let bgColor = 'bg-yellow-500/20';
  let borderColor = 'border-yellow-500/30';
  let textColor = 'text-yellow-400';
  let icon = '⏸️';

  if (isAbove200MA && isSupertrendBullish) {
    recommendation = 'ACCUMULATE';
    bgColor = 'bg-green-500/20';
    borderColor = 'border-green-500/30';
    textColor = 'text-green-400';
    icon = '📈';
  } else if (!isAbove200MA) {
    recommendation = 'EXIT';
    bgColor = 'bg-red-500/20';
    borderColor = 'border-red-500/30';
    textColor = 'text-red-400';
    icon = '🚨';
  }

  return { recommendation, bgColor, borderColor, textColor, icon };
}
