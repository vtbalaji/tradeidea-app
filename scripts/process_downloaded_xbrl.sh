#!/bin/bash
#
# Process Downloaded XBRL Files
#
# This script organizes downloaded XBRL files from NSE India and processes them.
#
# Usage:
#   ./scripts/process_downloaded_xbrl.sh
#   ./scripts/process_downloaded_xbrl.sh ~/Downloads/
#

set -e  # Exit on error

echo "🚀 XBRL Processing Pipeline"
echo "========================================================================"

# Determine source directory
SOURCE_DIR="${1:-$HOME/Downloads}"

if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ Directory not found: $SOURCE_DIR"
    exit 1
fi

echo "📂 Source: $SOURCE_DIR"
echo "📂 Target: xbrl/"
echo ""

# Check for XML files
XML_COUNT=$(find "$SOURCE_DIR" -maxdepth 1 -name "*.xml" -type f 2>/dev/null | wc -l | tr -d ' ')

if [ "$XML_COUNT" -eq 0 ]; then
    echo "⚠️  No .xml files found in $SOURCE_DIR"
    echo ""
    echo "💡 Manual Download Instructions:"
    echo "   1. Visit: https://www.nseindia.com/companies-listing/corporate-filings-financial-results"
    echo "   2. Search for your symbol (e.g., TCS)"
    echo "   3. Click on XBRL links to download"
    echo "   4. Files will be saved to ~/Downloads/"
    echo ""
    exit 1
fi

echo "✅ Found $XML_COUNT XML files"
echo ""

# Step 1: Organize files
echo "📋 Step 1: Organizing files..."
echo "------------------------------------------------------------------------"

if [ -f "./scripts/organize_xbrl_files.py" ]; then
    # Try auto mode first
    echo "Attempting auto-organization..."
    ./scripts/organize_xbrl_files.py --dir "$SOURCE_DIR" --auto --dry-run

    read -p "Continue with organization? [Y/n] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
        ./scripts/organize_xbrl_files.py --dir "$SOURCE_DIR" --auto
    else
        echo "⏭️  Skipped organization"
    fi
else
    echo "⚠️  organize_xbrl_files.py not found, skipping..."
fi

echo ""

# Step 2: Process XBRL files
echo "📊 Step 2: Processing XBRL files..."
echo "------------------------------------------------------------------------"

if [ -f "./scripts/xbrl_eod.py" ]; then
    XBRL_COUNT=$(find ./xbrl -maxdepth 1 -name "*.xml" -type f 2>/dev/null | wc -l | tr -d ' ')

    if [ "$XBRL_COUNT" -eq 0 ]; then
        echo "⚠️  No XML files found in xbrl/ directory"
    else
        echo "Processing $XBRL_COUNT XBRL files..."
        ./scripts/xbrl_eod.py --dir xbrl/
    fi
else
    echo "⚠️  xbrl_eod.py not found, skipping..."
fi

echo ""
echo "========================================================================"
echo "✅ Processing Complete!"
echo ""
echo "📊 Summary:"
echo "   - XML files found: $XML_COUNT"
echo "   - XBRL files processed: $XBRL_COUNT"
echo ""
echo "💡 Next steps:"
echo "   - Check Firebase Console for updated fundamentals"
echo "   - View data in your app"
echo "========================================================================"
