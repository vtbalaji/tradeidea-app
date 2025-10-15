import React from 'react';

export default function PortfolioImport() {
  return (
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
  );
}
