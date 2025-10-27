#!/bin/bash
# Quick Test Script - Process XBRL + Generate Report
#
# Usage:
#   ./test.sh TCS
#   ./test.sh SBIN
#   ./test.sh HDFCBANK

SYMBOL=$1

if [ -z "$SYMBOL" ]; then
    echo "Usage: ./test.sh SYMBOL"
    echo "Example: ./test.sh TCS"
    exit 1
fi

echo "========================================================================"
echo "🧪 QUICK TEST: $SYMBOL" --prefer consolidated
echo "========================================================================"

# Step 1: Process XBRL
echo ""
echo "📄 Step 1: Processing XBRL files..."
./venv/bin/python3 ./scripts/xbrl_eod.py --symbol "$SYMBOL"  --prefer consolidated

# Step 2: Generate Report
echo ""
echo "📊 Step 2: Generating forensic report..."
./venv/bin/python3 ./scripts/analysis/enhanced_company_report_v2.py "$SYMBOL"

echo ""
echo "========================================================================"
echo "✅ TEST COMPLETED"
echo "========================================================================"
