#!/bin/bash

# TradeIdea - EOD Technical Analysis Batch Job
# This script activates the Python virtual environment and runs technical analysis

set -e  # Exit on error

echo "🚀 Starting EOD Technical Analysis Batch Job"
echo "============================================"
echo ""

# Activate virtual environment and run analysis
source venv/bin/activate && python3 scripts/analyze-symbols.py

echo ""
echo "✅ EOD Batch Job Completed!"
