/**
 * Investment Rule Engine - Main Engine
 *
 * Orchestrates all investor type rules and provides a unified interface
 * for checking entry/exit conditions across different investment strategies
 */

import {
  InvestorType,
  TechnicalSignals,
  TechnicalData,
  FundamentalData,
  EntryAnalysis,
  ExitAnalysis,
  InvestorRecommendation,
  PositionData
} from './types';

import { checkValueInvestorEntry, checkValueInvestorExit } from './rules/valueInvestor';
import { checkGrowthInvestorEntry, checkGrowthInvestorExit } from './rules/growthInvestor';
import { checkMomentumTraderEntry, checkMomentumTraderExit } from './rules/momentumTrader';
import { checkQualityInvestorEntry, checkQualityInvestorExit } from './rules/qualityInvestor';
import { checkDividendInvestorEntry, checkDividendInvestorExit } from './rules/dividendInvestor';

export class InvestmentRuleEngine {
  private signals: TechnicalSignals;
  private technical: TechnicalData;
  private fundamental: FundamentalData;

  constructor(
    signals: TechnicalSignals,
    technical: TechnicalData,
    fundamental: FundamentalData
  ) {
    this.signals = signals;
    this.technical = technical;
    this.fundamental = fundamental;
  }

  /**
   * Build technical signals from technical data
   * Maps from TechnicalData structure to TechnicalSignals
   */
  static buildSignals(technical: TechnicalData): TechnicalSignals {
    return {
      // Price vs Moving Averages
      priceCrossSMA200: technical.lastPrice > technical.sma200 ? 'above' : 'below',
      priceCrossEMA50: technical.lastPrice > technical.ema50 ? 'above' : 'below',
      priceCrossSMA100: technical.sma100 ?
        (technical.lastPrice > technical.sma100 ? 'above' : 'below') : null,

      // Trend Indicators
      goldenCross: technical.ema50 > technical.sma200,
      deathCross: technical.ema50 < technical.sma200,

      // MACD
      macdBullish: technical.macd > 0 && technical.macdHistogram > 0,
      macdBearish: technical.macd < 0 || technical.macdHistogram < 0,

      // RSI
      rsiOverbought: technical.rsi14 > 70,
      rsiOversold: technical.rsi14 < 30,

      // Volume
      volumeSpike: technical.volume > (technical.avgVolume20 * 1.5),
      volume: technical.volume,

      // Supertrend (if available)
      supertrendBullish: undefined,
      supertrendBearish: undefined,
      supertrend: undefined,

      // Moving Average values
      sma20: technical.sma20,
      sma50: technical.sma50,
      sma100: technical.sma100,
      sma200: technical.sma200,
      ema50: technical.ema50,

      // EMA Cross
      ema50CrossSMA200: technical.ema50 > technical.sma200 ? 'above' : 'below'
    };
  }

  /**
   * Check entry conditions for a specific investor type
   */
  checkEntry(investorType: InvestorType): EntryAnalysis {
    const methods = {
      'value': () => checkValueInvestorEntry(this.signals, this.technical, this.fundamental),
      'growth': () => checkGrowthInvestorEntry(this.signals, this.technical, this.fundamental),
      'momentum': () => checkMomentumTraderEntry(this.signals, this.technical, this.fundamental),
      'quality': () => checkQualityInvestorEntry(this.signals, this.technical, this.fundamental),
      'dividend': () => checkDividendInvestorEntry(this.signals, this.technical, this.fundamental)
    };

    return methods[investorType]();
  }

  /**
   * Check exit conditions for a specific investor type
   */
  checkExit(investorType: InvestorType, positionData: PositionData): ExitAnalysis {
    const currentDate = new Date();
    const entryDateTime = new Date(positionData.entryDate);
    const holdingDays = Math.floor((currentDate.getTime() - entryDateTime.getTime()) / (1000 * 60 * 60 * 24));

    const methods = {
      'value': () => checkValueInvestorExit(
        this.signals,
        this.technical,
        this.fundamental,
        positionData.entryPrice,
        holdingDays
      ),
      'growth': () => checkGrowthInvestorExit(
        this.signals,
        this.technical,
        this.fundamental,
        positionData.entryPrice,
        positionData.highestPrice
      ),
      'momentum': () => checkMomentumTraderExit(
        this.signals,
        this.technical,
        this.fundamental,
        positionData.entryPrice,
        positionData.highestPrice,
        holdingDays
      ),
      'quality': () => checkQualityInvestorExit(
        this.signals,
        this.technical,
        this.fundamental,
        positionData.entryPrice,
        holdingDays
      ),
      'dividend': () => checkDividendInvestorExit(
        this.signals,
        this.technical,
        this.fundamental,
        positionData.entryPrice,
        holdingDays
      )
    };

    return methods[investorType]();
  }

  /**
   * Get all investor types
   */
  getAllInvestorTypes(): InvestorType[] {
    return ['value', 'growth', 'momentum', 'quality', 'dividend'];
  }

  /**
   * Check entry conditions for all investor types
   */
  checkAllInvestorTypes(): { [key in InvestorType]: EntryAnalysis } {
    const results = {} as { [key in InvestorType]: EntryAnalysis };
    this.getAllInvestorTypes().forEach(type => {
      results[type] = this.checkEntry(type);
    });
    return results;
  }

  /**
   * Get overall recommendation with suitable investor types
   */
  getRecommendation(): InvestorRecommendation {
    const all = this.checkAllInvestorTypes();
    const suitable = Object.keys(all).filter(type => all[type as InvestorType].canEnter) as InvestorType[];

    return {
      suitableFor: suitable,
      notSuitableFor: Object.keys(all).filter(type => !all[type as InvestorType].canEnter) as InvestorType[],
      details: all,
      bestMatch: suitable.length > 0 ? suitable[0] : null
    };
  }
}

/**
 * Factory function to create an engine instance from technical + fundamental data
 */
export function createInvestmentEngine(
  technical: TechnicalData,
  fundamental: FundamentalData
): InvestmentRuleEngine {
  const signals = InvestmentRuleEngine.buildSignals(technical);
  return new InvestmentRuleEngine(signals, technical, fundamental);
}

// Export types for convenience
export * from './types';
