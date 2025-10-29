#!/bin/bash

# Investment Report Generator - All-in-One Script
# Generates both JSON analysis and PDF report

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PYTHON="$PROJECT_ROOT/venv/bin/python3"

# Usage info
usage() {
    cat << EOF
${BLUE}Investment Report Generator${NC}

Generate comprehensive investment analysis reports in PDF format.

${YELLOW}Usage:${NC}
    $0 <SYMBOL> [OPTIONS]

${YELLOW}Arguments:${NC}
    SYMBOL          Stock symbol (e.g., HDFCBANK, TCS, INFY)

${YELLOW}Options:${NC}
    --years N       Number of years to analyze (default: 5)
    --html-only     Generate only HTML, skip PDF
    --keep-json     Keep intermediate JSON file
    --open          Open the report in browser after generation
    -h, --help      Show this help message

${YELLOW}Examples:${NC}
    # Basic usage
    $0 HDFCBANK

    # Analyze 3 years of data
    $0 TCS --years 3

    # Generate and open report
    $0 INFY --open

    # Keep JSON for later use
    $0 RELIANCE --keep-json

    # HTML only (if PDF libraries not installed)
    $0 WIPRO --html-only

${YELLOW}Output:${NC}
    - HTML: investment_report_SYMBOL_TIMESTAMP.html
    - PDF:  investment_report_SYMBOL_TIMESTAMP.pdf (if WeasyPrint available)
    - JSON: enhanced_report_v2_SYMBOL_TIMESTAMP.json (if --keep-json)

EOF
}

# Check if symbol provided
if [ $# -eq 0 ] || [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
    usage
    exit 0
fi

SYMBOL="$1"
shift

# Parse options
YEARS=5
HTML_ONLY=false
KEEP_JSON=false
OPEN_REPORT=false

while [ $# -gt 0 ]; do
    case "$1" in
        --years)
            YEARS="$2"
            shift 2
            ;;
        --html-only)
            HTML_ONLY=true
            shift
            ;;
        --keep-json)
            KEEP_JSON=true
            shift
            ;;
        --open)
            OPEN_REPORT=true
            shift
            ;;
        *)
            echo -e "${RED}Error: Unknown option $1${NC}"
            usage
            exit 1
            ;;
    esac
done

echo -e "${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Investment Report Generator - TradeIdea        ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Generate JSON analysis
echo -e "${YELLOW}[1/3]${NC} Generating analysis for ${GREEN}$SYMBOL${NC}..."
echo -e "       Years: $YEARS"
echo ""

cd "$PROJECT_ROOT"

if ! $PYTHON scripts/analysis/enhanced_company_report_v2.py "$SYMBOL" --years "$YEARS" --output json; then
    echo -e "${RED}✗ Error generating analysis${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✓${NC} Analysis complete"
echo ""

# Find the generated JSON file
JSON_FILE=$(ls -t enhanced_report_v2_${SYMBOL}_*.json 2>/dev/null | head -1)

if [ -z "$JSON_FILE" ]; then
    echo -e "${RED}✗ Error: JSON file not found${NC}"
    exit 1
fi

echo -e "   JSON file: ${BLUE}$JSON_FILE${NC}"
echo ""

# Step 2: Generate PDF/HTML report
echo -e "${YELLOW}[2/3]${NC} Generating PDF report..."
echo ""

if ! $PYTHON scripts/analysis/generate_pdf_report.py "$JSON_FILE"; then
    echo -e "${RED}✗ Error generating PDF${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✓${NC} Report generated"
echo ""

# Find the generated report file
HTML_FILE=$(ls -t investment_report_${SYMBOL}_*.html 2>/dev/null | head -1)
PDF_FILE=$(ls -t investment_report_${SYMBOL}_*.pdf 2>/dev/null | head -1)

# Step 3: Cleanup and finalization
echo -e "${YELLOW}[3/3]${NC} Finalizing..."
echo ""

# Clean up JSON if not keeping
if [ "$KEEP_JSON" = false ]; then
    rm -f "$JSON_FILE"
    echo -e "   ${BLUE}•${NC} Cleaned up temporary JSON file"
else
    echo -e "   ${BLUE}•${NC} Kept JSON file: ${GREEN}$JSON_FILE${NC}"
fi

# Show summary
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Report generation complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "📁 Generated files:"

if [ -f "$PDF_FILE" ]; then
    echo -e "   ${GREEN}✓${NC} PDF:  ${BLUE}$PDF_FILE${NC}"
    REPORT_FILE="$PDF_FILE"
else
    echo -e "   ${YELLOW}⚠${NC} PDF not available (system libraries missing)"
fi

if [ -f "$HTML_FILE" ]; then
    echo -e "   ${GREEN}✓${NC} HTML: ${BLUE}$HTML_FILE${NC}"
    REPORT_FILE="${REPORT_FILE:-$HTML_FILE}"
fi

echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
if [ ! -f "$PDF_FILE" ] && [ -f "$HTML_FILE" ]; then
    echo -e "   • Open HTML in browser and use 'Print to PDF' to create PDF"
    echo -e "   • Or install system libraries: ${BLUE}brew install pango cairo${NC}"
fi
echo -e "   • Customize template: ${BLUE}scripts/analysis/report_template.html${NC}"
echo -e "   • See docs: ${BLUE}scripts/analysis/PDF_REPORT_README.md${NC}"
echo ""

# Open report if requested
if [ "$OPEN_REPORT" = true ] && [ -n "$REPORT_FILE" ]; then
    echo -e "${YELLOW}📖${NC} Opening report..."
    open "$REPORT_FILE"
fi

echo -e "${GREEN}Done!${NC}"
echo ""
