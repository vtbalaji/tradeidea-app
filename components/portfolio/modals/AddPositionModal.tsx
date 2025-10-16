import React, { useState, useEffect } from 'react';
import { useSymbols } from '../../../contexts/SymbolsContext';
import { getCurrentISTDate, formatDateForDisplay } from '../../../lib/dateUtils';

interface AddPositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPosition: (ideaId: string, position: any) => Promise<void>;
  initialData?: {
    symbol?: string;
    stopLoss?: number;
    target1?: number;
    entryPrice?: number;
    tradeType?: 'Long' | 'Short';
  };
}

/**
 * AddPositionModal - Modal for manually adding a new position to portfolio
 */
export const AddPositionModal: React.FC<AddPositionModalProps> = ({
  isOpen,
  onClose,
  onAddPosition,
  initialData
}) => {
  const { symbols, searchSymbols } = useSymbols();

  const [newPosition, setNewPosition] = useState({
    symbol: '',
    tradeType: 'Long' as 'Long' | 'Short',
    entryPrice: '',
    target1: '',
    stopLoss: '',
    quantity: '',
    dateTaken: '',
    notes: ''
  });

  const [symbolSuggestions, setSymbolSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Reset form with initialData when modal opens
  useEffect(() => {
    if (isOpen) {
      setNewPosition({
        symbol: initialData?.symbol || '',
        tradeType: (initialData?.tradeType || 'Long') as 'Long' | 'Short',
        entryPrice: initialData?.entryPrice?.toString() || '',
        target1: initialData?.target1?.toString() || '',
        stopLoss: initialData?.stopLoss?.toString() || '',
        quantity: '',
        dateTaken: formatDateForDisplay(getCurrentISTDate()),
        notes: ''
      });
    }
  }, [isOpen, initialData]);

  const handleSymbolSearch = async (value: string) => {
    setNewPosition({ ...newPosition, symbol: value });
    if (value.length > 0) {
      const results = await searchSymbols(value);
      setSymbolSuggestions(results.slice(0, 10));
      setShowSuggestions(true);
    } else {
      setSymbolSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSymbolSelect = (symbol: any) => {
    setNewPosition({ ...newPosition, symbol: symbol.symbol.replace(/^NS_/, '') });
    setShowSuggestions(false);
  };

  const handleSubmit = async () => {
    if (!newPosition.symbol || !newPosition.entryPrice || !newPosition.stopLoss || !newPosition.quantity) {
      alert('Please fill in all required fields (Symbol, Entry Price, Stop Loss, Quantity)');
      return;
    }

    const position = {
      ...newPosition,
      entryPrice: parseFloat(newPosition.entryPrice),
      currentPrice: parseFloat(newPosition.entryPrice), // Use entry price as current price
      target1: newPosition.target1 ? parseFloat(newPosition.target1) : 0,
      stopLoss: parseFloat(newPosition.stopLoss),
      quantity: parseInt(newPosition.quantity),
    };

    await onAddPosition('', position);

    // Reset form
    setNewPosition({
      symbol: '',
      tradeType: 'Long',
      entryPrice: '',
      target1: '',
      stopLoss: '',
      quantity: '',
      dateTaken: formatDateForDisplay(getCurrentISTDate()),
      notes: ''
    });

    onClose();
  };

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
                onChange={(e) => handleSymbolSearch(e.target.value)}
                onFocus={() => newPosition.symbol && setShowSuggestions(true)}
                placeholder="Search symbol (e.g., RELIANCE)"
                className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
              />

              {/* Symbol Suggestions Dropdown */}
              {showSuggestions && symbolSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {symbolSuggestions.map((symbol) => (
                    <div
                      key={symbol.symbol}
                      onClick={() => handleSymbolSelect(symbol)}
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
                onChange={(e) => setNewPosition({ ...newPosition, tradeType: e.target.value as 'Long' | 'Short' })}
                className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none focus:border-[#ff8c42] transition-colors"
              >
                <option value="Long">Long</option>
                <option value="Short">Short</option>
              </select>
            </div>
          </div>

          {/* Entry Price */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-2">
              Entry Price *
            </label>
            <input
              type="number"
              step="0.01"
              value={newPosition.entryPrice}
              onChange={(e) => setNewPosition({ ...newPosition, entryPrice: e.target.value })}
              placeholder="0.00"
              className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
            />
          </div>

          {/* Target and Stop Loss */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-2">
                Target (Optional)
              </label>
              <input
                type="number"
                step="0.01"
                value={newPosition.target1}
                onChange={(e) => setNewPosition({ ...newPosition, target1: e.target.value })}
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
                onChange={(e) => setNewPosition({ ...newPosition, stopLoss: e.target.value })}
                placeholder="0.00"
                className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
              />
            </div>
          </div>

          {/* Quantity and Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#ff8c42] mb-2">
                Quantity *
              </label>
              <input
                type="number"
                value={newPosition.quantity}
                onChange={(e) => setNewPosition({ ...newPosition, quantity: e.target.value })}
                placeholder="0"
                className="w-full bg-white dark:bg-[#0f1419] border-2 border-[#ff8c42] rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff9a58] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-2">
                Date Taken (DD-MM-YYYY)
              </label>
              <input
                type="text"
                value={newPosition.dateTaken}
                onChange={(e) => setNewPosition({ ...newPosition, dateTaken: e.target.value })}
                placeholder="DD-MM-YYYY"
                pattern="\d{2}-\d{2}-\d{4}"
                className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={newPosition.notes}
              onChange={(e) => setNewPosition({ ...newPosition, notes: e.target.value })}
              placeholder="Add any notes about this position..."
              rows={3}
              className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors resize-none"
            />
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
            onClick={handleSubmit}
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
