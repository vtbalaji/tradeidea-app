#!/bin/bash
# Daily EOD Batch Process
# Run after 4 PM IST for accurate EOD data

echo "🚀 Starting Daily EOD Batch Process"
echo "===================================="
echo "Started at: $(date '+%Y-%m-%d %H:%M:%S')"
echo "Run after 4 PM IST for accurate EOD data"
echo ""

# Change to project root
cd "$(dirname "$0")/.."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found!"
    echo "Please run: ./scripts/setup-venv.sh"
    exit 1
fi

# Use explicit venv Python path (DO NOT use system python3)
PYTHON="./venv/bin/python3"
echo "🐍 Using Python: $PYTHON"
$PYTHON --version
echo ""

# 1. Fetch NSE EOD Data
echo "📥 Step 1/3: Fetching NSE EOD Data..."
$PYTHON scripts/fetch-eod-data.py
if [ $? -ne 0 ]; then
    echo "❌ EOD fetch failed!"
    exit 1
fi

# 2. Run Technical Analysis
echo ""
echo "📊 Step 2/3: Running Technical Analysis..."
$PYTHON scripts/analyze-symbols.py
if [ $? -ne 0 ]; then
    echo "❌ Technical analysis failed!"
    exit 1
fi

# 3. Run Screeners
echo ""
echo "🔍 Step 3/3: Running Screeners..."
$PYTHON scripts/screeners.py
if [ $? -ne 0 ]; then
    echo "❌ Screeners failed!"
    exit 1
fi

echo ""
echo "✅ Daily EOD Batch Process Completed!"
echo "Finished at: $(date '+%Y-%m-%d %H:%M:%S')"
echo "===================================="
