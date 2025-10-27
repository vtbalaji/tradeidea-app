# 📊 Advanced Stock Analysis Tools

Comprehensive analysis reports combining **Fundamental Data (XBRL)** with **Technical Indicators** to provide actionable investment insights.

---

## 🎯 Available Reports

### 1. **Quality-Momentum Screener**
**File**: `quality_momentum_screener.py`

Combines fundamental quality (F-Score, ROE, Debt) with technical momentum (RSI, MACD, price trends) to find high-quality stocks with strong price momentum.

#### Features:
- **Quality Filters**: F-Score ≥ 6, ROE > 12%, Debt/Equity < 1.5
- **Momentum Filters**: RSI > 50, Price > 20 MA, Within 15% of 52W high
- **Composite Scoring**: 100-point scale (Quality: 50pts + Momentum: 50pts)
- **Market Cap Filter**: Configurable minimum market cap

#### Usage:

```bash
# Basic usage (default filters)
./scripts/analysis/quality_momentum_screener.py

# Custom filters
./scripts/analysis/quality_momentum_screener.py \
  --fscore 7 \
  --roe 15 \
  --debt 1.0 \
  --mcap 1000 \
  --top 20
```

#### Parameters:
- `--fscore`: Minimum F-Score (default: 6)
- `--roe`: Minimum ROE % (default: 12)
- `--debt`: Maximum Debt/Equity (default: 1.5)
- `--mcap`: Minimum Market Cap in Cr (default: 500)
- `--top`: Number of top stocks to show (default: 20)

#### Sample Output:

```
================================================================================
📊 SCREENING RESULTS - TOP 20 STOCKS
================================================================================

Rank   Symbol       Score    F    ROE%    D/E    RSI    Price      52WH%    MCap Cr
--------------------------------------------------------------------------------
1      TCS          85.4     8    48.2    0.05   65.3   ₹3063.20   -5.2     1108296
2      INFY         82.1     7    31.5    0.12   62.1   ₹1525.40   -8.1     623450
3      WIPRO        78.9     7    25.3    0.18   58.7   ₹485.30    -12.4    265820

🔍 DETAILED VIEW - TOP 5 STOCKS

1. TCS - Composite Score: 85.4/100
   ──────────────────────────────────────────────────────────────────────
   📊 Quality Metrics:
      F-Score: 8/9  |  ROE: 48.2%  |  Debt/Equity: 0.05
      Revenue: ₹231,366 Cr  |  Net Profit: ₹45,648 Cr
      Market Cap: ₹1,108,296 Cr  |  P/E: 24.3

   📈 Momentum Metrics:
      Current Price: ₹3,063.20
      RSI: 65.3  |  MACD: 12.45
      From 52W High: -5.2%
      Above MA20: ✅  |  Above MA50: ✅
      Volume Ratio: 1.25x

   ℹ️  Data: XBRL (FY2024)
```

---

### 2. **Enhanced Company Analysis Report**
**File**: `enhanced_company_report.py`

Comprehensive investment analysis combining forensic scores (M-Score, Z-Score, F-Score, J-Score) with technical analysis for deep company evaluation.

#### Features:
- **Company Overview**: Market cap, revenue, profitability, latest fundamentals
- **Forensic Analysis**: Fraud detection, bankruptcy risk, fundamental strength, cash flow quality
- **Technical Analysis**: Trend, support/resistance, RSI, MACD, performance metrics
- **Valuation**: Intrinsic value (Graham Number, DCF, P/E-based), margin of safety
- **Recommendation**: BUY/HOLD/SELL with detailed reasoning

#### Usage:

```bash
# Text report (console output)
./scripts/analysis/enhanced_company_report.py TCS

# Specify analysis period
./scripts/analysis/enhanced_company_report.py TCS --years 5

# JSON output (save to file)
./scripts/analysis/enhanced_company_report.py TCS --output json
```

#### Parameters:
- `symbol`: Stock symbol (required, e.g., TCS, INFY)
- `--years`: Number of years to analyze (default: 5)
- `--output`: Output format: `text` or `json` (default: text)

#### Sample Output:

```
================================================================================
📊 COMPANY OVERVIEW: TCS
================================================================================

   Market Cap: ₹1,108,296 Cr
   Revenue: ₹231,366 Cr (FY2024)
   Net Profit: ₹45,648 Cr
   ROE: 50.0%
   Current Price: ₹3,063.20
   52W Range: ₹2,866.60 - ₹4,494.90
   Last Updated: 2025-10-24

================================================================================
🔍 FORENSIC ANALYSIS
================================================================================

   📈 Beneish M-Score (Earnings Manipulation):
      Score: -2.45
      Risk: LOW

   💼 Altman Z-Score (Bankruptcy Risk):
      Score: 13.85
      Risk: Safe

   ⭐ Piotroski F-Score (Fundamental Strength):
      Score: 8/9
      Quality: High Quality

   💰 J-Score (Cash Flow Quality):
      Score: 3
      Risk: Low

================================================================================
📈 TECHNICAL ANALYSIS
================================================================================

   Price Action:
      Current: ₹3,063.20
      Trend: 🔴 Weak Downtrend
      MA20: ₹2,978.24  |  MA50: ₹3,045.34  |  MA200: ₹3,430.22

   Momentum Indicators:
      RSI: 68.0 (Neutral)
      MACD: -4.84  |  Signal: -18.49

   Support & Resistance:
      Support (52W Low): ₹2,866.60
      Resistance (52W High): ₹4,494.90
      BB Upper: ₹3,093.77  |  BB Lower: ₹2,862.72

   Performance:
      1 Month: +0.92%
      3 Months: -2.69%
      6 Months: -11.16%
      1 Year: -24.92%
      Volatility: 21.3% (annualized)

================================================================================
💰 VALUATION ANALYSIS
================================================================================

   Intrinsic Value Estimates:
      Graham Number: ₹3,250.50
      DCF Value: ₹3,850.20
      P/E Based: ₹3,420.00
      Average Intrinsic Value: ₹3,506.90

   Margin of Safety: +14.5%
   💡 Stock is trading BELOW intrinsic value

================================================================================
🎯 FINAL RECOMMENDATION
================================================================================

   🟢🟢 BUY (Score: 45/100)

   Key Reasons:
      ✅ Low fraud risk (M-Score)
      ✅ Low bankruptcy risk (Z-Score)
      ✅ High quality fundamentals (F-Score: 8/9)
      ✅ Good cash flow quality (J-Score)
      ❌ Negative price trend (Weak Downtrend)
      ✅ Healthy RSI (68.0)
      ✅ Bullish MACD crossover
      ✅ Undervalued (14.5% below intrinsic value)
```

---

## 📂 Data Sources

### Fundamental Data (`data/fundamentals.duckdb`)
- **XBRL Financial Statements**: Annual reports from NSE/BSE filings
- **Yahoo Finance Enrichment**: Quarterly fundamentals for gap-filling
- **Tables**:
  - `xbrl_data`: Detailed P&L, balance sheet, cash flow
  - `yahoo_quarterly_enrichment`: Quarterly data from Yahoo
  - `yahoo_current_fundamentals`: Latest fundamental ratios

### Price Data (`data/eod.duckdb`)
- **OHLCV Data**: Daily open, high, low, close, volume
- **Table**: `ohlcv`
- **Coverage**: Historical price data for NSE symbols

---

## 🔍 Analysis Methodologies

### Forensic Scores

#### 1. **Beneish M-Score** (Earnings Manipulation Detection)
- **Formula**: Weighted sum of 8 financial ratios
- **Interpretation**:
  - M-Score < -2.22: **LOW risk** (✅)
  - M-Score > -2.22: **HIGH risk** (❌)

#### 2. **Altman Z-Score** (Bankruptcy Prediction)
- **Formula**: Z = 1.2X₁ + 1.4X₂ + 3.3X₃ + 0.6X₄ + 1.0X₅
- **Interpretation**:
  - Z > 2.99: **Safe Zone** (✅)
  - 1.81 < Z < 2.99: **Grey Zone** (⚠️)
  - Z < 1.81: **Distress Zone** (❌)

#### 3. **Piotroski F-Score** (Fundamental Strength)
- **Components**: 9 criteria across profitability, leverage, operating efficiency
- **Interpretation**:
  - F ≥ 7: **High Quality** (✅)
  - 4 ≤ F < 7: **Medium Quality** (⚠️)
  - F < 4: **Low Quality** (❌)

#### 4. **J-Score** (Cash Flow Quality)
- **Methodology**: Detects 12 cash flow red flags
- **Interpretation**:
  - J < 5: **Low Risk** (✅)
  - 5 ≤ J < 10: **Medium Risk** (⚠️)
  - J ≥ 10: **High Risk** (❌)

### Technical Indicators

- **RSI (Relative Strength Index)**: Momentum oscillator (0-100)
  - < 30: Oversold
  - 30-70: Neutral
  - > 70: Overbought

- **MACD (Moving Average Convergence Divergence)**: Trend-following momentum
  - Crossover above signal: Bullish
  - Crossover below signal: Bearish

- **Moving Averages**: Trend identification
  - MA20, MA50, MA200
  - Price > MA: Uptrend
  - Price < MA: Downtrend

- **Bollinger Bands**: Volatility and support/resistance

---

## 💡 Use Cases

### 1. **Finding Quality Growth Stocks**
```bash
# High-quality stocks with strong momentum
./scripts/analysis/quality_momentum_screener.py --fscore 7 --roe 15 --mcap 1000
```

### 2. **Deep Company Research**
```bash
# Comprehensive analysis before buying
./scripts/analysis/enhanced_company_report.py RELIANCE --years 5
```

### 3. **Portfolio Health Check**
```bash
# Analyze each holding
for symbol in TCS INFY WIPRO HCLTECH; do
  ./scripts/analysis/enhanced_company_report.py $symbol
done
```

### 4. **Finding Undervalued Quality Stocks**
```bash
# Low debt, high quality, strong fundamentals
./scripts/analysis/quality_momentum_screener.py --fscore 8 --debt 0.5 --roe 20
```

---

## 🚀 Quick Start

### Prerequisites
```bash
# Ensure databases are populated
ls data/fundamentals.duckdb  # Fundamental data
ls data/eod.duckdb           # Price data
```

### Run Your First Analysis

```bash
# 1. Screen for quality momentum stocks
./scripts/analysis/quality_momentum_screener.py --top 10

# 2. Deep dive into top stock
./scripts/analysis/enhanced_company_report.py TCS

# 3. Export to JSON for further analysis
./scripts/analysis/enhanced_company_report.py TCS --output json
```

---

## 📊 Combining Reports

### Example Workflow:

```bash
# Step 1: Screen for candidates
./scripts/analysis/quality_momentum_screener.py --fscore 7 --top 10 > candidates.txt

# Step 2: Deep analysis of top 3
for symbol in TCS INFY HCLTECH; do
  ./scripts/analysis/enhanced_company_report.py $symbol --output json
done

# Step 3: Review JSON reports and make decisions
```

---

## 🎯 Investment Strategy Examples

### Conservative (Low Risk)
```bash
# Focus: Safety + Quality
./scripts/analysis/quality_momentum_screener.py \
  --fscore 8 \
  --roe 15 \
  --debt 0.3 \
  --mcap 5000
```

### Growth (Higher Risk/Reward)
```bash
# Focus: Momentum + Quality
./scripts/analysis/quality_momentum_screener.py \
  --fscore 6 \
  --roe 20 \
  --debt 1.5 \
  --mcap 500
```

### Value (Contrarian)
```bash
# Find quality stocks at discount
# Use screener for quality filter, then check report for valuation
./scripts/analysis/quality_momentum_screener.py --fscore 7
# Then run enhanced report to check margin of safety
```

---

## 📈 Coming Soon

- **Sector Rotation Report**: Best sectors to invest in now
- **Portfolio Analytics**: Track your holdings' fundamentals + technicals
- **Weekly Opportunities Dashboard**: Automated email with top picks
- **Back-test Engine**: Test strategies historically

---

## 🆘 Troubleshooting

### No stocks found in screener
- **Issue**: Filters too strict or insufficient data
- **Solution**: Lower thresholds (e.g., --fscore 5 --roe 10)

### "No data available" error
- **Issue**: Symbol not in database or data not downloaded
- **Solution**: Run XBRL parser and EOD data fetcher first

### Technical indicators showing N/A
- **Issue**: Insufficient price history
- **Solution**: Ensure EOD data is populated for the symbol

---

## 📝 Contributing

Ideas for new reports or improvements? Please create an issue or submit a PR!

---

## 📄 License

Part of the MyPortfolio project. For internal use.
