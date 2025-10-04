'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../../components/Navigation';
import { useTrading } from '../../contexts/TradingContext';
import { useAuth } from '../../contexts/AuthContext';
import { TrendingIcon, ChartIcon, TargetIcon, EntryIcon } from '@/components/icons';
export default function PortfolioPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { myPortfolio, exitTrade, addTransaction } = useTrading();
  const [activeTab, setActiveTab] = useState('open');

  // Check email verification
  useEffect(() => {
    if (user && !user.emailVerified) {
      router.push('/verify');
    }
  }, [user, router]);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<any>(null);
  const [exitDetails, setExitDetails] = useState({
    exitPrice: '',
    exitDate: new Date().toISOString().split('T')[0]
  });
  const [transactionDetails, setTransactionDetails] = useState({
    type: 'buy' as 'buy' | 'sell',
    quantity: '',
    price: '',
    date: new Date().toISOString().split('T')[0]
  });
  const openPositions = myPortfolio.filter(p => p.status === 'open');
  const closedPositions = myPortfolio.filter(p => p.status === 'closed');
  // Calculate portfolio metrics
  const portfolioValue = openPositions.reduce((sum, p) => sum + (p.currentPrice * p.quantity), 0);
  const totalPnL = openPositions.reduce((sum, p) => {
    const pnl = (p.currentPrice - p.entryPrice) * p.quantity;
    return sum + pnl;
  }, 0);

  const handleExitTrade = async () => {
    if (!selectedPosition || !exitDetails.exitPrice) return;

    try {
      await exitTrade(selectedPosition.id, parseFloat(exitDetails.exitPrice), exitDetails.exitDate);
      setShowExitModal(false);
      setSelectedPosition(null);
      setExitDetails({
        exitPrice: '',
        exitDate: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error exiting trade:', error);
      alert('Failed to exit trade');
    }
  };

  const handleAddTransaction = async () => {
    if (!selectedPosition || !transactionDetails.quantity || !transactionDetails.price) return;

    try {
      const quantity = parseFloat(transactionDetails.quantity);
      const price = parseFloat(transactionDetails.price);

      await addTransaction(selectedPosition.id, {
        type: transactionDetails.type,
        quantity,
        price,
        date: transactionDetails.date,
        totalValue: quantity * price
      });

      setShowTransactionModal(false);
      setSelectedPosition(null);
      setTransactionDetails({
        type: 'buy',
        quantity: '',
        price: '',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Failed to add transaction');
    }
  };

  const renderHoldingsTable = (positions: any[]) => {
    if (positions.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📂</div>
          <h3 className="text-xl font-semibold text-white mb-2">No holdings found</h3>
          <p className="text-[#8b949e]">Your {activeTab} positions will appear here</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr className="border-b border-[#30363d]">
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#8b949e]">Stock</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-[#8b949e]">Qty</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-[#8b949e]">Avg Buy Price</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-[#8b949e]">Invested Amount</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-[#8b949e]">LTP</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-[#8b949e]">Current Value</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-[#8b949e]">P&L</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-[#8b949e]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((position) => {
              const investedAmount = position.entryPrice * position.quantity;
              const currentValue = position.currentPrice * position.quantity;
              const pnl = currentValue - investedAmount;
              const pnlPercent = (pnl / investedAmount) * 100;
              const isProfit = pnl >= 0;

              return (
                <tr
                  key={position.id}
                  className="border-b border-[#30363d] hover:bg-[#1c2128] transition-colors"
                >
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-base font-semibold text-white">{position.symbol}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-blue-500/20 text-[#8b949e] text-xs font-semibold rounded">
                          {position.tradeType}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                          position.status === 'open' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {position.status}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right text-white font-medium">{position.quantity}</td>
                  <td className="py-3 px-4 text-right text-white font-medium">₹{position.entryPrice.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-white font-medium">₹{investedAmount.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-white font-medium">₹{position.currentPrice.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-white font-medium">₹{currentValue.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right">
                    <div className={`font-semibold ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                      <p>{isProfit ? '+' : ''}₹{pnl.toFixed(2)}</p>
                      <p className="text-sm">({isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%)</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {position.status === 'open' ? (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => {
                            setSelectedPosition(position);
                            setShowTransactionModal(true);
                          }}
                          className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded hover:bg-blue-500/30 transition-colors"
                        >
                          Buy/Sell
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPosition(position);
                            setExitDetails({
                              exitPrice: position.currentPrice.toString(),
                              exitDate: new Date().toISOString().split('T')[0]
                            });
                            setShowExitModal(true);
                          }}
                          className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-semibold rounded hover:bg-red-500/30 transition-colors"
                        >
                          Exit
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-[#8b949e]">Closed</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };
  return (
    <div className="min-h-screen bg-[#0f1419]">
      <Navigation />
      {/* Header */}
      <div className="p-5 pt-8">
        <h1 className="text-4xl font-bold text-white mb-2">My Portfolio</h1>
        <p className="text-[#8b949e]">Track your positions and portfolio performance</p>
      </div>
      {/* Metrics Cards */}
      <div className="px-5 mb-5 overflow-x-auto">
        <div className="flex gap-4 min-w-max pb-2">
          <div className="bg-[#1c2128] border border-[#30363d] rounded-lg p-3 min-w-[180px]">
            <p className="text-xs text-[#8b949e] mb-0.5">Portfolio Value</p>
            <p className="text-xl font-bold text-white">₹{portfolioValue.toFixed(2)}</p>
          </div>
          <div className="bg-[#1c2128] border border-[#30363d] rounded-lg p-3 min-w-[180px]">
            <p className="text-xs text-[#8b949e] mb-0.5">Total P&L</p>
            <p className={`text-xl font-bold ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toFixed(2)}
            </p>
          </div>
          <div className="bg-[#1c2128] border border-[#30363d] rounded-lg p-3 min-w-[180px]">
            <p className="text-xs text-[#8b949e] mb-0.5">Open Positions</p>
            <p className="text-xl font-bold text-white">{openPositions.length}</p>
          </div>
          <div className="bg-[#1c2128] border border-[#30363d] rounded-lg p-3 min-w-[180px]">
            <p className="text-xs text-[#8b949e] mb-0.5">Closed Trades</p>
            <p className="text-xl font-bold text-white">{closedPositions.length}</p>
          </div>
        </div>
      </div>
      {/* Positions Section */}
      <div className="px-5">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-white">Positions</h2>
        </div>
        {/* Tabs */}
        <div className="flex gap-3 mb-5">
          <button
            onClick={() => setActiveTab('open')}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'open'
                ? 'bg-[#ff8c42] text-white border-[#ff8c42]'
                : 'bg-[#1c2128] text-[#8b949e] border-[#30363d]'
            } border`}
          >
            Open ({openPositions.length})
          </button>
          <button
            onClick={() => setActiveTab('closed')}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'closed'
                ? 'bg-[#ff8c42] text-white border-[#ff8c42]'
                : 'bg-[#1c2128] text-[#8b949e] border-[#30363d]'
            } border`}
          >
            Closed ({closedPositions.length})
          </button>
        </div>
        {/* Holdings Table */}
        <div className="pb-8">
          {activeTab === 'open' ? renderHoldingsTable(openPositions) : renderHoldingsTable(closedPositions)}
        </div>
      </div>

      {/* Exit Trade Modal */}
      {showExitModal && selectedPosition && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setShowExitModal(false)}
        >
          <div
            className="bg-[#1c2128] border border-[#30363d] rounded-xl p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Exit Trade - {selectedPosition.symbol}</h3>
              <button
                onClick={() => setShowExitModal(false)}
                className="text-[#8b949e] hover:text-white transition-colors text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#8b949e] mb-2">
                  Exit Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={exitDetails.exitPrice}
                  onChange={(e) =>
                    setExitDetails({ ...exitDetails, exitPrice: e.target.value })
                  }
                  placeholder="Enter exit price"
                  required
                  className="w-full bg-[#0f1419] border border-[#30363d] rounded-lg px-3 py-2 text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8b949e] mb-2">
                  Exit Date
                </label>
                <input
                  type="date"
                  value={exitDetails.exitDate}
                  onChange={(e) =>
                    setExitDetails({ ...exitDetails, exitDate: e.target.value })
                  }
                  className="w-full bg-[#0f1419] border border-[#30363d] rounded-lg px-3 py-2 text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowExitModal(false)}
                className="flex-1 bg-[#30363d] hover:bg-[#3e4651] text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExitTrade}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Exit Trade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {showTransactionModal && selectedPosition && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setShowTransactionModal(false)}
        >
          <div
            className="bg-[#1c2128] border border-[#30363d] rounded-xl p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Add Transaction - {selectedPosition.symbol}</h3>
              <button
                onClick={() => setShowTransactionModal(false)}
                className="text-[#8b949e] hover:text-white transition-colors text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#8b949e] mb-2">
                  Transaction Type
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setTransactionDetails({ ...transactionDetails, type: 'buy' })}
                    className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                      transactionDetails.type === 'buy'
                        ? 'bg-green-500 text-white'
                        : 'bg-[#30363d] text-[#8b949e] hover:bg-[#3e4651]'
                    }`}
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => setTransactionDetails({ ...transactionDetails, type: 'sell' })}
                    className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                      transactionDetails.type === 'sell'
                        ? 'bg-red-500 text-white'
                        : 'bg-[#30363d] text-[#8b949e] hover:bg-[#3e4651]'
                    }`}
                  >
                    Sell
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8b949e] mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  value={transactionDetails.quantity}
                  onChange={(e) =>
                    setTransactionDetails({ ...transactionDetails, quantity: e.target.value })
                  }
                  placeholder="Enter quantity"
                  required
                  className="w-full bg-[#0f1419] border border-[#30363d] rounded-lg px-3 py-2 text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8b949e] mb-2">
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
                  className="w-full bg-[#0f1419] border border-[#30363d] rounded-lg px-3 py-2 text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8b949e] mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={transactionDetails.date}
                  onChange={(e) =>
                    setTransactionDetails({ ...transactionDetails, date: e.target.value })
                  }
                  className="w-full bg-[#0f1419] border border-[#30363d] rounded-lg px-3 py-2 text-white placeholder-[#8b949e] outline-none focus:border-[#ff8c42] transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowTransactionModal(false)}
                className="flex-1 bg-[#30363d] hover:bg-[#3e4651] text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTransaction}
                className={`flex-1 font-semibold py-3 rounded-lg transition-colors ${
                  transactionDetails.type === 'buy'
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                Add {transactionDetails.type === 'buy' ? 'Buy' : 'Sell'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
