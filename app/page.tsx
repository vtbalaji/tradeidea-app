import { MyPortfolioIcon } from '@/components/icons';
import Logo from '../components/Logo';
import AuthRedirect from '../components/AuthRedirect';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      {/* Auth redirect component handles automatic redirect for logged-in users */}
      <AuthRedirect />

      {/* Landing page content - pre-rendered as static HTML */}
    <div className="min-h-screen bg-white dark:bg-[#0f1419]">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'TradeIdea',
            applicationCategory: 'FinanceApplication',
            operatingSystem: 'All',
            inLanguage: 'en-IN',
            areaServed: 'IN',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'INR',
              availability: 'https://schema.org/InStock',
              priceValidUntil: '2099-12-31',
            },
            description: 'Made in India for Indian investors. Portfolio tracking tool for NSE/BSE stocks with automated alerts. Import from Zerodha, ICICI Direct. NOT a forex trading platform.',
            keywords: 'Indian stock portfolio tracker, NSE BSE portfolio, Zerodha import, ICICI Direct, stock alerts India',
            featureList: [
              'Multi-account portfolio management',
              'Real-time technical analysis with EMA/MA crossovers, RSI, MACD, Bollinger Bands',
              'Daily market screeners for 50 MA, 200 MA, and Supertrend crossovers',
              'One-click conversion of screener results to trading ideas',
              'Fundamental analysis with P/E ratio, ROE, debt ratios',
              'Portfolio import from Zerodha, ICICI Direct',
              'Smart exit criteria and alerts',
              'Community trading ideas',
              'Portfolio health dashboard'
            ],
          }),
        }}
      />

      {/* Navigation */}
      <nav className="border-b border-gray-200 dark:border-[#30363d]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Logo size={40} />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">TradeIdea</span>
          </div>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-gray-700 dark:text-white hover:text-[#ff8c42] transition-colors font-semibold"
            >
              Login
            </Link>
            <Link
              href="/login"
              className="px-6 py-2 bg-[#ff8c42] hover:bg-[#ff9a58] text-white font-semibold rounded-lg transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        {/* Made in India Badge */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-100 to-green-100 dark:from-orange-900/30 dark:to-green-900/30 border-2 border-orange-500 dark:border-orange-400 rounded-full">
            <span className="text-2xl">🇮🇳</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">Made in India for Indian Investors</span>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 border border-blue-500 dark:border-blue-400 rounded-full">
            <span className="text-sm font-bold text-blue-900 dark:text-blue-300">NSE/BSE Stocks Only</span>
          </div>
        </div>

        {/* Anti-Scam Warning */}
        <div className="mb-6 inline-block">
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 px-4 py-2 rounded">
            <p className="text-sm font-semibold text-red-800 dark:text-red-300">
              ⚠️ NOT a Forex Trading Platform • Portfolio Tracking Tool Only • We Never Ask for Trading Passwords
            </p>
          </div>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
          Never Miss Another Entry or Exit<br />
          <span className="text-[#ff8c42]">Automated Alerts for Indian Stock Traders</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-[#8b949e] mb-10 max-w-3xl mx-auto">
          Track NSE/BSE stocks with automated technical & fundamental analysis.
          Get instant email alerts when stocks hit your entry, target, or stop-loss levels.
          Import from Zerodha/ICICI in one click.
        </p>

        {/* Top 3 Pain Points with Numbers */}
        <div className="max-w-4xl mx-auto mb-10 grid md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#1c2128] rounded-xl p-6 border-2 border-gray-200 dark:border-[#30363d] hover:border-[#ff8c42] dark:hover:border-[#ff8c42] transition-all hover:shadow-lg">
            <div className="text-4xl mb-3">🔔</div>
            <div className="text-2xl font-bold text-[#ff8c42] mb-2">Zero Missed Exits</div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base mb-2">
              Never Miss Profit Booking Opportunities
            </h3>
            <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-3">
              Instant email alerts when stocks hit your entry, target, or stop-loss levels
            </p>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
              <p className="text-xs font-semibold text-green-800 dark:text-green-300">
                💡 No more watching prices all day
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1c2128] rounded-xl p-6 border-2 border-gray-200 dark:border-[#30363d] hover:border-[#ff8c42] dark:hover:border-[#ff8c42] transition-all hover:shadow-lg">
            <div className="text-4xl mb-3">⏰</div>
            <div className="text-2xl font-bold text-[#ff8c42] mb-2">Save 5+ Hours/Week</div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base mb-2">
              Stop Manual Portfolio Tracking
            </h3>
            <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-3">
              Auto-updated technical indicators for all your holdings - daily, automatically
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                💡 Spend &lt;30 min/week vs 5-10 hours
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1c2128] rounded-xl p-6 border-2 border-gray-200 dark:border-[#30363d] hover:border-[#ff8c42] dark:hover:border-[#ff8c42] transition-all hover:shadow-lg">
            <div className="text-4xl mb-3">🛡️</div>
            <div className="text-2xl font-bold text-[#ff8c42] mb-2">Protect Capital</div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base mb-2">
              Automated Risk Management
            </h3>
            <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-3">
              Trailing stop-loss, technical exit signals, and instant risk warnings
            </p>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
              <p className="text-xs font-semibold text-red-800 dark:text-red-300">
                💡 Never forget a stop-loss again
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-center flex-wrap">
          <div className="relative">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#ff8c42] hover:bg-[#ff9a58] text-white text-lg font-bold rounded-lg transition-all shadow-lg hover:shadow-xl hover:scale-105 relative group"
            >
              Start Free - No Credit Card
              <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <div className="absolute -top-3 -right-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
              FREE
            </div>
          </div>
          <Link
            href="/ideas"
            className="inline-block px-8 py-4 bg-gray-100 dark:bg-[#1c2128] hover:bg-gray-200 dark:hover:bg-[#30363d] border-2 border-gray-300 dark:border-[#30363d] text-gray-900 dark:text-white text-lg font-semibold rounded-lg transition-all hover:border-[#ff8c42] dark:hover:border-[#ff8c42]"
          >
            View Live Ideas
          </Link>
        </div>

        {/* Micro Social Proof */}
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-[#8b949e]">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white dark:border-[#0f1419] flex items-center justify-center text-white text-xs font-bold">
              A
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-white dark:border-[#0f1419] flex items-center justify-center text-white text-xs font-bold">
              B
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 border-2 border-white dark:border-[#0f1419] flex items-center justify-center text-white text-xs font-bold">
              C
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 border-2 border-white dark:border-[#0f1419] flex items-center justify-center text-white text-xs font-bold">
              +
            </div>
          </div>
          <span className="font-medium">Join traders already tracking portfolios</span>
        </div>

        {/* Trust Signals - Quick Benefits */}
        <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm font-semibold text-gray-700 dark:text-[#8b949e]">
          <div className="flex items-center gap-2">
            <span className="text-green-500 text-lg">✓</span>
            <span>Free Forever Plan</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500 text-lg">✓</span>
            <span>No Credit Card Required</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500 text-lg">✓</span>
            <span>Bank-Grade Security</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500 text-lg">✓</span>
            <span>Import from Any Broker</span>
          </div>
        </div>
      </section>

      {/* Trust Signals Section - Integrations & Security */}
      <section className="bg-gray-50 dark:bg-[#0d1117] border-y border-gray-200 dark:border-[#30363d] py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-8">
            <p className="text-sm font-semibold text-gray-500 dark:text-[#8b949e] uppercase tracking-wide">
              Trusted Platform
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Broker Integrations */}
            <div className="text-center">
              <div className="bg-white dark:bg-[#1c2128] rounded-lg p-6 border border-gray-200 dark:border-[#30363d]">
                <div className="text-3xl mb-3">🔗</div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Broker Integrations</h3>
                <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-3">
                  Import holdings with one click
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-semibold rounded-full">
                    Zerodha
                  </span>
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-semibold rounded-full">
                    ICICI Direct
                  </span>
                  <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-full">
                    Any CSV
                  </span>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="text-center">
              <div className="bg-white dark:bg-[#1c2128] rounded-lg p-6 border border-gray-200 dark:border-[#30363d]">
                <div className="text-3xl mb-3">🔒</div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Bank-Grade Security</h3>
                <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-3">
                  Your data is encrypted and secure
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-semibold rounded-full">
                    Firebase Auth
                  </span>
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-semibold rounded-full">
                    Encrypted Data
                  </span>
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-semibold rounded-full">
                    Read-Only Import
                  </span>
                </div>
              </div>
            </div>

            {/* Free Plan */}
            <div className="text-center">
              <div className="bg-white dark:bg-[#1c2128] rounded-lg p-6 border-2 border-[#ff8c42] dark:border-[#ff8c42]">
                <div className="text-3xl mb-3">💎</div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">100% Free Forever</h3>
                <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-3">
                  All features, no hidden costs
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 text-xs font-semibold rounded-full">
                    No Credit Card
                  </span>
                  <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 text-xs font-semibold rounded-full">
                    Unlimited Portfolios
                  </span>
                  <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 text-xs font-semibold rounded-full">
                    Full Features
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Statement */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500 dark:text-[#6e7681] max-w-2xl mx-auto">
              🛡️ We never ask for your trading credentials. Portfolio import is read-only via CSV files.
              Your data stays private and is never shared with third parties.
            </p>
          </div>

          {/* Security & Privacy Badges */}
          <div className="mt-10 border-t border-gray-200 dark:border-[#30363d] pt-8">
            <p className="text-center text-xs font-semibold text-gray-500 dark:text-[#8b949e] uppercase tracking-wide mb-6">
              Security & Privacy Certifications
            </p>
            <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10">
              {/* Firebase Secure */}
              <div className="flex flex-col items-center">
                <div className="bg-white dark:bg-[#1c2128] border-2 border-gray-200 dark:border-[#30363d] rounded-lg px-6 py-3 hover:border-orange-400 dark:hover:border-orange-400 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="text-2xl">🔥</div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-gray-900 dark:text-white">Google Firebase</div>
                      <div className="text-xs text-gray-600 dark:text-[#8b949e]">Secure Authentication</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* HTTPS/SSL */}
              <div className="flex flex-col items-center">
                <div className="bg-white dark:bg-[#1c2128] border-2 border-gray-200 dark:border-[#30363d] rounded-lg px-6 py-3 hover:border-green-400 dark:hover:border-green-400 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="text-2xl">🔒</div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-gray-900 dark:text-white">256-bit SSL</div>
                      <div className="text-xs text-gray-600 dark:text-[#8b949e]">Encrypted Connection</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Privacy */}
              <div className="flex flex-col items-center">
                <div className="bg-white dark:bg-[#1c2128] border-2 border-gray-200 dark:border-[#30363d] rounded-lg px-6 py-3 hover:border-blue-400 dark:hover:border-blue-400 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="text-2xl">🛡️</div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-gray-900 dark:text-white">Data Privacy</div>
                      <div className="text-xs text-gray-600 dark:text-[#8b949e]">Your Data, Your Control</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* No Credentials Required */}
              <div className="flex flex-col items-center">
                <div className="bg-white dark:bg-[#1c2128] border-2 border-gray-200 dark:border-[#30363d] rounded-lg px-6 py-3 hover:border-purple-400 dark:hover:border-purple-400 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="text-2xl">✋</div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-gray-900 dark:text-white">Read-Only Access</div>
                      <div className="text-xs text-gray-600 dark:text-[#8b949e]">No Trading Credentials</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email Verified */}
              <div className="flex flex-col items-center">
                <div className="bg-white dark:bg-[#1c2128] border-2 border-gray-200 dark:border-[#30363d] rounded-lg px-6 py-3 hover:border-indigo-400 dark:hover:border-indigo-400 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="text-2xl">✉️</div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-gray-900 dark:text-white">Email Verification</div>
                      <div className="text-xs text-gray-600 dark:text-[#8b949e]">Protected Accounts</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Compliance Statement */}
            <div className="mt-6 max-w-3xl mx-auto">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">ℹ️</div>
                  <div className="flex-1 text-xs text-blue-900 dark:text-blue-300">
                    <p className="font-semibold mb-1">Privacy-First Design</p>
                    <p>
                      TradeIdea operates with complete transparency. We only collect the minimum data required
                      for functionality (email for login, portfolio data you upload). We never sell your data,
                      never require trading credentials, and never execute trades on your behalf. All portfolio
                      imports are CSV-based and read-only. Your trading decisions remain 100% in your control.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose TradeIdea - Comparison Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Why Choose TradeIdea Over Manual Tracking?
          </h2>
          <p className="text-lg text-gray-600 dark:text-[#8b949e] max-w-3xl mx-auto">
            Stop wasting hours on spreadsheets and missing crucial signals. See how TradeIdea automates what takes hours manually.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden border border-gray-200 dark:border-[#30363d] rounded-xl">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-[#30363d]">
                <thead className="bg-gray-50 dark:bg-[#0d1117]">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-[#8b949e] uppercase tracking-wider w-1/3">
                      Feature
                    </th>
                    <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-[#8b949e] uppercase tracking-wider w-1/3">
                      Manual Tracking
                    </th>
                    <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-[#ff8c42] uppercase tracking-wider w-1/3 bg-orange-50 dark:bg-orange-900/10">
                      <div className="flex items-center justify-center gap-2">
                        <span>TradeIdea</span>
                        <span className="px-2 py-0.5 bg-[#ff8c42] text-white text-xs rounded-full">FREE</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-[#0d1117] divide-y divide-gray-200 dark:divide-[#30363d]">
                  {/* Row 1 */}
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      Portfolio Import
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-red-500 text-2xl">✗</div>
                      <div className="text-xs text-gray-600 dark:text-[#8b949e] mt-1">Manual entry, hours of work</div>
                    </td>
                    <td className="px-6 py-4 text-center bg-green-50 dark:bg-green-900/10">
                      <div className="text-green-500 text-2xl">✓</div>
                      <div className="text-xs text-gray-900 dark:text-white font-semibold mt-1">One-click CSV import</div>
                    </td>
                  </tr>

                  {/* Row 2 */}
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      Technical Analysis
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-red-500 text-2xl">✗</div>
                      <div className="text-xs text-gray-600 dark:text-[#8b949e] mt-1">Check each stock manually</div>
                    </td>
                    <td className="px-6 py-4 text-center bg-green-50 dark:bg-green-900/10">
                      <div className="text-green-500 text-2xl">✓</div>
                      <div className="text-xs text-gray-900 dark:text-white font-semibold mt-1">10+ indicators auto-updated daily</div>
                    </td>
                  </tr>

                  {/* Row 3 */}
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      Entry/Exit Alerts
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-red-500 text-2xl">✗</div>
                      <div className="text-xs text-gray-600 dark:text-[#8b949e] mt-1">Watch prices constantly</div>
                    </td>
                    <td className="px-6 py-4 text-center bg-green-50 dark:bg-green-900/10">
                      <div className="text-green-500 text-2xl">✓</div>
                      <div className="text-xs text-gray-900 dark:text-white font-semibold mt-1">Instant email notifications</div>
                    </td>
                  </tr>

                  {/* Row 4 */}
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      Market Screeners
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-red-500 text-2xl">✗</div>
                      <div className="text-xs text-gray-600 dark:text-[#8b949e] mt-1">Research each stock individually</div>
                    </td>
                    <td className="px-6 py-4 text-center bg-green-50 dark:bg-green-900/10">
                      <div className="text-green-500 text-2xl">✓</div>
                      <div className="text-xs text-gray-900 dark:text-white font-semibold mt-1">Daily crossover opportunities</div>
                    </td>
                  </tr>

                  {/* Row 5 */}
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      Multi-Portfolio Support
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-red-500 text-2xl">✗</div>
                      <div className="text-xs text-gray-600 dark:text-[#8b949e] mt-1">Separate spreadsheets</div>
                    </td>
                    <td className="px-6 py-4 text-center bg-green-50 dark:bg-green-900/10">
                      <div className="text-green-500 text-2xl">✓</div>
                      <div className="text-xs text-gray-900 dark:text-white font-semibold mt-1">Unlimited portfolios in one place</div>
                    </td>
                  </tr>

                  {/* Row 6 */}
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      Exit Criteria Tracking
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-red-500 text-2xl">✗</div>
                      <div className="text-xs text-gray-600 dark:text-[#8b949e] mt-1">Forget stop-loss levels</div>
                    </td>
                    <td className="px-6 py-4 text-center bg-green-50 dark:bg-green-900/10">
                      <div className="text-green-500 text-2xl">✓</div>
                      <div className="text-xs text-gray-900 dark:text-white font-semibold mt-1">Trailing SL, targets, technical exits</div>
                    </td>
                  </tr>

                  {/* Row 7 */}
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      Time Spent Weekly
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-red-600 dark:text-red-400 text-2xl font-bold">5-10 hrs</div>
                      <div className="text-xs text-gray-600 dark:text-[#8b949e] mt-1">Updating, checking, analyzing</div>
                    </td>
                    <td className="px-6 py-4 text-center bg-green-50 dark:bg-green-900/10">
                      <div className="text-green-600 dark:text-green-400 text-2xl font-bold">&lt;30 min</div>
                      <div className="text-xs text-gray-900 dark:text-white font-semibold mt-1">Just review alerts</div>
                    </td>
                  </tr>

                  {/* Row 8 - Cost */}
                  <tr className="bg-gray-50 dark:bg-[#0d1117]">
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                      Cost
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-gray-900 dark:text-white text-2xl font-bold">Your Time</div>
                      <div className="text-xs text-gray-600 dark:text-[#8b949e] mt-1">Priceless hours wasted</div>
                    </td>
                    <td className="px-6 py-4 text-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10">
                      <div className="text-green-600 dark:text-green-400 text-3xl font-bold">₹0</div>
                      <div className="text-xs text-gray-900 dark:text-white font-semibold mt-1">Free Forever</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 text-center">
          <p className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Save 5+ hours every week. Start tracking smarter, not harder.
          </p>
          <Link
            href="/login"
            className="px-8 py-3 bg-[#ff8c42] hover:bg-[#ff9a58] text-white text-lg font-bold rounded-lg transition-all shadow-lg hover:shadow-xl hover:scale-105"
          >
            Start Free Now →
          </Link>
        </div>
      </section>

      {/* Live Dashboard Preview Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <div className="inline-block bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-4 py-2 rounded-full text-sm font-bold mb-4">
            ✨ See It In Action
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Portfolio Health at a Glance
          </h2>
          <p className="text-lg text-gray-600 dark:text-[#8b949e] max-w-3xl mx-auto">
            Everything you need in one dashboard. No more switching between apps or spreadsheets.
          </p>
        </div>

        {/* Mock Dashboard Preview */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#0d1117] dark:to-[#1c2128] rounded-2xl border-2 border-gray-300 dark:border-[#30363d] overflow-hidden shadow-2xl">
          {/* Mock Browser Header */}
          <div className="bg-gray-200 dark:bg-[#0d1117] border-b border-gray-300 dark:border-[#30363d] px-4 py-3 flex items-center gap-2">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="flex-1 mx-4 bg-white dark:bg-[#1c2128] rounded px-3 py-1 text-xs text-gray-500 dark:text-[#8b949e]">
              tradeidea.co.in/portfolio
            </div>
          </div>

          {/* Mock Dashboard Content */}
          <div className="p-6 md:p-8 bg-white dark:bg-[#0d1117]">
            {/* Portfolio Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {/* Total Value */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <div className="text-xs text-green-700 dark:text-green-400 font-semibold mb-1">Total Value</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">₹8,45,230</div>
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">+₹45,230 (5.6%)</div>
              </div>

              {/* Today's Change */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="text-xs text-blue-700 dark:text-blue-400 font-semibold mb-1">Today's P&L</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">+₹12,450</div>
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">+1.5%</div>
              </div>

              {/* Risk Alerts */}
              <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                <div className="text-xs text-red-700 dark:text-red-400 font-semibold mb-1">Risk Alerts</div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">2</div>
                <div className="text-xs text-red-600 dark:text-red-400 mt-1">Below SL</div>
              </div>

              {/* Action Items */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <div className="text-xs text-purple-700 dark:text-purple-400 font-semibold mb-1">Action Items</div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">5</div>
                <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">Near Target</div>
              </div>
            </div>

            {/* Mock Holdings Table */}
            <div className="bg-gray-50 dark:bg-[#1c2128] rounded-xl border border-gray-200 dark:border-[#30363d] overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-[#30363d] bg-gray-100 dark:bg-[#0d1117] flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Your Holdings (12)</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 dark:text-[#8b949e]">Updated: 2 mins ago</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>

              {/* Table Header */}
              <div className="hidden md:grid grid-cols-7 gap-2 px-4 py-2 text-xs font-semibold text-gray-600 dark:text-[#8b949e] border-b border-gray-200 dark:border-[#30363d] bg-gray-100 dark:bg-[#0d1117]">
                <div className="col-span-2">Stock</div>
                <div className="text-right">Entry</div>
                <div className="text-right">LTP</div>
                <div className="text-right">P&L</div>
                <div className="text-center">Technical</div>
                <div className="text-center">Action</div>
              </div>

              {/* Sample Row 1 - RELIANCE */}
              <div className="grid grid-cols-1 md:grid-cols-7 gap-2 px-4 py-3 text-sm border-b border-gray-200 dark:border-[#30363d] hover:bg-gray-100 dark:hover:bg-[#161b22] transition-colors">
                <div className="col-span-1 md:col-span-2">
                  <div className="font-bold text-gray-900 dark:text-white">RELIANCE</div>
                  <div className="text-xs text-gray-600 dark:text-[#8b949e]">Oil & Gas • NSE</div>
                  <div className="flex items-center gap-2 mt-1 md:hidden">
                    <span className="text-xs text-gray-600 dark:text-[#8b949e]">₹2,250 → ₹2,450</span>
                    <span className="text-xs text-green-600 dark:text-green-400 font-semibold">+8.5%</span>
                  </div>
                </div>
                <div className="text-right text-gray-600 dark:text-[#8b949e] hidden md:block">₹2,250</div>
                <div className="text-right hidden md:block">
                  <div className="text-gray-900 dark:text-white font-semibold">₹2,450</div>
                  <div className="text-xs text-green-600 dark:text-green-400">+₹200</div>
                </div>
                <div className="text-right text-green-600 dark:text-green-400 font-bold hidden md:block">+8.5%</div>
                <div className="text-center">
                  <div className="inline-flex flex-col items-center gap-1">
                    <span className="inline-block px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded">BUY</span>
                    <span className="text-xs text-gray-600 dark:text-[#8b949e]">50MA ↑</span>
                  </div>
                </div>
                <div className="text-center flex md:block justify-end gap-2">
                  <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold rounded">HOLD</span>
                </div>
              </div>

              {/* Sample Row 2 - TCS */}
              <div className="grid grid-cols-1 md:grid-cols-7 gap-2 px-4 py-3 text-sm border-b border-gray-200 dark:border-[#30363d] hover:bg-gray-100 dark:hover:bg-[#161b22] transition-colors">
                <div className="col-span-1 md:col-span-2">
                  <div className="font-bold text-gray-900 dark:text-white">TCS</div>
                  <div className="text-xs text-gray-600 dark:text-[#8b949e]">IT Services • NSE</div>
                  <div className="flex items-center gap-2 mt-1 md:hidden">
                    <span className="text-xs text-gray-600 dark:text-[#8b949e]">₹3,280 → ₹3,680</span>
                    <span className="text-xs text-green-600 dark:text-green-400 font-semibold">+12.3%</span>
                  </div>
                </div>
                <div className="text-right text-gray-600 dark:text-[#8b949e] hidden md:block">₹3,280</div>
                <div className="text-right hidden md:block">
                  <div className="text-gray-900 dark:text-white font-semibold">₹3,680</div>
                  <div className="text-xs text-green-600 dark:text-green-400">+₹400</div>
                </div>
                <div className="text-right text-green-600 dark:text-green-400 font-bold hidden md:block">+12.3%</div>
                <div className="text-center">
                  <div className="inline-flex flex-col items-center gap-1">
                    <span className="inline-block px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-bold rounded">TARGET</span>
                    <span className="text-xs text-gray-600 dark:text-[#8b949e]">Near ₹3,700</span>
                  </div>
                </div>
                <div className="text-center flex md:block justify-end gap-2">
                  <span className="inline-block px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-bold rounded">BOOK 50%</span>
                </div>
              </div>

              {/* Sample Row 3 - INFY */}
              <div className="grid grid-cols-1 md:grid-cols-7 gap-2 px-4 py-3 text-sm border-b border-gray-200 dark:border-[#30363d] hover:bg-gray-100 dark:hover:bg-[#161b22] transition-colors">
                <div className="col-span-1 md:col-span-2">
                  <div className="font-bold text-gray-900 dark:text-white">INFY</div>
                  <div className="text-xs text-gray-600 dark:text-[#8b949e]">IT Services • NSE</div>
                  <div className="flex items-center gap-2 mt-1 md:hidden">
                    <span className="text-xs text-gray-600 dark:text-[#8b949e]">₹1,570 → ₹1,520</span>
                    <span className="text-xs text-red-600 dark:text-red-400 font-semibold">-3.2%</span>
                  </div>
                </div>
                <div className="text-right text-gray-600 dark:text-[#8b949e] hidden md:block">₹1,570</div>
                <div className="text-right hidden md:block">
                  <div className="text-gray-900 dark:text-white font-semibold">₹1,520</div>
                  <div className="text-xs text-red-600 dark:text-red-400">-₹50</div>
                </div>
                <div className="text-right text-red-600 dark:text-red-400 font-bold hidden md:block">-3.2%</div>
                <div className="text-center">
                  <div className="inline-flex flex-col items-center gap-1">
                    <span className="inline-block px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold rounded">RISK</span>
                    <span className="text-xs text-gray-600 dark:text-[#8b949e]">Below 100MA</span>
                  </div>
                </div>
                <div className="text-center flex md:block justify-end gap-2">
                  <span className="inline-block px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold rounded">REVIEW</span>
                </div>
              </div>

              {/* Sample Row 4 - HDFC BANK */}
              <div className="grid grid-cols-1 md:grid-cols-7 gap-2 px-4 py-3 text-sm border-b border-gray-200 dark:border-[#30363d] hover:bg-gray-100 dark:hover:bg-[#161b22] transition-colors">
                <div className="col-span-1 md:col-span-2">
                  <div className="font-bold text-gray-900 dark:text-white">HDFCBANK</div>
                  <div className="text-xs text-gray-600 dark:text-[#8b949e]">Banking • NSE</div>
                  <div className="flex items-center gap-2 mt-1 md:hidden">
                    <span className="text-xs text-gray-600 dark:text-[#8b949e]">₹1,640 → ₹1,685</span>
                    <span className="text-xs text-green-600 dark:text-green-400 font-semibold">+2.7%</span>
                  </div>
                </div>
                <div className="text-right text-gray-600 dark:text-[#8b949e] hidden md:block">₹1,640</div>
                <div className="text-right hidden md:block">
                  <div className="text-gray-900 dark:text-white font-semibold">₹1,685</div>
                  <div className="text-xs text-green-600 dark:text-green-400">+₹45</div>
                </div>
                <div className="text-right text-green-600 dark:text-green-400 font-bold hidden md:block">+2.7%</div>
                <div className="text-center">
                  <div className="inline-flex flex-col items-center gap-1">
                    <span className="inline-block px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded">BUY</span>
                    <span className="text-xs text-gray-600 dark:text-[#8b949e]">Golden Cross</span>
                  </div>
                </div>
                <div className="text-center flex md:block justify-end gap-2">
                  <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold rounded">HOLD</span>
                </div>
              </div>

              {/* Sample Row 5 - ICICI BANK */}
              <div className="grid grid-cols-1 md:grid-cols-7 gap-2 px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-[#161b22] transition-colors">
                <div className="col-span-1 md:col-span-2">
                  <div className="font-bold text-gray-900 dark:text-white">ICICIBANK</div>
                  <div className="text-xs text-gray-600 dark:text-[#8b949e]">Banking • NSE</div>
                  <div className="flex items-center gap-2 mt-1 md:hidden">
                    <span className="text-xs text-gray-600 dark:text-[#8b949e]">₹1,080 → ₹1,120</span>
                    <span className="text-xs text-green-600 dark:text-green-400 font-semibold">+3.7%</span>
                  </div>
                </div>
                <div className="text-right text-gray-600 dark:text-[#8b949e] hidden md:block">₹1,080</div>
                <div className="text-right hidden md:block">
                  <div className="text-gray-900 dark:text-white font-semibold">₹1,120</div>
                  <div className="text-xs text-green-600 dark:text-green-400">+₹40</div>
                </div>
                <div className="text-right text-green-600 dark:text-green-400 font-bold hidden md:block">+3.7%</div>
                <div className="text-center">
                  <div className="inline-flex flex-col items-center gap-1">
                    <span className="inline-block px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold rounded">NEUTRAL</span>
                    <span className="text-xs text-gray-600 dark:text-[#8b949e]">Consolidating</span>
                  </div>
                </div>
                <div className="text-center flex md:block justify-end gap-2">
                  <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold rounded">HOLD</span>
                </div>
              </div>

              {/* View More Indicator */}
              <div className="px-4 py-3 bg-gray-100 dark:bg-[#0d1117] text-center border-t border-gray-200 dark:border-[#30363d]">
                <span className="text-xs text-gray-600 dark:text-[#8b949e]">+ 7 more holdings...</span>
              </div>
            </div>

            {/* Call to Action Overlay */}
            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="px-8 py-3 bg-[#ff8c42] hover:bg-[#ff9a58] text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl hover:scale-105 inline-flex items-center gap-2"
              >
                <span>See Your Portfolio Like This</span>
                <span className="text-xl">→</span>
              </Link>
              <p className="text-xs text-gray-500 dark:text-[#8b949e] mt-3">
                Import your holdings in 2 minutes • Free forever • No credit card
              </p>
            </div>
          </div>
        </div>

        {/* Feature Highlights Below Dashboard */}
        <div className="grid md:grid-cols-4 gap-6 mt-12">
          <div className="bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg p-4 text-center hover:border-[#ff8c42] transition-colors">
            <div className="text-2xl mb-2">💰</div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-1">Total Value & P&L</h4>
            <p className="text-sm text-gray-600 dark:text-[#8b949e]">
              Current portfolio worth, unrealized gains/losses, and daily changes
            </p>
          </div>
          <div className="bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg p-4 text-center hover:border-[#ff8c42] transition-colors">
            <div className="text-2xl mb-2">⚠️</div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-1">Risk Signals</h4>
            <p className="text-sm text-gray-600 dark:text-[#8b949e]">
              Positions below EMA/MA, stop-loss breaches, and exit alerts
            </p>
          </div>
          <div className="bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg p-4 text-center hover:border-[#ff8c42] transition-colors">
            <div className="text-2xl mb-2">📈</div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-1">Technical Health</h4>
            <p className="text-sm text-gray-600 dark:text-[#8b949e]">
              EMA crossovers, Supertrend signals, and momentum indicators
            </p>
          </div>
          <div className="bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg p-4 text-center hover:border-[#ff8c42] transition-colors">
            <div className="text-2xl mb-2">🎯</div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-1">Action Items</h4>
            <p className="text-sm text-gray-600 dark:text-[#8b949e]">
              Positions near targets, pending exits, and opportunities
            </p>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 bg-gray-50 dark:bg-[#0d1117]">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Tired of Missing Opportunities?
          </h2>
          <p className="text-lg text-gray-600 dark:text-[#8b949e] max-w-3xl mx-auto">
            You're not alone. Here's what manual portfolio tracking costs you every single day.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Pain Point 1 */}
          <div className="bg-white dark:bg-[#1c2128] rounded-xl p-6 border-l-4 border-red-500">
            <div className="flex items-start gap-4">
              <div className="text-3xl">😰</div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">
                  "I missed my profit target by just ₹2"
                </h3>
                <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-3">
                  Stock hit your target at 11:37 AM while you were in a meeting. By the time you checked, it had dropped 5%.
                </p>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                  <p className="text-xs font-semibold text-red-800 dark:text-red-300">
                    ❌ Result: Lost ₹5,000 potential profit
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pain Point 2 */}
          <div className="bg-white dark:bg-[#1c2128] rounded-xl p-6 border-l-4 border-orange-500">
            <div className="flex items-start gap-4">
              <div className="text-3xl">⏰</div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">
                  "Spent Sunday updating my spreadsheet"
                </h3>
                <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-3">
                  3 hours manually entering prices, calculating P&L, checking moving averages for 25 stocks.
                </p>
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
                  <p className="text-xs font-semibold text-orange-800 dark:text-orange-300">
                    ❌ Result: 12+ hours wasted monthly
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pain Point 3 */}
          <div className="bg-white dark:bg-[#1c2128] rounded-xl p-6 border-l-4 border-purple-500">
            <div className="flex items-start gap-4">
              <div className="text-3xl">📉</div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">
                  "I forgot my stop-loss level"
                </h3>
                <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-3">
                  Bought at ₹450, meant to exit at ₹430. Stock crashed to ₹410 while you weren't watching. Small loss became big loss.
                </p>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                  <p className="text-xs font-semibold text-purple-800 dark:text-purple-300">
                    ❌ Result: -8% loss instead of -4%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pain Point 4 */}
          <div className="bg-white dark:bg-[#1c2128] rounded-xl p-6 border-l-4 border-blue-500">
            <div className="flex items-start gap-4">
              <div className="text-3xl">🔍</div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">
                  "Opportunity passed while researching"
                </h3>
                <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-3">
                  By the time you manually screened 500 stocks for Golden Cross signals, the best entries were already gone.
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                    ❌ Result: Missed 3 strong setups
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Solution CTA */}
        <div className="mt-12 text-center">
          <div className="inline-block bg-gradient-to-r from-[#ff8c42] to-orange-500 text-white rounded-xl p-8 max-w-3xl">
            <h3 className="text-2xl font-bold mb-3">TradeIdea Solves All of This</h3>
            <p className="text-lg mb-4 opacity-95">
              Automated alerts, daily analysis, instant notifications, and 24/7 monitoring - all in one place, completely free.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm font-semibold">
              <div className="flex items-center gap-2">
                <span className="text-xl">✓</span>
                <span>Zero missed exits</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">✓</span>
                <span>Save 5+ hours/week</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">✓</span>
                <span>Never forget stop-loss</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">Powerful Features for Traders</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-6 text-center">
            <div className="text-5xl mb-4">💡</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Share Trading Ideas</h3>
            <p className="text-gray-600 dark:text-[#8b949e]">
              Post detailed trade setups with entry, targets, and stop-loss levels.
              Share your analysis with the community.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-6 text-center">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Advanced Technical Analysis</h3>
            <p className="text-gray-600 dark:text-[#8b949e]">
              Automated indicators: EMA/MA crossovers, Golden Cross, RSI, MACD, Bollinger Bands,
              and Supertrend for every stock.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-6 text-center">
            <div className="text-5xl mb-4">💼</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Fundamental Analysis</h3>
            <p className="text-gray-600 dark:text-[#8b949e]">
              Access key metrics like P/E ratio, market cap, revenue growth, ROE, debt ratios,
              and more for informed decisions.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-6 text-center">
            <div className="text-5xl mb-4">📂</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Multi-Account Support</h3>
            <p className="text-gray-600 dark:text-[#8b949e]">
              Manage multiple portfolios (Personal, Spouse, Kids) with separate tracking,
              colors, and performance metrics.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-6 text-center">
            <div className="text-5xl mb-4">📥</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Portfolio Import</h3>
            <p className="text-gray-600 dark:text-[#8b949e]">
              Easily import holdings from Zerodha, ICICI Direct, or any broker.
              Smart mapping handles different formats automatically.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-6 text-center">
            <div className="text-5xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Smart Exit Criteria</h3>
            <p className="text-gray-600 dark:text-[#8b949e]">
              Set custom exit rules: Stop-loss, targets, EMA/MA levels, and Supertrend signals
              for automatic alerts.
            </p>
          </div>

          {/* Feature 7 - NEW */}
          <div className="bg-gradient-to-br from-[#ff8c42]/10 to-orange-500/5 border-2 border-[#ff8c42] dark:bg-[#1c2128] rounded-xl p-6 text-center relative overflow-hidden">
            <div className="absolute top-2 right-2 px-2 py-0.5 bg-[#ff8c42] text-white text-xs font-bold rounded-full">
              NEW
            </div>
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Market Screeners</h3>
            <p className="text-gray-600 dark:text-[#8b949e]">
              Discover daily crossover opportunities: 50 MA, 200 MA, and Supertrend signals.
              Convert screener results to trading ideas with one click.
            </p>
          </div>

          {/* Feature 8 */}
          <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-6 text-center">
            <div className="text-5xl mb-4">🤝</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Community Ideas</h3>
            <p className="text-gray-600 dark:text-[#8b949e]">
              Learn from other traders' ideas, follow successful strategies, and engage
              in discussions about market opportunities.
            </p>
          </div>

          {/* Feature 9 */}
          <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-6 text-center">
            <div className="text-5xl mb-4">⚡</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Real-time Updates</h3>
            <p className="text-gray-600 dark:text-[#8b949e]">
              Technical indicators updated daily with latest market data. Stay informed
              about your portfolio positions automatically.
            </p>
          </div>
        </div>
      </section>

      {/* New Screener Feature Highlight */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border-2 border-blue-500 dark:border-blue-400 rounded-2xl p-8 md:p-12">
          <div className="text-center mb-8">
            <div className="inline-block px-4 py-1 bg-blue-500 text-white text-sm font-bold rounded-full mb-4">
              NEW FEATURE
            </div>
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Daily Market Screeners
            </h2>
            <p className="text-lg text-gray-600 dark:text-[#8b949e] max-w-3xl mx-auto">
              Discover fresh trading opportunities every day with our automated technical screeners.
              Find stocks crossing key moving averages and Supertrend levels - the signals that matter most.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg p-6">
              <div className="text-3xl mb-3">📊</div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">50 & 200 MA Crossovers</h4>
              <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-3">
                Identify stocks crossing major moving averages - classic bullish/bearish signals
                used by professional traders.
              </p>
              <ul className="text-xs text-gray-600 dark:text-[#8b949e] space-y-1">
                <li>• Golden Cross opportunities</li>
                <li>• Death Cross warnings</li>
                <li>• Dual crossover alerts</li>
              </ul>
            </div>
            <div className="bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg p-6">
              <div className="text-3xl mb-3">📈</div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">Supertrend Signals</h4>
              <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-3">
                Catch trend reversals early with Supertrend crossovers - powerful momentum
                indicators for entry/exit timing.
              </p>
              <ul className="text-xs text-gray-600 dark:text-[#8b949e] space-y-1">
                <li>• Bullish trend starts</li>
                <li>• Bearish trend reversals</li>
                <li>• Momentum confirmation</li>
              </ul>
            </div>
            <div className="bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg p-6">
              <div className="text-3xl mb-3">💡</div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">One-Click to Idea</h4>
              <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-3">
                Convert any screener result into a complete trading idea with pre-filled
                entry, stop-loss, and target levels.
              </p>
              <ul className="text-xs text-gray-600 dark:text-[#8b949e] space-y-1">
                <li>• Auto-calculated entry at support</li>
                <li>• Smart stop-loss placement</li>
                <li>• 2:1 risk-reward targets</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-r from-[#ff8c42]/10 to-purple-500/10 border-2 border-[#ff8c42] dark:border-[#ff8c42] rounded-2xl p-12 text-center relative overflow-hidden">
          {/* <div className="absolute top-4 right-4 px-4 py-1 bg-[#ff8c42] text-white text-sm font-bold rounded-full">
            Coming Soon
          </div> */}
          <div className="text-6xl mb-6">🔔</div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Smart Signal Alerts
          </h2>
          <p className="text-lg text-gray-600 dark:text-[#8b949e] mb-6 max-w-3xl mx-auto">
            Set your buy/sell parameters based on technical, fundamental, and sentiment analysis.
            Our system will automatically scan the market and notify you when opportunities match your criteria.
            <strong className="block mt-2 text-gray-900 dark:text-white">No more manual tracking!</strong>
          </p>
          <div className="grid md:grid-cols-3 gap-6 mt-8 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
              <div className="text-2xl mb-2">📈</div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-1">Technical Signals</h4>
              <p className="text-sm text-gray-600 dark:text-[#8b949e]">
                EMA crossovers, RSI levels, MACD divergence, volume breakouts
              </p>
            </div>
            <div className="bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
              <div className="text-2xl mb-2">💼</div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-1">Fundamental Filters</h4>
              <p className="text-sm text-gray-600 dark:text-[#8b949e]">
                P/E ratio, market cap, revenue growth, profit margins
              </p>
            </div>
            <div className="bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
              <div className="text-2xl mb-2">💬</div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-1">Sentiment Analysis</h4>
              <p className="text-sm text-gray-600 dark:text-[#8b949e]">
                News sentiment, social media buzz, analyst ratings
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Investment Journey - Visual Flow */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Your Investment Journey</h2>
          <p className="text-lg text-gray-600 dark:text-[#8b949e] max-w-3xl mx-auto mb-4">
            From discovering opportunities to booking profits - automated alerts guide you every step of the way
          </p>
          <div className="inline-block bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg px-4 py-2">
            <p className="text-sm text-blue-900 dark:text-blue-300 font-semibold">
              Three Ways to Start: Use Screener • Create Idea • Import Portfolio
            </p>
          </div>
        </div>

        {/* Scenario 1: Starting with Screener */}
        <div className="relative mb-16">
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-2 rounded-full font-bold text-lg mb-2">
              Scenario 1: Discover from Screener
            </div>
            <p className="text-sm text-gray-600 dark:text-[#8b949e] mt-2">
              Use our automated screeners to find daily crossover opportunities
            </p>
          </div>

          {/* Desktop Flow - Horizontal */}
          <div className="hidden md:block">
            <div className="flex items-start justify-between gap-3">
              {/* Step 1: Screener */}
              <div className="flex-1 text-center">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-500 rounded-xl p-5 h-full">
                  <div className="text-4xl mb-2">🔍</div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">1. Screener</h3>
                  <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-2">
                    Daily crossover signals: 50/200 MA, Supertrend
                  </p>
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                    Find opportunities
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center pt-12">
                <div className="text-2xl text-[#ff8c42]">→</div>
              </div>

              {/* Step 2: Interest/Review */}
              <div className="flex-1 text-center">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-2 border-indigo-500 rounded-xl p-5 h-full">
                  <div className="text-4xl mb-2">👀</div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">2. Review</h3>
                  <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-2">
                    Analyze technical & fundamental data
                  </p>
                  <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                    Research interest
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center pt-12">
                <div className="text-2xl text-[#ff8c42]">→</div>
              </div>

              {/* Step 3: Investment Idea */}
              <div className="flex-1 text-center">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-500 rounded-xl p-5 h-full">
                  <div className="text-4xl mb-2">💡</div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">3. Create Idea</h3>
                  <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-2">
                    One-click conversion with auto entry, SL, target
                  </p>
                  <div className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
                    Create plan
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center pt-12">
                <div className="text-2xl text-[#ff8c42]">→</div>
              </div>

              {/* Step 4: Right Price Alert */}
              <div className="flex-1 text-center">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-500 rounded-xl p-5 h-full">
                  <div className="text-4xl mb-2">🔔</div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">4. Entry Alert</h3>
                  <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-2">
                    Alert when price hits entry level
                  </p>
                  <div className="text-xs text-green-600 dark:text-green-400 font-semibold">
                    Perfect timing
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center pt-12">
                <div className="text-2xl text-[#ff8c42]">→</div>
              </div>

              {/* Step 5: Portfolio */}
              <div className="flex-1 text-center">
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-2 border-orange-500 rounded-xl p-5 h-full">
                  <div className="text-4xl mb-2">📊</div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">5. Portfolio</h3>
                  <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-2">
                    Track with exit criteria
                  </p>
                  <div className="text-xs text-orange-600 dark:text-orange-400 font-semibold">
                    Monitor position
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center pt-12">
                <div className="text-2xl text-[#ff8c42]">→</div>
              </div>

              {/* Step 6: Exit Alert & Book Profit */}
              <div className="flex-1 text-center">
                <div className="bg-gradient-to-br from-yellow-50 to-lime-50 dark:from-yellow-900/20 dark:to-lime-900/20 border-2 border-yellow-500 rounded-xl p-5 h-full">
                  <div className="text-4xl mb-2">🎯</div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">6. Book Profit</h3>
                  <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-2">
                    Target/SL alerts at exit
                  </p>
                  <div className="text-xs text-yellow-600 dark:text-yellow-400 font-semibold">
                    Lock gains
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Flow - Vertical */}
          <div className="md:hidden space-y-3">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-500 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-3xl">🔍</div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">1. Screener</h3>
              </div>
              <p className="text-xs text-gray-600 dark:text-[#8b949e]">Daily crossover signals</p>
            </div>
            <div className="text-center text-2xl text-[#ff8c42]">↓</div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-2 border-indigo-500 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-3xl">👀</div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">2. Review</h3>
              </div>
              <p className="text-xs text-gray-600 dark:text-[#8b949e]">Analyze technical & fundamentals</p>
            </div>
            <div className="text-center text-2xl text-[#ff8c42]">↓</div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-500 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-3xl">💡</div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">3. Create Idea</h3>
              </div>
              <p className="text-xs text-gray-600 dark:text-[#8b949e]">One-click conversion</p>
            </div>
            <div className="text-center text-2xl text-[#ff8c42]">↓</div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-500 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-3xl">🔔</div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">4. Entry Alert</h3>
              </div>
              <p className="text-xs text-gray-600 dark:text-[#8b949e]">Alert at entry price</p>
            </div>
            <div className="text-center text-2xl text-[#ff8c42]">↓</div>

            <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-2 border-orange-500 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-3xl">📊</div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">5. Portfolio</h3>
              </div>
              <p className="text-xs text-gray-600 dark:text-[#8b949e]">Track with exit criteria</p>
            </div>
            <div className="text-center text-2xl text-[#ff8c42]">↓</div>

            <div className="bg-gradient-to-br from-yellow-50 to-lime-50 dark:from-yellow-900/20 dark:to-lime-900/20 border-2 border-yellow-500 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-3xl">🎯</div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">6. Book Profit</h3>
              </div>
              <p className="text-xs text-gray-600 dark:text-[#8b949e]">Target/SL alerts at exit</p>
            </div>
          </div>
        </div>

        {/* Scenario 2: Starting with Own Idea */}
        <div className="relative mb-16">
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-full font-bold text-lg mb-2">
              Scenario 2: Create Your Own Idea or Community Idea 
            </div>
            <p className="text-sm text-gray-600 dark:text-[#8b949e] mt-2">
              Start with your own research and create investment ideas from scratch
            </p>
          </div>

          {/* Desktop Flow - Horizontal */}
          <div className="hidden md:block">
            <div className="flex items-start justify-between gap-4">
              {/* Step 1: Investment Idea */}
              <div className="flex-1 text-center">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-500 rounded-xl p-6 h-full">
                  <div className="text-4xl mb-3">💡</div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">1. Investment Idea</h3>
                  <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-3">
                    Create idea with entry, SL, and target manually
                  </p>
                  <div className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
                    Your research
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center pt-16">
                <div className="text-3xl text-[#ff8c42]">→</div>
              </div>

              {/* Step 2: Right Price Alert */}
              <div className="flex-1 text-center">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-500 rounded-xl p-6 h-full">
                  <div className="text-4xl mb-3">🔔</div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">2. Entry Alert</h3>
                  <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-3">
                    Automatic alert when price hits your entry level
                  </p>
                  <div className="text-xs text-green-600 dark:text-green-400 font-semibold">
                    Perfect timing
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center pt-16">
                <div className="text-3xl text-[#ff8c42]">→</div>
              </div>

              {/* Step 3: Portfolio */}
              <div className="flex-1 text-center">
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-2 border-orange-500 rounded-xl p-6 h-full">
                  <div className="text-4xl mb-3">📊</div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">3. Portfolio</h3>
                  <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-3">
                    Add to portfolio, track with exit criteria
                  </p>
                  <div className="text-xs text-orange-600 dark:text-orange-400 font-semibold">
                    Monitor position
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center pt-16">
                <div className="text-3xl text-[#ff8c42]">→</div>
              </div>

              {/* Step 4: Exit Alert & Book Profit */}
              <div className="flex-1 text-center">
                <div className="bg-gradient-to-br from-yellow-50 to-lime-50 dark:from-yellow-900/20 dark:to-lime-900/20 border-2 border-yellow-500 rounded-xl p-6 h-full">
                  <div className="text-4xl mb-3">🎯</div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">4. Book Profit</h3>
                  <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-3">
                    Target/SL/Technical alerts help you exit at right time
                  </p>
                  <div className="text-xs text-yellow-600 dark:text-yellow-400 font-semibold">
                    Lock gains
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Flow - Vertical */}
          <div className="md:hidden space-y-3">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-500 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-3xl">💡</div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">1. Investment Idea</h3>
              </div>
              <p className="text-xs text-gray-600 dark:text-[#8b949e]">Create with entry, SL, target</p>
            </div>
            <div className="text-center text-2xl text-[#ff8c42]">↓</div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-500 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-3xl">🔔</div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">2. Entry Alert</h3>
              </div>
              <p className="text-xs text-gray-600 dark:text-[#8b949e]">Alert at entry price</p>
            </div>
            <div className="text-center text-2xl text-[#ff8c42]">↓</div>

            <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-2 border-orange-500 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-3xl">📊</div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">3. Portfolio</h3>
              </div>
              <p className="text-xs text-gray-600 dark:text-[#8b949e]">Track with exit criteria</p>
            </div>
            <div className="text-center text-2xl text-[#ff8c42]">↓</div>

            <div className="bg-gradient-to-br from-yellow-50 to-lime-50 dark:from-yellow-900/20 dark:to-lime-900/20 border-2 border-yellow-500 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-3xl">🎯</div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">4. Book Profit</h3>
              </div>
              <p className="text-xs text-gray-600 dark:text-[#8b949e]">Target/SL/Technical alerts at exit</p>
            </div>
          </div>
        </div>

        {/* Scenario 3: Import Existing Portfolio */}
        <div className="relative">
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-2 rounded-full font-bold text-lg mb-2">
              Scenario 3: Import Existing Portfolio
            </div>
            <p className="text-sm text-gray-600 dark:text-[#8b949e] mt-2">
              Already invested? Import your holdings from Zerodha, ICICI, or any broker
            </p>
          </div>

          {/* Desktop Flow - Horizontal */}
          <div className="hidden md:block">
            <div className="flex items-start justify-between gap-4">
              {/* Step 1: Import Portfolio */}
              <div className="flex-1 text-center">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-2 border-emerald-500 rounded-xl p-6 h-full">
                  <div className="text-4xl mb-3">📥</div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">1. Import Portfolio</h3>
                  <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-3">
                    Upload CSV from broker - auto-sets SL & targets
                  </p>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    One-click import
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center pt-16">
                <div className="text-3xl text-[#ff8c42]">→</div>
              </div>

              {/* Step 2: Portfolio Tracking */}
              <div className="flex-1 text-center">
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-2 border-orange-500 rounded-xl p-6 h-full">
                  <div className="text-4xl mb-3">📊</div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">2. Portfolio</h3>
                  <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-3">
                    Automatic tracking with exit criteria & technical analysis
                  </p>
                  <div className="text-xs text-orange-600 dark:text-orange-400 font-semibold">
                    Hands-free monitoring
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center pt-16">
                <div className="text-3xl text-[#ff8c42]">→</div>
              </div>

              {/* Step 3: Trailing Stop Loss & Target Alerts */}
              <div className="flex-1 text-center">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-500 rounded-xl p-6 h-full">
                  <div className="text-4xl mb-3">🔔</div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">3. Smart Alerts</h3>
                  <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-3">
                    Trailing SL, target price, & technical exit alerts
                  </p>
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                    Never miss exits
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center pt-16">
                <div className="text-3xl text-[#ff8c42]">→</div>
              </div>

              {/* Step 4: Book Profit */}
              <div className="flex-1 text-center">
                <div className="bg-gradient-to-br from-yellow-50 to-lime-50 dark:from-yellow-900/20 dark:to-lime-900/20 border-2 border-yellow-500 rounded-xl p-6 h-full">
                  <div className="text-4xl mb-3">🎯</div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">4. Book Profit</h3>
                  <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-3">
                    Exit at optimal prices with automated alerts
                  </p>
                  <div className="text-xs text-yellow-600 dark:text-yellow-400 font-semibold">
                    Maximize returns
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Flow - Vertical */}
          <div className="md:hidden space-y-3">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-2 border-emerald-500 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-3xl">📥</div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">1. Import Portfolio</h3>
              </div>
              <p className="text-xs text-gray-600 dark:text-[#8b949e]">Upload CSV from broker</p>
            </div>
            <div className="text-center text-2xl text-[#ff8c42]">↓</div>

            <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-2 border-orange-500 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-3xl">📊</div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">2. Portfolio</h3>
              </div>
              <p className="text-xs text-gray-600 dark:text-[#8b949e]">Automatic tracking with exit criteria</p>
            </div>
            <div className="text-center text-2xl text-[#ff8c42]">↓</div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-500 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-3xl">🔔</div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">3. Smart Alerts</h3>
              </div>
              <p className="text-xs text-gray-600 dark:text-[#8b949e]">Trailing SL & target alerts</p>
            </div>
            <div className="text-center text-2xl text-[#ff8c42]">↓</div>

            <div className="bg-gradient-to-br from-yellow-50 to-lime-50 dark:from-yellow-900/20 dark:to-lime-900/20 border-2 border-yellow-500 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-3xl">🎯</div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">4. Book Profit</h3>
              </div>
              <p className="text-xs text-gray-600 dark:text-[#8b949e]">Exit at optimal prices</p>
            </div>
          </div>
        </div>

        {/* Key Benefits with Numbers */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-700">
            <div className="text-4xl mb-3">⏰</div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">5+ Hours</div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">Saved Every Week</h4>
            <p className="text-sm text-gray-700 dark:text-[#8b949e] mb-4">
              No more spreadsheets, manual updates, or price watching. Spend time making decisions, not gathering data.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-300">
              <span className="text-lg">✓</span>
              <span>Automated daily analysis</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-300 mt-1">
              <span className="text-lg">✓</span>
              <span>One-click portfolio import</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border-2 border-green-200 dark:border-green-700">
            <div className="text-4xl mb-3">💰</div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">100%</div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">Never Miss Targets</h4>
            <p className="text-sm text-gray-700 dark:text-[#8b949e] mb-4">
              Get instant alerts at entry prices, profit targets, and stop-loss levels. Perfect timing, every time.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-green-700 dark:text-green-300">
              <span className="text-lg">✓</span>
              <span>Real-time price alerts</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-green-700 dark:text-green-300 mt-1">
              <span className="text-lg">✓</span>
              <span>Trailing stop-loss tracking</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl p-6 border-2 border-red-200 dark:border-red-700">
            <div className="text-4xl mb-3">🛡️</div>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">24/7</div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">Risk Monitoring</h4>
            <p className="text-sm text-gray-700 dark:text-[#8b949e] mb-4">
              Continuous monitoring of stop-loss levels, MA breakdowns, and technical exit signals while you sleep.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-red-700 dark:text-red-300">
              <span className="text-lg">✓</span>
              <span>Automatic risk warnings</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-red-700 dark:text-red-300 mt-1">
              <span className="text-lg">✓</span>
              <span>Technical exit criteria</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-8">
          {/* Step 1 */}
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#ff8c42] flex items-center justify-center text-2xl font-bold text-white">
              1
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Sign Up Free</h3>
            <p className="text-gray-600 dark:text-[#8b949e]">
              Create your account in seconds and set up multiple portfolios.
            </p>
          </div>

          {/* Step 2 */}
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#ff8c42] flex items-center justify-center text-2xl font-bold text-white">
              2
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Import Holdings</h3>
            <p className="text-gray-600 dark:text-[#8b949e]">
              Upload CSV from your broker or manually add positions with exit criteria.
            </p>
          </div>

          {/* Step 3 */}
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#ff8c42] flex items-center justify-center text-2xl font-bold text-white">
              3
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Analyze & Share</h3>
            <p className="text-gray-600 dark:text-[#8b949e]">
              Get real-time technical & fundamental analysis. Share ideas with the community.
            </p>
          </div>

          {/* Step 4 */}
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#ff8c42] flex items-center justify-center text-2xl font-bold text-white">
              4
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Track & Grow</h3>
            <p className="text-gray-600 dark:text-[#8b949e]">
              Monitor performance, get exit alerts, and grow your portfolio intelligently.
            </p>
          </div>
        </div>
      </section>

      {/* Early Adopter / Social Proof Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10">
        <div className="text-center mb-12">
          <div className="inline-block bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
            🚀 New Platform Advantage
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Be an Early Adopter
          </h2>
          <p className="text-lg text-gray-600 dark:text-[#8b949e] max-w-3xl mx-auto">
            We're building TradeIdea in the open with real traders. Join now and help shape the future of portfolio tracking in India.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Benefit 1 */}
          <div className="bg-white dark:bg-[#1c2128] rounded-xl p-6 border-2 border-blue-200 dark:border-blue-800">
            <div className="text-4xl mb-4">🎁</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              Free Forever Guarantee
            </h3>
            <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-4">
              As an early user, you're guaranteed free access to all features forever - even if we introduce paid plans later.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                ✓ Lifetime premium access
              </p>
            </div>
          </div>

          {/* Benefit 2 */}
          <div className="bg-white dark:bg-[#1c2128] rounded-xl p-6 border-2 border-purple-200 dark:border-purple-800">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              Shape the Product
            </h3>
            <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-4">
              Your feedback directly influences new features. Early adopters get priority support and feature requests.
            </p>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
              <p className="text-xs font-semibold text-purple-800 dark:text-purple-300">
                ✓ Priority feature requests
              </p>
            </div>
          </div>

          {/* Benefit 3 */}
          <div className="bg-white dark:bg-[#1c2128] rounded-xl p-6 border-2 border-green-200 dark:border-green-800">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              Founder Access
            </h3>
            <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-4">
              Direct line to the founding team. Report bugs, suggest features, and see them implemented within days.
            </p>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <p className="text-xs font-semibold text-green-800 dark:text-green-300">
                ✓ Direct founder support
              </p>
            </div>
          </div>
        </div>

        {/* What Traders Are Saying - Honest Early Feedback */}
        <div className="mt-16 max-w-5xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
            What Problem Are You Solving?
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Pain Point 1 */}
            <div className="bg-white dark:bg-[#1c2128] rounded-xl p-6 border-l-4 border-orange-500">
              <p className="text-gray-700 dark:text-[#8b949e] italic mb-4">
                "I spend 3 hours every Sunday updating my Excel sheet with stock prices and calculating P&L.
                I need something that just works automatically."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold">
                  R
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Retail Trader</p>
                  <p className="text-xs text-gray-600 dark:text-[#8b949e]">25+ stocks portfolio</p>
                </div>
              </div>
            </div>

            {/* Pain Point 2 */}
            <div className="bg-white dark:bg-[#1c2128] rounded-xl p-6 border-l-4 border-blue-500">
              <p className="text-gray-700 dark:text-[#8b949e] italic mb-4">
                "I missed selling TCS at my target price because I was in a meeting.
                By the time I checked, it had dropped 4%. Never again."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                  S
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Working Professional</p>
                  <p className="text-xs text-gray-600 dark:text-[#8b949e]">Part-time trader</p>
                </div>
              </div>
            </div>

            {/* Pain Point 3 */}
            <div className="bg-white dark:bg-[#1c2128] rounded-xl p-6 border-l-4 border-green-500">
              <p className="text-gray-700 dark:text-[#8b949e] italic mb-4">
                "I use 4 different apps - one for charts, one for fundamentals, one for portfolio, one for alerts.
                Just give me everything in one place."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold">
                  A
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Active Trader</p>
                  <p className="text-xs text-gray-600 dark:text-[#8b949e]">50+ positions</p>
                </div>
              </div>
            </div>

            {/* Pain Point 4 */}
            <div className="bg-white dark:bg-[#1c2128] rounded-xl p-6 border-l-4 border-purple-500">
              <p className="text-gray-700 dark:text-[#8b949e] italic mb-4">
                "Every portfolio app wants ₹500/month. I'm a student learning to invest.
                I need free tools that actually work."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold">
                  M
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Beginner Investor</p>
                  <p className="text-xs text-gray-600 dark:text-[#8b949e]">Learning to trade</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <div className="inline-block bg-gradient-to-r from-[#ff8c42] to-orange-500 text-white rounded-xl p-6 max-w-2xl">
            <p className="text-lg font-semibold mb-3">
              Sound Familiar? We're Building This For You.
            </p>
            <Link
              href="/login"
              className="px-8 py-3 bg-white text-[#ff8c42] font-bold rounded-lg hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
            >
              <span>Join Free & Give Feedback</span>
              <span className="text-xl">→</span>
            </Link>
            <p className="text-sm mt-3 opacity-90">
              Help us build the portfolio tracker you actually want to use
            </p>
          </div>
        </div>
      </section>

      {/* Platform Stats Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Built for Serious Indian Traders
          </h2>
          <p className="text-lg text-gray-600 dark:text-[#8b949e]">
            Real capabilities, not marketing hype
          </p>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-white dark:from-[#1c2128] dark:to-[#0d1117] border-2 border-gray-200 dark:border-[#30363d] rounded-2xl p-8 md:p-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Stat 1 - Technical Indicators */}
            <div className="text-center">
              <div className="text-5xl font-bold text-[#ff8c42] mb-3">10+</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Technical Indicators</div>
              <div className="text-xs text-gray-600 dark:text-[#8b949e]">Auto-updated daily</div>
            </div>

            {/* Stat 2 - Broker Support */}
            <div className="text-center">
              <div className="text-5xl font-bold text-[#ff8c42] mb-3">Any</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Broker Import</div>
              <div className="text-xs text-gray-600 dark:text-[#8b949e]">Zerodha, ICICI, CSV</div>
            </div>

            {/* Stat 3 - Alert Speed */}
            <div className="text-center">
              <div className="text-5xl font-bold text-[#ff8c42] mb-3">&lt;1min</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Alert Delivery</div>
              <div className="text-xs text-gray-600 dark:text-[#8b949e]">Instant email alerts</div>
            </div>

            {/* Stat 4 - Free Forever */}
            <div className="text-center">
              <div className="text-5xl font-bold text-[#ff8c42] mb-3">₹0</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Forever Free</div>
              <div className="text-xs text-gray-600 dark:text-[#8b949e]">All features, no limits</div>
            </div>
          </div>

          {/* Additional Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-8 pt-8 border-t border-gray-200 dark:border-[#30363d]">
            {/* Stat 5 - Portfolio Tracking */}
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-3">24/7</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Market Monitoring</div>
              <div className="text-xs text-gray-600 dark:text-[#8b949e]">Never sleep mode</div>
            </div>

            {/* Stat 6 - Unlimited Portfolios */}
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-3">∞</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Portfolios</div>
              <div className="text-xs text-gray-600 dark:text-[#8b949e]">Track unlimited holdings</div>
            </div>

            {/* Stat 7 - Data Update Frequency */}
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-3">Daily</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Data Updates</div>
              <div className="text-xs text-gray-600 dark:text-[#8b949e]">Fresh technical analysis</div>
            </div>

            {/* Stat 8 - Setup Time */}
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-3">2min</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Setup Time</div>
              <div className="text-xs text-gray-600 dark:text-[#8b949e]">Import & start tracking</div>
            </div>
          </div>
        </div>

        {/* Trust Statement */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 dark:text-[#8b949e] max-w-3xl mx-auto">
            These are platform capabilities, not user metrics. We believe in transparency -
            we're a new platform focused on building the best portfolio tracking tool for Indian traders.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-br from-[#ff8c42]/10 via-orange-500/5 to-purple-500/5 border-2 border-[#ff8c42] dark:border-[#ff8c42] rounded-2xl p-12 text-center relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 w-40 h-40 bg-[#ff8c42] rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-500 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Stop Missing Opportunities
            </h2>
            <p className="text-xl text-gray-600 dark:text-[#8b949e] mb-8 max-w-2xl mx-auto">
              Join traders who never miss entry and exit signals. Start tracking your portfolio
              with automated alerts today - completely free, no credit card required.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <div className="relative">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-10 py-4 bg-[#ff8c42] hover:bg-[#ff9a58] text-white text-lg font-bold rounded-lg transition-all shadow-lg hover:shadow-xl hover:scale-105 group"
                >
                  Get Started Free
                  <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                </Link>
                <div className="absolute -top-3 -right-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                  100% FREE
                </div>
              </div>
              <div className="text-sm text-gray-600 dark:text-[#8b949e]">
                <div className="flex items-center gap-2">
                  <span className="text-green-500 text-lg">✓</span>
                  <span>Setup in 2 minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500 text-lg">✓</span>
                  <span>No credit card needed</span>
                </div>
              </div>
            </div>

            {/* Social Proof Stats */}
            <div className="flex flex-wrap justify-center gap-8 pt-8 border-t border-gray-200 dark:border-[#30363d]">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#ff8c42] mb-1">24/7</div>
                <div className="text-sm text-gray-600 dark:text-[#8b949e]">Market Monitoring</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#ff8c42] mb-1">10+</div>
                <div className="text-sm text-gray-600 dark:text-[#8b949e]">Technical Indicators</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#ff8c42] mb-1">100%</div>
                <div className="text-sm text-gray-600 dark:text-[#8b949e]">Free Forever</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#ff8c42] mb-1">∞</div>
                <div className="text-sm text-gray-600 dark:text-[#8b949e]">Unlimited Portfolios</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-[#30363d] mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <Logo size={32} />
              <span className="text-lg font-bold text-gray-900 dark:text-white">TradeIdea</span>
            </div>
            <div className="text-sm text-gray-600 dark:text-[#8b949e]">
              © 2025 TradeIdea. All rights reserved.
            </div>
            <div className="flex gap-6 text-sm text-gray-600 dark:text-[#8b949e]">
              <Link href="/guide" className="hover:text-gray-900 dark:hover:text-white transition-colors">User Guide</Link>
              <Link href="/faq" className="hover:text-gray-900 dark:hover:text-white transition-colors">FAQ</Link>
              <button className="hover:text-gray-900 dark:hover:text-white transition-colors">About</button>
              <button className="hover:text-gray-900 dark:hover:text-white transition-colors">Privacy</button>
              <button className="hover:text-gray-900 dark:hover:text-white transition-colors">Terms</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}
