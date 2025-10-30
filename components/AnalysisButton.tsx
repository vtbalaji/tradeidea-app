import React from 'react';

interface AnalysisButtonProps {
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * AnalysisButton - Reusable button component for triggering investor analysis
 * Shows a bar chart icon with "Analysis" text
 */
export const AnalysisButton: React.FC<AnalysisButtonProps> = ({
  onClick,
  disabled = false,
  className = ''
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-[#30363d] hover:bg-gray-200 dark:hover:bg-[#3c444d] border border-gray-200 dark:border-[#444c56] text-gray-900 dark:text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M3 13h2v8H3v-8zm4-4h2v12H7V9zm4-6h2v18h-2V3zm4 8h2v10h-2V11zm4-2h2v12h-2V9z"/>
      </svg>
      <span>Analysis</span>
    </button>
  );
};

export default AnalysisButton;
