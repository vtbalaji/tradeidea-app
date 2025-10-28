# Technical Analysis Scripts

Scripts for fetching EOD (End-of-Day) data, calculating technical indicators, and generating chart data for the UI.

## 📋 Scripts Overview

### 1. `fetch-eod-data.py`
**Purpose:** Fetch daily price/volume data for all symbols

**What it does:**
- Fetches OHLCV (Open, High, Low, Close, Volume) data from Yahoo Finance
- Stores in DuckDB (`data/eod.duckdb`)
- Handles missing data and errors gracefully
- Supports bulk fetching for all NSE symbols

**Usage:**
```bash
# Fetch for single symbol
python scripts/technical/fetch-eod-data.py --symbol TCS

# Fetch for multiple symbols
python scripts/technical/fetch-eod-data.py --symbols TCS INFY WIPRO

# Fetch for all symbols (from database)
python scripts/technical/fetch-eod-data.py --all

# Fetch with date range
python scripts/technical/fetch-eod-data.py --symbol TCS --start 2024-01-01 --end 2024-12-31
```

**Output:**
- Database: `data/eod.duckdb`
- Table: `ohlcv`
- Columns: `symbol, date, open, high, low, close, volume`

---

### 2. `analyze-symbols-duckdb.py`
**Purpose:** Calculate technical indicators from EOD data

**What it does:**
- Reads OHLCV data from DuckDB
- Calculates technical indicators:
  - **Moving Averages:** SMA(20, 50, 200), EMA(12, 26)
  - **Momentum:** RSI(14), MACD, Stochastic
  - **Volatility:** Bollinger Bands, ATR
  - **Volume:** Volume SMA, OBV
- Stores results in database and Firebase (for UI)
- Generates buy/sell signals

**Usage:**
```bash
# Analyze single symbol
python scripts/technical/analyze-symbols-duckdb.py --symbol TCS

# Analyze all symbols
python scripts/technical/analyze-symbols-duckdb.py --all

# Analyze with custom indicators
python scripts/technical/analyze-symbols-duckdb.py --symbol TCS --indicators RSI,MACD,BB
```

**Output:**
- Firebase: `symbols/{symbol}/technical`
- Includes: RSI, MACD, Moving Averages, Signals

**Example output structure:**
```json
{
  "technical": {
    "rsi": 65.3,
    "macd": {
      "value": 12.5,
      "signal": 10.2,
      "histogram": 2.3
    },
    "sma20": 1500.50,
    "sma50": 1450.30,
    "sma200": 1400.00,
    "signal": "BUY",
    "lastUpdated": "2025-10-28"
  }
}
```

---

### 3. `generate-chart-data.py`
**Purpose:** Generate chart-ready data for UI

**What it does:**
- Reads EOD data from DuckDB
- Formats data for charting libraries (Chart.js, Recharts)
- Generates different timeframes (1D, 1W, 1M, 3M, 6M, 1Y, 5Y)
- Compresses data for faster loading
- Stores in Firebase or file system for UI

**Usage:**
```bash
# Generate for single symbol
python scripts/technical/generate-chart-data.py --symbol TCS

# Generate for top 50 symbols (priority)
python scripts/technical/generate-chart-data.py --top50

# Generate all timeframes
python scripts/technical/generate-chart-data.py --symbol TCS --timeframes 1D,1W,1M,3M,6M,1Y,5Y

# Force regenerate (ignore cache)
python scripts/technical/generate-chart-data.py --symbol TCS --force
```

**Output:**
- Location: `public/chart-data/{symbol}.json` (for deployment)
- Or Firebase: `chartData/{symbol}`

**Example output:**
```json
{
  "symbol": "TCS",
  "timeframes": {
    "1Y": [
      {"date": "2024-01-01", "close": 3500, "volume": 1000000},
      {"date": "2024-01-02", "close": 3520, "volume": 1200000}
    ]
  }
}
```

---

### 4. `yahoo_fundamentals_fetcher.py`
**Purpose:** Fetch fundamental data from Yahoo Finance for UI

**What it does:**
- Fetches real-time fundamental data:
  - Current price, market cap
  - PE, PB ratios
  - Dividend yield
  - 52-week high/low
- Complements XBRL data with real-time values
- Used for quick UI updates (daily refresh)

**Usage:**
```bash
# Fetch for single symbol
python scripts/technical/yahoo_fundamentals_fetcher.py --symbol TCS

# Fetch for multiple symbols
python scripts/technical/yahoo_fundamentals_fetcher.py --symbols TCS INFY WIPRO

# Update Firebase with latest data
python scripts/technical/yahoo_fundamentals_fetcher.py --all --update-firebase
```

**Output:**
- Firebase: `symbols/{symbol}/yahoo_data`
- Includes: Current price, PE, PB, Market Cap, 52W High/Low

**Why both Yahoo and XBRL?**
- **Yahoo:** Real-time, quick, for UI display
- **XBRL:** Accurate, audited, for analysis and reports
- **Best practice:** Show Yahoo data with "updated: X mins ago", XBRL data for detailed analysis

---

### 5. `fetch-nifty50-index.py`
**Purpose:** Fetch Nifty 50 index data

**What it does:**
- Fetches Nifty 50 index OHLCV data
- Tracks index performance
- Used for market sentiment analysis
- Compares stock performance vs index

**Usage:**
```bash
# Fetch latest Nifty 50 data
python scripts/technical/fetch-nifty50-index.py

# Fetch with date range
python scripts/technical/fetch-nifty50-index.py --start 2024-01-01 --end 2024-12-31
```

**Output:**
- Database: `data/eod.duckdb`
- Table: `ohlcv`
- Symbol: `^NSEI` (Nifty 50)

---

## 🔄 Typical Workflow

### Daily EOD Processing:
```bash
# 1. Fetch EOD data (after market close)
python scripts/technical/fetch-eod-data.py --all

# 2. Calculate technical indicators
python scripts/technical/analyze-symbols-duckdb.py --all

# 3. Generate chart data for top stocks
python scripts/technical/generate-chart-data.py --top50

# 4. Update Yahoo data for UI
python scripts/technical/yahoo_fundamentals_fetcher.py --all --update-firebase

# 5. Fetch index data
python scripts/technical/fetch-nifty50-index.py
```

### Quick Symbol Update:
```bash
# Update single symbol completely
python scripts/technical/fetch-eod-data.py --symbol TCS && \
python scripts/technical/analyze-symbols-duckdb.py --symbol TCS && \
python scripts/technical/generate-chart-data.py --symbol TCS
```

---

## 📊 Data Flow

```
Yahoo Finance API
      ↓
fetch-eod-data.py → DuckDB (ohlcv table)
      ↓
analyze-symbols-duckdb.py → Firebase (technical indicators)
      ↓
generate-chart-data.py → public/chart-data/ (for UI)
```

---

## ⚙️ Configuration

### Environment Variables:
```bash
# Database paths
export EOD_DB="data/eod.duckdb"

# Firebase credentials (for UI updates)
export GOOGLE_APPLICATION_CREDENTIALS="serviceAccountKey.json"

# Yahoo Finance settings
export YAHOO_RATE_LIMIT=2000  # requests per hour
```

### Dependencies:
```
yfinance
pandas
numpy
duckdb
firebase-admin
ta-lib (optional, for advanced indicators)
```

---

## 🐛 Troubleshooting

**"Too many requests" error from Yahoo:**
- Add delays between requests
- Use rate limiting
- Consider premium data provider for production

**Missing data for symbol:**
- Verify symbol exists on Yahoo Finance (add `.NS` suffix)
- Check for delisted stocks
- Validate date range

**Technical indicators NaN:**
- Need sufficient historical data (at least 200 days for SMA200)
- Check for gaps in price data

---

## 📈 Technical Indicators Reference

| Indicator | Purpose | Interpretation |
|-----------|---------|----------------|
| **RSI(14)** | Momentum | <30: Oversold, >70: Overbought |
| **MACD** | Trend | Crossover: Buy/Sell signal |
| **SMA(20,50,200)** | Trend | Golden cross: Bullish, Death cross: Bearish |
| **Bollinger Bands** | Volatility | Price near upper: Overbought, lower: Oversold |
| **Volume** | Confirmation | High volume confirms trend |

---

## 🔗 Related Folders

- `scripts/batch/` - Batch scripts that call these
- `scripts/fundamental/` - XBRL-based fundamental analysis
- `scripts/analysis/` - Advanced analysis using technical data

---

**Last Updated:** October 28, 2025
