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
import FinancialCard from '@/components/FinancialCard';
import AnalysisButton from '@/components/AnalysisButton';
import AddPositionModal from '@/components/portfolio/modals/AddPositionModal';
import RatingGuide from '@/components/RatingGuide';
import PiotroskiGuide from '@/components/PiotroskiGuide';

export default function IdeasHubPage() {
  const router = useRouter();
  const { ideas, loading, addToPortfolio, toggleLike } = useTrading();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'performance' | 'expired'>('all');
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
  // Show all ideas except cancelled (cooking/draft ideas are also included)
  let filteredIdeas = ideas.filter(idea => idea.status !== 'cancelled');

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

  // Calculate database status counts (before applying status filter)
  const statusCounts = {
    active: 0,
    TRIGGERED: 0,
    PROFIT_BOOKED: 0,
    STOP_LOSS: 0,
    performance: 0, // Aggregate of TRIGGERED + PROFIT_BOOKED + STOP_LOSS
    expired: 0
  };

  filteredIdeas.forEach(idea => {
    const status = idea.status || 'active';
    if (status === 'active') statusCounts.active++;
    else if (status === 'TRIGGERED') {
      statusCounts.TRIGGERED++;
      statusCounts.performance++;
    }
    else if (status === 'PROFIT_BOOKED') {
      statusCounts.PROFIT_BOOKED++;
      statusCounts.performance++;
    }
    else if (status === 'STOP_LOSS') {
      statusCounts.STOP_LOSS++;
      statusCounts.performance++;
    }
    else if (status === 'expired') statusCounts.expired++;
  });

  // Apply status filter
  if (statusFilter !== 'all') {
    filteredIdeas = filteredIdeas.filter(idea => {
      const status = idea.status || 'active';
      if (statusFilter === 'performance') {
        // Performance filter includes TRIGGERED, PROFIT_BOOKED, and STOP_LOSS
        return status === 'TRIGGERED' || status === 'PROFIT_BOOKED' || status === 'STOP_LOSS';
      }
      return status === statusFilter;
    });
  }

  const handleAnalyze = (e: React.MouseEvent, idea: any) => {
    e.stopPropagation();

    if (!idea.technicals || !idea.fundamentals) {
      alert('⚠️ Analysis data not available for this stock yet. Please check back later.');
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

    // Calculate performance (LTP vs Entry)
    const performance = idea.entryPrice && idea.technicals?.lastPrice
      ? (((idea.technicals.lastPrice - idea.entryPrice) / idea.entryPrice) * 100)
      : null;
    const performanceText = performance !== null ? `${performance >= 0 ? '+' : ''}${performance.toFixed(2)}%` : null;
    const performanceColor = performance !== null
      ? (performance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')
      : '';

    // Get database status badge
    const status = idea.status || 'active';
    const statusBadgeMap: Record<string, { text: string; color: string }> = {
      'cooking': { text: 'Draft', color: 'bg-gray-500/20 text-gray-600 dark:text-gray-400' },
      'active': { text: 'Active', color: 'bg-green-500/20 text-green-600 dark:text-green-400' },
      'TRIGGERED': { text: 'Triggered', color: 'bg-blue-500/20 text-blue-600 dark:text-blue-400' },
      'PROFIT_BOOKED': { text: 'Profit Booked', color: 'bg-green-500/20 text-green-600 dark:text-green-400' },
      'STOP_LOSS': { text: 'Stop Loss', color: 'bg-red-500/20 text-red-600 dark:text-red-400' },
      'expired': { text: 'Expired', color: 'bg-gray-500/20 text-gray-600 dark:text-gray-400' }
    };
    const statusBadge = statusBadgeMap[status] || statusBadgeMap['active'];

    // Show performance on cards when in performance view or when status is a performance status
    const showPerformance = statusFilter === 'performance' ||
      status === 'TRIGGERED' || status === 'PROFIT_BOOKED' || status === 'STOP_LOSS';

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
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{idea.symbol}</h3>
              {showPerformance && performanceText && (
                <span className={`text-sm font-bold ${performanceColor}`}>
                  {performanceText}
                </span>
              )}
            </div>
            {(idea.fundamentals?.industry || idea.fundamentals?.sector) && (
              <p className="text-sm text-gray-600 dark:text-[#8b949e] mt-0.5">
                {idea.fundamentals?.industry || idea.fundamentals?.sector}
              </p>
            )}
          </div>
          <span className={`px-2 py-1 ${statusBadge.color} text-xs font-semibold rounded`}>
            {statusBadge.text}
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
            <div className={`text-base font-bold ${
              idea.technicals?.lastPrice
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-[#8b949e]'
            }`}>
              {idea.technicals?.lastPrice ? `₹${Math.round(idea.technicals.lastPrice).toLocaleString('en-IN')}` : 'N/A'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-[#8b949e] mb-1">Entry</div>
            <div className="text-base font-bold text-gray-900 dark:text-white">
              {typeof idea.entryPrice === 'number' ? `₹${Math.round(idea.entryPrice).toLocaleString('en-IN')}` : idea.entryPrice}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-[#8b949e] mb-1">Target</div>
            <div className="text-base font-bold text-gray-900 dark:text-white">
              ₹{Math.round(idea.target1).toLocaleString('en-IN')} {target1Percent && <span className="text-xs text-gray-600 dark:text-[#8b949e]">+{target1Percent}%</span>}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-[#8b949e] mb-1">Stop Loss</div>
            <div className="text-base font-bold text-gray-900 dark:text-white">₹{Math.round(idea.stopLoss).toLocaleString('en-IN')}</div>
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

        {/* Technical Levels, Fundamentals & Financial */}
        {(idea.technicals || idea.fundamentals) && (
          <div className="mb-3 p-3 bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg">
            {idea.technicals && (
              <TechnicalLevelsCard technicals={idea.technicals} className="mb-3" />
            )}
            {idea.fundamentals && (
              <FundamentalsCard
                fundamentals={idea.fundamentals}
                showBorder={!!idea.technicals}
                className="mb-3"
              />
            )}
            {idea.fundamentals && (idea.fundamentals.debtToEquity !== undefined || idea.fundamentals.piotroskiScore !== undefined) && (
              <FinancialCard
                financial={{
                  debtToEquity: idea.fundamentals.debtToEquity,
                  piotroskiScore: idea.fundamentals.piotroskiScore
                }}
                showBorder={!!(idea.technicals || idea.fundamentals)}
              />
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-gray-200 dark:border-[#30363d]">
          {/* Action Buttons */}
          <div className="grid grid-cols-4 gap-2 mb-3">
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

            {/* Share Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                const shareUrl = `${window.location.origin}/share/${idea.id}`;
                navigator.clipboard.writeText(shareUrl);
                alert('Share link copied! Anyone can view this idea without logging in.');
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-[#30363d] hover:bg-gray-200 dark:hover:bg-[#3c444d] border border-gray-200 dark:border-[#444c56] text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="4" cy="8" r="2"/>
                <circle cx="12" cy="4" r="2"/>
                <circle cx="12" cy="12" r="2"/>
                <path d="M5.5 7L10.5 5M5.5 9L10.5 11"/>
              </svg>
              <span>Share</span>
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
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  await toggleLike(idea.id);
                }}
                className={`flex items-center gap-1 hover:text-red-500 transition-colors ${
                  idea.likedBy?.includes(user?.uid || '') ? 'text-red-500' : ''
                }`}
                title="Like this idea"
              >
                <HeartFilledIcon size={14} />
                {idea.likes}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/ideas/${idea.id}#comments`);
                }}
                className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white transition-colors"
                title="View and add comments"
              >
                💬 {idea.commentCount}
              </button>
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
              {statusCounts.active + statusCounts.performance + statusCounts.expired}
            </span>
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'active'
                ? 'bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30'
                : 'bg-gray-50 dark:bg-[#1c2128] text-gray-600 dark:text-[#8b949e] hover:bg-green-500/10'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <circle cx="10" cy="10" r="8" opacity="0.3"/>
              <circle cx="10" cy="10" r="4"/>
            </svg>
            <span>Active</span>
            <span className="px-1.5 py-0.5 bg-green-500/20 text-green-600 dark:text-green-400 rounded-full text-[10px]">
              {statusCounts.active}
            </span>
          </button>
          <button
            onClick={() => setStatusFilter('performance')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'performance'
                ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30'
                : 'bg-gray-50 dark:bg-[#1c2128] text-gray-600 dark:text-[#8b949e] hover:bg-orange-500/10'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
            </svg>
            <span>Idea Performance</span>
            <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-full text-[10px]">
              {statusCounts.performance}
            </span>
          </button>
          <button
            onClick={() => setStatusFilter('expired')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'expired'
                ? 'bg-gray-500/20 text-gray-600 dark:text-gray-400 border border-gray-500/30'
                : 'bg-gray-50 dark:bg-[#1c2128] text-gray-600 dark:text-[#8b949e] hover:bg-gray-500/10'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
            </svg>
            <span>Expired</span>
            <span className="px-1.5 py-0.5 bg-gray-500/20 text-gray-600 dark:text-gray-400 rounded-full text-[10px]">
              {statusCounts.expired}
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
                    try {
                      const updatedAtValue = filteredIdeas[0].technicals.updatedAt;
                      let updatedAt: Date;

                      // Handle Firestore Timestamp (with seconds and nanoseconds)
                      if (updatedAtValue && typeof updatedAtValue === 'object' && 'seconds' in updatedAtValue) {
                        updatedAt = new Date(updatedAtValue.seconds * 1000);
                      }
                      // Handle Firestore Timestamp with toDate method
                      else if (updatedAtValue && typeof updatedAtValue === 'object' && typeof updatedAtValue.toDate === 'function') {
                        updatedAt = updatedAtValue.toDate();
                      }
                      // Handle ISO string or other date formats
                      else if (typeof updatedAtValue === 'string') {
                        updatedAt = new Date(updatedAtValue);
                      }
                      // Handle Date object
                      else if (updatedAtValue instanceof Date) {
                        updatedAt = updatedAtValue;
                      }
                      // Handle timestamp number
                      else if (typeof updatedAtValue === 'number') {
                        updatedAt = new Date(updatedAtValue);
                      }
                      else {
                        console.warn('Unknown date format:', updatedAtValue);
                        return 'recently';
                      }

                      // Check if date is valid
                      if (isNaN(updatedAt.getTime())) {
                        console.warn('Invalid date:', updatedAt);
                        return 'recently';
                      }

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
                    } catch (error) {
                      console.error('Error parsing date:', error);
                      return 'recently';
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
