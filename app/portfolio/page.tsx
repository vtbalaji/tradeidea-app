'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../../components/Navigation';
import { useTrading } from '../../contexts/TradingContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAccounts } from '../../contexts/AccountsContext';
import { getCurrentISTDate, formatDateForDisplay, formatDateForStorage } from '@/lib/dateUtils';
import { db } from '@/lib/firebase';
import { getSymbolData } from '@/lib/symbolDataService';
import InvestorAnalysisModal from '@/components/InvestorAnalysisModal';
import { createInvestmentEngine } from '@/lib/investment-rules';
import {
  PortfolioMetrics,
  SummaryPositionCard,
  DetailedPositionCard,
  EmptyPositionState,
  ExitTradeModal,
  AddTransactionModal,
  AddPositionModal,
  ImportCsvModal,
} from '@/components/portfolio';

export default function PortfolioPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { myPortfolio, exitTrade, addTransaction, addToPortfolio } = useTrading();
  const { accounts, activeAccount, setActiveAccount } = useAccounts();

  // UI State
  const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open');
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('detailed');
  const [expandedPositionId, setExpandedPositionId] = useState<string | null>(null);

  // Modal State
  const [showExitModal, setShowExitModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showAddPositionModal, setShowAddPositionModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  // Data State
  const [enrichedPositions, setEnrichedPositions] = useState<any[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<any>(null);
  const [currentRecommendation, setCurrentRecommendation] = useState<any>(null);
  const [analysisPosition, setAnalysisPosition] = useState<any>(null);

  // Exit Details
  const [exitDetails, setExitDetails] = useState({
    exitPrice: '',
    exitDate: formatDateForDisplay(getCurrentISTDate()),
    exitReason: ''
  });

  // Check email verification
  useEffect(() => {
    if (user && !user.emailVerified) {
      router.push('/verify');
    }
  }, [user, router]);

  // Fetch symbol data and enrich positions
  useEffect(() => {
    const enrichPositions = async () => {
      if (myPortfolio.length === 0) {
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

  // Memoized portfolio metrics
  const portfolioMetrics = useMemo(() => {
    const portfolioValue = openPositions.reduce((sum, p) => sum + (p.currentPrice * p.quantity), 0);
    const totalPnL = openPositions.reduce((sum, p) => {
      const pnl = (p.currentPrice - p.entryPrice) * p.quantity;
      return sum + pnl;
    }, 0);

    return { portfolioValue, totalPnL };
  }, [openPositions]);

  // Handler functions with useCallback for optimization
  const handleExitTrade = useCallback(async () => {
    if (!selectedPosition || !exitDetails.exitPrice) return;

    try {
      await exitTrade(
        selectedPosition.id,
        parseFloat(exitDetails.exitPrice),
        formatDateForStorage(exitDetails.exitDate),
        exitDetails.exitReason
      );

      setShowExitModal(false);
      setSelectedPosition(null);
      setExitDetails({
        exitPrice: '',
        exitDate: formatDateForDisplay(getCurrentISTDate()),
        exitReason: ''
      });
    } catch (error) {
      console.error('Error exiting trade:', error);
      alert('Failed to exit trade');
    }
  }, [selectedPosition, exitDetails, exitTrade]);

  const handleOpenAnalysis = useCallback((position: any) => {
    if (!position.technicals || !position.fundamentals) {
      alert('Technical or fundamental data not available for this symbol yet. Please wait for the next analysis cycle.');
      return;
    }

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

  const handleExit = useCallback((position: any) => {
    setSelectedPosition(position);
    setExitDetails({
      exitPrice: position.currentPrice.toString(),
      exitDate: formatDateForDisplay(getCurrentISTDate()),
      exitReason: ''
    });
    setShowExitModal(true);
  }, []);

  const handleToggleExpand = useCallback((positionId: string) => {
    setExpandedPositionId(prev => prev === positionId ? null : positionId);
  }, []);

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
              onExit={handleExit}
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
            onExit={handleExit}
          />
        ))}
      </div>
    );
  }, [viewMode, expandedPositionId, openPositions.length, closedPositions.length, activeTab, handleToggleExpand, handleOpenAnalysis, handleBuySell, handleExit]);

  const displayedPositions = activeTab === 'open' ? openPositions : closedPositions;

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
        <p className="text-gray-600 dark:text-[#8b949e]">Track your portfolio performance</p>

        {/* Account Selector */}
        {accounts.length > 1 && activeAccount && (
          <div className="flex items-center gap-3 mt-4">
            <label className="text-sm font-semibold text-gray-600 dark:text-[#8b949e]">Account:</label>
            <select
              value={activeAccount.id}
              onChange={(e) => {
                const account = accounts.find(a => a.id === e.target.value);
                if (account) setActiveAccount(account);
              }}
              className="bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-gray-900 dark:text-white font-semibold"
              style={{ borderLeftColor: activeAccount.color, borderLeftWidth: '4px' }}
            >
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name} {account.isDefault ? '(Default)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Metrics Cards */}
      <PortfolioMetrics
        portfolioValue={portfolioMetrics.portfolioValue}
        totalPnL={portfolioMetrics.totalPnL}
        openPositionsCount={openPositions.length}
        closedPositionsCount={closedPositions.length}
      />

      {/* Positions Section */}
      <div className="px-5">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Positions</h2>
          {activeTab === 'open' && openPositions.length > 0 && openPositions[0]?.technicals?.updatedAt && (
            <span className="text-xs text-orange-600 dark:text-orange-400">
              Technical data updated: {(() => {
                const updatedAt = openPositions[0].technicals.updatedAt.toDate();
                const now = new Date();
                const diffHours = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60));

                if (diffHours < 1) return 'just now';
                else if (diffHours < 24) return `${diffHours}h ago`;
                else return `${Math.floor(diffHours / 24)}d ago`;
              })()}
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between mb-5 gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('open')}
              className={`px-3 sm:px-5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'open'
                  ? 'bg-[#ff8c42] text-gray-900 dark:text-white'
                  : 'bg-gray-50 dark:bg-[#1c2128] text-gray-600 dark:text-[#8b949e]'
              } whitespace-nowrap`}
            >
              Open ({openPositions.length})
            </button>
            <button
              onClick={() => setActiveTab('closed')}
              className={`px-3 sm:px-5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'closed'
                  ? 'bg-[#ff8c42] text-gray-900 dark:text-white'
                  : 'bg-gray-50 dark:bg-[#1c2128] text-gray-600 dark:text-[#8b949e]'
              } whitespace-nowrap`}
            >
              Closed ({closedPositions.length})
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-1.5 sm:gap-2">
            <button
              onClick={() => setViewMode('summary')}
              className={`px-2.5 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'summary'
                  ? 'bg-[#ff8c42] text-gray-900 dark:text-white'
                  : 'bg-gray-50 dark:bg-[#1c2128] text-gray-600 dark:text-[#8b949e] hover:bg-gray-100 dark:hover:bg-[#30363d]'
              } whitespace-nowrap`}
            >
              Summary
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-2.5 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'detailed'
                  ? 'bg-[#ff8c42] text-gray-900 dark:text-white'
                  : 'bg-gray-50 dark:bg-[#1c2128] text-gray-600 dark:text-[#8b949e] hover:bg-gray-100 dark:hover:bg-[#30363d]'
              } whitespace-nowrap`}
            >
              Detailed
            </button>
          </div>
        </div>

        {/* Holdings Cards */}
        <div className="pb-8">
          {renderPositions(displayedPositions)}
        </div>
      </div>

      {/* Modals */}
      {showExitModal && selectedPosition && (
        <ExitTradeModal
          isOpen={showExitModal}
          selectedPosition={selectedPosition}
          exitDetails={exitDetails}
          onClose={() => {
            setShowExitModal(false);
            setSelectedPosition(null);
          }}
          onExitDetailsChange={setExitDetails}
          onSubmit={handleExitTrade}
        />
      )}

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
          onAddPosition={addToPortfolio}
        />
      )}

      {showImportModal && (
        <ImportCsvModal
          isOpen={showImportModal}
          activeAccount={activeAccount}
          accounts={accounts}
          onClose={() => setShowImportModal(false)}
          onAddPosition={addToPortfolio}
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
    </div>
  );
}
