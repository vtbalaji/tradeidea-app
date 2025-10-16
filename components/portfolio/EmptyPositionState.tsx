// Empty state component for portfolio positions
interface EmptyPositionStateProps {
  isPortfolioEmpty: boolean;
  activeTab: 'open' | 'closed';
  onImport: () => void;
  onAddPosition: () => void;
}

export function EmptyPositionState({
  isPortfolioEmpty,
  activeTab,
  onImport,
  onAddPosition,
}: EmptyPositionStateProps) {
  return (
    <div className="text-center py-16">
      <div className="text-6xl mb-4">📂</div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No holdings found</h3>
      <p className="text-gray-600 dark:text-[#8b949e] mb-4">
        {isPortfolioEmpty
          ? 'Start tracking your investments by importing your portfolio or adding positions manually'
          : `Your ${activeTab} positions will appear here`
        }
      </p>
      {isPortfolioEmpty && (
        <div className="flex gap-3 justify-center mt-6">
          <button
            onClick={onImport}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-3 rounded-lg transition-colors flex items-center gap-2"
          >
            <span className="text-xl">📥</span>
            <span>Import Portfolio</span>
          </button>
          <button
            onClick={onAddPosition}
            className="bg-[#ff8c42] hover:bg-[#ff9a58] text-white font-semibold py-2 px-3 rounded-lg transition-colors flex items-center gap-2"
          >
            <span className="text-xl">+</span>
            <span>Add Position</span>
          </button>
        </div>
      )}
    </div>
  );
}
