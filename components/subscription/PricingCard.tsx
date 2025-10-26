'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { SubscriptionPlan } from '@/types/subscription';
import { PaymentButton } from './PaymentButton';

interface PricingCardProps {
  plan: SubscriptionPlan;
  isCurrentPlan?: boolean;
}

export function PricingCard({ plan, isCurrentPlan = false }: PricingCardProps) {
  const { isDarkMode } = useTheme();

  return (
    <div
      className={`relative p-6 rounded-xl border-2 ${
        plan.popular
          ? 'border-blue-500 shadow-xl'
          : isDarkMode
          ? 'border-gray-700'
          : 'border-gray-200'
      } ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
    >
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="px-4 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-semibold rounded-full">
            Most Popular
          </span>
        </div>
      )}

      {/* Introductory Offer Badge */}
      <div className="absolute -top-4 right-4">
        <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
          🎉 INTRODUCTORY OFFER
        </span>
      </div>

      <div className="text-center mb-6">
        <h3
          className={`text-2xl font-bold mb-2 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}
        >
          {plan.name}
        </h3>

        {/* Show original price crossed out */}
        <div className="mb-2">
          <span className={`text-xl line-through ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            ₹2,999
          </span>
        </div>

        <div className="flex items-baseline justify-center gap-2">
          <span className="text-4xl font-bold text-green-500">
            ₹{plan.price.toLocaleString()}
          </span>
          <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            /year
          </span>
        </div>
        <p className={`mt-2 text-sm font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
          Save ₹{(2999 - plan.price).toLocaleString()} (88% OFF)
        </p>
        <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Just ₹{Math.round(plan.price / 12).toLocaleString()}/month • Limited Time Only
        </p>
      </div>

      <ul className="space-y-3 mb-6">
        {plan.features.map((feature, index) => (
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

      {isCurrentPlan ? (
        <button
          disabled
          className={`w-full px-6 py-3 rounded-lg font-semibold ${
            isDarkMode
              ? 'bg-gray-700 text-gray-400'
              : 'bg-gray-200 text-gray-500'
          } cursor-not-allowed`}
        >
          Current Plan
        </button>
      ) : (
        <PaymentButton plan={plan} />
      )}
    </div>
  );
}
