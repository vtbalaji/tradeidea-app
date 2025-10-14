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

export default function IdeasHubPage() {
  const router = useRouter();
  const { ideas, loading, addToPortfolio } = useTrading();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showAnalysisModal, setShowAnalysisModal] = useState<string | null>(null);
  const [currentRecommendation, setCurrentRecommendation] = useState<any>(null);
  const [showTradeModal, setShowTradeModal] = useState<string | null>(null);
  const [tradeDetails, setTradeDetails] = useState({
    quantity: '',
    entryPrice: '',
    dateTaken: '',
  });
  const [exitCriteria, setExitCriteria] = useState({
    exitAtStopLoss: true,
    exitAtTarget: true,
    exitBelow50EMA: false,
    exitBelow100MA: false,
    exitBelow200MA: false,
    exitOnWeeklySupertrend: false,
    customNote: '',
  });

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
  // First filter out closed ideas
  let filteredIdeas = ideas.filter(idea => idea.status !== 'closed');

  if (searchQuery) {
    filteredIdeas = filteredIdeas.filter(idea =>
      idea.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.analysis.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Apply tab filters
  if (activeTab === 'active') {
    // Show only active ideas
    filteredIdeas = filteredIdeas.filter(idea => idea.status === 'active');
  } else if (activeTab === 'following') {
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

  // Group ideas by status
  const cookingIdeas = filteredIdeas.filter(idea => idea.status === 'cooking' || idea.status === 'in progress');
  const activeIdeas = filteredIdeas.filter(idea => idea.status === 'active');
  const hitTargetIdeas = filteredIdeas.filter(idea => idea.status === 'hit target');
  const hitSLIdeas = filteredIdeas.filter(idea => idea.status === 'hit sl');
  const cancelledIdeas = filteredIdeas.filter(idea => idea.status === 'cancelled');

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
    setTradeDetails({
      quantity: '',
      entryPrice: idea.entryPrice?.toString() || '',
      dateTaken: formatDateForDisplay(getCurrentISTDate()),
    });
    setShowTradeModal(idea.id);
  };

  const handleTakeTrade = async (ideaId: string) => {
    const idea = ideas.find(i => i.id === ideaId);
    if (!idea || !tradeDetails.quantity || !tradeDetails.entryPrice) {
      alert('Please fill in quantity and entry price');
      return;
    }

    try {
      const quantity = parseFloat(tradeDetails.quantity);
      const entryPrice = parseFloat(tradeDetails.entryPrice);

      const positionData = {
        symbol: idea.symbol || '',
        tradeType: idea.tradeType || 'Long',
        entryPrice: entryPrice,
        currentPrice: entryPrice,
        target1: idea.target1 || 0,
        stopLoss: idea.stopLoss || 0,
        quantity: quantity,
        totalValue: entryPrice * quantity,
        dateTaken: formatDateForStorage(tradeDetails.dateTaken),
        exitCriteria: exitCriteria,
      };

      await addToPortfolio(ideaId, positionData);
      trackPositionAdded(idea.symbol || 'Unknown', 'idea');

      setShowTradeModal(null);
      setTradeDetails({
        quantity: '',
        entryPrice: '',
        dateTaken: formatDateForDisplay(getCurrentISTDate()),
      });
      setExitCriteria({
        exitAtStopLoss: true,
        exitAtTarget: true,
        exitBelow50EMA: false,
        exitBelow100MA: false,
        exitBelow200MA: false,
        exitOnWeeklySupertrend: false,
        customNote: '',
      });
      alert('Trade added to your portfolio!');
      router.push('/portfolio');
    } catch (error: any) {
      alert(error.message || 'Failed to add position');
    }
  };

  const renderIdeaCard = (idea: any) => {
    const target1Percent = idea.entryPrice
      ? (((idea.target1 - idea.entryPrice) / idea.entryPrice) * 100).toFixed(1)
      : null;

    // Calculate badge status: "Ready to Enter", "You can Enter", or "Waiting"
    const calculateBadgeStatus = () => {
      // Check if we have required data
      if (!idea.technicals || !idea.fundamentals || !idea.entryPrice) {
        return { text: 'Waiting', color: 'bg-gray-500/20 text-gray-500 dark:text-gray-400' };
      }

      const lastPrice = idea.technicals.lastPrice;
      if (!lastPrice) {
        return { text: 'Waiting', color: 'bg-gray-500/20 text-gray-500 dark:text-gray-400' };
      }

      // Check if entry price is higher than LTP (price is below entry) AND fundamentals are EXCELLENT
      if (lastPrice < idea.entryPrice && idea.fundamentals.fundamentalRating === 'EXCELLENT') {
        return { text: 'You can Enter', color: 'bg-orange-500/20 text-orange-500 dark:text-orange-400' };
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
        return { text: 'Ready to Enter', color: 'bg-green-500/20 text-green-500 dark:text-green-400' };
      }

      return { text: 'Waiting', color: 'bg-gray-500/20 text-gray-500 dark:text-gray-400' };
    };

    const badgeStatus = calculateBadgeStatus();

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


        {/* Warning if no technical data available */}
        {!idea.technicals && (
          <div className="mb-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-xs text-yellow-600 dark:text-yellow-400">
              ⚠️ Technical data not available. Waiting for next analysis cycle.
            </p>
          </div>
        )}

        {/* When to Enter */}
        {/* {idea.whenToEnter && (
          <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-3 mb-3">
            <p className="text-base text-gray-600 dark:text-[#8b949e] leading-relaxed whitespace-pre-wrap">
              <span className="font-semibold text-[#ff8c42]">When to Enter: </span>
              {idea.whenToEnter}
            </p>
          </div>
        )} */}

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

        {/* Trade Details */}
        <div className="grid grid-cols-4 gap-3 mb-4 pt-4 border-t border-gray-200 dark:border-[#30363d]">
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-[#8b949e] mb-1">LTP</div>
            <div className={`text-sm font-semibold ${
              idea.technicals?.lastPrice
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-[#8b949e]'
            }`}>
              {idea.technicals?.lastPrice ? `₹${idea.technicals.lastPrice.toFixed(2)}` : 'N/A'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-[#8b949e] mb-1">Entry</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {typeof idea.entryPrice === 'number' ? `₹${idea.entryPrice}` : idea.entryPrice}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-[#8b949e] mb-1">Target</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              ₹{idea.target1} {target1Percent && <span className="text-xs text-gray-600 dark:text-[#8b949e]">+{target1Percent}%</span>}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-[#8b949e] mb-1">Stop Loss</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">₹{idea.stopLoss}</div>
          </div>
        </div>

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
              <span>Add Position</span>
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
              <span>📅 {formatIndianDate(idea.createdAt, 'relative')}</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-[#8b949e]">
              <div className="w-4 h-4 rounded-full bg-[#ff8c42] flex items-center justify-center text-white text-[10px] font-bold">
                {idea.userName?.charAt(0).toUpperCase() || '?'}
              </div>
              <span>Posted by <span className="font-medium">{idea.userName || 'Anonymous'}</span></span>
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

      {/* Search Bar */}
      <div className="px-5 mb-3">
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
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'active'
                ? 'bg-[#ff8c42] text-gray-900 dark:text-white'
                : 'bg-gray-50 dark:bg-[#1c2128] text-gray-600 dark:text-[#8b949e] hover:bg-[#30363d]'
            }`}
          >
            🟢 Active
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

      {/* Ideas Sections */}
      <div className="px-5 pb-8">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block w-12 h-12 border-4 border-[#ff8c42] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 dark:text-[#8b949e] text-lg">Loading ideas...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* In Progress Ideas Section */}
            {cookingIdeas.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">In Progress</h2>
                  <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs font-semibold rounded-full">
                    {cookingIdeas.length}
                  </span>
                  {cookingIdeas[0]?.technicals?.updatedAt && (
                    <span className="text-xs text-orange-600 dark:text-orange-400">
                      Technical data updated: {(() => {
                        const updatedAt = cookingIdeas[0].technicals.updatedAt.toDate();
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
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cookingIdeas.map((idea) => renderIdeaCard(idea))}
                </div>
              </div>
            )}

            {/* Active Ideas Section */}
            {activeIdeas.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">🟢 Active Ideas</h2>
                  <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full">
                    {activeIdeas.length}
                  </span>
                  {activeIdeas[0]?.technicals?.updatedAt && (
                    <span className="text-xs text-orange-600 dark:text-orange-400">
                      Technical data updated: {(() => {
                        const updatedAt = activeIdeas[0].technicals.updatedAt.toDate();
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
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeIdeas.map((idea) => renderIdeaCard(idea))}
                </div>
              </div>
            )}

            {/* Hit Target Ideas Section */}
            {hitTargetIdeas.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">🎯 Hit Target</h2>
                  <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full">
                    {hitTargetIdeas.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {hitTargetIdeas.map((idea) => renderIdeaCard(idea))}
                </div>
              </div>
            )}

            {/* Hit Stop Loss Ideas Section */}
            {hitSLIdeas.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">🛑 Hit Stop Loss</h2>
                  <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-semibold rounded-full">
                    {hitSLIdeas.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {hitSLIdeas.map((idea) => renderIdeaCard(idea))}
                </div>
              </div>
            )}

            {/* Cancelled Ideas Section */}
            {cancelledIdeas.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">❌ Cancelled</h2>
                  <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 text-xs font-semibold rounded-full">
                    {cancelledIdeas.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cancelledIdeas.map((idea) => renderIdeaCard(idea))}
                </div>
              </div>
            )}

            {/* No ideas message */}
            {cookingIdeas.length === 0 && activeIdeas.length === 0 && hitTargetIdeas.length === 0 && hitSLIdeas.length === 0 && cancelledIdeas.length === 0 && (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">💡</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No ideas found</h3>
                <p className="text-gray-600 dark:text-[#8b949e]">Try adjusting your search or filters</p>
              </div>
            )}
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

      {/* Trade Modal */}
      {showTradeModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setShowTradeModal(null)}
        >
          <div
            className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Add Trade to Portfolio</h3>
              <button
                onClick={() => setShowTradeModal(null)}
                className="text-gray-600 dark:text-[#8b949e] hover:text-gray-900 dark:hover:text-white transition-colors text-2xl"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  value={tradeDetails.quantity}
                  onChange={(e) =>
                    setTradeDetails({ ...tradeDetails, quantity: e.target.value })
                  }
                  placeholder="Enter quantity"
                  required
                  className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-2">
                  Entry Price Taken
                </label>
                <input
                  type="number"
                  value={tradeDetails.entryPrice}
                  onChange={(e) =>
                    setTradeDetails({ ...tradeDetails, entryPrice: e.target.value })
                  }
                  placeholder="Enter entry price"
                  required
                  className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-2">
                  Date Taken (DD-MM-YYYY)
                </label>
                <input
                  type="text"
                  value={tradeDetails.dateTaken}
                  onChange={(e) =>
                    setTradeDetails({ ...tradeDetails, dateTaken: e.target.value })
                  }
                  placeholder="DD-MM-YYYY"
                  pattern="\d{2}-\d{2}-\d{4}"
                  className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
                />
              </div>

              {/* Exit Criteria Section */}
              <div className="border-t border-gray-200 dark:border-[#30363d] pt-4">
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  📤 Exit Strategy
                </label>
                <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-3">
                  By default, position will exit at Stop Loss (₹{ideas.find(i => i.id === showTradeModal)?.stopLoss}) or Target (₹{ideas.find(i => i.id === showTradeModal)?.target1})
                </p>

                <div className="space-y-3">
                  {/* Exit Below 50 EMA */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exitCriteria.exitBelow50EMA}
                      onChange={(e) =>
                        setExitCriteria({ ...exitCriteria, exitBelow50EMA: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-gray-300 text-[#ff8c42] focus:ring-[#ff8c42]"
                    />
                    <span className="text-sm text-gray-600 dark:text-[#8b949e]">Exit if price goes below 50 EMA</span>
                  </label>

                  {/* Exit Below 100 MA */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exitCriteria.exitBelow100MA}
                      onChange={(e) =>
                        setExitCriteria({ ...exitCriteria, exitBelow100MA: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-gray-300 text-[#ff8c42] focus:ring-[#ff8c42]"
                    />
                    <span className="text-sm text-gray-600 dark:text-[#8b949e]">Exit if price goes below 100 MA</span>
                  </label>

                  {/* Exit Below 200 MA */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exitCriteria.exitBelow200MA}
                      onChange={(e) =>
                        setExitCriteria({ ...exitCriteria, exitBelow200MA: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-gray-300 text-[#ff8c42] focus:ring-[#ff8c42]"
                    />
                    <span className="text-sm text-gray-600 dark:text-[#8b949e]">Exit if price goes below 200 MA</span>
                  </label>

                  {/* Exit on Weekly Supertrend */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exitCriteria.exitOnWeeklySupertrend}
                      onChange={(e) =>
                        setExitCriteria({ ...exitCriteria, exitOnWeeklySupertrend: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-gray-300 text-[#ff8c42] focus:ring-[#ff8c42]"
                    />
                    <span className="text-sm text-gray-600 dark:text-[#8b949e]">Exit based on Weekly Supertrend</span>
                  </label>

                  {/* Custom Note */}
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-[#8b949e] mb-1">
                      Additional Exit Notes (Optional)
                    </label>
                    <textarea
                      value={exitCriteria.customNote}
                      onChange={(e) =>
                        setExitCriteria({ ...exitCriteria, customNote: e.target.value })
                      }
                      placeholder="e.g., Exit if RSI goes below 30, or any other custom criteria"
                      rows={2}
                      className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowTradeModal(null)}
                className="flex-1 bg-[#30363d] hover:bg-[#3e4651] text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => showTradeModal && handleTakeTrade(showTradeModal)}
                className="flex-1 bg-[#ff8c42] hover:bg-[#ff9a58] text-gray-900 dark:text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Add to Portfolio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
