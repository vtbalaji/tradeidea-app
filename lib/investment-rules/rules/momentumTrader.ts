/**
 * MOMENTUM TRADER RULES
 *
 * Focus: Riding short-term trends with strong technical signals
 * Time Horizon: Short-term (days - 2 months)
 * Risk: Very High
 */

import { TechnicalSignals, TechnicalData, FundamentalData, EntryAnalysis, ExitAnalysis } from '../types';

export function checkMomentumTraderEntry(
  signals: TechnicalSignals,
  technical: TechnicalData,
  fundamental: FundamentalData
): EntryAnalysis {
  // Momentum score (need at least 5 of 7)
  const momentumScore = [
    signals.goldenCross === true,
    signals.macdBullish === true,
    technical.macdHistogram > technical.macdSignal,
    technical.rsi14 >= 50 && technical.rsi14 <= 70,
    signals.supertrendBullish === true,
    signals.ema50CrossSMA200 === 'above',
    technical.lastPrice > technical.ema9
  ].filter(Boolean).length;

  const conditions = {
    momentumSignals: momentumScore >= 5,
    priceAboveSMA20: technical.lastPrice > technical.sma20,
    priceAboveSMA50: technical.lastPrice > technical.sma50,
    rsiNotOverbought: technical.rsi14 < 70,
    withinBollingerBands: technical.lastPrice < technical.bollingerUpper &&
                          technical.lastPrice > technical.bollingerLower,
    volumeConfirmation: signals.volumeSpike === true ||
                        (technical.volume / technical.avgVolume20) >= 0.8,
    // positiveChange: technical.changePercent > 0,
    aboveSupertrend: technical.supertrend ? technical.lastPrice > technical.supertrend : false
  };

  const allMet = Object.values(conditions).every(v => v === true);

  return {
    canEnter: allMet,
    conditions,
    met: Object.values(conditions).filter(v => v === true).length,
    total: Object.keys(conditions).length,
    failedConditions: Object.keys(conditions).filter(k => !conditions[k]),
    scores: { momentumScore }
  };
}

export function checkMomentumTraderExit(
  signals: TechnicalSignals,
  technical: TechnicalData,
  fundamental: FundamentalData,
  entryPrice: number,
  highestPrice: number,
  holdingDays: number
): ExitAnalysis {
  // Momentum reversal score (exit if 3+ signals)
  const momentumReversalScore = [
    signals.macdBearish === true,
    technical.macd < 0,
    technical.rsi14 > 70 || technical.rsi14 < 30,
    signals.supertrendBearish === true,
    technical.lastPrice < technical.ema9,
    signals.priceCrossEMA50 === 'below'
  ].filter(Boolean).length;

  const exitConditions = {
    // Quick profit targets
    profitTarget5: (technical.lastPrice / entryPrice) >= 1.05,
    profitTarget10: (technical.lastPrice / entryPrice) >= 1.10,

    // Tight trailing stop
    trailingStop: highestPrice > entryPrice && technical.lastPrice < (highestPrice * 0.95),

    // Momentum reversal
    momentumReversal: momentumReversalScore >= 3,

    // Below key moving averages
    belowSMA20: technical.lastPrice < technical.sma20,
    belowSupertrend: technical.supertrend ? technical.lastPrice < technical.supertrend : false,

    // Tight stop loss
    stopLoss: (technical.lastPrice / entryPrice) <= 0.97,

    // Time exit (max 60 days)
    timeExit: holdingDays > 60,

    // Low volume (momentum dying)
    lowVolume: (technical.volume / technical.avgVolume20) < 0.3
  };

  const shouldExit = Object.values(exitConditions).some(v => v === true);
  const triggerReasons = Object.keys(exitConditions).filter(k => exitConditions[k]);

  return {
    shouldExit,
    conditions: exitConditions,
    triggerReasons,
    currentReturn: ((technical.lastPrice / entryPrice - 1) * 100).toFixed(2) + '%',
    holdingDays
  };
}
