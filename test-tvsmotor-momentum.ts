/**
 * Test TVSMOTOR momentum trader rule with updated Bollinger Band logic
 */

import { checkMomentumTraderEntry } from './lib/investment-rules/rules/momentumTrader';
import { TechnicalSignals, TechnicalData, FundamentalData } from './lib/investment-rules/types';

// TVSMOTOR data from screenshot
const technical: TechnicalData = {
  symbol: 'TVSMOTOR',
  lastPrice: 3654.00,
  previousClose: 3576.50,
  change: 77.50,
  changePercent: 2.17,
  weeklyChange: 163.70,
  weeklyChangePercent: 4.69,
  monthlyChange: 153.90,
  monthlyChangePercent: 4.40,
  quarterlyChange: 775.20,
  quarterlyChangePercent: 0, // Not shown
  sma20: 3496.68,
  sma50: 3378.74,
  sma100: 3100.63,
  sma200: 0, // Not shown
  ema9: 0, // Not shown
  ema21: 3499.72,
  ema50: 3366.17,
  rsi14: 75.78,
  bollingerUpper: 3612.07,
  bollingerMiddle: 3496.68,
  bollingerLower: 3381.29,
  macd: 54.19,
  macdSignal: 48.65,
  macdHistogram: 5.54,
  supertrend: 3414.04,
  supertrendDirection: 1.00,
  weeklySupertrend: 3069.46,
  weeklySupertrendDirection: 1.00,
  volume: 1173044.00,
  avgVolume20: 0, // Not shown
  updatedAt: new Date(),
};

const signals: TechnicalSignals = {
  priceCrossSMA200: 'above',
  priceCrossSMA100: 'above',
  priceCrossEMA50: 'above',
  supertrendBullish: true,
  supertrendBearish: false,
  rsiOverbought: true,  // RSI > 70
  rsiOversold: false,
  macdBullish: true,
  macdBearish: false,
  volumeSpike: false,
  goldenCross: true,
  deathCross: false,
  ema50CrossSMA200: 'above',
};

const fundamental: FundamentalData = {
  symbol: 'TVSMOTOR',
  marketCap: 0,
  pe: 0,
  pb: 0,
  roe: 0,
  debtToEquity: 0,
  currentRatio: 0,
  updatedAt: new Date(),
};

console.log('='.repeat(80));
console.log('🧪 TESTING MOMENTUM TRADER RULE - TVSMOTOR');
console.log('='.repeat(80));

console.log('\n📊 INPUT DATA:');
console.log(`   Last Price: ₹${technical.lastPrice.toFixed(2)}`);
console.log(`   Bollinger Upper: ₹${technical.bollingerUpper.toFixed(2)}`);
console.log(`   Bollinger Lower: ₹${technical.bollingerLower.toFixed(2)}`);
console.log(`   Price position: ${technical.lastPrice > technical.bollingerUpper ? 'ABOVE upper band' : 'within bands'}`);

console.log('\n🔍 BOLLINGER BAND CHECK:');
const upperLimit = technical.bollingerUpper * 1.05;
console.log(`   Lower Band: ₹${technical.bollingerLower.toFixed(2)}`);
console.log(`   Upper Band: ₹${technical.bollingerUpper.toFixed(2)}`);
console.log(`   Upper Band + 5%: ₹${upperLimit.toFixed(2)}`);
console.log(`   Price > Lower Band: ${technical.lastPrice > technical.bollingerLower ? '✓' : '✗'}`);
console.log(`   Price <= Upper Band + 5%: ${technical.lastPrice <= upperLimit ? '✓' : '✗'}`);
console.log(`   Result: ${technical.lastPrice > technical.bollingerLower && technical.lastPrice <= upperLimit ? 'PASS ✓' : 'FAIL ✗'}`);

const result = checkMomentumTraderEntry(signals, technical, fundamental);

console.log('\n📈 MOMENTUM TRADER ANALYSIS:');
console.log(`   Can Enter: ${result.canEnter ? '✓ YES' : '✗ NO'}`);
console.log(`   Conditions Met: ${result.met}/${result.total}`);

console.log('\n✅ CONDITIONS MET:');
Object.entries(result.conditions).forEach(([key, value]) => {
  if (value) {
    console.log(`   ✓ ${key}`);
  }
});

console.log('\n❌ CONDITIONS FAILED:');
result.failedConditions.forEach(condition => {
  console.log(`   ✗ ${condition}`);
});

if (result.scores) {
  console.log('\n📊 SCORES:');
  Object.entries(result.scores).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });
}

console.log('\n' + '='.repeat(80));
console.log('🎯 EXPECTED RESULT:');
console.log('='.repeat(80));
console.log('The "withinOrAboveBollingerBands" condition should now PASS because:');
console.log(`  - Price (₹${technical.lastPrice.toFixed(2)}) > Lower Band (₹${technical.bollingerLower.toFixed(2)})`);
console.log(`  - Price (₹${technical.lastPrice.toFixed(2)}) <= Upper Band + 5% (₹${upperLimit.toFixed(2)})`);
console.log(`  - This allows momentum breakouts above the upper band (up to 5% above)`);
console.log('='.repeat(80));
