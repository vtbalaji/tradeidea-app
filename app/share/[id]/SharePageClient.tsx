'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IdeaIcon, TargetIcon, EntryIcon } from '@/components/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCopy,
  faExclamationTriangle,
  faFileAlt,
  faArrowRight,
  faRightFromBracket,
  faCheck,
  faComments,
  faLock,
} from '@fortawesome/free-solid-svg-icons';

interface SharePageClientProps {
  idea: any;
  comments: any[];
}

export default function SharePageClient({ idea, comments }: SharePageClientProps) {
  const router = useRouter();

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const target1Percent = idea.entryPrice
    ? (((idea.target1 - idea.entryPrice) / idea.entryPrice) * 100).toFixed(2)
    : 0;

  const riskRewardRatio = idea.stopLoss
    ? (((idea.target1 - idea.entryPrice) / (idea.entryPrice - idea.stopLoss))).toFixed(2)
    : 0;
  const stopLossPercent = idea.entryPrice
    ? (((idea.stopLoss - idea.entryPrice) / idea.entryPrice) * 100).toFixed(2)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30 dark:from-[#0d1117] dark:via-[#0f1419] dark:to-[#1c2128]">
      {/* Header with Logo and Login */}
      <div className="bg-white dark:bg-[#1c2128] border-b border-gray-200 dark:border-[#30363d] px-5 py-3 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="TradeIdea Logo"
                width={40}
                height={40}
                className=""
              />
              <div className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                TradeIdea
              </div>
            </a>
            <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-400 text-xs font-bold rounded-full">
              Public Share
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 bg-gray-100 dark:bg-[#30363d] hover:bg-gray-200 dark:hover:bg-[#3e4651] text-gray-700 dark:text-white text-sm font-semibold rounded-lg transition-all flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faCopy} className="w-4 h-4" />
              Copy Link
            </button>
            <button
              onClick={handleLogin}
              className="px-5 py-2 bg-[#ff8c42] hover:bg-[#ff9a58] text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-orange-300 to-orange-400 dark:from-orange-400 dark:to-orange-500 rounded-xl p-6 md:p-8 mb-6 shadow-md relative overflow-hidden">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-md text-white text-xs font-medium">
                {idea.tradeType || 'LONG'}
              </span>
              <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-md text-white text-xs font-medium">
                {idea.timeframe}
              </span>
              <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-md text-white text-xs font-medium">
                {idea.riskLevel} Risk
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
              {idea.symbol}
            </h1>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2 text-white/90">
                <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xs font-semibold">
                  {idea.userName?.charAt(0).toUpperCase() || '?'}
                </div>
                <span className="text-sm">{idea.userName || 'Anonymous'}</span>
              </div>
              <span className="text-white/70 text-sm">•</span>
              <span className="text-white/90 text-sm">
                {idea.createdAt ? new Date(idea.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-md">
              <div className="bg-white/15 backdrop-blur-md rounded-lg p-3 border border-white/20">
                <div className="text-white/80 text-xs mb-1">Potential Gain</div>
                <div className="text-white text-xl font-semibold">+{target1Percent}%</div>
              </div>
              <div className="bg-white/15 backdrop-blur-md rounded-lg p-3 border border-white/20">
                <div className="text-white/80 text-xs mb-1">Risk/Reward</div>
                <div className="text-white text-xl font-semibold">1:{riskRewardRatio}</div>
              </div>
              <div className="bg-white/15 backdrop-blur-md rounded-lg p-3 border border-white/20">
                <div className="text-white/80 text-xs mb-1">Likes</div>
                <div className="text-white text-xl font-semibold">{idea.likes || 0}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Trade Setup - Prominent Section */}
        <div className="bg-white dark:bg-[#161b22] rounded-xl shadow-md border border-gray-200 dark:border-[#30363d] overflow-hidden mb-6">
          <div className="bg-gray-100 dark:bg-[#1c2128] px-6 py-3.5 border-b border-gray-200 dark:border-[#30363d]">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <TargetIcon size={24} />
                Trade Setup & Levels
              </h2>
              <button
                onClick={handleLogin}
                className="px-5 py-2 bg-white hover:bg-gray-50 dark:bg-[#30363d] dark:hover:bg-[#3e4651] text-gray-900 dark:text-white font-semibold rounded-lg transition-all shadow-sm text-sm"
              >
                Sign In to Track
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Price Levels Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Entry Price */}
              <div className="bg-gray-50 dark:bg-[#1c2128] rounded-lg p-4 border border-gray-200 dark:border-[#30363d]">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                  <EntryIcon size={18} />
                  <span className="text-xs font-semibold uppercase">Entry Price</span>
                </div>
                <div className="text-2xl font-semibold text-blue-700 dark:text-blue-300">₹{idea.entryPrice.toFixed(2)}</div>
                <div className="text-xs text-gray-600 dark:text-[#8b949e] mt-1">Recommended Entry Level</div>
              </div>

              {/* Target */}
              <div className="bg-gray-50 dark:bg-[#1c2128] rounded-lg p-4 border border-gray-200 dark:border-[#30363d]">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
                  <TargetIcon size={18} />
                  <span className="text-xs font-semibold uppercase">Target</span>
                </div>
                <div className="text-2xl font-semibold text-green-700 dark:text-green-300">₹{idea.target1.toFixed(2)}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-semibold rounded">
                    +{target1Percent}%
                  </span>
                  <span className="text-xs text-gray-600 dark:text-[#8b949e]">Potential Profit</span>
                </div>
              </div>

              {/* Stop Loss */}
              <div className="bg-gray-50 dark:bg-[#1c2128] rounded-lg p-4 border border-gray-200 dark:border-[#30363d]">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
                  <FontAwesomeIcon icon={faExclamationTriangle} style={{ width: 18, height: 18 }} />
                  <span className="text-xs font-semibold uppercase">Stop Loss</span>
                </div>
                <div className="text-2xl font-semibold text-red-700 dark:text-red-300">₹{idea.stopLoss.toFixed(2)}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-semibold rounded">
                    {stopLossPercent}%
                  </span>
                  <span className="text-xs text-gray-600 dark:text-[#8b949e]">Max Risk</span>
                </div>
              </div>
            </div>

            {/* Risk Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-[#1c2128] rounded-lg p-4 text-center border border-gray-200 dark:border-[#30363d]">
                <div className="text-xs text-gray-600 dark:text-[#8b949e] mb-1">Risk/Reward</div>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">1:{riskRewardRatio}</div>
              </div>
              <div className="bg-gray-50 dark:bg-[#1c2128] rounded-lg p-4 text-center border border-gray-200 dark:border-[#30363d]">
                <div className="text-xs text-gray-600 dark:text-[#8b949e] mb-1">Timeframe</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">{idea.timeframe}</div>
              </div>
              <div className="bg-gray-50 dark:bg-[#1c2128] rounded-lg p-4 text-center border border-gray-200 dark:border-[#30363d]">
                <div className="text-xs text-gray-600 dark:text-[#8b949e] mb-1">Risk Level</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">{idea.riskLevel}</div>
              </div>
              <div className="bg-gray-50 dark:bg-[#1c2128] rounded-lg p-4 text-center border border-gray-200 dark:border-[#30363d]">
                <div className="text-xs text-gray-600 dark:text-[#8b949e] mb-1">Analysis</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">{idea.analysisType}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Section */}
        <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-2xl shadow-md p-6 md:p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-300 to-pink-300 dark:from-purple-500 dark:to-pink-500 rounded-xl flex items-center justify-center">
              <FontAwesomeIcon icon={faFileAlt} className="w-6 h-6 text-gray-900 dark:text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analysis & Rationale</h2>
              <p className="text-sm text-gray-600 dark:text-[#8b949e]">Detailed investment thesis</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#1c2128] dark:to-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-xl p-6 mb-6">
            <p className="text-base text-gray-800 dark:text-[#c9d1d9] leading-relaxed whitespace-pre-wrap">{idea.analysis}</p>
          </div>

          {/* Entry/Exit Timing */}
          {(idea.whenToEnter || idea.whenToExit) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {idea.whenToEnter && (
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-xl p-5">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-3">
                    <FontAwesomeIcon icon={faArrowRight} className="w-5 h-5" />
                    <span className="font-bold uppercase text-sm">When to Enter</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{idea.whenToEnter}</p>
                </div>
              )}
              {idea.whenToExit && (
                <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-2 border-orange-200 dark:border-orange-800 rounded-xl p-5">
                  <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-3">
                    <FontAwesomeIcon icon={faRightFromBracket} className="w-5 h-5" />
                    <span className="font-bold uppercase text-sm">When to Exit</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{idea.whenToExit}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sign In CTA */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-2xl p-8 text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-500 dark:from-[#ff8c42] dark:to-[#ff6b35] rounded-full mx-auto mb-4 flex items-center justify-center">
            <FontAwesomeIcon icon={faCheck} className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Want to track this idea?</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Sign in to add this idea to your portfolio and get real-time alerts</p>
          <button
            onClick={handleLogin}
            className="px-8 py-3 bg-[#ff8c42] hover:bg-[#ff9a58] text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg"
          >
            Sign In to Add to Portfolio
          </button>
        </div>

        {/* Discussion Section */}
        <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-2xl shadow-md p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-300 to-purple-300 dark:from-indigo-500 dark:to-purple-500 rounded-xl flex items-center justify-center">
              <FontAwesomeIcon icon={faComments} className="w-6 h-6 text-gray-900 dark:text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Discussion</h2>
              <p className="text-sm text-gray-600 dark:text-[#8b949e]">{comments.length} comments</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-2 border-indigo-200 dark:border-indigo-800 rounded-xl p-6 text-center mb-6">
            <FontAwesomeIcon icon={faLock} className="w-12 h-12 text-indigo-500 mx-auto mb-3" />
            <p className="text-gray-700 dark:text-gray-300 font-medium">
              Sign in to join the discussion and share your thoughts
            </p>
          </div>

          {comments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-[#6e7681] text-sm">No comments yet. Be the first to share your thoughts!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-gradient-to-br from-gray-50 to-white dark:from-[#1c2128] dark:to-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-xl p-5">
                  <div className="flex items-start gap-4 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff8c42] to-[#ff6b35] flex items-center justify-center text-white font-bold flex-shrink-0">
                      {comment.userName?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{comment.userName || 'Trader'}</span>
                        <span className="text-xs text-gray-500 dark:text-[#6e7681]">•</span>
                        <span className="text-xs text-gray-500 dark:text-[#6e7681]">
                          {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Just now'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-[#c9d1d9] leading-relaxed">{comment.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-[#30363d] text-center">
          <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-3">
            Powered by <span className="font-semibold text-[#ff8c42]">TradeIdea</span> - Smart Portfolio Management
          </p>
          <button
            onClick={handleLogin}
            className="px-6 py-2 bg-[#ff8c42] hover:bg-[#ff9a58] text-gray-900 dark:text-white font-semibold rounded-lg transition-colors"
          >
            Join TradeIdea
          </button>
        </div>
      </div>
    </div>
  );
}
