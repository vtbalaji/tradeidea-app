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
  yesterdayTrailstop?: number;
  todayTrailstop?: number;
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

interface BBSqueeze {
  id: string;
  symbol: string;
  date: string;
  signalType: 'BUY' | 'SELL' | 'SQUEEZE' | 'BREAKOUT';
  currentPrice: number;
  bbUpper: number;
  bbLower: number;
  bbMA: number;
  bbWidthPercent: number;
  rsi: number;
  macd: number;
  inSqueeze: boolean;
  daysInSqueeze: number;
  proportion: number;
  bbBreakout: boolean;
  distanceToUpperPercent: number;
  distanceToLowerPercent: number;
}

interface MultiScreenerStock {
  symbol: string;
  screeners: string[]; // List of screeners this stock appears in
  count: number; // Number of screeners
  // Details from each screener
  ma50?: Crossover;
  ma200?: Crossover;
  advancedTrailstop?: Crossover;
  darvas?: DarvasBox;
  bbsqueeze?: BBSqueeze;
  volumeSpike?: VolumeSpike;
}

export default function Cross50200Page() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'macross' | 'advancedtrailstop' | 'volume' | 'darvas' | 'bbsqueeze' | 'multi'>('macross');

  // Track tab change
  const handleTabChange = (tab: 'macross' | 'advancedtrailstop' | 'volume' | 'darvas' | 'bbsqueeze' | 'multi') => {
    setActiveTab(tab);
    trackScreenerViewed(tab);
  };
  const [crossovers50, setCrossovers50] = useState<Crossover[]>([]);
  const [crossovers200, setCrossovers200] = useState<Crossover[]>([]);
  const [advancedTrailstopCrossovers, setAdvancedTrailstopCrossovers] = useState<Crossover[]>([]);
  const [volumeSpikes, setVolumeSpikes] = useState<VolumeSpike[]>([]);
  const [darvasBoxes, setDarvasBoxes] = useState<DarvasBox[]>([]);
  const [bbSqueezeSignals, setBBSqueezeSignals] = useState<BBSqueeze[]>([]);
  const [multiScreenerStocks, setMultiScreenerStocks] = useState<MultiScreenerStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState<string | null>(null);
  const [currentRecommendation, setCurrentRecommendation] = useState<any>(null);
  const [symbolData, setSymbolData] = useState<{[key: string]: {technicals: any, fundamentals: any}}>({});
  const [displayDate, setDisplayDate] = useState<string | null>(null);
  const [bbSqueezeFilter, setBBSqueezeFilter] = useState<'ALL' | 'BUY' | 'SELL' | 'SQUEEZE' | 'BREAKOUT'>('ALL');
  const [maCrossFilter, setMACrossFilter] = useState<'both' | '50ma' | '200ma'>('both');
  const [darvasFilter, setDarvasFilter] = useState<'ALL' | 'broken' | 'active'>('ALL');
  const [advancedTrailstopFilter, setAdvancedTrailstopFilter] = useState<'ALL' | 'bullish' | 'bearish'>('ALL');

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
        let dataAdvancedTrailstop: Crossover[] = [];
        let dataVolumeSpike: VolumeSpike[] = [];
        let dataDarvasBoxes: DarvasBox[] = [];
        let dataBBSqueeze: BBSqueeze[] = [];

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

          // Fetch Advanced Trailstop - use the same latestDate
          try {
            const testAdvancedTrailstop = await getDocs(collection(db, 'advancedtrailstop'));
            console.log(`✅ Can access advancedtrailstop: ${testAdvancedTrailstop.docs.length} total documents`);

            if (testAdvancedTrailstop.docs.length > 0) {
              const filteredAdvancedTrailstop = testAdvancedTrailstop.docs.filter(doc => doc.data().date === latestDate);
              if (filteredAdvancedTrailstop.length > 0) {
                console.log(`✅ Found ${filteredAdvancedTrailstop.length} records in advancedtrailstop for ${latestDate}`);
                dataAdvancedTrailstop = filteredAdvancedTrailstop.map(doc => ({
                  id: doc.id,
                  ...doc.data()
                } as Crossover));
              }
            }
          } catch (err: any) {
            console.error('❌ Error accessing advancedtrailstop:', err.message);
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

          // Fetch BB Squeeze - use the same latestDate
          try {
            const testBBSqueeze = await getDocs(collection(db, 'bbsqueeze'));
            console.log(`✅ Can access bbsqueeze: ${testBBSqueeze.docs.length} total documents`);

            if (testBBSqueeze.docs.length > 0) {
              // Log all unique dates in bbsqueeze collection
              const allDates = testBBSqueeze.docs.map(doc => doc.data().date as string);
              const uniqueDates = [...new Set(allDates)].sort().reverse();
              console.log('📅 Available BB Squeeze dates:', uniqueDates.slice(0, 5));
              console.log('📅 Looking for latestDate:', latestDate);

              // Log a sample document to see its structure
              if (testBBSqueeze.docs.length > 0) {
                console.log('📄 Sample BB Squeeze document:', testBBSqueeze.docs[0].data());
              }

              const filteredBBSqueeze = testBBSqueeze.docs.filter(doc => doc.data().date === latestDate);
              console.log(`🔍 Filtered BB Squeeze for date ${latestDate}: ${filteredBBSqueeze.length} records`);

              if (filteredBBSqueeze.length > 0) {
                console.log(`✅ Found ${filteredBBSqueeze.length} records in bbsqueeze for ${latestDate}`);
                dataBBSqueeze = filteredBBSqueeze.map(doc => ({
                  id: doc.id,
                  ...doc.data()
                } as BBSqueeze));
                console.log('📊 First BB Squeeze signal:', dataBBSqueeze[0]);
              } else {
                console.warn(`⚠️ No BB Squeeze records found for ${latestDate}. Available dates:`, uniqueDates);
              }
            }
          } catch (err: any) {
            console.error('❌ Error accessing bbsqueeze:', err.message);
          }
        }

        // If still no records found, fetch a sample to show what dates are available
        if (data50.length === 0 && data200.length === 0 && dataAdvancedTrailstop.length === 0 && dataVolumeSpike.length === 0) {
          console.warn('⚠️ No records found for any date format. Fetching sample records...');

          try {
            // Fetch sample from each collection without orderBy to avoid index issues
            const sample50 = await getDocs(collection(db, 'macrossover50'));
            const sample200 = await getDocs(collection(db, 'macrossover200'));
            const sampleAdvancedTrailstop = await getDocs(collection(db, 'advancedtrailstop'));
            const sampleVolume = await getDocs(collection(db, 'volumespike'));

            console.log('📋 Total documents in Firebase:');
            console.log(`  macrossover50: ${sample50.docs.length} documents`);
            console.log(`  macrossover200: ${sample200.docs.length} documents`);
            console.log(`  advancedtrailstop: ${sampleAdvancedTrailstop.docs.length} documents`);
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

            if (sampleAdvancedTrailstop.docs.length > 0) {
              const allDatesAdvancedTrailstop = sampleAdvancedTrailstop.docs.map(d => d.data().date);
              const uniqueDatesAdvancedTrailstop = [...new Set(allDatesAdvancedTrailstop)].sort().reverse().slice(0, 10);
              console.log('  advancedtrailstop (latest 10 unique dates):', uniqueDatesAdvancedTrailstop);
              console.log('  First record sample:', sampleAdvancedTrailstop.docs[0].data());
            } else {
              console.log('  advancedtrailstop: No documents found');
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
        dataAdvancedTrailstop = dataAdvancedTrailstop.sort((a, b) => Math.abs(b.crossPercent) - Math.abs(a.crossPercent));
        dataVolumeSpike = dataVolumeSpike.sort((a, b) => b.spikePercent - a.spikePercent);
        dataDarvasBoxes = dataDarvasBoxes.sort((a, b) => b.consolidationDays - a.consolidationDays);
        dataBBSqueeze = dataBBSqueeze.sort((a, b) => {
          // Sort by signal type priority: BUY > BREAKOUT > SQUEEZE > SELL
          const priority: { [key: string]: number } = { 'BUY': 4, 'BREAKOUT': 3, 'SQUEEZE': 2, 'SELL': 1 };
          return (priority[b.signalType] || 0) - (priority[a.signalType] || 0);
        });

        setCrossovers50(data50);
        setCrossovers200(data200);
        setAdvancedTrailstopCrossovers(dataAdvancedTrailstop);
        setVolumeSpikes(dataVolumeSpike);
        setDarvasBoxes(dataDarvasBoxes);
        setBBSqueezeSignals(dataBBSqueeze);
        setDisplayDate(latestDate);

        // Calculate multi-screener stocks (excluding supertrend)
        const symbolMap = new Map<string, MultiScreenerStock>();

        // Add MA50 crosses
        data50.forEach(item => {
          const existing = symbolMap.get(item.symbol) || {
            symbol: item.symbol,
            screeners: [],
            count: 0
          };
          existing.screeners.push('MA50');
          existing.ma50 = item;
          existing.count = existing.screeners.length;
          symbolMap.set(item.symbol, existing);
        });

        // Add MA200 crosses
        data200.forEach(item => {
          const existing = symbolMap.get(item.symbol) || {
            symbol: item.symbol,
            screeners: [],
            count: 0
          };
          existing.screeners.push('MA200');
          existing.ma200 = item;
          existing.count = existing.screeners.length;
          symbolMap.set(item.symbol, existing);
        });

        // Add Advanced Trailstop
        dataAdvancedTrailstop.forEach(item => {
          const existing = symbolMap.get(item.symbol) || {
            symbol: item.symbol,
            screeners: [],
            count: 0
          };
          existing.screeners.push('Advanced Trailstop');
          existing.advancedTrailstop = item;
          existing.count = existing.screeners.length;
          symbolMap.set(item.symbol, existing);
        });

        // Add Volume Spikes
        dataVolumeSpike.forEach(item => {
          const existing = symbolMap.get(item.symbol) || {
            symbol: item.symbol,
            screeners: [],
            count: 0
          };
          existing.screeners.push('Volume Spike');
          existing.volumeSpike = item;
          existing.count = existing.screeners.length;
          symbolMap.set(item.symbol, existing);
        });

        // Add Darvas Boxes
        dataDarvasBoxes.forEach(item => {
          const existing = symbolMap.get(item.symbol) || {
            symbol: item.symbol,
            screeners: [],
            count: 0
          };
          existing.screeners.push('Darvas Box');
          existing.darvas = item;
          existing.count = existing.screeners.length;
          symbolMap.set(item.symbol, existing);
        });

        // Add BB Squeeze
        dataBBSqueeze.forEach(item => {
          const existing = symbolMap.get(item.symbol) || {
            symbol: item.symbol,
            screeners: [],
            count: 0
          };
          existing.screeners.push('BB Squeeze');
          existing.bbsqueeze = item;
          existing.count = existing.screeners.length;
          symbolMap.set(item.symbol, existing);
        });

        // Filter stocks that appear in 2 or more screeners
        const multiStocks = Array.from(symbolMap.values())
          .filter(stock => stock.count >= 2)
          .sort((a, b) => b.count - a.count);

        setMultiScreenerStocks(multiStocks);

        console.log('📊 Final counts:', {
          ma50: data50.length,
          ma200: data200.length,
          advancedtrailstop: dataAdvancedTrailstop.length,
          volumeSpikes: dataVolumeSpike.length,
          darvasBoxes: dataDarvasBoxes.length,
          bbSqueeze: dataBBSqueeze.length,
          multiScreener: multiStocks.length,
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
        alert('⚠️ Analysis data not available for this stock yet. Please check back later.');
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
        alert('⚠️ Analysis data not available for this stock yet. Please check back later.');
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

    // Show analysis instead of navigating to idea creation
    // Fetch symbol data from Firestore for analysis
    try {
      const symbolDoc = await getDoc(doc(db, 'symbols', symbol));
      if (!symbolDoc.exists()) {
        alert('⚠️ Symbol data not found in database.');
        return;
      }

      const data = symbolDoc.data();
      const technicals = data.technicals || data.technical;
      const fundamentals = data.fundamentals || data.fundamental;

      if (!technicals || !fundamentals) {
        alert('⚠️ Analysis data not available for this stock yet. Please check back later.');
        return;
      }

      // Track analysis viewed
      trackAnalysisViewed(symbol, 'screener-multi');

      // Create investment engine and show analysis
      const engine = createInvestmentEngine(technicals, fundamentals);
      const rec = engine.getRecommendation();
      setCurrentRecommendation(rec);
      setShowAnalysisModal(symbol);
    } catch (error) {
      console.error('Error fetching symbol data:', error);
      alert('⚠️ Failed to fetch analysis data.');
    }
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
            onClick={async (e) => {
              e.stopPropagation();

              const isBullish = isPriceUp;

              // Fetch symbol data to get technical levels (Supertrend, 100MA, 50MA)
              let entryPrice = spike.todayClose;
              let stopLoss = isBullish ? spike.todayClose * 0.95 : spike.todayClose * 1.05;
              let target = isBullish ? spike.todayClose * 1.10 : spike.todayClose * 0.90;
              let supertrendLevel = null;
              let sma100Level = null;
              let sma50Level = null;

              try {
                const symbolDoc = await getDoc(doc(db, 'symbols', spike.symbol));
                if (symbolDoc.exists()) {
                  const data = symbolDoc.data();
                  const technicals = data.technicals || data.technical;

                  if (technicals) {
                    supertrendLevel = parseFloat(technicals.supertrend || technicals.supertrendLevel) || null;
                    sma100Level = parseFloat(technicals.sma100 || technicals.ma100) || null;
                    sma50Level = parseFloat(technicals.sma50 || technicals.ema50 || technicals.ma50) || null;
                  }
                }
              } catch (error) {
                console.error('Error fetching symbol data:', error);
              }

              // For bullish signals, use support levels for entry
              if (isBullish) {
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

                if (supportLevels.length > 0) {
                  entryPrice = Math.max(...supportLevels);
                  stopLoss = entryPrice * 0.98;
                } else {
                  entryPrice = spike.todayClose;
                  stopLoss = entryPrice * 0.95;
                }
              } else {
                // For bearish/short ideas
                entryPrice = spike.todayClose;
                const resistanceLevels = [spike.todayClose * 1.05];
                if (supertrendLevel && supertrendLevel > 0 && !isNaN(supertrendLevel)) {
                  resistanceLevels.push(supertrendLevel);
                }
                if (sma100Level && sma100Level > 0 && !isNaN(sma100Level)) {
                  resistanceLevels.push(sma100Level);
                }

                if (resistanceLevels.length > 0) {
                  stopLoss = Math.min(...resistanceLevels) * 1.02;
                }
              }

              // Calculate target based on risk-reward ratio (2:1)
              const riskAmount = Math.abs(entryPrice - stopLoss);
              target = entryPrice + (riskAmount * 2);

              const analysisText = `High volume spike detected (${spike.spikePercent.toFixed(1)}% above 20MA).\n\nKey Points:\n- Today's Volume: ${spike.todayVolume.toLocaleString()}\n- 20MA Volume: ${spike.volumeMA20.toLocaleString()}\n- Price Change: ${isPriceUp ? '+' : ''}${spike.priceChangePercent.toFixed(2)}%\n- Current Price: ₹${spike.todayClose.toFixed(2)}\n\n${isPriceUp ? 'Strong volume with price increase suggests bullish momentum. Consider entry on pullbacks with proper stop loss.' : 'High volume despite price decline may indicate selling climax or distribution. Monitor for reversal signals.'}`;

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
    const statusLabel = box.status === 'broken' ? '🟢 Buy' : box.status === 'active' ? '🟦 Consolidating' : '⚠️ False';

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
            onClick={async (e) => {
              e.stopPropagation();

              const isBullish = box.status === 'broken' || box.status === 'active';

              // Fetch symbol data to get technical levels (Supertrend, 100MA, 50MA)
              let entryPrice = box.currentPrice;
              let stopLoss = isBullish ? box.currentPrice * 0.95 : box.currentPrice * 1.05;
              let target = isBullish ? box.currentPrice * 1.10 : box.currentPrice * 0.90;
              let supertrendLevel = null;
              let sma100Level = null;
              let sma50Level = null;

              try {
                const symbolDoc = await getDoc(doc(db, 'symbols', box.symbol));
                if (symbolDoc.exists()) {
                  const data = symbolDoc.data();
                  const technicals = data.technicals || data.technical;

                  if (technicals) {
                    supertrendLevel = parseFloat(technicals.supertrend || technicals.supertrendLevel) || null;
                    sma100Level = parseFloat(technicals.sma100 || technicals.ma100) || null;
                    sma50Level = parseFloat(technicals.sma50 || technicals.ema50 || technicals.ma50) || null;
                  }
                }
              } catch (error) {
                console.error('Error fetching symbol data:', error);
              }

              // For Darvas boxes, use box low as a key support level
              if (isBullish) {
                const supportLevels = [];

                // Box low is a critical support for Darvas pattern
                if (box.boxLow && box.boxLow > 0) {
                  supportLevels.push(box.boxLow);
                }

                if (supertrendLevel && supertrendLevel > 0 && !isNaN(supertrendLevel)) {
                  supportLevels.push(supertrendLevel);
                }
                if (sma100Level && sma100Level > 0 && !isNaN(sma100Level)) {
                  supportLevels.push(sma100Level);
                }
                if (sma50Level && sma50Level > 0 && !isNaN(sma50Level)) {
                  supportLevels.push(sma50Level);
                }

                if (supportLevels.length > 0) {
                  // For Darvas, if box is broken, entry should be box high (breakout level)
                  if (box.status === 'broken') {
                    entryPrice = box.boxHigh;
                    // Stop loss at box low
                    stopLoss = box.boxLow;
                  } else {
                    // For active box, entry at current price, stop at box low
                    entryPrice = box.currentPrice;
                    stopLoss = box.boxLow * 0.98; // Slightly below box low
                  }
                } else {
                  entryPrice = box.currentPrice;
                  stopLoss = entryPrice * 0.95;
                }
              } else {
                // For false breakout/bearish
                entryPrice = box.currentPrice;
                const resistanceLevels = [box.currentPrice * 1.05];
                if (supertrendLevel && supertrendLevel > 0 && !isNaN(supertrendLevel)) {
                  resistanceLevels.push(supertrendLevel);
                }
                if (sma100Level && sma100Level > 0 && !isNaN(sma100Level)) {
                  resistanceLevels.push(sma100Level);
                }

                if (resistanceLevels.length > 0) {
                  stopLoss = Math.min(...resistanceLevels) * 1.02;
                }
              }

              // Calculate target based on risk-reward ratio (2:1)
              const riskAmount = Math.abs(entryPrice - stopLoss);
              target = entryPrice + (riskAmount * 2);

              const analysisText = `Darvas Box Pattern Detected (${box.status.replace('_', ' ').toUpperCase()}).\n\nBox Metrics:\n- Box High: ₹${box.boxHigh.toFixed(2)}\n- Box Low: ₹${box.boxLow.toFixed(2)}\n- Box Range: ${box.boxRangePercent.toFixed(1)}%\n- Consolidation Days: ${box.consolidationDays}\n- Current Price: ₹${box.currentPrice.toFixed(2)}\n- 52-Week High: ₹${box.week52High.toFixed(2)}\n\n${
                box.status === 'broken'
                  ? `Breakout Analysis:\n- Breakout Price: ₹${box.breakoutPrice.toFixed(2)}\n- Volume Confirmed: ${box.volumeConfirmed ? 'Yes ✓' : 'No ✗'}\n- Price Above Box: ${box.priceToBoxHighPercent.toFixed(2)}%\n\nBullish breakout detected. Consider entry on pullback to box high with stop loss below box low.`
                  : box.status === 'active'
                    ? `Active Box:\n- Awaiting breakout above ₹${box.breakoutPrice.toFixed(2)}\n- Stock consolidating for ${box.consolidationDays} days\n- Risk-Reward Ratio: ${box.riskRewardRatio.toFixed(2)}:1\n\nWatch for breakout with volume confirmation. Entry at breakout, stop below box low.`
                    : `False Breakout:\n- Price failed to sustain above ₹${box.boxHigh.toFixed(2)}\n- Volume: ${box.volumeConfirmed ? 'Confirmed' : 'Weak'}\n\nAvoid entry. Wait for proper consolidation and re-breakout attempt.`
              }`;

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

  const renderBBSqueezeCard = (signal: BBSqueeze) => {
    const displaySymbol = signal.symbol.replace(/^NS_/, '');

    // Determine signal color and label
    const getSignalStyle = (type: string) => {
      switch (type) {
        case 'BUY':
          return { bg: 'bg-green-500/20', text: 'text-green-400', label: '🟢 BUY' };
        case 'SELL':
          return { bg: 'bg-red-500/20', text: 'text-red-400', label: '🔴 SELL' };
        case 'SQUEEZE':
          return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: '🔒 SQUEEZE' };
        case 'BREAKOUT':
          return { bg: 'bg-blue-500/20', text: 'text-blue-400', label: '💥 BREAKOUT' };
        default:
          return { bg: 'bg-gray-500/20', text: 'text-gray-400', label: '⚪ NONE' };
      }
    };

    const signalStyle = getSignalStyle(signal.signalType);

    return (
      <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-4 hover:border-[#ff8c42] transition-colors">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{displaySymbol}</h3>
            <p className="text-xs text-gray-600 dark:text-[#8b949e] mt-0.5">BB Squeeze Strategy</p>
          </div>
          <span className={`px-3 py-1 text-xs font-semibold rounded ${signalStyle.bg} ${signalStyle.text}`}>
            {signalStyle.label}
          </span>
        </div>

        {/* Price & BB Levels */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-2">
            <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-1">BB Upper</p>
            <p className="text-xs font-semibold text-gray-900 dark:text-white">₹{signal.bbUpper.toFixed(2)}</p>
          </div>
          <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-2">
            <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-1">Price</p>
            <p className="text-xs font-semibold text-[#ff8c42]">₹{signal.currentPrice.toFixed(2)}</p>
          </div>
          <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-2">
            <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-1">BB Lower</p>
            <p className="text-xs font-semibold text-gray-900 dark:text-white">₹{signal.bbLower.toFixed(2)}</p>
          </div>
        </div>

        {/* Indicators */}
        <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-3 mb-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-600 dark:text-[#8b949e]">RSI:</span>
              <span className={`ml-1 font-semibold ${
                signal.rsi > 70 ? 'text-red-500' : signal.rsi > 60 ? 'text-green-500' : signal.rsi < 30 ? 'text-red-500' : 'text-gray-900 dark:text-white'
              }`}>
                {signal.rsi.toFixed(1)}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-[#8b949e]">MACD:</span>
              <span className={`ml-1 font-semibold ${signal.macd > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {signal.macd.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-[#8b949e]">BB Width:</span>
              <span className="ml-1 font-semibold text-gray-900 dark:text-white">{signal.bbWidthPercent.toFixed(2)}%</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-[#8b949e]">Squeeze Days:</span>
              <span className="ml-1 font-semibold text-gray-900 dark:text-white">{signal.daysInSqueeze}</span>
            </div>
          </div>
        </div>

        {/* Signal Description */}
        <div className={`border rounded-lg p-2 mb-3 ${
          signal.signalType === 'BUY'
            ? 'bg-green-500/10 border-green-500/30'
            : signal.signalType === 'SELL'
              ? 'bg-red-500/10 border-red-500/30'
              : signal.signalType === 'SQUEEZE'
                ? 'bg-yellow-500/10 border-yellow-500/30'
                : 'bg-blue-500/10 border-blue-500/30'
        }`}>
          <p className={`text-xs ${
            signal.signalType === 'BUY'
              ? 'text-green-600 dark:text-green-400'
              : signal.signalType === 'SELL'
                ? 'text-red-600 dark:text-red-400'
                : signal.signalType === 'SQUEEZE'
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-blue-600 dark:text-blue-400'
          }`}>
            {signal.signalType === 'BUY'
              ? `💡 Strong BUY signal! Price above BB upper (${signal.distanceToUpperPercent.toFixed(2)}%), RSI ${signal.rsi.toFixed(1)}, MACD positive.`
              : signal.signalType === 'SELL'
                ? `⚠️ SELL signal detected. Price below BB lower (${signal.distanceToLowerPercent.toFixed(2)}%), RSI ${signal.rsi.toFixed(1)}, MACD negative.`
                : signal.signalType === 'SQUEEZE'
                  ? `🔒 In squeeze for ${signal.daysInSqueeze} days. Watch for breakout! BB Width: ${signal.bbWidthPercent.toFixed(2)}%`
                  : `💥 Breakout detected! Volatility expanding after ${signal.daysInSqueeze} day squeeze. Monitor for direction.`
            }
          </p>
        </div>

        {/* Squeeze Status */}
        {signal.inSqueeze && (
          <div className="bg-gray-100 dark:bg-[#30363d] border border-gray-200 dark:border-[#444c56] rounded-lg p-2 mb-3">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600 dark:text-[#8b949e]">Proportion:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{signal.proportion.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-gray-600 dark:text-[#8b949e]">BB Breakout:</span>
              <span className={`font-semibold ${signal.bbBreakout ? 'text-green-500' : 'text-gray-900 dark:text-white'}`}>
                {signal.bbBreakout ? 'Yes ✓' : 'No'}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-[#30363d]">
          <button
            onClick={async (e) => {
              e.stopPropagation();

              const isBullish = signal.signalType === 'BUY' || signal.signalType === 'BREAKOUT';

              // Fetch symbol data to get technical levels (Supertrend, 100MA, 50MA)
              let entryPrice = signal.currentPrice;
              let stopLoss = isBullish ? signal.currentPrice * 0.95 : signal.currentPrice * 1.05;
              let target = isBullish ? signal.currentPrice * 1.10 : signal.currentPrice * 0.90;
              let supertrendLevel = null;
              let sma100Level = null;
              let sma50Level = null;

              try {
                const symbolDoc = await getDoc(doc(db, 'symbols', signal.symbol));
                if (symbolDoc.exists()) {
                  const data = symbolDoc.data();
                  const technicals = data.technicals || data.technical;

                  if (technicals) {
                    supertrendLevel = parseFloat(technicals.supertrend || technicals.supertrendLevel) || null;
                    sma100Level = parseFloat(technicals.sma100 || technicals.ma100) || null;
                    sma50Level = parseFloat(technicals.sma50 || technicals.ema50 || technicals.ma50) || null;
                  }
                }
              } catch (error) {
                console.error('Error fetching symbol data:', error);
              }

              // For bullish signals, use support levels for entry
              if (isBullish) {
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

                if (supportLevels.length > 0) {
                  entryPrice = Math.max(...supportLevels);
                  stopLoss = entryPrice * 0.98;
                } else {
                  entryPrice = signal.currentPrice;
                  stopLoss = entryPrice * 0.95;
                }
              } else {
                // For bearish/short ideas
                entryPrice = signal.currentPrice;
                const resistanceLevels = [signal.currentPrice * 1.05];
                if (supertrendLevel && supertrendLevel > 0 && !isNaN(supertrendLevel)) {
                  resistanceLevels.push(supertrendLevel);
                }
                if (sma100Level && sma100Level > 0 && !isNaN(sma100Level)) {
                  resistanceLevels.push(sma100Level);
                }

                if (resistanceLevels.length > 0) {
                  stopLoss = Math.min(...resistanceLevels) * 1.02;
                }
              }

              // Calculate target based on risk-reward ratio (2:1)
              const riskAmount = Math.abs(entryPrice - stopLoss);
              target = entryPrice + (riskAmount * 2);

              const analysisText = `BB Squeeze ${signal.signalType} Signal Detected.\n\nIndicators:\n- Signal Type: ${signal.signalType}\n- Current Price: ₹${signal.currentPrice.toFixed(2)}\n- BB Upper: ₹${signal.bbUpper.toFixed(2)}\n- BB Lower: ₹${signal.bbLower.toFixed(2)}\n- BB MA: ₹${signal.bbMA.toFixed(2)}\n- BB Width: ${signal.bbWidthPercent.toFixed(2)}%\n- RSI: ${signal.rsi.toFixed(1)}\n- MACD: ${signal.macd.toFixed(2)}\n- Days in Squeeze: ${signal.daysInSqueeze}\n- In Squeeze: ${signal.inSqueeze ? 'Yes' : 'No'}\n- BB Breakout: ${signal.bbBreakout ? 'Yes' : 'No'}\n\n${
                signal.signalType === 'BUY'
                  ? `Strong bullish momentum detected. Price broke above BB upper band with RSI > 60 and positive MACD. Consider entry on pullbacks with stop below BB MA.`
                  : signal.signalType === 'SELL'
                    ? `Bearish pressure detected. Price fell below BB lower band with RSI < 40 and negative MACD. Avoid fresh longs or consider profit booking.`
                    : signal.signalType === 'SQUEEZE'
                      ? `Stock in consolidation (squeeze) for ${signal.daysInSqueeze} days. Volatility compression suggests potential explosive move. Watch for breakout direction.`
                      : `Volatility expansion after ${signal.daysInSqueeze} day squeeze. Monitor price action and volume for directional clarity before entry.`
              }`;

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
          <AnalysisButton onClick={async (e) => {
            e.stopPropagation();

            // Create a temporary crossover object for the handleAnalyze function
            const tempCrossover: Crossover = {
              id: signal.id,
              symbol: signal.symbol,
              date: signal.date,
              crossoverType: 'bullish_cross',
              yesterdayClose: signal.bbLower,
              todayClose: signal.currentPrice,
              crossPercent: 0,
            };

            await handleAnalyze(e, tempCrossover);
          }} />
        </div>
      </div>
    );
  };

  const renderCrossoverCard = (crossover: Crossover, showBothLabel: boolean = false, isAdvancedTrailstop: boolean = false) => {
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
              {isAdvancedTrailstop ? 'Advanced Trailstop Crossover' : (showBothLabel ? '50 & 200 MA Crossover' : `${crossover.ma_period} MA Crossover`)}
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

        {/* MA/Advanced Trailstop Info */}
        <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-3 mb-3">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-semibold text-[#ff8c42]">
              {isAdvancedTrailstop ? 'Advanced Trailstop Level' : `${crossover.ma_period} MA Level`}
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
                Yesterday {isAdvancedTrailstop ? 'ATS' : 'MA'}:
              </span>
              <span className="ml-1 font-semibold text-gray-900 dark:text-white">
                ₹{isAdvancedTrailstop
                  ? crossover.yesterdayTrailstop?.toFixed(2)
                  : crossover.yesterdayMA?.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-[#8b949e]">
                Today {isAdvancedTrailstop ? 'ATS' : 'MA'}:
              </span>
              <span className="ml-1 font-semibold text-gray-900 dark:text-white">
                ₹{isAdvancedTrailstop
                  ? crossover.todayTrailstop?.toFixed(2)
                  : crossover.todayMA?.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Crossover Description */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2 mb-3">
          <p className="text-xs text-blue-600 dark:text-blue-400">
            {isAdvancedTrailstop
              ? (isBullish
                  ? `💡 Advanced Trailstop turned bullish - 9-bar rising lows detected`
                  : `⚠️ Advanced Trailstop turned bearish - 9-bar falling highs detected`)
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
              const analysisText = isAdvancedTrailstop
                ? `${isBullish ? 'Bullish' : 'Bearish'} Advanced Trailstop crossover detected.\n\nKey Points:\n- Price is ${isBullish ? 'above' : 'below'} Advanced Trailstop by ${Math.abs(crossover.crossPercent).toFixed(2)}%\n- Current Price: ₹${crossover.todayClose.toFixed(2)}\n- Trailstop Level: ₹${crossover.todayTrailstop?.toFixed(2)}\n- System: 9-bar ${isBullish ? 'rising lows' : 'falling highs'} with ATR-based trailing stop\n\n${isBullish ? 'This signals strong upward momentum with 9 consecutive rising lows. The Advanced Trailstop adapts to volatility and trails below support. Consider entry on pullbacks to the trailstop level.' : 'This signals downward pressure with 9 consecutive falling highs. The Advanced Trailstop has flipped bearish. Consider exiting long positions or avoiding new entries.'}`
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Screeners</h1>
        <p className="text-sm text-gray-600 dark:text-[#8b949e]">
          {displayDate ? `Showing data for ${formatDateIndian(displayDate)}` : 'Stocks that crossed moving averages'}
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-4">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 px-5 min-w-max">
            <button
              onClick={() => handleTabChange('macross')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'macross'
                  ? 'bg-[#ff8c42] text-gray-900 dark:text-white'
                  : 'bg-gray-50 dark:bg-[#1c2128] text-gray-600 dark:text-[#8b949e] hover:bg-gray-100 dark:hover:bg-[#30363d]'
              }`}
            >
              Average Cross
            </button>
            <button
              onClick={() => handleTabChange('advancedtrailstop')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'advancedtrailstop'
                  ? 'bg-[#ff8c42] text-gray-900 dark:text-white'
                  : 'bg-gray-50 dark:bg-[#1c2128] text-gray-600 dark:text-[#8b949e] hover:bg-gray-100 dark:hover:bg-[#30363d]'
              }`}
            >
              Advanced Trailstop
            </button>
            <button
              onClick={() => handleTabChange('volume')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'volume'
                  ? 'bg-[#ff8c42] text-gray-900 dark:text-white'
                  : 'bg-gray-50 dark:bg-[#1c2128] text-gray-600 dark:text-[#8b949e] hover:bg-gray-100 dark:hover:bg-[#30363d]'
              }`}
            >
              Volume Spikes
            </button>
            <button
              onClick={() => handleTabChange('darvas')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'darvas'
                  ? 'bg-[#ff8c42] text-gray-900 dark:text-white'
                  : 'bg-gray-50 dark:bg-[#1c2128] text-gray-600 dark:text-[#8b949e] hover:bg-gray-100 dark:hover:bg-[#30363d]'
              }`}
            >
              Darvas Boxes
            </button>
            <button
              onClick={() => handleTabChange('bbsqueeze')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'bbsqueeze'
                  ? 'bg-[#ff8c42] text-gray-900 dark:text-white'
                  : 'bg-gray-50 dark:bg-[#1c2128] text-gray-600 dark:text-[#8b949e] hover:bg-gray-100 dark:hover:bg-[#30363d]'
              }`}
            >
              BB Squeeze
            </button>
            <button
              onClick={() => handleTabChange('multi')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'multi'
                  ? 'bg-[#ff8c42] text-gray-900 dark:text-white'
                  : 'bg-gray-50 dark:bg-[#1c2128] text-gray-600 dark:text-[#8b949e] hover:bg-gray-100 dark:hover:bg-[#30363d]'
              }`}
            >
              Multi-Screener ({multiScreenerStocks.length})
            </button>
          </div>
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
          // Handle MA Cross tab with filters
          if (activeTab === 'macross') {
            let displayCrossovers: Crossover[] = [];

            if (maCrossFilter === 'both') {
              // Find stocks that crossed BOTH 50 MA and 200 MA
              const symbols50 = new Set(crossovers50.map(c => c.symbol));
              const symbols200 = new Set(crossovers200.map(c => c.symbol));
              const commonSymbols = [...symbols50].filter(symbol => symbols200.has(symbol));

              // Get crossovers for common symbols (show only 50 MA version to avoid duplicates)
              displayCrossovers = crossovers50
                .filter(c => commonSymbols.includes(c.symbol))
                .sort((a, b) => Math.abs(b.crossPercent) - Math.abs(a.crossPercent));
            } else if (maCrossFilter === '50ma') {
              displayCrossovers = crossovers50;
            } else if (maCrossFilter === '200ma') {
              displayCrossovers = crossovers200;
            }

            return displayCrossovers.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No crossovers found</h3>
                <p className="text-gray-600 dark:text-[#8b949e]">
                  {maCrossFilter === 'both'
                    ? 'No stocks crossed both 50 MA and 200 MA today'
                    : `No stocks crossed the ${maCrossFilter === '50ma' ? '50' : '200'} MA today`
                  }
                </p>
              </div>
            ) : (
              <>
                {/* Summary with Filter Buttons */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Moving Average Crossovers</h2>
                    <span className="px-2 py-0.5 bg-[#ff8c42]/20 text-[#ff8c42] text-xs font-semibold rounded-full">
                      {displayCrossovers.length} {displayCrossovers.length === 1 ? 'stock' : 'stocks'}
                    </span>
                  </div>

                  {/* Filter Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setMACrossFilter('both')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        maCrossFilter === 'both'
                          ? 'bg-[#ff8c42] text-white'
                          : 'bg-gray-100 dark:bg-[#1c2128] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#30363d]'
                      }`}
                    >
                      50 & 200 MA Both ({(() => {
                        const symbols50 = new Set(crossovers50.map(c => c.symbol));
                        const symbols200 = new Set(crossovers200.map(c => c.symbol));
                        return [...symbols50].filter(symbol => symbols200.has(symbol)).length;
                      })()})
                    </button>
                    <button
                      onClick={() => setMACrossFilter('50ma')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        maCrossFilter === '50ma'
                          ? 'bg-[#ff8c42] text-white'
                          : 'bg-gray-100 dark:bg-[#1c2128] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#30363d]'
                      }`}
                    >
                      50 MA Only ({crossovers50.length})
                    </button>
                    <button
                      onClick={() => setMACrossFilter('200ma')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        maCrossFilter === '200ma'
                          ? 'bg-[#ff8c42] text-white'
                          : 'bg-gray-100 dark:bg-[#1c2128] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#30363d]'
                      }`}
                    >
                      200 MA Only ({crossovers200.length})
                    </button>
                  </div>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayCrossovers.map((crossover) => (
                    <div key={`${crossover.symbol}-${crossover.ma_period || 'st'}-${crossover.id}`}>
                      {renderCrossoverCard(crossover, maCrossFilter === 'both', false)}
                    </div>
                  ))}
                </div>
              </>
            );
          }

          // Handle Advanced Trailstop tab
          if (activeTab === 'advancedtrailstop') {
            // Apply filter
            let filteredAdvancedTrailstop = advancedTrailstopCrossovers;
            if (advancedTrailstopFilter === 'bullish') {
              filteredAdvancedTrailstop = advancedTrailstopCrossovers.filter(c => c.crossoverType === 'bullish_cross');
            } else if (advancedTrailstopFilter === 'bearish') {
              filteredAdvancedTrailstop = advancedTrailstopCrossovers.filter(c => c.crossoverType === 'bearish_cross');
            }

            return filteredAdvancedTrailstop.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📈</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Advanced Trailstop crossovers found</h3>
                <p className="text-gray-600 dark:text-[#8b949e]">
                  {advancedTrailstopFilter === 'ALL'
                    ? 'No stocks crossed Advanced Trailstop levels today'
                    : `No ${advancedTrailstopFilter} crossovers found`
                  }
                </p>
              </div>
            ) : (
              <>
                {/* Summary with Filter Buttons */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Advanced Trailstop Crossovers</h2>
                    <span className="px-2 py-0.5 bg-[#ff8c42]/20 text-[#ff8c42] text-xs font-semibold rounded-full">
                      {filteredAdvancedTrailstop.length} {filteredAdvancedTrailstop.length === 1 ? 'stock' : 'stocks'}
                    </span>
                  </div>

                  {/* Filter Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setAdvancedTrailstopFilter('ALL')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        advancedTrailstopFilter === 'ALL'
                          ? 'bg-[#ff8c42] text-white'
                          : 'bg-gray-100 dark:bg-[#1c2128] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#30363d]'
                      }`}
                    >
                      All ({advancedTrailstopCrossovers.length})
                    </button>
                    <button
                      onClick={() => setAdvancedTrailstopFilter('bullish')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        advancedTrailstopFilter === 'bullish'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 dark:bg-[#1c2128] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#30363d]'
                      }`}
                    >
                      🟢 Bullish ({advancedTrailstopCrossovers.filter(c => c.crossoverType === 'bullish_cross').length})
                    </button>
                    <button
                      onClick={() => setAdvancedTrailstopFilter('bearish')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        advancedTrailstopFilter === 'bearish'
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-100 dark:bg-[#1c2128] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#30363d]'
                      }`}
                    >
                      🔴 Bearish ({advancedTrailstopCrossovers.filter(c => c.crossoverType === 'bearish_cross').length})
                    </button>
                  </div>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {filteredAdvancedTrailstop.map((crossover) => (
                    <div key={crossover.id}>
                      {renderCrossoverCard(crossover, false, true)}
                    </div>
                  ))}
                </div>

                {/* Advanced Trailstop Rules Reference */}
                <div className="mt-8 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-2xl">📈</span>
                    Advanced Trailstop System (AFL-based)
                  </h3>
                  <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                    <div>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">Market Cap Filter:</span> &gt;1000 Cr
                    </div>
                    <div>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">ATR Period:</span> 7 days (default)
                    </div>
                    <div>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">Multiplier:</span> 2.0x ATR
                    </div>
                    <div>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">Trend Detection:</span> 9-bar lookback (rising lows = bullish, falling highs = bearish)
                    </div>
                    <div className="pt-2 border-t border-indigo-200 dark:border-indigo-800">
                      <p className="font-semibold text-indigo-600 dark:text-indigo-400 mb-2">How it Works:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li><strong>Bullish Signal:</strong> When last 9 lows are rising AND close &gt; previous trailstop</li>
                        <li><strong>Bearish Signal:</strong> When last 9 highs are falling AND close &lt; previous trailstop</li>
                        <li><strong>Trailstop Calculation:</strong> Low - (2.0 × ATR) for bullish, High + (2.0 × ATR) for bearish</li>
                        <li><strong>Dynamic Adjustment:</strong> Trailstop follows price action, tightening as trend strengthens</li>
                      </ul>
                    </div>
                    <div className="pt-2 border-t border-indigo-200 dark:border-indigo-800">
                      <p className="font-semibold text-indigo-600 dark:text-indigo-400 mb-2">Advantages over Standard Supertrend:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>More sensitive to trend changes (9-bar vs single bar)</li>
                        <li>Better at catching early trend reversals</li>
                        <li>Adapts to volatility through ATR-based calculation</li>
                        <li>Reduces false signals in ranging markets</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            );
          }

          // Filter stocks based on active tab
          let displayCrossovers: Crossover[] = [];

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
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {volumeSpikes.map((spike) => (
                    <div key={spike.id}>
                      {renderVolumeSpikeCard(spike)}
                    </div>
                  ))}
                </div>

                {/* Volume Spike Rules Reference */}
                <div className="mt-8 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-2xl">📊</span>
                    Volume Spike Detection Rules
                  </h3>
                  <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                    <div>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">Market Cap Filter:</span> &gt;1000 Cr
                    </div>
                    <div>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">Filter 1:</span> Volume ≥ 1.5x of 20-day MA (default threshold)
                    </div>
                    <div>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">Filter 2:</span> Volume &gt; 1.2x of 50-day MA (confirms longer-term trend strength)
                    </div>
                    <div>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">Filter 3:</span> Volume consistency check:
                      <ul className="ml-6 mt-1 space-y-1 text-xs">
                        <li>• Volume building over 2-3 days OR</li>
                        <li>• Exceptional volume (&gt;2 standard deviations above average)</li>
                      </ul>
                    </div>
                    <div>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">Filter 4:</span> Price movement alignment (&gt;0.5% price change required)
                    </div>
                    <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">Quality Score (0-100):</span>
                      <ul className="ml-6 mt-1 space-y-1 text-xs">
                        <li>• Trend Consistency: 30 points</li>
                        <li>• Relative Strength (RVR): 40 points</li>
                        <li>• Price Alignment: 30 points</li>
                      </ul>
                    </div>
                    <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">Status Indicators:</span>
                      <ul className="ml-6 mt-1 space-y-1 text-xs">
                        <li>⚡ = Exceptional volume (&gt;2σ above average)</li>
                        <li>📈 = Consistent volume trend (building over multiple days)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            );
          }

          // Handle BB Squeeze separately
          if (activeTab === 'bbsqueeze') {
            // Filter BB Squeeze signals based on selected filter
            const filteredBBSqueeze = bbSqueezeFilter === 'ALL'
              ? bbSqueezeSignals
              : bbSqueezeSignals.filter(s => s.signalType === bbSqueezeFilter);

            return bbSqueezeSignals.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔒</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No BB Squeeze signals found</h3>
                <p className="text-gray-600 dark:text-[#8b949e]">No stocks showing BB Squeeze patterns today</p>
              </div>
            ) : (
              <>
                {/* Summary with Filter Buttons */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">BB Squeeze Signals</h2>
                    <span className="px-2 py-0.5 bg-[#ff8c42]/20 text-[#ff8c42] text-xs font-semibold rounded-full">
                      {bbSqueezeSignals.length} {bbSqueezeSignals.length === 1 ? 'stock' : 'stocks'}
                    </span>
                  </div>

                  {/* Filter Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setBBSqueezeFilter('ALL')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        bbSqueezeFilter === 'ALL'
                          ? 'bg-[#ff8c42] text-white'
                          : 'bg-gray-100 dark:bg-[#1c2128] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#30363d]'
                      }`}
                    >
                      All ({bbSqueezeSignals.length})
                    </button>
                    <button
                      onClick={() => setBBSqueezeFilter('BUY')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        bbSqueezeFilter === 'BUY'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 dark:bg-[#1c2128] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#30363d]'
                      }`}
                    >
                      🟢 BUY ({bbSqueezeSignals.filter(s => s.signalType === 'BUY').length})
                    </button>
                    <button
                      onClick={() => setBBSqueezeFilter('SELL')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        bbSqueezeFilter === 'SELL'
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-100 dark:bg-[#1c2128] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#30363d]'
                      }`}
                    >
                      🔴 SELL ({bbSqueezeSignals.filter(s => s.signalType === 'SELL').length})
                    </button>
                    <button
                      onClick={() => setBBSqueezeFilter('SQUEEZE')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        bbSqueezeFilter === 'SQUEEZE'
                          ? 'bg-yellow-500 text-white'
                          : 'bg-gray-100 dark:bg-[#1c2128] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#30363d]'
                      }`}
                    >
                      🔒 SQUEEZE ({bbSqueezeSignals.filter(s => s.signalType === 'SQUEEZE').length})
                    </button>
                    <button
                      onClick={() => setBBSqueezeFilter('BREAKOUT')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        bbSqueezeFilter === 'BREAKOUT'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-[#1c2128] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#30363d]'
                      }`}
                    >
                      💥 BREAKOUT ({bbSqueezeSignals.filter(s => s.signalType === 'BREAKOUT').length})
                    </button>
                  </div>
                </div>

                {/* Cards Grid */}
                {filteredBBSqueeze.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-3">🔍</div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No {bbSqueezeFilter} signals</h3>
                    <p className="text-sm text-gray-600 dark:text-[#8b949e]">Try selecting a different filter</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {filteredBBSqueeze.map((signal) => (
                      <div key={signal.id}>
                        {renderBBSqueezeCard(signal)}
                      </div>
                    ))}
                  </div>
                )}

                {/* BB Squeeze Rules Reference */}
                <div className="mt-8 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-2xl">🔒</span>
                    BB Squeeze Breakout Strategy
                  </h3>
                  <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                    <div>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">Market Cap Filter:</span> &gt;1000 Cr
                    </div>

                    <div className="pt-2 border-t border-indigo-200 dark:border-indigo-800">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">Indicators Used:</span>
                      <ul className="ml-6 mt-1 space-y-1 text-xs">
                        <li>• <strong>Bollinger Bands:</strong> 20-period MA, 2 standard deviations</li>
                        <li>• <strong>Keltner Channels:</strong> 14-period EMA, 1.5 ATR</li>
                        <li>• <strong>RSI:</strong> 14-period Relative Strength Index</li>
                        <li>• <strong>MACD:</strong> 12/26/9 Moving Average Convergence Divergence</li>
                      </ul>
                    </div>

                    <div className="pt-2 border-t border-indigo-200 dark:border-indigo-800">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">Signal Types:</span>
                      <ul className="ml-6 mt-1 space-y-1 text-xs">
                        <li>• <strong className="text-green-600 dark:text-green-400">🟢 BUY:</strong> Price &gt; BB Upper + RSI &gt; 60 + MACD &gt; 0</li>
                        <li>• <strong className="text-red-600 dark:text-red-400">🔴 SELL:</strong> Price &lt; BB Lower + RSI &lt; 40 + MACD &lt; 0</li>
                        <li>• <strong className="text-yellow-600 dark:text-yellow-400">🔒 SQUEEZE:</strong> BB inside Keltner (proportion &lt; 1.0)</li>
                        <li>• <strong className="text-blue-600 dark:text-blue-400">💥 BREAKOUT:</strong> BB breaks out of Keltner (proportion crosses 1.0)</li>
                      </ul>
                    </div>

                    <div className="pt-2 border-t border-indigo-200 dark:border-indigo-800">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">Trading Logic:</span>
                      <ul className="ml-6 mt-1 space-y-1 text-xs">
                        <li>1. <strong>Squeeze Phase:</strong> Low volatility consolidation (BB inside Keltner)</li>
                        <li>2. <strong>Breakout Phase:</strong> Volatility expansion (BB breaks outside Keltner)</li>
                        <li>3. <strong>BUY Condition:</strong> Strong bullish breakout with momentum confirmation</li>
                        <li>4. <strong>SELL Condition:</strong> Strong bearish breakdown with momentum confirmation</li>
                      </ul>
                    </div>

                    <div className="pt-2 border-t border-indigo-200 dark:border-indigo-800">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">Risk Management:</span>
                      <ul className="ml-6 mt-1 space-y-1 text-xs">
                        <li>• <strong>Entry:</strong> On breakout or pullback to BB band</li>
                        <li>• <strong>Stop Loss:</strong> Below BB MA (for longs) or above BB MA (for shorts)</li>
                        <li>• <strong>Target:</strong> Based on BB width and recent volatility</li>
                        <li>• <strong>Position Sizing:</strong> Risk 1-2% of capital per trade</li>
                      </ul>
                    </div>

                    <div className="pt-2 border-t border-indigo-200 dark:border-indigo-800">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">Key Metrics:</span>
                      <ul className="ml-6 mt-1 space-y-1 text-xs">
                        <li>• <strong>BB Width %:</strong> Measures volatility (narrow = squeeze, wide = breakout)</li>
                        <li>• <strong>Proportion:</strong> Keltner width / BB width (&lt;1.0 = squeeze, &gt;1.0 = expansion)</li>
                        <li>• <strong>Days in Squeeze:</strong> Longer squeeze = stronger potential move</li>
                        <li>• <strong>Distance to Bands:</strong> Shows price position relative to BB bands</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            );
          }

          // Handle Darvas boxes separately
          if (activeTab === 'darvas') {
            // Filter Darvas boxes based on selected filter
            const filteredDarvas = darvasFilter === 'ALL'
              ? darvasBoxes
              : darvasBoxes.filter(b => b.status === darvasFilter);

            return darvasBoxes.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Darvas boxes found</h3>
                <p className="text-gray-600 dark:text-[#8b949e]">No stocks showing Darvas box patterns today</p>
              </div>
            ) : (
              <>
                {/* Summary with Filter Buttons */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Darvas Box Patterns</h2>
                    <span className="px-2 py-0.5 bg-[#ff8c42]/20 text-[#ff8c42] text-xs font-semibold rounded-full">
                      {darvasBoxes.length} {darvasBoxes.length === 1 ? 'stock' : 'stocks'}
                    </span>
                  </div>

                  {/* Filter Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setDarvasFilter('ALL')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        darvasFilter === 'ALL'
                          ? 'bg-[#ff8c42] text-white'
                          : 'bg-gray-100 dark:bg-[#1c2128] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#30363d]'
                      }`}
                    >
                      All ({darvasBoxes.length})
                    </button>
                    <button
                      onClick={() => setDarvasFilter('broken')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        darvasFilter === 'broken'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 dark:bg-[#1c2128] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#30363d]'
                      }`}
                    >
                      🟢 Buy ({darvasBoxes.filter(b => b.status === 'broken').length})
                    </button>
                    <button
                      onClick={() => setDarvasFilter('active')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        darvasFilter === 'active'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-[#1c2128] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#30363d]'
                      }`}
                    >
                      🟦 Consolidating ({darvasBoxes.filter(b => b.status === 'active').length})
                    </button>
                  </div>
                </div>

                {/* Cards Grid */}
                {filteredDarvas.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-3">🔍</div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No {darvasFilter === 'broken' ? 'buy' : 'consolidating'} boxes</h3>
                    <p className="text-sm text-gray-600 dark:text-[#8b949e]">Try selecting a different filter</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {filteredDarvas.map((box) => (
                      <div key={box.id}>
                        {renderDarvasBoxCard(box)}
                      </div>
                    ))}
                  </div>
                )}

                {/* Darvas Box Rules Reference */}
                <div className="mt-8 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-2xl">📦</span>
                    Darvas Box Detection Rules (Nicolas Darvas Methodology)
                  </h3>
                  <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-semibold text-purple-600 dark:text-purple-400">Market Cap Filter:</span> &gt;1200 Cr
                      </div>
                      <div>
                        <span className="font-semibold text-purple-600 dark:text-purple-400">Debt-to-Equity:</span> &lt;1.0
                      </div>
                    </div>

                    <div className="pt-2 border-t border-purple-200 dark:border-purple-800">
                      <span className="font-semibold text-purple-600 dark:text-purple-400">Detection Rules:</span>
                      <ul className="ml-6 mt-1 space-y-1 text-xs">
                        <li>• Rule 1: Stock within 10% of 52-week high</li>
                        <li>• Rule 2: Consolidation period: 3-8 weeks</li>
                        <li>• Rule 3: Box range: 4-12% (tight consolidation)</li>
                        <li>• Rule 4: Minimum 2 touches of box top (resistance tests)</li>
                        <li>• Rule 5: Breakout volume: 1.3x average required</li>
                        <li>• Rule 6: Volume expansion: 1.3x consolidation average</li>
                        <li>• Rule 7: Price confirmation: 1+ day above box = &quot;broken&quot; status</li>
                      </ul>
                    </div>

                    <div className="pt-2 border-t border-purple-200 dark:border-purple-800">
                      <span className="font-semibold text-purple-600 dark:text-purple-400">Box Components:</span>
                      <ul className="ml-6 mt-1 space-y-1 text-xs">
                        <li>• <strong>Box Top:</strong> Highest high during consolidation (resistance)</li>
                        <li>• <strong>Box Bottom:</strong> Lowest low during consolidation (support)</li>
                        <li>• <strong>Breakout Price:</strong> Box Top + 0.5%</li>
                      </ul>
                    </div>

                    <div className="pt-2 border-t border-purple-200 dark:border-purple-800">
                      <span className="font-semibold text-purple-600 dark:text-purple-400">Trading Guidelines:</span>
                      <ul className="ml-6 mt-1 space-y-1 text-xs">
                        <li>• <strong>Entry:</strong> On breakout or pullback to box top</li>
                        <li>• <strong>Stop Loss:</strong> 2% below box bottom</li>
                        <li>• <strong>Target:</strong> Box high + 2x box height (Darvas projection)</li>
                        <li>• <strong>Risk-Reward:</strong> Aim for 2:1 to 3:1 ratio</li>
                      </ul>
                    </div>

                    <div className="pt-2 border-t border-purple-200 dark:border-purple-800">
                      <span className="font-semibold text-purple-600 dark:text-purple-400">Box Status:</span>
                      <ul className="ml-6 mt-1 space-y-1 text-xs">
                        <li>• <strong className="text-green-600 dark:text-green-400">🟢 Buy:</strong> Confirmed breakout (price + volume + 2+ days above box)</li>
                        <li>• <strong className="text-blue-600 dark:text-blue-400">🟦 Consolidating:</strong> Consolidating OR potential breakout (needs confirmation)</li>
                        <li>• <strong className="text-orange-600 dark:text-orange-400">⚠️ False:</strong> Breakout without proper volume confirmation</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            );
          }

          // Handle Multi-Screener tab
          if (activeTab === 'multi') {
            return multiScreenerStocks.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No multi-screener stocks</h3>
                <p className="text-gray-600 dark:text-[#8b949e]">No stocks appearing in multiple screeners today</p>
              </div>
            ) : (
              <>
                {/* Summary */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Multi-Screener Stocks</h2>
                    <span className="px-2 py-0.5 bg-[#ff8c42]/20 text-[#ff8c42] text-xs font-semibold rounded-full">
                      {multiScreenerStocks.length} {multiScreenerStocks.length === 1 ? 'stock' : 'stocks'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-[#8b949e]">
                    Stocks appearing in 2 or more screeners (excluding Supertrend)
                  </p>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {multiScreenerStocks.map((stock) => {
                    const displaySymbol = stock.symbol.replace('NS_', '');
                    const screenerBadgeColors: { [key: string]: string } = {
                      'MA50': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
                      'MA200': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
                      'Advanced Trailstop': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
                      'Volume Spike': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
                      'Darvas Box': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
                      'BB Squeeze': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300'
                    };

                    return (
                      <div
                        key={stock.symbol}
                        className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-xl p-4 hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={async (e) => {
                          e.stopPropagation();

                          // Get the first available screener data for price
                          const priceData = stock.ma50 || stock.ma200 || stock.advancedTrailstop || stock.volumeSpike || stock.darvas || stock.bbsqueeze;
                          const currentPrice = priceData
                            ? ('todayClose' in priceData ? priceData.todayClose : 'currentPrice' in priceData ? priceData.currentPrice : 0)
                            : 0;

                          const isBullish = stock.ma50?.crossoverType === 'bullish_cross' ||
                            stock.advancedTrailstop?.crossoverType === 'bullish_cross' ||
                            stock.bbsqueeze?.signalType === 'BUY' ||
                            stock.darvas?.status === 'broken' ||
                            (stock.volumeSpike && stock.volumeSpike.priceChangePercent > 0);

                          // Fetch symbol data to get technical levels (Supertrend, 100MA, 50MA)
                          let entryPrice = currentPrice;
                          let stopLoss = isBullish ? currentPrice * 0.95 : currentPrice * 1.05;
                          let target = isBullish ? currentPrice * 1.10 : currentPrice * 0.90;
                          let supertrendLevel = null;
                          let sma100Level = null;
                          let sma50Level = null;

                          try {
                            const symbolDoc = await getDoc(doc(db, 'symbols', stock.symbol));
                            if (symbolDoc.exists()) {
                              const data = symbolDoc.data();
                              const technicals = data.technicals || data.technical;

                              if (technicals) {
                                supertrendLevel = parseFloat(technicals.supertrend || technicals.supertrendLevel) || null;
                                sma100Level = parseFloat(technicals.sma100 || technicals.ma100) || null;
                                sma50Level = parseFloat(technicals.sma50 || technicals.ema50 || technicals.ma50) || null;
                              }
                            }
                          } catch (error) {
                            console.error('Error fetching symbol data:', error);
                          }

                          // For bullish signals, use support levels for entry
                          if (isBullish) {
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

                            if (supportLevels.length > 0) {
                              entryPrice = Math.max(...supportLevels);
                              stopLoss = entryPrice * 0.98;
                            } else {
                              entryPrice = currentPrice;
                              stopLoss = entryPrice * 0.95;
                            }
                          } else {
                            // For bearish/short ideas
                            entryPrice = currentPrice;
                            const resistanceLevels = [currentPrice * 1.05];
                            if (supertrendLevel && supertrendLevel > 0 && !isNaN(supertrendLevel)) {
                              resistanceLevels.push(supertrendLevel);
                            }
                            if (sma100Level && sma100Level > 0 && !isNaN(sma100Level)) {
                              resistanceLevels.push(sma100Level);
                            }

                            if (resistanceLevels.length > 0) {
                              stopLoss = Math.min(...resistanceLevels) * 1.02;
                            }
                          }

                          // Calculate target based on risk-reward ratio (2:1)
                          const riskAmount = Math.abs(entryPrice - stopLoss);
                          target = entryPrice + (riskAmount * 2);

                          // Build analysis text
                          const screenersList = stock.screeners.join(', ');
                          const analysisText = `Multi-screener signal detected for ${displaySymbol}.\n\nActive Screeners: ${screenersList}\n\nCurrent Price: ₹${currentPrice.toFixed(2)}\n\nThis stock is showing ${isBullish ? 'bullish' : 'bearish'} signals across multiple technical indicators.`;

                          // Track screener converted to idea
                          trackScreenerConvertedToIdea(displaySymbol, activeTab);

                          // Navigate to new idea page with pre-populated data
                          router.push(`/ideas/new?symbol=${encodeURIComponent(displaySymbol)}&analysis=${encodeURIComponent(analysisText)}&entryPrice=${entryPrice.toFixed(2)}&stopLoss=${stopLoss.toFixed(2)}&target=${target.toFixed(2)}`);
                        }}
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                              {displaySymbol}
                            </h3>
                          </div>
                          <AnalysisButton onClick={async (e) => {
                            e.stopPropagation();

                            // Create a temporary crossover object for the handleAnalyze function
                            // Use stock.symbol (with NS_ prefix) for Firebase lookup
                            const tempCrossover: Crossover = {
                              id: stock.symbol,
                              symbol: stock.symbol, // Use NS_ prefixed symbol for Firebase
                              crossoverType: stock.ma50?.crossoverType || stock.ma200?.crossoverType || stock.advancedTrailstop?.crossoverType || 'bullish_cross',
                              date: stock.ma50?.date || stock.ma200?.date || stock.advancedTrailstop?.date || new Date(),
                              currentPrice: stock.ma50?.todayClose || stock.ma200?.todayClose || stock.advancedTrailstop?.todayClose || 0,
                              yesterdayClose: 0,
                              crossPercent: stock.ma50?.crossPercent || stock.ma200?.crossPercent || stock.advancedTrailstop?.crossPercent || 0,
                              type: 'multi-screener' as const,
                            };

                            await handleAnalyze(e, tempCrossover);
                          }} />
                        </div>

                        {/* Screener Details */}
                        <div className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
                          {stock.ma50 && (
                            <div className="flex justify-between items-center py-1 border-t border-gray-100 dark:border-gray-800">
                              <span className="font-semibold">MA50:</span>
                              <span className={stock.ma50.crossoverType === 'bullish_cross' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                {stock.ma50.crossoverType === 'bullish_cross' ? '🟢 Bullish' : '🔴 Bearish'} ({stock.ma50.crossPercent.toFixed(2)}%)
                              </span>
                            </div>
                          )}
                          {stock.ma200 && (
                            <div className="flex justify-between items-center py-1 border-t border-gray-100 dark:border-gray-800">
                              <span className="font-semibold">MA200:</span>
                              <span className={stock.ma200.crossoverType === 'bullish_cross' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                {stock.ma200.crossoverType === 'bullish_cross' ? '🟢 Bullish' : '🔴 Bearish'} ({stock.ma200.crossPercent.toFixed(2)}%)
                              </span>
                            </div>
                          )}
                          {stock.advancedTrailstop && (
                            <div className="flex justify-between items-center py-1 border-t border-gray-100 dark:border-gray-800">
                              <span className="font-semibold">Trailstop:</span>
                              <span className={stock.advancedTrailstop.crossoverType === 'bullish_cross' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                {stock.advancedTrailstop.crossoverType === 'bullish_cross' ? '🟢 Bullish' : '🔴 Bearish'} ({stock.advancedTrailstop.crossPercent.toFixed(2)}%)
                              </span>
                            </div>
                          )}
                          {stock.volumeSpike && (
                            <div className="flex justify-between items-center py-1 border-t border-gray-100 dark:border-gray-800">
                              <span className="font-semibold">Volume Spike:</span>
                              <span className={stock.volumeSpike.priceChangePercent > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                {stock.volumeSpike.priceChangePercent > 0 ? '🟢' : '🔴'} {stock.volumeSpike.spikePercent.toFixed(1)}% ({stock.volumeSpike.priceChangePercent > 0 ? '+' : ''}{stock.volumeSpike.priceChangePercent.toFixed(2)}%)
                              </span>
                            </div>
                          )}
                          {stock.darvas && (
                            <div className="flex justify-between items-center py-1 border-t border-gray-100 dark:border-gray-800">
                              <span className="font-semibold">Darvas:</span>
                              <span className={
                                stock.darvas.status === 'broken' ? 'text-green-600 dark:text-green-400' :
                                stock.darvas.status === 'active' ? 'text-blue-600 dark:text-blue-400' :
                                'text-orange-600 dark:text-orange-400'
                              }>
                                {stock.darvas.status === 'broken' ? '🟢 Breakout' :
                                 stock.darvas.status === 'active' ? '🟦 Active' : '⚠️ False'}
                              </span>
                            </div>
                          )}
                          {stock.bbsqueeze && (
                            <div className="flex justify-between items-center py-1 border-t border-gray-100 dark:border-gray-800">
                              <span className="font-semibold">BB Squeeze:</span>
                              <span className={
                                stock.bbsqueeze.signalType === 'BUY' ? 'text-green-600 dark:text-green-400' :
                                stock.bbsqueeze.signalType === 'SELL' ? 'text-red-600 dark:text-red-400' :
                                stock.bbsqueeze.signalType === 'BREAKOUT' ? 'text-orange-600 dark:text-orange-400' :
                                'text-blue-600 dark:text-blue-400'
                              }>
                                {stock.bbsqueeze.signalType === 'BUY' ? '🟢 BUY' :
                                 stock.bbsqueeze.signalType === 'SELL' ? '🔴 SELL' :
                                 stock.bbsqueeze.signalType === 'BREAKOUT' ? '💥 BREAKOUT' : '🔒 SQUEEZE'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Current Price */}
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600 dark:text-gray-400">Current Price:</span>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                              ₹{(() => {
                                const priceData = stock.ma50 || stock.ma200 || stock.advancedTrailstop || stock.volumeSpike || stock.darvas || stock.bbsqueeze;
                                if (!priceData) return '0.00';
                                if ('todayClose' in priceData) return priceData.todayClose.toFixed(2);
                                if ('currentPrice' in priceData) return priceData.currentPrice.toFixed(2);
                                return '0.00';
                              })()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Info Box */}
                <div className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">💡</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">About Multi-Screener</h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                        Stocks appearing in multiple screeners often have stronger technical signals. These represent stocks with multiple confirmation signals across different technical strategies.
                      </p>
                      <div className="pt-2 border-t border-indigo-200 dark:border-indigo-800">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">Included Screeners:</span>
                        <ul className="ml-6 mt-1 space-y-1 text-xs">
                          <li>• <strong>MA50 & MA200:</strong> Moving average crossovers</li>
                          <li>• <strong>Advanced Trailstop:</strong> Dynamic support/resistance levels</li>
                          <li>• <strong>Volume Spike:</strong> Unusual volume with price movement</li>
                          <li>• <strong>Darvas Box:</strong> Consolidation and breakout patterns</li>
                          <li>• <strong>BB Squeeze:</strong> Volatility compression and expansion</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            );
          }

          return null;
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
