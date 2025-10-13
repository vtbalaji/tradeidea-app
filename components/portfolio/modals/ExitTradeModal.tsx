import React from 'react';

interface ExitDetails {
  exitPrice: string;
  exitDate: string;
  exitReason: string;
}

interface ExitTradeModalProps {
  isOpen: boolean;
  selectedPosition: any;
  exitDetails: ExitDetails;
  onClose: () => void;
  onExitDetailsChange: (details: ExitDetails) => void;
  onSubmit: () => void;
}

/**
 * ExitTradeModal - Modal for exiting a trade position
 */
export const ExitTradeModal: React.FC<ExitTradeModalProps> = ({
  isOpen,
  selectedPosition,
  exitDetails,
  onClose,
  onExitDetailsChange,
  onSubmit
}) => {
  if (!isOpen || !selectedPosition) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Exit Trade - {selectedPosition.symbol}</h3>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-[#8b949e] hover:text-gray-900 dark:text-white transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-2">
              Exit Price
            </label>
            <input
              type="number"
              step="0.01"
              value={exitDetails.exitPrice}
              onChange={(e) =>
                onExitDetailsChange({ ...exitDetails, exitPrice: e.target.value })
              }
              placeholder="Enter exit price"
              required
              className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-2">
              Exit Date (DD-MM-YYYY)
            </label>
            <input
              type="text"
              value={exitDetails.exitDate}
              onChange={(e) =>
                onExitDetailsChange({ ...exitDetails, exitDate: e.target.value })
              }
              placeholder="DD-MM-YYYY"
              pattern="\d{2}-\d{2}-\d{4}"
              className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-2">
              Exit Reason
            </label>
            <select
              value={exitDetails.exitReason}
              onChange={(e) =>
                onExitDetailsChange({ ...exitDetails, exitReason: e.target.value })
              }
              className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none focus:border-[#ff8c42] transition-colors"
            >
              <option value="">Select exit reason</option>
              <option value="Target reached">Target reached</option>
              <option value="Stop loss hit">Stop loss hit</option>
              <option value="Below 50 EMA">Below 50 EMA</option>
              <option value="Below exit price level">Below exit price level</option>
              <option value="Technical breakdown">Technical breakdown</option>
              <option value="Profit booking">Profit booking</option>
              <option value="Risk management">Risk management</option>
              <option value="Manual exit">Manual exit</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-[#30363d] hover:bg-[#3e4651] text-gray-900 dark:text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="flex-1 bg-red-500 hover:bg-red-600 text-gray-900 dark:text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Exit Trade
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExitTradeModal;
