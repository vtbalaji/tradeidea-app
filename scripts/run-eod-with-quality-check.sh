#!/bin/bash
#
# Complete EOD Process with Data Quality Checks
#
# Usage:
#   ./scripts/run-eod-with-quality-check.sh [symbol]
#
# Without symbol: Runs full EOD for all symbols
# With symbol: Runs EOD for specific symbol only

set -e  # Exit on error

SYMBOL=${1:-}

echo "=========================================="
echo "🚀 Starting EOD Process with Quality Check"
echo "=========================================="
echo ""

if [ -n "$SYMBOL" ]; then
    echo "📊 Mode: Single symbol ($SYMBOL)"
else
    echo "📊 Mode: Full batch (all symbols)"
fi

echo ""

# Step 1: Fetch EOD data
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Fetching EOD data..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -n "$SYMBOL" ]; then
    python3 scripts/fetch-eod-data.py "$SYMBOL"
else
    python3 scripts/fetch-eod-data.py
fi

echo "✅ EOD data fetch complete"
echo ""

# Step 2: Calculate technical indicators
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Calculating technical indicators..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -n "$SYMBOL" ]; then
    python3 scripts/analyze-symbols.py "$SYMBOL"
else
    python3 scripts/analyze-symbols.py
fi

echo "✅ Technical analysis complete"
echo ""

# Step 3: Data quality check
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3: Running data quality checks..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -n "$SYMBOL" ]; then
    # For single symbol, check portfolio symbols + this one
    python3 scripts/eod-data-quality-check.py --portfolio
else
    # For batch, check 20 random symbols + portfolio
    python3 scripts/eod-data-quality-check.py --count 20 --save-report
fi

QUALITY_CHECK_EXIT=$?

echo ""

if [ $QUALITY_CHECK_EXIT -eq 0 ]; then
    echo "✅ Data quality check PASSED"
else
    echo "⚠️  Data quality check found issues!"
    echo "    Review the report above for details."
    echo ""
    echo "    To fix issues, you can:"
    echo "    1. Re-run EOD for affected symbols"
    echo "    2. Check DuckDB for data corruption"
    echo "    3. Verify Yahoo Finance connectivity"
fi

echo ""
echo "=========================================="
echo "✅ EOD Process Complete"
echo "=========================================="

exit $QUALITY_CHECK_EXIT
