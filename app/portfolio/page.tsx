'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../../components/Navigation';
// import { useTrading } from '../../contexts/TradingContext'; // Removed - portfolio uses API directly
import { useAuth } from '../../contexts/AuthContext';
import { useAccounts } from '../../contexts/AccountsContext';
import { apiClient } from '@/lib/apiClient';
import { formatDateForDisplay } from '@/lib/dateUtils';
import { db } from '@/lib/firebase';
import { getSymbolData } from '@/lib/symbolDataService';
import InvestorAnalysisModal from '@/components/InvestorAnalysisModal';
import { createInvestmentEngine } from '@/lib/investment-rules';
import { trackPositionAdded, trackAnalysisViewed } from '@/lib/analytics';
import {
  PortfolioMetrics,
  SummaryPositionCard,
  DetailedPositionCard,
  EmptyPositionState,
  AddTransactionModal,
  AddPositionModal,
  ImportCsvModal,
  EditPositionModal,
} from '@/components/portfolio';

export default function PortfolioPage() {
  const router = useRouter();
  const { user } = useAuth();
  // const { myPortfolio, addTransaction, addToPortfolio, updatePosition } = useTrading();
  const [myPortfolio, setMyPortfolio] = useState<any[]>([]);
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const { accounts, activeAccount, setActiveAccount } = useAccounts();

  // UI State
  const [activeTab, setActiveTab] = useState<'open' | 'closed' | 'alerts'>('open');
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('detailed');
  const [expandedPositionId, setExpandedPositionId] = useState<string | null>(null);

  // Modal State
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showAddPositionModal, setShowAddPositionModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showEditPositionModal, setShowEditPositionModal] = useState(false);

  // Data State
  const [enrichedPositions, setEnrichedPositions] = useState<any[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<any>(null);
  const [currentRecommendation, setCurrentRecommendation] = useState<any>(null);
  const [analysisPosition, setAnalysisPosition] = useState<any>(null);

  // Check email verification
  useEffect(() => {
    if (user && !user.emailVerified) {
      router.push('/verify');
    }
  }, [user, router]);

  // Fetch portfolio data from API
  const fetchPortfolio = useCallback(async () => {
    if (!user) {
      setMyPortfolio([]);
      setPortfolioLoading(false);
      return;
    }

    try {
      setPortfolioLoading(true);
      const response = await apiClient.portfolio.list(activeAccount?.id);
      console.log('📦 Portfolio API Response:', response);
      console.log('📊 Total positions fetched:', response.positions?.length || 0);

      // Debug: Check smartSL fields in first few positions
      if (response.positions && response.positions.length > 0) {
        response.positions.slice(0, 3).forEach((pos: any) => {
          console.log(`Position ${pos.symbol}:`, {
            smartSLTrigger: pos.smartSLTrigger,
            smartSLPhase: pos.smartSLPhase,
            stopLoss: pos.stopLoss
          });
        });
      }

      setMyPortfolio(response.positions || []);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      setMyPortfolio([]);
    } finally {
      setPortfolioLoading(false);
    }
  }, [user, activeAccount]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  // Portfolio operation wrappers
  const addToPortfolio = useCallback(async (ideaId: string, position: any) => {
    // Transform position data to match API expectations
    const apiPosition = {
      ideaId: ideaId || undefined,
      accountId: activeAccount?.id,
      symbol: position.symbol,
      direction: position.tradeType || position.direction, // Map tradeType to direction
      quantity: position.quantity,
      entryPrice: position.entryPrice,
      entryDate: position.dateTaken || position.entryDate, // Map dateTaken to entryDate
      stopLoss: position.stopLoss,
      target: position.target1 || position.target, // Map target1 to target
      notes: position.notes,
    };

    await apiClient.portfolio.create(apiPosition);
    await fetchPortfolio(); // Refresh
  }, [fetchPortfolio, activeAccount]);

  const addTransaction = useCallback(async (positionId: string, transaction: any) => {
    await apiClient.portfolio.addTransaction(positionId, transaction);
    await fetchPortfolio(); // Refresh
  }, [fetchPortfolio]);

  const updatePosition = useCallback(async (positionId: string, updates: any) => {
    await apiClient.portfolio.update(positionId, updates);
    await fetchPortfolio(); // Refresh
  }, [fetchPortfolio]);

  // Fetch symbol data and enrich positions
  useEffect(() => {
    const enrichPositions = async () => {
      if (!myPortfolio || myPortfolio.length === 0) {
        setEnrichedPositions([]);
        return;
      }

      try {
        const uniqueSymbols = [...new Set(myPortfolio.map(p => p.symbol))];
        const symbolDataMap = new Map();

        await Promise.all(
          uniqueSymbols.map(async (symbol) => {
            try {
              const symbolWithPrefix = symbol.startsWith('NS_') ? symbol : `NS_${symbol}`;
              const symbolData = await getSymbolData(symbolWithPrefix);
              if (symbolData) {
                symbolDataMap.set(symbol, symbolData);
              }
            } catch (error) {
              console.error(`Error fetching symbol data for ${symbol}:`, error);
            }
          })
        );

        const enriched = myPortfolio.map(position => {
          const symbolData = symbolDataMap.get(position.symbol);
          return {
            ...position,
            technicals: symbolData?.technical || position.technicals,
            fundamentals: symbolData?.fundamental || position.fundamentals,
            currentPrice: symbolData?.technical?.lastPrice || position.currentPrice,
          };
        });

        setEnrichedPositions(enriched);
      } catch (error) {
        console.error('Error enriching positions:', error);
        setEnrichedPositions(myPortfolio);
      }
    };

    enrichPositions();
  }, [myPortfolio]);

  // Memoized filtered positions by account
  const accountPositions = useMemo(() => {
    if (!activeAccount) return enrichedPositions;
    return enrichedPositions.filter(p => !p.accountId || p.accountId === activeAccount.id);
  }, [enrichedPositions, activeAccount]);

  // Memoized open and closed positions (sorted alphabetically by symbol)
  const openPositions = useMemo(() =>
    accountPositions
      .filter(p => p.status === 'open')
      .sort((a, b) => a.symbol.localeCompare(b.symbol)),
    [accountPositions]
  );

  const closedPositions = useMemo(() =>
    accountPositions
      .filter(p => p.status === 'closed')
      .sort((a, b) => a.symbol.localeCompare(b.symbol)),
    [accountPositions]
  );

  // Alert positions - SL hit or SL near (within 3% of stop loss)
  const alertPositions = useMemo(() =>
    accountPositions
      .filter(p => {
        if (p.status !== 'open' || !p.stopLoss || !p.currentPrice) return false;

        const slThreshold = p.stopLoss * 1.03; // 3% above SL
        const isSlHit = p.currentPrice <= p.stopLoss;
        const isSlNear = p.currentPrice > p.stopLoss && p.currentPrice <= slThreshold;

        return isSlHit || isSlNear;
      })
      .sort((a, b) => {
        // Sort by distance to SL (closest first)
        const distanceA = ((a.currentPrice - a.stopLoss) / a.stopLoss) * 100;
        const distanceB = ((b.currentPrice - b.stopLoss) / b.stopLoss) * 100;
        return distanceA - distanceB;
      }),
    [accountPositions]
  );

  // Memoized portfolio metrics
  const portfolioMetrics = useMemo(() => {
    const portfolioValue = openPositions.reduce((sum, p) => sum + (p.currentPrice * p.quantity), 0);
    const totalPnL = openPositions.reduce((sum, p) => {
      const pnl = (p.currentPrice - p.entryPrice) * p.quantity;
      return sum + pnl;
    }, 0);

    // Calculate Today's P&L using previousClose from technical data
    const todayPnL = openPositions.reduce((sum, p) => {
      // Check if we have technical data with previousClose
      if (p.technicals?.previousClose && p.currentPrice) {
        const dailyPnl = (p.currentPrice - p.technicals.previousClose) * p.quantity;
        return sum + dailyPnl;
      }
      return sum;
    }, 0);

    return { portfolioValue, totalPnL, todayPnL };
  }, [openPositions]);

  // Handler functions with useCallback for optimization
  const handleOpenAnalysis = useCallback((position: any) => {
    if (!position.technicals || !position.fundamentals) {
      alert(`⚠️ Analysis data not available for ${position.symbol} yet. Please check back later.`);
      return;
    }

    // Track analysis viewed
    trackAnalysisViewed(position.symbol, 'portfolio');

    const engine = createInvestmentEngine(position.technicals, position.fundamentals);
    const rec = engine.getRecommendation();
    setCurrentRecommendation(rec);
    setAnalysisPosition(position);
    setShowAnalysisModal(true);
  }, []);

  const handleBuySell = useCallback((position: any) => {
    setSelectedPosition(position);
    setShowTransactionModal(true);
  }, []);

  const handleEdit = useCallback((position: any) => {
    setSelectedPosition(position);
    setShowEditPositionModal(true);
  }, []);

  const handleToggleExpand = useCallback((positionId: string) => {
    setExpandedPositionId(prev => prev === positionId ? null : positionId);
  }, []);

  // Wrapper for addToPortfolio to add tracking
  const handleAddToPortfolio = useCallback(async (ideaId: string, position: any) => {
    await addToPortfolio(ideaId, position);
    // Track manual position add (ideaId will be empty for manual adds)
    const source = ideaId ? 'idea' : 'manual';
    trackPositionAdded(position.symbol, source);
  }, [addToPortfolio]);

  // Render position cards based on view mode
  const renderPositions = useCallback((positions: any[]) => {
    if (positions.length === 0) {
      const isPortfolioEmpty = openPositions.length === 0 && closedPositions.length === 0;
      return (
        <EmptyPositionState
          isPortfolioEmpty={isPortfolioEmpty}
          activeTab={activeTab}
          onImport={() => setShowImportModal(true)}
          onAddPosition={() => setShowAddPositionModal(true)}
        />
      );
    }

    if (viewMode === 'summary') {
      return (
        <div className="space-y-3">
          {/* Table Header */}
          <div className="bg-gray-100 dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-600 dark:text-[#8b949e] uppercase">Symbol</p>
              </div>
              <div className="text-center w-24">
                <p className="text-xs font-bold text-gray-600 dark:text-[#8b949e] uppercase">Avg Buy</p>
              </div>
              <div className="text-center w-28">
                <p className="text-xs font-bold text-gray-600 dark:text-[#8b949e] uppercase">LTP</p>
              </div>
              <div className="text-right w-28">
                <p className="text-xs font-bold text-gray-600 dark:text-[#8b949e] uppercase">Profit/Loss</p>
              </div>
              <div className="w-5"></div>
            </div>
          </div>

          {/* Position Cards */}
          {positions.map((position) => (
            <SummaryPositionCard
              key={position.id}
              position={position}
              isExpanded={expandedPositionId === position.id}
              onToggleExpand={() => handleToggleExpand(position.id)}
              onAnalyze={handleOpenAnalysis}
              onBuySell={handleBuySell}
              onEdit={handleEdit}
            />
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {positions.map((position) => (
          <DetailedPositionCard
            key={position.id}
            position={position}
            onAnalyze={handleOpenAnalysis}
            onBuySell={handleBuySell}
            onEdit={handleEdit}
          />
        ))}
      </div>
    );
  }, [viewMode, expandedPositionId, openPositions.length, closedPositions.length, alertPositions.length, activeTab, handleToggleExpand, handleOpenAnalysis, handleBuySell, handleEdit]);

  const displayedPositions = activeTab === 'open' ? openPositions : activeTab === 'alerts' ? alertPositions : closedPositions;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1419]">
      <Navigation />

      {/* Header */}
      <div className="p-5 pt-8">
        <div className="flex justify-between items-center mb-2 gap-2">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white">My Portfolio</h1>
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={() => setShowImportModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-3 sm:px-4 rounded-lg transition-colors flex items-center gap-2 text-sm sm:text-base"
            >
              <span className="text-xl hidden sm:inline">📥</span>
              <span className="hidden sm:inline whitespace-nowrap">Import Portfolio</span>
              <span className="sm:hidden">Import</span>
            </button>
            <button
              onClick={() => setShowAddPositionModal(true)}
              className="bg-[#ff8c42] hover:bg-[#ff9a58] text-white font-semibold py-2 px-3 sm:px-4 rounded-lg transition-colors flex items-center gap-2 text-sm sm:text-base"
            >
              <span className="text-xl">+</span>
              <span className="hidden sm:inline">Add Position</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>

        {/* Account Badge - Show which account is active */}
        {activeAccount && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: activeAccount.color || '#ff8c42' }}
            />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {activeAccount.name}
            </span>
          </div>
        )}
      </div>

      {/* Metrics Cards */}
      <PortfolioMetrics
        portfolioValue={portfolioMetrics.portfolioValue}
        totalPnL={portfolioMetrics.totalPnL}
        todayPnL={portfolioMetrics.todayPnL}
        openPositionsCount={openPositions.length}
        closedPositionsCount={closedPositions.length}
      />

      {/* Positions Section */}
      <div className="px-5">
        <div className="mb-2 flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Positions</h2>
          {activeTab === 'open' && openPositions.length > 0 && openPositions[0]?.technicals?.updatedAt && (
            <span className="text-xs text-orange-600 dark:text-orange-400">
              Technical data updated: {(() => {
                try {
                  // Handle both Firestore Timestamp and ISO string
                  const updatedAtValue = openPositions[0].technicals.updatedAt;
                  const updatedAt = typeof updatedAtValue === 'string'
                    ? new Date(updatedAtValue)
                    : updatedAtValue.toDate?.() || new Date(updatedAtValue);

                  const now = new Date();
                  const diffHours = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60));

                  if (diffHours < 1) return 'just now';
                  else if (diffHours < 24) return `${diffHours}h ago`;
                  else return `${Math.floor(diffHours / 24)}d ago`;
                } catch (error) {
                  return 'recently';
                }
              })()}
            </span>
          )}
        </div>

        {/* Tabs, Filter, and View Mode */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-3">
          {/* Tab Navigation - Hidden on mobile */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="inline-flex items-center bg-gray-200 dark:bg-[#30363d] rounded-full p-0.5 transition-colors">
              <button
                onClick={() => setActiveTab('open')}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'open'
                    ? 'bg-[#ff8c42] text-white'
                    : 'text-gray-600 dark:text-[#8b949e] hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Open ({openPositions.length})
              </button>
              <button
                onClick={() => setActiveTab('alerts')}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'alerts'
                    ? 'bg-red-500 text-white'
                    : 'text-gray-600 dark:text-[#8b949e] hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                ⚠️ Alerts ({alertPositions.length})
              </button>
              <button
                onClick={() => setActiveTab('closed')}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'closed'
                    ? 'bg-[#ff8c42] text-white'
                    : 'text-gray-600 dark:text-[#8b949e] hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Closed ({closedPositions.length})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode(viewMode === 'summary' ? 'detailed' : 'summary')}
                className="relative inline-flex items-center bg-gray-200 dark:bg-[#30363d] rounded-full p-0.5 transition-colors"
              >
                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  viewMode === 'summary'
                    ? 'bg-[#ff8c42] text-white'
                    : 'text-gray-600 dark:text-[#8b949e]'
                }`}>
                  Summary
                </span>
                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  viewMode === 'detailed'
                    ? 'bg-[#ff8c42] text-white'
                    : 'text-gray-600 dark:text-[#8b949e]'
                }`}>
                  Detailed
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Holdings Cards */}
        <div className="pb-8">
          {renderPositions(displayedPositions)}
        </div>
      </div>

      {/* Modals */}
      {showTransactionModal && selectedPosition && (
        <AddTransactionModal
          isOpen={showTransactionModal}
          position={selectedPosition}
          onClose={() => {
            setShowTransactionModal(false);
            setSelectedPosition(null);
          }}
          onAddTransaction={addTransaction}
        />
      )}

      {showAddPositionModal && (
        <AddPositionModal
          isOpen={showAddPositionModal}
          onClose={() => setShowAddPositionModal(false)}
          onAddPosition={handleAddToPortfolio}
        />
      )}

      {showImportModal && (
        <ImportCsvModal
          isOpen={showImportModal}
          activeAccount={activeAccount}
          accounts={accounts}
          onClose={() => setShowImportModal(false)}
          onAddPosition={handleAddToPortfolio}
          db={db}
        />
      )}

      {showAnalysisModal && currentRecommendation && analysisPosition && (
        <InvestorAnalysisModal
          isOpen={true}
          onClose={() => {
            setShowAnalysisModal(false);
            setCurrentRecommendation(null);
            setAnalysisPosition(null);
          }}
          symbol={analysisPosition.symbol}
          recommendation={currentRecommendation}
          technicals={analysisPosition.technicals}
          fundamentals={analysisPosition.fundamentals}
        />
      )}

      {showEditPositionModal && selectedPosition && (
        <EditPositionModal
          isOpen={showEditPositionModal}
          position={selectedPosition}
          onClose={() => {
            setShowEditPositionModal(false);
            setSelectedPosition(null);
          }}
          onUpdatePosition={updatePosition}
        />
      )}
    </div>
  );
}
