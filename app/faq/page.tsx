'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../../components/Navigation';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  // Getting Started
  {
    category: 'Getting Started',
    question: 'What is this platform?',
    answer: 'This is a trading portfolio management platform that helps you track your trades, share trading ideas with the community, and analyze technical indicators. You can manage your positions, set exit criteria, and collaborate with other traders.',
  },
  {
    category: 'Getting Started',
    question: 'How do I create an account?',
    answer: 'Click on the "Sign Up" button and provide your email and password. After signing up, you will need to verify your email address before accessing all features.',
  },
  {
    category: 'Getting Started',
    question: 'Why do I need to verify my email?',
    answer: 'Email verification ensures the security of your account and enables you to receive important notifications about your trading ideas and positions.',
  },

  // Trading Ideas
  {
    category: 'Trading Ideas',
    question: 'What is a trading idea?',
    answer: 'A trading idea is a trade setup that you share with the community. It includes your entry price, targets, stop loss, analysis, and technical signals. Other users can follow your ideas and add them to their portfolio.',
  },
  {
    category: 'Trading Ideas',
    question: 'What does "Brewing" status mean?',
    answer: 'Brewing ideas are trade setups that haven\'t reached their entry price yet. They are in the "cooking" phase, waiting for the right entry opportunity.',
  },
  {
    category: 'Trading Ideas',
    question: 'How do I create a trading idea?',
    answer: 'Go to Trading Ideas Hub and click "New Idea". Fill in the symbol, entry price, targets, stop loss, analysis, and other details. You can also add technical signals and specify when to enter the trade.',
  },
  {
    category: 'Trading Ideas',
    question: 'Can I follow other traders?',
    answer: 'Yes! Click the heart icon on any trading idea to follow that trader. You\'ll receive notifications when they post new ideas.',
  },

  // Portfolio Management
  {
    category: 'Portfolio',
    question: 'How do I add a position to my portfolio?',
    answer: 'You can add positions in two ways: 1) From a trading idea by clicking "Add to Portfolio", or 2) Directly from the Portfolio page by clicking "Add Position" and filling in the trade details.',
  },
  {
    category: 'Portfolio',
    question: 'What are exit criteria?',
    answer: 'Exit criteria are automatic alerts that notify you when it\'s time to exit a position. You can set criteria based on stop loss, target, 50 EMA, 100 MA, 200 MA, or Weekly Supertrend.',
  },
  {
    category: 'Portfolio',
    question: 'How do exit alerts work?',
    answer: 'Exit alerts monitor your positions against the exit criteria you set. When a criterion is met (e.g., price drops below 50 EMA), you\'ll see a warning or critical alert on your portfolio card.',
  },
  {
    category: 'Portfolio',
    question: 'What is the difference between Long and Short positions?',
    answer: 'Long positions profit when price goes up (buy low, sell high). Short positions profit when price goes down (sell high, buy low). Your portfolio tracks both types.',
  },
  {
    category: 'Portfolio',
    question: 'How do I close a position?',
    answer: 'Click "Exit Trade" on any open position, enter the exit price, date, and reason. The position will move to your "Closed" tab and profit/loss will be calculated.',
  },

  // Technical Analysis
  {
    category: 'Technical Analysis',
    question: 'What technical indicators are available?',
    answer: 'We provide 50 EMA, 100 MA, 200 MA, Weekly Supertrend, RSI, MACD, Bollinger Bands, and various moving average crossovers (Golden Cross, 50/200 MA Cross).',
  },
  {
    category: 'Technical Analysis',
    question: 'How often is technical data updated?',
    answer: 'Technical data is updated when the batch analysis script runs. You can see "Technical data updated: Xh ago" on the Ideas and Portfolio pages to know when it was last refreshed.',
  },
  {
    category: 'Technical Analysis',
    question: 'What is Weekly Supertrend?',
    answer: 'Weekly Supertrend is a trend-following indicator calculated on weekly timeframe with period=10 and multiplier=3. When Bullish (green), it acts as support below price. When Bearish (red), it acts as resistance above price.',
  },
  {
    category: 'Technical Analysis',
    question: 'What does "Above 200 MA" mean?',
    answer: 'This signal indicates that the stock price is trading above its 200-day moving average, which is generally considered a bullish long-term trend indicator.',
  },
  {
    category: 'Technical Analysis',
    question: 'What is a Golden Cross?',
    answer: 'A Golden Cross occurs when the 50-day moving average crosses above the 200-day moving average. This is a bullish signal that often indicates the start of an uptrend.',
  },

  // Notifications
  {
    category: 'Notifications',
    question: 'What notifications will I receive?',
    answer: 'You\'ll receive notifications when traders you follow post new ideas. Future updates will include exit alerts and price target notifications.',
  },
  {
    category: 'Notifications',
    question: 'How do I view my notifications?',
    answer: 'Click the bell icon in the navigation bar to see recent notifications. You can also visit the Activity Feed page to see all notifications.',
  },

  // Account & Settings
  {
    category: 'Account',
    question: 'How do I change my password?',
    answer: 'Go to your Account Settings and look for the "Change Password" option. You\'ll need to enter your current password and new password.',
  },
  {
    category: 'Account',
    question: 'Is my data secure?',
    answer: 'Yes, all data is stored securely in Firebase with strict security rules. Only you can access and modify your own positions and ideas.',
  },

  // Troubleshooting
  {
    category: 'Troubleshooting',
    question: 'Why don\'t I see technical data for my symbol?',
    answer: 'Technical data is calculated in batch jobs. If you see "Technical data not available. Waiting for next analysis cycle", it means the data hasn\'t been fetched yet. Check back after the next batch run.',
  },
  {
    category: 'Troubleshooting',
    question: 'Why can\'t I add a position to my portfolio?',
    answer: 'Make sure all required fields are filled in (symbol, entry price, stop loss, target). Also ensure you\'re logged in and have verified your email.',
  },
  {
    category: 'Troubleshooting',
    question: 'I forgot my password. What should I do?',
    answer: 'Click "Forgot Password" on the login page and enter your email. You\'ll receive a password reset link.',
  },
];

export default function FAQPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // Get unique categories
  const categories = ['All', ...Array.from(new Set(faqs.map(faq => faq.category)))];

  // Filter FAQs
  let filteredFAQs = faqs;

  if (activeCategory !== 'All') {
    filteredFAQs = filteredFAQs.filter(faq => faq.category === activeCategory);
  }

  if (searchQuery) {
    filteredFAQs = filteredFAQs.filter(faq =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  const toggleQuestion = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1419]">
      <Navigation />

      {/* Header */}
      <div className="p-5 pt-5 pb-3">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Frequently Asked Questions</h1>
        <p className="text-sm text-gray-600 dark:text-[#8b949e]">Find answers to common questions about using the platform</p>
      </div>

      {/* Search Bar */}
      <div className="px-5 mb-4">
        <input
          type="text"
          placeholder="Search FAQs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
        />
      </div>

      {/* Category Filters */}
      <div className="px-5 mb-5">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeCategory === category
                  ? 'bg-[#ff8c42] text-gray-900 dark:text-white'
                  : 'bg-gray-50 dark:bg-[#1c2128] text-gray-600 dark:text-[#8b949e] hover:bg-[#30363d]'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ List */}
      <div className="px-5 pb-8">
        {filteredFAQs.length > 0 ? (
          <div className="space-y-3">
            {filteredFAQs.map((faq, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleQuestion(index)}
                  className="w-full px-4 py-4 flex justify-between items-center text-left hover:bg-gray-100 dark:hover:bg-[#0f1419] transition-colors"
                >
                  <div className="flex-1">
                    <span className="text-xs font-semibold text-[#ff8c42] mb-1 block">{faq.category}</span>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{faq.question}</h3>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-600 dark:text-[#8b949e] transition-transform ${
                      expandedIndex === index ? 'transform rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedIndex === index && (
                  <div className="px-4 pb-4 pt-0">
                    <p className="text-sm text-gray-600 dark:text-[#8b949e] leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No FAQs found</h3>
            <p className="text-gray-600 dark:text-[#8b949e]">Try a different search term or category</p>
          </div>
        )}
      </div>

      {/* Contact Section */}
      <div className="px-5 pb-8">
        <div className="bg-gradient-to-r from-[#ff8c42]/10 to-purple-500/10 border border-[#ff8c42]/30 rounded-xl p-6 text-center">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Still have questions?</h3>
          <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-4">
            Can't find what you're looking for? Reach out to us for help.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2.5 bg-[#ff8c42] hover:bg-[#ff7a2e] text-gray-900 dark:text-white font-semibold rounded-lg transition-colors"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}
