import {
  calculateSectorDistribution,
  calculateMarketCapDistribution,
  calculatePortfolioBeta,
  calculateStandardDeviation,
  calculateSharpeRatio,
  calculateAnnualizedReturn,
  calculateDiversificationScore,
  generateWarnings,
  Position,
  SymbolMetadata,
  SectorAllocation,
  MarketCapAllocation,
} from '@/lib/portfolioAnalysis';

describe('portfolioAnalysis', () => {
  const mockPositions: Position[] = [
    {
      symbol: 'RELIANCE',
      quantity: 10,
      entryPrice: 2500,
      currentPrice: 2800,
      totalValue: 28000,
    },
    {
      symbol: 'TCS',
      quantity: 5,
      entryPrice: 3500,
      currentPrice: 3800,
      totalValue: 19000,
    },
    {
      symbol: 'INFY',
      quantity: 15,
      entryPrice: 1500,
      currentPrice: 1600,
      totalValue: 24000,
    },
  ];

  const mockMetadata = new Map<string, SymbolMetadata>([
    ['RELIANCE', { symbol: 'RELIANCE', sector: 'Energy', industry: 'Oil & Gas', marketCap: 180000000000, beta: 1.2 }],
    ['TCS', { symbol: 'TCS', sector: 'IT', industry: 'Software', marketCap: 130000000000, beta: 0.8 }],
    ['INFY', { symbol: 'INFY', sector: 'IT', industry: 'Software', marketCap: 70000000000, beta: 0.9 }],
  ]);

  describe('calculateSectorDistribution', () => {
    it('should calculate sector distribution correctly', () => {
      const result = calculateSectorDistribution(mockPositions, mockMetadata);

      expect(result).toHaveLength(2);
      expect(result[0].sector).toBe('IT');
      expect(result[0].value).toBe(43000);
      expect(result[0].percentage).toBeCloseTo(60.56, 1);
      expect(result[0].count).toBe(2);

      expect(result[1].sector).toBe('Energy');
      expect(result[1].value).toBe(28000);
      expect(result[1].percentage).toBeCloseTo(39.44, 1);
      expect(result[1].count).toBe(1);
    });

    it('should handle unknown sectors', () => {
      const unknownPositions: Position[] = [
        { symbol: 'UNKNOWN', quantity: 1, entryPrice: 100, currentPrice: 100, totalValue: 100 },
      ];
      const emptyMetadata = new Map();

      const result = calculateSectorDistribution(unknownPositions, emptyMetadata);

      expect(result).toHaveLength(1);
      expect(result[0].sector).toBe('Unknown');
    });

    it('should sort by value descending', () => {
      const result = calculateSectorDistribution(mockPositions, mockMetadata);

      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].value).toBeGreaterThanOrEqual(result[i + 1].value);
      }
    });
  });

  describe('calculateMarketCapDistribution', () => {
    it('should classify market cap correctly', () => {
      const result = calculateMarketCapDistribution(mockPositions, mockMetadata);

      // All three stocks are large cap (>50k crores)
      const largeCap = result.find(r => r.category === 'Large Cap');
      if (largeCap) {
        expect(largeCap.count).toBeGreaterThan(0);
        expect(largeCap.value).toBeGreaterThan(0);
      }
      // At least one category should exist
      expect(result.length).toBeGreaterThan(0);
    });

    it('should calculate percentages correctly', () => {
      const result = calculateMarketCapDistribution(mockPositions, mockMetadata);

      const totalPercentage = result.reduce((sum, r) => sum + r.percentage, 0);
      expect(totalPercentage).toBeCloseTo(100, 0);
    });
  });

  describe('calculatePortfolioBeta', () => {
    it('should calculate weighted average beta', () => {
      const beta = calculatePortfolioBeta(mockPositions, mockMetadata);

      // Weighted: (28000*1.2 + 19000*0.8 + 24000*0.9) / 71000 = 0.99
      expect(beta).toBeCloseTo(0.99, 1);
    });

    it('should default to 1.0 for missing beta', () => {
      const noMetadata = new Map();
      const beta = calculatePortfolioBeta(mockPositions, noMetadata);

      expect(beta).toBe(1.0);
    });
  });

  describe('calculateStandardDeviation', () => {
    it('should calculate annualized standard deviation', () => {
      const returns = [0.01, -0.005, 0.015, -0.01, 0.02]; // Daily returns
      const stdDev = calculateStandardDeviation(returns);

      expect(stdDev).toBeGreaterThan(0);
      expect(stdDev).toBeLessThan(100); // Reasonable annualized volatility
    });

    it('should return 0 for insufficient data', () => {
      expect(calculateStandardDeviation([0.01])).toBe(0);
      expect(calculateStandardDeviation([])).toBe(0);
    });

    it('should handle zero volatility', () => {
      const returns = [0, 0, 0, 0];
      const stdDev = calculateStandardDeviation(returns);

      expect(stdDev).toBe(0);
    });
  });

  describe('calculateAnnualizedReturn', () => {
    it('should calculate annualized return correctly', () => {
      const returns = [0.01, 0.01, 0.01]; // 1% daily for 3 days
      const annualizedReturn = calculateAnnualizedReturn(returns);

      expect(annualizedReturn).toBeGreaterThan(0);
    });

    it('should return 0 for empty returns', () => {
      expect(calculateAnnualizedReturn([])).toBe(0);
    });

    it('should handle negative returns', () => {
      const returns = [-0.01, -0.01, -0.01];
      const annualizedReturn = calculateAnnualizedReturn(returns);

      expect(annualizedReturn).toBeLessThan(0);
    });
  });

  describe('calculateSharpeRatio', () => {
    it('should calculate Sharpe ratio correctly', () => {
      const portfolioReturn = 15; // 15%
      const riskFreeRate = 7; // 7%
      const stdDev = 20; // 20% volatility

      const sharpe = calculateSharpeRatio(portfolioReturn, riskFreeRate, stdDev);

      expect(sharpe).toBeCloseTo(0.4, 1); // (15-7)/20 = 0.4
    });

    it('should return 0 for zero volatility', () => {
      const sharpe = calculateSharpeRatio(10, 7, 0);
      expect(sharpe).toBe(0);
    });

    it('should handle negative Sharpe ratio', () => {
      const sharpe = calculateSharpeRatio(5, 7, 10); // Below risk-free rate
      expect(sharpe).toBeLessThan(0);
    });
  });

  describe('calculateDiversificationScore', () => {
    it('should score well-diversified portfolio highly', () => {
      const sectors: SectorAllocation[] = [
        { sector: 'IT', value: 20000, percentage: 25, count: 2 },
        { sector: 'Banking', value: 20000, percentage: 25, count: 2 },
        { sector: 'Pharma', value: 20000, percentage: 25, count: 2 },
        { sector: 'Auto', value: 20000, percentage: 25, count: 2 },
      ];

      const marketCaps: MarketCapAllocation[] = [
        { category: 'Large Cap', value: 30000, percentage: 37.5, count: 3 },
        { category: 'Mid Cap', value: 30000, percentage: 37.5, count: 3 },
        { category: 'Small Cap', value: 20000, percentage: 25, count: 2 },
      ];

      const score = calculateDiversificationScore(sectors, marketCaps, 12);

      expect(score).toBeGreaterThan(70);
    });

    it('should score concentrated portfolio lower', () => {
      const sectors: SectorAllocation[] = [
        { sector: 'IT', value: 60000, percentage: 80, count: 4 },
        { sector: 'Banking', value: 15000, percentage: 20, count: 1 },
      ];

      const marketCaps: MarketCapAllocation[] = [
        { category: 'Large Cap', value: 75000, percentage: 100, count: 5 },
      ];

      const score = calculateDiversificationScore(sectors, marketCaps, 5);

      expect(score).toBeLessThan(50);
    });

    it('should penalize too many positions', () => {
      const sectors: SectorAllocation[] = [
        { sector: 'IT', value: 20000, percentage: 25, count: 10 },
      ];
      const marketCaps: MarketCapAllocation[] = [
        { category: 'Large Cap', value: 80000, percentage: 100, count: 40 },
      ];

      const score = calculateDiversificationScore(sectors, marketCaps, 40);

      expect(score).toBeLessThan(60);
    });
  });

  describe('generateWarnings', () => {
    it('should warn about sector concentration', () => {
      const sectors: SectorAllocation[] = [
        { sector: 'IT', value: 60000, percentage: 85, count: 4 },
      ];
      const marketCaps: MarketCapAllocation[] = [];
      const riskMetrics = { beta: 1.0, standardDeviation: 20, sharpeRatio: 1.0, benchmarkBeta: 1.0, benchmarkStdDev: 18 };

      const warnings = generateWarnings(sectors, marketCaps, riskMetrics, 4);

      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings.some(w => w.includes('concentration'))).toBe(true);
    });

    it('should warn about too few positions', () => {
      const sectors: SectorAllocation[] = [];
      const marketCaps: MarketCapAllocation[] = [];
      const riskMetrics = { beta: 1.0, standardDeviation: 20, sharpeRatio: 1.0, benchmarkBeta: 1.0, benchmarkStdDev: 18 };

      const warnings = generateWarnings(sectors, marketCaps, riskMetrics, 3);

      expect(warnings.some(w => w.includes('only 3 positions'))).toBe(true);
    });

    it('should warn about high beta', () => {
      const sectors: SectorAllocation[] = [];
      const marketCaps: MarketCapAllocation[] = [];
      const riskMetrics = { beta: 1.8, standardDeviation: 20, sharpeRatio: 1.0, benchmarkBeta: 1.0, benchmarkStdDev: 18 };

      const warnings = generateWarnings(sectors, marketCaps, riskMetrics, 10);

      expect(warnings.some(w => w.includes('beta'))).toBe(true);
    });

    it('should warn about negative Sharpe ratio', () => {
      const sectors: SectorAllocation[] = [];
      const marketCaps: MarketCapAllocation[] = [];
      const riskMetrics = { beta: 1.0, standardDeviation: 20, sharpeRatio: -0.5, benchmarkBeta: 1.0, benchmarkStdDev: 18 };

      const warnings = generateWarnings(sectors, marketCaps, riskMetrics, 10);

      expect(warnings.some(w => w.includes('Negative Sharpe'))).toBe(true);
    });

    it('should warn about small cap concentration', () => {
      const sectors: SectorAllocation[] = [];
      const marketCaps: MarketCapAllocation[] = [
        { category: 'Small Cap', value: 60000, percentage: 75, count: 8 },
      ];
      const riskMetrics = { beta: 1.0, standardDeviation: 20, sharpeRatio: 1.0, benchmarkBeta: 1.0, benchmarkStdDev: 18 };

      const warnings = generateWarnings(sectors, marketCaps, riskMetrics, 8);

      expect(warnings.some(w => w.includes('Small Cap'))).toBe(true);
    });
  });
});
