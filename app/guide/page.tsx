'use client';

import React from 'react';
import Link from 'next/link';
import Navigation from '../../components/Navigation';
import { MyPortfolioIcon } from '@/components/icons';

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1419]">
      <Navigation />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#ff8c42] flex items-center justify-center">
            <MyPortfolioIcon size={36} />
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

        {/* Section 1: Portfolio Health Dashboard */}
        <section id="portfolio-health" className="mb-12 scroll-mt-20">
          <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">📊</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Portfolio Health Dashboard</h2>
            </div>
            <p className="text-gray-600 dark:text-[#8b949e] mb-6">
              Get instant insights into your portfolio's health with a comprehensive single-page view.
            </p>

            <div className="space-y-4">
              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">💰 Total Value & P&L</h3>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li>Current portfolio value and total invested amount</li>
                  <li>Unrealized profit/loss with percentage gain</li>
                  <li>Daily change tracker</li>
                  <li>Per-position breakdown with color-coded indicators</li>
                </ul>
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-[#30363d]">
                  <p className="text-xs text-[#ff8c42] font-semibold">💡 See your entire portfolio health at a glance - no spreadsheet juggling!</p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">⚠️ Risk Signals</h3>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li>Positions below stop-loss levels</li>
                  <li>Stocks trading below 50 EMA, 100 MA, or 200 MA</li>
                  <li>Daily Supertrend exit signals</li>
                  <li>Warning indicators for high-risk positions</li>
                </ul>
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-[#30363d]">
                  <p className="text-xs text-[#ff8c42] font-semibold">⚡ Get instant warnings before losses pile up - protect your capital!</p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📈 Technical Health</h3>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li>Golden Cross and Death Cross indicators</li>
                  <li>EMA/MA trend analysis</li>
                  <li>RSI, MACD, and Bollinger Bands signals</li>
                  <li>Supertrend momentum indicators</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">🎯 Action Items</h3>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li>Positions near target prices</li>
                  <li>Pending exit recommendations</li>
                  <li>Buy/sell opportunities based on signals</li>
                  <li>Rebalancing suggestions</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Market Screeners - NEW */}
        <section id="market-screeners" className="mb-12 scroll-mt-20">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-500 dark:border-blue-400 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">🔍</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Market Screeners</h2>
              <span className="px-3 py-1 bg-blue-500 text-white text-sm font-bold rounded-full">NEW FEATURE</span>
            </div>
            <p className="text-gray-600 dark:text-[#8b949e] mb-6">
              Discover fresh trading opportunities every day with automated technical screeners that identify stocks crossing key moving averages and Supertrend levels.
            </p>

            <div className="space-y-4">
              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📊 50 MA & 200 MA Crossovers</h3>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li>Identify stocks crossing 50-day and 200-day moving averages</li>
                  <li>Bullish crossovers (Golden Cross) - potential buy signals</li>
                  <li>Bearish crossovers (Death Cross) - potential sell/exit signals</li>
                  <li>Filter by both crossovers, 50 MA only, or 200 MA only</li>
                  <li>Shows price distance from MA levels (cross percentage)</li>
                </ul>
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-[#30363d]">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">💡 Classic signals used by professional traders worldwide!</p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📈 Supertrend Crossovers</h3>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li>Powerful momentum indicator for trend reversals</li>
                  <li>Bullish Supertrend - price crosses above Supertrend line</li>
                  <li>Bearish Supertrend - price crosses below Supertrend line</li>
                  <li>Excellent for entry/exit timing on trending stocks</li>
                  <li>Shows percentage distance from Supertrend level</li>
                </ul>
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-[#30363d]">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">⚡ Catch trend reversals early for maximum gains!</p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">💡 Convert to Idea - One Click Magic</h3>
                <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-2">
                  The most powerful feature - convert any screener result into a complete trading idea with one click:
                </p>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li><strong>Smart Entry Price:</strong> Automatically set to highest support level (Supertrend or 100 MA)</li>
                  <li><strong>Intelligent Stop Loss:</strong> Placed 2% below the key support level</li>
                  <li><strong>Risk-Reward Target:</strong> Auto-calculated with 2:1 risk-reward ratio</li>
                  <li><strong>Pre-filled Analysis:</strong> Technical context with crossover details and price levels</li>
                  <li><strong>Editable:</strong> Review and adjust all levels before publishing</li>
                </ul>
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-[#30363d]">
                  <p className="text-xs text-green-600 dark:text-green-400 font-semibold">🚀 From screener to trading idea in seconds - not minutes!</p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">🎯 How to Use Screeners</h3>
                <ol className="text-sm text-gray-600 dark:text-[#8b949e] space-y-2 ml-4 list-decimal">
                  <li>Navigate to <strong>Screeners</strong> page from main navigation</li>
                  <li>Choose a tab: <strong>50 & 200 MA Both</strong>, <strong>50 MA Only</strong>, <strong>200 MA Only</strong>, or <strong>Supertrend</strong></li>
                  <li>Review the list of stocks with crossover signals for today</li>
                  <li>Each card shows:
                    <ul className="ml-4 mt-1 space-y-0.5 list-disc">
                      <li>Symbol and crossover type (Bullish/Bearish)</li>
                      <li>Yesterday and today's closing prices</li>
                      <li>Moving average or Supertrend levels</li>
                      <li>Percentage distance from support/resistance</li>
                    </ul>
                  </li>
                  <li>Click <strong>"Convert to Idea"</strong> button to create a trading idea</li>
                  <li>Click <strong>"Analysis"</strong> button to see detailed technical & fundamental analysis</li>
                </ol>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📅 Data Updates</h3>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li>Screeners are updated daily after market closes</li>
                  <li>Shows crossovers that happened today (last trading day)</li>
                  <li>Automatically filters out stale signals</li>
                  <li>Data sourced from reliable market feeds</li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-500 dark:border-green-600 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 dark:text-green-400 mb-2">💡 Pro Tips for Screeners</h3>
                <ul className="text-sm text-green-800 dark:text-green-300 space-y-1 ml-4 list-disc">
                  <li><strong>Golden Cross (Bullish 200 MA):</strong> Strong long-term buy signal - consider accumulating</li>
                  <li><strong>Death Cross (Bearish 200 MA):</strong> Exit warning - review your holdings in this stock</li>
                  <li><strong>Supertrend Bullish:</strong> Excellent for swing trades - momentum is building</li>
                  <li><strong>Supertrend Bearish:</strong> Exit signal - trend has reversed</li>
                  <li><strong>Entry at Support:</strong> System automatically sets entry at Supertrend/100MA for safety</li>
                  <li><strong>Combine with Analysis:</strong> Always check fundamentals before taking a trade</li>
                  <li><strong>2:1 Risk-Reward:</strong> Targets are set to give you 2x the risk amount</li>
                </ul>
              </div>

              <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 rounded-lg p-4">
                <h3 className="font-semibold text-orange-900 dark:text-orange-400 mb-2">⚠️ Important Notes</h3>
                <ul className="text-sm text-orange-800 dark:text-orange-300 space-y-1 ml-4 list-disc">
                  <li>Crossover signals are indicators, not guarantees - always do your own research</li>
                  <li>Review pre-filled entry, stop-loss, and target levels before confirming</li>
                  <li>Check the fundamental strength using the Analysis button</li>
                  <li>Not all crossovers lead to profitable trades - combine with other analysis</li>
                  <li>Screeners work best in trending markets, less reliable in sideways markets</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Multi-Account Management */}
        <section id="multi-account" className="mb-12 scroll-mt-20">
          <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">📂</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Multi-Account Management</h2>
            </div>
            <p className="text-gray-600 dark:text-[#8b949e] mb-6">
              Manage separate portfolios for different purposes or family members.
            </p>

            <div className="space-y-4">
              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Create Multiple Accounts</h3>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li>Set up unlimited portfolio accounts (Personal, Spouse, Kids, etc.)</li>
                  <li>Assign unique names, descriptions, and colors</li>
                  <li>Set a default account for quick access</li>
                  <li>Switch between accounts instantly</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Separate Tracking</h3>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li>Each account has independent positions and performance</li>
                  <li>Color-coded visual identification</li>
                  <li>Consolidated view across all accounts</li>
                  <li>Per-account P&L and analytics</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">How to Use</h3>
                <ol className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-decimal">
                  <li>Go to <strong>Accounts</strong> page from navigation</li>
                  <li>Click <strong>Create Account</strong> button</li>
                  <li>Enter name, description (optional), and choose a color</li>
                  <li>Use <strong>Switch</strong> to change active account</li>
                  <li>All new positions will be added to the active account</li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Portfolio Import */}
        <section id="portfolio-import" className="mb-12 scroll-mt-20">
          <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">📥</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Portfolio Import</h2>
            </div>
            <p className="text-gray-600 dark:text-[#8b949e] mb-6">
              Quickly import your portfolio holdings from any broker using CSV format with smart detection.
            </p>

            <div className="space-y-4">
              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Import Methods & Supported Brokers</h3>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li><strong>Zerodha CSV</strong> - Console holdings export</li>
                  <li><strong>ICICI Direct CSV</strong> - Portfolio report with smart symbol mapping</li>
                  <li><strong>Standard CSV Format</strong> - Custom CSV with symbol, quantity, entry price</li>
                  <li>Automatic field mapping (handles different column names)</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">ICICI Direct Symbol Mapping</h3>
                <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-2">
                  ICICI uses abbreviated codes. We automatically map them to NSE symbols:
                </p>
                <div className="grid md:grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-600 dark:text-[#8b949e]">HDFBAN → HDFCBANK</div>
                  <div className="text-gray-600 dark:text-[#8b949e]">ULTCEM → ULTRACEMCO</div>
                  <div className="text-gray-600 dark:text-[#8b949e]">RELIND → RELIANCE</div>
                  <div className="text-gray-600 dark:text-[#8b949e]">AMARAJ → ARE&M</div>
                  <div className="text-gray-600 dark:text-[#8b949e] md:col-span-2">...and 40+ more mappings</div>
                </div>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">How to Import</h3>
                <ol className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-decimal">
                  <li>Go to <strong>My Portfolio</strong> page</li>
                  <li>Click <strong>Import CSV</strong> button</li>
                  <li>Select your CSV file from your broker</li>
                  <li>Review the preview and validation results</li>
                  <li>Set default target/stop-loss if missing</li>
                  <li>Click <strong>Import</strong> to add all positions</li>
                </ol>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">CSV Format (Standard)</h3>
                <pre className="text-xs bg-gray-100 dark:bg-[#0f1419] p-3 rounded border border-gray-200 dark:border-[#30363d] overflow-x-auto">
{`symbol,entryPrice,quantity,dateTaken,target1,stopLoss,tradeType
RELIANCE,2500.00,10,15-01-2025,2800.00,2300.00,Long
TCS,3600.00,5,20-01-2025,4000.00,3400.00,Long`}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Technical Analysis */}
        <section id="technical-analysis" className="mb-12 scroll-mt-20">
          <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">📊</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Technical Analysis</h2>
            </div>
            <p className="text-gray-600 dark:text-[#8b949e] mb-6">
              Automated real-time technical indicators for every stock in your portfolio.
            </p>

            <div className="space-y-4">
              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Moving Averages & EMAs</h3>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li><strong>50 EMA</strong> - Short-term trend indicator</li>
                  <li><strong>100 MA</strong> - Medium-term support/resistance</li>
                  <li><strong>200 MA</strong> - Long-term trend (bull/bear market indicator)</li>
                  <li><strong>Golden Cross</strong> - 50 EMA crosses above 200 MA (bullish)</li>
                  <li><strong>Death Cross</strong> - 50 EMA crosses below 200 MA (bearish)</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Momentum Indicators</h3>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li><strong>RSI (Relative Strength Index)</strong> - Overbought (&gt;70) / Oversold (&lt;30)</li>
                  <li><strong>MACD</strong> - Trend following momentum with signal line</li>
                  <li><strong>Bollinger Bands</strong> - Volatility and price range analysis</li>
                  <li><strong>Supertrend</strong> - Daily trend with buy/sell signals</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">How to View</h3>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li>All indicators are automatically calculated daily via batch job</li>
                  <li>View on portfolio page in the technical column</li>
                  <li>Click position details for full technical analysis</li>
                  <li>Color-coded signals (green = bullish, red = bearish)</li>
                </ul>
              </div>

              <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 rounded-lg p-4">
                <h3 className="font-semibold text-orange-900 dark:text-orange-400 mb-2">⏰ Important Note</h3>
                <p className="text-sm text-orange-800 dark:text-orange-300 mb-2">
                  Technical analysis data is updated daily through our automated batch job. When you first add a position,
                  the technical indicators will be calculated and appear within 24 hours (typically updated every evening).
                </p>
                <p className="text-xs text-orange-700 dark:text-orange-400 font-semibold mt-2">
                  🎯 No manual calculations needed - we do all the complex technical analysis for you automatically!
                </p>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📋 Exit/Accumulate Recommendations</h3>
                <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-3">
                  Our system automatically generates Exit or Accumulate recommendations based on your configured exit criteria:
                </p>
                <div className="space-y-2 text-sm">
                  <div className="bg-gray-50 dark:bg-[#0f1419] p-3 rounded border-l-4 border-red-500">
                    <div className="font-semibold text-red-600 dark:text-red-400 mb-1">🔴 EXIT Recommendation</div>
                    <p className="text-gray-600 dark:text-[#8b949e] text-xs">
                      Triggered when ANY of your enabled exit criteria are met:
                    </p>
                    <ul className="mt-2 ml-4 space-y-1 text-xs text-gray-600 dark:text-[#8b949e] list-disc">
                      <li>Price hits or goes below stop-loss level</li>
                      <li>Target price is reached or exceeded</li>
                      <li>Price closes below 50 EMA (if enabled)</li>
                      <li>Price closes below 100 MA (if enabled)</li>
                      <li>Price closes below 200 MA (if enabled)</li>
                      <li>Daily Supertrend turns bearish/red (if enabled)</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#0f1419] p-3 rounded border-l-4 border-green-500">
                    <div className="font-semibold text-green-600 dark:text-green-400 mb-1">🟢 ACCUMULATE Recommendation</div>
                    <p className="text-gray-600 dark:text-[#8b949e] text-xs">
                      Suggested when ALL of the following conditions are met:
                    </p>
                    <ul className="mt-2 ml-4 space-y-1 text-xs text-gray-600 dark:text-[#8b949e] list-disc">
                      <li>Price is above stop-loss (not in danger zone)</li>
                      <li>Price is below target (room to grow)</li>
                      <li>Price is above 50 EMA (short-term bullish)</li>
                      <li>Price is above 200 MA (long-term bullish)</li>
                      <li>Daily Supertrend is bullish/green (daily momentum)</li>
                      <li>Golden Cross present (50 EMA above 200 MA)</li>
                    </ul>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-500/10 p-3 rounded border-l-4 border-blue-500">
                    <div className="font-semibold text-blue-600 dark:text-blue-400 mb-1">💡 Pro Tip</div>
                    <p className="text-gray-600 dark:text-[#8b949e] text-xs">
                      These are automated suggestions based on technical signals. Always consider fundamental analysis,
                      market conditions, and your own research before making investment decisions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Fundamental Analysis */}
        <section id="fundamental-analysis" className="mb-12 scroll-mt-20">
          <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">💼</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Fundamental Analysis</h2>
            </div>
            <p className="text-gray-600 dark:text-[#8b949e] mb-6">
              Access key financial metrics to make informed investment decisions.
            </p>

            <div className="space-y-4">
              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Valuation Metrics</h3>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li><strong>P/E Ratio</strong> - Price to Earnings (valuation indicator)</li>
                  <li><strong>Market Cap</strong> - Company size classification</li>
                  <li><strong>P/B Ratio</strong> - Price to Book value</li>
                  <li><strong>Dividend Yield</strong> - Annual dividend percentage for long-term returns</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Profitability Metrics</h3>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li><strong>ROE</strong> - Return on Equity (efficiency indicator)</li>
                  <li><strong>ROA</strong> - Return on Assets</li>
                  <li><strong>Profit Margin</strong> - Net profit percentage</li>
                  <li><strong>Revenue Growth</strong> - Year-over-year growth rate</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Financial Health</h3>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li><strong>Debt to Equity</strong> - Leverage ratio</li>
                  <li><strong>Current Ratio</strong> - Short-term liquidity</li>
                  <li><strong>EPS</strong> - Earnings Per Share</li>
                  <li><strong>Book Value</strong> - Net asset value per share</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">How to Access</h3>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li>Click on any position in your portfolio</li>
                  <li>Navigate to the <strong>Fundamentals</strong> tab</li>
                  <li>View comprehensive financial data</li>
                  <li>Compare with industry averages</li>
                </ul>
              </div>

              <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 rounded-lg p-4">
                <h3 className="font-semibold text-orange-900 dark:text-orange-400 mb-2">⏰ Important Note</h3>
                <p className="text-sm text-orange-800 dark:text-orange-300">
                  Fundamental data is fetched daily through our automated batch job. When you first add a position,
                  the fundamental metrics will be available within 24 hours (typically updated every evening).
                  This ensures you always have the most recent quarterly/annual financial data.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Understanding Scores & Ratings */}
        <section id="scores-calculations" className="mb-12 scroll-mt-20">
          <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">🎯</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Understanding Scores & Ratings</h2>
            </div>
            <p className="text-gray-600 dark:text-[#8b949e] mb-6">
              Learn how we calculate technical scores, fundamental ratings, and investor suitability to help you make informed investment decisions.
            </p>

            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-400 mb-2">📊 All Scores Are Computed By Us</h3>
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  All scores and ratings you see in TradeIdea are calculated using our proprietary algorithms.
                  We fetch raw data from Yahoo Finance, but the scoring, rating, and suitability analysis are entirely our own calculations designed to help you make better investment decisions.
                </p>
              </div>

              {/* Technical Score */}
              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📈 Technical Score (Overall Signal)</h3>
                <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-3">
                  A points-based scoring system that evaluates 7 technical indicators to generate an overall buy/sell signal.
                </p>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-3 text-xs space-y-1 mb-3">
                  <div className="flex justify-between"><span className="text-gray-700 dark:text-[#c9d1d9]">Price ABOVE SMA200:</span><span className="text-green-500">+2 points</span></div>
                  <div className="flex justify-between"><span className="text-gray-700 dark:text-[#c9d1d9]">Price BELOW SMA200:</span><span className="text-red-500">-2 points</span></div>
                  <div className="flex justify-between"><span className="text-gray-700 dark:text-[#c9d1d9]">Price ABOVE EMA50:</span><span className="text-green-500">+1 point</span></div>
                  <div className="flex justify-between"><span className="text-gray-700 dark:text-[#c9d1d9]">RSI Oversold (&lt;30):</span><span className="text-green-500">+2 points</span></div>
                  <div className="flex justify-between"><span className="text-gray-700 dark:text-[#c9d1d9]">RSI Overbought (&gt;70):</span><span className="text-red-500">-2 points</span></div>
                  <div className="flex justify-between"><span className="text-gray-700 dark:text-[#c9d1d9]">MACD Bullish:</span><span className="text-green-500">+1 point</span></div>
                  <div className="flex justify-between"><span className="text-gray-700 dark:text-[#c9d1d9]">Golden Cross (SMA50 &gt; SMA200):</span><span className="text-green-500">+2 points</span></div>
                  <div className="flex justify-between"><span className="text-gray-700 dark:text-[#c9d1d9]">Volume Spike (&gt;2x avg):</span><span className="text-green-500">+1 point</span></div>
                </div>
                <div className="space-y-1 text-sm text-gray-700 dark:text-[#c9d1d9]">
                  <div><strong className="text-green-600 dark:text-green-400">Score ≥ 5:</strong> STRONG_BUY</div>
                  <div><strong className="text-green-500 dark:text-green-400">Score ≥ 2:</strong> BUY</div>
                  <div><strong className="text-gray-500 dark:text-[#8b949e]">Score -1 to 1:</strong> NEUTRAL</div>
                  <div><strong className="text-red-500 dark:text-red-400">Score ≤ -2:</strong> SELL</div>
                  <div><strong className="text-red-600 dark:text-red-400">Score ≤ -5:</strong> STRONG_SELL</div>
                </div>
              </div>

              {/* Fundamental Score */}
              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">💼 Fundamental Score (0-100)</h3>
                <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-3">
                  A weighted scoring system across 8 fundamental metrics, normalized to a 0-100 scale.
                </p>
                <div className="space-y-2 text-xs text-gray-700 dark:text-[#c9d1d9]">
                  <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2">
                    <strong className="text-gray-900 dark:text-white">PE Ratio (10 pts):</strong> 10-20 ideal (10 pts), 20-30 (7 pts), 5-10 (7 pts)
                  </div>
                  <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2">
                    <strong className="text-gray-900 dark:text-white">ROE (15 pts):</strong> ≥20% (15 pts), 15-20% (12 pts), 10-15% (8 pts)
                  </div>
                  <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2">
                    <strong className="text-gray-900 dark:text-white">Debt-to-Equity (10 pts):</strong> &lt;50 (10 pts), 50-100 (7 pts), &gt;200 (1 pt)
                  </div>
                  <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2">
                    <strong className="text-gray-900 dark:text-white">Profit Margins (10 pts):</strong> ≥15% (10 pts), 10-15% (7 pts)
                  </div>
                  <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2">
                    <strong className="text-gray-900 dark:text-white">Earnings Growth (15 pts):</strong> ≥20% (15 pts), 10-20% (12 pts)
                  </div>
                  <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2">
                    <strong className="text-gray-900 dark:text-white">Revenue Growth (10 pts):</strong> ≥15% (10 pts), 10-15% (7 pts)
                  </div>
                  <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2">
                    <strong className="text-gray-900 dark:text-white">Current Ratio (10 pts):</strong> ≥2 (10 pts), 1.5-2 (7 pts)
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-[#30363d] space-y-1 text-sm text-gray-700 dark:text-[#c9d1d9]">
                  <div><strong className="text-green-600 dark:text-green-400">≥80:</strong> EXCELLENT</div>
                  <div><strong className="text-green-500 dark:text-green-400">≥60:</strong> GOOD</div>
                  <div><strong className="text-yellow-500 dark:text-yellow-400">≥40:</strong> AVERAGE</div>
                  <div><strong className="text-orange-500 dark:text-orange-400">≥20:</strong> POOR</div>
                  <div><strong className="text-red-500 dark:text-red-400">&lt;20:</strong> WEAK</div>
                </div>
              </div>

              {/* Volume Spike Calculation */}
              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📊 Volume Spike Calculation</h3>
                <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-3">
                  Detects abnormal trading activity that often indicates institutional buying/selling or significant news events.
                </p>
                <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-3 text-sm text-gray-700 dark:text-[#c9d1d9]">
                  <div className="mb-2"><strong className="text-gray-900 dark:text-white">Formula:</strong></div>
                  <code className="text-xs bg-white dark:bg-[#161b22] px-2 py-1 rounded border border-gray-200 dark:border-[#30363d] text-gray-800 dark:text-[#c9d1d9]">
                    Volume Spike = Today's Volume &gt; (20-Day Average Volume × 2)
                  </code>
                  <div className="mt-3 text-xs text-gray-600 dark:text-[#8b949e]">
                    <strong className="text-gray-900 dark:text-white">Example:</strong> If 20-day avg volume is 1M shares and today's volume is 2.5M shares, that's a volume spike!
                  </div>
                </div>
              </div>

              {/* Investor Type Suitability */}
              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">👥 Investor Type Suitability</h3>
                <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-3">
                  Our rule engine evaluates whether a stock matches 5 different investor profiles based on their specific criteria.
                </p>
                <div className="space-y-2 text-xs text-gray-700 dark:text-[#c9d1d9]">
                  <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 flex items-center gap-2">
                    <span className="text-lg">💎</span>
                    <div>
                      <strong className="text-gray-900 dark:text-white">Value Investor:</strong> Undervalued stocks (PE &lt; 20, P/B &lt; 3, ROE &gt; 15%)
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 flex items-center gap-2">
                    <span className="text-lg">📈</span>
                    <div>
                      <strong className="text-gray-900 dark:text-white">Growth Investor:</strong> High growth (Earnings growth &gt; 15%, Revenue growth &gt; 10%)
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 flex items-center gap-2">
                    <span className="text-lg">🚀</span>
                    <div>
                      <strong className="text-gray-900 dark:text-white">Momentum Trader:</strong> Strong technicals (RSI 50-70, MACD bullish, volume spike)
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 flex items-center gap-2">
                    <span className="text-lg">⭐</span>
                    <div>
                      <strong className="text-gray-900 dark:text-white">Quality Investor:</strong> High quality (ROE &gt; 18%, Low debt, Profit margin &gt; 12%)
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#0f1419] rounded p-2 flex items-center gap-2">
                    <span className="text-lg">💰</span>
                    <div>
                      <strong className="text-gray-900 dark:text-white">Dividend Investor:</strong> Income focus (Dividend yield &gt; 2%, Payout &lt; 60%)
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-600 dark:text-[#8b949e]">
                  <strong className="text-gray-900 dark:text-white">Click "Analyze" button</strong> on any idea card to see which investor types the stock suits!
                </div>
              </div>

              <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 rounded-lg p-4">
                <h3 className="font-semibold text-orange-900 dark:text-orange-400 mb-2">💡 Important Notes</h3>
                <ul className="text-sm text-orange-800 dark:text-orange-300 space-y-1 ml-4 list-disc">
                  <li>All raw data comes from Yahoo Finance, but scoring is our proprietary calculation</li>
                  <li>PEG Ratio is disabled because Yahoo's calculation is unreliable for Indian stocks</li>
                  <li>Scores are recalculated daily through automated batch jobs</li>
                  <li>These are decision support tools - always do your own research!</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Section 7: Smart Investment Tracking */}
        <section id="investment-tracking" className="mb-12 scroll-mt-20">
          <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">🎯</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Smart Investment Tracking</h2>
            </div>
            <p className="text-gray-600 dark:text-[#8b949e] mb-4">
              Automated monitoring system that tracks your investments and alerts you when exit conditions are met based on technical signals and your configured criteria.
            </p>
            <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-500 dark:border-green-600 rounded-lg p-4">
              <p className="text-sm text-green-900 dark:text-green-300 font-semibold flex items-center gap-2">
                <span className="text-xl">🎉</span>
                <span>Sleep peacefully knowing our system is watching your portfolio 24/7 and will alert you at the right moment!</span>
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-400 mb-2">🤖 How It Works</h3>
                <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">
                  The system monitors your portfolio daily, comparing current prices against your configured exit criteria.
                  When any condition is met, you receive an automatic alert to help you make timely investment decisions.
                </p>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📊 Exit Criteria Options</h3>
                <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-3">
                  Configure custom rules to receive alerts when specific conditions are met:
                </p>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-2 ml-4 list-disc">
                  <li><strong>Exit at Stop-Loss</strong> - Alert when price hits your stop-loss level (protects downside)</li>
                  <li><strong>Exit at Target</strong> - Alert when target price is reached (locks in profits)</li>
                  <li><strong>Exit Below 50 EMA</strong> - Short-term trend reversal signal</li>
                  <li><strong>Exit Below 100 MA</strong> - Medium-term support level broken</li>
                  <li><strong>Exit Below 200 MA</strong> - Long-term trend break (Default: ON)</li>
                  <li><strong>Exit on Daily Supertrend</strong> - Daily trend reversal (Default: ON)</li>
                  <li><strong>Exit Below Custom Price</strong> - Set any specific price level</li>
                  <li><strong>Custom Note</strong> - Add your own exit conditions and reminders</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">🔔 Alert Logic & Triggers</h3>
                <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-3">
                  Understanding when and how alerts are triggered:
                </p>
                <div className="space-y-3">
                  <div className="bg-gray-50 dark:bg-[#0f1419] p-3 rounded border-l-4 border-orange-500">
                    <div className="font-semibold text-gray-900 dark:text-white text-sm mb-1">✅ Target Price Alert</div>
                    <p className="text-xs text-gray-600 dark:text-[#8b949e]">
                      <strong>Trigger:</strong> Current price ≥ Target price<br/>
                      <strong>Logic:</strong> Simple price comparison check<br/>
                      <strong>Action:</strong> Notification sent, manual exit required
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-[#0f1419] p-3 rounded border-l-4 border-red-500">
                    <div className="font-semibold text-gray-900 dark:text-white text-sm mb-1">⚠️ Stop Loss Alert</div>
                    <p className="text-xs text-gray-600 dark:text-[#8b949e]">
                      <strong>Trigger:</strong> Current price ≤ Stop-loss OR Current price ≤ 100MA (if no SL set)<br/>
                      <strong>Logic:</strong> Uses your configured stop-loss, falls back to 100MA as safety net<br/>
                      <strong>Action:</strong> Urgent notification sent, immediate review recommended
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-[#0f1419] p-3 rounded border-l-4 border-yellow-500">
                    <div className="font-semibold text-gray-900 dark:text-white text-sm mb-1">📉 Technical Exit Alerts</div>
                    <p className="text-xs text-gray-600 dark:text-[#8b949e]">
                      <strong>Trigger:</strong> Price crosses below enabled moving averages (50 EMA, 100 MA, 200 MA)<br/>
                      <strong>Logic:</strong> Daily technical data comparison, only fires if criteria enabled<br/>
                      <strong>Action:</strong> Warning notification, suggests reviewing position
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-[#0f1419] p-3 rounded border-l-4 border-purple-500">
                    <div className="font-semibold text-gray-900 dark:text-white text-sm mb-1">🔄 Monitoring Frequency</div>
                    <p className="text-xs text-gray-600 dark:text-[#8b949e]">
                      <strong>Check Interval:</strong> Once per day automatically<br/>
                      <strong>Duplicate Prevention:</strong> Same alert max once per 24 hours<br/>
                      <strong>Data Source:</strong> Real-time technical indicators updated daily
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">⚙️ Default Settings</h3>
                <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-2">
                  New investments automatically have these criteria enabled for protection:
                </p>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li>✅ Exit at Stop-Loss (with 100MA fallback)</li>
                  <li>✅ Exit at Target</li>
                  <li>✅ Exit Below 200 MA (long-term trend protection)</li>
                  <li>✅ Exit on Daily Supertrend (momentum protection)</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">🔧 How to Configure</h3>
                <ol className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-decimal">
                  <li>Click on an investment in your portfolio</li>
                  <li>Navigate to <strong>Exit Criteria</strong> section</li>
                  <li>Toggle ON/OFF for each exit rule based on your strategy</li>
                  <li>Set your stop-loss and target prices</li>
                  <li>Optionally add custom exit price levels</li>
                  <li>Add custom notes for your reference</li>
                  <li>Save changes - alerts will automatically monitor your settings</li>
                </ol>
              </div>

              <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 dark:text-green-400 mb-2">💡 Best Practices</h3>
                <ul className="text-sm text-green-800 dark:text-green-300 space-y-1 ml-4 list-disc">
                  <li>Always set a realistic stop-loss - system uses 100MA as fallback if none provided</li>
                  <li>Enable 200 MA exit for long-term trend protection on positional investments</li>
                  <li>Use 50 EMA exit for short-term investments requiring tighter controls</li>
                  <li>Daily Supertrend is ideal for swing and medium-term holdings</li>
                  <li>Alerts are recommendations - final decision is always yours</li>
                  <li>Review and adjust criteria periodically based on market conditions</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Section 7: Investment Ideas Community */}
        <section id="investment-ideas" className="mb-12 scroll-mt-20">
          <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">💡</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Investment Ideas Community</h2>
            </div>
            <p className="text-gray-600 dark:text-[#8b949e] mb-4">
              Share and discover investment opportunities with a community of investors.
            </p>
            <div className="mb-6 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-500 dark:border-blue-600 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-300 font-semibold flex items-center gap-2">
                <span className="text-xl">👥</span>
                <span>Learn from successful investors and share your winning strategies - grow together!</span>
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Share Your Ideas</h3>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li>Post detailed investment ideas with entry, target, and stop-loss</li>
                  <li>Add technical and fundamental analysis</li>
                  <li>Share your reasoning and strategy</li>
                  <li>Track performance of your shared ideas</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Discover Ideas</h3>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li>Browse ideas from successful investors</li>
                  <li>Filter by investment type, time frame, and status</li>
                  <li>Add ideas directly to your portfolio</li>
                  <li>Follow investors to get their latest ideas</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">How to Post an Idea</h3>
                <ol className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-decimal">
                  <li>Click <strong>New Idea</strong> from navigation</li>
                  <li>Enter stock symbol, entry price, quantity</li>
                  <li>Set target and stop-loss levels</li>
                  <li>Add your analysis and reasoning</li>
                  <li>Choose time frame (Short-term, Medium-term, Long-term)</li>
                  <li>Click <strong>Share Idea</strong></li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* Section 8: Notifications & Alerts */}
        <section id="notifications" className="mb-12 scroll-mt-20">
          <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">🔔</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications & Alerts</h2>
            </div>
            <p className="text-gray-600 dark:text-[#8b949e] mb-4">
              Stay informed with automated real-time alerts for important portfolio events and trading opportunities.
            </p>
            <div className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-500 dark:border-purple-600 rounded-lg p-4">
              <p className="text-sm text-purple-900 dark:text-purple-300 font-semibold flex items-center gap-2">
                <span className="text-xl">🔔</span>
                <span>Never miss entry prices, targets, or stop-losses again - automated alerts keep you ahead of the market!</span>
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-400 mb-2">🤖 Automated Alert System</h3>
                <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">
                  Our intelligent alert system monitors all your positions and ideas once per day,
                  automatically sending notifications when important price levels are hit.
                </p>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">🎯 Entry Price Alerts (Ideas)</h3>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li><strong>Cooking → Active</strong>: When an idea reaches entry price (±1% variance)</li>
                  <li>Automatic status update from "cooking" to "active"</li>
                  <li>Notifications sent to idea owner and all followers</li>
                  <li>Format: <code className="text-xs bg-gray-100 dark:bg-[#0f1419] px-1 rounded">SYMBOL reached entry price! Current: ₹XXX, Entry: ₹YYY - TradeIdea</code></li>
                </ul>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">✅ Target Price Alerts (Portfolio)</h3>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li>Alert when current price reaches or exceeds target price</li>
                  <li>Shows exact price levels for quick decision making</li>
                  <li>Clicking alert navigates directly to Portfolio page</li>
                  <li>Format: <code className="text-xs bg-gray-100 dark:bg-[#0f1419] px-1 rounded">SYMBOL reached target price! Current: ₹XXX, Target: ₹YYY - TradeIdea</code></li>
                </ul>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">⚠️ Stop Loss Alerts (Portfolio)</h3>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li><strong>Primary</strong>: Alert when price hits your defined stop-loss</li>
                  <li><strong>Fallback</strong>: If no stop-loss set, uses 100MA as safety net</li>
                  <li>Clear indication whether it's SL or 100MA trigger</li>
                  <li>Format: <code className="text-xs bg-gray-100 dark:bg-[#0f1419] px-1 rounded">SYMBOL hit stop loss! Current: ₹XXX, SL: ₹YYY - TradeIdea</code></li>
                </ul>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📉 Exit Criteria Alerts (Portfolio)</h3>
                <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-2">
                  Based on your configured exit criteria, alerts are triggered when price:
                </p>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li>Goes below 50 EMA (if enabled in exit criteria)</li>
                  <li>Goes below 100 MA (if enabled in exit criteria)</li>
                  <li>Goes below 200 MA (if enabled in exit criteria)</li>
                  <li>Custom exit price levels (if configured)</li>
                  <li>Format: <code className="text-xs bg-gray-100 dark:bg-[#0f1419] px-1 rounded">SYMBOL went below 200 MA! Current: ₹XXX, 200 MA: ₹YYY - TradeIdea</code></li>
                </ul>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">🔄 Monitoring Frequency</h3>
                <div className="space-y-2 text-sm text-gray-600 dark:text-[#8b949e]">
                  <p><strong>Check Interval:</strong> Once per day automatically</p>
                  <p><strong>Duplicate Prevention:</strong> Same alert sent max once per 24 hours</p>
                  <p><strong>Data Source:</strong> Daily price data from technical analysis updates</p>
                  <p><strong>Notification Delivery:</strong> Push to notification bell after daily check</p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">💡 Community Notifications</h3>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li>New ideas from investors you follow</li>
                  <li>Entry price alerts for followed ideas</li>
                  <li>Comments on your shared ideas</li>
                  <li>Likes and engagement updates</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">🔔 Alert Types & Icons</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎯</span>
                    <span className="text-gray-600 dark:text-[#8b949e]"><strong>Entry Alert</strong> - Idea reached entry price</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">✅</span>
                    <span className="text-gray-600 dark:text-[#8b949e]"><strong>Target Alert</strong> - Portfolio position hit target</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⚠️</span>
                    <span className="text-gray-600 dark:text-[#8b949e]"><strong>Stop Loss Alert</strong> - Position hit SL or exit criteria</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💡</span>
                    <span className="text-gray-600 dark:text-[#8b949e]"><strong>New Idea</strong> - Followed investor posted new idea</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📱 How to Manage Alerts</h3>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li>Click the bell icon (🔔) in navigation to view all notifications</li>
                  <li>Unread alerts show with blue dot indicator</li>
                  <li>Click notification to navigate to relevant page (idea/portfolio)</li>
                  <li>Mark individual alerts as read or "Mark all as read"</li>
                  <li>View full history in Activity page</li>
                </ul>
              </div>

              <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 dark:text-green-400 mb-2">💡 Pro Tips</h3>
                <ul className="text-sm text-green-800 dark:text-green-300 space-y-1 ml-4 list-disc">
                  <li>Alerts are sent only once per 24 hours to avoid spam</li>
                  <li>Entry price alerts auto-update idea status - no manual action needed</li>
                  <li>Portfolio alerts require you to manually close/exit your investments</li>
                  <li>Set realistic stop-loss or system will use 100MA as fallback</li>
                  <li>Configure exit criteria carefully - alerts fire based on your settings</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <div className="bg-gradient-to-r from-[#ff8c42]/10 to-orange-500/5 border-2 border-[#ff8c42] rounded-2xl p-8 text-center">
          <div className="text-4xl mb-4">🚀✨</div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Ready to Transform Your Investment Journey?</h2>
          <p className="text-lg text-gray-700 dark:text-[#c9d1d9] mb-6 font-medium">
            Join investors who never miss opportunities and always exit at the right time
          </p>

          {/* Top 3 Points */}
          <div className="max-w-2xl mx-auto mb-8 grid md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-[#1c2128] rounded-lg p-4 border border-gray-200 dark:border-[#30363d]">
              <div className="text-3xl mb-2">🔔</div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">Never Miss Alerts</h3>
              <p className="text-xs text-gray-600 dark:text-[#8b949e]">
                Automated notifications when entry, target, or stop-loss prices are hit
              </p>
            </div>
            <div className="bg-white dark:bg-[#1c2128] rounded-lg p-4 border border-gray-200 dark:border-[#30363d]">
              <div className="text-3xl mb-2">📊</div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">Daily Technical Analysis</h3>
              <p className="text-xs text-gray-600 dark:text-[#8b949e]">
                Automatic RSI, MACD, moving averages, and signals - no manual work
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
