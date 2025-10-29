#!/bin/bash
# Quick script to process only recent XBRL files (standalone utility)
#
# Usage:
#   ./process_recent_xbrl_only.sh           # Last 2 hours
#   ./process_recent_xbrl_only.sh 24        # Last 24 hours
#   ./process_recent_xbrl_only.sh 168       # Last 7 days

HOURS=${1:-2}
MINUTES=$((HOURS * 60))

echo "🔍 Finding XBRL files modified in last $HOURS hours..."

# Find recent files
RECENT_FILES=$(find xbrl -name "*.xml" -type f -mmin -$MINUTES 2>/dev/null)
COUNT=$(echo "$RECENT_FILES" | wc -l | tr -d ' ')

if [ "$COUNT" -eq 0 ]; then
    echo "⚠️  No XBRL files modified in last $HOURS hours"
    exit 0
fi

echo "✅ Found $COUNT files"
echo ""
echo "📊 Processing..."

# Create temp directory with symlinks
TEMP_DIR="xbrl_recent_temp"
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

echo "$RECENT_FILES" | while IFS= read -r filepath; do
    if [ -n "$filepath" ]; then
        filename=$(basename "$filepath")
        ln -s "../$filepath" "$TEMP_DIR/$filename" 2>/dev/null
    fi
done

# Process
./venv/bin/python3 scripts/fundamental/xbrl_eod.py \
    --dir ./"$TEMP_DIR" \
    --prefer consolidated

# Cleanup
rm -rf "$TEMP_DIR"

echo ""
echo "✅ Done!"
