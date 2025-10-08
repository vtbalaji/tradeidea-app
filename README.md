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

## Technical Analysis Batch Job

The project includes a Python batch job that fetches EOD (End of Day) data from Yahoo Finance and calculates technical indicators.

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

### Scheduling the Batch Job

You can schedule the batch job to run daily using cron:

```bash
# Edit crontab
crontab -e

# Add daily run at 6 PM IST (after market close)
0 18 * * * cd /path/to/project && source venv/bin/activate && python3 scripts/analyze-symbols.py >> logs/batch.log 2>&1
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
│   ├── analyze-symbols.py        # Python technical analysis (recommended)
│   ├── analyze-symbols.ts        # TypeScript version (has DuckDB issues)
│   └── load-symbols-from-csv.ts  # Load NSE symbols
├── venv/                  # Python virtual environment
└── serviceAccountKey.json # Firebase admin credentials (gitignored)
```

## Firebase Collections

- **technicals**: Technical analysis data (one doc per symbol)
- **ideas**: User trading ideas
- **tradingIdeas**: Trading ideas
- **portfolio**: User portfolio positions
- **portfolios**: Alternative portfolio storage
- **symbols**: NSE symbol master list (2,147 symbols)
- **users**: User profiles
- **comments**: Idea comments

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Yahoo Finance API](https://pypi.org/project/yfinance/)
- [Technical Analysis Library](https://github.com/bukosabino/ta)

## Deploy on Vercel

Deploy the Next.js app on [Vercel](https://vercel.com/new).

See [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for details.
