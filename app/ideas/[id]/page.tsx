'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '../../../components/Navigation';
import { useTrading } from '../../../contexts/TradingContext';
import { useAuth } from '../../../contexts/AuthContext';
import { IdeaIcon, TargetIcon, EntryIcon } from '@/components/icons';
import { getCurrentISTDate, formatDateForDisplay, formatDateForStorage } from '@/lib/dateUtils';
import { trackIdeaViewed, trackIdeaLiked, trackIdeaFollowed, trackPositionAdded } from '@/lib/analytics';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faHeart as faHeartSolid,
  faEye,
  faBell,
  faPlus,
  faShareNodes,
  faPen,
  faXmark,
  faFileAlt,
  faArrowRight,
  faRightFromBracket,
  faComments,
  faReply,
  faPaperPlane,
  faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons';

export default function IdeaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ideaId = params.id as string;
  const { ideas, toggleLike, toggleFollow, addComment, fetchComments, addToPortfolio, updateIdea, deleteIdea } = useTrading();
  const { user } = useAuth();
  const [idea, setIdea] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check email verification
  useEffect(() => {
    if (user && !user.emailVerified) {
      router.push('/verify');
    }
  }, [user, router]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [tradeDetails, setTradeDetails] = useState({
    quantity: '',
    entryPrice: '',
    dateTaken: formatDateForDisplay(getCurrentISTDate()), // Today's date in DD-MM-YYYY format
  });
  const [exitCriteria, setExitCriteria] = useState({
    exitAtStopLoss: true, // Always true by default
    exitAtTarget: true, // Always true by default
    exitBelow50EMA: false,
    exitBelow100MA: false,
    exitBelow200MA: false,
    exitOnWeeklySupertrend: false,
    customNote: '',
  });

  useEffect(() => {
    const foundIdea = ideas.find(i => i.id === ideaId);
    setIdea(foundIdea);

    if (foundIdea) {
      loadComments();
      // Track idea view
      trackIdeaViewed(ideaId, foundIdea.symbol || 'Unknown');
    }
  }, [ideaId, ideas]);

  const loadComments = async () => {
    try {
      const commentsData = await fetchComments(ideaId);
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleLike = async () => {
    try {
      await toggleLike(ideaId);
      // Track like
      trackIdeaLiked(ideaId);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleFollow = async () => {
    try {
      await toggleFollow(ideaId);
      // Track follow
      trackIdeaFollowed(ideaId);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setLoading(true);
    try {
      await addComment(ideaId, commentText);
      setCommentText('');
      await loadComments();
    } catch (error: any) {
      setError(error.message);
    }
    setLoading(false);
  };

  const handleReply = async (commentId: string) => {
    if (!replyText.trim()) return;

    setLoading(true);
    try {
      const comment = comments.find(c => c.id === commentId);
      await addComment(ideaId, `@${comment?.userName || 'User'} ${replyText}`);
      setReplyText('');
      setReplyingTo(null);
      await loadComments();
    } catch (error: any) {
      setError(error.message);
    }
    setLoading(false);
  };

  const handleTakeTrade = async () => {
    if (!idea || !tradeDetails.quantity || !tradeDetails.entryPrice) {
      setError('Please fill in quantity and entry price');
      return;
    }

    setLoading(true);
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
        dateTaken: formatDateForStorage(tradeDetails.dateTaken), // Convert DD-MM-YYYY to YYYY-MM-DD for storage
        exitCriteria: exitCriteria,
      };

      await addToPortfolio(ideaId, positionData);

      // Track position added from idea
      trackPositionAdded(idea.symbol || 'Unknown', 'idea');

      setShowTradeModal(false);
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
      setError(error.message);
    }
    setLoading(false);
  };

  const handleEditIdea = async () => {
    if (!editFormData) return;

    setLoading(true);
    try {
      await updateIdea(ideaId, editFormData);
      setShowEditModal(false);
      setEditFormData(null);
    } catch (error: any) {
      setError(error.message);
    }
    setLoading(false);
  };

  const handleDeleteIdea = async () => {
    if (!confirm('Are you sure you want to close this idea? It will be hidden from the Ideas Hub.')) return;

    setLoading(true);
    try {
      await deleteIdea(ideaId);
      router.push('/ideas');
    } catch (error: any) {
      setError(error.message);
    }
    setLoading(false);
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/share/${ideaId}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Share link copied to clipboard! Anyone can view this idea without logging in.');
  };

  const isOwner = user && idea && idea.userId === user.uid;

  if (!idea) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0f1419]">
        <Navigation />
        <div className="text-center py-16">
          <p className="text-gray-600 dark:text-[#8b949e] text-lg">Loading...</p>
        </div>
      </div>
    );
  }

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
      <Navigation />

      <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-[#ff8c42] hover:text-[#ff9a58] mb-4 transition-colors font-medium"
          >
            <FontAwesomeIcon icon={faArrowLeft} style={{ width: 16, height: 16 }} />
            Back to Ideas
          </button>
        </div>

        {/* Hero Section with Symbol */}
        <div className="bg-gradient-to-r from-orange-300 to-orange-400 dark:from-orange-400 dark:to-orange-500 rounded-xl p-6 md:p-8 mb-6 shadow-md relative overflow-hidden">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex-1">
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
                    {idea.createdAt?.toDate ? idea.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                  </span>
                </div>

                {/* Quick Stats */}
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

              {/* Action Buttons */}
              <div className="flex md:flex-col gap-2">
                <button
                  onClick={handleShare}
                  className="flex-1 md:flex-none px-5 py-2.5 bg-white hover:bg-gray-50 text-orange-600 font-semibold rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="4" cy="8" r="2"/>
                    <circle cx="12" cy="4" r="2"/>
                    <circle cx="12" cy="12" r="2"/>
                    <path d="M5.5 7L10.5 5M5.5 9L10.5 11"/>
                  </svg>
                  Share
                </button>
                <button
                  onClick={handleLike}
                  className="flex-1 md:flex-none px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 14s-6-4.5-6-8c0-2.5 2-4 4-4 1.5 0 2 1 2 1s.5-1 2-1c2 0 4 1.5 4 4 0 3.5-6 8-6 8z"/>
                  </svg>
                  {idea.likes || 0}
                </button>
                <button
                  onClick={handleFollow}
                  className="flex-1 md:flex-none px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 8s2-4 7-4 7 4 7 4-2 4-7 4-7-4-7-4z"/>
                    <circle cx="8" cy="8" r="2"/>
                  </svg>
                  {idea.followers?.includes(user?.uid || '') ? 'Following' : 'Follow'}
                </button>
              </div>
            </div>

            {/* Owner Actions */}
            {isOwner && (
              <div className="mt-6 pt-6 border-t border-white/20 flex gap-3">
                <button
                  onClick={() => {
                    setEditFormData({
                      title: idea.title,
                      analysis: idea.analysis,
                      entryPrice: idea.entryPrice,
                      target1: idea.target1,
                      stopLoss: idea.stopLoss,
                      status: idea.status || 'active'
                    });
                    setShowEditModal(true);
                  }}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white text-sm font-semibold rounded-lg transition-all flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faPen} className="w-4 h-4" />
                  Edit Idea
                </button>
                <button
                  onClick={handleDeleteIdea}
                  className="px-4 py-2 bg-red-500/30 hover:bg-red-500/40 backdrop-blur-md border border-red-500/50 text-white text-sm font-semibold rounded-lg transition-all flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
                  Close Idea
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 px-6 py-4 rounded-r-xl mb-6 shadow-lg">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Trade Setup - Prominent Section */}
        <div className="bg-white dark:bg-[#161b22] rounded-xl shadow-md border border-gray-200 dark:border-[#30363d] overflow-hidden mb-6">
          <div className="bg-gray-100 dark:bg-[#1c2128] px-6 py-3.5 border-b border-gray-200 dark:border-[#30363d]">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <TargetIcon size={24} />
                Trade Setup & Levels
              </h2>
              <button
                onClick={() => {
                  setTradeDetails({
                    ...tradeDetails,
                    entryPrice: idea.entryPrice.toString(),
                  });
                  setShowTradeModal(true);
                }}
                className="px-5 py-2 bg-white hover:bg-gray-50 dark:bg-[#30363d] dark:hover:bg-[#3e4651] text-gray-900 dark:text-white font-semibold rounded-lg transition-all shadow-sm text-sm"
              >
                Add to Portfolio
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

        {/* Discussion Section */}
        <div id="comments" className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-2xl shadow-md p-6 md:p-8 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-300 to-purple-300 dark:from-indigo-500 dark:to-purple-500 rounded-xl flex items-center justify-center">
              <FontAwesomeIcon icon={faComments} className="w-6 h-6 text-gray-900 dark:text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Discussion</h2>
              <p className="text-sm text-gray-600 dark:text-[#8b949e]">{comments.length} comments</p>
            </div>
          </div>

          <form onSubmit={handleAddComment} className="mb-6">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#1c2128] dark:to-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-xl p-4">
              <textarea
                placeholder="Share your thoughts on this trade idea..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={4}
                className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-[#8b949e] outline-none focus:ring-2 focus:ring-[#ff8c42] focus:border-transparent transition-all resize-none mb-3"
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 dark:text-[#8b949e]">Be respectful and constructive</span>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#ff8c42] hover:bg-[#ff9a58] text-white font-semibold py-2.5 px-8 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faPaperPlane} className="w-4 h-4" />
                  Post Comment
                </button>
              </div>
            </div>
          </form>

          {comments.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 dark:bg-[#1c2128] rounded-full mx-auto mb-4 flex items-center justify-center">
                <FontAwesomeIcon icon={faComments} className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-600 dark:text-[#8b949e] font-medium">No comments yet</p>
              <p className="text-gray-500 dark:text-[#6e7681] text-sm mt-1">Be the first to share your thoughts!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-gradient-to-br from-gray-50 to-white dark:from-[#1c2128] dark:to-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#ff8c42] flex items-center justify-center text-white font-bold flex-shrink-0">
                      {comment.userName?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{comment.userName || 'Trader'}</span>
                        <span className="text-xs text-gray-500 dark:text-[#6e7681]">•</span>
                        <span className="text-xs text-gray-500 dark:text-[#6e7681]">
                          {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Just now'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-[#c9d1d9] leading-relaxed">{comment.text}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs pl-14">
                    <button
                      onClick={() => setReplyingTo(comment.id)}
                      className="text-gray-600 dark:text-[#8b949e] hover:text-[#ff8c42] dark:hover:text-[#ff8c42] transition-colors font-medium flex items-center gap-1"
                    >
                      <FontAwesomeIcon icon={faReply} className="w-3.5 h-3.5" />
                      Reply
                    </button>
                  </div>

                  {replyingTo === comment.id && (
                    <div className="mt-4 pl-14">
                      <div className="bg-gray-50 dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-3">
                        <textarea
                          placeholder={`Reply to ${comment.userName}...`}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          rows={3}
                          className="w-full bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:ring-2 focus:ring-[#ff8c42] focus:border-transparent transition-all resize-none mb-3"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReply(comment.id)}
                            disabled={loading}
                            className="bg-[#ff8c42] hover:bg-[#ff9a58] text-white text-sm font-semibold py-2 px-5 rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            Reply
                          </button>
                          <button
                            onClick={() => { setReplyingTo(null); setReplyText(''); }}
                            className="bg-gray-200 dark:bg-[#30363d] hover:bg-gray-300 dark:hover:bg-[#3c444d] text-gray-700 dark:text-white text-sm font-semibold py-2 px-5 rounded-lg transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Trade Modal */}
        {showTradeModal && (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
            onClick={() => setShowTradeModal(false)}
          >
            <div
              className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-6 w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Add Trade to Portfolio</h3>
                <button
                  onClick={() => setShowTradeModal(false)}
                  className="text-gray-600 dark:text-[#8b949e] hover:text-gray-900 dark:text-white transition-colors text-2xl"
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
                    By default, position will exit at Stop Loss (₹{idea?.stopLoss}) or Target (₹{idea?.target1})
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
                  onClick={() => setShowTradeModal(false)}
                  className="flex-1 bg-[#30363d] hover:bg-[#3e4651] text-gray-900 dark:text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTakeTrade}
                  disabled={loading}
                  className="flex-1 bg-[#ff8c42] hover:bg-[#ff9a58] text-gray-900 dark:text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Add to Portfolio
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Idea Modal */}
        {showEditModal && editFormData && (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
            onClick={() => setShowEditModal(false)}
          >
            <div
              className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit Idea</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-600 dark:text-[#8b949e] hover:text-gray-900 dark:text-white transition-colors text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, title: e.target.value })
                    }
                    className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-2">
                    Analysis
                  </label>
                  <textarea
                    value={editFormData.analysis}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, analysis: e.target.value })
                    }
                    rows={6}
                    className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-2">
                    Status
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, status: e.target.value })
                    }
                    className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none focus:border-[#ff8c42] transition-colors"
                  >
                    <option value="cooking">Cooking (Draft - Not public)</option>
                    <option value="active">Active (Public - Looking for entry)</option>
                    <option value="TRIGGERED">Triggered (Entry taken)</option>
                    <option value="PROFIT_BOOKED">Profit Booked (Target hit)</option>
                    <option value="STOP_LOSS">Stop Loss (SL hit)</option>
                    <option value="expired">Expired (Entry never hit)</option>
                    <option value="cancelled">Cancelled (Closed by owner)</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500 dark:text-[#6e7681]">
                    Change the status based on your trade progress
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-2">
                      Entry Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.entryPrice}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, entryPrice: parseFloat(e.target.value) })
                      }
                      className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-2">
                      Target 1
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.target1}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, target1: parseFloat(e.target.value) })
                      }
                      className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-2">
                      Stop Loss
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.stopLoss}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, stopLoss: parseFloat(e.target.value) })
                      }
                      className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-[#30363d] hover:bg-[#3e4651] text-gray-900 dark:text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditIdea}
                  disabled={loading}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-gray-900 dark:text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
