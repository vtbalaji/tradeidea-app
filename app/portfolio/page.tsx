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
import { getOverallRecommendation } from '@/lib/exitCriteriaAnalysis';
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
  const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open');
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('detailed');
  const [expandedPositionId, setExpandedPositionId] = useState<string | null>(null);
  const [recommendationFilter, setRecommendationFilter] = useState<string>('all');

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
    await apiClient.portfolio.create({ ideaId, ...position });
    await fetchPortfolio(); // Refresh
  }, [fetchPortfolio]);

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

  // Memoized open and closed positions
  const openPositions = useMemo(() =>
    accountPositions.filter(p => p.status === 'open'),
    [accountPositions]
  );

  const closedPositions = useMemo(() =>
    accountPositions.filter(p => p.status === 'closed'),
    [accountPositions]
  );

  // Filter positions by recommendation
  const filteredOpenPositions = useMemo(() => {
    if (recommendationFilter === 'all') return openPositions;

    return openPositions.filter(position => {
      if (!position.technicals) return false;
      const { recommendation } = getOverallRecommendation(position);
      return recommendation === recommendationFilter;
    });
  }, [openPositions, recommendationFilter]);

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
      alert('Technical or fundamental data not available for this symbol yet. Please wait for the next analysis cycle.');
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
  }, [viewMode, expandedPositionId, openPositions.length, closedPositions.length, activeTab, handleToggleExpand, handleOpenAnalysis, handleBuySell, handleEdit]);

  const displayedPositions = activeTab === 'open' ? filteredOpenPositions : closedPositions;

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
          {/* Open/Closed Toggle - Hidden on mobile */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => setActiveTab(activeTab === 'open' ? 'closed' : 'open')}
              className="relative inline-flex items-center bg-gray-200 dark:bg-[#30363d] rounded-full p-0.5 transition-colors"
            >
              <span className={`px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'open'
                  ? 'bg-[#ff8c42] text-white'
                  : 'text-gray-600 dark:text-[#8b949e]'
              }`}>
                Open ({openPositions.length})
              </span>
              <span className={`px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'closed'
                  ? 'bg-[#ff8c42] text-white'
                  : 'text-gray-600 dark:text-[#8b949e]'
              }`}>
                Closed ({closedPositions.length})
              </span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Recommendation Filter - Only show for Open tab */}
            {activeTab === 'open' && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-gray-600 dark:text-[#8b949e] whitespace-nowrap">
                  Filter by recommendation:
                </label>
                <select
                  value={recommendationFilter}
                  onChange={(e) => setRecommendationFilter(e.target.value)}
                  className="bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white hover:border-[#ff8c42] transition-colors"
                >
                  <option value="all">All ({openPositions.length})</option>
                  <option value="STRONG BUY">▲▲ Strong Buy</option>
                  <option value="BUY">▲ Buy</option>
                  <option value="HOLD">■ Hold</option>
                  <option value="SELL">▼ Sell</option>
                  <option value="STRONG SELL">▼▼ Strong Sell</option>
                </select>
              </div>
            )}

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

        {/* Filter Results Info */}
        {activeTab === 'open' && recommendationFilter !== 'all' && (
          <div className="mb-4 px-3 py-2 bg-[#ff8c42]/10 border border-[#ff8c42]/30 rounded-lg">
            <p className="text-xs font-semibold text-[#ff8c42]">
              Showing {filteredOpenPositions.length} position{filteredOpenPositions.length !== 1 ? 's' : ''} with "{recommendationFilter}" recommendation
              {filteredOpenPositions.length > 0 && (
                <button
                  onClick={() => setRecommendationFilter('all')}
                  className="ml-2 underline hover:no-underline"
                >
                  Clear filter
                </button>
              )}
            </p>
          </div>
        )}

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
