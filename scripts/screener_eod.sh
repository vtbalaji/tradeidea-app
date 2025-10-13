#!/bin/bash

###############################################################################
# EOD Screener Script
#
# This script runs all technical analysis and screener jobs for end-of-day data:
# 1. Analyze symbols - Calculates technical indicators and updates Firebase
# 2. Run screeners - Detects MA crossovers, Supertrend crossovers, and Volume spikes
#
# Usage: ./scripts/screener_eod.sh
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           EOD Screener & Technical Analysis Job           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📍 Project Root: ${PROJECT_ROOT}${NC}"
echo -e "${YELLOW}📅 Date: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo ""

# Change to project root
cd "$PROJECT_ROOT"

# Activate virtual environment
echo -e "${BLUE}🔧 Activating Python virtual environment...${NC}"
if [ -d "venv" ]; then
    source venv/bin/activate
    echo -e "${GREEN}✅ Virtual environment activated${NC}"
else
    echo -e "${RED}❌ Virtual environment not found at venv/${NC}"
    echo -e "${YELLOW}💡 Create it with: python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt${NC}"
    exit 1
fi

# Check if serviceAccountKey.json exists
if [ ! -f "serviceAccountKey.json" ]; then
    echo -e "${RED}❌ serviceAccountKey.json not found in project root${NC}"
    echo -e "${YELLOW}💡 Please add your Firebase service account key to the project root${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}        STEP 1: Technical Analysis (analyze-symbols.py)    ${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}📊 This will calculate technical indicators for all symbols...${NC}"
echo -e "${YELLOW}⏱️  Expected time: 5-15 minutes depending on symbol count${NC}"
echo ""

START_TIME=$(date +%s)

# Run technical analysis
python3 scripts/analyze-symbols.py

if [ $? -eq 0 ]; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    echo ""
    echo -e "${GREEN}✅ Technical analysis completed successfully in ${DURATION}s${NC}"
else
    echo -e "${RED}❌ Technical analysis failed${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}          STEP 2: Screeners (screeners.py)                 ${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}🔍 This will detect:${NC}"
echo -e "${YELLOW}   • 50 MA crossovers (bullish & bearish)${NC}"
echo -e "${YELLOW}   • 200 MA crossovers (bullish & bearish)${NC}"
echo -e "${YELLOW}   • Supertrend crossovers${NC}"
echo -e "${YELLOW}   • Volume spikes (volume > 20MA)${NC}"
echo -e "${YELLOW}⏱️  Expected time: 3-10 minutes${NC}"
echo ""

START_TIME=$(date +%s)

# Run screeners
python3 scripts/screeners.py

if [ $? -eq 0 ]; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    echo ""
    echo -e "${GREEN}✅ Screeners completed successfully in ${DURATION}s${NC}"
else
    echo -e "${RED}❌ Screeners failed${NC}"
    exit 1
fi

# Deactivate virtual environment
deactivate

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              🎉 ALL JOBS COMPLETED SUCCESSFULLY! 🎉         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📊 Summary:${NC}"
echo -e "${BLUE}   ✓ Technical indicators calculated and stored in Firebase${NC}"
echo -e "${BLUE}   ✓ MA crossovers detected and stored${NC}"
echo -e "${BLUE}   ✓ Supertrend crossovers detected and stored${NC}"
echo -e "${BLUE}   ✓ Volume spikes detected and stored${NC}"
echo ""
echo -e "${YELLOW}💡 View results at: http://localhost:3000/cross50200${NC}"
echo ""
