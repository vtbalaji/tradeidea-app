'use client';

import React from 'react';
import Link from 'next/link';
import Navigation from '../../components/Navigation';
import Logo from '../../components/Logo';

// Import guide section components
import InvestmentJourney from '@/components/guide/InvestmentJourney';
import IdeaCardGuide from '@/components/guide/IdeaCardGuide';
import PortfolioCardGuide from '@/components/guide/PortfolioCardGuide';
import PortfolioHealth from '@/components/guide/PortfolioHealth';
import MarketScreeners from '@/components/guide/MarketScreeners';
import MultiAccount from '@/components/guide/MultiAccount';
import PortfolioImport from '@/components/guide/PortfolioImport';
import TechnicalAnalysis from '@/components/guide/TechnicalAnalysis';
import FundamentalAnalysis from '@/components/guide/FundamentalAnalysis';
import ScoresCalculations from '@/components/guide/ScoresCalculations';
import InvestmentTracking from '@/components/guide/InvestmentTracking';
import InvestmentIdeas from '@/components/guide/InvestmentIdeas';
import Notifications from '@/components/guide/Notifications';

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1419]">
      <Navigation />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <Logo size={64} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">TradeIdea User Guide</h1>
          <p className="text-lg text-gray-600 dark:text-[#8b949e] mb-4">
            Complete guide to all features and capabilities
          </p>
          <div className="max-w-3xl mx-auto bg-gradient-to-r from-[#ff8c42]/10 to-orange-500/5 border border-[#ff8c42]/30 rounded-xl p-6">
            <div className="text-2xl mb-3">🚀</div>
            <p className="text-base text-gray-700 dark:text-[#c9d1d9] font-medium mb-2">
              Never miss a profit opportunity or lose sleep over your investments again!
            </p>
            <p className="text-sm text-gray-600 dark:text-[#8b949e]">
              Automated alerts • Daily technical analysis • Smart exit tracking • Multi-account management • Community insights
            </p>
          </div>
        </div>

        {/* Table of Contents */}
        <div className="mb-12 bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Table of Contents</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <a href="#investment-journey" className="text-[#ff8c42] hover:underline font-bold">📍 Your Investment Journey</a>
            <a href="#read-idea-card" className="text-[#ff8c42] hover:underline flex items-center gap-1">
              📖 How to Read an Idea Card <span className="text-xs px-1 py-0.5 bg-green-500 text-white rounded">NEW</span>
            </a>
            <a href="#read-portfolio-card" className="text-[#ff8c42] hover:underline flex items-center gap-1">
              📊 How to Read Portfolio Card <span className="text-xs px-1 py-0.5 bg-orange-500 text-white rounded">NEW</span>
            </a>
            <a href="#portfolio-health" className="text-[#ff8c42] hover:underline">1. Portfolio Health Dashboard</a>
            <a href="#market-screeners" className="text-[#ff8c42] hover:underline flex items-center gap-1">
              2. Market Screeners <span className="text-xs px-1 py-0.5 bg-blue-500 text-white rounded">NEW</span>
            </a>
            <a href="#multi-account" className="text-[#ff8c42] hover:underline">3. Multi-Account Management</a>
            <a href="#portfolio-import" className="text-[#ff8c42] hover:underline">4. Portfolio Import</a>
            <a href="#technical-analysis" className="text-[#ff8c42] hover:underline">5. Technical Analysis</a>
            <a href="#fundamental-analysis" className="text-[#ff8c42] hover:underline">6. Fundamental Analysis</a>
            <a href="#scores-calculations" className="text-[#ff8c42] hover:underline">7. Understanding Scores & Ratings</a>
            <a href="#investment-tracking" className="text-[#ff8c42] hover:underline">8. Smart Investment Tracking</a>
            <a href="#investment-ideas" className="text-[#ff8c42] hover:underline">9. Investment Ideas Community</a>
            <a href="#notifications" className="text-[#ff8c42] hover:underline">10. Notifications & Alerts</a>
          </div>
        </div>

        {/* Guide Sections - Now using modular components */}
        <InvestmentJourney />
        <IdeaCardGuide />
        <PortfolioCardGuide />
        <PortfolioHealth />
        <MarketScreeners />
        <MultiAccount />
        <PortfolioImport />
        <TechnicalAnalysis />
        <FundamentalAnalysis />
        <ScoresCalculations />
        <InvestmentTracking />
        <InvestmentIdeas />
        <Notifications />

        {/* Bottom CTA */}
        <div className="mt-16 mb-8 text-center bg-gradient-to-r from-[#ff8c42]/10 to-orange-500/5 border border-[#ff8c42]/30 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to Transform Your Investment Journey?
          </h2>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-[#1c2128] rounded-lg p-4 border border-gray-200 dark:border-[#30363d]">
              <div className="text-3xl mb-2">⚡</div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">Real-Time Automation</h3>
              <p className="text-xs text-gray-600 dark:text-[#8b949e]">
                Never miss entry/exit points with instant notifications and technical alerts
              </p>
            </div>
            <div className="bg-white dark:bg-[#1c2128] rounded-lg p-4 border border-gray-200 dark:border-[#30363d]">
              <div className="text-3xl mb-2">📊</div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">Professional Analytics</h3>
              <p className="text-xs text-gray-600 dark:text-[#8b949e]">
                Technical + Fundamental scoring on 5000+ NSE stocks, updated daily
              </p>
            </div>
            <div className="bg-white dark:bg-[#1c2128] rounded-lg p-4 border border-gray-200 dark:border-[#30363d]">
              <div className="text-3xl mb-2">🛡️</div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">Smart Risk Protection</h3>
              <p className="text-xs text-gray-600 dark:text-[#8b949e]">
                100MA fallback, exit criteria tracking, and instant risk warnings
              </p>
            </div>
          </div>

          <Link
            href="/portfolio"
            className="inline-block px-8 py-4 bg-[#ff8c42] hover:bg-[#ff9a58] text-white text-lg font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl"
          >
            Start Managing Smarter →
          </Link>
          <p className="text-xs text-gray-500 dark:text-[#8b949e] mt-4">No credit card required • Free to start</p>
        </div>

        {/* Quick Links */}
        <div className="mt-8 text-center text-sm text-gray-600 dark:text-[#8b949e]">
          <Link href="/faq" className="hover:text-[#ff8c42] transition-colors">FAQ</Link>
          <span className="mx-3">•</span>
          <Link href="/ideas" className="hover:text-[#ff8c42] transition-colors">Ideas Hub</Link>
          <span className="mx-3">•</span>
          <Link href="/portfolio" className="hover:text-[#ff8c42] transition-colors">My Portfolio</Link>
          <span className="mx-3">•</span>
          <Link href="/accounts" className="hover:text-[#ff8c42] transition-colors">Accounts</Link>
        </div>
      </div>
    </div>
  );
}
