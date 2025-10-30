'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAccounts } from '@/contexts/AccountsContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Feature } from '@/types/subscription';
import { UpgradePrompt } from '@/components/subscription/UpgradePrompt';
// import { useTrading } from '@/contexts/TradingContext'; // Removed - use API directly
import { apiClient } from '@/lib/apiClient';
import type { PortfolioAnalysis, Position } from '@/lib/portfolioAnalysis';
import { trackFeatureUsed } from '@/lib/analytics';

export default function RiskAnalysisPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { activeAccount, accounts } = useAccounts();
  const { hasAccess, loading: subscriptionLoading } = useSubscription();
  // const { myPortfolio } = useTrading(); // Removed - fetch from API
  const [myPortfolio, setMyPortfolio] = useState<any[]>([]);
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

  // Fetch portfolio data from API
  useEffect(() => {
    const fetchPortfolio = async () => {
      if (!user) {
        setMyPortfolio([]);
        return;
      }

      try {
        const response = await apiClient.portfolio.list(activeAccount?.id);
        setMyPortfolio(response.positions || []);
      } catch (error) {
        console.error('Error fetching portfolio:', error);
        setMyPortfolio([]);
      }
    };

    fetchPortfolio();
  }, [user, activeAccount]);

  // Filter positions by active account
  const accountPositions = useMemo(() => {
    if (!activeAccount) return myPortfolio || [];
    // Filter positions that belong to active account (or have no accountId - legacy positions)
    return (myPortfolio || []).filter(p =>
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
        // Get open positions from active account with full data
        const positions = accountPositions.map((p: any) => ({
          symbol: p.symbol,
          quantity: p.quantity,
          entryPrice: p.entryPrice,
          currentPrice: p.currentPrice,
          totalValue: p.currentPrice * p.quantity,
          stopLoss: p.stopLoss,
          target1: p.target1,
          technicals: p.technicals,
          fundamentals: p.fundamentals,
          exitCriteria: p.exitCriteria,
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
        // Track risk analysis viewed
        trackFeatureUsed('risk_analysis', activeAccount.name);
      } catch (err) {
        console.error('Error fetching analysis:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [activeAccount, accountPositions]);

  // Check if subscription is still loading
  if (subscriptionLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0f1419]">
        <Navigation />
        <div className="p-5 pt-5">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Reports</h1>
          <div className="text-center py-16">
            <div className="inline-block w-12 h-12 border-4 border-[#ff8c42] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 dark:text-[#8b949e] text-lg">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Check premium access
  if (!hasAccess(Feature.REPORTS)) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0f1419]">
        <Navigation />
        <div className="p-5 pt-5">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Reports</h1>
          <UpgradePrompt
            featureName="Reports & Risk Analysis"
            message="Upgrade to Premium to access comprehensive portfolio risk analysis, diversification metrics, and performance insights."
          />
        </div>
      </div>
    );
  }

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

        {/* Value at Risk (VaR) */}
        {analysis.riskMetrics.valueAtRisk && (
          <div className="mb-6 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10 border border-red-200 dark:border-red-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Value at Risk (VaR)</h2>
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-semibold rounded">RISK</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-6">
              VaR estimates the maximum potential loss your portfolio could face under normal market conditions.
              It answers: "What is the worst loss I could expect with X% confidence over 1 day?"
            </p>

            {/* VaR Methods Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Historical VaR */}
              <div className="bg-white dark:bg-[#1c2128] border border-red-200 dark:border-red-800 rounded-lg p-5">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <span className="text-xl">📊</span>
                  Historical VaR
                </h3>
                <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-4">
                  Based on actual past returns. No assumptions about distribution.
                </p>

                <div className="space-y-3">
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">95% Confidence</span>
                      <span className="text-xs text-gray-600 dark:text-[#8b949e]">(1 in 20 days)</span>
                    </div>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      ₹{analysis.riskMetrics.valueAtRisk.historicalVaR95.toLocaleString('en-IN')}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-[#8b949e]">
                      {analysis.riskMetrics.valueAtRisk.historicalVaR95Percent.toFixed(2)}% of portfolio
                    </div>
                  </div>

                  <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-600 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">99% Confidence</span>
                      <span className="text-xs text-gray-600 dark:text-[#8b949e]">(1 in 100 days)</span>
                    </div>
                    <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                      ₹{analysis.riskMetrics.valueAtRisk.historicalVaR99.toLocaleString('en-IN')}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-[#8b949e]">
                      {analysis.riskMetrics.valueAtRisk.historicalVaR99Percent.toFixed(2)}% of portfolio
                    </div>
                  </div>
                </div>
              </div>

              {/* Parametric VaR */}
              <div className="bg-white dark:bg-[#1c2128] border border-orange-200 dark:border-orange-800 rounded-lg p-5">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <span className="text-xl">📐</span>
                  Parametric VaR
                </h3>
                <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-4">
                  Assumes normal distribution. Faster computation, works with less data.
                </p>

                <div className="space-y-3">
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">95% Confidence</span>
                      <span className="text-xs text-gray-600 dark:text-[#8b949e]">(1 in 20 days)</span>
                    </div>
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      ₹{analysis.riskMetrics.valueAtRisk.parametricVaR95.toLocaleString('en-IN')}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-[#8b949e]">
                      {analysis.riskMetrics.valueAtRisk.parametricVaR95Percent.toFixed(2)}% of portfolio
                    </div>
                  </div>

                  <div className="bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-600 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">99% Confidence</span>
                      <span className="text-xs text-gray-600 dark:text-[#8b949e]">(1 in 100 days)</span>
                    </div>
                    <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                      ₹{analysis.riskMetrics.valueAtRisk.parametricVaR99.toLocaleString('en-IN')}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-[#8b949e]">
                      {analysis.riskMetrics.valueAtRisk.parametricVaR99Percent.toFixed(2)}% of portfolio
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Explanation Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-2">💡 What does this mean?</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1.5">
                <li className="flex gap-2">
                  <span className="flex-shrink-0">•</span>
                  <span><strong>95% Confidence:</strong> On 95 out of 100 days, your losses will be less than this amount. Only 1 in 20 days might exceed this.</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0">•</span>
                  <span><strong>99% Confidence:</strong> On 99 out of 100 days, your losses will be less than this amount. Only 1 in 100 days might exceed this.</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0">•</span>
                  <span><strong>Portfolio Value:</strong> ₹{analysis.riskMetrics.valueAtRisk.portfolioValue.toLocaleString('en-IN')}</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0">•</span>
                  <span>{analysis.riskMetrics.valueAtRisk.explanation}</span>
                </li>
              </ul>
            </div>

            {/* Warning */}
            <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                ⚠️ <strong>Important:</strong> VaR estimates potential losses under <em>normal</em> market conditions.
                During extreme events (market crashes, black swan events), actual losses may exceed VaR significantly.
                Always maintain proper stop-losses and position sizing.
              </p>
            </div>
          </div>
        )}

        {/* NEW REPORT 1: Performance Attribution */}
        {analysis.performanceAttribution && (
          <div className="mb-6 bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Performance Attribution</h2>

            {/* Overall Summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-white dark:bg-[#0f1419] p-4 rounded-lg border border-gray-200 dark:border-[#30363d]">
                <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-1">Today's P&L</p>
                <p className={`text-2xl font-bold ${analysis.performanceAttribution.overall.todayPnL >= 0 ? 'text-purple-500' : 'text-orange-500'}`}>
                  {analysis.performanceAttribution.overall.todayPnL >= 0 ? '+' : ''}₹{Math.round(analysis.performanceAttribution.overall.todayPnL).toLocaleString('en-IN')}
                </p>
                <p className={`text-sm ${analysis.performanceAttribution.overall.todayPnLPercent >= 0 ? 'text-purple-500' : 'text-orange-500'}`}>
                  ({analysis.performanceAttribution.overall.todayPnLPercent >= 0 ? '+' : ''}{analysis.performanceAttribution.overall.todayPnLPercent.toFixed(2)}%)
                </p>
              </div>
              <div className="bg-white dark:bg-[#0f1419] p-4 rounded-lg border border-gray-200 dark:border-[#30363d]">
                <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-1">Total P&L</p>
                <p className={`text-2xl font-bold ${analysis.performanceAttribution.overall.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {analysis.performanceAttribution.overall.totalPnL >= 0 ? '+' : ''}₹{Math.round(analysis.performanceAttribution.overall.totalPnL).toLocaleString('en-IN')}
                </p>
                <p className={`text-sm ${analysis.performanceAttribution.overall.totalPnLPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  ({analysis.performanceAttribution.overall.totalPnLPercent >= 0 ? '+' : ''}{analysis.performanceAttribution.overall.totalPnLPercent.toFixed(2)}%)
                </p>
              </div>
              <div className="bg-white dark:bg-[#0f1419] p-4 rounded-lg border border-gray-200 dark:border-[#30363d]">
                <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-1">Win Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{analysis.performanceAttribution.overall.winRate.toFixed(1)}%</p>
                <p className="text-sm text-gray-600 dark:text-[#8b949e]">
                  {analysis.performanceAttribution.overall.winningPositions}W / {analysis.performanceAttribution.overall.losingPositions}L
                </p>
              </div>
              <div className="bg-white dark:bg-[#0f1419] p-4 rounded-lg border border-gray-200 dark:border-[#30363d]">
                <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-1">Invested</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{Math.round(analysis.performanceAttribution.overall.totalInvested).toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-white dark:bg-[#0f1419] p-4 rounded-lg border border-gray-200 dark:border-[#30363d]">
                <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-1">Current Value</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{Math.round(analysis.performanceAttribution.overall.totalCurrent).toLocaleString('en-IN')}</p>
              </div>
            </div>

            {/* Top Winners & Losers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Top Winners */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">🏆 Top Winners</h3>
                <div className="space-y-2">
                  {analysis.performanceAttribution.topWinners.map((pos, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-white dark:bg-[#0f1419] rounded border border-gray-200 dark:border-[#30363d]">
                      <span className="font-semibold text-gray-900 dark:text-white">{pos.symbol}</span>
                      <span className="text-green-500 font-bold">+₹{Math.round(pos.pnl).toLocaleString('en-IN')} ({pos.pnlPercent.toFixed(1)}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Losers */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">📉 Top Losers</h3>
                <div className="space-y-2">
                  {analysis.performanceAttribution.topLosers.map((pos, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-white dark:bg-[#0f1419] rounded border border-gray-200 dark:border-[#30363d]">
                      <span className="font-semibold text-gray-900 dark:text-white">{pos.symbol}</span>
                      <span className="text-red-500 font-bold">₹{Math.round(pos.pnl).toLocaleString('en-IN')} ({pos.pnlPercent.toFixed(1)}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* By Sector Performance */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Performance by Sector</h3>
              <div className="space-y-3">
                {analysis.performanceAttribution.bySector.map((sector, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{sector.sector}</span>
                      <span className={`text-sm font-bold ${sector.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {sector.pnl >= 0 ? '+' : ''}₹{Math.round(sector.pnl).toLocaleString('en-IN')} ({sector.pnlPercent.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-[#30363d] rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${sector.pnl >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(100, Math.abs(sector.pnlPercent) * 2)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* By Market Cap Performance */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Performance by Market Cap</h3>
              <div className="space-y-3">
                {analysis.performanceAttribution.byMarketCap.map((cap, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{cap.category}</span>
                      <span className={`text-sm font-bold ${cap.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {cap.pnl >= 0 ? '+' : ''}₹{Math.round(cap.pnl).toLocaleString('en-IN')} ({cap.pnlPercent.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-[#30363d] rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${cap.pnl >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(100, Math.abs(cap.pnlPercent) * 2)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* NEW REPORT 2: Position Quality Scorecard */}
        {analysis.qualityScorecard && (
          <div className="mb-6 bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Position Quality Scorecard</h2>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-xs text-green-600 dark:text-green-400 mb-1">Excellent/Good</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{analysis.qualityScorecard.summary.excellentCount + analysis.qualityScorecard.summary.goodCount}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Average</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{analysis.qualityScorecard.summary.averageCount}</p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-xs text-orange-600 dark:text-orange-400 mb-1">Weak/Poor</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{analysis.qualityScorecard.summary.weakCount}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-xs text-red-600 dark:text-red-400 mb-1">Risk Flags</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{analysis.qualityScorecard.summary.totalRiskFlags}</p>
              </div>
            </div>

            {/* Recommendation Distribution */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="text-center p-3 bg-white dark:bg-[#0f1419] rounded-lg border border-gray-200 dark:border-[#30363d]">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{analysis.qualityScorecard.summary.strongBuyCount + analysis.qualityScorecard.summary.buyCount}</p>
                <p className="text-xs text-gray-600 dark:text-[#8b949e]">Buy Signals</p>
              </div>
              <div className="text-center p-3 bg-white dark:bg-[#0f1419] rounded-lg border border-gray-200 dark:border-[#30363d]">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{analysis.qualityScorecard.summary.holdCount}</p>
                <p className="text-xs text-gray-600 dark:text-[#8b949e]">Hold</p>
              </div>
              <div className="text-center p-3 bg-white dark:bg-[#0f1419] rounded-lg border border-gray-200 dark:border-[#30363d]">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{analysis.qualityScorecard.summary.sellCount}</p>
                <p className="text-xs text-gray-600 dark:text-[#8b949e]">Sell Signals</p>
              </div>
            </div>

            {/* Position Quality List */}
            <div className="space-y-3">
              {analysis.qualityScorecard.positions.map((pos, idx) => (
                <div key={idx} className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white">{pos.symbol}</h4>
                      <div className="flex gap-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded ${pos.recommendation.bgColor} ${pos.recommendation.borderColor} border ${pos.recommendation.textColor} font-semibold`}>
                          {pos.recommendation.icon} {pos.recommendation.recommendation}
                        </span>
                        {pos.fundamentalRating && (
                          <span className={`text-xs px-2 py-1 rounded font-semibold ${
                            pos.fundamentalRating === 'EXCELLENT' ? 'bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30' :
                            pos.fundamentalRating === 'GOOD' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30' :
                            pos.fundamentalRating === 'AVERAGE' ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30' :
                            'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30'
                          }`}>
                            F: {pos.fundamentalRating} ({pos.fundamentalScore})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-[#8b949e]">Value</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">₹{Math.round(pos.value).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  {pos.riskFlags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {pos.riskFlags.map((flag, flagIdx) => (
                        <span key={flagIdx} className="text-xs px-2 py-1 bg-red-500/10 text-red-600 dark:text-red-400 rounded border border-red-500/20">
                          ⚠️ {flag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data Source Info */}
        <div className="text-center text-xs text-gray-500 dark:text-[#8b949e] mt-8">
          <p>Data Source: {analysis.dataSource} • Calculated at: {new Date(analysis.calculatedAt).toLocaleString('en-IN')}</p>
          <p className="mt-1">Beta calculated vs Nifty 50 • Risk-free rate: 7% (10Y G-Sec)</p>
        </div>
      </div>
    </div>
  );
}
