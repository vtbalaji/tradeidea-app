'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { SubscriptionBadge } from '@/components/subscription/SubscriptionBadge';
import { trackFeatureUsed } from '@/lib/analytics';

export default function SubscriptionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const {
    subscription,
    loading,
    isPremium,
    isFree,
    getExpiryInfo,
    getStatusDisplay,
  } = useSubscription();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Track subscription page view
  useEffect(() => {
    if (user) {
      trackFeatureUsed('subscription_page_viewed', isPremium ? 'premium' : 'free');
    }
  }, [user, router]);

  if (loading || !subscription) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {/* Simple Header */}
        <div className={`border-b ${isDarkMode ? 'bg-[#1c2128] border-[#30363d]' : 'bg-white border-gray-200'} px-6 py-4`}>
          <div className="max-w-4xl mx-auto">
            <Link href="/ideas" className="flex items-center gap-3">
              <Logo size={32} />
              <span className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                TradeIdea
              </span>
            </Link>
          </div>
        </div>
        <div className="flex items-center justify-center" style={{minHeight: 'calc(100vh - 73px)'}}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  const { isExpiring, daysRemaining, expiryDate } = getExpiryInfo();

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Simple Header */}
      <div className={`border-b ${isDarkMode ? 'bg-[#1c2128] border-[#30363d]' : 'bg-white border-gray-200'} px-6 py-4`}>
        <div className="max-w-4xl mx-auto">
          <Link href="/ideas" className="flex items-center gap-3">
            <Logo size={32} />
            <span className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              TradeIdea
            </span>
          </Link>
        </div>
      </div>

      {/* Subscription Content */}
      <div className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1
            className={`text-3xl md:text-4xl font-bold mb-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            Subscription
          </h1>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Manage your subscription and billing
          </p>
        </div>

        {/* Current Plan */}
        <div
          className={`p-6 rounded-xl border mb-6 ${
            isDarkMode
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h2
              className={`text-xl font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              Current Plan
            </h2>
            <SubscriptionBadge />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p
                className={`text-sm mb-1 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                Status
              </p>
              <p
                className={`text-lg font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                {getStatusDisplay()}
              </p>
            </div>

            {isPremium && subscription.subscriptionStartDate && (
              <div>
                <p
                  className={`text-sm mb-1 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  Active Since
                </p>
                <p
                  className={`text-lg font-semibold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {subscription.subscriptionStartDate.toDate().toLocaleDateString()}
                </p>
              </div>
            )}

            {isPremium && expiryDate && (
              <div>
                <p
                  className={`text-sm mb-1 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  {isExpiring ? 'Expires In' : 'Valid Until'}
                </p>
                <p
                  className={`text-lg font-semibold ${
                    isExpiring
                      ? 'text-yellow-500'
                      : isDarkMode
                      ? 'text-white'
                      : 'text-gray-900'
                  }`}
                >
                  {daysRemaining > 0
                    ? `${daysRemaining} days`
                    : 'Expired'}
                </p>
                <p
                  className={`text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  {expiryDate.toLocaleDateString()}
                </p>
              </div>
            )}

            {subscription.premiumType && (
              <div>
                <p
                  className={`text-sm mb-1 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  Plan Type
                </p>
                <p
                  className={`text-lg font-semibold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {subscription.premiumType.charAt(0).toUpperCase() + subscription.premiumType.slice(1)}
                </p>
              </div>
            )}
          </div>

          {subscription.manuallyGranted && subscription.grantedReason && (
            <div
              className={`mt-4 p-4 rounded-lg ${
                isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'
              }`}
            >
              <p
                className={`text-sm ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-800'
                }`}
              >
                <strong>Note:</strong> {subscription.grantedReason}
              </p>
            </div>
          )}

          {isFree && (
            <div className="mt-6">
              <Link
                href="/pricing"
                className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg"
              >
                Upgrade to Premium
              </Link>
            </div>
          )}

          {isExpiring && daysRemaining > 0 && (
            <div className="mt-6">
              <div
                className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-50'
                }`}
              >
                <p
                  className={`text-sm ${
                    isDarkMode ? 'text-yellow-300' : 'text-yellow-800'
                  }`}
                >
                  ⚠️ Your subscription expires in {daysRemaining} days. Renew now to continue enjoying premium features.
                </p>
              </div>
              <Link
                href="/pricing"
                className="inline-block mt-4 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg"
              >
                Renew Subscription
              </Link>
            </div>
          )}
        </div>

        {/* Premium Features */}
        {isFree && (
          <div
            className={`p-6 rounded-xl border ${
              isDarkMode
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            }`}
          >
            <h2
              className={`text-xl font-semibold mb-4 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              Unlock Premium Features
            </h2>

            <ul className="space-y-3">
              {[
                'Unlimited portfolio positions',
                'Advanced reports and risk analysis',
                'Custom stock screeners',
                'Technical & fundamental analysis',
                'Multiple account management',
                'Create and share trading ideas',
                'Priority support',
              ].map((feature, index) => (
                <li
                  key={index}
                  className={`flex items-start gap-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  <span className="text-green-500 mt-1">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/pricing"
              className="inline-block mt-6 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg"
            >
              View Pricing
            </Link>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
