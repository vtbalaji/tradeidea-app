/**
 * GROWTH INVESTOR RULES
 *
 * Focus: High-growth companies with strong momentum
 * Time Horizon: Medium-term (6 months - 2 years)
 * Risk: High
 */

import { TechnicalSignals, TechnicalData, FundamentalData, EntryAnalysis, ExitAnalysis } from '../types';

export function checkGrowthInvestorEntry(
  signals: TechnicalSignals,
  technical: TechnicalData,
  fundamental: FundamentalData
): EntryAnalysis {
  // Growth score (need at least 3 of 4)
  const growthScore = [
    fundamental.earningsGrowth !== null && fundamental.earningsGrowth >= 15,
    fundamental.earningsQuarterlyGrowth !== null && fundamental.earningsQuarterlyGrowth >= 12,
    fundamental.revenueGrowth !== null && fundamental.revenueGrowth >= 8,
    technical.changePercent > 0
  ].filter(Boolean).length;

  // Momentum score (need at least 4 of 6)
  const momentumScore = [
    signals.goldenCross === true,
    signals.macdBullish === true,
    technical.macd > 0 && technical.macdHistogram > 0,
    technical.rsi14 >= 50 && technical.rsi14 <= 70,
    signals.priceCrossEMA50 === 'above',
    signals.supertrendBullish === true
  ].filter(Boolean).length;

  const conditions = {
    growthScore: growthScore >= 3,
    pegRatio: fundamental.pegRatio === null || fundamental.pegRatio < 2.0,
    momentumScore: momentumScore >= 4,
    priceAboveEMA50: signals.priceCrossEMA50 === 'above',
    priceAboveSMA200: signals.priceCrossSMA200 === 'above',
    volumeConfirmation: technical.lastPrice > 0 &&
                        (signals.volume / technical.avgVolume20) >= 0.5,
    overallSignal: technical.overallSignal ?
      ['STRONG_BUY', 'BUY'].includes(technical.overallSignal) : false
  };

  const allMet = Object.values(conditions).every(v => v === true);

  return {
    canEnter: allMet,
    conditions,
    met: Object.values(conditions).filter(v => v === true).length,
    total: Object.keys(conditions).length,
    failedConditions: Object.keys(conditions).filter(k => !conditions[k]),
    scores: { growthScore, momentumScore }
  };
}

export function checkGrowthInvestorExit(
  signals: TechnicalSignals,
  technical: TechnicalData,
  fundamental: FundamentalData,
  entryPrice: number,
  highestPrice: number
): ExitAnalysis {
  // Momentum loss score (exit if 3+ signals)
  const momentumLossScore = [
    signals.macdBearish === true,
    technical.rsi14 < 40,
    signals.deathCross === true,
    signals.priceCrossEMA50 === 'below',
    signals.supertrendBearish === true
  ].filter(Boolean).length;

  const exitConditions = {
    // Trailing stop from peak
    trailingStop: highestPrice > entryPrice && technical.lastPrice < (highestPrice * 0.85),

    // Growth slowdown
    earningsSlowdown: fundamental.earningsGrowth !== null && fundamental.earningsGrowth < 10,
    quarterlySlowdown: fundamental.earningsQuarterlyGrowth !== null &&
                       fundamental.earningsQuarterlyGrowth < 5,
    revenueSlowdown: fundamental.revenueGrowth !== null && fundamental.revenueGrowth < 5,

    // Momentum loss
    momentumLoss: momentumLossScore >= 3,

    // RSI overbought
    rsiOverbought: signals.rsiOverbought === true || technical.rsi14 > 75,

    // Stop loss
    stopLoss: (technical.lastPrice / entryPrice) <= 0.80,

    // Below key support
    belowSMA100: signals.priceCrossSMA100 === 'below'
  };

  const shouldExit = Object.values(exitConditions).some(v => v === true);
  const triggerReasons = Object.keys(exitConditions).filter(k => exitConditions[k]);

  return {
    shouldExit,
    conditions: exitConditions,
    triggerReasons,
    currentReturn: ((technical.lastPrice / entryPrice - 1) * 100).toFixed(2) + '%',
    drawdownFromPeak: ((technical.lastPrice / highestPrice - 1) * 100).toFixed(2) + '%'
  };
}
