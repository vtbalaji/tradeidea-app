'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { useTrading } from '../../contexts/TradingContext';
import Navigation from '../../components/Navigation';
import { db as firestore } from '@/lib/firebase';
import { collection, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { apiClient } from '@/lib/apiClient';

export default function ProfilePage() {
  const router = useRouter();
  const { user, userData, updateUserProfile, logout } = useAuth();
  // Note: Portfolio management moved to dedicated portfolio page
  // const { myPortfolio, exitTrade } = useTrading();
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
  const [testNotifLoading, setTestNotifLoading] = useState(false);

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

  const handleTestNotification = async () => {
    setTestNotifLoading(true);
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user?.getIdToken()}`,
        },
        body: JSON.stringify({
          type: 'test',
          message: 'Test notification created successfully! 🎉 The notification system is working.',
        }),
      });
      setMessage('✅ Test notification created! Check the notification bell in the navigation bar.');
    } catch (error) {
      console.error('Error creating test notification:', error);
      setMessage('❌ Error creating test notification');
    } finally {
      setTestNotifLoading(false);
    }
  };

  const handleClearPortfolio = async () => {
    if (!user) return;

    setIsClearing(true);
    try {
      // Fetch all open positions from API
      const response = await apiClient.portfolio.list();
      const openPositions = response.positions.filter((p: any) => p.status === 'open');

      if (openPositions.length === 0) {
        setMessage('No positions to close');
        setShowClearConfirmModal(false);
        setIsClearing(false);
        return;
      }

      // Get current date in DD-MM-YYYY format
      const today = new Date();
      const exitDate = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;

      // Close each position using the API
      let closedCount = 0;
      const token = await user.getIdToken();

      for (const position of openPositions) {
        try {
          const response = await fetch(`/api/portfolio/${position.id}/close`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              exitPrice: position.currentPrice || position.entryPrice,
              exitDate,
              exitReason: 'Portfolio cleared from profile',
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error(`Failed to close position ${position.symbol}:`, errorData);
            continue;
          }

          closedCount++;
        } catch (error) {
          console.error(`Failed to close position ${position.symbol}:`, error);
        }
      }

      setShowClearConfirmModal(false);
      setMessage(`Successfully closed ${closedCount} of ${openPositions.length} position${openPositions.length !== 1 ? 's' : ''} at current LTP`);

      // Reload page to refresh data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error clearing portfolio:', error);
      setMessage('Error: Failed to clear portfolio');
    } finally {
      setIsClearing(false);
    }
  };

  const [openPositionsCount, setOpenPositionsCount] = useState(0);

  // Fetch open positions count
  useEffect(() => {
    const fetchPositionsCount = async () => {
      try {
        const response = await apiClient.portfolio.list();
        const count = response.positions.filter((p: any) => p.status === 'open').length;
        setOpenPositionsCount(count);
      } catch (error) {
        console.error('Error fetching positions count:', error);
        setOpenPositionsCount(0);
      }
    };

    if (user) {
      fetchPositionsCount();
    }
  }, [user]);

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
          <div className="bg-gradient-to-r from-[#ff8c42] to-[#ff6b1a] p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white flex items-center justify-center text-4xl sm:text-5xl">
                👤
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {userData?.displayName || user?.email?.split('@')[0] || 'Trader'}
                </h2>
                <p className="text-sm sm:text-base text-gray-900 dark:text-white/80 break-all">{user?.email}</p>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full sm:w-auto px-6 py-2 bg-white/20 hover:bg-white/30 text-gray-900 dark:text-white rounded-lg border border-white/30 transition-colors"
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
            <div className="text-gray-600 dark:text-[#8b949e] text-sm font-semibold mb-3">Portfolio Accounts</div>
            <Link
              href="/accounts"
              className="inline-block bg-[#ff8c42] hover:bg-[#ff9a58] text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              👥 Manage Accounts
            </Link>
          </div>
        </div>

        {/* Test Notification Section */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-900/30 overflow-hidden">
          <div className="p-6">
            <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-2">🔔 Test Notifications</h3>
            <p className="text-blue-600 dark:text-blue-400/80 text-sm mb-4">
              Test the notification system to ensure it's working properly after the API migration.
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-white dark:bg-[#1c2128] border border-blue-200 dark:border-blue-900/30 rounded-lg">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Create Test Notification</h4>
                <p className="text-sm text-gray-600 dark:text-[#8b949e]">
                  Click to create a dummy notification and verify the notification bell is working
                </p>
              </div>
              <button
                onClick={handleTestNotification}
                disabled={testNotifLoading}
                className="w-full sm:w-auto px-6 py-3 sm:py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testNotifLoading ? 'Creating...' : '🧪 Test Notification'}
              </button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="mt-8 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-900/30 overflow-hidden">
          <div className="p-6">
            <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">⚠️ Danger Zone</h3>
            <p className="text-red-600 dark:text-red-400/80 text-sm mb-4">
              Actions in this section are permanent and cannot be undone.
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-white dark:bg-[#1c2128] border border-red-200 dark:border-red-900/30 rounded-lg">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Clear Portfolio</h4>
                <p className="text-sm text-gray-600 dark:text-[#8b949e]">
                  Close all open positions at current LTP ({openPositionsCount} position{openPositionsCount !== 1 ? 's' : ''})
                </p>
              </div>
              <button
                onClick={() => setShowClearConfirmModal(true)}
                disabled={openPositionsCount === 0}
                className="w-full sm:w-auto px-6 py-3 sm:py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
