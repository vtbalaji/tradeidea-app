'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '../../../components/Navigation';
import { useTrading } from '../../../contexts/TradingContext';
import { useAuth } from '../../../contexts/AuthContext';
import { IdeaIcon, TargetIcon, EntryIcon, HeartIcon, EyeIcon } from '@/components/icons';
import { getCurrentISTDate, formatDateForDisplay, formatDateForStorage } from '@/lib/dateUtils';
import { trackIdeaViewed, trackIdeaLiked, trackIdeaFollowed, trackPositionAdded } from '@/lib/analytics';

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

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1419]">
      <Navigation />

      <div className="max-w-5xl mx-auto p-5">
        {/* Header */}
        <div className="mb-5">
          <button
            onClick={() => router.back()}
            className="text-[#ff8c42] hover:text-[#ff9a58] mb-5 transition-colors"
          >
            ← Back
          </button>

          <div className="mb-5">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{idea.symbol}</h1>
              <IdeaIcon size={24} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleLike}
              className="px-3 py-1.5 bg-gray-50 dark:bg-[#1c2128] hover:bg-[#30363d] border border-gray-200 dark:border-[#30363d] rounded-lg text-gray-900 dark:text-white text-sm flex items-center gap-1.5 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 14s-6-4.5-6-8c0-2.5 2-4 4-4 1.5 0 2 1 2 1s.5-1 2-1c2 0 4 1.5 4 4 0 3.5-6 8-6 8z"/>
              </svg>
              {idea.likes || 0}
            </button>
            <button
              onClick={handleFollow}
              className="px-3 py-1.5 bg-gray-50 dark:bg-[#1c2128] hover:bg-[#30363d] border border-gray-200 dark:border-[#30363d] rounded-lg text-gray-900 dark:text-white text-sm flex items-center gap-1.5 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M1 8s2-4 7-4 7 4 7 4-2 4-7 4-7-4-7-4z"/>
                <circle cx="8" cy="8" r="2"/>
              </svg>
              {idea.followers?.includes(user?.uid || '') ? 'Following' : 'Follow'}
            </button>
            <button
              onClick={handleShare}
              className="px-3 py-1.5 bg-gray-100 dark:bg-[#30363d] hover:bg-gray-200 dark:hover:bg-[#3c444d] border border-gray-200 dark:border-[#444c56] text-gray-700 dark:text-gray-300 text-sm flex items-center gap-1.5 rounded-lg transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="4" cy="8" r="2"/>
                <circle cx="12" cy="4" r="2"/>
                <circle cx="12" cy="12" r="2"/>
                <path d="M5.5 7L10.5 5M5.5 9L10.5 11"/>
              </svg>
              Share
            </button>
            {isOwner && (
              <>
                <button
                  onClick={() => {
                    setEditFormData({
                      title: idea.title,
                      analysis: idea.analysis,
                      entryPrice: idea.entryPrice,
                      target1: idea.target1,
                      stopLoss: idea.stopLoss
                    });
                    setShowEditModal(true);
                  }}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-[#30363d] hover:bg-gray-200 dark:hover:bg-[#3c444d] border border-gray-200 dark:border-[#444c56] text-gray-700 dark:text-gray-300 text-sm flex items-center gap-1.5 rounded-lg transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={handleDeleteIdea}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-[#30363d] hover:bg-gray-200 dark:hover:bg-[#3c444d] border border-gray-200 dark:border-[#444c56] text-gray-700 dark:text-gray-300 text-sm flex items-center gap-1.5 rounded-lg transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Close
                </button>
              </>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-5">
            {error}
          </div>
        )}

        {/* Analysis Section */}
        <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-5 mb-5">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Analysis & Rationale</h3>
              <span className="px-3 py-1 bg-yellow-500/20 text-gray-600 dark:text-[#8b949e] text-sm font-semibold rounded-full">
                {idea.riskLevel} risk
              </span>
              <span className="px-3 py-1 bg-blue-500/20 text-gray-600 dark:text-[#8b949e] text-sm font-semibold rounded-full">
                {idea.timeframe}
              </span>
              <span className="px-3 py-1 bg-gray-500/20 text-gray-600 dark:text-[#8b949e] text-sm font-semibold rounded-full">
                {idea.analysisType}
              </span>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-sm text-gray-600 dark:text-[#8b949e]">
                {idea.createdAt?.toDate ? idea.createdAt.toDate().toLocaleDateString() : 'Recent'}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-[#8b949e]">
                <div className="w-4 h-4 rounded-full bg-[#ff8c42] flex items-center justify-center text-white text-[10px] font-bold">
                  {idea.userName?.charAt(0).toUpperCase() || '?'}
                </div>
                <span>{idea.userName || 'Anonymous'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4 mb-4">
            <p className="text-base text-[#c9d1d9] leading-relaxed whitespace-pre-wrap">{idea.analysis}</p>
          </div>

          {/* Entry/Exit Timing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {idea.whenToEnter && (
              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <div className="text-sm font-semibold text-[#ff8c42] mb-2">When to Enter</div>
                <p className="text-sm text-[#c9d1d9] leading-relaxed whitespace-pre-wrap">{idea.whenToEnter}</p>
              </div>
            )}
            {idea.whenToExit && (
              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <div className="text-sm font-semibold text-[#ff8c42] mb-2">When to Exit</div>
                <p className="text-sm text-[#c9d1d9] leading-relaxed whitespace-pre-wrap">{idea.whenToExit}</p>
              </div>
            )}
          </div>
        </div>

        {/* Trade Setup */}
        <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-5 mb-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <TargetIcon size={24} /> Trade Setup
            </h3>
            <button
              onClick={() => {
                setTradeDetails({
                  ...tradeDetails,
                  entryPrice: idea.entryPrice.toString(),
                });
                setShowTradeModal(true);
              }}
              className="bg-[#ff8c42] hover:bg-[#ff9a58] text-gray-900 dark:text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
            >
              Add to Portfolio
            </button>
          </div>

          <div className="space-y-3">
            {/* Entry Price and Stop Loss on same line */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-500/10 rounded-lg p-3 border-l-4 border-blue-500">
                <span className="text-sm text-gray-600 dark:text-[#8b949e] flex items-center gap-2 mb-1">
                  <EntryIcon size={16} /> Entry Price
                </span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">₹{idea.entryPrice}</span>
              </div>

              <div className="bg-red-500/10 rounded-lg p-3 border-l-4 border-red-500">
                <span className="text-sm text-gray-600 dark:text-[#8b949e] flex items-center gap-2 mb-1">
                  <EntryIcon size={16} /> Stop Loss
                </span>
                <span className="text-lg font-semibold text-red-500">₹{idea.stopLoss}</span>
              </div>
            </div>

            {/* Targets on next line */}
            <div className="bg-green-500/10 rounded-lg p-3 border-l-4 border-green-500">
              <span className="text-sm text-gray-600 dark:text-[#8b949e] flex items-center gap-2 mb-1">
                <TargetIcon size={16} /> Targets
              </span>
              <div className="text-lg font-semibold text-green-500">
                ₹{idea.target1} <span className="text-sm">(+{target1Percent}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Discussion Section */}
        <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-5">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">💬 Discussion ({comments.length})</h3>

          <form onSubmit={handleAddComment} className="mb-5">
            <textarea
              placeholder="Share your thoughts on this trade idea..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={3}
              className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-3 text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors resize-none mb-3"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-[#ff8c42] hover:bg-[#ff9a58] text-gray-900 dark:text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Post Comment
            </button>
          </form>

          {comments.map((comment) => (
            <div key={comment.id} className="bg-white dark:bg-[#0f1419] rounded-lg p-4 mb-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-[#ff8c42] flex items-center justify-center text-gray-900 dark:text-white font-bold">
                  {comment.userName?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">{comment.userName || 'Trader'}</div>
                  <div className="text-xs text-gray-600 dark:text-[#8b949e]">
                    {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleString() : 'Just now'}
                  </div>
                </div>
              </div>
              <p className="text-sm text-[#c9d1d9] mb-3">{comment.text}</p>
              <div className="flex gap-4 text-xs">
                <button onClick={() => setReplyingTo(comment.id)} className="text-gray-600 dark:text-[#8b949e] hover:text-gray-900 dark:text-white transition-colors">↩️ Reply</button>
              </div>

              {replyingTo === comment.id && (
                <div className="mt-3 pl-6 border-l-2 border-gray-200 dark:border-[#30363d]">
                  <textarea
                    placeholder={`Reply to ${comment.userName}...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={2}
                    className="w-full bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors resize-none mb-2"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleReply(comment.id)} disabled={loading} className="bg-[#ff8c42] hover:bg-[#ff9a58] text-gray-900 dark:text-white text-xs font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-60">Reply</button>
                    <button onClick={() => { setReplyingTo(null); setReplyText(''); }} className="bg-[#30363d] hover:bg-[#3c444d] text-gray-900 dark:text-white text-xs font-semibold py-2 px-4 rounded-lg transition-colors">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
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
