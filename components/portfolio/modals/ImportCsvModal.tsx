import React from 'react';
import { ValidationError } from '../../../lib/csvImport';

interface ImportCsvModalProps {
  isOpen: boolean;
  accounts: any[];
  activeAccount: any;
  selectedImportAccount: string;
  isImporting: boolean;
  importSummary: { total: number; valid: number; invalid: number } | null;
  importErrors: ValidationError[];
  onClose: () => void;
  onSetSelectedImportAccount: (accountId: string) => void;
  onCSVImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadTemplate: () => void;
  onDownloadErrorReport: () => void;
}

/**
 * ImportCsvModal - Modal for importing portfolio positions from CSV files
 * Supports multiple broker formats and provides validation feedback
 */
export const ImportCsvModal: React.FC<ImportCsvModalProps> = ({
  isOpen,
  accounts,
  activeAccount,
  selectedImportAccount,
  isImporting,
  importSummary,
  importErrors,
  onClose,
  onSetSelectedImportAccount,
  onCSVImport,
  onDownloadTemplate,
  onDownloadErrorReport
}) => {
  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Import Portfolio from CSV</h3>
          <button
            onClick={handleClose}
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
            onClick={onDownloadTemplate}
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
            onChange={(e) => onSetSelectedImportAccount(e.target.value)}
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
            onChange={onCSVImport}
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
                onClick={onDownloadErrorReport}
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
            onClick={handleClose}
            className="flex-1 bg-gray-100 dark:bg-[#30363d] hover:bg-gray-200 dark:hover:bg-[#3c444d] text-gray-900 dark:text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportCsvModal;
