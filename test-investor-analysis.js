/**
 * Test the investment rules engine with AdaniPower data
 * Run with: node test-investor-analysis.js
 */

// Mock data from our analysis
const technicalData = {
  lastPrice: 165.98,
  previousClose: 157.37,
  change: 8.61,
  changePercent: 5.47,
  weeklyChangePercent: 7.48,
  monthlyChangePercent: 16.99,
  quarterlyChangePercent: 40.91,
  sma20: 152.32,
  sma50: 133.88,
  sma100: 124.52,
  sma200: 114.26,
  ema9: 155.81,
  ema21: 149.34,
  ema50: 138.35,
  rsi14: 74.24,
  bollingerUpper: 167.10,
  bollingerMiddle: 152.32,
  bollingerLower: 137.54,
  macd: 7.1138,
  macdSignal: 6.6575,
  macdHistogram: 0.4563,
  volume: 170754425,
  avgVolume20: 102752708,
  overallSignal: 'STRONG_BUY'
};

const fundamentalData = {
  symbol: 'ADANIPOWER',
  companyName: 'Adani Power Limited',
  sector: 'Utilities',
  industry: 'Utilities - Independent Power Producers',
  trailingPE: 26.60,
  forwardPE: -74.43,
  pegRatio: null,
  priceToBook: 5.68,
  priceToSales: 5.78,
  debtToEquity: 0.68,
  currentRatio: null,
  quickRatio: null,
  returnOnEquity: null,
  returnOnAssets: null,
  profitMargins: 22.42,
  operatingMargins: 32.58,
  earningsGrowth: -11.3,
  revenueGrowth: -5.7,
  earningsQuarterlyGrowth: -13.5,
  dividendYield: null,
  payoutRatio: null,
  marketCap: 3200870000000,
  beta: 0.303,
  fundamentalScore: 52.3,
  fundamentalRating: 'AVERAGE'
};

// Build signals
function buildSignals(technical) {
  return {
    priceCrossSMA200: technical.lastPrice > technical.sma200 ? 'above' : 'below',
    priceCrossEMA50: technical.lastPrice > technical.ema50 ? 'above' : 'below',
    priceCrossSMA100: technical.sma100 ?
      (technical.lastPrice > technical.sma100 ? 'above' : 'below') : null,
    goldenCross: technical.ema50 > technical.sma200,
    deathCross: technical.ema50 < technical.sma200,
    macdBullish: technical.macd > 0 && technical.macdHistogram > 0,
    macdBearish: technical.macd < 0 || technical.macdHistogram < 0,
    rsiOverbought: technical.rsi14 > 70,
    rsiOversold: technical.rsi14 < 30,
    volumeSpike: technical.volume > (technical.avgVolume20 * 1.5),
    volume: technical.volume,
    supertrendBullish: undefined,
    supertrendBearish: undefined,
    supertrend: undefined,
    sma20: technical.sma20,
    sma50: technical.sma50,
    sma100: technical.sma100,
    sma200: technical.sma200,
    ema50: technical.ema50,
    ema50CrossSMA200: technical.ema50 > technical.sma200 ? 'above' : 'below'
  };
}

// Value Investor Rules
function checkValueInvestor(signals, technical, fundamental) {
  const conditions = {
    priceToBook: fundamental.priceToBook !== null && fundamental.priceToBook > 0 && fundamental.priceToBook < 5.0,
    priceToSales: fundamental.priceToSales !== null && fundamental.priceToSales > 0 && fundamental.priceToSales < 5.0,
    forwardPE: fundamental.forwardPE !== null && fundamental.forwardPE > 0 && fundamental.forwardPE < 100 ?
      fundamental.forwardPE < 20.0 : true,
    trailingPE: fundamental.trailingPE !== null && fundamental.trailingPE > 0 && fundamental.trailingPE < 25.0,
    fundamentalScore: fundamental.fundamentalScore ? fundamental.fundamentalScore >= 60 : false,
    profitMargins: fundamental.profitMargins !== null && fundamental.profitMargins >= 15,
    operatingMargins: fundamental.operatingMargins !== null && fundamental.operatingMargins >= 20,
    debtToEquity: fundamental.debtToEquity !== null && fundamental.debtToEquity >= 0 && fundamental.debtToEquity < 1.0,
    priceVsSMA200: technical.lastPrice < (technical.sma200 * 1.10),
    technicalConfirmation: [
      signals.priceCrossSMA200 === 'above',
      technical.rsi14 >= 30 && technical.rsi14 <= 60,
      technical.lastPrice < technical.bollingerUpper
    ].filter(Boolean).length >= 2
  };

  const met = Object.values(conditions).filter(v => v === true).length;
  const total = Object.keys(conditions).length;
  const canEnter = met === total;
  const failedConditions = Object.keys(conditions).filter(k => !conditions[k]);

  return { canEnter, conditions, met, total, failedConditions };
}

// Growth Investor Rules
function checkGrowthInvestor(signals, technical, fundamental) {
  const growthScore = [
    fundamental.earningsGrowth !== null && fundamental.earningsGrowth >= 15,
    fundamental.earningsQuarterlyGrowth !== null && fundamental.earningsQuarterlyGrowth >= 12,
    fundamental.revenueGrowth !== null && fundamental.revenueGrowth >= 8,
    technical.changePercent > 0
  ].filter(Boolean).length;

  const momentumScore = [
    signals.goldenCross === true,
    signals.macdBullish === true,
    technical.macd > 0 && technical.macdHistogram > 0,
    technical.rsi14 >= 50 && technical.rsi14 <= 70,
    signals.priceCrossEMA50 === 'above',
    signals.supertrendBullish === true
  ].filter(Boolean).length;

  const conditions = {
    growthScore: growthScore >= 3,
    pegRatio: fundamental.pegRatio === null || fundamental.pegRatio < 2.0,
    momentumScore: momentumScore >= 4,
    priceAboveEMA50: signals.priceCrossEMA50 === 'above',
    priceAboveSMA200: signals.priceCrossSMA200 === 'above',
    volumeConfirmation: technical.lastPrice > 0 &&
                        (signals.volume / technical.avgVolume20) >= 0.5,
    overallSignal: technical.overallSignal ?
      ['STRONG_BUY', 'BUY'].includes(technical.overallSignal) : false
  };

  const met = Object.values(conditions).filter(v => v === true).length;
  const total = Object.keys(conditions).length;
  const canEnter = met === total;
  const failedConditions = Object.keys(conditions).filter(k => !conditions[k]);

  return { canEnter, conditions, met, total, failedConditions, scores: { growthScore, momentumScore } };
}

// Momentum Trader Rules
function checkMomentumTrader(signals, technical, fundamental) {
  const momentumScore = [
    signals.goldenCross === true,
    signals.macdBullish === true,
    technical.macdHistogram > technical.macdSignal,
    technical.rsi14 >= 50 && technical.rsi14 <= 70,
    signals.supertrendBullish === true,
    signals.ema50CrossSMA200 === 'above',
    technical.lastPrice > technical.ema9
  ].filter(Boolean).length;

  const conditions = {
    momentumSignals: momentumScore >= 5,
    priceAboveSMA20: technical.lastPrice > technical.sma20,
    priceAboveSMA50: technical.lastPrice > technical.sma50,
    rsiNotOverbought: technical.rsi14 < 70,
    withinBollingerBands: technical.lastPrice < technical.bollingerUpper &&
                          technical.lastPrice > technical.bollingerLower,
    volumeConfirmation: signals.volumeSpike === true ||
                        (technical.volume / technical.avgVolume20) >= 0.8,
    Supertrend: technical.supertrend ? technical.lastPrice > technical.supertrend : false
  };

  const met = Object.values(conditions).filter(v => v === true).length;
  const total = Object.keys(conditions).length;
  const canEnter = met === total;
  const failedConditions = Object.keys(conditions).filter(k => !conditions[k]);

  return { canEnter, conditions, met, total, failedConditions, scores: { momentumScore } };
}

// Quality Investor Rules
function checkQualityInvestor(signals, technical, fundamental) {
  const qualityScore = [
    fundamental.operatingMargins !== null && fundamental.operatingMargins >= 25,
    fundamental.profitMargins !== null && fundamental.profitMargins >= 20,
    fundamental.fundamentalRating ? ['GOOD', 'EXCELLENT'].includes(fundamental.fundamentalRating) : false,
    fundamental.fundamentalScore ? fundamental.fundamentalScore >= 65 : false,
    fundamental.debtToEquity !== null && fundamental.debtToEquity < 1.5,
    fundamental.earningsGrowth !== null && fundamental.earningsGrowth >= 10,
    fundamental.dividendYield !== null && fundamental.dividendYield > 0
  ].filter(Boolean).length;

  const technicalScore = [
    signals.priceCrossSMA200 === 'above',
    signals.macdBullish === true,
    technical.rsi14 >= 45 && technical.rsi14 <= 65,
    signals.supertrendBullish === true,
    technical.overallSignal ? ['STRONG_BUY', 'BUY'].includes(technical.overallSignal) : false
  ].filter(Boolean).length;

  const conditions = {
    qualityScore: qualityScore >= 5,
    beta: fundamental.beta !== null && fundamental.beta > 0 && fundamental.beta < 1.0,
    earningsGrowth: fundamental.earningsGrowth !== null && fundamental.earningsGrowth >= 8,
    quarterlyGrowth: fundamental.earningsQuarterlyGrowth !== null &&
                     fundamental.earningsQuarterlyGrowth >= 10,
    technicalConfirmation: technicalScore >= 3,
    forwardPE: fundamental.forwardPE !== null && fundamental.forwardPE > 0 && fundamental.forwardPE < 100 ?
      fundamental.forwardPE < 50 : true,
    priceToBook: fundamental.priceToBook !== null && fundamental.priceToBook > 0 && fundamental.priceToBook < 10
  };

  const met = Object.values(conditions).filter(v => v === true).length;
  const total = Object.keys(conditions).length;
  const canEnter = met === total;
  const failedConditions = Object.keys(conditions).filter(k => !conditions[k]);

  return { canEnter, conditions, met, total, failedConditions, scores: { qualityScore, technicalScore } };
}

// Dividend Investor Rules
function checkDividendInvestor(signals, technical, fundamental) {
  const stabilityScore = [
    fundamental.debtToEquity !== null && fundamental.debtToEquity < 1.2,
    fundamental.beta !== null && fundamental.beta < 0.8,
    fundamental.profitMargins !== null && fundamental.profitMargins >= 10,
    fundamental.fundamentalScore ? fundamental.fundamentalScore >= 60 : false,
    fundamental.currentRatio !== null && fundamental.currentRatio >= 1.5
  ].filter(Boolean).length;

  const technicalScore = [
    signals.priceCrossSMA200 === 'above',
    technical.rsi14 >= 35 && technical.rsi14 <= 65,
    signals.macdBullish === true
  ].filter(Boolean).length;

  const conditions = {
    dividendYield: fundamental.dividendYield !== null && fundamental.dividendYield >= 2.5,
    payoutRatio: fundamental.payoutRatio !== null &&
                 fundamental.payoutRatio > 0 &&
                 fundamental.payoutRatio <= 70,
    stabilityScore: stabilityScore >= 4,
    earningsGrowth: fundamental.earningsGrowth !== null && fundamental.earningsGrowth >= 0,
    forwardPE: fundamental.forwardPE !== null && fundamental.forwardPE > 0 && fundamental.forwardPE < 100 ?
      fundamental.forwardPE < 25 : true,
    priceToBook: fundamental.priceToBook !== null && fundamental.priceToBook > 0 && fundamental.priceToBook < 5,
    technicalConfirmation: technicalScore >= 2
  };

  const met = Object.values(conditions).filter(v => v === true).length;
  const total = Object.keys(conditions).length;
  const canEnter = met === total;
  const failedConditions = Object.keys(conditions).filter(k => !conditions[k]);

  return { canEnter, conditions, met, total, failedConditions, scores: { stabilityScore, technicalScore } };
}

// Run all tests
const signals = buildSignals(technicalData);

console.log('=' .repeat(80));
console.log('ADANIPOWER - INVESTMENT RULES ANALYSIS');
console.log('=' .repeat(80));

const results = {
  value: checkValueInvestor(signals, technicalData, fundamentalData),
  growth: checkGrowthInvestor(signals, technicalData, fundamentalData),
  momentum: checkMomentumTrader(signals, technicalData, fundamentalData),
  quality: checkQualityInvestor(signals, technicalData, fundamentalData),
  dividend: checkDividendInvestor(signals, technicalData, fundamentalData)
};

const investorTypes = {
  value: { name: 'Value Investor', icon: '💎' },
  growth: { name: 'Growth Investor', icon: '📈' },
  momentum: { name: 'Momentum Trader', icon: '🚀' },
  quality: { name: 'Quality Investor', icon: '⭐' },
  dividend: { name: 'Dividend Investor', icon: '💰' }
};

Object.entries(results).forEach(([type, result]) => {
  const info = investorTypes[type];
  console.log(`\n${info.icon} ${info.name.toUpperCase()}`);
  console.log('-'.repeat(80));
  console.log(`Status: ${result.canEnter ? '✅ SUITABLE' : '❌ NOT SUITABLE'}`);
  console.log(`Met: ${result.met}/${result.total} conditions`);

  if (result.scores) {
    console.log(`Scores:`, result.scores);
  }

  if (result.failedConditions.length > 0) {
    console.log(`\nFailed conditions:`);
    result.failedConditions.forEach(cond => {
      console.log(`  ❌ ${cond}`);
    });
  }
});

console.log('\n' + '='.repeat(80));
console.log('SUMMARY');
console.log('='.repeat(80));
const suitable = Object.entries(results).filter(([_, r]) => r.canEnter).map(([type, _]) => investorTypes[type].name);
const notSuitable = Object.entries(results).filter(([_, r]) => !r.canEnter).map(([type, _]) => investorTypes[type].name);

console.log(`\n✅ SUITABLE FOR: ${suitable.length > 0 ? suitable.join(', ') : 'NONE'}`);
console.log(`❌ NOT SUITABLE FOR: ${notSuitable.join(', ')}`);
console.log('\n' + '='.repeat(80));
