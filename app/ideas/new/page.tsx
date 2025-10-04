'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../../../components/Navigation';
import { useTrading } from '../../../contexts/TradingContext';
import { useAuth } from '../../../contexts/AuthContext';
import { TargetIcon, SparklesIcon } from '@/components/icons';

export default function ShareIdeaPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { createIdea } = useTrading();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check email verification
  useEffect(() => {
    if (user && !user.emailVerified) {
      router.push('/verify');
    }
  }, [user, router]);

  const [formData, setFormData] = useState({
    symbol: '',
    analysis: '',
    visibility: 'public',
    timeframe: 'short term',
    riskLevel: 'medium',
    entryPrice: '',
    stopLoss: '',
    target1: '',
    target2: '',
    target3: '',
    analysisType: 'both',
    tags: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.symbol || !formData.analysis || !formData.entryPrice || !formData.target1 || !formData.stopLoss) {
      setError('Please fill in all required fields');
      return;
    }

    // Price validation
    const entryPrice = parseFloat(formData.entryPrice);
    const stopLoss = parseFloat(formData.stopLoss);
    const target1 = parseFloat(formData.target1);
    const target2 = formData.target2 ? parseFloat(formData.target2) : null;
    const target3 = formData.target3 ? parseFloat(formData.target3) : null;

    // Basic validation - assuming long positions
    if (entryPrice <= stopLoss) {
      setError('Entry Price must be greater than Stop Loss');
      return;
    }
    if (target1 <= entryPrice) {
      setError('Target 1 must be greater than Entry Price');
      return;
    }
    if (target2 && target2 <= target1) {
      setError('Target 2 must be greater than Target 1');
      return;
    }
    if (target3 && target2 && target3 <= target2) {
      setError('Target 3 must be greater than Target 2');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const ideaData = {
        symbol: formData.symbol.toUpperCase(),
        title: `${formData.symbol.toUpperCase()} Trade Idea`,
        analysis: formData.analysis,
        visibility: formData.visibility,
        timeframe: formData.timeframe,
        riskLevel: formData.riskLevel,
        entryPrice,
        stopLoss,
        target1,
        target2,
        target3,
        analysisType: formData.analysisType,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        status: 'cooking',
      };

      await createIdea(ideaData);
      router.push('/ideas');
    } catch (error: any) {
      setError(error.message || 'Failed to create idea');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1419]">
      <Navigation />

      {/* Header */}
      <div className="p-5 pt-8 pb-5 border-b border-gray-200 dark:border-[#30363d]">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Share Trading Idea</h1>
        <p className="text-gray-600 dark:text-[#8b949e]">Create a detailed trading recommendation</p>
      </div>

      {/* Form Container - Fully Scrollable */}
      <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-5">
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-5 pb-8">
          {/* Error Message */}
          {error && (
            <div className="bg-red-900/20 border border-red-500 text-red-500 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-5">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5">Basic Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 dark:text-[#8b949e] mb-2">Stock Symbol *</label>
                <input
                  type="text"
                  placeholder="e.g., RELIANCE, HDFCBANK"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-3 text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 dark:text-[#8b949e] mb-2">Visibility</label>
                <div className="flex bg-white dark:bg-[#0f1419] rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, visibility: 'public' })}
                    className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${
                      formData.visibility === 'public'
                        ? 'bg-[#30363d] text-gray-900 dark:text-white'
                        : 'text-gray-600 dark:text-[#8b949e]'
                    }`}
                  >
                    Public
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, visibility: 'private' })}
                    className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${
                      formData.visibility === 'private'
                        ? 'bg-[#30363d] text-gray-900 dark:text-white'
                        : 'text-gray-600 dark:text-[#8b949e]'
                    }`}
                  >
                    Private
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 dark:text-[#8b949e] mb-2">Analysis & Rationale *</label>
              <textarea
                placeholder="Provide detailed analysis, reasoning, and research behind this trade idea..."
                value={formData.analysis}
                onChange={(e) => setFormData({ ...formData, analysis: e.target.value })}
                rows={8}
                className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors resize-y leading-relaxed"
              />
              <p className="text-xs text-gray-600 dark:text-[#8b949e] mt-1">{formData.analysis.length} characters</p>
            </div>
          </div>

          {/* Trade Details */}
          <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-5">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2"><TargetIcon size={24} /> Trade Details</h2>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 dark:text-[#8b949e] mb-2">Timeframe</label>
                <div className="flex gap-2">
                  {["short term", "long term"].map((tf) => (
                    <button
                      key={tf}
                      type="button"
                      onClick={() => setFormData({ ...formData, timeframe: tf })}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-colors ${
                        formData.timeframe === tf
                          ? "bg-[#ff8c42] text-gray-900 dark:text-white border-[#ff8c42]"
                          : "bg-white dark:bg-[#0f1419] text-gray-600 dark:text-[#8b949e] border-gray-200 dark:border-[#30363d]"
                      } border`}
                    >
                      {tf.charAt(0).toUpperCase() + tf.slice(1)}
                    </button>
                  ))}
                </div>
              </div>


              <div>
                <label className="block text-sm font-semibold text-gray-600 dark:text-[#8b949e] mb-2">Risk Level</label>
                <div className="flex gap-2">
                  {['low', 'medium', 'high'].map((risk) => (
                    <button
                      key={risk}
                      type="button"
                      onClick={() => setFormData({ ...formData, riskLevel: risk })}
                      className={`flex-1 py-2 px-2 rounded-md text-xs font-semibold transition-colors ${
                        formData.riskLevel === risk
                          ? 'bg-[#ff8c42] text-gray-900 dark:text-white border-[#ff8c42]'
                          : 'bg-white dark:bg-[#0f1419] text-gray-600 dark:text-[#8b949e] border-gray-200 dark:border-[#30363d]'
                      } border`}
                    >
                      {risk.charAt(0).toUpperCase() + risk.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 dark:text-[#8b949e] mb-2">Entry Price *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.entryPrice}
                  onChange={(e) => setFormData({ ...formData, entryPrice: e.target.value })}
                  className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-3 text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 dark:text-[#8b949e] mb-2">Stop Loss *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.stopLoss}
                  onChange={(e) => setFormData({ ...formData, stopLoss: e.target.value })}
                  className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-3 text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 dark:text-[#8b949e] mb-2">Target Prices</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Target 1 *"
                  value={formData.target1}
                  onChange={(e) => setFormData({ ...formData, target1: e.target.value })}
                  className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-3 text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Target 2 (optional)"
                  value={formData.target2}
                  onChange={(e) => setFormData({ ...formData, target2: e.target.value })}
                  className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-3 text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Target 3 (optional)"
                  value={formData.target3}
                  onChange={(e) => setFormData({ ...formData, target3: e.target.value })}
                  className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-3 text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-5">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2"><SparklesIcon size={24} /> Additional Details</h2>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-600 dark:text-[#8b949e] mb-2">Analysis Type</label>
              <div className="flex gap-2">
                {['technical', 'fundamental', 'both'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, analysisType: type })}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-colors ${
                      formData.analysisType === type
                        ? 'bg-[#ff8c42] text-gray-900 dark:text-white border-[#ff8c42]'
                        : 'bg-white dark:bg-[#0f1419] text-gray-600 dark:text-[#8b949e] border-gray-200 dark:border-[#30363d]'
                    } border`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 dark:text-[#8b949e] mb-2">Tags (up to 5)</label>
              <input
                type="text"
                placeholder="e.g., energy, tech, growth (comma separated)"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-3 text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#ff8c42] hover:bg-[#ff9a58] text-gray-900 dark:text-white font-bold py-4 px-4 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Idea...' : 'Publish Trading Idea'}
          </button>
        </form>
      </div>
    </div>
  );
}
