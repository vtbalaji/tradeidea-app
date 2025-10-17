#!/bin/bash
# Weekly Fundamentals Batch Process
# Run once per week (e.g., every Sunday) to update fundamental data
#
# Cron Job Example (runs every Sunday at 8:00 AM IST):
# 0 8 * * 0 /path/to/myportfolio-web/scripts/weekly-fundamentals-batch.sh >> /path/to/myportfolio-web/logs/cron.log 2>&1

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
LOG_FILE="$LOG_DIR/fundamentals-batch-$TIMESTAMP.log"
ERROR_LOG="$LOG_DIR/fundamentals-batch-error.log"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "$LOG_FILE" | tee -a "$ERROR_LOG"
}

# Trap errors and log them
trap 'log_error "Script failed at line $LINENO with exit code $?"' ERR

log "🚀 Starting Weekly Fundamentals Batch Process"
log "=============================================="
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
    exit 1
fi

# Run Fundamentals Analysis
log "📊 Running Fundamentals Analysis..."
START_TIME=$(date +%s)
if $PYTHON scripts/analyze-fundamentals.py >> "$LOG_FILE" 2>&1; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    log "✅ Fundamentals analysis completed in ${DURATION}s"
else
    EXIT_CODE=$?
    log_error "Fundamentals analysis failed with exit code $EXIT_CODE"
    exit 1
fi

log ""
log "✅ Weekly Fundamentals Batch Process Completed!"
log "=============================================="

# Clean up old logs (keep last 12 weeks = ~3 months)
log "🧹 Cleaning up old log files..."
find "$LOG_DIR" -name "fundamentals-batch-*.log" -type f -mtime +84 -delete 2>/dev/null || true
log "Done cleaning up logs"

exit 0
