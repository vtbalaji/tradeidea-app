# NSE Financial Results Fetcher

## Overview

This script fetches quarterly and annual financial results from NSE India website for specified stock symbols. Files are downloaded to the `xbrl/` directory with standardized naming.

## File Naming Convention

Downloaded files follow this pattern:
```
SYMBOL_type_month_year.ext
```

Examples:
- `TCS_standalone_sep_2024.pdf`
- `TCS_consolidated_sep_2024.pdf`
- `RELIANCE_standalone_mar_2025.xml`

## Installation

### Basic Requirements
```bash
pip install requests
```

### For Web Scraping (if API doesn't work)
```bash
# Install Selenium
pip install selenium

# Install Chrome/Chromium browser (if not already installed)
# MacOS:
brew install --cask google-chrome

# Ubuntu/Debian:
sudo apt-get install chromium-browser chromium-chromedriver

# Or download from: https://www.google.com/chrome/
```

## Usage

### Single Symbol
```bash
./scripts/fetch_nse_financial_results.py TCS
```

### Multiple Symbols
```bash
./scripts/fetch_nse_financial_results.py TCS RELIANCE INFY
```

### Limit Results
Download only the 4 most recent results per symbol:
```bash
./scripts/fetch_nse_financial_results.py TCS --limit 4
```

### From File
Create a file with symbols (one per line):
```bash
cat > symbols.txt << EOF
TCS
RELIANCE
INFY
HDFCBANK
EOF

./scripts/fetch_nse_financial_results.py --file symbols.txt
```

### Force Selenium Mode
If the API is blocked, use Selenium:
```bash
./scripts/fetch_nse_financial_results.py TCS --selenium
```

## Troubleshooting

### NSE Blocks API Requests (403 Error)

NSE India has strong anti-scraping protections. If you see 403 errors, try:

1. **Use Selenium mode** (automatically falls back):
   ```bash
   ./scripts/fetch_nse_financial_results.py TCS --selenium
   ```

2. **Manual Download** (most reliable):
   - Visit: https://www.nseindia.com/get-quotes/equity?symbol=TCS
   - Click "Financial Results" tab
   - Download files manually to `xbrl/` folder
   - Rename following the convention: `TCS_standalone_sep_2024.pdf`

### Selenium Not Working

If Selenium fails, you may need to:

1. **Install chromedriver**:
   ```bash
   # MacOS
   brew install chromedriver

   # Ubuntu
   sudo apt-get install chromium-chromedriver
   ```

2. **Check Chrome/Chromium is installed**:
   ```bash
   google-chrome --version
   # or
   chromium-browser --version
   ```

## Alternative: BSE Website

BSE (Bombay Stock Exchange) is sometimes easier to scrape:

1. Visit: https://www.bseindia.com/
2. Search for company
3. Go to "Corporate Announcements" → "Financial Results"
4. Download files

## File Formats

NSE provides financial results in various formats:
- **PDF**: Human-readable format
- **XML/XBRL**: Machine-readable format (preferred for parsing)
- **HTML**: Web format
- **Excel**: Spreadsheet format

## Integration with Existing XBRL Pipeline

Once files are downloaded to `xbrl/`, you can process them using:

```bash
# Process single XBRL file
./scripts/xbrl_eod.py TCS xbrl/TCS_standalone_sep_2024.xml

# Process all XBRL files in directory
./scripts/xbrl_eod.py --dir xbrl/
```

## Extending to Multiple Symbols

Create a master list of symbols to track:

```bash
# Create symbols list from your portfolio
cat > xbrl_symbols.txt << EOF
TCS
RELIANCE
INFY
HDFCBANK
ICICIBANK
WIPRO
SBIN
BAJFINANCE
MARUTI
TATASTEEL
EOF

# Download all (with limit to avoid overload)
./scripts/fetch_nse_financial_results.py --file xbrl_symbols.txt --limit 4
```

## Automation

Add to your daily/weekly cron jobs:

```bash
# Add to crontab (edit with: crontab -e)
# Run every Monday at 9 AM
0 9 * * 1 cd /path/to/myportfolio-web && ./scripts/fetch_nse_financial_results.py --file xbrl_symbols.txt --limit 2

# Then process downloaded files
0 10 * * 1 cd /path/to/myportfolio-web && ./scripts/xbrl_eod.py --dir xbrl/
```

## Notes

- **Rate Limiting**: Script includes automatic delays between requests to be respectful to NSE servers
- **Duplicate Detection**: Files are not re-downloaded if they already exist
- **Quarter Detection**: Script automatically detects quarter and year from result descriptions
- **Type Detection**: Automatically identifies standalone vs consolidated results

## Support

If you encounter issues:
1. Check NSE website is accessible: https://www.nseindia.com/
2. Try manual download first to verify files are available
3. Use `--selenium` flag for JavaScript-rendered content
4. Consider using BSE as alternative data source
