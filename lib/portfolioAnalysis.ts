/**
 * Portfolio Risk Analysis Library
 *
 * Calculates portfolio-level risk metrics including:
 * - Sector and Market Cap distribution
 * - Beta (systematic risk vs Nifty 50)
 * - Standard Deviation (volatility)
 * - Sharpe Ratio (risk-adjusted returns)
 */

export interface Position {
  symbol: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  totalValue: number;
}

export interface SectorAllocation {
  sector: string;
  value: number;
  percentage: number;
  count: number; // number of positions
}

export interface MarketCapAllocation {
  category: 'Large Cap' | 'Mid Cap' | 'Small Cap';
  value: number;
  percentage: number;
  count: number;
}

export interface RiskMetrics {
  beta: number; // Portfolio beta vs Nifty 50
  standardDeviation: number; // Annualized volatility (%)
  sharpeRatio: number; // Risk-adjusted returns
  benchmarkBeta: number; // Nifty 50 beta (always 1.0)
  benchmarkStdDev: number; // Nifty 50 standard deviation
}

export interface PortfolioAnalysis {
  totalValue: number;
  positionCount: number;

  // Distribution Analysis
  sectorDistribution: SectorAllocation[];
  marketCapDistribution: MarketCapAllocation[];

  // Risk Metrics
  riskMetrics: RiskMetrics;

  // Diversification Score (0-100)
  diversificationScore: number;

  // Warnings/Recommendations
  warnings: string[];

  // Calculation metadata
  calculatedAt: Date;
  dataSource: string;
}

export interface SymbolMetadata {
  symbol: string;
  sector: string | null;
  industry: string | null;
  marketCap: number | null;
  beta: number | null;
}

export interface HistoricalReturn {
  date: string;
  return: number; // Daily return as decimal (e.g., 0.02 = 2%)
}

/**
 * Calculate sector distribution from portfolio positions
 */
export function calculateSectorDistribution(
  positions: Position[],
  symbolMetadata: Map<string, SymbolMetadata>
): SectorAllocation[] {
  const totalValue = positions.reduce((sum, p) => sum + p.totalValue, 0);
  const sectorMap = new Map<string, { value: number; count: number }>();

  for (const position of positions) {
    const metadata = symbolMetadata.get(position.symbol);
    const sector = metadata?.sector || 'Unknown';

    const existing = sectorMap.get(sector) || { value: 0, count: 0 };
    sectorMap.set(sector, {
      value: existing.value + position.totalValue,
      count: existing.count + 1,
    });
  }

  const distribution: SectorAllocation[] = [];
  for (const [sector, data] of sectorMap.entries()) {
    distribution.push({
      sector,
      value: data.value,
      percentage: (data.value / totalValue) * 100,
      count: data.count,
    });
  }

  // Sort by value descending
  return distribution.sort((a, b) => b.value - a.value);
}

/**
 * Classify market cap based on NSE standards
 * Large Cap: Top 100 stocks by market cap
 * Mid Cap: 101-250
 * Small Cap: 251+
 */
function classifyMarketCap(marketCap: number | null): 'Large Cap' | 'Mid Cap' | 'Small Cap' {
  if (!marketCap) return 'Small Cap';

  // Rough thresholds (in crores):
  // Large Cap: > 50,000 Cr
  // Mid Cap: 10,000 - 50,000 Cr
  // Small Cap: < 10,000 Cr
  const marketCapCr = marketCap / 10000000; // Convert to crores

  if (marketCapCr > 50000) return 'Large Cap';
  if (marketCapCr > 10000) return 'Mid Cap';
  return 'Small Cap';
}

/**
 * Calculate market cap distribution from portfolio positions
 */
export function calculateMarketCapDistribution(
  positions: Position[],
  symbolMetadata: Map<string, SymbolMetadata>
): MarketCapAllocation[] {
  const totalValue = positions.reduce((sum, p) => sum + p.totalValue, 0);
  const capMap = new Map<string, { value: number; count: number }>();

  for (const position of positions) {
    const metadata = symbolMetadata.get(position.symbol);
    const category = classifyMarketCap(metadata?.marketCap || null);

    const existing = capMap.get(category) || { value: 0, count: 0 };
    capMap.set(category, {
      value: existing.value + position.totalValue,
      count: existing.count + 1,
    });
  }

  const distribution: MarketCapAllocation[] = [];
  const categories: Array<'Large Cap' | 'Mid Cap' | 'Small Cap'> = ['Large Cap', 'Mid Cap', 'Small Cap'];

  for (const category of categories) {
    const data = capMap.get(category);
    if (data) {
      distribution.push({
        category,
        value: data.value,
        percentage: (data.value / totalValue) * 100,
        count: data.count,
      });
    }
  }

  return distribution;
}

/**
 * Calculate portfolio beta (weighted average of individual stock betas)
 */
export function calculatePortfolioBeta(
  positions: Position[],
  symbolMetadata: Map<string, SymbolMetadata>
): number {
  const totalValue = positions.reduce((sum, p) => sum + p.totalValue, 0);
  let weightedBeta = 0;

  for (const position of positions) {
    const metadata = symbolMetadata.get(position.symbol);
    const beta = metadata?.beta || 1.0; // Default to 1.0 if no beta available
    const weight = position.totalValue / totalValue;
    weightedBeta += weight * beta;
  }

  return Number(weightedBeta.toFixed(2));
}

/**
 * Calculate standard deviation from historical returns
 * Returns annualized standard deviation as a percentage
 */
export function calculateStandardDeviation(returns: number[]): number {
  if (returns.length < 2) return 0;

  // Calculate mean
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;

  // Calculate variance
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);

  // Standard deviation (daily)
  const stdDev = Math.sqrt(variance);

  // Annualize (assuming 252 trading days)
  const annualizedStdDev = stdDev * Math.sqrt(252);

  // Convert to percentage
  return Number((annualizedStdDev * 100).toFixed(2));
}

/**
 * Calculate Sharpe Ratio
 * Formula: (Portfolio Return - Risk Free Rate) / Portfolio Standard Deviation
 */
export function calculateSharpeRatio(
  portfolioReturn: number,
  riskFreeRate: number,
  standardDeviation: number
): number {
  if (standardDeviation === 0) return 0;

  // All inputs should be annualized percentages
  const sharpe = (portfolioReturn - riskFreeRate) / standardDeviation;

  return Number(sharpe.toFixed(2));
}

/**
 * Calculate annualized return from daily returns
 */
export function calculateAnnualizedReturn(returns: number[]): number {
  if (returns.length === 0) return 0;

  // Calculate cumulative return
  let cumulative = 1;
  for (const r of returns) {
    cumulative *= (1 + r);
  }

  // Annualize based on number of days
  const days = returns.length;
  const annualizedReturn = Math.pow(cumulative, 252 / days) - 1;

  return Number((annualizedReturn * 100).toFixed(2));
}

/**
 * Calculate diversification score (0-100)
 * Higher score = better diversified
 */
export function calculateDiversificationScore(
  sectorDistribution: SectorAllocation[],
  marketCapDistribution: MarketCapAllocation[],
  positionCount: number
): number {
  let score = 0;

  // Factor 1: Number of positions (max 25 points)
  // Ideal: 10-20 positions
  if (positionCount >= 10 && positionCount <= 20) {
    score += 25;
  } else if (positionCount >= 5 && positionCount < 10) {
    score += 15;
  } else if (positionCount > 20) {
    score += 10; // Too many positions can be hard to manage
  }

  // Factor 2: Sector diversification (max 40 points)
  // No single sector should exceed 40%
  // Ideally 4+ sectors
  const maxSectorAllocation = Math.max(...sectorDistribution.map(s => s.percentage));
  const sectorCount = sectorDistribution.length;

  if (maxSectorAllocation < 30 && sectorCount >= 5) {
    score += 40;
  } else if (maxSectorAllocation < 40 && sectorCount >= 4) {
    score += 30;
  } else if (maxSectorAllocation < 50 && sectorCount >= 3) {
    score += 20;
  } else {
    score += 10;
  }

  // Factor 3: Market cap diversification (max 35 points)
  // Good mix of large, mid, small caps
  const hasLargeCap = marketCapDistribution.some(m => m.category === 'Large Cap' && m.percentage >= 20);
  const hasMidCap = marketCapDistribution.some(m => m.category === 'Mid Cap' && m.percentage >= 15);
  const hasSmallCap = marketCapDistribution.some(m => m.category === 'Small Cap' && m.percentage >= 10);

  if (hasLargeCap && hasMidCap && hasSmallCap) {
    score += 35; // Well balanced
  } else if (hasLargeCap && (hasMidCap || hasSmallCap)) {
    score += 25; // Good balance
  } else {
    score += 15; // Concentrated
  }

  return Math.min(100, score);
}

/**
 * Generate warnings and recommendations based on portfolio analysis
 */
export function generateWarnings(
  sectorDistribution: SectorAllocation[],
  marketCapDistribution: MarketCapAllocation[],
  riskMetrics: RiskMetrics,
  positionCount: number
): string[] {
  const warnings: string[] = [];

  // Check for sector concentration
  const maxSectorAllocation = Math.max(...sectorDistribution.map(s => s.percentage));
  if (maxSectorAllocation > 40) {
    const topSector = sectorDistribution[0];
    warnings.push(`⚠️ High concentration in ${topSector.sector} sector (${topSector.percentage.toFixed(1)}%). Consider diversifying.`);
  }

  // Check for too few positions
  if (positionCount < 5) {
    warnings.push(`⚠️ Portfolio has only ${positionCount} positions. Consider adding more stocks for better diversification.`);
  }

  // Check for too many positions
  if (positionCount > 30) {
    warnings.push(`⚠️ Portfolio has ${positionCount} positions. This may be difficult to manage effectively.`);
  }

  // Check for high beta (risky)
  if (riskMetrics.beta > 1.5) {
    warnings.push(`⚠️ Portfolio beta is ${riskMetrics.beta}, indicating high market risk. Portfolio is ${((riskMetrics.beta - 1) * 100).toFixed(0)}% more volatile than Nifty 50.`);
  }

  // Check for high volatility
  if (riskMetrics.standardDeviation > 40) {
    warnings.push(`⚠️ High portfolio volatility (${riskMetrics.standardDeviation}% std dev). Consider adding more stable stocks.`);
  }

  // Check for negative Sharpe ratio
  if (riskMetrics.sharpeRatio < 0) {
    warnings.push(`⚠️ Negative Sharpe ratio (${riskMetrics.sharpeRatio}). Portfolio returns are below the risk-free rate.`);
  }

  // Check market cap concentration
  const smallCapPercentage = marketCapDistribution.find(m => m.category === 'Small Cap')?.percentage || 0;
  if (smallCapPercentage > 50) {
    warnings.push(`⚠️ Over 50% allocation to Small Cap stocks. These are more volatile and risky.`);
  }

  return warnings;
}

/**
 * Main function to analyze portfolio
 * This will be called from the API endpoint
 */
export async function analyzePortfolio(
  positions: Position[],
  symbolMetadata: Map<string, SymbolMetadata>,
  portfolioReturns: number[],
  benchmarkReturns: number[],
  riskFreeRate: number = 7.0 // Default 7% (Indian 10Y G-Sec)
): Promise<PortfolioAnalysis> {
  const totalValue = positions.reduce((sum, p) => sum + p.totalValue, 0);
  const positionCount = positions.length;

  // Calculate distributions
  const sectorDistribution = calculateSectorDistribution(positions, symbolMetadata);
  const marketCapDistribution = calculateMarketCapDistribution(positions, symbolMetadata);

  // Calculate risk metrics
  const portfolioBeta = calculatePortfolioBeta(positions, symbolMetadata);

  // If no historical returns data, use estimated/default values
  // These would ideally be pre-calculated by batch jobs
  const portfolioStdDev = portfolioReturns.length > 0
    ? calculateStandardDeviation(portfolioReturns)
    : 25.0; // Default: 25% annualized volatility (typical for Indian equities)

  const benchmarkStdDev = benchmarkReturns.length > 0
    ? calculateStandardDeviation(benchmarkReturns)
    : 18.0; // Nifty 50 typical volatility: ~18%

  const portfolioReturn = portfolioReturns.length > 0
    ? calculateAnnualizedReturn(portfolioReturns)
    : 0.0; // Default: 0% (unknown without data)

  const sharpeRatio = calculateSharpeRatio(portfolioReturn, riskFreeRate, portfolioStdDev);

  const riskMetrics: RiskMetrics = {
    beta: portfolioBeta,
    standardDeviation: portfolioStdDev,
    sharpeRatio,
    benchmarkBeta: 1.0, // Nifty 50 beta is always 1.0
    benchmarkStdDev,
  };

  // Calculate diversification score
  const diversificationScore = calculateDiversificationScore(
    sectorDistribution,
    marketCapDistribution,
    positionCount
  );

  // Generate warnings
  const warnings = generateWarnings(
    sectorDistribution,
    marketCapDistribution,
    riskMetrics,
    positionCount
  );

  return {
    totalValue,
    positionCount,
    sectorDistribution,
    marketCapDistribution,
    riskMetrics,
    diversificationScore,
    warnings,
    calculatedAt: new Date(),
    dataSource: 'firestore-metadata',
  };
}
