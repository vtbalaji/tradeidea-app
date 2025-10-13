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
    <div className="px-5 mb-5 overflow-x-auto">
      <div className="flex gap-4 min-w-max pb-2">
        <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg p-3 min-w-[180px]">
          <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-0.5">Portfolio Value</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">₹{portfolioValue.toFixed(2)}</p>
        </div>
        <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg p-3 min-w-[180px]">
          <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-0.5">Total P&L</p>
          <p className={`text-xl font-bold ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toFixed(2)}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg p-3 min-w-[180px]">
          <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-0.5">Open Positions</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{openPositionsCount}</p>
        </div>
        <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg p-3 min-w-[180px]">
          <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-0.5">Closed Trades</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{closedPositionsCount}</p>
        </div>
      </div>
    </div>
  );
}
