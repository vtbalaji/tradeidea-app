'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '../../../components/Navigation';
import { useTrading } from '../../../contexts/TradingContext';
import { useAuth } from '../../../contexts/AuthContext';
import { IdeaIcon, TargetIcon, EntryIcon, HeartIcon, EyeIcon } from '@/components/icons';

export default function IdeaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ideaId = params.id as string;
  const { ideas, toggleLike, toggleFollow, addComment, getComments, addToPortfolio, updateIdea, deleteIdea } = useTrading();
  const { user } = useAuth();
  const [idea, setIdea] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [tradeDetails, setTradeDetails] = useState({
    quantity: '',
    entryPrice: '',
    dateTaken: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
  });

  useEffect(() => {
    const foundIdea = ideas.find(i => i.id === ideaId);
    setIdea(foundIdea);

    if (foundIdea) {
      loadComments();
    }
  }, [ideaId, ideas]);

  const loadComments = async () => {
    try {
      const commentsData = await getComments(ideaId);
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleLike = async () => {
    try {
      await toggleLike(ideaId);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleFollow = async () => {
    try {
      await toggleFollow(ideaId);
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
        symbol: idea.symbol,
        tradeType: idea.tradeType,
        entryPrice: entryPrice,
        currentPrice: entryPrice,
        target1: idea.target1,
        stopLoss: idea.stopLoss,
        quantity: quantity,
        totalValue: entryPrice * quantity,
        dateTaken: tradeDetails.dateTaken,
      };

      await addToPortfolio(ideaId, positionData);
      setShowTradeModal(false);
      setTradeDetails({
        quantity: '',
        entryPrice: '',
        dateTaken: new Date().toISOString().split('T')[0],
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
    if (!confirm('Are you sure you want to delete this idea?')) return;

    setLoading(true);
    try {
      await deleteIdea(ideaId);
      router.push('/ideas');
    } catch (error: any) {
      setError(error.message);
    }
    setLoading(false);
  };

  const isOwner = user && idea && idea.userId === user.uid;

  if (!idea) {
    return (
      <div className="min-h-screen bg-[#0f1419]">
        <Navigation />
        <div className="text-center py-16">
          <p className="text-[#8b949e] text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  const target1Percent = idea.entryPrice
    ? (((idea.target1 - idea.entryPrice) / idea.entryPrice) * 100).toFixed(2)
    : 0;

  return (
    <div className="min-h-screen bg-[#0f1419]">
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
              <h1 className="text-4xl font-bold text-white">{idea.symbol}</h1>
              <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-sm font-semibold rounded">
                {idea.status}
              </span>
              <IdeaIcon size={24} />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleLike}
              className="px-3 py-1.5 bg-[#1c2128] hover:bg-[#30363d] border border-[#30363d] rounded-lg text-white text-sm flex items-center gap-1.5 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 14s-6-4.5-6-8c0-2.5 2-4 4-4 1.5 0 2 1 2 1s.5-1 2-1c2 0 4 1.5 4 4 0 3.5-6 8-6 8z"/>
              </svg>
              {idea.likes || 0}
            </button>
            <button
              onClick={handleFollow}
              className="px-3 py-1.5 bg-[#1c2128] hover:bg-[#30363d] border border-[#30363d] rounded-lg text-white text-sm flex items-center gap-1.5 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M1 8s2-4 7-4 7 4 7 4-2 4-7 4-7-4-7-4z"/>
                <circle cx="8" cy="8" r="2"/>
              </svg>
              {idea.followers?.includes(user?.uid || '') ? 'Following' : 'Follow'}
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
                      stopLoss: idea.stopLoss,
                      status: idea.status
                    });
                    setShowEditModal(true);
                  }}
                  className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500 rounded-lg text-blue-400 text-sm transition-colors"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={handleDeleteIdea}
                  className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500 rounded-lg text-red-400 text-sm transition-colors"
                >
                  🗑️ Delete
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
        <div className="bg-[#1c2128] border border-[#30363d] rounded-xl p-5 mb-5">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-bold text-white">Analysis & Rationale</h3>
              <span className="px-3 py-1 bg-yellow-500/20 text-[#8b949e] text-sm font-semibold rounded-full">
                {idea.riskLevel} risk
              </span>
              <span className="px-3 py-1 bg-blue-500/20 text-[#8b949e] text-sm font-semibold rounded-full">
                {idea.timeframe}
              </span>
              <span className="px-3 py-1 bg-gray-500/20 text-[#8b949e] text-sm font-semibold rounded-full">
                {idea.analysisType}
              </span>
            </div>
            <span className="text-sm text-[#8b949e]">
              {idea.createdAt?.toDate ? idea.createdAt.toDate().toLocaleDateString() : 'Recent'}
            </span>
          </div>

          <div className="bg-[#0f1419] border border-[#30363d] rounded-lg p-4">
            <p className="text-base text-[#c9d1d9] leading-relaxed whitespace-pre-wrap">{idea.analysis}</p>
          </div>
        </div>

        {/* Trade Setup */}
        <div className="bg-[#1c2128] border border-[#30363d] rounded-xl p-5 mb-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
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
              className="bg-[#ff8c42] hover:bg-[#ff9a58] text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
            >
              ✅ I Took This Trade
            </button>
          </div>

          <div className="space-y-3">
            {/* Entry Price and Stop Loss on same line */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-500/10 rounded-lg p-3 border-l-4 border-blue-500">
                <span className="text-sm text-[#8b949e] flex items-center gap-2 mb-1">
                  <EntryIcon size={16} /> Entry Price
                </span>
                <span className="text-lg font-semibold text-white">₹{idea.entryPrice}</span>
              </div>

              <div className="bg-red-500/10 rounded-lg p-3 border-l-4 border-red-500">
                <span className="text-sm text-[#8b949e] flex items-center gap-2 mb-1">
                  <EntryIcon size={16} /> Stop Loss
                </span>
                <span className="text-lg font-semibold text-red-500">₹{idea.stopLoss}</span>
              </div>
            </div>

            {/* Targets on next line */}
            <div className="bg-green-500/10 rounded-lg p-3 border-l-4 border-green-500">
              <span className="text-sm text-[#8b949e] flex items-center gap-2 mb-1">
                <TargetIcon size={16} /> Targets
              </span>
              <div className="text-lg font-semibold text-green-500">
                ₹{idea.target1} <span className="text-sm">(+{target1Percent}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Discussion Section */}
        <div className="bg-[#1c2128] border border-[#30363d] rounded-xl p-5">
          <h3 className="text-xl font-bold text-white mb-4">💬 Discussion ({comments.length})</h3>

          <form onSubmit={handleAddComment} className="mb-5">
            <textarea
              placeholder="Share your thoughts on this trade idea..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={3}
              className="w-full bg-[#0f1419] border border-[#30363d] rounded-lg px-3 py-3 text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors resize-none mb-3"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-[#ff8c42] hover:bg-[#ff9a58] text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Post Comment
            </button>
          </form>

          {comments.map((comment) => (
            <div key={comment.id} className="bg-[#0f1419] rounded-lg p-4 mb-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-[#ff8c42] flex items-center justify-center text-white font-bold">
                  {comment.userName?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{comment.userName || 'Trader'}</div>
                  <div className="text-xs text-[#8b949e]">
                    {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleString() : 'Just now'}
                  </div>
                </div>
              </div>
              <p className="text-sm text-[#c9d1d9] mb-3">{comment.text}</p>
              <div className="flex gap-4 text-xs">
                <button onClick={() => setReplyingTo(comment.id)} className="text-[#8b949e] hover:text-white transition-colors">↩️ Reply</button>
              </div>

              {replyingTo === comment.id && (
                <div className="mt-3 pl-6 border-l-2 border-[#30363d]">
                  <textarea
                    placeholder={`Reply to ${comment.userName}...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={2}
                    className="w-full bg-[#1c2128] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors resize-none mb-2"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleReply(comment.id)} disabled={loading} className="bg-[#ff8c42] hover:bg-[#ff9a58] text-white text-xs font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-60">Reply</button>
                    <button onClick={() => { setReplyingTo(null); setReplyText(''); }} className="bg-[#30363d] hover:bg-[#3c444d] text-white text-xs font-semibold py-2 px-4 rounded-lg transition-colors">Cancel</button>
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
              className="bg-[#1c2128] border border-[#30363d] rounded-xl p-6 w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Add Trade to Portfolio</h3>
                <button
                  onClick={() => setShowTradeModal(false)}
                  className="text-[#8b949e] hover:text-white transition-colors text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Modal Body */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#8b949e] mb-2">
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
                    className="w-full bg-[#0f1419] border border-[#30363d] rounded-lg px-3 py-2 text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#8b949e] mb-2">
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
                    className="w-full bg-[#0f1419] border border-[#30363d] rounded-lg px-3 py-2 text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#8b949e] mb-2">
                    Date Taken
                  </label>
                  <input
                    type="date"
                    value={tradeDetails.dateTaken}
                    onChange={(e) =>
                      setTradeDetails({ ...tradeDetails, dateTaken: e.target.value })
                    }
                    className="w-full bg-[#0f1419] border border-[#30363d] rounded-lg px-3 py-2 text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowTradeModal(false)}
                  className="flex-1 bg-[#30363d] hover:bg-[#3e4651] text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTakeTrade}
                  disabled={loading}
                  className="flex-1 bg-[#ff8c42] hover:bg-[#ff9a58] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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
              className="bg-[#1c2128] border border-[#30363d] rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Edit Idea</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-[#8b949e] hover:text-white transition-colors text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#8b949e] mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, title: e.target.value })
                    }
                    className="w-full bg-[#0f1419] border border-[#30363d] rounded-lg px-3 py-2 text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#8b949e] mb-2">
                    Analysis
                  </label>
                  <textarea
                    value={editFormData.analysis}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, analysis: e.target.value })
                    }
                    rows={6}
                    className="w-full bg-[#0f1419] border border-[#30363d] rounded-lg px-3 py-2 text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors resize-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#8b949e] mb-2">
                      Entry Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.entryPrice}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, entryPrice: parseFloat(e.target.value) })
                      }
                      className="w-full bg-[#0f1419] border border-[#30363d] rounded-lg px-3 py-2 text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#8b949e] mb-2">
                      Target 1
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.target1}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, target1: parseFloat(e.target.value) })
                      }
                      className="w-full bg-[#0f1419] border border-[#30363d] rounded-lg px-3 py-2 text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#8b949e] mb-2">
                      Stop Loss
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.stopLoss}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, stopLoss: parseFloat(e.target.value) })
                      }
                      className="w-full bg-[#0f1419] border border-[#30363d] rounded-lg px-3 py-2 text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#8b949e] mb-2">
                    Status
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, status: e.target.value })
                    }
                    className="w-full bg-[#0f1419] border border-[#30363d] rounded-lg px-3 py-2 text-white outline-none focus:border-[#ff8c42] transition-colors"
                  >
                    <option value="active">Active</option>
                    <option value="hit target">Hit Target</option>
                    <option value="hit sl">Hit SL</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-[#30363d] hover:bg-[#3e4651] text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditIdea}
                  disabled={loading}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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
