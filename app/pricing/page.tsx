'use client';

import React from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { useTheme } from '@/contexts/ThemeContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { PricingCard } from '@/components/subscription/PricingCard';
import { FREE_TIER_LIMITS } from '@/types/subscription';

export default function PricingPage() {
  const { isDarkMode } = useTheme();
  const { plans, isPremium } = useSubscription();

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Simple Header */}
      <div className={`border-b ${isDarkMode ? 'bg-[#1c2128] border-[#30363d]' : 'bg-white border-gray-200'} px-6 py-4`}>
        <div className="max-w-6xl mx-auto">
          <Link href="/ideas" className="flex items-center gap-3">
            <Logo size={32} />
            <span className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              TradeIdea
            </span>
          </Link>
        </div>
      </div>

      {/* Pricing Content */}
      <div className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1
            className={`text-4xl md:text-5xl font-bold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            Choose Your Plan
          </h1>
          <p
            className={`text-lg ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}
          >
            Upgrade to Premium and unlock all features
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          {/* Free Plan */}
          <div
            className={`p-6 rounded-xl border-2 ${
              isDarkMode
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            }`}
          >
            <div className="text-center mb-6">
              <h3
                className={`text-2xl font-bold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                Free
              </h3>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-4xl font-bold text-gray-500">₹0</span>
                <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  /forever
                </span>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              <li
                className={`flex items-start gap-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                <span className="text-green-500 mt-1">✓</span>
                <span>View trading ideas</span>
              </li>
              <li
                className={`flex items-start gap-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                <span className="text-green-500 mt-1">✓</span>
                <span>Basic portfolio tracking (up to {FREE_TIER_LIMITS.MAX_POSITIONS} positions)</span>
              </li>
              <li
                className={`flex items-start gap-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                <span className="text-green-500 mt-1">✓</span>
                <span>Single account</span>
              </li>
              <li
                className={`flex items-start gap-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                <span className="text-green-500 mt-1">✓</span>
                <span>View screener results (limited)</span>
              </li>
            </ul>

            <button
              disabled={!isPremium}
              className={`w-full px-6 py-3 rounded-lg font-semibold ${
                !isPremium
                  ? isDarkMode
                    ? 'bg-gray-700 text-gray-400'
                    : 'bg-gray-200 text-gray-500'
                  : isDarkMode
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } ${!isPremium ? 'cursor-not-allowed' : 'cursor-pointer'} transition-colors`}
            >
              {!isPremium ? 'Current Plan' : 'Downgrade'}
            </button>
          </div>

          {/* Premium Plan */}
          {plans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              isCurrentPlan={isPremium}
            />
          ))}
        </div>

        {/* Feature Comparison */}
        <div className="max-w-4xl mx-auto">
          <h2
            className={`text-3xl font-bold text-center mb-8 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            Feature Comparison
          </h2>

          <div
            className={`rounded-xl border ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } overflow-hidden`}
          >
            <table className="w-full">
              <thead>
                <tr className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                  <th
                    className={`px-6 py-4 text-left font-semibold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    Feature
                  </th>
                  <th
                    className={`px-6 py-4 text-center font-semibold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    Free
                  </th>
                  <th
                    className={`px-6 py-4 text-center font-semibold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    Premium
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                <FeatureRow
                  feature="Portfolio Positions"
                  free={`${FREE_TIER_LIMITS.MAX_POSITIONS} max`}
                  premium="Unlimited"
                  isDarkMode={isDarkMode}
                />
                <FeatureRow
                  feature="Trading Ideas"
                  free="View only"
                  premium="Create & Share"
                  isDarkMode={isDarkMode}
                />
                <FeatureRow
                  feature="Reports & Risk Analysis"
                  free="✗"
                  premium="✓"
                  isDarkMode={isDarkMode}
                />
                <FeatureRow
                  feature="Stock Screeners"
                  free="Limited results"
                  premium="Full access"
                  isDarkMode={isDarkMode}
                />
                <FeatureRow
                  feature="Technical Analysis"
                  free="✗"
                  premium="✓"
                  isDarkMode={isDarkMode}
                />
                <FeatureRow
                  feature="Fundamental Analysis"
                  free="✗"
                  premium="✓"
                  isDarkMode={isDarkMode}
                />
                <FeatureRow
                  feature="Multiple Accounts"
                  free="1 account"
                  premium="Unlimited"
                  isDarkMode={isDarkMode}
                />
                <FeatureRow
                  feature="Priority Support"
                  free="✗"
                  premium="✓"
                  isDarkMode={isDarkMode}
                />
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-16">
          <h2
            className={`text-3xl font-bold text-center mb-8 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            <FAQItem
              question="Can I upgrade anytime?"
              answer="Yes, you can upgrade to Premium at any time. Your subscription will be active immediately after payment."
              isDarkMode={isDarkMode}
            />
            <FAQItem
              question="What payment methods are accepted?"
              answer="We accept all major credit/debit cards, UPI, net banking, and digital wallets through Razorpay."
              isDarkMode={isDarkMode}
            />
            <FAQItem
              question="Is there a refund policy?"
              answer="We offer a 7-day money-back guarantee if you're not satisfied with Premium features."
              isDarkMode={isDarkMode}
            />
            <FAQItem
              question="Can I cancel anytime?"
              answer="Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period."
              isDarkMode={isDarkMode}
            />
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

function FeatureRow({
  feature,
  free,
  premium,
  isDarkMode,
}: {
  feature: string;
  free: string;
  premium: string;
  isDarkMode: boolean;
}) {
  return (
    <tr>
      <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        {feature}
      </td>
      <td className={`px-6 py-4 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        {free}
      </td>
      <td className="px-6 py-4 text-center text-blue-500 font-semibold">
        {premium}
      </td>
    </tr>
  );
}

function FAQItem({
  question,
  answer,
  isDarkMode,
}: {
  question: string;
  answer: string;
  isDarkMode: boolean;
}) {
  return (
    <div
      className={`p-6 rounded-lg ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      } border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
    >
      <h3
        className={`text-lg font-semibold mb-2 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}
      >
        {question}
      </h3>
      <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
        {answer}
      </p>
    </div>
  );
}
