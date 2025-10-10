'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../../components/Navigation';
import { useTrading } from '../../contexts/TradingContext';
import { useAuth } from '../../contexts/AuthContext';
import { IdeaIcon, TargetIcon, EntryIcon, HeartIcon } from '@/components/icons';
import { formatIndianDate } from '@/lib/dateUtils';
import { createInvestmentEngine } from '@/lib/investment-rules';
import InvestorAnalysisModal from '@/components/InvestorAnalysisModal';

export default function IdeasHubPage() {
  const router = useRouter();
  const { ideas, loading } = useTrading();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showAnalysisModal, setShowAnalysisModal] = useState<string | null>(null);
  const [currentRecommendation, setCurrentRecommendation] = useState<any>(null);

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
  if (activeTab === 'following') {
    filteredIdeas = filteredIdeas.filter(idea => idea.followers?.includes(user?.uid || ''));
  } else if (activeTab === 'trending') {
    // Sort by likes (most liked first)
    filteredIdeas = [...filteredIdeas].sort((a, b) => (b.likes || 0) - (a.likes || 0));
  } else if (activeTab === 'recent') {
    // Sort by creation date (newest first)
    filteredIdeas = [...filteredIdeas].sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return dateB - dateA;
    });
  }

  // Group ideas by status
  const cookingIdeas = filteredIdeas.filter(idea => idea.status === 'cooking');
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

  const renderIdeaCard = (idea: any) => {
    const target1Percent = idea.entryPrice
      ? (((idea.target1 - idea.entryPrice) / idea.entryPrice) * 100).toFixed(1)
      : null;

    return (
      <div
        key={idea.id}
        className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-4 hover:border-[#ff8c42] transition-colors cursor-pointer"
        onClick={() => router.push(`/ideas/${idea.id}`)}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{idea.symbol}</h3>
          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs font-semibold rounded">
            {idea.status}
          </span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="px-2.5 py-1 bg-yellow-500/20 text-gray-600 dark:text-[#8b949e] text-xs font-semibold rounded-full">
            {idea.riskLevel}
          </span>
          <span className="px-2.5 py-1 bg-blue-500/20 text-gray-600 dark:text-[#8b949e] text-xs font-semibold rounded-full">
            {idea.timeframe}
          </span>
          <span className="px-2.5 py-1 bg-gray-500/20 text-gray-600 dark:text-[#8b949e] text-xs font-semibold rounded-full">
            {idea.analysisType}
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
        {idea.whenToEnter && (
          <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-3 mb-3">
            <p className="text-sm text-gray-600 dark:text-[#8b949e] leading-relaxed whitespace-pre-wrap">
              <span className="font-semibold text-[#ff8c42]">When to Enter: </span>
              {idea.whenToEnter}
            </p>
          </div>
        )}

        {/* Technical Levels & Fundamentals */}
        {(idea.technicals || idea.fundamentals) && (
          <div className="mb-3 p-3 bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg">
            {idea.technicals && (
              <>
                <p className="text-xs font-bold text-[#ff8c42] mb-2">Technical Levels</p>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  {idea.technicals.ema50 && (
                    <div>
                      <span className="text-gray-600 dark:text-[#8b949e]">50 EMA:</span>
                      <span className={`ml-1 font-semibold ${idea.technicals.lastPrice > idea.technicals.ema50 ? 'text-green-500' : 'text-red-500'}`}>
                        ₹{idea.technicals.ema50.toFixed(2)} {idea.technicals.lastPrice > idea.technicals.ema50 ? '↗' : '↘'}
                      </span>
                    </div>
                  )}
                  {idea.technicals.sma100 && (
                    <div>
                      <span className="text-gray-600 dark:text-[#8b949e]">100 MA:</span>
                      <span className={`ml-1 font-semibold ${idea.technicals.lastPrice > idea.technicals.sma100 ? 'text-green-500' : 'text-red-500'}`}>
                        ₹{idea.technicals.sma100.toFixed(2)} {idea.technicals.lastPrice > idea.technicals.sma100 ? '↗' : '↘'}
                      </span>
                    </div>
                  )}
                  {idea.technicals.sma200 && (
                    <div>
                      <span className="text-gray-600 dark:text-[#8b949e]">200 MA:</span>
                      <span className={`ml-1 font-semibold ${idea.technicals.lastPrice > idea.technicals.sma200 ? 'text-green-500' : 'text-red-500'}`}>
                        ₹{idea.technicals.sma200.toFixed(2)} {idea.technicals.lastPrice > idea.technicals.sma200 ? '↗' : '↘'}
                      </span>
                    </div>
                  )}
                  {idea.technicals.supertrend && (
                    <div>
                      <span className="text-gray-600 dark:text-[#8b949e]">Supertrend:</span>
                      <span className={`ml-1 font-semibold ${idea.technicals.supertrendDirection === 1 ? 'text-green-500' : 'text-red-500'}`}>
                        ₹{idea.technicals.supertrend.toFixed(2)} {idea.technicals.supertrendDirection === 1 ? '↗' : '↘'}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
            {idea.fundamentals && (
              <>
                <p className="text-xs font-bold text-[#ff8c42] mb-2 pt-2 border-t border-gray-200 dark:border-[#30363d]">Fundamentals</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {idea.fundamentals.trailingPE && (
                    <div>
                      <span className="text-gray-600 dark:text-[#8b949e]">PE:</span>
                      <span className="ml-1 font-semibold text-gray-900 dark:text-white">{idea.fundamentals.trailingPE.toFixed(2)}</span>
                    </div>
                  )}
                  {idea.fundamentals.returnOnEquity && (
                    <div>
                      <span className="text-gray-600 dark:text-[#8b949e]">ROE:</span>
                      <span className="ml-1 font-semibold text-gray-900 dark:text-white">{idea.fundamentals.returnOnEquity.toFixed(1)}%</span>
                    </div>
                  )}
                  {idea.fundamentals.debtToEquity && (
                    <div>
                      <span className="text-gray-600 dark:text-[#8b949e]">Debt-to-Equity:</span>
                      <span className="ml-1 font-semibold text-gray-900 dark:text-white">{idea.fundamentals.debtToEquity.toFixed(1)}</span>
                    </div>
                  )}
                  {idea.fundamentals.earningsGrowth && (
                    <div>
                      <span className="text-gray-600 dark:text-[#8b949e]">Earnings Growth:</span>
                      <span className="ml-1 font-semibold text-gray-900 dark:text-white">{idea.fundamentals.earningsGrowth.toFixed(1)}%</span>
                    </div>
                  )}
                  {idea.fundamentals.fundamentalRating && (
                    <div>
                      <span className="text-gray-600 dark:text-[#8b949e]">Rating:</span>
                      <span className={`ml-1 font-semibold ${
                        idea.fundamentals.fundamentalRating === 'EXCELLENT' ? 'text-green-500' :
                        idea.fundamentals.fundamentalRating === 'GOOD' ? 'text-blue-400' :
                        idea.fundamentals.fundamentalRating === 'AVERAGE' ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>{idea.fundamentals.fundamentalRating}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Trade Details */}
        <div className="grid grid-cols-4 gap-3 mb-4 pt-4 border-t border-gray-200 dark:border-[#30363d]">
          <div className="text-center">
            <div className="text-xs text-gray-600 dark:text-[#8b949e] mb-1">LTP</div>
            <div className={`text-sm font-semibold ${
              idea.technicals?.lastPrice
                ? (idea.technicals.lastPrice >= idea.entryPrice ? 'text-green-500' : 'text-gray-900 dark:text-white')
                : 'text-gray-500 dark:text-[#8b949e]'
            }`}>
              {idea.technicals?.lastPrice ? `₹${idea.technicals.lastPrice.toFixed(2)}` : 'N/A'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-600 dark:text-[#8b949e] mb-1">Entry</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {typeof idea.entryPrice === 'number' ? `₹${idea.entryPrice}` : idea.entryPrice}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-600 dark:text-[#8b949e] mb-1">Target</div>
            <div className="text-sm font-semibold text-green-500">
              ₹{idea.target1} {target1Percent && <span className="text-xs text-green-400">+{target1Percent}%</span>}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-600 dark:text-[#8b949e] mb-1">Stop Loss</div>
            <div className="text-sm font-semibold text-red-500">₹{idea.stopLoss}</div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-[#30363d]">
          <div className="flex gap-3 text-xs text-gray-600 dark:text-[#8b949e]">
            <span className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 14s-6-4.5-6-8c0-2.5 2-4 4-4 1.5 0 2 1 2 1s.5-1 2-1c2 0 4 1.5 4 4 0 3.5-6 8-6 8z"/>
              </svg>
              {idea.likes}
            </span>
            <span>💬 {idea.commentCount}</span>
            <span>📅 {formatIndianDate(idea.createdAt, 'relative')}</span>
          </div>

          <div className="flex gap-2">
            {/* Analyze Button */}
            <button
              onClick={(e) => handleAnalyze(e, idea)}
              className="px-3 py-1.5 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!idea.technicals || !idea.fundamentals}
            >
              Analyze
            </button>

            {/* View Details Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/ideas/${idea.id}`);
              }}
              className="px-3 py-1.5 bg-[#30363d] hover:bg-[#3c444d] text-[#ff8c42] text-xs font-semibold rounded transition-colors"
            >
              View Details
            </button>
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
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 14s-6-4.5-6-8c0-2.5 2-4 4-4 1.5 0 2 1 2 1s.5-1 2-1c2 0 4 1.5 4 4 0 3.5-6 8-6 8z"/>
            </svg>
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
            {/* Brewing Ideas Section */}
            {cookingIdeas.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">☕ Brewing Ideas</h2>
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
        />
      )}
    </div>
  );
}
