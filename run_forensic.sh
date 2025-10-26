#!/bin/bash
# Forensic Analyzer Runner
# Usage: ./run_forensic.sh <symbol> [statement_type]
#
# Examples:
#   ./run_forensic.sh TCS
#   ./run_forensic.sh DIVISLAB consolidated
#   ./run_forensic.sh HDFCBANK standalone

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Change to project root (where this script is)
cd "$SCRIPT_DIR"

# Show current directory for debugging
echo "📂 Working directory: $(pwd)"
echo "🗄️  Database location: data/fundamentals.duckdb"
echo ""

# Run the forensic analyzer with all arguments passed through
./venv/bin/python3 scripts/forensics/forensic_analyzer.py "$@"
