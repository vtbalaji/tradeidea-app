'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../../components/Navigation';
import { useTrading } from '../../contexts/TradingContext';
import { useAuth } from '../../contexts/AuthContext';
import { TrendingIcon, ChartIcon, TargetIcon, EntryIcon } from '@/components/icons';
import { getCurrentISTDate, formatDateForDisplay, formatDateForStorage } from '@/lib/dateUtils';
export default function PortfolioPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { myPortfolio, exitTrade, addTransaction, updatePosition } = useTrading();
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
  const [updatingPrice, setUpdatingPrice] = useState<string | null>(null);
  const [newPrice, setNewPrice] = useState<string>('');
  const [exitDetails, setExitDetails] = useState({
    exitPrice: '',
    exitDate: formatDateForDisplay(getCurrentISTDate()),
    exitReason: ''
  });
  const [transactionDetails, setTransactionDetails] = useState({
    type: 'buy' as 'buy' | 'sell',
    quantity: '',
    price: '',
    date: formatDateForDisplay(getCurrentISTDate())
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
      await exitTrade(
        selectedPosition.id,
        parseFloat(exitDetails.exitPrice),
        formatDateForStorage(exitDetails.exitDate), // Convert DD-MM-YYYY to YYYY-MM-DD for storage
        exitDetails.exitReason
      );

      setShowExitModal(false);
      setSelectedPosition(null);
      setExitDetails({
        exitPrice: '',
        exitDate: formatDateForDisplay(getCurrentISTDate()),
        exitReason: ''
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
        date: formatDateForStorage(transactionDetails.date), // Convert DD-MM-YYYY to YYYY-MM-DD for storage
        totalValue: quantity * price
      });

      setShowTransactionModal(false);
      setSelectedPosition(null);
      setTransactionDetails({
        type: 'buy',
        quantity: '',
        price: '',
        date: formatDateForDisplay(getCurrentISTDate())
      });
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Failed to add transaction');
    }
  };

  // Function to analyze exit criteria
  const analyzeExitCriteria = (position: any) => {
    if (!position.exitCriteria) return null;

    const alerts: { type: 'critical' | 'warning' | 'info'; message: string }[] = [];
    const { exitCriteria, currentPrice, stopLoss, target1, technicals } = position;

    // Check stop loss
    if (exitCriteria.exitAtStopLoss) {
      if (currentPrice <= stopLoss) {
        alerts.push({ type: 'critical', message: `🚨 STOP LOSS HIT at ₹${stopLoss.toFixed(2)}` });
      } else {
        const percentAbove = ((currentPrice - stopLoss) / stopLoss) * 100;
        if (percentAbove <= 5) {
          alerts.push({ type: 'warning', message: `⚠️ Near SL: ₹${stopLoss.toFixed(2)} (${percentAbove.toFixed(1)}% above)` });
        } else {
          alerts.push({ type: 'info', message: `✅ SL Safe: ₹${stopLoss.toFixed(2)} (+${percentAbove.toFixed(1)}%)` });
        }
      }
    }

    // Check target reached
    if (exitCriteria.exitAtTarget) {
      if (currentPrice >= target1) {
        alerts.push({ type: 'info', message: `🎯 TARGET REACHED at ₹${target1.toFixed(2)}` });
      } else {
        const percentBelow = ((target1 - currentPrice) / currentPrice) * 100;
        if (percentBelow <= 5) {
          alerts.push({ type: 'warning', message: `⚠️ Near Target: ₹${target1.toFixed(2)} (${percentBelow.toFixed(1)}% away)` });
        } else {
          alerts.push({ type: 'info', message: `🎯 Target: ₹${target1.toFixed(2)} (${percentBelow.toFixed(1)}% away)` });
        }
      }
    }

    // Check 50 EMA
    if (exitCriteria.exitBelow50EMA) {
      if (technicals?.ema50) {
        if (currentPrice < technicals.ema50) {
          alerts.push({ type: 'critical', message: `📉 Below 50 EMA (₹${technicals.ema50.toFixed(2)}) - TIME TO EXIT` });
        } else {
          const percentAbove = ((currentPrice - technicals.ema50) / technicals.ema50) * 100;
          if (percentAbove <= 5) {
            alerts.push({ type: 'warning', message: `⚠️ Near 50 EMA: ₹${technicals.ema50.toFixed(2)} (${percentAbove.toFixed(1)}% above)` });
          } else {
            alerts.push({ type: 'info', message: `✅ Above 50 EMA: ₹${technicals.ema50.toFixed(2)} (+${percentAbove.toFixed(1)}%)` });
          }
        }
      } else {
        alerts.push({ type: 'warning', message: `⚠️ 50 EMA data not available - Run batch analysis` });
      }
    }

    // Check custom exit price
    if (exitCriteria.exitBelowPrice && exitCriteria.exitBelowPrice > 0) {
      if (currentPrice < exitCriteria.exitBelowPrice) {
        alerts.push({ type: 'critical', message: `📉 Below exit price ₹${exitCriteria.exitBelowPrice} - TIME TO EXIT` });
      } else {
        const percentAbove = ((currentPrice - exitCriteria.exitBelowPrice) / exitCriteria.exitBelowPrice) * 100;
        if (percentAbove <= 5) {
          alerts.push({ type: 'warning', message: `⚠️ Near exit level: ₹${exitCriteria.exitBelowPrice} (${percentAbove.toFixed(1)}% above)` });
        } else {
          alerts.push({ type: 'info', message: `✅ Above exit level: ₹${exitCriteria.exitBelowPrice} (+${percentAbove.toFixed(1)}%)` });
        }
      }
    }

    return alerts.length > 0 ? alerts : null;
  };

  const renderHoldingsCards = (positions: any[]) => {
    if (positions.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📂</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No holdings found</h3>
          <p className="text-gray-600 dark:text-[#8b949e]">Your {activeTab} positions will appear here</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {positions.map((position) => {
          const investedAmount = position.entryPrice * position.quantity;
          const currentValue = position.currentPrice * position.quantity;
          const pnl = currentValue - investedAmount;
          const pnlPercent = (pnl / investedAmount) * 100;
          const isProfit = pnl >= 0;
          const alerts = analyzeExitCriteria(position);

          return (
            <div
              key={position.id}
              className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-5 hover:border-[#ff8c42] transition-colors"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{position.symbol}</h3>
                <div className={`text-right ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                  <p className="text-xl font-bold">{isProfit ? '+' : ''}₹{pnl.toFixed(2)}</p>
                  <p className="text-sm">({isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%)</p>
                </div>
              </div>

              {/* Exit Reason for Closed */}
              {position.exitReason && position.status === 'closed' && (
                <div className="mb-3 px-3 py-2 bg-orange-500/20 border border-orange-500/30 rounded-lg">
                  <p className="text-sm text-orange-400 font-semibold">📤 Exited: {position.exitReason}</p>
                </div>
              )}

              {/* Exit Analysis Alerts */}
              {alerts && position.status === 'open' && (
                <div className="space-y-2 mb-4">
                  {alerts.map((alert, idx) => (
                    <div
                      key={idx}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                        alert.type === 'critical'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : alert.type === 'warning'
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {alert.message}
                    </div>
                  ))}
                </div>
              )}

              {/* Position Details Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-1">Quantity</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{position.quantity}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-1">Avg Buy Price</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">₹{position.entryPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-1">LTP</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">₹{position.currentPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-1">Current Value</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">₹{currentValue.toFixed(2)}</p>
                </div>
              </div>

              {/* Actions */}
              {position.status === 'open' && (
                <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-[#30363d]">
                  <button
                    onClick={() => {
                      setSelectedPosition(position);
                      setShowTransactionModal(true);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-500/20 text-blue-400 text-sm font-semibold rounded-lg hover:bg-blue-500/30 transition-colors"
                  >
                    Buy/Sell
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPosition(position);
                      setExitDetails({
                        exitPrice: position.currentPrice.toString(),
                        exitDate: formatDateForDisplay(getCurrentISTDate()),
                        exitReason: ''
                      });
                      setShowExitModal(true);
                    }}
                    className="flex-1 px-4 py-2 bg-red-500/20 text-red-400 text-sm font-semibold rounded-lg hover:bg-red-500/30 transition-colors"
                  >
                    Exit Trade
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };
  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1419]">
      <Navigation />
      {/* Header */}
      <div className="p-5 pt-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">My Portfolio</h1>
        <p className="text-gray-600 dark:text-[#8b949e]">Track your positions and portfolio performance</p>
      </div>
      {/* Metrics Cards */}
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
            <p className="text-xl font-bold text-gray-900 dark:text-white">{openPositions.length}</p>
          </div>
          <div className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg p-3 min-w-[180px]">
            <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-0.5">Closed Trades</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{closedPositions.length}</p>
          </div>
        </div>
      </div>
      {/* Positions Section */}
      <div className="px-5">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Positions</h2>
        </div>
        {/* Tabs */}
        <div className="flex gap-3 mb-5">
          <button
            onClick={() => setActiveTab('open')}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'open'
                ? 'bg-[#ff8c42] text-gray-900 dark:text-white border-[#ff8c42]'
                : 'bg-gray-50 dark:bg-[#1c2128] text-gray-600 dark:text-[#8b949e] border-gray-200 dark:border-[#30363d]'
            } border`}
          >
            Open ({openPositions.length})
          </button>
          <button
            onClick={() => setActiveTab('closed')}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'closed'
                ? 'bg-[#ff8c42] text-gray-900 dark:text-white border-[#ff8c42]'
                : 'bg-gray-50 dark:bg-[#1c2128] text-gray-600 dark:text-[#8b949e] border-gray-200 dark:border-[#30363d]'
            } border`}
          >
            Closed ({closedPositions.length})
          </button>
        </div>
        {/* Holdings Cards */}
        <div className="pb-8">
          {activeTab === 'open' ? renderHoldingsCards(openPositions) : renderHoldingsCards(closedPositions)}
        </div>
      </div>

      {/* Exit Trade Modal */}
      {showExitModal && selectedPosition && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setShowExitModal(false)}
        >
          <div
            className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Exit Trade - {selectedPosition.symbol}</h3>
              <button
                onClick={() => setShowExitModal(false)}
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
                    setExitDetails({ ...exitDetails, exitPrice: e.target.value })
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
                    setExitDetails({ ...exitDetails, exitDate: e.target.value })
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
                    setExitDetails({ ...exitDetails, exitReason: e.target.value })
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
                onClick={() => setShowExitModal(false)}
                className="flex-1 bg-[#30363d] hover:bg-[#3e4651] text-gray-900 dark:text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExitTrade}
                className="flex-1 bg-red-500 hover:bg-red-600 text-gray-900 dark:text-white font-semibold py-3 rounded-lg transition-colors"
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
            className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Add Transaction - {selectedPosition.symbol}</h3>
              <button
                onClick={() => setShowTransactionModal(false)}
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
                    onClick={() => setTransactionDetails({ ...transactionDetails, type: 'buy' })}
                    className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                      transactionDetails.type === 'buy'
                        ? 'bg-green-500 text-gray-900 dark:text-white'
                        : 'bg-[#30363d] text-gray-600 dark:text-[#8b949e] hover:bg-[#3e4651]'
                    }`}
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => setTransactionDetails({ ...transactionDetails, type: 'sell' })}
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
                    setTransactionDetails({ ...transactionDetails, quantity: e.target.value })
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
                onClick={() => setShowTransactionModal(false)}
                className="flex-1 bg-[#30363d] hover:bg-[#3e4651] text-gray-900 dark:text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTransaction}
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
      )}
    </div>
  );
}
