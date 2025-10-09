'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useTrading } from '../../contexts/TradingContext';
import Navigation from '../../components/Navigation';
import { db as firestore } from '@/lib/firebase';
import { collection, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export default function ProfilePage() {
  const router = useRouter();
  const { user, userData, updateUserProfile, logout } = useAuth();
  const { myPortfolio, exitTrade } = useTrading();
  const [isEditing, setIsEditing] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Check email verification
  useEffect(() => {
    if (user && !user.emailVerified) {
      router.push('/verify');
    }
  }, [user, router]);
  const [formData, setFormData] = useState({
    displayName: userData?.displayName || '',
    email: user?.email || '',
    bio: userData?.bio || '',
    tradingExperience: userData?.tradingExperience || '',
    favoriteStrategies: userData?.favoriteStrategies || '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    try {
      await updateUserProfile({
        displayName: formData.displayName,
        bio: formData.bio,
        tradingExperience: formData.tradingExperience,
        favoriteStrategies: formData.favoriteStrategies,
      });
      setMessage('Profile updated successfully!');
      setIsEditing(false);
    } catch (error: any) {
      setMessage('Error updating profile: ' + error.message);
    }
    setLoading(false);
  };

  const handleClearPortfolio = async () => {
    if (!user) return;

    setIsClearing(true);
    try {
      // Filter to only current user's open positions
      const openPositions = myPortfolio.filter(p =>
        p.status === 'open' && p.userId === user.uid
      );

      if (openPositions.length === 0) {
        setMessage('No positions to close');
        setShowClearConfirmModal(false);
        setIsClearing(false);
        return;
      }

      // Get current date in DD-MM-YYYY format
      const today = new Date();
      const exitDate = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;

      // Use exitTrade function from TradingContext for each position
      for (const position of openPositions) {
        await exitTrade(
          position.id,
          position.currentPrice, // Use LTP as exit price
          exitDate,
          'Portfolio cleared from profile'
        );
      }

      setShowClearConfirmModal(false);
      setMessage(`Successfully closed ${openPositions.length} position${openPositions.length !== 1 ? 's' : ''} at current LTP`);
    } catch (error) {
      console.error('Error clearing portfolio:', error);
      setMessage('Error: Failed to clear portfolio');
    } finally {
      setIsClearing(false);
    }
  };

  const openPositionsCount = myPortfolio.filter(p => p.status === 'open').length;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1419]">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Profile Settings</h1>
          <p className="text-gray-600 dark:text-[#8b949e]">Manage your account and trading preferences</p>
        </div>

        {/* Profile Card */}
        <div className="bg-gray-50 dark:bg-[#1c2128] rounded-xl border border-gray-200 dark:border-[#30363d] overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-[#ff8c42] to-[#ff6b1a] p-8">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-5xl">
                👤
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {userData?.displayName || user?.email?.split('@')[0] || 'Trader'}
                </h2>
                <p className="text-gray-900 dark:text-white/80">{user?.email}</p>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-2 bg-white/20 hover:bg-white/30 text-gray-900 dark:text-white rounded-lg border border-white/30 transition-colors"
                >
                  ✏️ Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-8">
            {message && (
              <div className={`mb-6 px-4 py-3 rounded-lg ${
                message.includes('Error')
                  ? 'bg-red-900/20 border border-red-500 text-red-500'
                  : 'bg-green-900/20 border border-green-500 text-green-500'
              }`}>
                {message}
              </div>
            )}

            {/* Display Name */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-600 dark:text-[#8b949e] mb-2">
                Display Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-4 py-3 text-gray-900 dark:text-white outline-none focus:border-[#ff8c42] transition-colors"
                  placeholder="Enter your display name"
                />
              ) : (
                <p className="text-gray-900 dark:text-white text-lg">
                  {userData?.displayName || 'Not set'}
                </p>
              )}
            </div>

            {/* Email (Read-only) */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-600 dark:text-[#8b949e] mb-2">
                Email Address
              </label>
              <p className="text-gray-900 dark:text-white text-lg">{user?.email}</p>
            </div>

            {/* Bio */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-600 dark:text-[#8b949e] mb-2">
                Bio
              </label>
              {isEditing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-4 py-3 text-gray-900 dark:text-white outline-none focus:border-[#ff8c42] transition-colors min-h-[100px]"
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className="text-gray-900 dark:text-white text-lg">
                  {userData?.bio || 'No bio added yet'}
                </p>
              )}
            </div>

            {/* Trading Experience */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-600 dark:text-[#8b949e] mb-2">
                Trading Experience
              </label>
              {isEditing ? (
                <select
                  value={formData.tradingExperience}
                  onChange={(e) => setFormData({ ...formData, tradingExperience: e.target.value })}
                  className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-4 py-3 text-gray-900 dark:text-white outline-none focus:border-[#ff8c42] transition-colors"
                >
                  <option value="">Select experience level</option>
                  <option value="beginner">Beginner (0-1 years)</option>
                  <option value="intermediate">Intermediate (1-3 years)</option>
                  <option value="advanced">Advanced (3-5 years)</option>
                  <option value="expert">Expert (5+ years)</option>
                </select>
              ) : (
                <p className="text-gray-900 dark:text-white text-lg capitalize">
                  {userData?.tradingExperience || 'Not specified'}
                </p>
              )}
            </div>

            {/* Favorite Strategies */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-600 dark:text-[#8b949e] mb-2">
                Favorite Trading Strategies
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.favoriteStrategies}
                  onChange={(e) => setFormData({ ...formData, favoriteStrategies: e.target.value })}
                  className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-4 py-3 text-gray-900 dark:text-white outline-none focus:border-[#ff8c42] transition-colors"
                  placeholder="e.g., Swing Trading, Day Trading, Options"
                />
              ) : (
                <p className="text-gray-900 dark:text-white text-lg">
                  {userData?.favoriteStrategies || 'Not specified'}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 bg-[#ff8c42] hover:bg-[#ff9a58] text-gray-900 dark:text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : '💾 Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      displayName: userData?.displayName || '',
                      email: user?.email || '',
                      bio: userData?.bio || '',
                      tradingExperience: userData?.tradingExperience || '',
                      favoriteStrategies: userData?.favoriteStrategies || '',
                    });
                    setMessage('');
                  }}
                  className="px-6 py-3 bg-[#30363d] hover:bg-[#3d444d] text-gray-900 dark:text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Account Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-gray-50 dark:bg-[#1c2128] rounded-xl border border-gray-200 dark:border-[#30363d] p-6">
            <div className="text-gray-600 dark:text-[#8b949e] text-sm font-semibold mb-1">Member Since</div>
            <div className="text-gray-900 dark:text-white text-2xl font-bold">
              {userData?.createdAt?.toDate ?
                new Date(userData.createdAt.toDate()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                : 'Recently'
              }
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-[#1c2128] rounded-xl border border-gray-200 dark:border-[#30363d] p-6">
            <div className="text-gray-600 dark:text-[#8b949e] text-sm font-semibold mb-1">Trading Ideas</div>
            <div className="text-gray-900 dark:text-white text-2xl font-bold">0</div>
          </div>

          <div className="bg-gray-50 dark:bg-[#1c2128] rounded-xl border border-gray-200 dark:border-[#30363d] p-6">
            <div className="text-gray-600 dark:text-[#8b949e] text-sm font-semibold mb-1">Followers</div>
            <div className="text-gray-900 dark:text-white text-2xl font-bold">0</div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="mt-8 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-900/30 overflow-hidden">
          <div className="p-6">
            <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">⚠️ Danger Zone</h3>
            <p className="text-red-600 dark:text-red-400/80 text-sm mb-4">
              Actions in this section are permanent and cannot be undone.
            </p>

            <div className="flex items-center justify-between p-4 bg-white dark:bg-[#1c2128] border border-red-200 dark:border-red-900/30 rounded-lg">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Clear Portfolio</h4>
                <p className="text-sm text-gray-600 dark:text-[#8b949e]">
                  Close all open positions at current LTP ({openPositionsCount} position{openPositionsCount !== 1 ? 's' : ''})
                </p>
              </div>
              <button
                onClick={() => setShowClearConfirmModal(true)}
                disabled={openPositionsCount === 0}
                className="ml-4 px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear Portfolio
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Clear Portfolio Confirmation Modal */}
      {showClearConfirmModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setShowClearConfirmModal(false)}
        >
          <div
            className="bg-white dark:bg-[#1c2128] border border-red-500 rounded-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="text-5xl">⚠️</div>
              <div>
                <h3 className="text-xl font-bold text-red-500 mb-2">Clear Portfolio?</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  This will close <strong>{openPositionsCount} open position{openPositionsCount !== 1 ? 's' : ''}</strong> at current LTP (Last Traded Price).
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                  Exit Reason: "Portfolio cleared from profile"
                </p>
                <p className="text-red-600 dark:text-red-400 font-semibold mt-2">
                  Positions will be moved to Closed tab.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirmModal(false)}
                disabled={isClearing}
                className="flex-1 bg-gray-100 dark:bg-[#30363d] hover:bg-gray-200 dark:hover:bg-[#3c444d] text-gray-900 dark:text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleClearPortfolio}
                disabled={isClearing}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {isClearing ? 'Closing Positions...' : 'Yes, Close All Positions'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
