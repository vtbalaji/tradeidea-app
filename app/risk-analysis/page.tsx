'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAccounts } from '@/contexts/AccountsContext';
import { useTrading } from '@/contexts/TradingContext';
import type { PortfolioAnalysis, Position } from '@/lib/portfolioAnalysis';

export default function RiskAnalysisPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { activeAccount, accounts } = useAccounts();
  const { myPortfolio } = useTrading();
  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user && !user.emailVerified) {
      router.push('/verify');
    }
  }, [user, router]);

  // Filter positions by active account
  const accountPositions = useMemo(() => {
    if (!activeAccount) return myPortfolio;
    // Filter positions that belong to active account (or have no accountId - legacy positions)
    return myPortfolio.filter(p =>
      p.status === 'open' && (!p.accountId || p.accountId === activeAccount.id)
    );
  }, [myPortfolio, activeAccount]);

  // Fetch portfolio analysis
  useEffect(() => {
    if (!activeAccount) return;

    const fetchAnalysis = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get open positions from active account
        const positions: Position[] = accountPositions.map((p: any) => ({
          symbol: p.symbol,
          quantity: p.quantity,
          entryPrice: p.entryPrice,
          currentPrice: p.currentPrice,
          totalValue: p.currentPrice * p.quantity,
        }));

        if (positions.length === 0) {
          setError('No open positions found in your portfolio. Add some positions to see risk analysis.');
          setLoading(false);
          return;
        }

        // Call API endpoint
        const response = await fetch('/api/portfolio/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ positions, accountId: activeAccount.id }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to analyze portfolio');
        }

        const data = await response.json();
        setAnalysis(data.analysis);
      } catch (err) {
        console.error('Error fetching analysis:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [activeAccount, accountPositions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0f1419]">
        <Navigation />
        <div className="p-5 pt-5">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Reports</h1>
          <div className="text-center py-16">
            <div className="inline-block w-12 h-12 border-4 border-[#ff8c42] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 dark:text-[#8b949e] text-lg">Analyzing your portfolio...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0f1419]">
        <Navigation />
        <div className="p-5 pt-5">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Reports</h1>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">Error</h3>
            <p className="text-red-600 dark:text-red-300">{error}</p>
            <button
              onClick={() => router.push('/portfolio')}
              className="mt-4 px-4 py-2 bg-[#ff8c42] hover:bg-[#ff9a58] text-white font-semibold rounded-lg transition-colors"
            >
              Go to Portfolio
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1419]">
      <Navigation />

      <div className="p-5 pt-5">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Reports</h1>
          <p className="text-sm text-gray-600 dark:text-[#8b949e]">
            Portfolio: {activeAccount?.name || 'Default'} • {analysis.positionCount} positions • ₹{analysis.totalValue.toLocaleString('en-IN')}
          </p>
        </div>

        {/* Warnings */}
        {analysis.warnings.length > 0 && (
          <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-3">⚠️ Recommendations</h3>
            <ul className="space-y-2">
              {analysis.warnings.map((warning, idx) => (
                <li key={idx} className="text-sm text-yellow-700 dark:text-yellow-300">{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Diversification Score */}
        <div className="mb-6 bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Diversification Score</h2>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="w-full bg-gray-200 dark:bg-[#30363d] rounded-full h-4">
                <div
                  className={`h-4 rounded-full transition-all ${
                    analysis.diversificationScore >= 70
                      ? 'bg-green-500'
                      : analysis.diversificationScore >= 40
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${analysis.diversificationScore}%` }}
                ></div>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {analysis.diversificationScore}/100
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-[#8b949e] mt-3">
            {analysis.diversificationScore >= 70
              ? '✅ Your portfolio is well diversified across sectors and market caps'
              : analysis.diversificationScore >= 40
              ? '⚠️ Your portfolio has moderate diversification. Consider spreading investments'
              : '❌ Your portfolio is concentrated. Consider adding more variety'}
          </p>
        </div>

        {/* Sector Distribution */}
        <div className="mb-6 bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Sector Distribution</h2>
          <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-4">
            Portfolio distribution check across various sectors. An ideal portfolio invests in stocks from different sectors to reduce market risk and volatility.
          </p>
          <div className="space-y-4">
            {analysis.sectorDistribution.map((sector, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{sector.sector}</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    ₹{sector.value.toLocaleString('en-IN')} ({sector.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-[#30363d] rounded-full h-2">
                  <div
                    className="bg-[#ff8c42] h-2 rounded-full"
                    style={{ width: `${sector.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          {analysis.sectorDistribution.every(s => s.percentage < 40) && (
            <p className="mt-4 text-sm text-green-600 dark:text-green-400">
              ✅ Your portfolio is well diversified across sectors.
            </p>
          )}
        </div>

        {/* Market Cap Distribution */}
        <div className="mb-6 bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Market Cap Distribution</h2>
          <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-4">
            Portfolio distribution check across different market capitalizations (large, mid and small). Large and mid cap stocks are considered less risky compared to small cap stocks, but do not have aggressive growth potential.
          </p>
          <div className="space-y-4">
            {analysis.marketCapDistribution.map((cap, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{cap.category}</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    ₹{cap.value.toLocaleString('en-IN')} ({cap.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-[#30363d] rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      cap.category === 'Large Cap'
                        ? 'bg-blue-500'
                        : cap.category === 'Mid Cap'
                        ? 'bg-purple-500'
                        : 'bg-orange-500'
                    }`}
                    style={{ width: `${cap.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Beta */}
          <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">BETA</h3>
            <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-4">
              Beta (β) measures volatility or systematic risk of your portfolio against the Nifty 50. A portfolio with beta lower than the market has lower volatility than the Nifty 50. A portfolio can have a lower beta and still have higher total risk due to firm-specific risks.
            </p>

            {/* Beta Scale */}
            <div className="relative w-full h-20 mb-4">
              <div className="absolute top-8 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-white to-red-500 rounded-full"></div>
              <div className="absolute top-0 flex justify-between w-full text-xs text-gray-600 dark:text-[#8b949e]">
                <span>0.54</span>
                <span>0.71</span>
                <span>0.86</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">1.02</span>
                <span>1.19</span>
                <span>1.34</span>
              </div>
              {/* Nifty50 Marker */}
              <div className="absolute top-6" style={{ left: '50%', transform: 'translateX(-50%)' }}>
                <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white"></div>
                <div className="text-xs text-center mt-1 font-semibold text-blue-600">Nifty50<br/>1</div>
              </div>
              {/* Portfolio Marker */}
              <div
                className="absolute top-6"
                style={{
                  left: `${Math.min(100, Math.max(0, (analysis.riskMetrics.beta - 0.54) / (1.34 - 0.54) * 100))}%`,
                  transform: 'translateX(-50%)'
                }}
              >
                <div className="w-4 h-4 bg-red-600 rounded-full border-2 border-white"></div>
                <div className="text-xs text-center mt-1 font-semibold text-red-600">Portfolio<br/>{analysis.riskMetrics.beta}</div>
              </div>
            </div>

            {analysis.riskMetrics.beta > 1 ? (
              <p className="text-sm text-orange-600 dark:text-orange-400">
                💡 Portfolio Beta is higher than Nifty 50 index.
              </p>
            ) : (
              <p className="text-sm text-gray-600 dark:text-[#8b949e]">
                ✅ Your Portfolio's Beta is {analysis.riskMetrics.beta}
              </p>
            )}
          </div>

          {/* Standard Deviation */}
          <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Standard Deviation</h3>
            <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-4">
              Standard deviation of a portfolio measures how much investment returns differ from the average probability. A smaller standard deviation means less risk, with steady returns. A smaller standard deviation means less risk, with volatile returns.
            </p>

            {/* Std Dev Scale */}
            <div className="relative w-full h-20 mb-4">
              <div className="absolute top-8 left-0 right-0 h-2 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full"></div>
              <div className="absolute top-0 flex justify-between w-full text-xs text-gray-600 dark:text-[#8b949e]">
                <span>-7.89</span>
                <span>3.19</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">12.72</span>
                <span>25.33</span>
                <span>36.40</span>
                <span>47.48</span>
              </div>
              {/* Nifty50 Marker */}
              <div className="absolute top-6" style={{ left: '35%', transform: 'translateX(-50%)' }}>
                <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white"></div>
                <div className="text-xs text-center mt-1 font-semibold text-blue-600">Nifty50<br/>{analysis.riskMetrics.benchmarkStdDev}</div>
              </div>
              {/* Portfolio Marker */}
              <div
                className="absolute top-6"
                style={{
                  left: `${Math.min(100, Math.max(0, (analysis.riskMetrics.standardDeviation + 7.89) / (47.48 + 7.89) * 100))}%`,
                  transform: 'translateX(-50%)'
                }}
              >
                <div className="w-4 h-4 bg-red-600 rounded-full border-2 border-white"></div>
                <div className="text-xs text-center mt-1 font-semibold text-red-600">Portfolio<br/>{analysis.riskMetrics.standardDeviation}</div>
              </div>
            </div>

            {analysis.riskMetrics.standardDeviation > analysis.riskMetrics.benchmarkStdDev ? (
              <p className="text-sm text-orange-600 dark:text-orange-400">
                💡 Your portfolio's higher standard deviation indicates increased volatility and lower predictability compared to Nifty 50.
              </p>
            ) : (
              <p className="text-sm text-gray-600 dark:text-[#8b949e]">
                ✅ Your Portfolio's Standard Deviation is {analysis.riskMetrics.standardDeviation}, which is comparable to Standard deviation of {analysis.riskMetrics.benchmarkStdDev}.
              </p>
            )}
          </div>

          {/* Sharpe Ratio */}
          <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Sharpe Ratio</h3>
            <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-4">
              The Sharpe ratio measures risk-adjusted returns. It checks if the excess return gained is in line with the extra risk taken. If your investment did well. If the ratio is higher than 1, it's good. If it's more than 2, it's very good. Greater than 3 is excellent.
            </p>

            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
                  {analysis.riskMetrics.sharpeRatio}
                </div>
                <div className="text-sm text-gray-600 dark:text-[#8b949e]">Portfolio</div>
              </div>
              <div className="mx-8 text-2xl text-gray-400">vs</div>
              <div className="text-center">
                <div className="text-5xl font-bold text-blue-600">-0.29</div>
                <div className="text-sm text-gray-600 dark:text-[#8b949e]">Nifty50</div>
              </div>
            </div>

            {analysis.riskMetrics.sharpeRatio > 1 ? (
              <p className="text-sm text-green-600 dark:text-green-400">
                ✅ Your portfolio's Sharpe Ratio is {analysis.riskMetrics.sharpeRatio}, indicating good risk-adjusted returns.
              </p>
            ) : analysis.riskMetrics.sharpeRatio > 0 ? (
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                💡 Your portfolio's lower Sharpe Ratio ({analysis.riskMetrics.sharpeRatio}) means you are taking additional risk but not necessarily earning higher returns.
              </p>
            ) : (
              <p className="text-sm text-red-600 dark:text-red-400">
                ❌ Negative Sharpe Ratio indicates returns below the risk-free rate.
              </p>
            )}
          </div>
        </div>

        {/* Data Source Info */}
        <div className="text-center text-xs text-gray-500 dark:text-[#8b949e] mt-8">
          <p>Data Source: {analysis.dataSource} • Calculated at: {new Date(analysis.calculatedAt).toLocaleString('en-IN')}</p>
          <p className="mt-1">Beta calculated vs Nifty 50 • Risk-free rate: 7% (10Y G-Sec)</p>
        </div>
      </div>
    </div>
  );
}
