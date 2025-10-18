// Portfolio metrics display component
interface PortfolioMetricsProps {
  portfolioValue: number;
  totalPnL: number;
  openPositionsCount: number;
  closedPositionsCount: number;
}

export function PortfolioMetrics({
  portfolioValue,
  totalPnL,
  openPositionsCount,
  closedPositionsCount,
}: PortfolioMetricsProps) {
  return (
    <div className="px-5 mb-3 overflow-x-auto">
      <div className="flex gap-3 min-w-max pb-2">
        <div className="bg-white dark:bg-[#0f1419] border-l-4 border-l-blue-500 border border-gray-200 dark:border-[#30363d] rounded-lg p-2.5 min-w-[160px] shadow-sm">
          <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-0.5">Portfolio Value</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">₹{Math.round(portfolioValue).toLocaleString('en-IN')}</p>
        </div>
        <div className={`bg-white dark:bg-[#0f1419] border-l-4 ${totalPnL >= 0 ? 'border-l-green-500' : 'border-l-red-500'} border border-gray-200 dark:border-[#30363d] rounded-lg p-2.5 min-w-[160px] shadow-sm`}>
          <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-0.5">Total P&L</p>
          <p className={`text-xl font-bold ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {totalPnL >= 0 ? '+' : ''}₹{Math.round(totalPnL).toLocaleString('en-IN')}
          </p>
        </div>
        {/* <div className="bg-white dark:bg-[#0f1419] border-l-4 border-l-orange-500 border border-gray-200 dark:border-[#30363d] rounded-lg p-2.5 min-w-[160px] shadow-sm">
          <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-0.5">Open Positions</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{openPositionsCount}</p>
        </div> */}
        {/* <div className="bg-white dark:bg-[#0f1419] border-l-4 border-l-gray-500 border border-gray-200 dark:border-[#30363d] rounded-lg p-2.5 min-w-[160px] shadow-sm">
          <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-0.5">Closed Trades</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{closedPositionsCount}</p>
        </div> */}
      </div>
    </div>
  );
}
