import React, { useState, useEffect } from 'react';
import { getCurrentISTDate, formatDateForDisplay } from '@/lib/dateUtils';

interface EditPositionDetails {
  tradeType: string;
  entryPrice: string;
  quantity: string;
  stopLoss: string;
  target1: string;
  target2: string;
  target3: string;
  dateTaken: string;
}

interface EditPositionModalProps {
  isOpen: boolean;
  position: any;
  onClose: () => void;
  onUpdatePosition: (positionId: string, updates: any) => Promise<void>;
}

/**
 * EditPositionModal - Modal for editing portfolio position details
 * Allows user to correct mistakes or update investment parameters
 */
export const EditPositionModal: React.FC<EditPositionModalProps> = ({
  isOpen,
  position,
  onClose,
  onUpdatePosition
}) => {
  const [editDetails, setEditDetails] = useState<EditPositionDetails>({
    tradeType: position?.tradeType || 'Long',
    entryPrice: position?.entryPrice?.toString() || '',
    quantity: position?.quantity?.toString() || '',
    stopLoss: position?.stopLoss?.toString() || '',
    target1: position?.target1?.toString() || '',
    target2: position?.target2?.toString() || '',
    target3: position?.target3?.toString() || '',
    dateTaken: position?.dateTaken || formatDateForDisplay(getCurrentISTDate())
  });

  // Reset form when position changes
  useEffect(() => {
    if (position) {
      setEditDetails({
        tradeType: position.tradeType || 'Long',
        entryPrice: position.entryPrice?.toString() || '',
        quantity: position.quantity?.toString() || '',
        stopLoss: position.stopLoss?.toString() || '',
        target1: position.target1?.toString() || '',
        target2: position.target2?.toString() || '',
        target3: position.target3?.toString() || '',
        dateTaken: position.dateTaken || formatDateForDisplay(getCurrentISTDate())
      });
    }
  }, [position]);

  const handleSubmit = async () => {
    if (!position) {
      alert('No position selected');
      return;
    }

    // Validate required fields
    if (!editDetails.entryPrice || !editDetails.quantity || !editDetails.stopLoss || !editDetails.target1) {
      alert('Please fill in all required fields (Entry Price, Quantity, Stop Loss, Target 1)');
      return;
    }

    const entryPrice = parseFloat(editDetails.entryPrice);
    const quantity = parseInt(editDetails.quantity);
    const stopLoss = parseFloat(editDetails.stopLoss);
    const target1 = parseFloat(editDetails.target1);
    const target2 = editDetails.target2 ? parseFloat(editDetails.target2) : null;
    const target3 = editDetails.target3 ? parseFloat(editDetails.target3) : null;

    // Validate numbers
    if (isNaN(entryPrice) || entryPrice <= 0) {
      alert('Please enter a valid entry price');
      return;
    }

    if (isNaN(quantity) || quantity <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    if (isNaN(stopLoss) || stopLoss <= 0) {
      alert('Please enter a valid stop loss');
      return;
    }

    if (isNaN(target1) || target1 <= 0) {
      alert('Please enter a valid target 1');
      return;
    }

    if (target2 !== null && (isNaN(target2) || target2 <= 0)) {
      alert('Please enter a valid target 2 or leave it empty');
      return;
    }

    if (target3 !== null && (isNaN(target3) || target3 <= 0)) {
      alert('Please enter a valid target 3 or leave it empty');
      return;
    }

    try {
      const updates: any = {
        tradeType: editDetails.tradeType,
        entryPrice,
        quantity,
        stopLoss,
        target1,
        target2,
        target3,
        dateTaken: editDetails.dateTaken,
        totalValue: entryPrice * quantity
      };

      // Update the first transaction's price and quantity if it exists
      if (position.transactions && position.transactions.length > 0) {
        const updatedTransactions = [...position.transactions];
        updatedTransactions[0] = {
          ...updatedTransactions[0],
          price: entryPrice,
          quantity,
          totalValue: entryPrice * quantity
        };
        updates.transactions = updatedTransactions;
      }

      await onUpdatePosition(position.id, updates);
      onClose();
    } catch (error) {
      console.error('Error updating position:', error);
      alert('Failed to update position');
    }
  };

  if (!isOpen || !position) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-6 w-full max-w-2xl mx-4 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit Position - {position.symbol}</h3>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-[#8b949e] hover:text-gray-900 dark:hover:text-white transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        {/* Info message */}
        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-xs text-blue-600 dark:text-blue-400">
            Update any field below to correct mistakes or adjust your investment parameters.
          </p>
        </div>

        <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
          {/* Investment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-2">
              Investment Type *
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setEditDetails({ ...editDetails, tradeType: 'Long' })}
                className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                  editDetails.tradeType === 'Long'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 dark:bg-[#30363d] text-gray-600 dark:text-[#8b949e] hover:bg-gray-200 dark:hover:bg-[#3e4651]'
                }`}
              >
                Long
              </button>
              <button
                onClick={() => setEditDetails({ ...editDetails, tradeType: 'Short' })}
                className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                  editDetails.tradeType === 'Short'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 dark:bg-[#30363d] text-gray-600 dark:text-[#8b949e] hover:bg-gray-200 dark:hover:bg-[#3e4651]'
                }`}
              >
                Short
              </button>
            </div>
          </div>

          {/* Entry Price & Quantity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-2">
                Entry Price *
              </label>
              <input
                type="number"
                step="0.01"
                value={editDetails.entryPrice}
                onChange={(e) => setEditDetails({ ...editDetails, entryPrice: e.target.value })}
                placeholder="Enter price"
                required
                className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-2">
                Quantity *
              </label>
              <input
                type="number"
                value={editDetails.quantity}
                onChange={(e) => setEditDetails({ ...editDetails, quantity: e.target.value })}
                placeholder="Enter quantity"
                required
                className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
              />
            </div>
          </div>

          {/* Stop Loss */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-2">
              Stop Loss *
            </label>
            <input
              type="number"
              step="0.01"
              value={editDetails.stopLoss}
              onChange={(e) => setEditDetails({ ...editDetails, stopLoss: e.target.value })}
              placeholder="Enter stop loss price"
              required
              className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
            />
          </div>

          {/* Targets */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-2">
                Target 1 *
              </label>
              <input
                type="number"
                step="0.01"
                value={editDetails.target1}
                onChange={(e) => setEditDetails({ ...editDetails, target1: e.target.value })}
                placeholder="Target 1"
                required
                className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-2">
                Target 2
              </label>
              <input
                type="number"
                step="0.01"
                value={editDetails.target2}
                onChange={(e) => setEditDetails({ ...editDetails, target2: e.target.value })}
                placeholder="Optional"
                className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-2">
                Target 3
              </label>
              <input
                type="number"
                step="0.01"
                value={editDetails.target3}
                onChange={(e) => setEditDetails({ ...editDetails, target3: e.target.value })}
                placeholder="Optional"
                className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
              />
            </div>
          </div>

          {/* Date Taken */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-2">
              Date Taken (DD-MM-YYYY)
            </label>
            <input
              type="text"
              value={editDetails.dateTaken}
              onChange={(e) => setEditDetails({ ...editDetails, dateTaken: e.target.value })}
              placeholder="DD-MM-YYYY"
              pattern="\d{2}-\d{2}-\d{4}"
              className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
            />
          </div>

          {/* Calculated Total Value */}
          {editDetails.entryPrice && editDetails.quantity && (
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400">
                <strong>Total Investment:</strong> ₹{(parseFloat(editDetails.entryPrice) * parseInt(editDetails.quantity || '0')).toFixed(2)}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-[#30363d]">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 dark:bg-[#30363d] hover:bg-gray-200 dark:hover:bg-[#3e4651] text-gray-900 dark:text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 bg-[#ff8c42] hover:bg-[#ff9a58] text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Update Position
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPositionModal;
