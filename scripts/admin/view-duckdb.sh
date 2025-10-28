#!/bin/bash
# Quick DuckDB database viewer

DB_PATH="/Volumes/ssd-backup/git/SmartFarm/myportfolio-web/data/eod.duckdb"

echo "🦆 DuckDB Quick Viewer"
echo "====================="
echo ""

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
    echo "❌ Database not found at: $DB_PATH"
    exit 1
fi

# Interactive mode if no arguments
if [ $# -eq 0 ]; then
    echo "Opening DuckDB in interactive mode..."
    echo "Try these commands:"
    echo "  SHOW TABLES;"
    echo "  DESCRIBE ohlcv;"
    echo "  SELECT * FROM ohlcv LIMIT 5;"
    echo "  .exit to quit"
    echo ""
    duckdb "$DB_PATH" -readonly
else
    # Execute provided SQL query
    duckdb "$DB_PATH" -readonly -c "$1"
fi
