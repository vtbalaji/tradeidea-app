#!/bin/bash

# TradeIdea - EOD Technical Analysis Batch Job (Yahoo Finance - BACKUP)
# This is the original version using Yahoo Finance
# Use eod_batch.sh for the new DuckDB + NSE version

set -e  # Exit on error

echo "🚀 Starting EOD Technical Analysis Batch Job (Yahoo Finance - BACKUP)"
echo "============================================"
echo ""

# Activate virtual environment and run analysis
source venv/bin/activate && python3 scripts/analyze-symbols.py

echo ""
echo "✅ EOD Batch Job Completed!"
