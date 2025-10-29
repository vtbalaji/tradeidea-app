#!/bin/bash
# Weekly Fundamentals Fetch - Download & Parse Recent Results
# Run weekly to get latest quarterly results
#
# This script:
# 1. Gets list of companies with recent financial results
# 2. Downloads XBRL files for those companies
# 3. Parses and stores in DuckDB
#
# Cron Job Example (runs every Sunday at 8:00 AM):
# 0 8 * * 0 /path/to/myportfolio-web/scripts/batch/weekly-fundamentals-fetch.sh >> /path/to/logs/cron.log 2>&1

set -e  # Exit on error
set -o pipefail  # Catch errors in pipes

# Change to project root (script is in scripts/batch/, need to go up 2 levels)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

# Setup logging
LOG_DIR="$PROJECT_ROOT/logs"
mkdir -p "$LOG_DIR"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
LOG_FILE="$LOG_DIR/weekly-fundamentals-$TIMESTAMP.log"
ERROR_LOG="$LOG_DIR/weekly-fundamentals-error.log"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "$LOG_FILE" | tee -a "$ERROR_LOG"
}

# Trap errors and log them
trap 'log_error "Script failed at line $LINENO with exit code $?"' ERR

log "🚀 Starting Weekly Fundamentals Fetch"
log "======================================"
log "Project Root: $PROJECT_ROOT"
log "Log File: $LOG_FILE"
log ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    log_error "Virtual environment not found!"
    log_error "Please run: ./scripts/setup-venv.sh"
    exit 1
fi

# Use explicit venv Python path
PYTHON="./venv/bin/python3"
log "🐍 Using Python: $PYTHON"
PYTHON_VERSION=$($PYTHON --version 2>&1)
log "Python Version: $PYTHON_VERSION"
log ""

# Check for required files
if [ ! -f "serviceAccountKey.json" ]; then
    log_error "serviceAccountKey.json not found in project root"
    log_error "Note: This is optional for getting top companies list"
fi

# Step 1: Get list of symbols with recent results
log "📋 Step 1/3: Getting symbols with recent results..."
log "--------------------------------------------------------"
SYMBOLS_FILE="symbols_this_week.txt"
START_TIME=$(date +%s)

# Try to get recent results from NSE
# Fallback to top 100 companies if NSE API fails
if $PYTHON scripts/fundamental/get_recent_results_symbols.py \
    --days 7 \
    --output "$SYMBOLS_FILE" \
    --strategy auto \
    --limit 100 \
    >> "$LOG_FILE" 2>&1; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    log "✅ Symbol list generated in ${DURATION}s"
else
    EXIT_CODE=$?
    log_error "Failed to generate symbols list (exit code: $EXIT_CODE)"
    log_error "Falling back to static list..."

    # Fallback: generate static list
    $PYTHON scripts/fundamental/get_recent_results_symbols.py \
        --strategy static \
        --output "$SYMBOLS_FILE" \
        >> "$LOG_FILE" 2>&1 || {
        log_error "All strategies failed"
        exit 1
    }
fi

if [ ! -f "$SYMBOLS_FILE" ]; then
    log_error "Symbols file not created: $SYMBOLS_FILE"
    exit 1
fi

SYMBOL_COUNT=$(wc -l < "$SYMBOLS_FILE" | tr -d ' ')
log "✅ Found $SYMBOL_COUNT symbols to process"
log ""

# Step 2: Download XBRL files for those symbols
log "📥 Step 2/3: Downloading XBRL files..."
log "--------------------------------------------------------"
START_TIME=$(date +%s)

if $PYTHON scripts/fundamental/fetch_nse_financial_results.py \
    --file "$SYMBOLS_FILE" \
    --limit 4 \
    --source api \
    >> "$LOG_FILE" 2>&1; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    log "✅ Download completed in ${DURATION}s"
else
    EXIT_CODE=$?
    log_error "Download failed with exit code $EXIT_CODE"
    log "⚠️  Continuing with existing files..."
fi

log ""

# Step 3: Process downloaded XBRL files (OPTIMIZED - only recent files)
log "📊 Step 3/3: Processing XBRL files..."
log "--------------------------------------------------------"
START_TIME=$(date +%s)

# Check if xbrl directory exists
if [ ! -d "xbrl" ]; then
    log_error "xbrl directory not found"
    log_error "No XBRL files to process"
    exit 1
fi

# OPTIMIZATION: Only process recently modified files (last 2 hours)
# This avoids scanning all 18,000+ files every time
log "Finding recently modified XBRL files (last 2 hours)..."
RECENT_FILES_LIST="recent_xbrl_files.txt"
find xbrl -name "*.xml" -type f -mmin -120 > "$RECENT_FILES_LIST" 2>/dev/null

RECENT_FILE_COUNT=$(wc -l < "$RECENT_FILES_LIST" 2>/dev/null | tr -d ' ')
log "Found $RECENT_FILE_COUNT recently modified files (vs $(find xbrl -name "*.xml" -type f 2>/dev/null | wc -l | tr -d ' ') total)"

if [ "$RECENT_FILE_COUNT" -eq 0 ]; then
    log "⚠️  No recent XBRL files to process"
    log "💡 If you expect files, they may have been downloaded more than 2 hours ago"
    log "💡 To process all files: ./venv/bin/python3 scripts/fundamental/xbrl_eod.py --dir ./xbrl"
else
    # Process recent files using batch mode (much faster than one-by-one)
    log "Processing $RECENT_FILE_COUNT files using batch mode..."

    # Create temporary directory with only recent files (symbolic links)
    TEMP_DIR="xbrl_recent_temp"
    rm -rf "$TEMP_DIR"
    mkdir -p "$TEMP_DIR"

    while IFS= read -r filepath; do
        filename=$(basename "$filepath")
        ln -s "../$filepath" "$TEMP_DIR/$filename" 2>/dev/null
    done < "$RECENT_FILES_LIST"

    # Process temporary directory
    if $PYTHON scripts/fundamental/xbrl_eod.py \
        --dir ./"$TEMP_DIR" \
        --prefer consolidated \
        >> "$LOG_FILE" 2>&1; then
        END_TIME=$(date +%s)
        DURATION=$((END_TIME - START_TIME))
        log "✅ Processing completed in ${DURATION}s"
    else
        EXIT_CODE=$?
        log_error "Processing failed with exit code $EXIT_CODE"
        log "⚠️  Some files may have been processed successfully"
    fi

    # Cleanup
    rm -rf "$TEMP_DIR"
    rm -f "$RECENT_FILES_LIST"

    XBRL_FILE_COUNT=$RECENT_FILE_COUNT
fi

log ""

# Summary
log "✅ Weekly Fundamentals Fetch Complete!"
log "======================================"
log "📋 Symbols processed: $SYMBOL_COUNT"
log "📁 XBRL files found: $XBRL_FILE_COUNT"
log "📁 Log file: $LOG_FILE"
log "📁 Symbols list: $SYMBOLS_FILE"
log ""

# Show database stats
if [ -f "data/fundamentals.duckdb" ]; then
    log "📊 Database Statistics:"
    if command -v duckdb &> /dev/null; then
        duckdb data/fundamentals.duckdb "
            SELECT
                COUNT(DISTINCT symbol) as unique_symbols,
                COUNT(*) as total_records,
                MAX(end_date) as latest_date
            FROM xbrl_data
        " 2>/dev/null >> "$LOG_FILE" || log "   (DuckDB CLI not available for stats)"
    else
        log "   (DuckDB CLI not installed)"
    fi
fi

log ""
log "💡 Next steps:"
log "   - View data: duckdb data/fundamentals.duckdb"
log "   - Query: SELECT * FROM xbrl_data WHERE symbol='TCS' ORDER BY end_date DESC LIMIT 5"
log "   - Check errors: tail -f $ERROR_LOG"
log ""

# Clean up old logs (keep last 30 days)
log "🧹 Cleaning up old log files..."
find "$LOG_DIR" -name "weekly-fundamentals-*.log" -type f -mtime +30 -delete 2>/dev/null || true
log "Done cleaning up logs"

exit 0
