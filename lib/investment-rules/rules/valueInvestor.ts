/**
 * VALUE INVESTOR RULES
 *
 * Focus: Buying undervalued stocks with strong fundamentals
 * Time Horizon: Long-term (2-5 years)
 * Risk: Medium
 */

import { TechnicalSignals, TechnicalData, FundamentalData, EntryAnalysis, ExitAnalysis } from '../types';

export function checkValueInvestorEntry(
  signals: TechnicalSignals,
  technical: TechnicalData,
  fundamental: FundamentalData
): EntryAnalysis {
  const conditions = {
    // Valuation Metrics
    priceToBook: fundamental.priceToBook !== null && fundamental.priceToBook > 0 && fundamental.priceToBook < 5.0,
    priceToSales: fundamental.priceToSales !== null && fundamental.priceToSales > 0 && fundamental.priceToSales < 5.0,
    // Forward PE: ignore if negative or > 100 (unreliable), otherwise < 20
    forwardPE: fundamental.forwardPE !== null && fundamental.forwardPE > 0 && fundamental.forwardPE < 100 ?
      fundamental.forwardPE < 20.0 : true, // Don't fail if unreliable, rely on trailing PE
    trailingPE: fundamental.trailingPE !== null && fundamental.trailingPE > 0 && fundamental.trailingPE < 25.0,

    // Quality Metrics
    // fundamentalRating: fundamental.fundamentalRating ?
    //   ['GOOD', 'EXCELLENT'].includes(fundamental.fundamentalRating) : false,
    fundamentalScore: fundamental.fundamentalScore ? fundamental.fundamentalScore >= 60 : false,
    profitMargins: fundamental.profitMargins !== null && fundamental.profitMargins >= 15,
    operatingMargins: fundamental.operatingMargins !== null && fundamental.operatingMargins >= 20,
    debtToEquity: fundamental.debtToEquity !== null && fundamental.debtToEquity >= 0 && fundamental.debtToEquity < 1.0,

    // Price not too far above SMA200
    priceVsSMA200: technical.lastPrice < (technical.sma200 * 1.10),

    // Technical Confirmation (at least 2 of 3)
    technicalConfirmation: [
      signals.priceCrossSMA200 === 'above',
      technical.rsi14 >= 30 && technical.rsi14 <= 60,
      technical.lastPrice < technical.bollingerUpper
    ].filter(Boolean).length >= 2
  };

  const allMet = Object.values(conditions).every(v => v === true);

  return {
    canEnter: allMet,
    conditions,
    met: Object.values(conditions).filter(v => v === true).length,
    total: Object.keys(conditions).length,
    failedConditions: Object.keys(conditions).filter(k => !conditions[k])
  };
}

export function checkValueInvestorExit(
  signals: TechnicalSignals,
  technical: TechnicalData,
  fundamental: FundamentalData,
  entryPrice: number,
  holdingDays: number
): ExitAnalysis {
  const exitConditions = {
    // Profit target reached
    profitTarget: (technical.lastPrice / entryPrice) >= 1.50,

    // Overvaluation (only if PE is reliable)
    overvalued_PE: fundamental.forwardPE !== null && fundamental.forwardPE > 0 &&
                   fundamental.forwardPE < 100 && fundamental.forwardPE > 30,
    overvalued_PB: fundamental.priceToBook !== null && fundamental.priceToBook > 0 &&
                   fundamental.priceToBook > 5.0,

    // Fundamental deterioration
    fundamentalDeterioration: fundamental.fundamentalScore ? fundamental.fundamentalScore < 50 : false,
    lowProfitMargins: fundamental.profitMargins !== null && fundamental.profitMargins < 10,

    // Stop loss
    stopLoss: (technical.lastPrice / entryPrice) <= 0.85,

    // Technical breakdown
    deathCross: signals.deathCross === true,
    belowSMA200: signals.priceCrossSMA200 === 'below',

    // Time-based review (2 years)
    holdingPeriodReview: holdingDays > 730
  };

  const shouldExit = Object.values(exitConditions).some(v => v === true);
  const triggerReasons = Object.keys(exitConditions).filter(k => exitConditions[k]);

  return {
    shouldExit,
    conditions: exitConditions,
    triggerReasons,
    currentReturn: ((technical.lastPrice / entryPrice - 1) * 100).toFixed(2) + '%'
  };
}
