#!/usr/bin/env tsx

/**
 * EOD Technical Analysis Batch Job
 *
 * This script:
 * 1. Fetches all symbols from Firestore ideas/portfolio
 * 2. Downloads EOD data from Yahoo Finance
 * 3. Calculates technical indicators (MA, EMA, RSI, Bollinger, MACD)
 * 4. Detects signals (price cross MA200, EMA50, etc.)
 * 5. Stores results in Firestore
 * 6. Saves local backup in JSON
 *
 * Usage:
 *   npm run analyze
 *   # or
 *   tsx scripts/analyze-symbols.ts
 */

import yahooFinance from 'yahoo-finance2';
import { SMA, EMA, RSI, BollingerBands, MACD } from 'technicalindicators';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';
import { EODDatabase, OHLCVRow } from '../lib/eod-database';

// Initialize Firebase Admin

let serviceAccount: any;
const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');

if (fs.existsSync(serviceAccountPath)) {
  serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
} else {
  console.error('❌ serviceAccountKey.json not found in project root');
  console.error('Please download it from Firebase Console → Project Settings → Service Accounts');
  process.exit(1);
}

try {
  initializeApp({
    credential: cert(serviceAccount),
  });
} catch (error: any) {
  if (error.code !== 'app/duplicate-app') {
    throw error;
  }
  // Already initialized
}

const db = getFirestore();

interface OHLCVData {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TechnicalAnalysis {
  symbol: string;
  lastPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;

  // Moving Averages
  sma20: number;
  sma50: number;
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

  // Signals
  signals: {
    priceCrossSMA200: 'above' | 'below' | null;
    priceCrossEMA50: 'above' | 'below' | null;
    rsiOverbought: boolean;  // RSI > 70
    rsiOversold: boolean;    // RSI < 30
    macdBullish: boolean;    // MACD histogram > 0
    macdBearish: boolean;    // MACD histogram < 0
    volumeSpike: boolean;    // Volume > 2x avg
    goldenCross: boolean;    // SMA50 > SMA200
    deathCross: boolean;     // SMA50 < SMA200
    ema50CrossSMA200: 'above' | 'below' | null;  // EMA50 vs SMA200
  };

  // Overall signal
  overallSignal: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';

  // Metadata
  updatedAt: Date;
  dataPoints: number;
}

/**
 * Fetch and store EOD data (with incremental updates)
 */
async function fetchAndStoreEODData(
  eodDb: EODDatabase,
  symbol: string
): Promise<boolean> {
  try {
    // Check if we already have data for this symbol
    const lastDate = await eodDb.getLastDate(symbol);
    const rowCount = await eodDb.getRowCount(symbol);

    let startDate: Date;
    let endDate = new Date();
    let isIncremental = false;

    if (lastDate && rowCount >= 200) {
      // Incremental update - fetch only since last date
      startDate = new Date(lastDate);
      startDate.setDate(startDate.getDate() + 1); // Start from next day
      isIncremental = true;
      console.log(`  📥 Incremental update from ${lastDate} (${rowCount} existing rows)`);
    } else {
      // Initial fetch - get 250 days
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 250);
      console.log(`  📥 Initial fetch (250 days)`);
    }

    // Skip if start date is in the future or same as today
    if (startDate >= endDate) {
      console.log(`  ✅ Already up-to-date`);
      return true;
    }

    // Fetch from Yahoo Finance
    const data = await yahooFinance.historical(`${symbol}.NS`, {
      period1: startDate.toISOString().split('T')[0],
      period2: endDate.toISOString().split('T')[0],
      interval: '1d'
    });

    if (!data || data.length === 0) {
      if (isIncremental) {
        // No new data, but we have existing data
        console.log(`  ℹ️  No new data available`);
        return true;
      } else {
        console.log(`  ⚠️  No data available for ${symbol}`);
        return false;
      }
    }

    // Convert to OHLCVRow format
    const rows: OHLCVRow[] = data.map(d => ({
      symbol,
      date: d.date.toISOString().split('T')[0],
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      volume: d.volume,
      adj_close: d.adjClose || d.close
    }));

    // Insert into DuckDB
    await eodDb.insertBulk(rows);
    console.log(`  💾 Stored ${rows.length} new rows`);

    return true;

  } catch (error: any) {
    console.error(`  ❌ Error fetching ${symbol}:`, error.message);
    return false;
  }
}

/**
 * Load EOD data from local database
 */
async function loadEODDataFromDB(
  eodDb: EODDatabase,
  symbol: string
): Promise<OHLCVData[] | null> {
  try {
    const rows = await eodDb.getOHLCV(symbol);

    if (rows.length < 200) {
      console.log(`  ⚠️  Insufficient data in DB (${rows.length} rows)`);
      return null;
    }

    return rows.map(r => ({
      date: new Date(r.date),
      open: r.open,
      high: r.high,
      low: r.low,
      close: r.close,
      volume: r.volume
    }));

  } catch (error: any) {
    console.error(`  ❌ Error loading from DB:`, error.message);
    return null;
  }
}

/**
 * Calculate all technical indicators
 */
function calculateIndicators(data: OHLCVData[]): TechnicalAnalysis {
  const closePrices = data.map(d => d.close);
  const volumes = data.map(d => d.volume);

  const lastPrice = closePrices[closePrices.length - 1];
  const previousClose = closePrices[closePrices.length - 2];

  // Moving Averages
  const sma20Arr = SMA.calculate({ period: 20, values: closePrices });
  const sma50Arr = SMA.calculate({ period: 50, values: closePrices });
  const sma200Arr = SMA.calculate({ period: 200, values: closePrices });

  const ema9Arr = EMA.calculate({ period: 9, values: closePrices });
  const ema21Arr = EMA.calculate({ period: 21, values: closePrices });
  const ema50Arr = EMA.calculate({ period: 50, values: closePrices });

  // RSI
  const rsiArr = RSI.calculate({ period: 14, values: closePrices });

  // Bollinger Bands
  const bbArr = BollingerBands.calculate({
    period: 20,
    values: closePrices,
    stdDev: 2
  });

  // MACD
  const macdArr = MACD.calculate({
    values: closePrices,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false
  });

  // Volume Average
  const avgVolume20Arr = SMA.calculate({ period: 20, values: volumes });

  // Get latest values
  const sma20 = sma20Arr[sma20Arr.length - 1] || 0;
  const sma50 = sma50Arr[sma50Arr.length - 1] || 0;
  const sma200 = sma200Arr[sma200Arr.length - 1] || 0;
  const ema9 = ema9Arr[ema9Arr.length - 1] || 0;
  const ema21 = ema21Arr[ema21Arr.length - 1] || 0;
  const ema50 = ema50Arr[ema50Arr.length - 1] || 0;

  const rsi14 = rsiArr[rsiArr.length - 1] || 50;

  const bb = bbArr[bbArr.length - 1];
  const bollingerUpper = bb?.upper || 0;
  const bollingerMiddle = bb?.middle || 0;
  const bollingerLower = bb?.lower || 0;

  const macdData = macdArr[macdArr.length - 1];
  const macd = macdData?.MACD || 0;
  const macdSignal = macdData?.signal || 0;
  const macdHistogram = macdData?.histogram || 0;

  const volume = volumes[volumes.length - 1];
  const avgVolume20 = avgVolume20Arr[avgVolume20Arr.length - 1] || volume;

  // Calculate Signals
  const signals = {
    priceCrossSMA200: sma200 ? (lastPrice > sma200 ? 'above' : 'below') as 'above' | 'below' : null,
    priceCrossEMA50: ema50 ? (lastPrice > ema50 ? 'above' : 'below') as 'above' | 'below' : null,
    rsiOverbought: rsi14 > 70,
    rsiOversold: rsi14 < 30,
    macdBullish: macdHistogram > 0,
    macdBearish: macdHistogram < 0,
    volumeSpike: volume > (avgVolume20 * 2),
    goldenCross: sma50 > sma200 && sma50 > 0 && sma200 > 0,
    deathCross: sma50 < sma200 && sma50 > 0 && sma200 > 0,
    ema50CrossSMA200: (ema50 > 0 && sma200 > 0) ? (ema50 > sma200 ? 'above' : 'below') as 'above' | 'below' : null,
  };

  // Calculate Overall Signal
  let score = 0;

  if (signals.priceCrossSMA200 === 'above') score += 2;
  else if (signals.priceCrossSMA200 === 'below') score -= 2;

  if (signals.priceCrossEMA50 === 'above') score += 1;
  else if (signals.priceCrossEMA50 === 'below') score -= 1;

  if (signals.rsiOversold) score += 2;
  else if (signals.rsiOverbought) score -= 2;

  if (signals.macdBullish) score += 1;
  else if (signals.macdBearish) score -= 1;

  if (signals.goldenCross) score += 2;
  else if (signals.deathCross) score -= 2;

  if (signals.volumeSpike) score += 1;

  let overallSignal: TechnicalAnalysis['overallSignal'];
  if (score >= 5) overallSignal = 'STRONG_BUY';
  else if (score >= 2) overallSignal = 'BUY';
  else if (score <= -5) overallSignal = 'STRONG_SELL';
  else if (score <= -2) overallSignal = 'SELL';
  else overallSignal = 'NEUTRAL';

  return {
    symbol: '',
    lastPrice,
    previousClose,
    change: lastPrice - previousClose,
    changePercent: ((lastPrice - previousClose) / previousClose) * 100,
    sma20,
    sma50,
    sma200,
    ema9,
    ema21,
    ema50,
    rsi14,
    bollingerUpper,
    bollingerMiddle,
    bollingerLower,
    macd,
    macdSignal,
    macdHistogram,
    volume,
    avgVolume20,
    signals,
    overallSignal,
    updatedAt: new Date(),
    dataPoints: closePrices.length
  };
}

/**
 * Get all unique symbols from Firestore
 */
async function getSymbols(): Promise<string[]> {
  const symbols = new Set<string>();

  console.log('📊 Fetching symbols from Firestore...');

  // Get from ideas
  const ideasSnapshot = await db.collection('ideas').get();
  ideasSnapshot.forEach(doc => {
    const symbol = doc.data().symbol;
    if (symbol) symbols.add(symbol);
  });

  // Get from portfolio
  const portfolioSnapshot = await db.collection('portfolio').get();
  portfolioSnapshot.forEach(doc => {
    const symbol = doc.data().symbol;
    if (symbol) symbols.add(symbol);
  });

  console.log(`✅ Found ${symbols.size} unique symbols\n`);

  return Array.from(symbols);
}

/**
 * Save analysis to Firestore (central symbols collection only)
 */
async function saveToFirestore(symbol: string, analysis: TechnicalAnalysis) {
  // Add NS_ prefix for Firebase compatibility (symbols starting with numbers)
  const symbolWithPrefix = symbol.startsWith('NS_') ? symbol : `NS_${symbol}`;

  const data = {
    ...analysis,
    symbol,
    updatedAt: Timestamp.fromDate(analysis.updatedAt)
  };

  // Save to symbols collection (central storage - single source of truth)
  await db.collection('symbols').doc(symbolWithPrefix).set({
    symbol: symbolWithPrefix,
    originalSymbol: symbol,
    technical: data,
    lastFetched: Timestamp.now()
  }, { merge: true });  // merge: true preserves fundamental data if it exists
}

/**
 * Save analysis to local JSON file
 */
function saveToLocalFile(symbol: string, analysis: TechnicalAnalysis, ohlcv: OHLCVData[]) {
  const dataDir = path.join(process.cwd(), 'data');

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const filePath = path.join(dataDir, `${symbol}.json`);

  const data = {
    symbol,
    analysis,
    ohlcv: ohlcv.slice(-30), // Last 30 days only
    lastUpdated: new Date().toISOString()
  };

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

/**
 * Main analysis function
 */
async function analyzeSymbols() {
  console.log('🚀 Starting EOD Technical Analysis Batch Job\n');
  console.log('=' .repeat(60));

  const startTime = Date.now();

  // Initialize DuckDB
  const eodDb = new EODDatabase();
  await eodDb.initialize();
  console.log('✅ DuckDB initialized\n');

  try {
    // Get all symbols
    const symbols = await getSymbols();

    if (symbols.length === 0) {
      console.log('⚠️  No symbols found. Add some ideas or portfolio positions first.');
      await eodDb.close();
      return;
    }

    let successCount = 0;
    let failCount = 0;

    // Process each symbol
    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      console.log(`\n[${i + 1}/${symbols.length}] Processing ${symbol}...`);

      try {
        // Fetch and store data (incremental)
        const fetchSuccess = await fetchAndStoreEODData(eodDb, symbol);

        if (!fetchSuccess) {
          console.log(`  ⏭️  Skipping ${symbol} - fetch failed`);
          failCount++;
          continue;
        }

        // Load data from DB
        const data = await loadEODDataFromDB(eodDb, symbol);

        if (!data || data.length < 200) {
          console.log(`  ⏭️  Skipping ${symbol} - insufficient data`);
          failCount++;
          continue;
        }

        // Calculate indicators
        console.log(`  📈 Calculating indicators...`);
        const analysis = calculateIndicators(data);
        analysis.symbol = symbol;

        // Save to Firestore
        console.log(`  💾 Saving to Firestore...`);
        await saveToFirestore(symbol, analysis);

        // Save to local file
        console.log(`  📁 Saving to local file...`);
        saveToLocalFile(symbol, analysis, data);

        // Display summary
        console.log(`  ✅ ${symbol} - ${analysis.overallSignal}`);
        console.log(`     Price: ₹${analysis.lastPrice.toFixed(2)} (${analysis.changePercent > 0 ? '+' : ''}${analysis.changePercent.toFixed(2)}%)`);
        console.log(`     RSI: ${analysis.rsi14.toFixed(1)} | SMA200: ₹${analysis.sma200.toFixed(2)} | EMA50: ₹${analysis.ema50.toFixed(2)}`);

        if (analysis.signals.priceCrossSMA200 === 'above') {
          console.log(`     🟢 Price ABOVE SMA200`);
        }
        if (analysis.signals.priceCrossEMA50 === 'above') {
          console.log(`     🟢 Price ABOVE EMA50`);
        }
        if (analysis.signals.goldenCross) {
          console.log(`     ⭐ GOLDEN CROSS detected!`);
        }

        successCount++;

        // Rate limiting to avoid API throttling
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error: any) {
        console.error(`  ❌ Failed to process ${symbol}:`, error.message);
        failCount++;
      }
    }

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    // Get database stats
    const dbStats = await eodDb.getStats();

    console.log('\n' + '='.repeat(60));
    console.log('📊 Analysis Complete!');
    console.log('='.repeat(60));
    console.log(`✅ Success: ${successCount} symbols`);
    console.log(`❌ Failed: ${failCount} symbols`);
    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`\n💾 Database Stats:`);
    console.log(`   Total rows: ${dbStats.totalRows.toLocaleString()}`);
    console.log(`   Symbols: ${dbStats.symbols}`);
    console.log(`   Date range: ${dbStats.dateRange.min} to ${dbStats.dateRange.max}`);
    console.log(`   DB size: ${dbStats.dbSizeMB} MB`);
    console.log(`📁 Data saved to: ./data/`);
    console.log('='.repeat(60));

    // Close database
    await eodDb.close();

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the analysis
if (require.main === module) {
  analyzeSymbols()
    .then(() => {
      console.log('\n✅ Batch job completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Batch job failed:', error);
      process.exit(1);
    });
}

export { analyzeSymbols };
