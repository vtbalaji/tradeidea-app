/**
 * DIVIDEND INVESTOR RULES
 *
 * Focus: Income generation through stable dividend-paying stocks
 * Time Horizon: Very Long-term (5+ years)
 * Risk: Low
 */

import { TechnicalSignals, TechnicalData, FundamentalData, EntryAnalysis, ExitAnalysis } from '../types';

export function checkDividendInvestorEntry(
  signals: TechnicalSignals,
  technical: TechnicalData,
  fundamental: FundamentalData
): EntryAnalysis {
  // Stability score (need at least 4 of 5)
  const stabilityScore = [
    fundamental.debtToEquity !== null && fundamental.debtToEquity < 1.2,
    fundamental.beta !== null && fundamental.beta < 0.8,
    fundamental.profitMargins !== null && fundamental.profitMargins >= 10,
    fundamental.fundamentalScore ? fundamental.fundamentalScore >= 60 : false,
    fundamental.currentRatio !== null && fundamental.currentRatio >= 1.5
  ].filter(Boolean).length;

  // Technical confirmation score (need at least 2 of 3)
  const rsi = technical.rsi ?? technical.rsi14;
  const technicalScore = [
    signals.priceCrossSMA200 === 'above',
    (rsi !== undefined && rsi !== null) && rsi >= 35 && rsi <= 65,
    signals.macdBullish === true
  ].filter(Boolean).length;

  const conditions = {
    dividendYield: fundamental.dividendYield !== null && fundamental.dividendYield >= 2.5,
    payoutRatio: fundamental.payoutRatio !== null &&
                 fundamental.payoutRatio > 0 &&
                 fundamental.payoutRatio <= 70,
    stabilityScore: stabilityScore >= 4,
    earningsGrowth: fundamental.earningsGrowth !== null && fundamental.earningsGrowth >= 0,
    // Forward PE: ignore if negative or > 100 (unreliable)
    forwardPE: fundamental.forwardPE !== null && fundamental.forwardPE > 0 && fundamental.forwardPE < 100 ?
      fundamental.forwardPE < 25 : true,
    priceToBook: fundamental.priceToBook !== null && fundamental.priceToBook > 0 && fundamental.priceToBook < 5,
    technicalConfirmation: technicalScore >= 2
  };

  const allMet = Object.values(conditions).every(v => v === true);

  return {
    canEnter: allMet,
    conditions,
    met: Object.values(conditions).filter(v => v === true).length,
    total: Object.keys(conditions).length,
    failedConditions: Object.keys(conditions).filter(k => !conditions[k]),
    scores: { stabilityScore, technicalScore }
  };
}

export function checkDividendInvestorExit(
  signals: TechnicalSignals,
  technical: TechnicalData,
  fundamental: FundamentalData,
  entryPrice: number,
  holdingDays: number
): ExitAnalysis {
  const rsi = technical.rsi ?? technical.rsi14;
  // Financial distress score (exit if 2+ signals)
  const distressScore = [
    fundamental.debtToEquity !== null && fundamental.debtToEquity > 2.0,
    fundamental.profitMargins !== null && fundamental.profitMargins < 5,
    fundamental.earningsGrowth !== null && fundamental.earningsGrowth < -10
  ].filter(Boolean).length;

  const exitConditions = {
    // Dividend concerns
    dividendCut: fundamental.dividendYield !== null && fundamental.dividendYield < 1.5,
    unsustainablePayout: fundamental.payoutRatio !== null && fundamental.payoutRatio > 90,

    // Financial distress
    financialDistress: distressScore >= 2,

    // Stop loss (wider for dividend stocks)
    stopLoss: (technical.lastPrice / entryPrice) <= 0.70,

    // Severe technical breakdown
    severeBreakdown: signals.deathCross === true &&
                    ((rsi !== undefined && rsi !== null) && rsi < 30),

    // Time-based review (5 years)
    holdingReview: holdingDays > 1825
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
