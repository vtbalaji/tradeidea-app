'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../../components/Navigation';
import { useTrading } from '../../contexts/TradingContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAccounts } from '../../contexts/AccountsContext';
import { useSymbols, Symbol } from '../../contexts/SymbolsContext';
import { TrendingIcon, ChartIcon, TargetIcon, EntryIcon } from '@/components/icons';
import { getCurrentISTDate, formatDateForDisplay, formatDateForStorage } from '@/lib/dateUtils';
import { parseAndValidateCSV, csvRowToPosition, generateCSVTemplate, generateErrorReport, ValidationError } from '@/lib/csvImport';
import { db } from '@/lib/firebase';
export default function PortfolioPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { myPortfolio, exitTrade, addTransaction, updatePosition, addToPortfolio } = useTrading();
  const { accounts, activeAccount, setActiveAccount } = useAccounts();
  const { searchSymbols } = useSymbols();
  const [activeTab, setActiveTab] = useState('open');
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('detailed');
  const [showAddPositionModal, setShowAddPositionModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [symbolSuggestions, setSymbolSuggestions] = useState<Symbol[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [importErrors, setImportErrors] = useState<ValidationError[]>([]);
  const [importSummary, setImportSummary] = useState<{ total: number; valid: number; invalid: number } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedImportAccount, setSelectedImportAccount] = useState<string>('');

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
  const [newPosition, setNewPosition] = useState({
    symbol: '',
    tradeType: 'Long' as 'Long' | 'Short',
    entryPrice: '',
    currentPrice: '',
    target1: '',
    stopLoss: '',
    quantity: '',
    dateTaken: formatDateForDisplay(getCurrentISTDate()),
    exitCriteria: {
      exitAtStopLoss: true, // Always true by default
      exitAtTarget: true, // Always true by default
      exitBelow50EMA: false,
      exitBelow100MA: false,
      exitBelow200MA: false,
      exitOnWeeklySupertrend: false,
      customNote: '',
    }
  });
  // Filter positions by active account
  const accountPositions = activeAccount
    ? myPortfolio.filter(p => !p.accountId || p.accountId === activeAccount.id)
    : myPortfolio;

  console.log('Portfolio - activeAccount:', activeAccount);
  console.log('Portfolio - total positions:', myPortfolio.length);
  console.log('Portfolio - filtered positions:', accountPositions.length);
  console.log('Portfolio - sample position accountIds:', myPortfolio.slice(0, 3).map(p => ({ symbol: p.symbol, accountId: p.accountId })));

  const openPositions = accountPositions.filter(p => p.status === 'open');
  const closedPositions = accountPositions.filter(p => p.status === 'closed');
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

  // Handle symbol search
  const handleSymbolSearch = async (value: string) => {
    setNewPosition({ ...newPosition, symbol: value.toUpperCase() });

    if (value.length >= 1) {
      const results = await searchSymbols(value, 8);
      setSymbolSuggestions(results);
      setShowSuggestions(true);
    } else {
      setSymbolSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle symbol selection
  const handleSymbolSelect = (symbol: Symbol) => {
    setNewPosition({ ...newPosition, symbol: symbol.symbol });
    setShowSuggestions(false);
  };

  const handleAddPosition = async () => {
    if (!newPosition.symbol || !newPosition.entryPrice || !newPosition.quantity || !newPosition.target1 || !newPosition.stopLoss) {
      alert('Please fill in all required fields (Symbol, Entry Price, Quantity, Target, Stop Loss)');
      return;
    }

    try {
      const entryPrice = parseFloat(newPosition.entryPrice);
      const currentPrice = newPosition.currentPrice ? parseFloat(newPosition.currentPrice) : entryPrice;
      const quantity = parseFloat(newPosition.quantity);

      const positionData = {
        symbol: newPosition.symbol.toUpperCase(),
        tradeType: newPosition.tradeType,
        entryPrice: entryPrice,
        currentPrice: currentPrice,
        target1: parseFloat(newPosition.target1),
        stopLoss: parseFloat(newPosition.stopLoss),
        quantity: quantity,
        totalValue: entryPrice * quantity,
        dateTaken: formatDateForStorage(newPosition.dateTaken),
        exitCriteria: newPosition.exitCriteria,
      };

      await addToPortfolio('', positionData); // Empty ideaId for direct portfolio additions

      setShowAddPositionModal(false);
      setNewPosition({
        symbol: '',
        tradeType: 'Long',
        entryPrice: '',
        currentPrice: '',
        target1: '',
        stopLoss: '',
        quantity: '',
        dateTaken: formatDateForDisplay(getCurrentISTDate()),
        exitCriteria: {
          exitAtStopLoss: true,
          exitAtTarget: true,
          exitBelow50EMA: false,
          exitBelow100MA: false,
          exitBelow200MA: false,
          exitOnWeeklySupertrend: false,
          customNote: '',
        }
      });
      alert('Position added to your portfolio!');
    } catch (error) {
      console.error('Error adding position:', error);
      alert('Failed to add position');
    }
  };

  // Handle CSV Import
  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportErrors([]);
    setImportSummary(null);

    try {
      const text = await file.text();
      const result = await parseAndValidateCSV(text, db);

      setImportSummary(result.summary);
      setImportErrors(result.errors);

      if (result.validRows.length > 0) {
        // Import valid rows
        for (const row of result.validRows) {
          const positionData = csvRowToPosition(row);
          // Convert date format for storage
          positionData.dateTaken = formatDateForStorage(row.dateTaken);
          // Add accountId if selected
          if (selectedImportAccount) {
            positionData.accountId = selectedImportAccount;
          } else if (activeAccount) {
            positionData.accountId = activeAccount.id;
          }
          await addToPortfolio('', positionData);
        }
      }

      setIsImporting(false);
    } catch (error) {
      console.error('Error importing CSV:', error);
      setImportErrors([{
        row: 0,
        field: 'file',
        message: 'Failed to parse CSV file. Please check the format.'
      }]);
      setIsImporting(false);
    }
  };

  // Download CSV template
  const downloadTemplate = () => {
    const template = generateCSVTemplate();
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'portfolio_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download error report
  const downloadErrorReport = () => {
    if (importErrors.length === 0) return;
    const report = generateErrorReport(importErrors);
    const blob = new Blob([report], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import_errors.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

    // Check 100 MA
    if (exitCriteria.exitBelow100MA) {
      if (technicals?.sma100) {
        if (currentPrice < technicals.sma100) {
          alerts.push({ type: 'critical', message: `📉 Below 100 MA (₹${technicals.sma100.toFixed(2)}) - TIME TO EXIT` });
        } else {
          const percentAbove = ((currentPrice - technicals.sma100) / technicals.sma100) * 100;
          if (percentAbove <= 5) {
            alerts.push({ type: 'warning', message: `⚠️ Near 100 MA: ₹${technicals.sma100.toFixed(2)} (${percentAbove.toFixed(1)}% above)` });
          } else {
            alerts.push({ type: 'info', message: `✅ Above 100 MA: ₹${technicals.sma100.toFixed(2)} (+${percentAbove.toFixed(1)}%)` });
          }
        }
      } else {
        alerts.push({ type: 'warning', message: `⚠️ 100 MA data not available - Run batch analysis` });
      }
    }

    // Check 200 MA
    if (exitCriteria.exitBelow200MA) {
      if (technicals?.sma200) {
        if (currentPrice < technicals.sma200) {
          alerts.push({ type: 'critical', message: `📉 Below 200 MA (₹${technicals.sma200.toFixed(2)}) - TIME TO EXIT` });
        } else {
          const percentAbove = ((currentPrice - technicals.sma200) / technicals.sma200) * 100;
          if (percentAbove <= 5) {
            alerts.push({ type: 'warning', message: `⚠️ Near 200 MA: ₹${technicals.sma200.toFixed(2)} (${percentAbove.toFixed(1)}% above)` });
          } else {
            alerts.push({ type: 'info', message: `✅ Above 200 MA: ₹${technicals.sma200.toFixed(2)} (+${percentAbove.toFixed(1)}%)` });
          }
        }
      } else {
        alerts.push({ type: 'warning', message: `⚠️ 200 MA data not available - Run batch analysis` });
      }
    }

    // Check Weekly Supertrend
    if (exitCriteria.exitOnWeeklySupertrend) {
      if (technicals?.supertrend && technicals?.supertrendDirection) {
        if (technicals.supertrendDirection === -1) {
          alerts.push({ type: 'critical', message: `📉 Supertrend BEARISH (₹${technicals.supertrend.toFixed(2)}) - TIME TO EXIT` });
        } else {
          alerts.push({ type: 'info', message: `✅ Supertrend BULLISH (₹${technicals.supertrend.toFixed(2)})` });
        }
      } else {
        alerts.push({ type: 'warning', message: `⚠️ Supertrend data not available - Run batch analysis` });
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

    // Summary View
    if (viewMode === 'summary') {
      return (
        <div className="space-y-3">
          {positions.map((position) => {
            const investedAmount = position.entryPrice * position.quantity;
            const currentValue = position.currentPrice * position.quantity;
            const pnl = currentValue - investedAmount;
            const pnlPercent = (pnl / investedAmount) * 100;
            const isProfit = pnl >= 0;

            // Calculate recommendation
            const isAbove200MA = position.technicals?.sma200 && position.currentPrice > position.technicals.sma200;
            const isSupertrendBullish = position.technicals?.supertrendDirection === 1;
            let recommendation = 'HOLD';
            let bgColor = 'bg-yellow-500/20';
            let textColor = 'text-yellow-400';

            if (isAbove200MA && isSupertrendBullish) {
              recommendation = 'ACCUMULATE';
              bgColor = 'bg-green-500/20';
              textColor = 'text-green-400';
            } else if (!isAbove200MA) {
              recommendation = 'EXIT';
              bgColor = 'bg-red-500/20';
              textColor = 'text-red-400';
            }

            return (
              <div
                key={position.id}
                className="bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg p-4 hover:border-[#ff8c42] transition-colors"
              >
                {/* First Row: Symbol, Trade Type, P&L */}
                <div className="flex items-center justify-between gap-3 mb-2">
                  {/* Symbol and Trade Type */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">{position.symbol}</h3>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded flex-shrink-0 ${
                      position.tradeType === 'Long'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {position.tradeType || 'Long'}
                    </span>
                  </div>

                  {/* P&L */}
                  <div className={`text-right flex-shrink-0 ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                    <p className="text-base sm:text-lg font-bold">{isProfit ? '+' : ''}₹{pnl.toFixed(2)}</p>
                    <p className="text-xs">({isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%)</p>
                  </div>
                </div>

                {/* Second Row: Recommendation (if available) */}
                {position.technicals && position.status === 'open' && (
                  <div className={`px-3 py-1.5 rounded-lg ${bgColor} inline-block`}>
                    <p className={`text-xs font-bold ${textColor}`}>
                      {recommendation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    // Detailed View
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
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{position.symbol}</h3>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                    position.tradeType === 'Long'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {position.tradeType || 'Long'}
                  </span>
                </div>
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

              {/* Overall Recommendation */}
              {position.technicals && position.status === 'open' && (
                <div className="mb-4">
                  {(() => {
                    const isAbove200MA = position.technicals.sma200 && position.currentPrice > position.technicals.sma200;
                    const isSupertrendBullish = position.technicals.supertrendDirection === 1;

                    let recommendation = 'HOLD';
                    let bgColor = 'bg-yellow-500/20';
                    let borderColor = 'border-yellow-500/30';
                    let textColor = 'text-yellow-400';
                    let icon = '⏸️';

                    if (isAbove200MA && isSupertrendBullish) {
                      recommendation = 'ACCUMULATE';
                      bgColor = 'bg-green-500/20';
                      borderColor = 'border-green-500/30';
                      textColor = 'text-green-400';
                      icon = '📈';
                    } else if (!isAbove200MA) {
                      recommendation = 'EXIT';
                      bgColor = 'bg-red-500/20';
                      borderColor = 'border-red-500/30';
                      textColor = 'text-red-400';
                      icon = '🚨';
                    }

                    return (
                      <div className={`px-3 py-2 rounded-lg ${bgColor} border ${borderColor}`}>
                        <p className={`text-sm font-bold ${textColor}`}>
                          {icon} Overall Recommendation: {recommendation}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Exit Analysis Alerts - Only SL and Target */}
              {alerts && position.status === 'open' && (
                <div className="space-y-2 mb-4">
                  {alerts
                    .filter(alert =>
                      alert.message.includes('SL') ||
                      alert.message.includes('TARGET') ||
                      alert.message.includes('Target') ||
                      alert.message.includes('STOP LOSS')
                    )
                    .map((alert, idx) => (
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

              {/* Technical Indicators & Fundamentals Display */}
              {(position.technicals || position.fundamentals) && position.status === 'open' && (
                <div className="mb-4 p-3 bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg">
                  <p className="text-xs font-bold text-[#ff8c42] mb-2">Technical Levels</p>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    {position.technicals?.ema50 && (
                      <div>
                        <span className="text-gray-600 dark:text-[#8b949e]">50 EMA:</span>
                        <span className={`ml-1 font-semibold ${position.currentPrice > position.technicals.ema50 ? 'text-green-500' : 'text-red-500'}`}>
                          ₹{position.technicals.ema50.toFixed(2)} {position.currentPrice > position.technicals.ema50 ? '↗' : '↘'}
                        </span>
                      </div>
                    )}
                    {position.technicals?.sma100 && (
                      <div>
                        <span className="text-gray-600 dark:text-[#8b949e]">100 MA:</span>
                        <span className={`ml-1 font-semibold ${position.currentPrice > position.technicals.sma100 ? 'text-green-500' : 'text-red-500'}`}>
                          ₹{position.technicals.sma100.toFixed(2)} {position.currentPrice > position.technicals.sma100 ? '↗' : '↘'}
                        </span>
                      </div>
                    )}
                    {position.technicals?.sma200 && (
                      <div>
                        <span className="text-gray-600 dark:text-[#8b949e]">200 MA:</span>
                        <span className={`ml-1 font-semibold ${position.currentPrice > position.technicals.sma200 ? 'text-green-500' : 'text-red-500'}`}>
                          ₹{position.technicals.sma200.toFixed(2)} {position.currentPrice > position.technicals.sma200 ? '↗' : '↘'}
                        </span>
                      </div>
                    )}
                    {position.technicals?.supertrend && (
                      <div>
                        <span className="text-gray-600 dark:text-[#8b949e]">Supertrend:</span>
                        <span className={`ml-1 font-semibold ${position.technicals.supertrendDirection === 1 ? 'text-green-500' : 'text-red-500'}`}>
                          ₹{position.technicals.supertrend.toFixed(2)} {position.technicals.supertrendDirection === 1 ? '↗' : '↘'}
                        </span>
                      </div>
                    )}
                  </div>
                  {position.fundamentals && (
                    <>
                      <p className="text-xs font-bold text-[#ff8c42] mb-2 pt-2 border-t border-gray-200 dark:border-[#30363d]">Fundamentals</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {position.fundamentals.trailingPE && (
                          <div>
                            <span className="text-gray-600 dark:text-[#8b949e]">PE:</span>
                            <span className="ml-1 font-semibold text-gray-900 dark:text-white">{position.fundamentals.trailingPE.toFixed(2)}</span>
                          </div>
                        )}
                        {position.fundamentals.returnOnEquity && (
                          <div>
                            <span className="text-gray-600 dark:text-[#8b949e]">ROE:</span>
                            <span className="ml-1 font-semibold text-gray-900 dark:text-white">{position.fundamentals.returnOnEquity.toFixed(1)}%</span>
                          </div>
                        )}
                        {position.fundamentals.debtToEquity && (
                          <div>
                            <span className="text-gray-600 dark:text-[#8b949e]">Debt-to-Equity:</span>
                            <span className="ml-1 font-semibold text-gray-900 dark:text-white">{position.fundamentals.debtToEquity.toFixed(1)}</span>
                          </div>
                        )}
                        {position.fundamentals.earningsGrowth && (
                          <div>
                            <span className="text-gray-600 dark:text-[#8b949e]">Earnings Growth:</span>
                            <span className="ml-1 font-semibold text-gray-900 dark:text-white">{position.fundamentals.earningsGrowth.toFixed(1)}%</span>
                          </div>
                        )}
                        {position.fundamentals.fundamentalRating && (
                          <div>
                            <span className="text-gray-600 dark:text-[#8b949e]">Rating:</span>
                            <span className={`ml-1 font-semibold ${
                              position.fundamentals.fundamentalRating === 'EXCELLENT' ? 'text-green-500' :
                              position.fundamentals.fundamentalRating === 'GOOD' ? 'text-blue-400' :
                              position.fundamentals.fundamentalRating === 'AVERAGE' ? 'text-yellow-400' :
                              'text-red-400'
                            }`}>{position.fundamentals.fundamentalRating}</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Warning if no technical data available */}
              {!position.technicals && position.status === 'open' && (
                <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    ⚠️ Technical data not available. Waiting for next analysis cycle.
                  </p>
                </div>
              )}

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
        <div className="flex justify-between items-center mb-2 gap-2">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white">My Portfolio</h1>
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={() => setShowImportModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-3 sm:px-4 rounded-lg transition-colors flex items-center gap-2 text-sm sm:text-base"
            >
              <span className="text-xl hidden sm:inline">📥</span>
              <span className="whitespace-nowrap">Import CSV</span>
            </button>
            <button
              onClick={() => setShowAddPositionModal(true)}
              className="bg-[#ff8c42] hover:bg-[#ff9a58] text-white font-semibold py-2 px-3 sm:px-4 rounded-lg transition-colors flex items-center gap-2 text-sm sm:text-base"
            >
              <span className="text-xl">+</span>
              <span className="hidden sm:inline">Add Position</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
        <p className="text-gray-600 dark:text-[#8b949e]">Track your positions and portfolio performance</p>

        {/* Account Selector */}
        {accounts.length > 1 && activeAccount && (
          <div className="flex items-center gap-3 mt-4">
            <label className="text-sm font-semibold text-gray-600 dark:text-[#8b949e]">Account:</label>
            <select
              value={activeAccount.id}
              onChange={(e) => {
                const account = accounts.find(a => a.id === e.target.value);
                if (account) setActiveAccount(account);
              }}
              className="bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-gray-900 dark:text-white font-semibold"
              style={{ borderLeftColor: activeAccount.color, borderLeftWidth: '4px' }}
            >
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name} {account.isDefault ? '(Default)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
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
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Positions</h2>
          {activeTab === 'open' && openPositions.length > 0 && openPositions[0]?.technicals?.updatedAt && (
            <span className="text-xs text-orange-600 dark:text-orange-400">
              Technical data updated: {(() => {
                const updatedAt = openPositions[0].technicals.updatedAt.toDate();
                const now = new Date();
                const diffHours = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60));

                if (diffHours < 1) {
                  return 'just now';
                } else if (diffHours < 24) {
                  return `${diffHours}h ago`;
                } else {
                  const diffDays = Math.floor(diffHours / 24);
                  return `${diffDays}d ago`;
                }
              })()}
            </span>
          )}
        </div>
        {/* Tabs */}
        <div className="flex items-center justify-between mb-5 gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('open')}
              className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                activeTab === 'open'
                  ? 'bg-[#ff8c42] text-gray-900 dark:text-white border-[#ff8c42]'
                  : 'bg-gray-50 dark:bg-[#1c2128] text-gray-600 dark:text-[#8b949e] border-gray-200 dark:border-[#30363d]'
              } border whitespace-nowrap`}
            >
              Open ({openPositions.length})
            </button>
            <button
              onClick={() => setActiveTab('closed')}
              className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                activeTab === 'closed'
                  ? 'bg-[#ff8c42] text-gray-900 dark:text-white border-[#ff8c42]'
                  : 'bg-gray-50 dark:bg-[#1c2128] text-gray-600 dark:text-[#8b949e] border-gray-200 dark:border-[#30363d]'
              } border whitespace-nowrap`}
            >
              Closed ({closedPositions.length})
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-1.5 sm:gap-2">
            <button
              onClick={() => setViewMode('summary')}
              className={`px-2.5 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'summary'
                  ? 'bg-[#ff8c42] text-gray-900 dark:text-white'
                  : 'bg-gray-50 dark:bg-[#1c2128] text-gray-600 dark:text-[#8b949e] hover:bg-gray-100 dark:hover:bg-[#30363d]'
              } whitespace-nowrap`}
            >
              Summary
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-2.5 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'detailed'
                  ? 'bg-[#ff8c42] text-gray-900 dark:text-white'
                  : 'bg-gray-50 dark:bg-[#1c2128] text-gray-600 dark:text-[#8b949e] hover:bg-gray-100 dark:hover:bg-[#30363d]'
              } whitespace-nowrap`}
            >
              Detailed
            </button>
          </div>
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

      {/* Add Position Modal */}
      {showAddPositionModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddPositionModal(false)}
        >
          <div
            className="bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Add New Position</h3>
              <button
                onClick={() => setShowAddPositionModal(false)}
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
                    onChange={(e) => setNewPosition({ ...newPosition, entryPrice: e.target.value })}
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
                    onChange={(e) => setNewPosition({ ...newPosition, currentPrice: e.target.value })}
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
                  <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-2">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    value={newPosition.quantity}
                    onChange={(e) => setNewPosition({ ...newPosition, quantity: e.target.value })}
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
                    onChange={(e) => setNewPosition({ ...newPosition, dateTaken: e.target.value })}
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
                        setNewPosition({
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
                        setNewPosition({
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
                        setNewPosition({
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
                        setNewPosition({
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
                        setNewPosition({
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
                onClick={() => setShowAddPositionModal(false)}
                className="flex-1 bg-gray-100 dark:bg-[#30363d] hover:bg-gray-200 dark:hover:bg-[#3c444d] text-gray-900 dark:text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPosition}
                className="flex-1 bg-[#ff8c42] hover:bg-[#ff9a58] text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Add Position
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {showImportModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowImportModal(false);
            setImportErrors([]);
            setImportSummary(null);
          }}
        >
          <div
            className="bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Import Portfolio from CSV</h3>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportErrors([]);
                  setImportSummary(null);
                }}
                className="text-gray-600 dark:text-[#8b949e] hover:text-gray-900 dark:hover:text-white transition-colors text-2xl"
              >
                ×
              </button>
            </div>

            {/* Instructions */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">📋 CSV Format Requirements</h4>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-disc list-inside">
                <li><strong>Auto-detects:</strong> Zerodha, ICICI Direct, Upstox, and standard formats</li>
                <li><strong>Required fields:</strong> Symbol/Stock Symbol, Quantity/Qty, Entry Price/Avg Cost</li>
                <li><strong>Optional:</strong> Target (+15% default), Stop Loss (-8% default), Date (today), Trade Type (Long)</li>
                <li><strong>Default Exit Strategy:</strong> Stop Loss, Target, 200MA, Weekly Supertrend (all enabled)</li>
                <li>Symbols validated against NSE database • Invalid rows reported</li>
              </ul>
            </div>

            {/* Download Template Button */}
            <div className="mb-6">
              <button
                onClick={downloadTemplate}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <span>📄</span>
                Download CSV Template
              </button>
            </div>

            {/* Account Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-2">
                Import to Account
              </label>
              <select
                value={selectedImportAccount}
                onChange={(e) => setSelectedImportAccount(e.target.value)}
                className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-gray-900 dark:text-white"
              >
                <option value="">
                  {activeAccount ? `${activeAccount.name} (Current)` : 'Select account...'}
                </option>
                {accounts.filter(a => a.id !== activeAccount?.id).map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} {account.isDefault ? '(Default)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-2">
                Upload CSV File
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVImport}
                disabled={isImporting}
                className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#ff8c42] file:text-white hover:file:bg-[#ff9a58] file:cursor-pointer disabled:opacity-50"
              />
            </div>

            {/* Loading Indicator */}
            {isImporting && (
              <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                  ⏳ Importing and validating positions...
                </p>
              </div>
            )}

            {/* Import Summary */}
            {importSummary && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Import Summary</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-[#8b949e]">Total Rows</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{importSummary.total}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-[#8b949e]">Valid</p>
                    <p className="text-xl font-bold text-green-500">{importSummary.valid}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-[#8b949e]">Invalid</p>
                    <p className="text-xl font-bold text-red-500">{importSummary.invalid}</p>
                  </div>
                </div>
                {importSummary.valid > 0 && (
                  <p className="mt-3 text-sm text-green-600 dark:text-green-400">
                    ✅ {importSummary.valid} position{importSummary.valid > 1 ? 's' : ''} successfully imported!
                  </p>
                )}
              </div>
            )}

            {/* Error List */}
            {importErrors.length > 0 && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-red-500">❌ Import Errors ({importErrors.length})</h4>
                  <button
                    onClick={downloadErrorReport}
                    className="text-xs bg-red-500 hover:bg-red-600 text-white font-semibold px-3 py-1.5 rounded transition-colors"
                  >
                    Download Error Report
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  {importErrors.slice(0, 20).map((error, idx) => (
                    <div key={idx} className="text-sm text-red-700 dark:text-red-300 mb-2">
                      <strong>Row {error.row}</strong> - {error.field}: {error.message}
                    </div>
                  ))}
                  {importErrors.length > 20 && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                      ... and {importErrors.length - 20} more errors. Download full report.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Close Button */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportErrors([]);
                  setImportSummary(null);
                }}
                className="flex-1 bg-gray-100 dark:bg-[#30363d] hover:bg-gray-200 dark:hover:bg-[#3c444d] text-gray-900 dark:text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
