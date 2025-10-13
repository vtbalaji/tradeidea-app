import React from 'react';
import { Symbol } from '../../../contexts/SymbolsContext';

interface NewPositionState {
  symbol: string;
  tradeType: 'Long' | 'Short';
  entryPrice: string;
  currentPrice: string;
  target1: string;
  stopLoss: string;
  quantity: string;
  dateTaken: string;
  exitCriteria: {
    exitAtStopLoss: boolean;
    exitAtTarget: boolean;
    exitBelow50EMA: boolean;
    exitBelow100MA: boolean;
    exitBelow200MA: boolean;
    exitOnWeeklySupertrend: boolean;
    customNote: string;
  };
}

interface AddPositionModalProps {
  isOpen: boolean;
  newPosition: NewPositionState;
  symbolSuggestions: Symbol[];
  showSuggestions: boolean;
  onClose: () => void;
  onNewPositionChange: (position: NewPositionState) => void;
  onSymbolSearch: (value: string) => void;
  onSymbolSelect: (symbol: Symbol) => void;
  onSetShowSuggestions: (show: boolean) => void;
  onSubmit: () => void;
}

/**
 * AddPositionModal - Modal for manually adding a new position to portfolio
 */
export const AddPositionModal: React.FC<AddPositionModalProps> = ({
  isOpen,
  newPosition,
  symbolSuggestions,
  showSuggestions,
  onClose,
  onNewPositionChange,
  onSymbolSearch,
  onSymbolSelect,
  onSetShowSuggestions,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Add New Position</h3>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-[#8b949e] hover:text-gray-900 dark:hover:text-white transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Symbol and Trade Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-2">
                Symbol *
              </label>
              <input
                type="text"
                value={newPosition.symbol}
                onChange={(e) => onSymbolSearch(e.target.value)}
                onFocus={() => newPosition.symbol && onSetShowSuggestions(true)}
                placeholder="Search symbol (e.g., RELIANCE)"
                className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
              />

              {/* Symbol Suggestions Dropdown */}
              {showSuggestions && symbolSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {symbolSuggestions.map((symbol) => (
                    <div
                      key={symbol.symbol}
                      onClick={() => onSymbolSelect(symbol)}
                      className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-[#30363d] cursor-pointer transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {symbol.symbol}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-[#8b949e] truncate">
                            {symbol.name}
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-[#8b949e]">
                          {symbol.exchange}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-2">
                Trade Type
              </label>
              <select
                value={newPosition.tradeType}
                onChange={(e) => onNewPositionChange({ ...newPosition, tradeType: e.target.value as 'Long' | 'Short' })}
                className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none focus:border-[#ff8c42] transition-colors"
              >
                <option value="Long">Long</option>
                <option value="Short">Short</option>
              </select>
            </div>
          </div>

          {/* Entry Price and Current Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-2">
                Entry Price *
              </label>
              <input
                type="number"
                step="0.01"
                value={newPosition.entryPrice}
                onChange={(e) => onNewPositionChange({ ...newPosition, entryPrice: e.target.value })}
                placeholder="0.00"
                className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-2">
                Current Price (optional)
              </label>
              <input
                type="number"
                step="0.01"
                value={newPosition.currentPrice}
                onChange={(e) => onNewPositionChange({ ...newPosition, currentPrice: e.target.value })}
                placeholder="Same as entry"
                className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
              />
            </div>
          </div>

          {/* Target and Stop Loss */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-2">
                Target *
              </label>
              <input
                type="number"
                step="0.01"
                value={newPosition.target1}
                onChange={(e) => onNewPositionChange({ ...newPosition, target1: e.target.value })}
                placeholder="0.00"
                className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-2">
                Stop Loss *
              </label>
              <input
                type="number"
                step="0.01"
                value={newPosition.stopLoss}
                onChange={(e) => onNewPositionChange({ ...newPosition, stopLoss: e.target.value })}
                placeholder="0.00"
                className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
              />
            </div>
          </div>

          {/* Quantity and Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-2">
                Quantity *
              </label>
              <input
                type="number"
                value={newPosition.quantity}
                onChange={(e) => onNewPositionChange({ ...newPosition, quantity: e.target.value })}
                placeholder="0"
                className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-2">
                Date Taken (DD-MM-YYYY)
              </label>
              <input
                type="text"
                value={newPosition.dateTaken}
                onChange={(e) => onNewPositionChange({ ...newPosition, dateTaken: e.target.value })}
                placeholder="DD-MM-YYYY"
                pattern="\d{2}-\d{2}-\d{4}"
                className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
              />
            </div>
          </div>

          {/* Exit Criteria */}
          <div className="border-t border-gray-200 dark:border-[#30363d] pt-4">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Exit Strategy
            </label>
            <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-3">
              By default, position will exit at Stop Loss or Target
            </p>

            <div className="space-y-3">
              {/* Exit Below 50 EMA */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newPosition.exitCriteria.exitBelow50EMA}
                  onChange={(e) =>
                    onNewPositionChange({
                      ...newPosition,
                      exitCriteria: { ...newPosition.exitCriteria, exitBelow50EMA: e.target.checked }
                    })
                  }
                  className="w-4 h-4 rounded border-gray-300 text-[#ff8c42] focus:ring-[#ff8c42]"
                />
                <span className="text-sm text-gray-600 dark:text-[#8b949e]">Exit if price goes below 50 EMA</span>
              </label>

              {/* Exit Below 100 MA */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newPosition.exitCriteria.exitBelow100MA}
                  onChange={(e) =>
                    onNewPositionChange({
                      ...newPosition,
                      exitCriteria: { ...newPosition.exitCriteria, exitBelow100MA: e.target.checked }
                    })
                  }
                  className="w-4 h-4 rounded border-gray-300 text-[#ff8c42] focus:ring-[#ff8c42]"
                />
                <span className="text-sm text-gray-600 dark:text-[#8b949e]">Exit if price goes below 100 MA</span>
              </label>

              {/* Exit Below 200 MA */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newPosition.exitCriteria.exitBelow200MA}
                  onChange={(e) =>
                    onNewPositionChange({
                      ...newPosition,
                      exitCriteria: { ...newPosition.exitCriteria, exitBelow200MA: e.target.checked }
                    })
                  }
                  className="w-4 h-4 rounded border-gray-300 text-[#ff8c42] focus:ring-[#ff8c42]"
                />
                <span className="text-sm text-gray-600 dark:text-[#8b949e]">Exit if price goes below 200 MA</span>
              </label>

              {/* Exit on Weekly Supertrend */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newPosition.exitCriteria.exitOnWeeklySupertrend}
                  onChange={(e) =>
                    onNewPositionChange({
                      ...newPosition,
                      exitCriteria: { ...newPosition.exitCriteria, exitOnWeeklySupertrend: e.target.checked }
                    })
                  }
                  className="w-4 h-4 rounded border-gray-300 text-[#ff8c42] focus:ring-[#ff8c42]"
                />
                <span className="text-sm text-gray-600 dark:text-[#8b949e]">Exit based on Weekly Supertrend</span>
              </label>

              {/* Custom Note */}
              <div>
                <label className="block text-xs text-gray-600 dark:text-[#8b949e] mb-1">
                  Additional Exit Notes (Optional)
                </label>
                <textarea
                  value={newPosition.exitCriteria.customNote}
                  onChange={(e) =>
                    onNewPositionChange({
                      ...newPosition,
                      exitCriteria: { ...newPosition.exitCriteria, customNote: e.target.value }
                    })
                  }
                  placeholder="e.g., Exit if RSI goes below 30, or any other custom criteria"
                  rows={2}
                  className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 dark:bg-[#30363d] hover:bg-gray-200 dark:hover:bg-[#3c444d] text-gray-900 dark:text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="flex-1 bg-[#ff8c42] hover:bg-[#ff9a58] text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Add Position
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPositionModal;
