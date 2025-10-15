import React from 'react';

export default function InvestmentIdeas() {
  return (
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
  );
}
