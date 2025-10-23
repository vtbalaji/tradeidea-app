'use client';

import React from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useTheme } from '@/contexts/ThemeContext';

export function SubscriptionBadge() {
  const { isPremium, getStatusDisplay, getExpiryInfo } = useSubscription();
  const { isDarkMode } = useTheme();

  const status = getStatusDisplay();
  const { isExpiring, daysRemaining } = getExpiryInfo();

  if (isPremium) {
    return (
      <div className="flex items-center gap-2">
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            isExpiring
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
          }`}
        >
          {status}
        </span>
        {isExpiring && daysRemaining > 0 && (
          <span
            className={`text-xs ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            {daysRemaining} days left
          </span>
        )}
      </div>
    );
  }

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${
        isDarkMode
          ? 'bg-gray-700 text-gray-300'
          : 'bg-gray-200 text-gray-700'
      }`}
    >
      {status}
    </span>
  );
}
