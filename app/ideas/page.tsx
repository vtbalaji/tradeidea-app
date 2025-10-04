'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../../components/Navigation';
import { useTrading } from '../../contexts/TradingContext';
import { useAuth } from '../../contexts/AuthContext';
import { IdeaIcon, TargetIcon, EntryIcon, HeartIcon } from '@/components/icons';

export default function IdeasHubPage() {
  const router = useRouter();
  const { ideas, loading } = useTrading();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Filter ideas based on search and tab
  let filteredIdeas = ideas;

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

  const renderIdeaCard = (idea: any) => {
    const target1Percent = idea.entryPrice
      ? (((idea.target1 - idea.entryPrice) / idea.entryPrice) * 100).toFixed(1)
      : null;

    return (
      <div
        key={idea.id}
        className="bg-[#1c2128] border border-[#30363d] rounded-xl p-4 hover:border-[#ff8c42] transition-colors cursor-pointer"
        onClick={() => router.push(`/ideas/${idea.id}`)}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2">{idea.symbol}</h3>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs font-semibold rounded">
                {idea.status}
              </span>
            </div>
          </div>
          <IdeaIcon size={24} />
        </div>

        {/* Title */}
        <h4 className="text-base font-semibold text-white mb-3">{idea.title}</h4>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="px-2.5 py-1 bg-yellow-500/20 text-[#8b949e] text-xs font-semibold rounded-full">
            {idea.riskLevel}
          </span>
          <span className="px-2.5 py-1 bg-blue-500/20 text-[#8b949e] text-xs font-semibold rounded-full">
            {idea.timeframe}
          </span>
          <span className="px-2.5 py-1 bg-gray-500/20 text-[#8b949e] text-xs font-semibold rounded-full">
            {idea.analysisType}
          </span>
        </div>

        {/* Analysis */}
        <p className="text-sm text-[#8b949e] mb-4 line-clamp-2">{idea.analysis}</p>

        {/* Trade Details */}
        <div className="space-y-2 mb-4 pt-4 border-t border-[#30363d]">
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#8b949e] flex items-center gap-1"><EntryIcon size={16} /> Entry:</span>
            <span className="text-sm font-semibold text-white">
              {typeof idea.entryPrice === 'number' ? `₹${idea.entryPrice}` : idea.entryPrice}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#8b949e] flex items-center gap-1"><TargetIcon size={16} /> Target 1:</span>
            <span className="text-sm font-semibold text-green-500">
              ₹{idea.target1}
              {target1Percent && <span className="text-xs ml-1">+{target1Percent}%</span>}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#8b949e] flex items-center gap-1"><EntryIcon size={16} /> Stop Loss:</span>
            <span className="text-sm font-semibold text-red-500">₹{idea.stopLoss}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-3 border-t border-[#30363d]">
          <div className="flex gap-3 text-xs text-[#8b949e]">
            <span className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 14s-6-4.5-6-8c0-2.5 2-4 4-4 1.5 0 2 1 2 1s.5-1 2-1c2 0 4 1.5 4 4 0 3.5-6 8-6 8z"/>
              </svg>
              {idea.likes}
            </span>
            <span>💬 {idea.commentCount}</span>
            <span>📅 {idea.createdAt?.toDate ? idea.createdAt.toDate().toLocaleDateString() : 'Recent'}</span>
          </div>
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
    );
  };

  return (
    <div className="min-h-screen bg-[#0f1419]">
      <Navigation />

      {/* Header */}
      <div className="p-5 pt-8">
        <h1 className="text-4xl font-bold text-white mb-2">Trading Ideas Hub</h1>
        <p className="text-[#8b949e]">Discover and share trading opportunities with the community</p>
      </div>

      {/* Search Bar */}
      <div className="px-5 mb-4">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search by symbol, title, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-[#1c2128] border border-[#30363d] rounded-lg px-4 py-3 text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
          />
          <button className="px-5 py-3 bg-[#1c2128] border border-[#30363d] rounded-lg text-[#8b949e] font-semibold hover:bg-[#30363d] transition-colors">
            🔍 Filters
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 mb-5">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-[#ff8c42] text-white'
                : 'bg-[#1c2128] text-[#8b949e] hover:bg-[#30363d]'
            }`}
          >
            All Ideas
          </button>
          <button
            onClick={() => setActiveTab('trending')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'trending'
                ? 'bg-[#ff8c42] text-white'
                : 'bg-[#1c2128] text-[#8b949e] hover:bg-[#30363d]'
            }`}
          >
            🔥 Trending
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'recent'
                ? 'bg-[#ff8c42] text-white'
                : 'bg-[#1c2128] text-[#8b949e] hover:bg-[#30363d]'
            }`}
          >
            ⏰ Recent
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'following'
                ? 'bg-[#ff8c42] text-white'
                : 'bg-[#1c2128] text-[#8b949e] hover:bg-[#30363d]'
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
            <p className="text-[#8b949e] text-lg">Loading ideas...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Cooking Ideas Section */}
            {cookingIdeas.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold text-white">🍳 Cooking Ideas</h2>
                  <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-sm font-semibold rounded-full">
                    {cookingIdeas.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cookingIdeas.map((idea) => renderIdeaCard(idea))}
                </div>
              </div>
            )}

            {/* Active Ideas Section */}
            {activeIdeas.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold text-white">🟢 Active Ideas</h2>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm font-semibold rounded-full">
                    {activeIdeas.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeIdeas.map((idea) => renderIdeaCard(idea))}
                </div>
              </div>
            )}

            {/* Hit Target Ideas Section */}
            {hitTargetIdeas.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold text-white">🎯 Hit Target</h2>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm font-semibold rounded-full">
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
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold text-white">🛑 Hit Stop Loss</h2>
                  <span className="px-3 py-1 bg-red-500/20 text-red-400 text-sm font-semibold rounded-full">
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
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold text-white">❌ Cancelled</h2>
                  <span className="px-3 py-1 bg-gray-500/20 text-gray-400 text-sm font-semibold rounded-full">
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
                <h3 className="text-xl font-semibold text-white mb-2">No ideas found</h3>
                <p className="text-[#8b949e]">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
