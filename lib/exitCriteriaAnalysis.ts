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
 * Calculates overall recommendation based on technical data with price action
 */
export function getOverallRecommendation(position: any): {
  recommendation: 'STRONG SELL' | 'SELL' | 'HOLD' | 'BUY' | 'STRONG BUY';
  bgColor: string;
  borderColor: string;
  textColor: string;
  icon: string;
} {
  const tech = position.technicals;
  if (!tech) {
    return {
      recommendation: 'HOLD',
      bgColor: 'bg-gray-500/20',
      borderColor: 'border-gray-500/30',
      textColor: 'text-gray-400',
      icon: '●',
    };
  }

  const currentPrice = position.currentPrice;
  const rsi = tech.rsi14 || 50;
  const isAbove50MA = tech.sma50 && currentPrice > tech.sma50;
  const isAbove100MA = tech.sma100 && currentPrice > tech.sma100;
  const isAbove200MA = tech.sma200 && currentPrice > tech.sma200;
  const isSupertrendBullish = tech.supertrendDirection === 1;
  const trendStructure = tech.trendStructure || 'UNKNOWN';
  const pricePattern = tech.pricePattern;
  const macdBullish = tech.macdHistogram > 0;
  const volumeHigh = tech.volume > tech.avgVolume20;

  // Check BB position consistency (last 3 days)
  const bbHistory = tech.bbPositionHistory || [];
  const aboveBBMiddle3Days = bbHistory.length >= 3 && bbHistory.slice(-3).every((pos: string) => pos === 'ABOVE');
  const belowBBMiddle3Days = bbHistory.length >= 3 && bbHistory.slice(-3).every((pos: string) => pos === 'BELOW');

  let recommendation: 'STRONG SELL' | 'SELL' | 'HOLD' | 'BUY' | 'STRONG BUY' = 'HOLD';
  let bgColor = 'bg-gray-500/20';
  let borderColor = 'border-gray-500/30';
  let textColor = 'text-gray-600 dark:text-gray-400';
  let icon = '●';

  // STRONG SELL: Downtrend + bearish indicators
  if (
    trendStructure === 'DOWNTREND' &&
    (rsi < 30 || (rsi > 70 && !isAbove50MA)) &&
    !isAbove50MA &&
    belowBBMiddle3Days
  ) {
    recommendation = 'STRONG SELL';
    bgColor = 'bg-red-500/20';
    borderColor = 'border-red-500/30';
    textColor = 'text-red-600 dark:text-red-400';
    icon = '▼▼';
  }
  // SELL: Weak trend or below MAs
  else if (
    (trendStructure === 'DOWNTREND' || !isAbove50MA) &&
    rsi < 50 &&
    tech.bollingerMiddle && currentPrice < tech.bollingerMiddle
  ) {
    recommendation = 'SELL';
    bgColor = 'bg-orange-500/20';
    borderColor = 'border-orange-500/30';
    textColor = 'text-orange-600 dark:text-orange-400';
    icon = '▼';
  }
  // STRONG BUY: Uptrend + golden cross + bullish indicators
  else if (
    trendStructure === 'UPTREND' &&
    rsi >= 50 && rsi <= 70 &&
    isAbove50MA &&
    isAbove200MA &&
    isSupertrendBullish &&
    aboveBBMiddle3Days &&
    macdBullish &&
    volumeHigh
  ) {
    recommendation = 'STRONG BUY';
    bgColor = 'bg-[#ff8c42]/20';
    borderColor = 'border-[#ff8c42]/30';
    textColor = 'text-[#ff8c42]';
    icon = '▲▲';
  }
  // BUY: Good momentum building
  else if (
    (trendStructure === 'UPTREND' || trendStructure === 'SIDEWAYS') &&
    rsi > 50 &&
    isAbove50MA &&
    (aboveBBMiddle3Days || macdBullish)
  ) {
    recommendation = 'BUY';
    bgColor = 'bg-green-500/20';
    borderColor = 'border-green-500/30';
    textColor = 'text-green-600 dark:text-green-400';
    icon = '▲';
  }
  // HOLD: Consolidation or mixed signals
  else if (
    trendStructure === 'SIDEWAYS' &&
    rsi >= 40 && rsi <= 60 &&
    isAbove50MA
  ) {
    recommendation = 'HOLD';
    bgColor = 'bg-blue-500/20';
    borderColor = 'border-blue-500/30';
    textColor = 'text-blue-600 dark:text-blue-400';
    icon = '■';
  }

  return { recommendation, bgColor, borderColor, textColor, icon };
}
