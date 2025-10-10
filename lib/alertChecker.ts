/**
 * Alert Checker Utility
 * Common logic for checking price alerts for ideas and portfolio positions
 */

import { Timestamp } from 'firebase/firestore';

interface TechnicalData {
  lastPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  sma20: number;
  sma50: number;
  sma200: number;
  ema9: number;
  ema21: number;
  ema50: number;
  rsi14: number;
  bollingerUpper: number;
  bollingerMiddle: number;
  bollingerLower: number;
  macd: number;
  macdSignal: number;
  macdHistogram: number;
  volume: number;
  avgVolume20: number;
}

interface FundamentalData {
  // Add fundamental fields as needed
  marketCap?: number;
  peRatio?: number;
  pbRatio?: number;
  debtToEquity?: number;
  roe?: number;
  eps?: number;
}

interface ExitCriteria {
  exitBelow50EMA?: boolean;
  exitBelow100MA?: boolean;
  exitBelow200MA?: boolean;
  exitBelowPrice?: number | null;
  exitAtStopLoss?: boolean;
  exitAtTarget?: boolean;
  exitOnWeeklySupertrend?: boolean;
  customNote?: string;
}

interface AlertNotification {
  type: 'entry_alert' | 'target_alert' | 'stoploss_alert';
  message: string;
  shouldTrigger: boolean;
  metadata?: {
    currentPrice: number;
    triggerPrice?: number;
    triggerReason?: string;
  };
}

/**
 * Check if idea entry price is hit (within 1% variance)
 */
export function checkIdeaEntryAlert(
  symbol: string,
  entryPrice: number,
  currentPrice: number,
  technicals?: TechnicalData,
  fundamentals?: FundamentalData
): AlertNotification {
  if (!currentPrice || !entryPrice) {
    return { type: 'entry_alert', message: '', shouldTrigger: false };
  }

  // Calculate variance percentage
  const variance = Math.abs((currentPrice - entryPrice) / entryPrice);

  // Check if price is within 1% of entry price
  if (variance <= 0.01) {
    return {
      type: 'entry_alert',
      message: `${symbol} reached entry price! Current: ₹${currentPrice.toFixed(2)}, Entry: ₹${entryPrice} - TradeIdea`,
      shouldTrigger: true,
      metadata: {
        currentPrice,
        triggerPrice: entryPrice,
        triggerReason: '1% variance'
      }
    };
  }

  return { type: 'entry_alert', message: '', shouldTrigger: false };
}

/**
 * Check if portfolio target is reached
 */
export function checkTargetAlert(
  symbol: string,
  targetPrice: number,
  currentPrice: number,
  technicals?: TechnicalData,
  fundamentals?: FundamentalData
): AlertNotification {
  if (!currentPrice || !targetPrice) {
    return { type: 'target_alert', message: '', shouldTrigger: false };
  }

  if (currentPrice >= targetPrice) {
    return {
      type: 'target_alert',
      message: `${symbol} reached target price! Current: ₹${currentPrice.toFixed(2)}, Target: ₹${targetPrice} - TradeIdea`,
      shouldTrigger: true,
      metadata: {
        currentPrice,
        triggerPrice: targetPrice,
        triggerReason: 'target reached'
      }
    };
  }

  return { type: 'target_alert', message: '', shouldTrigger: false };
}

/**
 * Check if stop loss is hit (with 100MA fallback)
 */
export function checkStopLossAlert(
  symbol: string,
  stopLossPrice: number | undefined,
  currentPrice: number,
  technicals?: TechnicalData,
  fundamentals?: FundamentalData
): AlertNotification {
  if (!currentPrice) {
    return { type: 'stoploss_alert', message: '', shouldTrigger: false };
  }

  let triggerPrice = stopLossPrice;
  let triggerReason = 'stop loss';

  // If no stop loss defined, use 100MA as fallback (using sma200 as proxy for 100MA)
  if (!triggerPrice && technicals?.sma200) {
    triggerPrice = technicals.sma200;
    triggerReason = '100MA';
  }

  if (triggerPrice && currentPrice <= triggerPrice) {
    return {
      type: 'stoploss_alert',
      message: `${symbol} hit ${triggerReason}! Current: ₹${currentPrice.toFixed(2)}, ${triggerReason === '100MA' ? '100MA' : 'SL'}: ₹${triggerPrice.toFixed(2)} - TradeIdea`,
      shouldTrigger: true,
      metadata: {
        currentPrice,
        triggerPrice,
        triggerReason
      }
    };
  }

  return { type: 'stoploss_alert', message: '', shouldTrigger: false };
}

/**
 * Check exit criteria alerts (50EMA, 100MA, 200MA)
 */
export function checkExitCriteriaAlerts(
  symbol: string,
  exitCriteria: ExitCriteria | undefined,
  currentPrice: number,
  technicals?: TechnicalData,
  fundamentals?: FundamentalData
): AlertNotification[] {
  const alerts: AlertNotification[] = [];

  if (!exitCriteria || !currentPrice || !technicals) {
    return alerts;
  }

  // Check 50 EMA exit
  if (exitCriteria.exitBelow50EMA && technicals.ema50 && currentPrice < technicals.ema50) {
    alerts.push({
      type: 'stoploss_alert',
      message: `${symbol} went below 50 EMA! Current: ₹${currentPrice.toFixed(2)}, 50 EMA: ₹${technicals.ema50.toFixed(2)} - TradeIdea`,
      shouldTrigger: true,
      metadata: {
        currentPrice,
        triggerPrice: technicals.ema50,
        triggerReason: '50 EMA'
      }
    });
  }

  // Check 100 MA exit (using sma200 as proxy)
  if (exitCriteria.exitBelow100MA && technicals.sma200 && currentPrice < technicals.sma200) {
    alerts.push({
      type: 'stoploss_alert',
      message: `${symbol} went below 100 MA! Current: ₹${currentPrice.toFixed(2)}, 100 MA: ₹${technicals.sma200.toFixed(2)} - TradeIdea`,
      shouldTrigger: true,
      metadata: {
        currentPrice,
        triggerPrice: technicals.sma200,
        triggerReason: '100 MA'
      }
    });
  }

  // Check 200 MA exit
  if (exitCriteria.exitBelow200MA && technicals.sma200 && currentPrice < technicals.sma200) {
    alerts.push({
      type: 'stoploss_alert',
      message: `${symbol} went below 200 MA! Current: ₹${currentPrice.toFixed(2)}, 200 MA: ₹${technicals.sma200.toFixed(2)} - TradeIdea`,
      shouldTrigger: true,
      metadata: {
        currentPrice,
        triggerPrice: technicals.sma200,
        triggerReason: '200 MA'
      }
    });
  }

  // Check custom exit price
  if (exitCriteria.exitBelowPrice && currentPrice < exitCriteria.exitBelowPrice) {
    alerts.push({
      type: 'stoploss_alert',
      message: `${symbol} went below exit price! Current: ₹${currentPrice.toFixed(2)}, Exit: ₹${exitCriteria.exitBelowPrice.toFixed(2)} - TradeIdea`,
      shouldTrigger: true,
      metadata: {
        currentPrice,
        triggerPrice: exitCriteria.exitBelowPrice,
        triggerReason: 'custom exit price'
      }
    });
  }

  return alerts;
}

/**
 * Main function to check all alerts for a position/idea
 */
export function checkAllAlerts(params: {
  type: 'idea' | 'portfolio';
  symbol: string;
  entryPrice?: number;
  targetPrice?: number;
  stopLossPrice?: number;
  currentPrice: number;
  exitCriteria?: ExitCriteria;
  technicals?: TechnicalData;
  fundamentals?: FundamentalData;
}): AlertNotification[] {
  const {
    type,
    symbol,
    entryPrice,
    targetPrice,
    stopLossPrice,
    currentPrice,
    exitCriteria,
    technicals,
    fundamentals
  } = params;

  const alerts: AlertNotification[] = [];

  // For ideas, check entry price alert
  if (type === 'idea' && entryPrice) {
    const entryAlert = checkIdeaEntryAlert(symbol, entryPrice, currentPrice, technicals, fundamentals);
    if (entryAlert.shouldTrigger) {
      alerts.push(entryAlert);
    }
  }

  // For portfolio, check target and stop loss
  if (type === 'portfolio') {
    // Check target
    if (targetPrice) {
      const targetAlert = checkTargetAlert(symbol, targetPrice, currentPrice, technicals, fundamentals);
      if (targetAlert.shouldTrigger) {
        alerts.push(targetAlert);
      }
    }

    // Check stop loss
    const stopLossAlert = checkStopLossAlert(symbol, stopLossPrice, currentPrice, technicals, fundamentals);
    if (stopLossAlert.shouldTrigger) {
      alerts.push(stopLossAlert);
    }

    // Check exit criteria
    const exitAlerts = checkExitCriteriaAlerts(symbol, exitCriteria, currentPrice, technicals, fundamentals);
    alerts.push(...exitAlerts);
  }

  return alerts;
}
