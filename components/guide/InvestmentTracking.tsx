import React from 'react';

export default function InvestmentTracking() {
  return (
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
  );
}
