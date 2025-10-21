#!/bin/bash

# TradeIdea - EOD Technical Analysis Batch Job
# This script activates the Python virtual environment and runs technical analysis
# Now using DuckDB + NSE for faster, more reliable data

set -e  # Exit on error

echo "🚀 Starting EOD Technical Analysis Batch Job (DuckDB + NSE)"
echo "============================================"
echo ""

# Activate virtual environment and run analysis
source venv/bin/activate && python3 scripts/analyze-symbols-duckdb.py

echo ""
echo "✅ EOD Batch Job Completed!"
