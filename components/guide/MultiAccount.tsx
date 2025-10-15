import React from 'react';

export default function MultiAccount() {
  return (
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
  );
}
