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
  const rsi = technical.rsi ?? technical.rsi14;
  const momentumScore = [
    signals.goldenCross === true,
    signals.macdBullish === true,
    (technical.macdHistogram !== undefined && technical.macdHistogram !== null) && technical.macdHistogram > 0, // Histogram positive (momentum increasing)
    (rsi !== undefined && rsi !== null) && rsi >= 50, // RSI above 50 = positive momentum (no upper limit for growth)
    signals.priceCrossEMA50 === 'above',
    signals.supertrendBullish === true
  ].filter(Boolean).length;

  const conditions = {
    growthScore: growthScore >= 3,
    // Use hybrid PEG (Indian market context) - prefer pegHybrid < 1.5 for growth stocks
    // Falls back to legacy pegRatio if pegHybrid not available
    pegRatio: fundamental.pegRatios?.pegHybrid !== undefined && fundamental.pegRatios?.pegHybrid !== null
      ? fundamental.pegRatios.pegHybrid < 1.5
      : (fundamental.pegRatio === null || fundamental.pegRatio < 2.0),
    momentumScore: momentumScore >= 3,
    priceBelowEMA50: signals.priceCrossEMA50 === 'above',
    priceBelowSMA200: signals.priceCrossSMA200 === 'above',
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
  const rsi = technical.rsi ?? technical.rsi14;
  const momentumLossScore = [
    signals.macdBearish === true,
    (rsi !== undefined && rsi !== null) && rsi < 40,
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
    rsiOverbought: signals.rsiOverbought === true || ((rsi !== undefined && rsi !== null) && rsi > 75),

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
