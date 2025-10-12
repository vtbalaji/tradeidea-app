'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../../components/Navigation';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { createInvestmentEngine } from '@/lib/investment-rules';
import InvestorAnalysisModal from '@/components/InvestorAnalysisModal';

interface Crossover {
  id: string;
  symbol: string;
  date: string;
  crossoverType: 'bullish_cross' | 'bearish_cross';
  yesterdayClose: number;
  yesterdayMA: number;
  todayClose: number;
  todayMA: number;
  crossPercent: number;
  ma_period: number;
}

export default function Cross50200Page() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'both' | '50ma' | '200ma'>('both');
  const [crossovers50, setCrossovers50] = useState<Crossover[]>([]);
  const [crossovers200, setCrossovers200] = useState<Crossover[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState<string | null>(null);
  const [currentRecommendation, setCurrentRecommendation] = useState<any>(null);
  const [symbolData, setSymbolData] = useState<{[key: string]: {technicals: any, fundamentals: any}}>({});

  // Check authentication and email verification
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user && !user.emailVerified) {
      router.push('/verify');
    }
  }, [user, router]);

  // Get last trading day (skip weekends)
  const getLastTradingDay = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();

    // If Saturday (6), go back 1 day to Friday
    if (dayOfWeek === 6) {
      today.setDate(today.getDate() - 1);
    }
    // If Sunday (0), go back 2 days to Friday
    else if (dayOfWeek === 0) {
      today.setDate(today.getDate() - 2);
    }

    return today.toISOString().split('T')[0];
  };

  // Fetch crossover data
  useEffect(() => {
    const fetchCrossovers = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const today = getLastTradingDay();
        console.log('Querying for date:', today);

        // Fetch 50 MA crossovers
        const crossover50Ref = collection(db, 'macrossover50');
        const q50 = query(
          crossover50Ref,
          where('date', '==', today)
        );
        const snapshot50 = await getDocs(q50);
        let data50: Crossover[] = snapshot50.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Crossover));

        // Sort in memory instead of using orderBy
        data50 = data50.sort((a, b) => Math.abs(b.crossPercent) - Math.abs(a.crossPercent));

        // Fetch 200 MA crossovers
        const crossover200Ref = collection(db, 'macrossover200');
        const q200 = query(
          crossover200Ref,
          where('date', '==', today)
        );
        const snapshot200 = await getDocs(q200);
        let data200: Crossover[] = snapshot200.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Crossover));

        // Sort in memory instead of using orderBy
        data200 = data200.sort((a, b) => Math.abs(b.crossPercent) - Math.abs(a.crossPercent));

        setCrossovers50(data50);
        setCrossovers200(data200);

        console.log('Fetched crossovers:', { ma50: data50.length, ma200: data200.length });
      } catch (error: any) {
        console.error('Error fetching crossovers:', error);
        setError(error.message || 'Failed to load crossover data. Please check Firestore permissions.');
      } finally {
        setLoading(false);
      }
    };

    fetchCrossovers();
  }, [user]);

  const handleAnalyze = async (e: React.MouseEvent, crossover: Crossover) => {
    e.stopPropagation();

    // Check if we already have the data cached
    if (symbolData[crossover.symbol]) {
      const { technicals, fundamentals } = symbolData[crossover.symbol];
      if (!technicals || !fundamentals) {
        alert('⚠️ Technical or fundamental data not available for this symbol.');
        return;
      }
      const engine = createInvestmentEngine(technicals, fundamentals);
      const rec = engine.getRecommendation();
      setCurrentRecommendation(rec);
      setShowAnalysisModal(crossover.symbol);
      return;
    }

    // Fetch data from Firestore
    try {
      const symbolDoc = await getDoc(doc(db, 'symbols', crossover.symbol));
      if (!symbolDoc.exists()) {
        alert('⚠️ Symbol data not found in database.');
        return;
      }

      const data = symbolDoc.data();
      // Check both field name variations (for backward compatibility)
      const technicals = data.technicals || data.technical;
      const fundamentals = data.fundamentals || data.fundamental;

      if (!technicals || !fundamentals) {
        alert('⚠️ Technical or fundamental data not available. Run batch analysis first.');
        return;
      }

      // Cache the data
      setSymbolData(prev => ({
        ...prev,
        [crossover.symbol]: { technicals, fundamentals }
      }));

      const engine = createInvestmentEngine(technicals, fundamentals);
      const rec = engine.getRecommendation();
      setCurrentRecommendation(rec);
      setShowAnalysisModal(crossover.symbol);
    } catch (error) {
      console.error('Error fetching symbol data:', error);
      alert('⚠️ Failed to fetch symbol data.');
    }
  };

  const renderCrossoverCard = (crossover: Crossover, showBothLabel: boolean = false) => {
    const isBullish = crossover.crossoverType === 'bullish_cross';
    const changePercent = ((crossover.todayClose - crossover.yesterdayClose) / crossover.yesterdayClose) * 100;
    // Display symbol without NS_ prefix
    const displaySymbol = crossover.symbol.replace(/^NS_/, '');

    return (
      <div
        className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-4 hover:border-[#ff8c42] transition-colors"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{displaySymbol}</h3>
            <p className="text-xs text-gray-600 dark:text-[#8b949e] mt-0.5">
              {showBothLabel ? '50 & 200 MA Crossover' : `${crossover.ma_period} MA Crossover`}
            </p>
          </div>
          <span className={`px-3 py-1 text-xs font-semibold rounded ${
            isBullish
              ? 'bg-green-500/20 text-green-400'
              : 'bg-red-500/20 text-red-400'
          }`}>
            {isBullish ? '🟢 Bullish' : '🔴 Bearish'}
          </span>
        </div>

        {/* Price Info */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-3">
            <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-1">Yesterday</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">₹{crossover.yesterdayClose.toFixed(2)}</p>
          </div>
          <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-3">
            <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-1">Today</p>
            <p className={`text-sm font-semibold ${changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ₹{crossover.todayClose.toFixed(2)} ({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)
            </p>
          </div>
        </div>

        {/* MA Info */}
        <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-3 mb-3">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-semibold text-[#ff8c42]">{crossover.ma_period} MA Level</p>
            <p className={`text-xs font-semibold ${
              isBullish ? 'text-green-500' : 'text-red-500'
            }`}>
              {isBullish ? 'Above' : 'Below'} {Math.abs(crossover.crossPercent).toFixed(2)}%
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-600 dark:text-[#8b949e]">Yesterday MA:</span>
              <span className="ml-1 font-semibold text-gray-900 dark:text-white">₹{crossover.yesterdayMA.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-[#8b949e]">Today MA:</span>
              <span className="ml-1 font-semibold text-gray-900 dark:text-white">₹{crossover.todayMA.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Crossover Description */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2 mb-3">
          <p className="text-xs text-blue-600 dark:text-blue-400">
            {isBullish
              ? `💡 Price crossed above ${crossover.ma_period} MA today - Potential bullish signal`
              : `⚠️ Price crossed below ${crossover.ma_period} MA today - Potential bearish signal`
            }
          </p>
        </div>

        {/* Analysis Button */}
        <div className="flex justify-end pt-3 border-t border-gray-200 dark:border-[#30363d]">
          <button
            onClick={(e) => handleAnalyze(e, crossover)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-[#30363d] hover:bg-gray-200 dark:hover:bg-[#3c444d] border border-gray-200 dark:border-[#444c56] text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Analysis</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1419]">
      <Navigation />

      {/* Header */}
      <div className="p-5 pt-5 pb-3">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">MA Crossovers</h1>
        <p className="text-sm text-gray-600 dark:text-[#8b949e]">Stocks that crossed moving averages today</p>
      </div>

      {/* Tabs */}
      <div className="px-5 mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('both')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'both'
                ? 'bg-[#ff8c42] text-gray-900 dark:text-white'
                : 'bg-gray-50 dark:bg-[#1c2128] text-gray-600 dark:text-[#8b949e] hover:bg-gray-100 dark:hover:bg-[#30363d]'
            }`}
          >
            50 & 200 MA Both
          </button>
          <button
            onClick={() => setActiveTab('50ma')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === '50ma'
                ? 'bg-[#ff8c42] text-gray-900 dark:text-white'
                : 'bg-gray-50 dark:bg-[#1c2128] text-gray-600 dark:text-[#8b949e] hover:bg-gray-100 dark:hover:bg-[#30363d]'
            }`}
          >
            50 MA Only
          </button>
          <button
            onClick={() => setActiveTab('200ma')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === '200ma'
                ? 'bg-[#ff8c42] text-gray-900 dark:text-white'
                : 'bg-gray-50 dark:bg-[#1c2128] text-gray-600 dark:text-[#8b949e] hover:bg-gray-100 dark:hover:bg-[#30363d]'
            }`}
          >
            200 MA Only
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pb-8">
        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6">
            <p className="font-semibold mb-1">Error Loading Data</p>
            <p className="text-sm">{error}</p>
            <p className="text-xs mt-2">Please ensure Firestore security rules allow read access to macrossover50 and macrossover200 collections.</p>
          </div>
        )}
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block w-12 h-12 border-4 border-[#ff8c42] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 dark:text-[#8b949e] text-lg">Loading crossovers...</p>
          </div>
        ) : (() => {
          // Filter stocks based on active tab
          let displayCrossovers: Crossover[] = [];

          if (activeTab === 'both') {
            // Find stocks that crossed BOTH 50 MA and 200 MA
            const symbols50 = new Set(crossovers50.map(c => c.symbol));
            const symbols200 = new Set(crossovers200.map(c => c.symbol));
            const commonSymbols = [...symbols50].filter(symbol => symbols200.has(symbol));

            // Get crossovers for common symbols (show only 50 MA version to avoid duplicates)
            displayCrossovers = crossovers50
              .filter(c => commonSymbols.includes(c.symbol))
              .sort((a, b) => Math.abs(b.crossPercent) - Math.abs(a.crossPercent));
          } else if (activeTab === '50ma') {
            displayCrossovers = crossovers50;
          } else {
            displayCrossovers = crossovers200;
          }

          return displayCrossovers.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No crossovers found</h3>
              <p className="text-gray-600 dark:text-[#8b949e]">
                {activeTab === 'both'
                  ? 'No stocks crossed both 50 MA and 200 MA today'
                  : `No stocks crossed the ${activeTab === '50ma' ? '50' : '200'} MA today`
                }
              </p>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="mb-4 flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {activeTab === 'both'
                    ? 'Stocks Crossing Both 50 MA & 200 MA Today'
                    : `${activeTab === '50ma' ? '50 MA' : '200 MA'} Crossovers Today`
                  }
                </h2>
                <span className="px-2 py-0.5 bg-[#ff8c42]/20 text-[#ff8c42] text-xs font-semibold rounded-full">
                  {activeTab === 'both'
                    ? `${new Set(displayCrossovers.map(c => c.symbol)).size} ${new Set(displayCrossovers.map(c => c.symbol)).size === 1 ? 'stock' : 'stocks'}`
                    : `${displayCrossovers.length} ${displayCrossovers.length === 1 ? 'stock' : 'stocks'}`
                  }
                </span>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayCrossovers.map((crossover) => (
                  <div key={`${crossover.symbol}-${crossover.ma_period}-${crossover.id}`}>
                    {renderCrossoverCard(crossover, activeTab === 'both')}
                  </div>
                ))}
              </div>
            </>
          );
        })()}
      </div>

      {/* Investor Analysis Modal */}
      {showAnalysisModal && currentRecommendation && symbolData[showAnalysisModal] && (
        <InvestorAnalysisModal
          isOpen={true}
          onClose={() => {
            setShowAnalysisModal(null);
            setCurrentRecommendation(null);
          }}
          symbol={showAnalysisModal.replace(/^NS_/, '')}
          recommendation={currentRecommendation}
          technicals={symbolData[showAnalysisModal]?.technicals}
          fundamentals={symbolData[showAnalysisModal]?.fundamentals}
        />
      )}
    </div>
  );
}
