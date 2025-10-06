#!/usr/bin/env tsx

/**
 * Simple EOD Technical Analysis (No DuckDB)
 * Fetches data directly from Yahoo Finance and updates Firebase
 */

import yahooFinance from 'yahoo-finance2';
import { SMA, EMA, RSI, BollingerBands, MACD } from 'technicalindicators';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Firebase Admin
let serviceAccount: any;
const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');

if (fs.existsSync(serviceAccountPath)) {
  serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
} else {
  console.error('❌ serviceAccountKey.json not found');
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
  sma20: number;
  sma50: number;
  sma200: number;
  ema9: number;
  ema21: number;
  ema50: number;
  rsi14: number;
  bollingerUpper: number;
  bollingerMiddle: number;
  bollingerLower: number;
  macd: number;
  macdSignal: number;
  macdHistogram: number;
  volume: number;
  avgVolume20: number;
  signals: {
    priceCrossSMA200: 'above' | 'below' | null;
    priceCrossEMA50: 'above' | 'below' | null;
    rsiOverbought: boolean;
    rsiOversold: boolean;
    macdBullish: boolean;
    macdBearish: boolean;
    volumeSpike: boolean;
    goldenCross: boolean;
    deathCross: boolean;
    ema50CrossSMA200: 'above' | 'below' | null;
  };
  overallSignal: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  updatedAt: Date;
  dataPoints: number;
}

async function fetchEODData(symbol: string): Promise<OHLCVData[] | null> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 250);
    const endDate = new Date();

    console.log(`  📥 Fetching 250 days of data...`);
    const data = await yahooFinance.historical(`${symbol}.NS`, {
      period1: startDate.toISOString().split('T')[0],
      period2: endDate.toISOString().split('T')[0],
      interval: '1d'
    });

    if (!data || data.length === 0) {
      console.log(`  ⚠️  No data available`);
      return null;
    }

    console.log(`  ✅ Fetched ${data.length} rows`);
    return data.map(d => ({
      date: d.date,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      volume: d.volume
    }));
  } catch (error: any) {
    console.error(`  ❌ Error:`, error.message);
    return null;
  }
}

function calculateIndicators(data: OHLCVData[]): TechnicalAnalysis {
  const closePrices = data.map(d => d.close);
  const volumes = data.map(d => d.volume);

  const lastPrice = closePrices[closePrices.length - 1];
  const previousClose = closePrices[closePrices.length - 2];

  const sma20Arr = SMA.calculate({ period: 20, values: closePrices });
  const sma50Arr = SMA.calculate({ period: 50, values: closePrices });
  const sma200Arr = SMA.calculate({ period: 200, values: closePrices });

  const ema9Arr = EMA.calculate({ period: 9, values: closePrices });
  const ema21Arr = EMA.calculate({ period: 21, values: closePrices });
  const ema50Arr = EMA.calculate({ period: 50, values: closePrices });

  const rsiArr = RSI.calculate({ period: 14, values: closePrices });

  const bbArr = BollingerBands.calculate({
    period: 20,
    values: closePrices,
    stdDev: 2
  });

  const macdArr = MACD.calculate({
    values: closePrices,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false
  });

  const avgVolume20Arr = SMA.calculate({ period: 20, values: volumes });

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

async function getSymbols(): Promise<string[]> {
  const symbols = new Set<string>();
  console.log('📊 Fetching symbols from Firestore...');

  const ideasSnapshot = await db.collection('ideas').get();
  ideasSnapshot.forEach(doc => {
    const symbol = doc.data().symbol;
    if (symbol) symbols.add(symbol);
  });

  const portfolioSnapshot = await db.collection('portfolio').get();
  portfolioSnapshot.forEach(doc => {
    const symbol = doc.data().symbol;
    if (symbol) symbols.add(symbol);
  });

  console.log(`✅ Found ${symbols.size} unique symbols\n`);
  return Array.from(symbols);
}

async function saveToFirestore(symbol: string, analysis: TechnicalAnalysis) {
  const data = {
    ...analysis,
    symbol,
    updatedAt: Timestamp.fromDate(analysis.updatedAt)
  };

  await db.collection('technicals').doc(symbol).set(data);

  const ideasQuery = await db.collection('ideas').where('symbol', '==', symbol).get();
  const ideaUpdates = ideasQuery.docs.map(doc =>
    doc.ref.update({ technicals: data })
  );

  const portfolioQuery = await db.collection('portfolio').where('symbol', '==', symbol).get();
  const portfolioUpdates = portfolioQuery.docs.map(doc =>
    doc.ref.update({ technicals: data })
  );

  await Promise.all([...ideaUpdates, ...portfolioUpdates]);
}

async function analyzeSymbols() {
  console.log('🚀 Starting Simple Technical Analysis\n');
  console.log('='.repeat(60));

  const startTime = Date.now();

  try {
    const symbols = await getSymbols();

    if (symbols.length === 0) {
      console.log('⚠️  No symbols found');
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      console.log(`\n[${i + 1}/${symbols.length}] Processing ${symbol}...`);

      try {
        const data = await fetchEODData(symbol);

        if (!data || data.length < 200) {
          console.log(`  ⏭️  Skipping - insufficient data`);
          failCount++;
          continue;
        }

        console.log(`  📈 Calculating indicators...`);
        const analysis = calculateIndicators(data);
        analysis.symbol = symbol;

        console.log(`  💾 Saving to Firestore...`);
        await saveToFirestore(symbol, analysis);

        console.log(`  ✅ ${symbol} - ${analysis.overallSignal}`);
        console.log(`     Price: ₹${analysis.lastPrice.toFixed(2)} (${analysis.changePercent > 0 ? '+' : ''}${analysis.changePercent.toFixed(2)}%)`);
        console.log(`     RSI: ${analysis.rsi14.toFixed(1)} | SMA200: ₹${analysis.sma200.toFixed(2)} | EMA50: ₹${analysis.ema50.toFixed(2)}`);

        if (analysis.signals.ema50CrossSMA200 === 'above') {
          console.log(`     🔥 50 EMA/200 MA CROSSOVER!`);
        }
        if (analysis.signals.goldenCross) {
          console.log(`     ⭐ GOLDEN CROSS!`);
        }

        successCount++;
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error: any) {
        console.error(`  ❌ Failed:`, error.message);
        failCount++;
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n' + '='.repeat(60));
    console.log('📊 Analysis Complete!');
    console.log('='.repeat(60));
    console.log(`✅ Success: ${successCount} symbols`);
    console.log(`❌ Failed: ${failCount} symbols`);
    console.log(`⏱️  Duration: ${duration}s`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  analyzeSymbols()
    .then(() => {
      console.log('\n✅ Job completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Job failed:', error);
      process.exit(1);
    });
}

export { analyzeSymbols };
