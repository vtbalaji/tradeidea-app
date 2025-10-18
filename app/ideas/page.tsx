'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../../components/Navigation';
import { useTrading } from '../../contexts/TradingContext';
import { useAuth } from '../../contexts/AuthContext';
import { IdeaIcon, TargetIcon, EntryIcon, HeartIcon, HeartFilledIcon, EditIcon } from '@/components/icons';
import { formatIndianDate, getCurrentISTDate, formatDateForDisplay, formatDateForStorage } from '@/lib/dateUtils';
import { createInvestmentEngine } from '@/lib/investment-rules';
import { trackPositionAdded } from '@/lib/analytics';
import InvestorAnalysisModal from '@/components/InvestorAnalysisModal';
import TechnicalLevelsCard from '@/components/TechnicalLevelsCard';
import FundamentalsCard from '@/components/FundamentalsCard';
import AnalysisButton from '@/components/AnalysisButton';
import AddPositionModal from '@/components/portfolio/modals/AddPositionModal';
import RatingGuide from '@/components/RatingGuide';
import PiotroskiGuide from '@/components/PiotroskiGuide';

// Calculate badge status for an idea
const calculateBadgeStatus = (idea: any) => {
  // Check if we have required data
  if (!idea.technicals || !idea.fundamentals || !idea.entryPrice) {
    return { text: 'Waiting', color: 'bg-gray-500/20 text-gray-500 dark:text-gray-400', type: 'waiting' as const };
  }

  const lastPrice = idea.technicals.lastPrice;
  if (!lastPrice) {
    return { text: 'Waiting', color: 'bg-gray-500/20 text-gray-500 dark:text-gray-400', type: 'waiting' as const };
  }

  // Check if entry price is higher than LTP (price is below entry) AND fundamentals are EXCELLENT
  if (lastPrice < idea.entryPrice && idea.fundamentals.fundamentalRating === 'EXCELLENT') {
    return { text: 'You can Enter', color: 'bg-orange-500/20 text-orange-500 dark:text-orange-400', type: 'canEnter' as const };
  }

  // Check technical condition: overallSignal is BUY or STRONG_BUY
  const technicalReady =
    idea.technicals.overallSignal === 'BUY' ||
    idea.technicals.overallSignal === 'STRONG_BUY';

  // Check fundamental condition: AVERAGE or better
  const fundamentalReady =
    idea.fundamentals.fundamentalRating === 'AVERAGE' ||
    idea.fundamentals.fundamentalRating === 'GOOD' ||
    idea.fundamentals.fundamentalRating === 'EXCELLENT';

  // Check price condition: within 2% of entry price
  const priceReady = Math.abs((lastPrice - idea.entryPrice) / idea.entryPrice) <= 0.02;

  // All conditions must be met for "Ready to Enter"
  if (technicalReady && priceReady && fundamentalReady) {
    return { text: 'Ready to Enter', color: 'bg-green-500/20 text-green-500 dark:text-green-400', type: 'ready' as const };
  }

  return { text: 'Waiting', color: 'bg-gray-500/20 text-gray-500 dark:text-gray-400', type: 'waiting' as const };
};

export default function IdeasHubPage() {
  const router = useRouter();
  const { ideas, loading, addToPortfolio } = useTrading();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'canEnter' | 'waiting'>('all');
  const [showAnalysisModal, setShowAnalysisModal] = useState<string | null>(null);
  const [currentRecommendation, setCurrentRecommendation] = useState<any>(null);
  const [showAddPositionModal, setShowAddPositionModal] = useState(false);
  const [selectedIdeaForPosition, setSelectedIdeaForPosition] = useState<any>(null);

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

  // Filter ideas based on search and tab
  // Only show active ideas (filter out cancelled)
  let filteredIdeas = ideas.filter(idea => idea.status === 'active');

  if (searchQuery) {
    filteredIdeas = filteredIdeas.filter(idea =>
      idea.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.analysis.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Apply tab filters
  if (activeTab === 'following') {
    filteredIdeas = filteredIdeas.filter(idea => idea.followers?.includes(user?.uid || ''));
  } else if (activeTab === 'trending') {
    // Sort by likes (most liked first)
    filteredIdeas = [...filteredIdeas].sort((a, b) => (b.likes || 0) - (a.likes || 0));
  } else if (activeTab === 'recent') {
    // Filter ideas from last 7 days and sort by creation date (newest first)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    filteredIdeas = filteredIdeas
      .filter(idea => {
        const ideaDate = idea.createdAt?.toDate ? idea.createdAt.toDate() : null;
        return ideaDate && ideaDate >= sevenDaysAgo;
      })
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return dateB - dateA;
      });
  }

  // Calculate status counts (before applying status filter)
  const statusCounts = {
    ready: 0,
    canEnter: 0,
    waiting: 0
  };

  filteredIdeas.forEach(idea => {
    const badgeStatus = calculateBadgeStatus(idea);
    if (badgeStatus.type === 'ready') statusCounts.ready++;
    else if (badgeStatus.type === 'canEnter') statusCounts.canEnter++;
    else if (badgeStatus.type === 'waiting') statusCounts.waiting++;
  });

  // Apply status filter
  if (statusFilter !== 'all') {
    filteredIdeas = filteredIdeas.filter(idea => {
      const badgeStatus = calculateBadgeStatus(idea);
      return badgeStatus.type === statusFilter;
    });
  }

  const handleAnalyze = (e: React.MouseEvent, idea: any) => {
    e.stopPropagation();

    if (!idea.technicals || !idea.fundamentals) {
      alert('⚠️ Technical or fundamental data not available. Run batch analysis first.');
      return;
    }

    const engine = createInvestmentEngine(idea.technicals, idea.fundamentals);
    const rec = engine.getRecommendation();
    setCurrentRecommendation(rec);
    setShowAnalysisModal(idea.id);
  };

  const handleConvertToPosition = (e: React.MouseEvent, idea: any) => {
    e.stopPropagation();
    setSelectedIdeaForPosition(idea);
    setShowAddPositionModal(true);
  };

  const handleAddPositionFromIdea = async (ideaId: string, positionData: any) => {
    try {
      await addToPortfolio(selectedIdeaForPosition?.id || '', positionData);
      trackPositionAdded(selectedIdeaForPosition?.symbol || 'Unknown', 'idea');

      setShowAddPositionModal(false);
      setSelectedIdeaForPosition(null);
      alert('Position added to your portfolio!');
      router.push('/portfolio');
    } catch (error: any) {
      alert(error.message || 'Failed to add position');
    }
  };

  const renderIdeaCard = (idea: any) => {
    const target1Percent = idea.entryPrice
      ? (((idea.target1 - idea.entryPrice) / idea.entryPrice) * 100).toFixed(1)
      : null;

    const badgeStatus = calculateBadgeStatus(idea);

    return (
      <div
        key={idea.id}
        className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-4 hover:border-[#ff8c42] transition-colors cursor-pointer"
        onClick={(e) => {
          // Only trigger if not clicking on buttons
          if (!(e.target as HTMLElement).closest('button')) {
            handleAnalyze(e, idea);
          }
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{idea.symbol}</h3>
            {(idea.fundamentals?.industry || idea.fundamentals?.sector) && (
              <p className="text-sm text-gray-600 dark:text-[#8b949e] mt-0.5">
                {idea.fundamentals?.industry || idea.fundamentals?.sector}
              </p>
            )}
          </div>
          <span className={`px-2 py-1 ${badgeStatus.color} text-xs font-semibold rounded`}>
            {badgeStatus.text}
          </span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-3 mb-3">
          <span className="text-sm text-gray-600 dark:text-[#8b949e]">
            #{idea.riskLevel} risk
          </span>
          <span className="text-sm text-gray-600 dark:text-[#8b949e]">
            #{idea.timeframe}
          </span>
          <span className="text-sm text-gray-600 dark:text-[#8b949e]">
            #{idea.analysisType} analysis
          </span>
        </div>

        {/* Trade Details */}
        <div className="grid grid-cols-4 gap-3 mb-3">
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-[#8b949e] mb-1">LTP</div>
            <div className={`text-sm font-semibold ${
              idea.technicals?.lastPrice
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-[#8b949e]'
            }`}>
              {idea.technicals?.lastPrice ? `₹${Math.round(idea.technicals.lastPrice).toLocaleString('en-IN')}` : 'N/A'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-[#8b949e] mb-1">Entry</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {typeof idea.entryPrice === 'number' ? `₹${Math.round(idea.entryPrice).toLocaleString('en-IN')}` : idea.entryPrice}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-[#8b949e] mb-1">Target</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              ₹{Math.round(idea.target1).toLocaleString('en-IN')} {target1Percent && <span className="text-xs text-gray-600 dark:text-[#8b949e]">+{target1Percent}%</span>}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-[#8b949e] mb-1">Stop Loss</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">₹{Math.round(idea.stopLoss).toLocaleString('en-IN')}</div>
          </div>
        </div>

        {/* Warning if no technical data available */}
        {!idea.technicals && (
          <div className="mb-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-xs text-yellow-600 dark:text-yellow-400">
              ⚠️ Technical data not available. Waiting for next analysis cycle.
            </p>
          </div>
        )}

        {/* Technical Levels & Fundamentals */}
        {(idea.technicals || idea.fundamentals) && (
          <div className="mb-3 p-3 bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg">
            {idea.technicals && (
              <TechnicalLevelsCard technicals={idea.technicals} className="mb-3" />
            )}
            {idea.fundamentals && (
              <FundamentalsCard
                fundamentals={idea.fundamentals}
                showBorder={!!idea.technicals}
              />
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-gray-200 dark:border-[#30363d]">
          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {/* Analyze Button */}
            <AnalysisButton
              onClick={(e) => handleAnalyze(e, idea)}
              disabled={!idea.technicals || !idea.fundamentals}
            />

            {/* Convert to Position Button */}
            <button
              onClick={(e) => handleConvertToPosition(e, idea)}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-[#30363d] hover:bg-gray-200 dark:hover:bg-[#3c444d] border border-gray-200 dark:border-[#444c56] text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 8h12M8 2v12" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>To Portfolio</span>
            </button>

            {/* Edit Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/ideas/${idea.id}`);
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-[#30363d] hover:bg-gray-200 dark:hover:bg-[#3c444d] border border-gray-200 dark:border-[#444c56] text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg transition-colors"
            >
              <EditIcon size={14} className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          </div>

          {/* Stats and Creator Info */}
          <div className="flex justify-between items-center">
            <div className="flex gap-3 text-sm text-gray-600 dark:text-[#8b949e]">
              <span className="flex items-center gap-1">
                <HeartFilledIcon size={14} />
                {idea.likes}
              </span>
              <span>💬 {idea.commentCount}</span>
              {/* <span>📅 {formatIndianDate(idea.createdAt, 'relative')}</span> */}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-[#8b949e]">
              <div className="w-4 h-4 rounded-full bg-[#ff8c42] flex items-center justify-center text-white text-[10px] font-bold">
                {idea.userName?.charAt(0).toUpperCase() || '?'}
              </div>
              <span>Posted by <span className="font-medium">{idea.userName || 'Anonymous'}</span><span className="font-medium">  {formatIndianDate(idea.createdAt, 'relative')}</span></span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1419]">
      <Navigation />

      {/* Header */}
      <div className="p-5 pt-5 pb-3">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Investment Ideas Hub</h1>
        <p className="text-sm text-gray-600 dark:text-[#8b949e]">Discover and share Investment opportunities</p>
      </div>

      {/* Search Bar with Create Button */}
      <div className="px-5 mb-3">
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => router.push('/ideas/new')}
            className="w-full px-4 py-3 bg-gradient-to-r from-[#ff8c42] to-[#ff6b35] hover:from-[#ff7a2e] hover:to-[#ff5a24] text-white font-semibold rounded-lg transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 flex items-center justify-center gap-2"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Share Your Next Big Win</span>
          </button>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search by symbol, title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
          />
          <button className="px-3 py-2 bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg text-gray-600 dark:text-[#8b949e] text-sm font-semibold hover:bg-[#30363d] transition-colors">
            🔍
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-[#ff8c42] text-gray-900 dark:text-white'
                : 'bg-gray-50 dark:bg-[#1c2128] text-gray-600 dark:text-[#8b949e] hover:bg-[#30363d]'
            }`}
          >
            All Ideas
          </button>
          <button
            onClick={() => setActiveTab('trending')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'trending'
                ? 'bg-[#ff8c42] text-gray-900 dark:text-white'
                : 'bg-gray-50 dark:bg-[#1c2128] text-gray-600 dark:text-[#8b949e] hover:bg-[#30363d]'
            }`}
          >
            🔥 Trending
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'recent'
                ? 'bg-[#ff8c42] text-gray-900 dark:text-white'
                : 'bg-gray-50 dark:bg-[#1c2128] text-gray-600 dark:text-[#8b949e] hover:bg-[#30363d]'
            }`}
          >
            ⏰ Recent
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'following'
                ? 'bg-[#ff8c42] text-gray-900 dark:text-white'
                : 'bg-gray-50 dark:bg-[#1c2128] text-gray-600 dark:text-[#8b949e] hover:bg-[#30363d]'
            }`}
          >
            <HeartFilledIcon size={12} />
            Following
          </button>
        </div>
      </div>

      {/* Status Filter */}
      <div className="px-5 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-gray-600 dark:text-[#8b949e]">Filter by Status:</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'all'
                ? 'bg-[#ff8c42] text-gray-900 dark:text-white'
                : 'bg-gray-50 dark:bg-[#1c2128] text-gray-600 dark:text-[#8b949e] hover:bg-[#30363d]'
            }`}
          >
            <span>All Status</span>
            <span className="px-1.5 py-0.5 bg-gray-500/20 rounded-full text-[10px]">
              {statusCounts.ready + statusCounts.canEnter + statusCounts.waiting}
            </span>
          </button>
          <button
            onClick={() => setStatusFilter('ready')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'ready'
                ? 'bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30'
                : 'bg-gray-50 dark:bg-[#1c2128] text-gray-600 dark:text-[#8b949e] hover:bg-green-500/10'
            }`}
          >
            <span>✓ Ready to Enter</span>
            <span className="px-1.5 py-0.5 bg-green-500/20 text-green-600 dark:text-green-400 rounded-full text-[10px]">
              {statusCounts.ready}
            </span>
          </button>
          <button
            onClick={() => setStatusFilter('canEnter')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'canEnter'
                ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30'
                : 'bg-gray-50 dark:bg-[#1c2128] text-gray-600 dark:text-[#8b949e] hover:bg-orange-500/10'
            }`}
          >
            <span>⚡ You can Enter</span>
            <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-full text-[10px]">
              {statusCounts.canEnter}
            </span>
          </button>
          <button
            onClick={() => setStatusFilter('waiting')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'waiting'
                ? 'bg-gray-500/20 text-gray-600 dark:text-gray-400 border border-gray-500/30'
                : 'bg-gray-50 dark:bg-[#1c2128] text-gray-600 dark:text-[#8b949e] hover:bg-gray-500/10'
            }`}
          >
            <span>⏳ Waiting</span>
            <span className="px-1.5 py-0.5 bg-gray-500/20 text-gray-600 dark:text-gray-400 rounded-full text-[10px]">
              {statusCounts.waiting}
            </span>
          </button>
        </div>
      </div>

      {/* Ideas Section */}
      <div className="px-5 pb-8">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block w-12 h-12 border-4 border-[#ff8c42] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 dark:text-[#8b949e] text-lg">Loading ideas...</p>
          </div>
        ) : filteredIdeas.length > 0 ? (
          <div>
            {/* Show technical data update time if available */}
            {filteredIdeas[0]?.technicals?.updatedAt && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-orange-600 dark:text-orange-400">
                  Technical data updated: {(() => {
                    const updatedAt = filteredIdeas[0].technicals.updatedAt.toDate();
                    const now = new Date();
                    const diffHours = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60));

                    if (diffHours < 1) {
                      return 'just now';
                    } else if (diffHours < 24) {
                      return `${diffHours}h ago`;
                    } else {
                      const diffDays = Math.floor(diffHours / 24);
                      return `${diffDays}d ago`;
                    }
                  })()}
                </span>
              </div>
            )}
            {/* All Ideas in Flat Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredIdeas.map((idea) => renderIdeaCard(idea))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">💡</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No ideas found</h3>
            <p className="text-gray-600 dark:text-[#8b949e]">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Investor Analysis Modal */}
      {showAnalysisModal && currentRecommendation && (
        <InvestorAnalysisModal
          isOpen={true}
          onClose={() => {
            setShowAnalysisModal(null);
            setCurrentRecommendation(null);
          }}
          symbol={ideas.find(i => i.id === showAnalysisModal)?.symbol || ''}
          recommendation={currentRecommendation}
          technicals={ideas.find(i => i.id === showAnalysisModal)?.technicals}
          fundamentals={ideas.find(i => i.id === showAnalysisModal)?.fundamentals}
        />
      )}

      {/* Add Position Modal */}
      <AddPositionModal
        isOpen={showAddPositionModal}
        onClose={() => {
          setShowAddPositionModal(false);
          setSelectedIdeaForPosition(null);
        }}
        onAddPosition={handleAddPositionFromIdea}
        initialData={selectedIdeaForPosition ? {
          symbol: selectedIdeaForPosition.symbol,
          stopLoss: selectedIdeaForPosition.stopLoss,
          target1: selectedIdeaForPosition.target1,
          entryPrice: selectedIdeaForPosition.entryPrice,
          tradeType: selectedIdeaForPosition.tradeType || 'Long'
        } : undefined}
      />

      {/* Rating Guide Section - Bottom of page */}
      <div className="px-5 pb-4">
        <RatingGuide />
      </div>

      {/* Piotroski Guide Section */}
      <div className="px-5 pb-8">
        <PiotroskiGuide />
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => router.push('/ideas/new')}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-[#ff8c42] to-[#ff6b35] hover:from-[#ff7a2e] hover:to-[#ff5a24] text-white font-bold rounded-full shadow-2xl shadow-orange-500/50 hover:shadow-orange-500/60 transition-all hover:scale-110 flex items-center justify-center z-50 group"
        title="Share Your Next Big Win"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="absolute -top-12 right-0 bg-gray-900 dark:bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Share Your Idea
        </span>
      </button>
    </div>
  );
}
