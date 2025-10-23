'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';

interface UpgradePromptProps {
  featureName?: string;
  message?: string;
}

export function UpgradePrompt({ featureName, message }: UpgradePromptProps) {
  const { isDarkMode } = useTheme();

  const defaultMessage = featureName
    ? `${featureName} is a premium feature`
    : 'This feature requires a premium subscription';

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 rounded-lg border-2 ${
        isDarkMode
          ? 'bg-gray-800 border-blue-500'
          : 'bg-blue-50 border-blue-300'
      }`}
    >
      <div className="text-center mb-6">
        <div className="text-5xl mb-4">🔒</div>
        <h3
          className={`text-xl font-semibold mb-2 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}
        >
          Premium Feature
        </h3>
        <p
          className={`${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}
        >
          {message || defaultMessage}
        </p>
      </div>

      <Link
        href="/pricing"
        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg"
      >
        Upgrade to Premium
      </Link>

      <p
        className={`mt-4 text-sm ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}
      >
        Get unlimited access to all features
      </p>
    </div>
  );
}
