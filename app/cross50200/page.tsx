'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../../components/Navigation';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { createInvestmentEngine } from '@/lib/investment-rules';
import InvestorAnalysisModal from '@/components/InvestorAnalysisModal';
import AnalysisButton from '@/components/AnalysisButton';

interface Crossover {
  id: string;
  symbol: string;
  date: string;
  crossoverType: 'bullish_cross' | 'bearish_cross';
  yesterdayClose: number;
  yesterdayMA?: number;
  todayClose: number;
  todayMA?: number;
  yesterdaySupertrend?: number;
  todaySupertrend?: number;
  crossPercent: number;
  ma_period?: number;
}

interface VolumeSpike {
  id: string;
  symbol: string;
  date: string;
  todayVolume: number;
  volumeMA20: number;
  spikePercent: number;
  todayClose: number;
  yesterdayClose: number;
  priceChangePercent: number;
}

export default function Cross50200Page() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'both' | '50ma' | '200ma' | 'supertrend' | 'volume'>('both');
  const [crossovers50, setCrossovers50] = useState<Crossover[]>([]);
  const [crossovers200, setCrossovers200] = useState<Crossover[]>([]);
  const [supertrendCrossovers, setSupertrendCrossovers] = useState<Crossover[]>([]);
  const [volumeSpikes, setVolumeSpikes] = useState<VolumeSpike[]>([]);
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

        // Fetch Supertrend crossovers
        const supertrendRef = collection(db, 'supertrendcrossover');
        const qSupertrend = query(
          supertrendRef,
          where('date', '==', today)
        );
        const snapshotSupertrend = await getDocs(qSupertrend);
        let dataSupertrend: Crossover[] = snapshotSupertrend.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Crossover));

        // Sort in memory
        dataSupertrend = dataSupertrend.sort((a, b) => Math.abs(b.crossPercent) - Math.abs(a.crossPercent));

        // Fetch Volume Spikes
        const volumeSpikeRef = collection(db, 'volumespike');
        const qVolumeSpike = query(
          volumeSpikeRef,
          where('date', '==', today)
        );
        const snapshotVolumeSpike = await getDocs(qVolumeSpike);
        let dataVolumeSpike: VolumeSpike[] = snapshotVolumeSpike.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as VolumeSpike));

        // Sort by spike percentage
        dataVolumeSpike = dataVolumeSpike.sort((a, b) => b.spikePercent - a.spikePercent);

        setCrossovers50(data50);
        setCrossovers200(data200);
        setSupertrendCrossovers(dataSupertrend);
        setVolumeSpikes(dataVolumeSpike);

        console.log('Fetched crossovers:', { ma50: data50.length, ma200: data200.length, supertrend: dataSupertrend.length, volumeSpikes: dataVolumeSpike.length });
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

  const handleConvertToIdea = async (e: React.MouseEvent, symbol: string, displaySymbol: string, currentPrice: number, isBullish: boolean, analysisText: string) => {
    e.stopPropagation();

    // Fetch symbol data to get technical levels (Supertrend, 100MA, 50MA)
    let entryPrice = currentPrice;
    let stopLoss = isBullish ? currentPrice * 0.95 : currentPrice * 1.05;
    let target = isBullish ? currentPrice * 1.10 : currentPrice * 0.90;
    let supertrendLevel = null;
    let sma100Level = null;
    let sma50Level = null;

    try {
      const symbolDoc = await getDoc(doc(db, 'symbols', symbol));
      if (symbolDoc.exists()) {
        const data = symbolDoc.data();
        const technicals = data.technicals || data.technical;

        if (technicals) {
          // Parse values as numbers to ensure they're not strings
          supertrendLevel = parseFloat(technicals.supertrend || technicals.supertrendLevel) || null;
          sma100Level = parseFloat(technicals.sma100 || technicals.ma100) || null;
          sma50Level = parseFloat(technicals.sma50 || technicals.ema50 || technicals.ma50) || null;

          console.log('Fetched technicals from symbols collection (handleConvertToIdea):', {
            symbol,
            supertrend: supertrendLevel,
            sma100: sma100Level,
            sma50: sma50Level,
            currentPrice: currentPrice
          });
        }
      }
    } catch (error) {
      console.error('Error fetching symbol data:', error);
    }

    // For bullish signals, use the higher of Supertrend or 100MA as entry
    if (isBullish) {
      // Build array of valid support levels
      const supportLevels = [];

      if (supertrendLevel && supertrendLevel > 0 && !isNaN(supertrendLevel)) {
        supportLevels.push(supertrendLevel);
      }
      if (sma100Level && sma100Level > 0 && !isNaN(sma100Level)) {
        supportLevels.push(sma100Level);
      }
      if (sma50Level && sma50Level > 0 && !isNaN(sma50Level)) {
        supportLevels.push(sma50Level);
      }

      console.log('Support levels for entry calculation (handleConvertToIdea):', {
        symbol,
        supportLevels,
        currentPrice: currentPrice
      });

      // Entry is the highest of available support levels
      if (supportLevels.length > 0) {
        entryPrice = Math.max(...supportLevels);
        // Stop loss: 2% below the highest support level
        stopLoss = entryPrice * 0.98;
      } else {
        // Fallback if no technical levels available
        entryPrice = currentPrice;
        stopLoss = entryPrice * 0.95;
        console.warn('No support levels found, using current price as entry:', {
          symbol,
          entry: entryPrice
        });
      }
    } else {
      // For bearish/short ideas
      entryPrice = currentPrice;

      // Build array of valid resistance levels
      const resistanceLevels = [currentPrice * 1.05];
      if (supertrendLevel && supertrendLevel > 0 && !isNaN(supertrendLevel)) {
        resistanceLevels.push(supertrendLevel);
      }
      if (sma100Level && sma100Level > 0 && !isNaN(sma100Level)) {
        resistanceLevels.push(sma100Level);
      }

      // Stop loss at the lowest resistance level + 2%
      if (resistanceLevels.length > 0) {
        stopLoss = Math.min(...resistanceLevels) * 1.02;
      }
    }

    // Calculate target based on risk-reward ratio (2:1)
    const riskAmount = Math.abs(entryPrice - stopLoss);
    target = entryPrice + (riskAmount * 2); // 2x risk for reward

    console.log('Final entry calculation:', {
      symbol,
      isBullish,
      currentPrice,
      supertrend: supertrendLevel,
      sma100: sma100Level,
      sma50: sma50Level,
      calculatedEntry: entryPrice,
      calculatedSL: stopLoss,
      calculatedTarget: target,
      riskAmount: riskAmount
    });

    // Navigate to new idea page with pre-populated data
    router.push(`/ideas/new?symbol=${encodeURIComponent(displaySymbol)}&analysis=${encodeURIComponent(analysisText)}&entryPrice=${entryPrice.toFixed(2)}&stopLoss=${stopLoss.toFixed(2)}&target=${target.toFixed(2)}`);
  };

  const renderVolumeSpikeCard = (spike: VolumeSpike) => {
    const displaySymbol = spike.symbol.replace(/^NS_/, '');
    const isPriceUp = spike.priceChangePercent >= 0;

    return (
      <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-4 hover:border-[#ff8c42] transition-colors">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{displaySymbol}</h3>
            <p className="text-xs text-gray-600 dark:text-[#8b949e] mt-0.5">Volume Spike</p>
          </div>
          <span className="px-3 py-1 text-xs font-semibold rounded bg-gray-200 dark:bg-[#30363d] text-gray-700 dark:text-gray-300">
            📊 {spike.spikePercent.toFixed(1)}% ↑
          </span>
        </div>

        {/* Volume Info */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-3">
            <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-1">Today Volume</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{spike.todayVolume.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-3">
            <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-1">20MA Volume</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{spike.volumeMA20.toLocaleString()}</p>
          </div>
        </div>

        {/* Price Change */}
        <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-3 mb-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-600 dark:text-[#8b949e]">Yesterday:</span>
              <span className="ml-1 font-semibold text-gray-900 dark:text-white">₹{spike.yesterdayClose.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-[#8b949e]">Today:</span>
              <span className={`ml-1 font-semibold ${isPriceUp ? 'text-green-500' : 'text-red-500'}`}>
                ₹{spike.todayClose.toFixed(2)} ({isPriceUp ? '+' : ''}{spike.priceChangePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Volume Description */}
        <div className="bg-gray-100 dark:bg-[#30363d] border border-gray-200 dark:border-[#444c56] rounded-lg p-2 mb-3">
          <p className="text-xs text-gray-700 dark:text-gray-300">
            💡 Volume is {spike.spikePercent.toFixed(1)}% above 20-day average. {isPriceUp ? 'Combined with price increase, this indicates strong buying interest.' : 'Despite price decline, high volume suggests potential reversal or capitulation.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-[#30363d]">
          <button
            onClick={(e) => {
              const analysisText = `High volume spike detected (${spike.spikePercent.toFixed(1)}% above 20MA).\n\nKey Points:\n- Today's Volume: ${spike.todayVolume.toLocaleString()}\n- 20MA Volume: ${spike.volumeMA20.toLocaleString()}\n- Price Change: ${isPriceUp ? '+' : ''}${spike.priceChangePercent.toFixed(2)}%\n- Current Price: ₹${spike.todayClose.toFixed(2)}\n\n${isPriceUp ? 'Strong volume with price increase suggests bullish momentum. Consider entry on pullbacks with proper stop loss.' : 'High volume despite price decline may indicate selling climax or distribution. Monitor for reversal signals.'}`;

              handleConvertToIdea(e, spike.symbol, displaySymbol, spike.todayClose, isPriceUp, analysisText);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-[#30363d] hover:bg-gray-200 dark:hover:bg-[#3c444d] border border-gray-200 dark:border-[#444c56] text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Convert to Idea</span>
          </button>
          <AnalysisButton onClick={async (e) => {
            e.stopPropagation();

            // Create a temporary crossover object for the handleAnalyze function
            const tempCrossover: Crossover = {
              id: spike.id,
              symbol: spike.symbol,
              date: spike.date,
              crossoverType: 'bullish_cross',
              yesterdayClose: spike.yesterdayClose,
              todayClose: spike.todayClose,
              crossPercent: 0,
            };

            await handleAnalyze(e, tempCrossover);
          }} />
        </div>
      </div>
    );
  };

  const renderCrossoverCard = (crossover: Crossover, showBothLabel: boolean = false, isSupertrend: boolean = false) => {
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
              {isSupertrend ? 'Supertrend Crossover' : (showBothLabel ? '50 & 200 MA Crossover' : `${crossover.ma_period} MA Crossover`)}
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

        {/* MA/Supertrend Info */}
        <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-3 mb-3">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-semibold text-[#ff8c42]">
              {isSupertrend ? 'Supertrend Level' : `${crossover.ma_period} MA Level`}
            </p>
            <p className={`text-xs font-semibold ${
              isBullish ? 'text-green-500' : 'text-red-500'
            }`}>
              {isBullish ? 'Above' : 'Below'} {Math.abs(crossover.crossPercent).toFixed(2)}%
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-600 dark:text-[#8b949e]">
                Yesterday {isSupertrend ? 'ST' : 'MA'}:
              </span>
              <span className="ml-1 font-semibold text-gray-900 dark:text-white">
                ₹{isSupertrend
                  ? crossover.yesterdaySupertrend?.toFixed(2)
                  : crossover.yesterdayMA?.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-[#8b949e]">
                Today {isSupertrend ? 'ST' : 'MA'}:
              </span>
              <span className="ml-1 font-semibold text-gray-900 dark:text-white">
                ₹{isSupertrend
                  ? crossover.todaySupertrend?.toFixed(2)
                  : crossover.todayMA?.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Crossover Description */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2 mb-3">
          <p className="text-xs text-blue-600 dark:text-blue-400">
            {isSupertrend
              ? (isBullish
                  ? `💡 Supertrend turned bullish today - Strong buy signal`
                  : `⚠️ Supertrend turned bearish today - Consider exit`)
              : (isBullish
                  ? `💡 Price crossed above ${crossover.ma_period} MA today - Potential bullish signal`
                  : `⚠️ Price crossed below ${crossover.ma_period} MA today - Potential bearish signal`)
            }
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-[#30363d]">
          <button
            onClick={async (e) => {
              e.stopPropagation();

              // Fetch symbol data to get technical levels (Supertrend, 100MA, 50MA)
              let entryPrice = crossover.todayClose;
              let stopLoss = crossover.todayClose * 0.95; // Default -5%
              let target = crossover.todayClose * 1.10; // Default +10%
              let supertrendLevel = null;
              let sma100Level = null;
              let sma50Level = null;

              try {
                const symbolDoc = await getDoc(doc(db, 'symbols', crossover.symbol));
                if (symbolDoc.exists()) {
                  const data = symbolDoc.data();
                  const technicals = data.technicals || data.technical;

                  if (technicals) {
                    // Parse values as numbers to ensure they're not strings
                    supertrendLevel = parseFloat(technicals.supertrend || technicals.supertrendLevel) || null;
                    sma100Level = parseFloat(technicals.sma100 || technicals.ma100) || null;
                    sma50Level = parseFloat(technicals.sma50 || technicals.ema50 || technicals.ma50) || null;

                    console.log('Fetched technicals from symbols collection:', {
                      symbol: crossover.symbol,
                      supertrend: supertrendLevel,
                      sma100: sma100Level,
                      sma50: sma50Level,
                      currentPrice: crossover.todayClose,
                      allTechnicals: technicals
                    });
                  }
                }
              } catch (error) {
                console.error('Error fetching symbol data:', error);
              }

              // For bullish signals, use the higher of Supertrend or 100MA as entry
              if (isBullish) {
                // Build array of valid support levels (excluding current price)
                const supportLevels = [];

                if (supertrendLevel && supertrendLevel > 0 && !isNaN(supertrendLevel)) {
                  supportLevels.push(supertrendLevel);
                }
                if (sma100Level && sma100Level > 0 && !isNaN(sma100Level)) {
                  supportLevels.push(sma100Level);
                }
                if (sma50Level && sma50Level > 0 && !isNaN(sma50Level)) {
                  supportLevels.push(sma50Level);
                }

                console.log('Support levels for entry calculation:', {
                  symbol: crossover.symbol,
                  supportLevels,
                  currentPrice: crossover.todayClose
                });

                // Entry is the highest of available support levels (Supertrend/100MA/50MA)
                // NOT the current price if it's already above these levels
                if (supportLevels.length > 0) {
                  entryPrice = Math.max(...supportLevels);
                  // Stop loss: 2% below the highest support level
                  stopLoss = entryPrice * 0.98;
                } else {
                  // Fallback if no technical levels available
                  entryPrice = crossover.todayClose;
                  stopLoss = entryPrice * 0.95;
                  console.warn('No support levels found, using current price as entry:', {
                    symbol: crossover.symbol,
                    entry: entryPrice
                  });
                }
              } else {
                // For bearish/short ideas
                entryPrice = crossover.todayClose;

                // Build array of valid resistance levels
                const resistanceLevels = [crossover.todayClose * 1.05];
                if (supertrendLevel && supertrendLevel > 0 && !isNaN(supertrendLevel)) {
                  resistanceLevels.push(supertrendLevel);
                }
                if (sma100Level && sma100Level > 0 && !isNaN(sma100Level)) {
                  resistanceLevels.push(sma100Level);
                }

                // Stop loss at the lowest resistance level + 2%
                if (resistanceLevels.length > 0) {
                  stopLoss = Math.min(...resistanceLevels) * 1.02;
                }
              }

              // Calculate target based on risk-reward ratio (2:1)
              const riskAmount = Math.abs(entryPrice - stopLoss);
              target = entryPrice + (riskAmount * 2); // 2x risk for reward

              console.log('Final entry calculation:', {
                symbol: crossover.symbol,
                isBullish,
                currentPrice: crossover.todayClose,
                supertrend: supertrendLevel,
                sma100: sma100Level,
                sma50: sma50Level,
                calculatedEntry: entryPrice,
                calculatedSL: stopLoss,
                calculatedTarget: target,
                riskAmount: riskAmount
              });

              // Build the analysis text based on crossover type
              const analysisText = isSupertrend
                ? `${isBullish ? 'Bullish' : 'Bearish'} Supertrend crossover detected.\n\nKey Points:\n- Price is ${isBullish ? 'above' : 'below'} Supertrend level by ${Math.abs(crossover.crossPercent).toFixed(2)}%\n- Current Price: ₹${crossover.todayClose.toFixed(2)}\n- Supertrend Level: ₹${(isSupertrend ? crossover.todaySupertrend : crossover.todayMA)?.toFixed(2)}\n\n${isBullish ? 'This signals potential upward momentum. Consider entering on pullbacks to support levels.' : 'This signals potential downward pressure. Consider exiting long positions or avoiding new entries.'}`
                : `${isBullish ? 'Bullish' : 'Bearish'} ${crossover.ma_period} MA crossover detected.\n\nKey Points:\n- Price crossed ${isBullish ? 'above' : 'below'} ${crossover.ma_period} MA today\n- Current Price: ₹${crossover.todayClose.toFixed(2)}\n- ${crossover.ma_period} MA Level: ₹${crossover.todayMA?.toFixed(2)}\n- Price change: ${((crossover.todayClose - crossover.yesterdayClose) / crossover.yesterdayClose * 100).toFixed(2)}%\n\n${isBullish ? 'This crossover suggests potential bullish momentum. Entry recommended near support levels with proper risk management.' : 'This crossover indicates potential bearish pressure. Consider profit booking or avoiding fresh longs.'}`;

              // Navigate to new idea page with pre-populated data
              router.push(`/ideas/new?symbol=${encodeURIComponent(displaySymbol)}&analysis=${encodeURIComponent(analysisText)}&entryPrice=${entryPrice.toFixed(2)}&stopLoss=${stopLoss.toFixed(2)}&target=${target.toFixed(2)}`);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-[#30363d] hover:bg-gray-200 dark:hover:bg-[#3c444d] border border-gray-200 dark:border-[#444c56] text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Convert to Idea</span>
          </button>
          <AnalysisButton onClick={(e) => handleAnalyze(e, crossover)} />
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
          <button
            onClick={() => setActiveTab('supertrend')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'supertrend'
                ? 'bg-[#ff8c42] text-gray-900 dark:text-white'
                : 'bg-gray-50 dark:bg-[#1c2128] text-gray-600 dark:text-[#8b949e] hover:bg-gray-100 dark:hover:bg-[#30363d]'
            }`}
          >
            Supertrend
          </button>
          <button
            onClick={() => setActiveTab('volume')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'volume'
                ? 'bg-[#ff8c42] text-gray-900 dark:text-white'
                : 'bg-gray-50 dark:bg-[#1c2128] text-gray-600 dark:text-[#8b949e] hover:bg-gray-100 dark:hover:bg-[#30363d]'
            }`}
          >
            Volume Spikes
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
          } else if (activeTab === '200ma') {
            displayCrossovers = crossovers200;
          } else if (activeTab === 'supertrend') {
            displayCrossovers = supertrendCrossovers;
          }

          // Handle volume spikes separately
          if (activeTab === 'volume') {
            return volumeSpikes.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No volume spikes found</h3>
                <p className="text-gray-600 dark:text-[#8b949e]">No stocks with volume above 20MA today</p>
              </div>
            ) : (
              <>
                {/* Summary */}
                <div className="mb-4 flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Volume Spikes Today</h2>
                  <span className="px-2 py-0.5 bg-[#ff8c42]/20 text-[#ff8c42] text-xs font-semibold rounded-full">
                    {volumeSpikes.length} {volumeSpikes.length === 1 ? 'stock' : 'stocks'}
                  </span>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {volumeSpikes.map((spike) => (
                    <div key={spike.id}>
                      {renderVolumeSpikeCard(spike)}
                    </div>
                  ))}
                </div>
              </>
            );
          }

          return displayCrossovers.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No crossovers found</h3>
              <p className="text-gray-600 dark:text-[#8b949e]">
                {activeTab === 'both'
                  ? 'No stocks crossed both 50 MA and 200 MA today'
                  : activeTab === 'supertrend'
                    ? 'No supertrend crossovers found today'
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
                    : activeTab === 'supertrend'
                      ? 'Supertrend Crossovers Today'
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
                  <div key={`${crossover.symbol}-${crossover.ma_period || 'st'}-${crossover.id}`}>
                    {renderCrossoverCard(crossover, activeTab === 'both', activeTab === 'supertrend')}
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
