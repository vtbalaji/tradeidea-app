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

The project includes two Python batch jobs for comprehensive stock analysis:

### 1. Technical Analysis Batch Job (Daily)

Fetches EOD (End of Day) data from Yahoo Finance and calculates technical indicators.

### Running the Batch Job

**Quick Start (Recommended)**

```bash
./eod_batch.sh
```

**Manual Method**

```bash
# Activate Python virtual environment and run batch
source venv/bin/activate && python3 scripts/analyze-symbols.py
```

### What the Batch Job Does

1. **Fetches symbols** from Firestore collections:
   - `ideas`
   - `tradingIdeas`
   - `portfolio`
   - `portfolios`

2. **Downloads 365 days** of historical data from Yahoo Finance (NSE)

3. **Calculates technical indicators**:
   - Moving Averages: SMA20, SMA50, SMA200, EMA9, EMA21, EMA50
   - Oscillators: RSI14
   - Volatility: Bollinger Bands (20, 2σ)
   - Trend: MACD (12, 26, 9)
   - Volume: 20-day average

4. **Detects signals**:
   - Price vs SMA200 (above/below)
   - Price vs EMA50 (above/below)
   - **50 EMA/200 MA Crossover** (new!)
   - Golden Cross (SMA50 > SMA200)
   - Death Cross (SMA50 < SMA200)
   - RSI Overbought/Oversold
   - MACD Bullish/Bearish
   - Volume Spikes

5. **Saves results** to Firebase:
   - `technicals` collection (one document per symbol)
   - Embeds `technicals` object in matching idea/portfolio documents

### Output Example

```
[1/5] Processing RELIANCE...
  📥 Fetching data for RELIANCE...
  ✅ Fetched 251 rows
  📈 Calculating indicators...
  💾 Saving to Firestore...
  ✅ RELIANCE - BUY
     Price: ₹1375.00 (+0.85%)
     RSI: 46.0 | SMA200: ₹1340.11 | EMA50: ₹1390.59
     🔥 50 EMA/200 MA CROSSOVER!
     ⭐ GOLDEN CROSS!
```

### Scheduling Technical Analysis

Run daily after market close using cron:

```bash
# Edit crontab
crontab -e

# Add daily run at 6 PM IST (after market close)
0 18 * * * cd /path/to/project && ./eod_batch.sh >> logs/technical.log 2>&1
```

---

### 2. Fundamentals Analysis Batch Job (Weekly)

Fetches fundamental data from Yahoo Finance for long-term investment analysis.

### Running the Fundamentals Batch

**Quick Start (Recommended)**

```bash
./fundamentals_batch.sh
```

**Manual Method**

```bash
source venv/bin/activate && python3 scripts/analyze-fundamentals.py
```

### What the Fundamentals Batch Does

1. **Fetches fundamental data** for all symbols in Firestore

2. **Collects key metrics**:
   - **Valuation**: PE Ratio, Forward PE, PEG Ratio, Price-to-Book, Price-to-Sales
   - **Financial Health**: Debt-to-Equity, Current Ratio, Quick Ratio
   - **Profitability**: ROE, ROA, Profit Margins, Operating Margins
   - **Growth**: Earnings Growth, Revenue Growth, Quarterly Growth
   - **Dividends**: Dividend Yield, Payout Ratio
   - **Market Data**: Market Cap, Enterprise Value, Beta

3. **Calculates Fundamental Score** (0-100):
   - Analyzes PE, PEG, ROE, D/E, margins, growth rates
   - Assigns rating: EXCELLENT, GOOD, AVERAGE, POOR, WEAK

4. **Saves to Firebase**:
   - `fundamentals` collection (one document per symbol)
   - Embeds in idea/portfolio documents

### Output Example

```
[1/5] Processing RELIANCE...
  📥 Fetching fundamentals for RELIANCE...
  ✅ Fetched fundamentals
  💾 Saving to Firestore...
  ✅ RELIANCE - GOOD (Score: 72.5)
     PE: 24.50 | PEG: 1.85 | ROE: 14.2% | D/E: 45.3
```

### Scheduling Fundamentals Analysis

Run weekly (e.g., every Sunday) using cron:

```bash
# Edit crontab
crontab -e

# Add weekly run every Sunday at 10 AM
0 10 * * 0 cd /path/to/project && ./fundamentals_batch.sh >> logs/fundamentals.log 2>&1
```

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── ideas/             # Trading ideas pages
│   ├── portfolio/         # Portfolio pages
│   └── profile/           # User profile
├── components/            # React components
├── contexts/              # React contexts (Auth, Trading)
├── lib/                   # Utilities and Firebase config
├── scripts/               # Batch jobs
│   ├── analyze-symbols.py         # Daily technical analysis (Python)
│   ├── analyze-fundamentals.py   # Weekly fundamentals analysis (Python)
│   ├── analyze-symbols.ts         # TypeScript version (has DuckDB issues)
│   └── load-symbols-from-csv.ts   # Load NSE symbols
├── venv/                  # Python virtual environment
├── eod_batch.sh           # Daily technical analysis runner
├── fundamentals_batch.sh  # Weekly fundamentals analysis runner
└── serviceAccountKey.json # Firebase admin credentials (gitignored)
```

## Firebase Collections

- **technicals**: Technical analysis data (one doc per symbol)
- **fundamentals**: Fundamental analysis data (one doc per symbol)
- **ideas**: User trading ideas
- **tradingIdeas**: Trading ideas
- **portfolio**: User portfolio positions
- **portfolios**: Alternative portfolio storage
- **symbols**: NSE symbol master list (2,147 symbols)
- **users**: User profiles
- **comments**: Idea comments

## Quick Reference

### Daily Operations

```bash
# Run technical analysis (after market close)
./eod_batch.sh

# Start dev server
npm run dev
# or on specific port
PORT=3001 npm run dev
```

### Weekly Operations

```bash
# Run fundamentals analysis (Sunday mornings)
./fundamentals_batch.sh
```

### Cron Schedule (Recommended)

```bash
# Daily technical at 6 PM IST (after market close)
0 18 * * * cd /path/to/project && ./eod_batch.sh >> logs/technical.log 2>&1

# Weekly fundamentals every Sunday at 10 AM
0 10 * * 0 cd /path/to/project && ./fundamentals_batch.sh >> logs/fundamentals.log 2>&1
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Yahoo Finance API](https://pypi.org/project/yfinance/)
- [Technical Analysis Library](https://github.com/bukosabino/ta)

## Deploy on Vercel

Deploy the Next.js app on [Vercel](https://vercel.com/new).

See [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for details.
