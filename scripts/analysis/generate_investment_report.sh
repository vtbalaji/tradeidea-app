#!/bin/bash

# Investment Report Generator
# Usage: ./generate_investment_report.sh SYMBOL [YEARS] [SECTOR]

set -e

SYMBOL_INPUT=$1
YEARS=${2:-3}
SECTOR=${3:-}

if [ -z "$SYMBOL_INPUT" ]; then
    echo "Usage: $0 SYMBOL [YEARS] [SECTOR]"
    echo "Example: $0 BHEL 3"
    echo "Example: $0 HDFCBANK 5 BANKING"
    exit 1
fi

# Convert symbol to uppercase for consistency
SYMBOL=$(echo "$SYMBOL_INPUT" | tr '[:lower:]' '[:upper:]')

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "================================================"
echo "Investment Report Generator"
echo "================================================"
echo "Symbol: $SYMBOL"
echo "Years: $YEARS"
echo "Sector: ${SECTOR:-Auto-detect}"
echo "================================================"
echo ""

# Step 1: Generate JSON
echo "Step 1/2: Generating analysis (JSON)..."
if [ -z "$SECTOR" ]; then
    venv/bin/python scripts/analysis/enhanced_company_report_v2.py "$SYMBOL" --years "$YEARS" --output json
else
    venv/bin/python scripts/analysis/enhanced_company_report_v2.py "$SYMBOL" --years "$YEARS" --sector "$SECTOR" --output json
fi

JSON_FILE=$(ls -t enhanced_report_v2_${SYMBOL}_*.json 2>/dev/null | head -1)

if [ -z "$JSON_FILE" ]; then
    echo "❌ Error: JSON report not generated for $SYMBOL"
    exit 1
fi

echo "✅ JSON: $JSON_FILE"
echo ""

# Step 2: Generate HTML
echo "Step 2/2: Generating HTML report..."
venv/bin/python scripts/analysis/generate_pdf_report.py "$JSON_FILE"

HTML_FILE=$(ls -t investment_report_${SYMBOL}_*.html 2>/dev/null | head -1)

if [ -z "$HTML_FILE" ]; then
    echo "❌ Error: HTML report not generated"
    exit 1
fi

echo ""
echo "================================================"
echo "✅ COMPLETE"
echo "================================================"
echo "JSON: $JSON_FILE"
echo "HTML: $HTML_FILE"
echo ""
echo "To view: open $HTML_FILE"
echo "================================================"
