# All Scores and Calculations in TradeIdea

## Overview
All scores and ratings are **COMPUTED AT YOUR END** using raw data from Yahoo Finance. None of the scores come directly from Yahoo Finance.

---

## 1. TECHNICAL SCORE (Overall Signal)

**Location**: `scripts/analyze-symbols.ts` (Lines 304-328)

**Source Data**: Yahoo Finance OHLCV data (Open, High, Low, Close, Volume)

**Calculation Method**: Points-based scoring system

### Scoring Rules:

| Condition | Points |
|-----------|--------|
| Price ABOVE SMA200 | +2 |
| Price BELOW SMA200 | -2 |
| Price ABOVE EMA50 | +1 |
| Price BELOW EMA50 | -1 |
| RSI Oversold (<30) | +2 |
| RSI Overbought (>70) | -2 |
| MACD Bullish (histogram > 0) | +1 |
| MACD Bearish (histogram < 0) | -1 |
| Golden Cross (SMA50 > SMA200) | +2 |
| Death Cross (SMA50 < SMA200) | -2 |
| Volume Spike (>2x avg) | +1 |

### Output Ratings:

```typescript
score >= 5:  'STRONG_BUY'
score >= 2:  'BUY'
score <= -5: 'STRONG_SELL'
score <= -2: 'SELL'
else:        'NEUTRAL'
```

**Range**: -11 to +11 points (mapped to 5 ratings)

---

## 2. FUNDAMENTAL SCORE

**Location**: `scripts/unused/analyze-fundamentals.py` (Lines 116-252)

**Source Data**: Yahoo Finance fundamental metrics

**Calculation Method**: Weighted scoring across 8 metrics, normalized to 0-100

### Metrics & Weights:

#### 1. PE Ratio (10 points max)
- 10-20: **10 points** ✅ (ideal)
- 20-30: **7 points**
- 5-10: **7 points**
- <5 or >30: **3 points**

#### 2. PEG Ratio (10 points max) - **CURRENTLY DISABLED**
- <1: **10 points**
- 1-1.5: **7 points**
- 1.5-2: **5 points**
- >2: **2 points**
- **Why disabled**: Yahoo uses 1-year growth; Indian standard (Screener.in) uses 3-year CAGR

#### 3. ROE - Return on Equity (15 points max)
- ≥20%: **15 points** ✅
- 15-20%: **12 points**
- 10-15%: **8 points**
- <10%: **3 points**

#### 4. Debt to Equity (10 points max)
- <50: **10 points** ✅
- 50-100: **7 points**
- 100-200: **4 points**
- >200: **1 point**

#### 5. Profit Margins (10 points max)
- ≥15%: **10 points** ✅
- 10-15%: **7 points**
- 5-10%: **4 points**
- <5%: **2 points**

#### 6. Earnings Growth (15 points max)
- ≥20%: **15 points** ✅
- 10-20%: **12 points**
- 5-10%: **8 points**
- 0-5%: **4 points**
- Negative: **0 points**

#### 7. Revenue Growth (10 points max)
- ≥15%: **10 points** ✅
- 10-15%: **7 points**
- 5-10%: **5 points**
- 0-5%: **3 points**
- Negative: **0 points**

#### 8. Current Ratio (10 points max)
- ≥2: **10 points** ✅
- 1.5-2: **7 points**
- 1-1.5: **4 points**
- <1: **1 point**

### Normalization Formula:

```python
normalized_score = (total_score / max_possible_score) * 100
```

**Range**: 0-100 (percentage)

---

## 3. FUNDAMENTAL RATING

**Location**: `scripts/unused/analyze-fundamentals.py` (Lines 238-247)

**Source**: Derived from Fundamental Score

### Rating Bands:

```python
≥80: 'EXCELLENT' 🟢
≥60: 'GOOD'     🟢
≥40: 'AVERAGE'  🟡
≥20: 'POOR'     🔴
<20: 'WEAK'     🔴
```

---

## 4. INVESTOR TYPE SUITABILITY SCORES

**Location**: `lib/investment-rules/rules/*.ts` (5 different investor types)

**Source**: Custom rule engine using technical + fundamental data

### Available Investor Types:

1. **Value Investor** (`valueInvestor.ts`)
2. **Growth Investor** (`growthInvestor.ts`)
3. **Momentum Trader** (`momentumTrader.ts`)
4. **Quality Investor** (`qualityInvestor.ts`)
5. **Dividend Investor** (`dividendInvestor.ts`)

### Scoring Method:

Each investor type has:
- **Entry Conditions**: List of criteria that must be met
- **Exit Conditions**: When to exit position
- **Scoring**: Tracks `met` vs `total` conditions

**Output Format**:
```typescript
{
  canEnter: boolean,
  met: number,        // Conditions met
  total: number,      // Total conditions
  failedConditions: string[],
  scores: {
    // Custom scores per investor type
  }
}
```

**Display**: Progress bar showing `met / total` with percentage completion

---

## Summary Table

| Score/Rating | Source Data | Computed By | Range | Purpose |
|--------------|-------------|-------------|-------|---------|
| **Technical Score** | Yahoo OHLCV | Your code | -11 to +11 | Overall technical signal |
| **Overall Signal** | Technical Score | Your code | 5 ratings | STRONG_BUY to STRONG_SELL |
| **Fundamental Score** | Yahoo fundamentals | Python script | 0-100 | Overall company health |
| **Fundamental Rating** | Fundamental Score | Python script | 5 ratings | EXCELLENT to WEAK |
| **Investor Suitability** | Tech + Fund data | Rule engine | % completion | Match to investor profile |

---

## Data Flow

```
Yahoo Finance (Raw Data)
    ↓
Your Batch Jobs (Compute Indicators)
    ↓
Score Calculations (Your Algorithms)
    ↓
Firestore Storage
    ↓
Frontend Display
```

---

## Key Points

✅ **All scores are YOUR proprietary calculations**
✅ **Yahoo Finance provides ONLY raw metrics** (PE, ROE, price data, etc.)
✅ **You control the weighting and thresholds**
✅ **Scores are customizable** - edit the scripts to change logic
✅ **PEG is disabled** due to data quality issues for Indian stocks

---

## Files Reference

### Technical Analysis
- **Calculation**: `scripts/analyze-symbols.ts`
- **Storage**: Firestore `symbols/{symbol}/technical`
- **Indicators Used**: SMA, EMA, RSI, MACD, Bollinger Bands

### Fundamental Analysis
- **Calculation**: `scripts/unused/analyze-fundamentals.py`
- **Storage**: Firestore `symbols/{symbol}/fundamental`
- **Metrics Used**: PE, ROE, D/E, Margins, Growth rates

### Investor Type Rules
- **Calculation**: `lib/investment-rules/rules/*.ts`
- **Engine**: `lib/investment-rules/InvestmentRuleEngine.ts`
- **UI**: `components/InvestorAnalysisModal.tsx`

---

**Last Updated**: January 2025
**Version**: 1.0
