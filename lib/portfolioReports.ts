/**
 * Portfolio Reports Library
 *
 * Generates additional portfolio analysis reports by REUSING existing logic:
 * - Exit alerts from exitCriteriaAnalysis.ts
 * - Recommendations from exitCriteriaAnalysis.ts
 * - Technical/Fundamental scores from symbols collection
 *
 * This ensures consistency across all views of the same data.
 */

import { analyzeExitCriteria, getOverallRecommendation } from './exitCriteriaAnalysis';

// Report Interfaces
export interface PerformanceAttribution {
  bySector: SectorPerformance[];
  byMarketCap: MarketCapPerformance[];
  topWinners: PositionPerformance[];
  topLosers: PositionPerformance[];
  overall: {
    totalPnL: number;
    totalPnLPercent: number;
    todayPnL: number;
    todayPnLPercent: number;
    totalInvested: number;
    totalCurrent: number;
    winningPositions: number;
    losingPositions: number;
    winRate: number;
  };
}

export interface SectorPerformance {
  sector: string;
  value: number;
  pnl: number;
  pnlPercent: number;
  positionCount: number;
}

export interface MarketCapPerformance {
  category: 'Large Cap' | 'Mid Cap' | 'Small Cap';
  value: number;
  pnl: number;
  pnlPercent: number;
  positionCount: number;
}

export interface PositionPerformance {
  symbol: string;
  pnl: number;
  pnlPercent: number;
  value: number;
  invested: number;
}

export interface PositionQuality {
  symbol: string;
  fundamentalScore: number;
  fundamentalRating: string | null;
  technicalSignal: string;
  recommendation: any; // From getOverallRecommendation
  riskFlags: string[];
  value: number;
}

export interface PositionQualityScorecard {
  positions: PositionQuality[];
  summary: {
    excellentCount: number; // EXCELLENT fundamental
    goodCount: number; // GOOD fundamental
    averageCount: number; // AVERAGE fundamental
    weakCount: number; // WEAK/POOR fundamental
    strongBuyCount: number;
    buyCount: number;
    holdCount: number;
    sellCount: number;
    totalRiskFlags: number;
  };
}

/**
 * Classify market cap based on NSE standards
 */
function classifyMarketCap(marketCap: number | null): 'Large Cap' | 'Mid Cap' | 'Small Cap' {
  if (!marketCap) return 'Small Cap';
  const marketCapCr = marketCap / 10000000; // Convert to crores
  if (marketCapCr > 50000) return 'Large Cap';
  if (marketCapCr > 10000) return 'Mid Cap';
  return 'Small Cap';
}

/**
 * REPORT 1: Performance Attribution
 * Shows where returns are coming from
 */
export function calculatePerformanceAttribution(
  positions: any[],
  symbolMetadata: Map<string, any>
): PerformanceAttribution {
  // Calculate P&L for each position
  const positionsWithPnL = positions.map(p => {
    const invested = p.entryPrice * p.quantity;
    const current = p.currentPrice * p.quantity;
    const pnl = current - invested;
    const pnlPercent = (pnl / invested) * 100;
    return { ...p, invested, current, pnl, pnlPercent };
  });

  // Overall stats
  const totalInvested = positionsWithPnL.reduce((sum, p) => sum + p.invested, 0);
  const totalCurrent = positionsWithPnL.reduce((sum, p) => sum + p.current, 0);
  const totalPnL = totalCurrent - totalInvested;
  const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  const winningPositions = positionsWithPnL.filter(p => p.pnl > 0).length;
  const losingPositions = positionsWithPnL.filter(p => p.pnl < 0).length;
  const winRate = positions.length > 0 ? (winningPositions / positions.length) * 100 : 0;

  // Calculate Today's P&L using previousClose from technical data
  const todayPnL = positions.reduce((sum, p) => {
    if (p.technicals?.previousClose && p.currentPrice) {
      const dailyPnl = (p.currentPrice - p.technicals.previousClose) * p.quantity;
      return sum + dailyPnl;
    }
    return sum;
  }, 0);
  const todayPnLPercent = totalCurrent > 0 ? (todayPnL / totalCurrent) * 100 : 0;

  // By Sector
  const sectorMap = new Map<string, { value: number; pnl: number; invested: number; count: number }>();
  for (const p of positionsWithPnL) {
    const metadata = symbolMetadata.get(p.symbol);
    const sector = metadata?.sector || metadata?.fundamental?.sector || 'Unknown';
    const existing = sectorMap.get(sector) || { value: 0, pnl: 0, invested: 0, count: 0 };
    sectorMap.set(sector, {
      value: existing.value + p.current,
      pnl: existing.pnl + p.pnl,
      invested: existing.invested + p.invested,
      count: existing.count + 1,
    });
  }

  const bySector: SectorPerformance[] = [];
  for (const [sector, data] of sectorMap.entries()) {
    bySector.push({
      sector,
      value: data.value,
      pnl: data.pnl,
      pnlPercent: data.invested > 0 ? (data.pnl / data.invested) * 100 : 0,
      positionCount: data.count,
    });
  }
  bySector.sort((a, b) => b.pnl - a.pnl);

  // By Market Cap
  const capMap = new Map<string, { value: number; pnl: number; invested: number; count: number }>();
  for (const p of positionsWithPnL) {
    const metadata = symbolMetadata.get(p.symbol);
    const marketCap = metadata?.marketCap || metadata?.fundamental?.marketCap || null;
    const category = classifyMarketCap(marketCap);
    const existing = capMap.get(category) || { value: 0, pnl: 0, invested: 0, count: 0 };
    capMap.set(category, {
      value: existing.value + p.current,
      pnl: existing.pnl + p.pnl,
      invested: existing.invested + p.invested,
      count: existing.count + 1,
    });
  }

  const byMarketCap: MarketCapPerformance[] = [];
  const categories: Array<'Large Cap' | 'Mid Cap' | 'Small Cap'> = ['Large Cap', 'Mid Cap', 'Small Cap'];
  for (const category of categories) {
    const data = capMap.get(category);
    if (data) {
      byMarketCap.push({
        category,
        value: data.value,
        pnl: data.pnl,
        pnlPercent: data.invested > 0 ? (data.pnl / data.invested) * 100 : 0,
        positionCount: data.count,
      });
    }
  }

  // Top 5 Winners and Losers
  const sorted = [...positionsWithPnL].sort((a, b) => b.pnl - a.pnl);
  const topWinners: PositionPerformance[] = sorted.slice(0, Math.min(5, sorted.length)).map(p => ({
    symbol: p.symbol,
    pnl: p.pnl,
    pnlPercent: p.pnlPercent,
    value: p.current,
    invested: p.invested,
  }));
  const topLosers: PositionPerformance[] = sorted.slice(-Math.min(5, sorted.length)).reverse().map(p => ({
    symbol: p.symbol,
    pnl: p.pnl,
    pnlPercent: p.pnlPercent,
    value: p.current,
    invested: p.invested,
  }));

  return {
    bySector,
    byMarketCap,
    topWinners,
    topLosers,
    overall: {
      totalPnL,
      totalPnLPercent,
      todayPnL,
      todayPnLPercent,
      totalInvested,
      totalCurrent,
      winningPositions,
      losingPositions,
      winRate,
    },
  };
}

/**
 * REPORT 2: Position Quality Scorecard
 * REUSES fundamentalScore, fundamentalRating from Firestore
 * REUSES getOverallRecommendation() from exitCriteriaAnalysis.ts
 */
export function calculatePositionQuality(positions: any[]): PositionQualityScorecard {
  const qualityPositions: PositionQuality[] = [];

  for (const p of positions) {
    const { symbol, currentPrice, quantity, fundamentals, technicals } = p;

    // REUSE existing fundamental score from Firestore
    // Don't show rating if no meaningful fundamental data (score = 0 or no rating)
    const fundamentalScore = fundamentals?.fundamentalScore || 0;
    const fundamentalRating = (fundamentals?.fundamentalRating && fundamentalScore > 0)
      ? fundamentals.fundamentalRating
      : null;

    // REUSE existing technical signal from Firestore
    const technicalSignal = technicals?.overallSignal || 'NEUTRAL';

    // REUSE existing recommendation calculation
    const recommendation = getOverallRecommendation(p);

    // Identify risk flags
    const riskFlags: string[] = [];

    // Fundamental risk flags
    if (fundamentalRating === 'POOR' || fundamentalRating === 'WEAK') {
      riskFlags.push('Weak Fundamentals');
    }
    if (fundamentals?.debtToEquity && fundamentals.debtToEquity > 1.5) {
      riskFlags.push('High Debt');
    }
    if (fundamentals?.returnOnEquity && fundamentals.returnOnEquity < 10) {
      riskFlags.push('Low ROE');
    }

    // Technical risk flags
    if (technicals?.trendStructure === 'DOWNTREND') {
      riskFlags.push('Downtrend');
    }
    if (technicals?.rsi14 && technicals.rsi14 > 70) {
      riskFlags.push('Overbought');
    }
    if (technicals?.rsi14 && technicals.rsi14 < 30) {
      riskFlags.push('Oversold');
    }
    if (recommendation.recommendation === 'SELL' || recommendation.recommendation === 'STRONG SELL') {
      riskFlags.push('Sell Signal');
    }

    qualityPositions.push({
      symbol,
      fundamentalScore,
      fundamentalRating,
      technicalSignal,
      recommendation,
      riskFlags,
      value: currentPrice * quantity,
    });
  }

  // Sort by fundamental score descending
  qualityPositions.sort((a, b) => b.fundamentalScore - a.fundamentalScore);

  // Summary (exclude positions without fundamental data)
  const excellentCount = qualityPositions.filter(p => p.fundamentalRating === 'EXCELLENT').length;
  const goodCount = qualityPositions.filter(p => p.fundamentalRating === 'GOOD').length;
  const averageCount = qualityPositions.filter(p => p.fundamentalRating === 'AVERAGE').length;
  const weakCount = qualityPositions.filter(p =>
    p.fundamentalRating === 'WEAK' || p.fundamentalRating === 'POOR'
  ).length;

  const strongBuyCount = qualityPositions.filter(p => p.recommendation.recommendation === 'STRONG BUY').length;
  const buyCount = qualityPositions.filter(p => p.recommendation.recommendation === 'BUY').length;
  const holdCount = qualityPositions.filter(p => p.recommendation.recommendation === 'HOLD').length;
  const sellCount = qualityPositions.filter(p =>
    p.recommendation.recommendation === 'SELL' || p.recommendation.recommendation === 'STRONG SELL'
  ).length;

  const totalRiskFlags = qualityPositions.reduce((sum, p) => sum + p.riskFlags.length, 0);

  return {
    positions: qualityPositions,
    summary: {
      excellentCount,
      goodCount,
      averageCount,
      weakCount,
      strongBuyCount,
      buyCount,
      holdCount,
      sellCount,
      totalRiskFlags,
    },
  };
}
