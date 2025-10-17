import {
  analyzeExitCriteria,
  getOverallRecommendation,
  ExitAlert,
} from '@/lib/exitCriteriaAnalysis';

describe('exitCriteriaAnalysis', () => {
  describe('analyzeExitCriteria', () => {
    it('should return null when no exit criteria defined', () => {
      const position = {
        symbol: 'RELIANCE',
        currentPrice: 2800,
        exitCriteria: null,
      };

      const result = analyzeExitCriteria(position);
      expect(result).toBeNull();
    });

    it('should detect stop loss hit', () => {
      const position = {
        symbol: 'RELIANCE',
        currentPrice: 2400,
        stopLoss: 2450,
        exitCriteria: { exitAtStopLoss: true },
        smartSLTrigger: 'no',
      };

      const alerts = analyzeExitCriteria(position);

      expect(alerts).not.toBeNull();
      expect(alerts![0].type).toBe('critical');
      expect(alerts![0].message).toContain('STOP LOSS HIT');
    });

    it('should warn when near stop loss', () => {
      const position = {
        symbol: 'RELIANCE',
        currentPrice: 2470,
        stopLoss: 2450,
        exitCriteria: { exitAtStopLoss: true },
        smartSLTrigger: 'no',
      };

      const alerts = analyzeExitCriteria(position);

      expect(alerts![0].type).toBe('warning');
      expect(alerts![0].message).toContain('Near SL');
    });

    it('should show info when stop loss is safe', () => {
      const position = {
        symbol: 'RELIANCE',
        currentPrice: 2800,
        stopLoss: 2450,
        exitCriteria: { exitAtStopLoss: true },
        smartSLTrigger: 'no',
      };

      const alerts = analyzeExitCriteria(position);

      expect(alerts![0].type).toBe('info');
      expect(alerts![0].message).toContain('SL Safe');
    });

    it('should detect Smart SL phases', () => {
      const position = {
        symbol: 'RELIANCE',
        currentPrice: 2800,
        stopLoss: 2650,
        exitCriteria: { exitAtStopLoss: true },
        smartSLTrigger: 'yes',
        smartSLPhase: 'trailing',
        smartSLSource: 'EMA50',
      };

      const alerts = analyzeExitCriteria(position);

      expect(alerts![0].message).toContain('Smart SL: Trailing (EMA50)');
    });

    it('should detect below 50 EMA critical exit', () => {
      const position = {
        symbol: 'RELIANCE',
        currentPrice: 2400,
        exitCriteria: { exitBelow50EMA: true },
        technicals: { ema50: 2450 },
      };

      const alerts = analyzeExitCriteria(position);

      const emaAlert = alerts!.find(a => a.message.includes('50 EMA'));
      expect(emaAlert).toBeDefined();
      expect(emaAlert!.type).toBe('critical');
      expect(emaAlert!.message).toContain('TIME TO EXIT');
    });

    it('should detect above 100 MA', () => {
      const position = {
        symbol: 'RELIANCE',
        currentPrice: 2800,
        exitCriteria: { exitBelow100MA: true },
        technicals: { sma100: 2500 },
      };

      const alerts = analyzeExitCriteria(position);

      const maAlert = alerts!.find(a => a.message.includes('100 MA'));
      expect(maAlert).toBeDefined();
      expect(maAlert!.type).toBe('info');
      expect(maAlert!.message).toContain('Above 100 MA');
    });

    it('should detect bearish Supertrend', () => {
      const position = {
        symbol: 'RELIANCE',
        currentPrice: 2400,
        exitCriteria: { exitOnWeeklySupertrend: true },
        technicals: {
          supertrend: 2450,
          supertrendDirection: -1,
        },
      };

      const alerts = analyzeExitCriteria(position);

      const stAlert = alerts!.find(a => a.message.includes('Supertrend'));
      expect(stAlert).toBeDefined();
      expect(stAlert!.type).toBe('critical');
      expect(stAlert!.message).toContain('BEARISH');
    });

    it('should detect bullish Supertrend', () => {
      const position = {
        symbol: 'RELIANCE',
        currentPrice: 2800,
        exitCriteria: { exitOnWeeklySupertrend: true },
        technicals: {
          supertrend: 2450,
          supertrendDirection: 1,
        },
      };

      const alerts = analyzeExitCriteria(position);

      const stAlert = alerts!.find(a => a.message.includes('Supertrend'));
      expect(stAlert).toBeDefined();
      expect(stAlert!.type).toBe('info');
      expect(stAlert!.message).toContain('BULLISH');
    });

    it('should warn when technical data is missing', () => {
      const position = {
        symbol: 'RELIANCE',
        currentPrice: 2800,
        exitCriteria: { exitBelow50EMA: true },
        technicals: {},
      };

      const alerts = analyzeExitCriteria(position);

      expect(alerts![0].type).toBe('warning');
      expect(alerts![0].message).toContain('50 EMA data not available');
    });

    it('should handle multiple exit criteria', () => {
      const position = {
        symbol: 'RELIANCE',
        currentPrice: 2800,
        stopLoss: 2650,
        exitCriteria: {
          exitAtStopLoss: true,
          exitBelow50EMA: true,
          exitBelow200MA: true,
        },
        smartSLTrigger: 'no',
        technicals: {
          ema50: 2500,
          sma200: 2400,
        },
      };

      const alerts = analyzeExitCriteria(position);

      expect(alerts!.length).toBeGreaterThan(1);
    });
  });

  describe('getOverallRecommendation', () => {
    it('should return HOLD when no technical data', () => {
      const position = {
        symbol: 'RELIANCE',
        currentPrice: 2800,
        technicals: null,
      };

      const result = getOverallRecommendation(position);

      expect(result.recommendation).toBe('HOLD');
      expect(result.icon).toBe('●');
    });

    it('should use overallSignal from Python script when available', () => {
      const position = {
        symbol: 'RELIANCE',
        currentPrice: 2800,
        technicals: {
          overallSignal: 'STRONG_BUY',
        },
      };

      const result = getOverallRecommendation(position);

      expect(result.recommendation).toBe('STRONG BUY');
      expect(result.icon).toBe('▲▲');
    });

    it('should map all signal types correctly', () => {
      const signals = ['STRONG_BUY', 'BUY', 'NEUTRAL', 'SELL', 'STRONG_SELL'];
      const expected = ['STRONG BUY', 'BUY', 'HOLD', 'SELL', 'STRONG SELL'];

      signals.forEach((signal, i) => {
        const position = {
          currentPrice: 2800,
          technicals: { overallSignal: signal },
        };

        const result = getOverallRecommendation(position);
        expect(result.recommendation).toBe(expected[i]);
      });
    });

    it('should use fallback logic when overallSignal not available', () => {
      const position = {
        symbol: 'RELIANCE',
        currentPrice: 2800,
        technicals: {
          rsi14: 65,
          sma50: 2600,
          sma100: 2500,
          sma200: 2400,
          supertrendDirection: 1,
          trendStructure: 'UPTREND',
          bollingerMiddle: 2700,
          bbPositionHistory: ['ABOVE', 'ABOVE', 'ABOVE'],
          macdHistogram: 5,
          volume: 1000000,
          avgVolume20: 800000,
        },
      };

      const result = getOverallRecommendation(position);

      expect(result.recommendation).toBe('STRONG BUY');
    });

    it('should detect STRONG SELL in downtrend', () => {
      const position = {
        currentPrice: 2400,
        technicals: {
          rsi14: 25,
          sma50: 2600,
          trendStructure: 'DOWNTREND',
          bollingerMiddle: 2500,
          bbPositionHistory: ['BELOW', 'BELOW', 'BELOW'],
        },
      };

      const result = getOverallRecommendation(position);

      expect(result.recommendation).toBe('STRONG SELL');
      expect(result.icon).toBe('▼▼');
    });

    it('should detect SELL signal', () => {
      const position = {
        currentPrice: 2400,
        technicals: {
          rsi14: 45,
          sma50: 2600,
          trendStructure: 'DOWNTREND',
          bollingerMiddle: 2500,
        },
      };

      const result = getOverallRecommendation(position);

      expect(result.recommendation).toBe('SELL');
      expect(result.icon).toBe('▼');
    });

    it('should detect BUY signal in uptrend', () => {
      const position = {
        currentPrice: 2800,
        technicals: {
          rsi14: 58,
          sma50: 2600,
          trendStructure: 'UPTREND',
          bollingerMiddle: 2650,
          bbPositionHistory: ['ABOVE', 'ABOVE', 'ABOVE'],
          macdHistogram: 3,
        },
      };

      const result = getOverallRecommendation(position);

      expect(result.recommendation).toBe('BUY');
      expect(result.icon).toBe('▲');
    });

    it('should detect HOLD in sideways market', () => {
      const position = {
        currentPrice: 2700,
        technicals: {
          rsi14: 50,
          sma50: 2650,
          trendStructure: 'SIDEWAYS',
        },
      };

      const result = getOverallRecommendation(position);

      expect(result.recommendation).toBe('HOLD');
      expect(result.icon).toBe('■');
    });

    it('should have correct color classes for each recommendation', () => {
      const recommendations = [
        { signal: 'STRONG_BUY', colorClass: 'text-green-700' },
        { signal: 'BUY', colorClass: 'text-green-600' },
        { signal: 'NEUTRAL', colorClass: 'text-blue-600' },
        { signal: 'SELL', colorClass: 'text-orange-600' },
        { signal: 'STRONG_SELL', colorClass: 'text-red-600' },
      ];

      recommendations.forEach(({ signal, colorClass }) => {
        const position = {
          currentPrice: 2800,
          technicals: { overallSignal: signal },
        };

        const result = getOverallRecommendation(position);
        expect(result.textColor).toContain(colorClass.split(' ')[0].split('-')[1]); // Check color name
      });
    });
  });
});
