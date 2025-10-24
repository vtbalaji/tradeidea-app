'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../../components/Navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Feature } from '@/types/subscription';
import { UpgradePrompt } from '@/components/subscription/UpgradePrompt';
import { useSymbols } from '../../contexts/SymbolsContext';
import { getSymbolData } from '@/lib/symbolDataService';
import InvestorAnalysisResults from '@/components/InvestorAnalysisResults';
import { createInvestmentEngine } from '@/lib/investment-rules';
import { trackAnalysisViewed } from '@/lib/analytics';
import InvestorTypeGuide from '@/components/InvestorTypeGuide';

export default function AnalysisPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { hasAccess, loading: subscriptionLoading } = useSubscription();
  const { searchSymbols } = useSymbols();
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAnalysisResults, setShowAnalysisResults] = useState(false);
  const [currentRecommendation, setCurrentRecommendation] = useState<any>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [symbolSuggestions, setSymbolSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const resultsRef = React.useRef<HTMLDivElement>(null);

  // Check authentication and email verification
  React.useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user && !user.emailVerified) {
      router.push('/verify');
    }
  }, [user, router]);

  // Close suggestions when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.symbol-search-container')) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showSuggestions]);

  const handleSymbolSearch = async (value: string) => {
    setSymbol(value);
    setError(null);
    if (value.length > 0) {
      const results = await searchSymbols(value);
      setSymbolSuggestions(results.slice(0, 10));
      setShowSuggestions(true);
    } else {
      setSymbolSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSymbolSelect = (selectedSymbol: any) => {
    setSymbol(selectedSymbol.symbol.replace(/^NS_/, ''));
    setShowSuggestions(false);
    setSymbolSuggestions([]);
  };

  const handleAnalyze = async () => {
    if (!symbol.trim()) {
      setError('Please enter a symbol');
      return;
    }

    setLoading(true);
    setError(null);
    setShowSuggestions(false);

    try {
      // Add NS_ prefix if not present
      const symbolWithPrefix = symbol.trim().toUpperCase().startsWith('NS_')
        ? symbol.trim().toUpperCase()
        : `NS_${symbol.trim().toUpperCase()}`;

      // Fetch symbol data
      const symbolData = await getSymbolData(symbolWithPrefix);

      if (!symbolData || !symbolData.technical || !symbolData.fundamental) {
        setError('Analysis data not available for this symbol yet. Please try another symbol or check back later.');
        setLoading(false);
        return;
      }

      // Track analysis viewed
      trackAnalysisViewed(symbol.trim().toUpperCase(), 'analysis-page');

      // Create investment engine and get recommendation
      const engine = createInvestmentEngine(symbolData.technical, symbolData.fundamental);
      const recommendation = engine.getRecommendation();

      setCurrentRecommendation(recommendation);
      setAnalysisData({
        symbol: symbol.trim().toUpperCase(),
        technicals: symbolData.technical,
        fundamentals: symbolData.fundamental
      });
      setShowAnalysisResults(true);
      setLoading(false);

      // Scroll to results after a short delay to ensure rendering
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: any) {
      console.error('Error analyzing symbol:', err);
      setError(err.message || 'Failed to analyze symbol. Please check if the symbol exists and try again.');
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAnalyze();
    }
  };

  // Check if subscription is still loading
  if (subscriptionLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0f1419]">
        <Navigation />
        <div className="p-5 pt-5">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Investor Analysis</h1>
          <div className="text-center py-16">
            <div className="inline-block w-12 h-12 border-4 border-[#ff8c42] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 dark:text-[#8b949e] text-lg">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Check premium access
  if (!hasAccess(Feature.ANALYSIS)) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0f1419]">
        <Navigation />
        <div className="p-5 pt-5">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Investor Analysis</h1>
          <UpgradePrompt
            featureName="Investor Analysis"
            message="Upgrade to Premium to access comprehensive investor type analysis for any stock with detailed technical and fundamental insights."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1419]">
      <Navigation />

      {/* Header */}
      <div className="p-5 pt-5">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Investor Analysis</h1>
        <p className="text-xs text-gray-600 dark:text-[#8b949e]">
          Analyze any stock to see which investor types it suits and get detailed recommendations
        </p>
      </div>

      {/* Search Section */}
      <div className="px-5 pb-3">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-4">
            <div className="flex flex-col md:flex-row gap-3 md:items-center relative symbol-search-container">
              <label className="text-sm font-semibold text-gray-900 dark:text-white md:whitespace-nowrap">
                Search Stock Symbol
              </label>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => handleSymbolSearch(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onFocus={() => symbol && symbolSuggestions.length > 0 && setShowSuggestions(true)}
                  placeholder="Enter symbol (e.g., RELIANCE, TCS, INFY)"
                  className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
                  disabled={loading}
                />

                {/* Symbol Suggestions Dropdown */}
                {showSuggestions && symbolSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg shadow-xl max-h-80 overflow-y-auto">
                    {symbolSuggestions.map((suggSymbol) => (
                      <div
                        key={suggSymbol.symbol}
                        onClick={() => handleSymbolSelect(suggSymbol)}
                        className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-[#30363d] cursor-pointer transition-colors border-b border-gray-100 dark:border-[#30363d] last:border-b-0"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-base font-bold text-gray-900 dark:text-white">
                              {suggSymbol.symbol}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-[#8b949e] truncate mt-0.5">
                              {suggSymbol.name}
                            </div>
                          </div>
                          <div className="text-xs font-semibold text-[#ff8c42] bg-[#ff8c42]/10 px-2 py-1 rounded">
                            {suggSymbol.exchange}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleAnalyze}
                disabled={loading || !symbol.trim()}
                className="px-5 py-2.5 bg-[#ff8c42] hover:bg-[#ff9a58] disabled:bg-gray-300 dark:disabled:bg-[#30363d] text-white text-sm font-semibold rounded-lg transition-colors disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    <span>Analyze</span>
                  </>
                )}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </p>
              </div>
            )}

            {/* Help Text - Only show when no results */}
            {!showAnalysisResults && (
            <div className="mt-3 p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-xs text-blue-600 dark:text-blue-400">
                💡 <strong>Tip:</strong> Enter the stock symbol and click "Analyze" to see investor type analysis, technical levels, and fundamentals
              </p>
            </div>
            )}
          </div>

          {/* Features Section - Only show when no results */}
          {!showAnalysisResults && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#ff8c42]/20 flex items-center justify-center">
                  <span className="text-xl">📊</span>
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">5 Investor Types</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-[#8b949e]">
                Analyze stocks against Value, Growth, Momentum, Quality, and Dividend investor profiles
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#ff8c42]/20 flex items-center justify-center">
                  <span className="text-xl">🎯</span>
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Detailed Scores</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-[#8b949e]">
                Get comprehensive scores showing how well the stock matches each investor type's criteria
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#ff8c42]/20 flex items-center justify-center">
                  <span className="text-xl">📈</span>
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Technical Analysis</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-[#8b949e]">
                View key technical levels including support, resistance, moving averages, RSI, and MACD
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#ff8c42]/20 flex items-center justify-center">
                  <span className="text-xl">💼</span>
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Fundamentals</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-[#8b949e]">
                Access fundamental data like P/E ratio, ROE, dividend yield, and growth metrics
              </p>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Investor Analysis Results - Inline */}
      <div ref={resultsRef}>
        {showAnalysisResults && currentRecommendation && analysisData && (
          <div className="px-5 pb-6">
            <InvestorAnalysisResults
              symbol={analysisData.symbol}
              recommendation={currentRecommendation}
              technicals={analysisData.technicals}
              fundamentals={analysisData.fundamentals}
            />
          </div>
        )}
      </div>

      {/* Investor Type Guide - Bottom of page */}
      <div className="px-5 pb-8">
        <InvestorTypeGuide />
      </div>
    </div>
  );
}
