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
import { trackScreenerViewed, trackScreenerConvertedToIdea, trackAnalysisViewed } from '@/lib/analytics';

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

interface DarvasBox {
  id: string;
  symbol: string;
  date: string;
  status: 'active' | 'broken' | 'false_breakout';
  boxHigh: number;
  boxLow: number;
  boxHeight: number;
  boxRangePercent: number;
  currentPrice: number;
  formationDate: string;
  consolidationDays: number;
  breakoutPrice: number;
  isBreakout: boolean;
  volumeConfirmed: boolean;
  currentVolume: number;
  avgVolume: number;
  week52High: number;
  riskRewardRatio: number;
  priceToBoxHighPercent: number;
}

export default function Cross50200Page() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'both' | '50ma' | '200ma' | 'supertrend' | 'volume' | 'darvas'>('both');

  // Track tab change
  const handleTabChange = (tab: 'both' | '50ma' | '200ma' | 'supertrend' | 'volume' | 'darvas') => {
    setActiveTab(tab);
    trackScreenerViewed(tab);
  };
  const [crossovers50, setCrossovers50] = useState<Crossover[]>([]);
  const [crossovers200, setCrossovers200] = useState<Crossover[]>([]);
  const [supertrendCrossovers, setSupertrendCrossovers] = useState<Crossover[]>([]);
  const [volumeSpikes, setVolumeSpikes] = useState<VolumeSpike[]>([]);
  const [darvasBoxes, setDarvasBoxes] = useState<DarvasBox[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState<string | null>(null);
  const [currentRecommendation, setCurrentRecommendation] = useState<any>(null);
  const [symbolData, setSymbolData] = useState<{[key: string]: {technicals: any, fundamentals: any}}>({});
  const [displayDate, setDisplayDate] = useState<string | null>(null);

  // Convert date to Indian format (DD-MM-YYYY)
  const formatDateIndian = (dateStr: string | null) => {
    if (!dateStr) return null;
    // Handle YYYY-MM-DD format
    if (dateStr.includes('-') && dateStr.split('-')[0].length === 4) {
      const [year, month, day] = dateStr.split('-');
      return `${day}-${month}-${year}`;
    }
    return dateStr;
  };

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

  // Get multiple date formats to try
  const getDateFormats = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return [
      dateStr,                          // 2025-10-16
      `${day}-${month}-${year}`,       // 16-10-2025
      `${month}-${day}-${year}`,       // 10-16-2025
      `${year}${month}${day}`,         // 20251016
      `${day}/${month}/${year}`,       // 16/10/2025
      `${month}/${day}/${year}`,       // 10/16/2025
    ];
  };

  // Fetch crossover data
  useEffect(() => {
    const fetchCrossovers = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const today = getLastTradingDay();
        const dateFormats = getDateFormats(today);
        console.log('🔍 Querying for date:', today);
        console.log('🔍 Trying date formats:', dateFormats);

        // Try to fetch with multiple date formats
        let data50: Crossover[] = [];
        let data200: Crossover[] = [];
        let dataSupertrend: Crossover[] = [];
        let dataVolumeSpike: VolumeSpike[] = [];
        let dataDarvasBoxes: DarvasBox[] = [];

        // First, try to fetch ALL records to check permissions
        let latestDate: string | null = null;
        try {
          console.log('🔍 Testing Firestore access...');
          const testSnapshot = await getDocs(collection(db, 'macrossover50'));
          console.log(`✅ Can access macrossover50: ${testSnapshot.docs.length} total documents`);

          if (testSnapshot.docs.length > 0) {
            // Get all unique dates and find the latest
            const allDates = testSnapshot.docs.map(doc => doc.data().date as string);
            const uniqueDates = [...new Set(allDates)].sort().reverse();
            console.log('📅 Available dates:', uniqueDates.slice(0, 5));

            // Try today's date first with all formats
            let found = false;
            for (const dateFormat of dateFormats) {
              const filtered50 = testSnapshot.docs.filter(doc => doc.data().date === dateFormat);
              if (filtered50.length > 0) {
                console.log(`✅ Found ${filtered50.length} records in macrossover50 for today: ${dateFormat}`);
                data50 = filtered50.map(doc => ({
                  id: doc.id,
                  ...doc.data()
                } as Crossover));
                latestDate = dateFormat;
                found = true;
                break;
              }
            }

            // If not found for today, use the latest available date
            if (!found && uniqueDates.length > 0) {
              latestDate = uniqueDates[0];
              console.log(`⚠️ No records for today, using latest date: ${latestDate}`);
              const filtered50 = testSnapshot.docs.filter(doc => doc.data().date === latestDate);
              data50 = filtered50.map(doc => ({
                id: doc.id,
                ...doc.data()
              } as Crossover));
              console.log(`✅ Found ${data50.length} records for ${latestDate}`);
            }
          }
        } catch (err: any) {
          console.error('❌ Error accessing macrossover50:', err.message);
        }

        // Fetch 200 MA - use the same latestDate
        if (latestDate) {
          try {
            const test200 = await getDocs(collection(db, 'macrossover200'));
            console.log(`✅ Can access macrossover200: ${test200.docs.length} total documents`);

            if (test200.docs.length > 0) {
              const filtered200 = test200.docs.filter(doc => doc.data().date === latestDate);
              if (filtered200.length > 0) {
                console.log(`✅ Found ${filtered200.length} records in macrossover200 for ${latestDate}`);
                data200 = filtered200.map(doc => ({
                  id: doc.id,
                  ...doc.data()
                } as Crossover));
              }
            }
          } catch (err: any) {
            console.error('❌ Error accessing macrossover200:', err.message);
          }

          // Fetch Supertrend - use the same latestDate
          try {
            const testSupertrend = await getDocs(collection(db, 'supertrendcrossover'));
            console.log(`✅ Can access supertrendcrossover: ${testSupertrend.docs.length} total documents`);

            if (testSupertrend.docs.length > 0) {
              const filteredSupertrend = testSupertrend.docs.filter(doc => doc.data().date === latestDate);
              if (filteredSupertrend.length > 0) {
                console.log(`✅ Found ${filteredSupertrend.length} records in supertrendcrossover for ${latestDate}`);
                dataSupertrend = filteredSupertrend.map(doc => ({
                  id: doc.id,
                  ...doc.data()
                } as Crossover));
              }
            }
          } catch (err: any) {
            console.error('❌ Error accessing supertrendcrossover:', err.message);
          }

          // Fetch Volume Spikes - use the same latestDate
          try {
            const testVolume = await getDocs(collection(db, 'volumespike'));
            console.log(`✅ Can access volumespike: ${testVolume.docs.length} total documents`);

            if (testVolume.docs.length > 0) {
              const filteredVolume = testVolume.docs.filter(doc => doc.data().date === latestDate);
              if (filteredVolume.length > 0) {
                console.log(`✅ Found ${filteredVolume.length} records in volumespike for ${latestDate}`);
                dataVolumeSpike = filteredVolume.map(doc => ({
                  id: doc.id,
                  ...doc.data()
                } as VolumeSpike));
              }
            }
          } catch (err: any) {
            console.error('❌ Error accessing volumespike:', err.message);
          }

          // Fetch Darvas Boxes - use the same latestDate
          try {
            const testDarvas = await getDocs(collection(db, 'darvasboxes'));
            console.log(`✅ Can access darvasboxes: ${testDarvas.docs.length} total documents`);

            if (testDarvas.docs.length > 0) {
              const filteredDarvas = testDarvas.docs.filter(doc => doc.data().date === latestDate);
              if (filteredDarvas.length > 0) {
                console.log(`✅ Found ${filteredDarvas.length} records in darvasboxes for ${latestDate}`);
                dataDarvasBoxes = filteredDarvas.map(doc => ({
                  id: doc.id,
                  ...doc.data()
                } as DarvasBox));
              }
            }
          } catch (err: any) {
            console.error('❌ Error accessing darvasboxes:', err.message);
          }
        }

        // If still no records found, fetch a sample to show what dates are available
        if (data50.length === 0 && data200.length === 0 && dataSupertrend.length === 0 && dataVolumeSpike.length === 0) {
          console.warn('⚠️ No records found for any date format. Fetching sample records...');

          try {
            // Fetch sample from each collection without orderBy to avoid index issues
            const sample50 = await getDocs(collection(db, 'macrossover50'));
            const sample200 = await getDocs(collection(db, 'macrossover200'));
            const sampleSupertrend = await getDocs(collection(db, 'supertrendcrossover'));
            const sampleVolume = await getDocs(collection(db, 'volumespike'));

            console.log('📋 Total documents in Firebase:');
            console.log(`  macrossover50: ${sample50.docs.length} documents`);
            console.log(`  macrossover200: ${sample200.docs.length} documents`);
            console.log(`  supertrendcrossover: ${sampleSupertrend.docs.length} documents`);
            console.log(`  volumespike: ${sampleVolume.docs.length} documents`);

            console.log('\n📋 Sample dates in Firebase:');
            if (sample50.docs.length > 0) {
              const allDates50 = sample50.docs.map(d => d.data().date);
              const uniqueDates50 = [...new Set(allDates50)].sort().reverse().slice(0, 10);
              console.log('  macrossover50 (latest 10 unique dates):', uniqueDates50);
              console.log('  First record sample:', sample50.docs[0].data());
            } else {
              console.log('  macrossover50: No documents found');
            }

            if (sample200.docs.length > 0) {
              const allDates200 = sample200.docs.map(d => d.data().date);
              const uniqueDates200 = [...new Set(allDates200)].sort().reverse().slice(0, 10);
              console.log('  macrossover200 (latest 10 unique dates):', uniqueDates200);
              console.log('  First record sample:', sample200.docs[0].data());
            } else {
              console.log('  macrossover200: No documents found');
            }

            if (sampleSupertrend.docs.length > 0) {
              const allDatesSupertrend = sampleSupertrend.docs.map(d => d.data().date);
              const uniqueDatesSupertrend = [...new Set(allDatesSupertrend)].sort().reverse().slice(0, 10);
              console.log('  supertrendcrossover (latest 10 unique dates):', uniqueDatesSupertrend);
              console.log('  First record sample:', sampleSupertrend.docs[0].data());
            } else {
              console.log('  supertrendcrossover: No documents found');
            }

            if (sampleVolume.docs.length > 0) {
              const allDatesVolume = sampleVolume.docs.map(d => d.data().date);
              const uniqueDatesVolume = [...new Set(allDatesVolume)].sort().reverse().slice(0, 10);
              console.log('  volumespike (latest 10 unique dates):', uniqueDatesVolume);
              console.log('  First record sample:', sampleVolume.docs[0].data());
            } else {
              console.log('  volumespike: No documents found');
            }
          } catch (debugError: any) {
            console.error('❌ Error fetching debug samples:', debugError);
          }
        }

        // Sort in memory
        data50 = data50.sort((a, b) => Math.abs(b.crossPercent) - Math.abs(a.crossPercent));
        data200 = data200.sort((a, b) => Math.abs(b.crossPercent) - Math.abs(a.crossPercent));
        dataSupertrend = dataSupertrend.sort((a, b) => Math.abs(b.crossPercent) - Math.abs(a.crossPercent));
        dataVolumeSpike = dataVolumeSpike.sort((a, b) => b.spikePercent - a.spikePercent);
        dataDarvasBoxes = dataDarvasBoxes.sort((a, b) => b.consolidationDays - a.consolidationDays);

        setCrossovers50(data50);
        setCrossovers200(data200);
        setSupertrendCrossovers(dataSupertrend);
        setVolumeSpikes(dataVolumeSpike);
        setDarvasBoxes(dataDarvasBoxes);
        setDisplayDate(latestDate);

        console.log('📊 Final counts:', {
          ma50: data50.length,
          ma200: data200.length,
          supertrend: dataSupertrend.length,
          volumeSpikes: dataVolumeSpike.length,
          darvasBoxes: dataDarvasBoxes.length,
          date: latestDate
        });
      } catch (error: any) {
        console.error('❌ Error fetching crossovers:', error);
        setError(error.message || 'Failed to load crossover data. Please check Firestore permissions.');
      } finally {
        setLoading(false);
      }
    };

    fetchCrossovers();
  }, [user]);

  const handleAnalyze = async (e: React.MouseEvent, crossover: Crossover) => {
    e.stopPropagation();

    // Track analysis viewed
    trackAnalysisViewed(crossover.symbol, 'screener');

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

    // Track screener converted to idea
    trackScreenerConvertedToIdea(displaySymbol, activeTab);

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

  const renderDarvasBoxCard = (box: DarvasBox) => {
    const displaySymbol = box.symbol.replace(/^NS_/, '');
    const statusColor = box.status === 'broken' ? 'text-green-400' : box.status === 'active' ? 'text-blue-400' : 'text-orange-400';
    const statusBg = box.status === 'broken' ? 'bg-green-500/20' : box.status === 'active' ? 'bg-blue-500/20' : 'bg-orange-500/20';
    const statusLabel = box.status === 'broken' ? '🟢 Breakout' : box.status === 'active' ? '🟦 Active' : '⚠️ False';

    return (
      <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-4 hover:border-[#ff8c42] transition-colors">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{displaySymbol}</h3>
            <p className="text-xs text-gray-600 dark:text-[#8b949e] mt-0.5">Darvas Box Pattern</p>
          </div>
          <span className={`px-3 py-1 text-xs font-semibold rounded ${statusBg} ${statusColor}`}>
            {statusLabel}
          </span>
        </div>

        {/* Box Levels */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-3">
            <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-1">Box High</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">₹{box.boxHigh.toFixed(2)}</p>
          </div>
          <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-3">
            <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-1">Box Low</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">₹{box.boxLow.toFixed(2)}</p>
          </div>
        </div>

        {/* Current Price & Box Info */}
        <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-3 mb-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-600 dark:text-[#8b949e]">Current Price:</span>
              <span className={`ml-1 font-semibold ${box.isBreakout ? 'text-green-500' : 'text-gray-900 dark:text-white'}`}>
                ₹{box.currentPrice.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-[#8b949e]">Box Range:</span>
              <span className="ml-1 font-semibold text-gray-900 dark:text-white">{box.boxRangePercent.toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-[#8b949e]">Days in Box:</span>
              <span className="ml-1 font-semibold text-gray-900 dark:text-white">{box.consolidationDays}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-[#8b949e]">52W High:</span>
              <span className="ml-1 font-semibold text-gray-900 dark:text-white">₹{box.week52High.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Box Description */}
        <div className={`border rounded-lg p-2 mb-3 ${
          box.status === 'broken'
            ? 'bg-green-500/10 border-green-500/30'
            : box.status === 'active'
              ? 'bg-blue-500/10 border-blue-500/30'
              : 'bg-orange-500/10 border-orange-500/30'
        }`}>
          <p className={`text-xs ${
            box.status === 'broken'
              ? 'text-green-600 dark:text-green-400'
              : box.status === 'active'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-orange-600 dark:text-orange-400'
          }`}>
            {box.status === 'broken'
              ? `💡 Price broke out above box high (₹${box.boxHigh.toFixed(2)}) ${box.volumeConfirmed ? 'with strong volume' : 'but volume is weak'}. Potential bullish continuation.`
              : box.status === 'active'
                ? `📦 Stock consolidating in ${box.consolidationDays}-day box. Breakout level: ₹${box.breakoutPrice.toFixed(2)} (${((box.breakoutPrice - box.currentPrice) / box.currentPrice * 100).toFixed(1)}% above current price).`
                : `⚠️ Price attempted breakout but failed to sustain above box high. Possible false breakout - wait for re-entry.`
            }
          </p>
        </div>

        {/* Volume Info */}
        <div className="bg-gray-100 dark:bg-[#30363d] border border-gray-200 dark:border-[#444c56] rounded-lg p-2 mb-3">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600 dark:text-[#8b949e]">Current Volume:</span>
            <span className="font-semibold text-gray-900 dark:text-white">{box.currentVolume.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-gray-600 dark:text-[#8b949e]">Avg Volume:</span>
            <span className="font-semibold text-gray-900 dark:text-white">{box.avgVolume.toLocaleString()}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-[#30363d]">
          <button
            onClick={(e) => {
              const analysisText = `Darvas Box Pattern Detected (${box.status.replace('_', ' ').toUpperCase()}).\n\nBox Metrics:\n- Box High: ₹${box.boxHigh.toFixed(2)}\n- Box Low: ₹${box.boxLow.toFixed(2)}\n- Box Range: ${box.boxRangePercent.toFixed(1)}%\n- Consolidation Days: ${box.consolidationDays}\n- Current Price: ₹${box.currentPrice.toFixed(2)}\n- 52-Week High: ₹${box.week52High.toFixed(2)}\n\n${
                box.status === 'broken'
                  ? `Breakout Analysis:\n- Breakout Price: ₹${box.breakoutPrice.toFixed(2)}\n- Volume Confirmed: ${box.volumeConfirmed ? 'Yes ✓' : 'No ✗'}\n- Price Above Box: ${box.priceToBoxHighPercent.toFixed(2)}%\n\nBullish breakout detected. Consider entry on pullback to box high with stop loss below box low.`
                  : box.status === 'active'
                    ? `Active Box:\n- Awaiting breakout above ₹${box.breakoutPrice.toFixed(2)}\n- Stock consolidating for ${box.consolidationDays} days\n- Risk-Reward Ratio: ${box.riskRewardRatio.toFixed(2)}:1\n\nWatch for breakout with volume confirmation. Entry at breakout, stop below box low.`
                    : `False Breakout:\n- Price failed to sustain above ₹${box.boxHigh.toFixed(2)}\n- Volume: ${box.volumeConfirmed ? 'Confirmed' : 'Weak'}\n\nAvoid entry. Wait for proper consolidation and re-breakout attempt.`
              }`;

              handleConvertToIdea(e, box.symbol, displaySymbol, box.currentPrice, box.status === 'broken' || box.status === 'active', analysisText);
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
              id: box.id,
              symbol: box.symbol,
              date: box.date,
              crossoverType: 'bullish_cross',
              yesterdayClose: box.boxLow,
              todayClose: box.currentPrice,
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

              // Track screener converted to idea
              trackScreenerConvertedToIdea(displaySymbol, activeTab);

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
        <p className="text-sm text-gray-600 dark:text-[#8b949e]">
          {displayDate ? `Showing data for ${formatDateIndian(displayDate)}` : 'Stocks that crossed moving averages'}
        </p>
      </div>

      {/* Tabs */}
      <div className="px-5 mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => handleTabChange('both')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'both'
                ? 'bg-[#ff8c42] text-gray-900 dark:text-white'
                : 'bg-gray-50 dark:bg-[#1c2128] text-gray-600 dark:text-[#8b949e] hover:bg-gray-100 dark:hover:bg-[#30363d]'
            }`}
          >
            50 & 200 MA Both
          </button>
          <button
            onClick={() => handleTabChange('50ma')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === '50ma'
                ? 'bg-[#ff8c42] text-gray-900 dark:text-white'
                : 'bg-gray-50 dark:bg-[#1c2128] text-gray-600 dark:text-[#8b949e] hover:bg-gray-100 dark:hover:bg-[#30363d]'
            }`}
          >
            50 MA Only
          </button>
          <button
            onClick={() => handleTabChange('200ma')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === '200ma'
                ? 'bg-[#ff8c42] text-gray-900 dark:text-white'
                : 'bg-gray-50 dark:bg-[#1c2128] text-gray-600 dark:text-[#8b949e] hover:bg-gray-100 dark:hover:bg-[#30363d]'
            }`}
          >
            200 MA Only
          </button>
          <button
            onClick={() => handleTabChange('supertrend')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'supertrend'
                ? 'bg-[#ff8c42] text-gray-900 dark:text-white'
                : 'bg-gray-50 dark:bg-[#1c2128] text-gray-600 dark:text-[#8b949e] hover:bg-gray-100 dark:hover:bg-[#30363d]'
            }`}
          >
            Supertrend
          </button>
          <button
            onClick={() => handleTabChange('volume')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'volume'
                ? 'bg-[#ff8c42] text-gray-900 dark:text-white'
                : 'bg-gray-50 dark:bg-[#1c2128] text-gray-600 dark:text-[#8b949e] hover:bg-gray-100 dark:hover:bg-[#30363d]'
            }`}
          >
            Volume Spikes
          </button>
          <button
            onClick={() => handleTabChange('darvas')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'darvas'
                ? 'bg-[#ff8c42] text-gray-900 dark:text-white'
                : 'bg-gray-50 dark:bg-[#1c2128] text-gray-600 dark:text-[#8b949e] hover:bg-gray-100 dark:hover:bg-[#30363d]'
            }`}
          >
            Darvas Boxes
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
                <div className="mb-4 flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Volume Spikes</h2>
                  <span className="px-2 py-0.5 bg-[#ff8c42]/20 text-[#ff8c42] text-xs font-semibold rounded-full">
                    {volumeSpikes.length} {volumeSpikes.length === 1 ? 'stock' : 'stocks'}
                  </span>
                  {displayDate && (
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full">
                      as on {formatDateIndian(displayDate)}
                    </span>
                  )}
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

          // Handle Darvas boxes separately
          if (activeTab === 'darvas') {
            return darvasBoxes.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Darvas boxes found</h3>
                <p className="text-gray-600 dark:text-[#8b949e]">No stocks showing Darvas box patterns today</p>
              </div>
            ) : (
              <>
                {/* Summary */}
                <div className="mb-4 flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Darvas Box Patterns</h2>
                  <span className="px-2 py-0.5 bg-[#ff8c42]/20 text-[#ff8c42] text-xs font-semibold rounded-full">
                    {darvasBoxes.length} {darvasBoxes.length === 1 ? 'stock' : 'stocks'}
                  </span>
                  <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full">
                    {darvasBoxes.filter(b => b.status === 'broken').length} Breakouts
                  </span>
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full">
                    {darvasBoxes.filter(b => b.status === 'active').length} Active
                  </span>
                  {displayDate && (
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-semibold rounded-full">
                      as on {formatDateIndian(displayDate)}
                    </span>
                  )}
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {darvasBoxes.map((box) => (
                    <div key={box.id}>
                      {renderDarvasBoxCard(box)}
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
              <div className="mb-4 flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {activeTab === 'both'
                    ? 'Stocks Crossing Both 50 MA & 200 MA'
                    : activeTab === 'supertrend'
                      ? 'Supertrend Crossovers'
                      : `${activeTab === '50ma' ? '50 MA' : '200 MA'} Crossovers`
                  }
                </h2>
                <span className="px-2 py-0.5 bg-[#ff8c42]/20 text-[#ff8c42] text-xs font-semibold rounded-full">
                  {activeTab === 'both'
                    ? `${new Set(displayCrossovers.map(c => c.symbol)).size} ${new Set(displayCrossovers.map(c => c.symbol)).size === 1 ? 'stock' : 'stocks'}`
                    : `${displayCrossovers.length} ${displayCrossovers.length === 1 ? 'stock' : 'stocks'}`
                  }
                </span>
                {displayDate && (
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full">
                    as on {formatDateIndian(displayDate)}
                  </span>
                )}
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
