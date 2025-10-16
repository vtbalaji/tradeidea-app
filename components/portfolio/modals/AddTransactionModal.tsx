import React, { useState, useEffect } from 'react';
import { getCurrentISTDate, formatDateForDisplay } from '@/lib/dateUtils';

interface TransactionDetails {
  type: 'buy' | 'sell';
  quantity: string;
  price: string;
  date: string;
}

interface AddTransactionModalProps {
  isOpen: boolean;
  position: any;
  onClose: () => void;
  onAddTransaction: (positionId: string, transaction: any) => Promise<void>;
}

/**
 * AddTransactionModal - Modal for adding buy/sell transactions to a position
 */
export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  position,
  onClose,
  onAddTransaction
}) => {
  const [transactionDetails, setTransactionDetails] = useState<TransactionDetails>({
    type: 'buy',
    quantity: '',
    price: position?.currentPrice?.toString() || '',
    date: formatDateForDisplay(getCurrentISTDate())
  });

  // Reset form when position changes
  useEffect(() => {
    if (position) {
      setTransactionDetails({
        type: 'buy',
        quantity: '',
        price: position.currentPrice?.toString() || '',
        date: formatDateForDisplay(getCurrentISTDate())
      });
    }
  }, [position]);

  const handleSubmit = async () => {
    if (!position || !transactionDetails.quantity || !transactionDetails.price) {
      alert('Please fill in all required fields');
      return;
    }

    const quantity = parseInt(transactionDetails.quantity);
    const price = parseFloat(transactionDetails.price);

    if (isNaN(quantity) || quantity <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid price');
      return;
    }

    // Check if selling more than available quantity
    if (transactionDetails.type === 'sell' && quantity > position.quantity) {
      alert(`Cannot sell more than available quantity (${position.quantity})`);
      return;
    }

    try {
      await onAddTransaction(position.id, {
        type: transactionDetails.type,
        quantity,
        price,
        date: transactionDetails.date,
        totalValue: quantity * price
      });
      onClose();
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Failed to add transaction');
    }
  };

  if (!isOpen || !position) return null;

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
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Add Transaction - {position.symbol}</h3>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-[#8b949e] hover:text-gray-900 dark:hover:text-white transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        {/* Current Position Info */}
        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-xs text-blue-600 dark:text-blue-400">
            <strong>Current Holdings:</strong> {position.quantity} shares @ ₹{position.entryPrice.toFixed(2)} avg
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-2">
              Transaction Type
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setTransactionDetails({ ...transactionDetails, type: 'buy' })}
                className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                  transactionDetails.type === 'buy'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 dark:bg-[#30363d] text-gray-600 dark:text-[#8b949e] hover:bg-gray-200 dark:hover:bg-[#3e4651]'
                }`}
              >
                Buy
              </button>
              <button
                onClick={() => setTransactionDetails({ ...transactionDetails, type: 'sell' })}
                className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                  transactionDetails.type === 'sell'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 dark:bg-[#30363d] text-gray-600 dark:text-[#8b949e] hover:bg-gray-200 dark:hover:bg-[#3e4651]'
                }`}
              >
                Sell
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-2">
              Quantity {transactionDetails.type === 'sell' && `(Max: ${position.quantity})`}
            </label>
            <input
              type="number"
              value={transactionDetails.quantity}
              onChange={(e) =>
                setTransactionDetails({ ...transactionDetails, quantity: e.target.value })
              }
              placeholder="Enter quantity"
              max={transactionDetails.type === 'sell' ? position.quantity : undefined}
              required
              className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-2">
              Price
            </label>
            <input
              type="number"
              step="0.01"
              value={transactionDetails.price}
              onChange={(e) =>
                setTransactionDetails({ ...transactionDetails, price: e.target.value })
              }
              placeholder="Enter price"
              required
              className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-2">
              Date (DD-MM-YYYY)
            </label>
            <input
              type="text"
              value={transactionDetails.date}
              onChange={(e) =>
                setTransactionDetails({ ...transactionDetails, date: e.target.value })
              }
              placeholder="DD-MM-YYYY"
              pattern="\d{2}-\d{2}-\d{4}"
              className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 dark:bg-[#30363d] hover:bg-gray-200 dark:hover:bg-[#3e4651] text-gray-900 dark:text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className={`flex-1 font-semibold py-3 rounded-lg transition-colors ${
              transactionDetails.type === 'buy'
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            {transactionDetails.type === 'buy' ? 'Buy' : 'Sell'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTransactionModal;
