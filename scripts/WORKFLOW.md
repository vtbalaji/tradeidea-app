# EOD Data & Screener Workflow

## 🔄 Complete Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    DAILY EOD BATCH PROCESS                   │
│                  (Runs at 4:30 PM IST Daily)                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Fetch EOD Data (fetch-eod-data.py)                 │
├─────────────────────────────────────────────────────────────┤
│  • Smart Date Logic:                                         │
│    - Before 4 PM → Fetch yesterday                          │
│    - After 4 PM → Fetch today                               │
│    - Weekend → Fetch last Friday                            │
│  • Uses: jugaad-data (NSE API)                              │
│  • Storage: DuckDB (data/eod.duckdb)                        │
│  • Output: OHLCV data for all symbols                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Technical Analysis (analyze-symbols.py)            │
├─────────────────────────────────────────────────────────────┤
│  • Calculates:                                               │
│    - EMA 50, 100, 200                                       │
│    - SMA 50, 100, 200                                       │
│    - RSI, MACD, Bollinger Bands                             │
│    - Supertrend                                             │
│  • Storage: Firebase (symbols collection)                   │
│  • Output: Technical indicators for each symbol             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: Run Screeners (screeners.py)                       │
├─────────────────────────────────────────────────────────────┤
│  • Detects:                                                  │
│    ✓ 50 MA Crossovers (bullish/bearish)                    │
│    ✓ 200 MA Crossovers (bullish/bearish)                   │
│    ✓ Supertrend Crossovers (bullish/bearish)               │
│    ✓ Volume Spikes (> 20 MA volume)                        │
│  • Filter: Market cap > 1000 Cr                             │
│  • Storage: Firebase collections                            │
│    - macrossover50                                          │
│    - macrossover200                                         │
│    - supertrendcrossover                                    │
│    - volumespike                                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  WEB APP: Display Results                                    │
├─────────────────────────────────────────────────────────────┤
│  Route: /cross50200                                          │
│  • Shows all crossover signals                               │
│  • Filter by: 50MA/200MA/Both/Supertrend/Volume            │
│  • One-click "Convert to Idea" button                       │
│                                                              │
│  Auto-calculates:                                            │
│  • Entry: Max(Supertrend, 100MA, 50MA)                     │
│  • Stop Loss: Entry - 2%                                     │
│  • Target: Entry + (Risk × 2)  [2:1 R:R]                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  USER ACTION: Convert to Trading Idea                        │
├─────────────────────────────────────────────────────────────┤
│  • Pre-filled form with:                                     │
│    - Symbol                                                  │
│    - Entry price (calculated)                               │
│    - Stop loss (calculated)                                 │
│    - Target (calculated)                                    │
│    - Analysis text (auto-generated)                         │
│  • User can edit before saving                              │
│  • Saves to Firebase (ideas collection)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  TRACKING: Monitor Trading Ideas                             │
├─────────────────────────────────────────────────────────────┤
│  Route: /ideas                                               │
│  • Track status: cooking/active/hit target/hit SL           │
│  • Get alerts when entry/target/SL hit                      │
│  • Add to portfolio when entry triggered                    │
│  • Technical analysis updates daily                         │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Entry & Stop Loss Logic

### For Bullish Signals:

```
Current Price: ₹368
├─ Supertrend: ₹349
├─ 100 MA:     ₹317
└─ 50 MA:      ₹350

Entry = max(349, 317, 350) = ₹350
Stop Loss = 350 × 0.98 = ₹343
Risk = 350 - 343 = ₹7
Target = 350 + (7 × 2) = ₹364
```

**Rationale:**
- Entry at highest support level (wait for pullback)
- Stop loss 2% below support
- 2:1 risk-reward ratio

### Example Scenarios:

| Scenario | Supertrend | 100MA | 50MA | Entry | Stop Loss | Target |
|----------|-----------|-------|------|-------|-----------|--------|
| Strong Support | ₹480 | ₹470 | ₹460 | ₹480 | ₹470.40 | ₹499.20 |
| Near Support | ₹350 | ₹345 | ₹340 | ₹350 | ₹343.00 | ₹364.00 |
| Weak Support | ₹300 | ₹280 | ₹270 | ₹300 | ₹294.00 | ₹312.00 |

## 📊 Data Flow

```
NSE (jugaad-data)
    ↓
DuckDB (local cache)
    ↓
Technical Analysis
    ↓
Firebase (technicals)
    ↓
Screeners
    ↓
Firebase (crossovers)
    ↓
Web App
    ↓
User (Convert to Idea)
    ↓
Firebase (ideas)
    ↓
Portfolio Tracking
```

## ⏱️ Timing

| Time | Action | Data Available |
|------|--------|----------------|
| 9:15 AM | Market Opens | - |
| 3:30 PM | Market Closes | - |
| 4:00 PM | NSE Publishes EOD | ✅ Today's data |
| 4:30 PM | **Run Batch** | Fetch & Analyze |
| 5:00 PM | Results Ready | Web app shows signals |

## 🔧 Key Files

```
scripts/
├── daily-eod-batch.sh          # Main batch script
├── fetch-eod-data.py           # Step 1: Fetch EOD data
├── analyze-symbols.py          # Step 2: Technical analysis
├── screeners.py                # Step 3: Find crossovers
├── experimental/
│   ├── fetch_nse_data.py       # NSE data fetcher (with smart date logic)
│   └── test_date_logic.py      # Test smart date logic
└── QUICK_START.md              # This guide
```

## 📱 User Journey

1. **Discovery**: User opens `/cross50200` page
2. **Review**: Sees LGHL with bullish supertrend crossover
3. **Analysis**: Clicks "Analyze" to see full technical/fundamental data
4. **Convert**: Clicks "Convert to Idea" → Pre-filled form
5. **Customize**: Reviews entry (₹350), SL (₹343), Target (₹364)
6. **Save**: Creates trading idea
7. **Wait**: Gets alert when price hits ₹350 (entry)
8. **Execute**: Buys at entry, adds to portfolio
9. **Monitor**: Tracks with exit criteria
10. **Exit**: Gets alert when target (₹364) or SL (₹343) hit
11. **Profit**: Books profit/loss

## 🎨 Status Flow

```
Idea Created (cooking)
    ↓
Entry Price Hit (active)
    ↓
Add to Portfolio
    ↓
Monitor Daily
    ↓
┌─────────────────┬─────────────────┐
│                 │                 │
Target Hit    Stop Loss Hit    Manual Exit
│                 │                 │
└─────────────────┴─────────────────┘
                  ↓
            Closed (profit/loss)
```

## 🚀 Quick Commands

**IMPORTANT: Always use venv Python, never system python3!**

```bash
# Run everything (uses venv automatically)
./daily-eod-batch.sh

# Or step by step (use venv Python explicitly)
cd /Volumes/ssd-backup/git/SmartFarm/myportfolio-web
./venv/bin/python3 scripts/fetch-eod-data.py
./venv/bin/python3 scripts/analyze-symbols.py
./venv/bin/python3 scripts/screeners.py

# Test single symbol (use venv Python)
./venv/bin/python3 -c "import sys; sys.path.insert(0, 'scripts/experimental'); from fetch_nse_data import NSEDataFetcher; f=NSEDataFetcher(); f.fetch_and_store('RELIANCE'); f.close()"

# Check logs
tail -f /tmp/eod-batch.log

# Setup cron (batch script uses venv automatically)
crontab -e
# 30 16 * * * cd /path/to/myportfolio-web/scripts && ./daily-eod-batch.sh >> /tmp/eod-batch.log 2>&1
```
