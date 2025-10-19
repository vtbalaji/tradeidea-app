/**
 * Symbol Data Service
 *
 * Central service for managing technical and fundamental data for symbols.
 * This data is stored globally in Firestore so all users can access it immediately
 * when they add a position, without waiting for the EOD batch job.
 */

import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

// Technical Analysis Data Structure
export interface TechnicalData {
  symbol: string;
  currentPrice: number;

  // Moving Averages
  ema50: number | null;
  ma100: number | null;
  ma200: number | null;

  // Trend Indicators
  goldenCross: boolean;
  deathCross: boolean;
  above50EMA: boolean;
  above100MA: boolean;
  above200MA: boolean;

  // Supertrend
  weeklySupertrend: {
    value: number;
    trend: 'bullish' | 'bearish';
  } | null;

  // Momentum Indicators
  rsi: number | null;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  } | null;
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  } | null;

  // Metadata
  lastUpdated: Date;
  dataSource: string; // 'yahoo' | 'manual' | 'api'
}

// Fundamental Analysis Data Structure
// This matches the data from your Python batch job (analyze-fundamentals.py)
export interface FundamentalData {
  symbol: string;

  // Valuation Ratios (from Yahoo Finance)
  trailingPE: number | null;  // P/E ratio
  forwardPE: number | null;
  pegRatio: number | null;
  priceToBook: number | null;  // P/B ratio
  priceToSales: number | null;

  // Financial Health (from Yahoo Finance)
  debtToEquity: number | null;
  currentRatio: number | null;
  quickRatio: number | null;

  // Profitability (from Yahoo Finance)
  returnOnEquity: number | null;  // ROE (%)
  returnOnAssets: number | null;  // ROA (%)
  profitMargins: number | null;  // Net profit margin (%)
  operatingMargins: number | null;  // Operating margin (%)

  // Growth (from Yahoo Finance)
  earningsGrowth: number | null;  // (%)
  revenueGrowth: number | null;  // (%)
  earningsQuarterlyGrowth: number | null;  // (%)

  // Dividends (from Yahoo Finance)
  dividendYield: number | null;  // (%)
  payoutRatio: number | null;  // (%)

  // Market Data (from Yahoo Finance)
  marketCap: number | null;  // Market capitalization
  enterpriseValue: number | null;
  beta: number | null;

  // Company Info (from Yahoo Finance)
  companyName: string;
  sector: string | null;
  industry: string | null;
  longBusinessSummary: string | null;

  // Fundamental Analysis Score (calculated)
  fundamentalScore: number | null;  // 0-100
  fundamentalRating: string | null;  // EXCELLENT, GOOD, AVERAGE, POOR, WEAK

  // Graham Number (Value Investing)
  grahamNumber: number | null;  // Fair value estimate
  priceToGraham: number | null;  // Price/Graham ratio

  // Piotroski F-Score (Financial Strength)
  piotroskiScore: number | null;  // 0-9

  // Metadata
  lastUpdated: Date;
  dataSource: string;
}

// Combined Symbol Data
export interface SymbolData {
  symbol: string;
  technical: TechnicalData | null;
  fundamental: FundamentalData | null;
  lastFetched: Date;
}

/**
 * Fetch technical data for a symbol from Firestore symbols collection
 */
export async function getSymbolTechnicalData(symbol: string): Promise<TechnicalData | null> {
  try {
    const symbolDoc = await getDoc(doc(db, 'symbols', symbol.toUpperCase()));

    if (!symbolDoc.exists()) {
      console.log(`No technical data found for ${symbol}`);
      return null;
    }

    const data = symbolDoc.data();
    if (!data.technical) {
      return null;
    }

    return {
      ...data.technical,
      lastUpdated: data.technical.lastUpdated?.toDate() || new Date(),
    };
  } catch (error) {
    console.error(`Error fetching technical data for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch fundamental data for a symbol from Firestore symbols collection
 */
export async function getSymbolFundamentalData(symbol: string): Promise<FundamentalData | null> {
  try {
    const symbolDoc = await getDoc(doc(db, 'symbols', symbol.toUpperCase()));

    if (!symbolDoc.exists()) {
      console.log(`No fundamental data found for ${symbol}`);
      return null;
    }

    const data = symbolDoc.data();
    if (!data.fundamental) {
      return null;
    }

    return {
      ...data.fundamental,
      lastUpdated: data.fundamental.lastUpdated?.toDate() || new Date(),
    };
  } catch (error) {
    console.error(`Error fetching fundamental data for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch complete symbol data (technical + fundamental) from symbols collection
 */
export async function getSymbolData(symbol: string): Promise<SymbolData | null> {
  try {
    const symbolDoc = await getDoc(doc(db, 'symbols', symbol.toUpperCase()));

    if (!symbolDoc.exists()) {
      console.log(`No data found for ${symbol}`);
      return null;
    }

    const data = symbolDoc.data();

    return {
      symbol: symbol.toUpperCase(),
      technical: data.technical ? {
        ...data.technical,
        lastUpdated: data.technical.lastUpdated?.toDate() || new Date(),
      } : null,
      fundamental: data.fundamental ? {
        ...data.fundamental,
        lastUpdated: data.fundamental.lastUpdated?.toDate() || new Date(),
      } : null,
      lastFetched: data.lastFetched?.toDate() || new Date(),
    };
  } catch (error) {
    console.error(`Error fetching symbol data for ${symbol}:`, error);
    return null;
  }
}

/**
 * Save/Update technical data for a symbol in symbols collection
 * This should be called by your EOD batch job
 */
export async function saveSymbolTechnicalData(
  symbol: string,
  technicalData: Omit<TechnicalData, 'lastUpdated'>
): Promise<void> {
  try {
    const symbolRef = doc(db, 'symbols', symbol.toUpperCase());
    const symbolDoc = await getDoc(symbolRef);

    const dataToSave = {
      ...technicalData,
      lastUpdated: serverTimestamp(),
    };

    if (!symbolDoc.exists()) {
      // Create new document with basic symbol info + technical data
      await setDoc(symbolRef, {
        symbol: symbol.toUpperCase(),
        name: technicalData.symbol, // Can be updated later
        technical: dataToSave,
        lastFetched: serverTimestamp(),
      });
    } else {
      // Update existing document
      await updateDoc(symbolRef, {
        technical: dataToSave,
        lastFetched: serverTimestamp(),
      });
    }

    console.log(`✅ Technical data saved for ${symbol}`);
  } catch (error) {
    console.error(`Error saving technical data for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Save/Update fundamental data for a symbol in symbols collection
 * This should be called by your EOD batch job
 */
export async function saveSymbolFundamentalData(
  symbol: string,
  fundamentalData: Omit<FundamentalData, 'lastUpdated'>
): Promise<void> {
  try {
    const symbolRef = doc(db, 'symbols', symbol.toUpperCase());
    const symbolDoc = await getDoc(symbolRef);

    const dataToSave = {
      ...fundamentalData,
      lastUpdated: serverTimestamp(),
    };

    if (!symbolDoc.exists()) {
      // Create new document with basic symbol info + fundamental data
      await setDoc(symbolRef, {
        symbol: symbol.toUpperCase(),
        name: fundamentalData.companyName,
        sector: fundamentalData.sector,
        industry: fundamentalData.industry,
        fundamental: dataToSave,
        lastFetched: serverTimestamp(),
      });
    } else {
      // Update existing document
      await updateDoc(symbolRef, {
        fundamental: dataToSave,
        lastFetched: serverTimestamp(),
        // Also update company info if provided
        ...(fundamentalData.companyName && { name: fundamentalData.companyName }),
        ...(fundamentalData.sector && { sector: fundamentalData.sector }),
        ...(fundamentalData.industry && { industry: fundamentalData.industry }),
      });
    }

    console.log(`✅ Fundamental data saved for ${symbol}`);
  } catch (error) {
    console.error(`Error saving fundamental data for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Helper: Check if current time is past market close (3:30 PM IST)
 * Returns true if we should wait for new EOD data
 */
function isPastMarketClose(): boolean {
  const now = new Date();

  // Convert to IST
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const hours = istTime.getHours();
  const minutes = istTime.getMinutes();

  // Market closes at 3:30 PM IST (15:30)
  // Consider data stale only after 6:00 PM IST (18:00) to account for EOD processing time
  const currentTimeInMinutes = hours * 60 + minutes;
  const marketCloseTime = 18 * 60; // 6:00 PM IST in minutes

  return currentTimeInMinutes >= marketCloseTime;
}

/**
 * Helper: Check if two dates are on the same calendar day (IST timezone)
 */
function isSameDay(date1: Date, date2: Date): boolean {
  const d1 = new Date(date1.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const d2 = new Date(date2.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

  return d1.getDate() === d2.getDate() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getFullYear() === d2.getFullYear();
}

/**
 * Check if symbol data exists and is fresh for EOD data
 *
 * For EOD (End-of-Day) data:
 * - Data from Oct 15 EOD is valid for the entire Oct 16 trading day
 * - Data becomes stale only after market close (6:00 PM IST) on Oct 16
 * - This ensures screener data remains valid until new EOD data is available
 */
export async function isSymbolDataFresh(symbol: string, maxAgeHours: number = 24): Promise<boolean> {
  try {
    const symbolDoc = await getDoc(doc(db, 'symbols', symbol.toUpperCase()));

    if (!symbolDoc.exists()) {
      return false;
    }

    const data = symbolDoc.data();
    if (!data.lastFetched) {
      return false;
    }

    const lastFetched = data.lastFetched.toDate();
    const now = new Date();

    // For EOD data: Check if we're still on the same trading day OR
    // if we're on the next day but haven't passed market close yet
    if (isSameDay(lastFetched, now)) {
      // Same day - data is fresh
      return true;
    }

    // Different day - check if we're past market close
    // If we haven't passed market close yet, yesterday's EOD data is still valid
    if (!isPastMarketClose()) {
      // Still during today's trading session - yesterday's data is valid
      return true;
    }

    // Past market close - check how old the data is
    // Allow data from yesterday if it was fetched after market close
    const ageHours = (now.getTime() - lastFetched.getTime()) / (1000 * 60 * 60);

    // If data is from yesterday evening/night (less than 30 hours old), it's still fresh
    // This handles the case where EOD data was processed late at night
    return ageHours < 30;

  } catch (error) {
    console.error(`Error checking data freshness for ${symbol}:`, error);
    return false;
  }
}

/**
 * Get list of all symbols that need data update (older than 24 hours)
 * This can be used by your EOD batch job
 */
export async function getSymbolsNeedingUpdate(): Promise<string[]> {
  // This would require a collection query
  // For now, you'll need to maintain a list of all active symbols
  // Or query from your positions collection to get unique symbols

  // TODO: Implement based on your needs
  // Option 1: Keep a master list of symbols in Firestore
  // Option 2: Query all user positions and extract unique symbols
  // Option 3: Use the symbols collection you already have

  return [];
}

/**
 * Helper: Calculate technical recommendation based on data
 */
export function calculateTechnicalRecommendation(
  technical: TechnicalData,
  position: {
    entryPrice: number;
    stopLoss: number;
    target1: number;
    exitCriteria: any;
  }
): 'EXIT' | 'ACCUMULATE' | 'HOLD' {
  const price = technical.currentPrice;

  // Check EXIT conditions (ANY condition triggers EXIT)
  const exitConditions = [
    position.exitCriteria.exitAtStopLoss && price <= position.stopLoss,
    position.exitCriteria.exitAtTarget && price >= position.target1,
    position.exitCriteria.exitBelow50EMA && !technical.above50EMA,
    position.exitCriteria.exitBelow100MA && !technical.above100MA,
    position.exitCriteria.exitBelow200MA && !technical.above200MA,
    position.exitCriteria.exitOnWeeklySupertrend && technical.weeklySupertrend?.trend === 'bearish',
  ];

  if (exitConditions.some(condition => condition)) {
    return 'EXIT';
  }

  // Check ACCUMULATE conditions (ALL conditions must be true)
  const accumulateConditions = [
    price > position.stopLoss, // Above stop-loss (safe)
    price < position.target1, // Below target (room to grow)
    technical.above50EMA, // Short-term bullish
    technical.above200MA, // Long-term bullish
    technical.weeklySupertrend?.trend === 'bullish', // Weekly momentum
    technical.goldenCross, // 50 EMA above 200 MA
  ];

  if (accumulateConditions.every(condition => condition)) {
    return 'ACCUMULATE';
  }

  return 'HOLD';
}
