#!/bin/bash

# TradeIdea - Weekly Fundamentals Analysis Batch Job
# This script activates the Python virtual environment and runs fundamentals analysis
# Run this weekly (e.g., every Sunday)

set -e  # Exit on error

echo "🚀 Starting Weekly Fundamentals Analysis Batch Job"
echo "=================================================="
echo ""

# Activate virtual environment and run analysis
source venv/bin/activate && python3 scripts/analyze-fundamentals.py

echo ""
echo "✅ Fundamentals Batch Job Completed!"
