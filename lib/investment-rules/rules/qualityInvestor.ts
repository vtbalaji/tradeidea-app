/**
 * QUALITY INVESTOR RULES
 *
 * Focus: High-quality businesses with strong competitive moats
 * Time Horizon: Long-term (3-10 years)
 * Risk: Low-Medium
 */

import { TechnicalSignals, TechnicalData, FundamentalData, EntryAnalysis, ExitAnalysis } from '../types';

export function checkQualityInvestorEntry(
  signals: TechnicalSignals,
  technical: TechnicalData,
  fundamental: FundamentalData
): EntryAnalysis {
  // Quality score (need at least 5 of 7)
  const qualityScore = [
    fundamental.operatingMargins !== null && fundamental.operatingMargins >= 25,
    fundamental.profitMargins !== null && fundamental.profitMargins >= 20,
    fundamental.fundamentalRating ? ['GOOD', 'EXCELLENT'].includes(fundamental.fundamentalRating) : false,
    fundamental.fundamentalScore ? fundamental.fundamentalScore >= 65 : false,
    fundamental.debtToEquity !== null && fundamental.debtToEquity < 1.5,
    fundamental.earningsGrowth !== null && fundamental.earningsGrowth >= 10,
    fundamental.dividendYield !== null && fundamental.dividendYield > 0
  ].filter(Boolean).length;

  // Technical confirmation score (need at least 3 of 5)
  const rsi = technical.rsi ?? technical.rsi14;
  const technicalScore = [
    signals.priceCrossSMA200 === 'above',
    signals.macdBullish === true,
    (rsi !== undefined && rsi !== null) && rsi >= 45 && rsi <= 65,
    signals.supertrendBullish === true,
    technical.overallSignal ? ['STRONG_BUY', 'BUY'].includes(technical.overallSignal) : false
  ].filter(Boolean).length;

  const conditions = {
    qualityScore: qualityScore >= 5,
    beta: fundamental.beta !== null && fundamental.beta > 0 && fundamental.beta < 1.0,
    earningsGrowth: fundamental.earningsGrowth !== null && fundamental.earningsGrowth >= 8,
    quarterlyGrowth: fundamental.earningsQuarterlyGrowth !== null &&
                     fundamental.earningsQuarterlyGrowth >= 10,
    // marketCap: fundamental.marketCap !== null && fundamental.marketCap > 100000000000, // >100B
    technicalConfirmation: technicalScore >= 3,
    // Forward PE: ignore if negative or > 100 (unreliable)
    forwardPE: fundamental.forwardPE !== null && fundamental.forwardPE > 0 && fundamental.forwardPE < 100 ?
      fundamental.forwardPE < 50 : true,
    priceToBook: fundamental.priceToBook !== null && fundamental.priceToBook > 0 && fundamental.priceToBook < 10
  };

  const allMet = Object.values(conditions).every(v => v === true);

  return {
    canEnter: allMet,
    conditions,
    met: Object.values(conditions).filter(v => v === true).length,
    total: Object.keys(conditions).length,
    failedConditions: Object.keys(conditions).filter(k => !conditions[k]),
    scores: { qualityScore, technicalScore }
  };
}

export function checkQualityInvestorExit(
  signals: TechnicalSignals,
  technical: TechnicalData,
  fundamental: FundamentalData,
  entryPrice: number,
  holdingDays: number
): ExitAnalysis {
  // Quality deterioration score (exit if 2+ signals)
  const qualityDetScore = [
    fundamental.operatingMargins !== null && fundamental.operatingMargins < 15,
    fundamental.profitMargins !== null && fundamental.profitMargins < 10,
    fundamental.fundamentalScore ? fundamental.fundamentalScore < 55 : false,
    fundamental.debtToEquity !== null && fundamental.debtToEquity > 2.0
  ].filter(Boolean).length;

  const exitConditions = {
    // Long-term profit target
    profitTarget: (technical.lastPrice / entryPrice) >= 2.0,

    // Quality deterioration
    qualityDeterioration: qualityDetScore >= 2,

    // Growth concerns
    earningsDecline: fundamental.earningsGrowth !== null && fundamental.earningsGrowth < 5,
    revenueDecline: fundamental.revenueGrowth !== null && fundamental.revenueGrowth < 0,

    // Overvaluation (only if PE is reliable)
    overvaluedPE: fundamental.forwardPE !== null && fundamental.forwardPE > 0 &&
                  fundamental.forwardPE < 100 && fundamental.forwardPE > 60,
    overvaluedPB: fundamental.priceToBook !== null && fundamental.priceToBook > 0 &&
                  fundamental.priceToBook > 15,

    // Major technical breakdown
    majorBreakdown: signals.deathCross === true && signals.priceCrossSMA200 === 'below',

    // Stop loss (wider for quality stocks)
    stopLoss: (technical.lastPrice / entryPrice) <= 0.75,

    // Rating downgrade
    ratingDowngrade: fundamental.fundamentalRating ?
      ['POOR', 'WEAK'].includes(fundamental.fundamentalRating) : false,

    // Time-based review (3 years)
    holdingReview: holdingDays > 1095
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
