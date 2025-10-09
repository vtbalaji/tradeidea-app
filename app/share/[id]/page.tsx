'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { IdeaIcon, TargetIcon, EntryIcon } from '@/components/icons';

export default function PublicIdeaSharePage() {
  const params = useParams();
  const router = useRouter();
  const ideaId = params.id as string;
  const [idea, setIdea] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchIdea();
    fetchComments();
  }, [ideaId]);

  const fetchIdea = async () => {
    try {
      const ideaRef = doc(db, 'tradingIdeas', ideaId);
      const ideaDoc = await getDoc(ideaRef);

      if (ideaDoc.exists()) {
        setIdea({
          id: ideaDoc.id,
          ...ideaDoc.data()
        });
      } else {
        setError('Idea not found');
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching idea:', err);
      setError('Failed to load idea');
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const commentsRef = collection(db, 'comments');
      const q = query(
        commentsRef,
        where('ideaId', '==', ideaId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComments(commentsData);
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0f1419] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-[#ff8c42] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 dark:text-[#8b949e] text-lg">Loading idea...</p>
        </div>
      </div>
    );
  }

  if (error || !idea) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0f1419] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Idea Not Found</h1>
          <p className="text-gray-600 dark:text-[#8b949e]">{error || 'This trading idea does not exist or has been removed.'}</p>
        </div>
      </div>
    );
  }

  const target1Percent = idea.entryPrice
    ? (((idea.target1 - idea.entryPrice) / idea.entryPrice) * 100).toFixed(2)
    : 0;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1419]">
      {/* Header with Logo and Login */}
      <div className="bg-gray-50 dark:bg-[#1c2128] border-b border-gray-200 dark:border-[#30363d] px-5 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">TradeIdea</span>
            <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs font-semibold rounded">Public Share</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 bg-gray-200 dark:bg-[#30363d] hover:bg-gray-300 dark:hover:bg-[#3e4651] text-gray-900 dark:text-white text-sm font-semibold rounded-lg transition-colors"
            >
              📋 Copy Link
            </button>
            <button
              onClick={handleLogin}
              className="px-4 py-2 bg-[#ff8c42] hover:bg-[#ff9a58] text-gray-900 dark:text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Sign In to Comment
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-5">
        {/* Header */}
        <div className="mb-5">
          <div className="mb-5">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{idea.symbol}</h1>
              <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-sm font-semibold rounded">
                {idea.status}
              </span>
              <IdeaIcon size={24} />
            </div>
            <p className="text-sm text-gray-600 dark:text-[#8b949e]">
              Shared by {idea.userName || 'Anonymous'} · {idea.createdAt?.toDate ? idea.createdAt.toDate().toLocaleDateString() : 'Recently'}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              disabled
              className="px-3 py-1.5 bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg text-gray-900 dark:text-white text-sm flex items-center gap-1.5 opacity-60 cursor-not-allowed"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 14s-6-4.5-6-8c0-2.5 2-4 4-4 1.5 0 2 1 2 1s.5-1 2-1c2 0 4 1.5 4 4 0 3.5-6 8-6 8z"/>
              </svg>
              {idea.likes || 0} likes
            </button>
          </div>
        </div>

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

            {/* CTA to sign in */}
            <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 rounded-lg p-4 mt-4">
              <p className="text-sm text-orange-900 dark:text-orange-400 text-center mb-3">
                💡 Want to track this idea in your portfolio?
              </p>
              <button
                onClick={handleLogin}
                className="w-full bg-[#ff8c42] hover:bg-[#ff9a58] text-gray-900 dark:text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Sign In to Add to Portfolio
              </button>
            </div>
          </div>
        </div>

        {/* Discussion Section */}
        <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-5">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">💬 Discussion ({comments.length})</h3>

          <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 rounded-lg p-4 mb-4">
            <p className="text-sm text-orange-900 dark:text-orange-400 text-center">
              🔒 Sign in to join the discussion and share your thoughts
            </p>
          </div>

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
              <p className="text-sm text-[#c9d1d9]">{comment.text}</p>
            </div>
          ))}

          {comments.length === 0 && (
            <p className="text-center text-gray-600 dark:text-[#8b949e] py-8">
              No comments yet. Be the first to comment!
            </p>
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
