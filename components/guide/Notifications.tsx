import React from 'react';
import Link from 'next/link';

export default function Notifications() {
  return (
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
  );
}
