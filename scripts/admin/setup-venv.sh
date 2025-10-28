#!/bin/bash
# Setup Virtual Environment for Python Scripts

echo "🐍 Setting up Python Virtual Environment"
echo "========================================"

# Change to project root
cd "$(dirname "$0")/.."

# Check if venv already exists
if [ -d "venv" ]; then
    echo "✅ Virtual environment already exists at: $(pwd)/venv"
    echo ""
    echo "To reinstall dependencies:"
    echo "  source venv/bin/activate"
    echo "  pip install --upgrade jugaad-data duckdb pandas ta pytz firebase-admin"
    echo "  deactivate"
    exit 0
fi

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv venv
if [ $? -ne 0 ]; then
    echo "❌ Failed to create virtual environment"
    exit 1
fi
echo "✅ Virtual environment created"

# Activate virtual environment
echo ""
echo "🔧 Activating virtual environment..."
source venv/bin/activate
if [ $? -ne 0 ]; then
    echo "❌ Failed to activate virtual environment"
    exit 1
fi
echo "✅ Activated"

# Upgrade pip
echo ""
echo "📦 Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
echo "   - jugaad-data (NSE data)"
echo "   - duckdb (local database)"
echo "   - pandas (data processing)"
echo "   - ta (technical analysis)"
echo "   - pytz (timezone handling)"
echo "   - firebase-admin (Firebase SDK)"
echo ""

pip install jugaad-data duckdb pandas ta pytz firebase-admin

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    deactivate
    exit 1
fi

# Verify installations
echo ""
echo "✅ Dependencies installed successfully!"
echo ""
echo "📊 Installed packages:"
pip list | grep -E "(jugaad|duckdb|pandas|ta|pytz|firebase)"

# Deactivate
deactivate

echo ""
echo "========================================"
echo "✅ Setup completed!"
echo "========================================"
echo ""
echo "Virtual environment is ready at: $(pwd)/venv"
echo ""
echo "To use it:"
echo "  1. Activate: source venv/bin/activate"
echo "  2. Run scripts: python3 scripts/fetch-eod-data.py"
echo "  3. Deactivate: deactivate"
echo ""
echo "Or simply run the batch script (auto-activates venv):"
echo "  ./scripts/daily-eod-batch.sh"
echo ""
