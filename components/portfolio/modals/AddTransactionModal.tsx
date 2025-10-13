import React from 'react';

interface TransactionDetails {
  type: 'buy' | 'sell';
  quantity: string;
  price: string;
  date: string;
}

interface AddTransactionModalProps {
  isOpen: boolean;
  selectedPosition: any;
  transactionDetails: TransactionDetails;
  onClose: () => void;
  onTransactionDetailsChange: (details: TransactionDetails) => void;
  onSubmit: () => void;
}

/**
 * AddTransactionModal - Modal for adding buy/sell transactions to a position
 */
export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  selectedPosition,
  transactionDetails,
  onClose,
  onTransactionDetailsChange,
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
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Add Transaction - {selectedPosition.symbol}</h3>
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
              Transaction Type
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => onTransactionDetailsChange({ ...transactionDetails, type: 'buy' })}
                className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                  transactionDetails.type === 'buy'
                    ? 'bg-green-500 text-gray-900 dark:text-white'
                    : 'bg-[#30363d] text-gray-600 dark:text-[#8b949e] hover:bg-[#3e4651]'
                }`}
              >
                Buy
              </button>
              <button
                onClick={() => onTransactionDetailsChange({ ...transactionDetails, type: 'sell' })}
                className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                  transactionDetails.type === 'sell'
                    ? 'bg-red-500 text-gray-900 dark:text-white'
                    : 'bg-[#30363d] text-gray-600 dark:text-[#8b949e] hover:bg-[#3e4651]'
                }`}
              >
                Sell
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-2">
              Quantity
            </label>
            <input
              type="number"
              value={transactionDetails.quantity}
              onChange={(e) =>
                onTransactionDetailsChange({ ...transactionDetails, quantity: e.target.value })
              }
              placeholder="Enter quantity"
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
                onTransactionDetailsChange({ ...transactionDetails, price: e.target.value })
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
                onTransactionDetailsChange({ ...transactionDetails, date: e.target.value })
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
            className="flex-1 bg-[#30363d] hover:bg-[#3e4651] text-gray-900 dark:text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className={`flex-1 font-semibold py-3 rounded-lg transition-colors ${
              transactionDetails.type === 'buy'
                ? 'bg-green-500 hover:bg-green-600 text-gray-900 dark:text-white'
                : 'bg-red-500 hover:bg-red-600 text-gray-900 dark:text-white'
            }`}
          >
            Add {transactionDetails.type === 'buy' ? 'Buy' : 'Sell'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTransactionModal;
