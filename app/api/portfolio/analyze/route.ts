/**
 * Portfolio Analysis API Endpoint
 *
 * Calculates portfolio risk metrics by:
 * 1. Fetching historical prices from DuckDB
 * 2. Fetching symbol metadata from Firestore
 * 3. Calculating Beta, Std Dev, Sharpe Ratio
 * 4. Analyzing sector and market cap distribution
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzePortfolio, type Position } from '@/lib/portfolioAnalysis';
import path from 'path';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin if not already initialized
if (getApps().length === 0) {
  const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
  initializeApp({
    credential: cert(serviceAccountPath),
  });
}

const db = getFirestore();

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RequestBody {
  positions: Position[];
  accountId?: string;
}

/**
 * Calculate daily returns from price data
 */
function calculateDailyReturns(prices: number[]): number[] {
  const returns: number[] = [];

  for (let i = 1; i < prices.length; i++) {
    const prevPrice = prices[i - 1];
    const currentPrice = prices[i];
    const dailyReturn = (currentPrice - prevPrice) / prevPrice;
    returns.push(dailyReturn);
  }

  return returns;
}

/**
 * Calculate portfolio weighted returns from individual stock returns
 */
function calculatePortfolioReturns(
  positions: Position[],
  historicalReturns: Map<string, number[]>
): number[] {
  const totalValue = positions.reduce((sum, p) => sum + p.totalValue, 0);
  const portfolioReturns: number[] = [];

  // Find the minimum length across all stocks
  let minLength = Infinity;
  for (const position of positions) {
    const returns = historicalReturns.get(position.symbol);
    if (returns && returns.length < minLength) {
      minLength = returns.length;
    }
  }

  if (minLength === Infinity || minLength === 0) {
    return [];
  }

  // Calculate weighted portfolio return for each day
  for (let i = 0; i < minLength; i++) {
    let dailyReturn = 0;

    for (const position of positions) {
      const returns = historicalReturns.get(position.symbol);
      if (returns && returns[i] !== undefined) {
        const weight = position.totalValue / totalValue;
        dailyReturn += weight * returns[i];
      }
    }

    portfolioReturns.push(dailyReturn);
  }

  return portfolioReturns;
}

/**
 * For now, we'll use simplified calculations based on Firestore data
 * The batch job stores beta and other metrics in Firestore already
 *
 * In the future, if you want historical price-based calculations:
 * - Store historical prices in Firestore (pre-calculated by batch job)
 * - Or use a separate microservice that has access to DuckDB
 */
async function fetchHistoricalPrices(symbol: string, days: number = 365): Promise<number[]> {
  // Return empty array - we'll use pre-calculated metrics from Firestore instead
  console.log(`Note: Historical price calculation skipped for ${symbol} (use batch job data)`);
  return [];
}

/**
 * Fetch symbol metadata from Firestore
 */
async function fetchSymbolMetadata(symbols: string[]) {
  const metadataMap = new Map();

  try {
    const promises = symbols.map(async (symbol) => {
      // Add NS_ prefix for Firebase document lookup
      const symbolWithPrefix = symbol.startsWith('NS_') ? symbol : `NS_${symbol.toUpperCase()}`;
      const docRef = db.collection('symbols').doc(symbolWithPrefix);
      const doc = await docRef.get();

      if (doc.exists) {
        const data = doc.data();
        return {
          symbol: symbol.toUpperCase(),
          sector: data?.fundamental?.sector || data?.sector || null,
          industry: data?.fundamental?.industry || data?.industry || null,
          marketCap: data?.fundamental?.marketCap || null,
          beta: data?.fundamental?.beta || null,
        };
      }

      return {
        symbol: symbol.toUpperCase(),
        sector: null,
        industry: null,
        marketCap: null,
        beta: null,
      };
    });

    const results = await Promise.all(promises);

    for (const metadata of results) {
      metadataMap.set(metadata.symbol, metadata);
    }
  } catch (error) {
    console.error('Error fetching symbol metadata:', error);
  }

  return metadataMap;
}

/**
 * POST /api/portfolio/analyze
 * Analyze portfolio risk metrics
 */
export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { positions } = body;

    if (!positions || positions.length === 0) {
      return NextResponse.json(
        { error: 'No positions provided' },
        { status: 400 }
      );
    }

    console.log(`📊 Analyzing portfolio with ${positions.length} positions...`);

    // Step 1: Fetch symbol metadata from Firestore
    const symbols = positions.map(p => p.symbol);
    const symbolMetadata = await fetchSymbolMetadata(symbols);

    // Step 2: Use simplified analysis with Firestore data
    // Note: For full historical price analysis, use batch jobs to pre-calculate
    console.log('🔬 Calculating risk metrics from Firestore data...');

    // Use dummy returns for now (simplified calculation)
    // In production, these would be pre-calculated by batch jobs and stored in Firestore
    const portfolioReturns: number[] = [];
    const niftyReturns: number[] = [];

    // Step 3: Analyze portfolio using Firestore metadata
    const analysis = await analyzePortfolio(
      positions,
      symbolMetadata,
      portfolioReturns,
      niftyReturns,
      7.0 // Risk-free rate: 7% (Indian 10Y G-Sec)
    );

    console.log('✅ Portfolio analysis completed');

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('Error analyzing portfolio:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze portfolio',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
