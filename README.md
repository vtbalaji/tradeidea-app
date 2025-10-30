# TradeIdea - Portfolio & Trading Ideas App

A Next.js trading ideas and portfolio management application with real-time technical analysis.

## Features

- 📊 Trading Ideas Hub with technical indicators
- 💼 Portfolio Management
- 📈 Real-time Technical Analysis (SMA, EMA, RSI, MACD, Bollinger Bands)
- 🔥 50 EMA/200 MA Crossover Detection
- ⭐ Golden Cross / Death Cross Signals
- 🔐 Firebase Authentication
- 💾 Firestore Database

## User Guide

### How to Read an Idea Card

Each idea card provides comprehensive information to help you make informed trading decisions:

#### Header Section
- **Symbol Name** (e.g., "HEG") - The stock ticker symbol
- **Industry/Sector** - Business category (e.g., "Electrical Equipment & Parts")
- **Status Badge** (Top-right corner):
  - 🟢 **Ready to Enter** (Green) - All conditions met for entry
  - 🟠 **You can Enter** (Orange) - Excellent fundamentals, price below entry
  - ⚪ **Waiting** (Gray) - Conditions not yet met

#### Tags Section
- **Risk Level** - #low risk, #medium risk, or #high risk
- **Timeframe** - #short term, #medium term, or #long term
- **Analysis Type** - #technical analysis, #fundamental analysis, etc.

#### Technical Levels Card
Shows real-time technical indicators with trend arrows (↑/↓):
- **Technical Signal** - STRONG_BUY, BUY, NEUTRAL, SELL, STRONG_SELL
- **50 EMA** - 50-day Exponential Moving Average
- **100 MA** - 100-day Simple Moving Average
- **200 MA** - 200-day Simple Moving Average
- **Supertrend** - Trend-following indicator
- **BB Middle** - Bollinger Bands middle line
- **RSI** - Relative Strength Index (14-period)
  - RSI > 70: Overbought
  - RSI < 30: Oversold
  - RSI 30-70: Normal range

**Trend Arrows**:
- ↑ Green arrow = Price is above the indicator (bullish)
- ↓ Red arrow = Price is below the indicator (bearish)

#### Fundamentals Card
Shows company financial health metrics:
- **Fundamental Rating** - EXCELLENT, GOOD, AVERAGE, POOR, WEAK
- **PE (Price-to-Earnings)** - Valuation metric (lower is generally better)
- **ROE (Return on Equity)** - Profitability measure (higher is better)
- **Debt-to-Equity** - Financial leverage (lower is generally safer)
- **Earnings Growth** - Year-over-year earnings growth percentage

#### Price Levels Section
Four key price points displayed in a grid:
- **LTP (Last Traded Price)** - Current market price (₹519.45)
- **Entry** - Recommended entry price (₹510)
- **Target** - Price target with expected gain % (₹585, +14.7%)
- **Stop Loss** - Risk management level (₹495)

#### Action Buttons
- **📊 Analysis** - View detailed technical and fundamental analysis with AI recommendation
- **➕ Add Position** - Enter this trade into your portfolio
- **✏️ Edit** - Modify idea details (if you're the creator)

#### Footer Section
- **Engagement Metrics**: Likes (❤️), Comments (💬), and Post Date (📅)
- **Creator Info**: Posted by username with avatar

### Understanding Idea Card Badges

Each idea card displays a badge in the top-right corner indicating its entry readiness:

- **🟢 Ready to Enter** (Green) - All conditions met:
  - Technical signal is BUY or STRONG_BUY
  - Current price (LTP) is within 2% of entry price
  - Fundamental rating is AVERAGE or better

- **🟠 You can Enter** (Orange) - Excellent opportunity:
  - Current price (LTP) is below entry price (buying at discount)
  - Fundamental rating is EXCELLENT
  - Technical signal can be any (prioritizes fundamentals)

- **⚪ Waiting** (Gray) - Conditions not yet met:
  - Wait for better technical/fundamental alignment
  - Or price to reach optimal entry zone

### How to Enter a Position from an Idea Card

1. **Browse Ideas Hub** (`/ideas` page)
   - Review idea cards with technical and fundamental data
   - Look for "Ready to Enter" or "You can Enter" badges

2. **Click "Add Position" button** on the desired idea card
   - A modal will open with pre-filled entry price

3. **Fill in Trade Details**:
   - **Quantity**: Number of shares to buy
   - **Entry Price Taken**: Price at which you're entering (can modify)
   - **Date Taken**: Date of entry (defaults to today)

4. **Set Exit Strategy** (Optional but recommended):
   - ✅ Exit at Stop Loss (default: on)
   - ✅ Exit at Target (default: on)
   - Exit if price goes below 50 EMA
   - Exit if price goes below 100 MA
   - Exit if price goes below 200 MA
   - Exit based on Weekly Supertrend
   - Add custom exit notes

5. **Click "Add to Portfolio"**
   - Position will be added to your portfolio
   - You'll be redirected to Portfolio page

### Analyzing Ideas

Click the **"Analyze"** button or click anywhere on an idea card to view:
- Detailed technical analysis
- Fundamental metrics
- AI-powered recommendation
- Risk assessment
- Entry/Exit suggestions

**Note**: Analysis requires both technical and fundamental data to be available.

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.11+
- Firebase Account

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create Python virtual environment:

```bash
python3 -m venv venv
source venv/bin/activate
pip install yfinance pandas numpy ta firebase-admin
```

4. Set up Firebase:
   - Download `serviceAccountKey.json` from Firebase Console
   - Place it in project root
   - Create `.env.local` with Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Batch Jobs

The project includes two comprehensive batch processes that run automatically to keep your stock data fresh:

---

### 1. Daily EOD Batch (OHLC & Technical Analysis)

**Purpose**: Updates End-of-Day (EOD) OHLC price data and calculates technical indicators

**Location**: `scripts/batch/daily-eod-batch.sh`

**Frequency**: Daily (after market close at 4:15 PM IST)

### Running the Daily EOD Batch

**Quick Start:**

```bash
./scripts/batch/daily-eod-batch.sh
```

### What the Daily EOD Batch Does (10 Steps)

1. **Fetches NSE EOD Data** (OHLC prices from Yahoo Finance)
   - Downloads latest End-of-Day data for all tracked symbols
   - Stores in DuckDB for fast analysis

2. **Fetches Nifty 50 Index Data**
   - Benchmark index data for market context

3. **Runs Technical Analysis**
   - Moving Averages: SMA20, SMA50, SMA100, SMA200, EMA9, EMA21, EMA50
   - Oscillators: RSI14
   - Volatility: Bollinger Bands (20, 2σ), ATR
   - Trend: MACD (12, 26, 9), Supertrend
   - Volume: 20-day average, volume spikes

4. **Runs Stock Screeners**
   - Golden Cross / Death Cross detection
   - 50 EMA/200 MA Crossover
   - RSI Oversold/Overbought
   - Breakout patterns
   - High growth stocks

5. **Cleans up old Firebase data** (removes stale records)

6. **Generates Chart Data**
   - Pre-computes candlestick chart data for top 500 stocks
   - Stores in Firebase for fast UI loading

7. **Manages Portfolio Stop-Loss**
   - Checks if any positions hit stop-loss levels
   - Creates alerts for triggered stop-losses

8. **Generates Trading Alerts**
   - Entry/Exit signal notifications
   - Technical indicator alerts

9. **Expires Old Trading Ideas**
   - Marks expired ideas based on timeframe

10. **Checks Idea Entry/Exit Triggers**
    - Monitors trading ideas for trigger conditions
    - Sends notifications when conditions are met

### Output Saved To:

- **Firebase Collections**: `technicals`, `chart_data`, `portfolio`, `alerts`
- **DuckDB**: `data/market_data.duckdb` (OHLC data)
- **Logs**: `logs/eod-batch-YYYYMMDD_HHMMSS.log`

### Scheduling Daily EOD Batch

Run daily after market close using cron:

```bash
# Edit crontab
crontab -e

# Add daily run at 4:15 PM IST (after market close)
15 16 * * * cd /path/to/myportfolio-web && ./scripts/batch/daily-eod-batch.sh >> logs/cron.log 2>&1
```

---

### 2. Weekly Fundamentals Batch (Fundamental Analysis)

**Purpose**: Updates fundamental data (PE, ROE, PEG ratio, financial health, etc.) and stores to Firebase for UI

**Location**: `fundamentals_batch.sh` (root) OR `scripts/batch/weekly-fundamentals-batch.sh`

**Frequency**: Weekly (Sunday mornings)

### Running the Fundamentals Batch

**Quick Start:**

```bash
# From project root
./fundamentals_batch.sh

# OR from scripts/batch
./scripts/batch/weekly-fundamentals-batch.sh
```

**Single Stock:**

```bash
source venv/bin/activate && python3 scripts/analysis/analyze-fundamentals.py HDFCBANK
```

### What the Fundamentals Batch Does

1. **Fetches fundamental data from Yahoo Finance** for all symbols in Firestore

2. **Collects comprehensive metrics**:
   - **Valuation**: PE Ratio, Forward PE, **PEG Ratio (3-year CAGR)**, Price-to-Book, Price-to-Sales, Graham Number
   - **Financial Health**: Debt-to-Equity, Current Ratio, Quick Ratio
   - **Profitability**: ROE, ROA, Profit Margins, Operating Margins
   - **Growth**: Earnings Growth, Revenue Growth, Quarterly Growth, 3-Year CAGR
   - **Dividends**: Dividend Yield, Payout Ratio
   - **Market Data**: Market Cap, Enterprise Value, Beta, Sector, Industry
   - **Quality Score**: **Piotroski F-Score (0-9)**

3. **Calculates PEG Ratio using hybrid approach**:
   - 70% weight on 3-year historical CAGR (conservative, audited data)
   - 30% weight on forward estimates (growth momentum)
   - Uses `peg_calculator.py` with Yahoo Finance annual income statements
   - **Does NOT rely on limited XBRL data**

4. **Calculates Piotroski F-Score**:
   - 9-point quality score based on profitability, leverage, and efficiency
   - Helps identify financially healthy companies

5. **Calculates Fundamental Score** (0-100):
   - Analyzes all metrics holistically
   - Assigns rating: EXCELLENT, GOOD, AVERAGE, POOR, WEAK

6. **Saves to Firebase AND DuckDB**:
   - **Firebase**: `fundamentals` collection (for UI)
   - **DuckDB**: `data/fundamentals.duckdb` (for analysis)
   - Embeds fundamental data in `ideas` and `portfolio` documents

### Output Example

```
[1/5] Processing HDFCBANK...
  📥 Fetching fundamentals for HDFCBANK...
  📊 Calculating PEG Ratio...
  ✅ PEG Ratio: 1.85 (3Y CAGR: 18.5%)
  📊 Calculating Piotroski F-Score...
  ✅ Piotroski F-Score: 7/9
  ✅ Fetched fundamentals
  💾 Saving to Firestore...
  💾 Saving to DuckDB...
  ✅ HDFCBANK - GOOD (Score: 72.5)
     PE: 24.50 | PEG: 1.85 | ROE: 14.2% | D/E: 0.45 | Piotroski: 7/9
```

### Scheduling Fundamentals Batch

Run weekly (e.g., every Sunday) using cron:

```bash
# Edit crontab
crontab -e

# Add weekly run every Sunday at 10 AM IST
0 10 * * 0 cd /path/to/myportfolio-web && ./fundamentals_batch.sh >> logs/fundamentals.log 2>&1
```

### Additional Fundamental Scripts

**Fetch recent XBRL results from NSE (optional)**:

```bash
./scripts/batch/weekly-fundamentals-fetch.sh
```

This downloads and processes XBRL files for companies with recent quarterly results. However, the main `analyze-fundamentals.py` uses Yahoo Finance data, which is more comprehensive.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── ideas/             # Trading ideas pages
│   ├── portfolio/         # Portfolio pages
│   └── profile/           # User profile
├── components/            # React components
├── contexts/              # React contexts (Auth, Trading)
├── lib/                   # Utilities and Firebase config
├── scripts/               # Python scripts
│   ├── batch/             # Batch job runners
│   │   ├── daily-eod-batch.sh            # Daily EOD & technical analysis
│   │   ├── weekly-fundamentals-batch.sh  # Weekly fundamentals
│   │   └── weekly-fundamentals-fetch.sh  # XBRL download & processing
│   ├── technical/         # Technical analysis scripts
│   │   ├── fetch-eod-data.py             # Fetch OHLC from Yahoo
│   │   ├── analyze-symbols-duckdb.py     # Calculate indicators
│   │   ├── generate-chart-data.py        # Pre-compute chart data
│   │   └── yahoo_fundamentals_fetcher.py # Yahoo to DuckDB
│   ├── analysis/          # Analysis scripts
│   │   ├── analyze-fundamentals.py       # Fundamentals → Firebase
│   │   ├── peg_calculator.py             # PEG ratio calculation
│   │   └── screeners.py                  # Stock screeners
│   ├── portfolio/         # Portfolio management
│   │   ├── manage-portfolio-stoploss.py
│   │   ├── check-and-generate-alerts.py
│   │   ├── expire-ideas.py
│   │   └── check-idea-triggers.py
│   └── fundamental/       # Fundamental data scripts
│       ├── xbrl_parser_v3.py             # Parse XBRL files
│       ├── fundamental_xbrl_storage.py   # Store to DuckDB
│       └── yahoo_xbrl_enricher.py        # Combine Yahoo + XBRL
├── data/                  # DuckDB databases
│   ├── market_data.duckdb      # OHLC data
│   └── fundamentals.duckdb     # Fundamental data
├── venv/                  # Python virtual environment
├── fundamentals_batch.sh  # Weekly fundamentals runner (root)
└── serviceAccountKey.json # Firebase admin credentials (gitignored)
```

## Firebase Collections

### Analysis Data
- **technicals**: Technical analysis data (OHLC, indicators, signals) - one doc per symbol
- **fundamentals**: Fundamental analysis data (PE, PEG, ROE, Piotroski, etc.) - one doc per symbol
- **chart_data**: Pre-computed candlestick chart data for fast UI loading

### Trading & Portfolio
- **ideas**: User trading ideas
- **tradingIdeas**: Trading ideas collection
- **portfolio**: User portfolio positions
- **portfolios**: Alternative portfolio storage
- **alerts**: Stop-loss alerts, entry/exit triggers

### Master Data
- **symbols**: NSE symbol master list (2,147+ symbols)
- **users**: User profiles
- **comments**: Idea comments

### Data Flow
- Daily EOD Batch → Updates `technicals`, `chart_data`, `alerts`
- Weekly Fundamentals Batch → Updates `fundamentals`
- Both batches embed data into `ideas` and `portfolio` documents for fast access

## Quick Reference

### Daily Operations

```bash
# Run EOD batch (OHLC + Technical Analysis) - after market close
./scripts/batch/daily-eod-batch.sh

# Start dev server
npm run dev
# or on specific port
PORT=3001 npm run dev
```

### Weekly Operations

```bash
# Run fundamentals analysis (Sunday mornings)
./fundamentals_batch.sh

# Single stock fundamental analysis
source venv/bin/activate && python3 scripts/analysis/analyze-fundamentals.py HDFCBANK

# Optional: Fetch recent XBRL results from NSE
./scripts/batch/weekly-fundamentals-fetch.sh
```

### Cron Schedule (Recommended)

```bash
# Daily EOD at 4:15 PM IST (after market close at 3:30 PM + data availability buffer)
15 16 * * * cd /path/to/myportfolio-web && ./scripts/batch/daily-eod-batch.sh >> logs/cron.log 2>&1

# Weekly fundamentals every Sunday at 10 AM IST
0 10 * * 0 cd /path/to/myportfolio-web && ./fundamentals_batch.sh >> logs/fundamentals.log 2>&1
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Yahoo Finance API](https://pypi.org/project/yfinance/)
- [Technical Analysis Library](https://github.com/bukosabino/ta)

## Deploy on Vercel

Deploy the Next.js app on [Vercel](https://vercel.com/new).

See [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for details.
