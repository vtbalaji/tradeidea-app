/**
 * Investment Rule Engine - Type Definitions
 *
 * Defines interfaces for investor types, entry/exit conditions, and analysis results
 */

export type InvestorType = 'value' | 'growth' | 'momentum' | 'quality' | 'dividend';

export interface TechnicalSignals {
  // Price vs Moving Averages
  priceCrossSMA200: 'above' | 'below' | null;
  priceCrossEMA50: 'above' | 'below' | null;
  priceCrossSMA100?: 'above' | 'below' | null;

  // Trend Indicators
  goldenCross: boolean;
  deathCross: boolean;

  // MACD
  macdBullish: boolean;
  macdBearish: boolean;

  // RSI
  rsiOverbought: boolean;
  rsiOversold: boolean;

  // Volume
  volumeSpike: boolean;
  volume: number;

  // Supertrend
  supertrendBullish?: boolean;
  supertrendBearish?: boolean;
  supertrend?: number;

  // Moving Average values
  sma20: number;
  sma50: number;
  sma100?: number;
  sma200: number;
  ema50: number;

  // EMA Cross
  ema50CrossSMA200?: 'above' | 'below' | null;
}

export interface TechnicalData {
  lastPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;

  // Moving Averages
  sma20: number;
  sma50: number;
  sma100?: number;
  sma200: number;
  ema9: number;
  ema21: number;
  ema50: number;

  // Oscillators
  rsi14: number;

  // Bollinger Bands
  bollingerUpper: number;
  bollingerMiddle: number;
  bollingerLower: number;

  // MACD
  macd: number;
  macdSignal: number;
  macdHistogram: number;

  // Volume
  volume: number;
  avgVolume20: number;

  // Overall signal
  overallSignal?: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';

  // Metadata
  updatedAt?: Date;
  dataPoints?: number;
}

export interface FundamentalData {
  symbol: string;
  companyName?: string;
  sector?: string;
  industry?: string;

  // Valuation Ratios
  trailingPE: number | null;
  forwardPE: number | null;
  pegRatio: number | null;
  priceToBook: number | null;
  priceToSales: number | null;

  // Financial Health
  debtToEquity: number | null;
  currentRatio: number | null;
  quickRatio: number | null;

  // Profitability
  returnOnEquity: number | null;  // ROE (%)
  returnOnAssets: number | null;  // ROA (%)
  profitMargins: number | null;  // Net profit margin (%)
  operatingMargins: number | null;  // Operating margin (%)

  // Growth
  earningsGrowth: number | null;  // (%)
  revenueGrowth: number | null;  // (%)
  earningsQuarterlyGrowth: number | null;  // (%)

  // Dividends
  dividendYield: number | null;  // (%)
  payoutRatio: number | null;  // (%)

  // Market Data
  marketCap: number | null;
  beta: number | null;

  // Fundamental Score
  fundamentalScore?: number;
  fundamentalRating?: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'WEAK' | 'POOR';
}

export interface EntryConditions {
  [key: string]: boolean;
}

export interface ExitConditions {
  [key: string]: boolean;
}

export interface EntryAnalysis {
  canEnter: boolean;
  conditions: EntryConditions;
  met: number;
  total: number;
  failedConditions: string[];
  scores?: { [key: string]: number };
}

export interface ExitAnalysis {
  shouldExit: boolean;
  conditions: ExitConditions;
  triggerReasons: string[];
  currentReturn: string;
  drawdownFromPeak?: string;
  holdingDays?: number;
}

export interface InvestorRecommendation {
  suitableFor: InvestorType[];
  notSuitableFor: InvestorType[];
  details: { [key in InvestorType]: EntryAnalysis };
  bestMatch: InvestorType | null;
}

export interface PositionData {
  entryPrice: number;
  entryDate: string;
  highestPrice: number;
}
