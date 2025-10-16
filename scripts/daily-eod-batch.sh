#!/bin/bash
# Daily EOD Batch Process
# Run after 4 PM IST for accurate EOD data
#
# Cron Job Example (runs at 4:15 PM IST daily):
# 15 16 * * * /path/to/myportfolio-web/scripts/daily-eod-batch.sh >> /path/to/myportfolio-web/logs/cron.log 2>&1

set -e  # Exit on error
set -o pipefail  # Catch errors in pipes

# Change to project root
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# Setup logging
LOG_DIR="$PROJECT_ROOT/logs"
mkdir -p "$LOG_DIR"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
LOG_FILE="$LOG_DIR/eod-batch-$TIMESTAMP.log"
ERROR_LOG="$LOG_DIR/eod-batch-error.log"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "$LOG_FILE" | tee -a "$ERROR_LOG"
}

# Trap errors and log them
trap 'log_error "Script failed at line $LINENO with exit code $?"' ERR

log "🚀 Starting Daily EOD Batch Process"
log "===================================="
log "Project Root: $PROJECT_ROOT"
log "Log File: $LOG_FILE"
log ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    log_error "Virtual environment not found!"
    log_error "Please run: ./scripts/setup-venv.sh"
    exit 1
fi

# Use explicit venv Python path (DO NOT use system python3)
PYTHON="./venv/bin/python3"
log "🐍 Using Python: $PYTHON"
PYTHON_VERSION=$($PYTHON --version 2>&1)
log "Python Version: $PYTHON_VERSION"
log ""

# Check for required files
if [ ! -f "serviceAccountKey.json" ]; then
    log_error "serviceAccountKey.json not found in project root"
    exit 1
fi

# 1. Fetch NSE EOD Data
log "📥 Step 1/4: Fetching NSE EOD Data..."
START_TIME=$(date +%s)
if $PYTHON scripts/fetch-eod-data.py >> "$LOG_FILE" 2>&1; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    log "✅ EOD fetch completed in ${DURATION}s"
else
    EXIT_CODE=$?
    log_error "EOD fetch failed with exit code $EXIT_CODE"
    exit 1
fi

# 2. Run Technical Analysis
log ""
log "📊 Step 2/4: Running Technical Analysis..."
START_TIME=$(date +%s)
if $PYTHON scripts/analyze-symbols-duckdb.py >> "$LOG_FILE" 2>&1; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    log "✅ Technical analysis completed in ${DURATION}s"
else
    EXIT_CODE=$?
    log_error "Technical analysis failed with exit code $EXIT_CODE"
    exit 1
fi

# 3. Run Screeners
log ""
log "🔍 Step 3/4: Running Screeners..."
START_TIME=$(date +%s)
if $PYTHON scripts/screeners.py >> "$LOG_FILE" 2>&1; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    log "✅ Screeners completed in ${DURATION}s"
else
    EXIT_CODE=$?
    log_error "Screeners failed with exit code $EXIT_CODE"
    exit 1
fi

# 4. Manage Portfolio Stop-Loss
log ""
log "🛡️  Step 4/4: Managing Portfolio Stop-Loss..."
START_TIME=$(date +%s)
if $PYTHON scripts/manage-portfolio-stoploss.py >> "$LOG_FILE" 2>&1; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    log "✅ Stop-loss management completed in ${DURATION}s"
else
    EXIT_CODE=$?
    log_error "Stop-loss management failed with exit code $EXIT_CODE"
    exit 1
fi

log ""
log "✅ Daily EOD Batch Process Completed!"
log "===================================="

# Clean up old logs (keep last 30 days)
log "🧹 Cleaning up old log files..."
find "$LOG_DIR" -name "eod-batch-*.log" -type f -mtime +30 -delete 2>/dev/null || true
log "Done cleaning up logs"

exit 0
