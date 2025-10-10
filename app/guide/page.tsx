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
          <p className="text-lg text-gray-600 dark:text-[#8b949e]">
            Complete guide to all features and capabilities
          </p>
        </div>

        {/* Table of Contents */}
        <div className="mb-12 bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Table of Contents</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <a href="#portfolio-health" className="text-[#ff8c42] hover:underline">1. Portfolio Health Dashboard</a>
            <a href="#multi-account" className="text-[#ff8c42] hover:underline">2. Multi-Account Management</a>
            <a href="#csv-import" className="text-[#ff8c42] hover:underline">3. CSV Import</a>
            <a href="#technical-analysis" className="text-[#ff8c42] hover:underline">4. Technical Analysis</a>
            <a href="#fundamental-analysis" className="text-[#ff8c42] hover:underline">5. Fundamental Analysis</a>
            <a href="#exit-criteria" className="text-[#ff8c42] hover:underline">6. Smart Exit Criteria</a>
            <a href="#trading-ideas" className="text-[#ff8c42] hover:underline">7. Trading Ideas Community</a>
            <a href="#notifications" className="text-[#ff8c42] hover:underline">8. Notifications & Alerts</a>
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
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">⚠️ Risk Signals</h3>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li>Positions below stop-loss levels</li>
                  <li>Stocks trading below 50 EMA, 100 MA, or 200 MA</li>
                  <li>Weekly Supertrend exit signals</li>
                  <li>Warning indicators for high-risk positions</li>
                </ul>
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

        {/* Section 2: Multi-Account Management */}
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

        {/* Section 3: CSV Import */}
        <section id="csv-import" className="mb-12 scroll-mt-20">
          <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">📥</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">CSV Import</h2>
            </div>
            <p className="text-gray-600 dark:text-[#8b949e] mb-6">
              Quickly import your holdings from any broker with smart format detection.
            </p>

            <div className="space-y-4">
              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Supported Brokers</h3>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li><strong>Zerodha</strong> - Console holdings export</li>
                  <li><strong>ICICI Direct</strong> - Portfolio report with smart symbol mapping</li>
                  <li><strong>Standard Format</strong> - Custom CSV with symbol, quantity, entry price</li>
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
                  <li><strong>Supertrend</strong> - Weekly trend with buy/sell signals</li>
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
                <p className="text-sm text-orange-800 dark:text-orange-300">
                  Technical analysis data is updated daily through our automated batch job. When you first add a position,
                  the technical indicators will be calculated and appear within 24 hours (typically updated every evening).
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
                      <li>Weekly Supertrend turns bearish/red (if enabled)</li>
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
                      <li>Weekly Supertrend is bullish/green (weekly momentum)</li>
                      <li>Golden Cross present (50 EMA above 200 MA)</li>
                    </ul>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-500/10 p-3 rounded border-l-4 border-blue-500">
                    <div className="font-semibold text-blue-600 dark:text-blue-400 mb-1">💡 Pro Tip</div>
                    <p className="text-gray-600 dark:text-[#8b949e] text-xs">
                      These are automated suggestions based on technical signals. Always consider fundamental analysis,
                      market conditions, and your own research before making trading decisions.
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
                  <li><strong>Dividend Yield</strong> - Annual dividend percentage</li>
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

        {/* Section 6: Smart Exit Criteria */}
        <section id="exit-criteria" className="mb-12 scroll-mt-20">
          <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">🎯</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Smart Exit Criteria</h2>
            </div>
            <p className="text-gray-600 dark:text-[#8b949e] mb-6">
              Set custom rules for when to exit positions automatically based on technical signals.
            </p>

            <div className="space-y-4">
              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Available Exit Rules</h3>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li><strong>Exit at Stop-Loss</strong> - Alert when price hits stop-loss level</li>
                  <li><strong>Exit at Target</strong> - Alert when target price is reached</li>
                  <li><strong>Exit Below 50 EMA</strong> - Short-term trend reversal</li>
                  <li><strong>Exit Below 100 MA</strong> - Medium-term support break</li>
                  <li><strong>Exit Below 200 MA</strong> - Long-term trend break (Default: ON)</li>
                  <li><strong>Exit on Weekly Supertrend</strong> - Weekly trend reversal (Default: ON)</li>
                  <li><strong>Custom Note</strong> - Add your own exit conditions</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Default Settings</h3>
                <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-2">
                  New positions automatically have these criteria enabled:
                </p>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li>✅ Exit at Stop-Loss</li>
                  <li>✅ Exit at Target</li>
                  <li>✅ Exit Below 200 MA</li>
                  <li>✅ Exit on Weekly Supertrend</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">How to Configure</h3>
                <ol className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-decimal">
                  <li>Click on a position in your portfolio</li>
                  <li>Go to <strong>Exit Criteria</strong> section</li>
                  <li>Toggle ON/OFF for each exit rule</li>
                  <li>Set your stop-loss and target prices</li>
                  <li>Add custom notes if needed</li>
                  <li>Save changes</li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* Section 7: Trading Ideas Community */}
        <section id="trading-ideas" className="mb-12 scroll-mt-20">
          <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">💡</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Trading Ideas Community</h2>
            </div>
            <p className="text-gray-600 dark:text-[#8b949e] mb-6">
              Share and discover trading opportunities with a community of traders.
            </p>

            <div className="space-y-4">
              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Share Your Ideas</h3>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li>Post detailed trade setups with entry, target, and stop-loss</li>
                  <li>Add technical and fundamental analysis</li>
                  <li>Share your reasoning and strategy</li>
                  <li>Track performance of your shared ideas</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Discover Ideas</h3>
                <ul className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-disc">
                  <li>Browse ideas from successful traders</li>
                  <li>Filter by trade type, time frame, and status</li>
                  <li>Add ideas directly to your portfolio</li>
                  <li>Follow traders to get their latest ideas</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">How to Post an Idea</h3>
                <ol className="text-sm text-gray-600 dark:text-[#8b949e] space-y-1 ml-4 list-decimal">
                  <li>Click <strong>New Idea</strong> from navigation</li>
                  <li>Enter stock symbol, entry price, quantity</li>
                  <li>Set target and stop-loss levels</li>
                  <li>Add your analysis and reasoning</li>
                  <li>Choose time frame (Intraday, Swing, Positional)</li>
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
            <p className="text-gray-600 dark:text-[#8b949e] mb-6">
              Stay informed with automated real-time alerts for important portfolio events and trading opportunities.
            </p>

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
                  <li>New ideas from traders you follow</li>
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
                    <span className="text-gray-600 dark:text-[#8b949e]"><strong>New Idea</strong> - Followed trader posted new idea</span>
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
                  <li>Portfolio alerts require you to manually close/exit positions</li>
                  <li>Set realistic stop-loss or system will use 100MA as fallback</li>
                  <li>Configure exit criteria carefully - alerts fire based on your settings</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <div className="bg-gradient-to-r from-[#ff8c42]/10 to-orange-500/5 border-2 border-[#ff8c42] rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Ready to Get Started?</h2>
          <p className="text-gray-600 dark:text-[#8b949e] mb-6">
            Start managing your portfolio with powerful tools and insights
          </p>
          <Link
            href="/portfolio"
            className="inline-block px-6 py-3 bg-[#ff8c42] hover:bg-[#ff9a58] text-white font-semibold rounded-lg transition-colors"
          >
            Go to My Portfolio
          </Link>
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
