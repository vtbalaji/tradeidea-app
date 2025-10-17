# Portfolio Risk Analysis System

Complete implementation guide for the portfolio risk analysis feature that provides sector distribution, market cap analysis, and risk metrics (Beta, Standard Deviation, Sharpe Ratio).

## Overview

The risk analysis system calculates comprehensive portfolio metrics by:
1. Fetching historical prices from DuckDB (NSE data)
2. Fetching symbol metadata from Firestore (sector, industry, market cap, beta)
3. Calculating portfolio-level risk metrics
4. Comparing against Nifty 50 benchmark

## Architecture

### Data Sources

**Primary**: NSE India (via jugaad-data library)
- Historical stock prices (OHLCV)
- Nifty 50 index data
- Stored in DuckDB (`data/eod.duckdb`)

**Metadata**: Firestore
- Symbol information (sector, industry)
- Market cap and beta from fundamental analysis
- Updated by fundamentals batch job

### Key Components

```
/lib/portfolioAnalysis.ts          # Core calculation library
/app/api/portfolio/analyze/route.ts # API endpoint
/app/risk-analysis/page.tsx         # UI page
/scripts/fetch-nifty50-index.py    # Nifty 50 data fetcher
```

## Setup Instructions

### Step 1: Fetch Nifty 50 Historical Data

Run this once to populate Nifty 50 index data in DuckDB:

```bash
./venv/bin/python3 scripts/fetch-nifty50-index.py
```

This will:
- Fetch 2 years of Nifty 50 historical data
- Store in DuckDB under symbol `NIFTY50`
- Update incrementally on subsequent runs

### Step 2: Update Daily EOD Batch

The daily batch script has been updated to automatically fetch Nifty 50 data:

```bash
./scripts/daily-eod-batch.sh
```

This now includes Step 1.5: Fetch Nifty 50 Index Data

### Step 3: Ensure Sector/Market Cap Data is Available

The system uses sector and market cap data from Firestore. This should be populated by your fundamentals analysis job:

```bash
./venv/bin/python3 scripts/analyze-fundamentals.py
```

This populates:
- `symbols/{SYMBOL}/fundamental/sector`
- `symbols/{SYMBOL}/fundamental/industry`
- `symbols/{SYMBOL}/fundamental/marketCap`
- `symbols/{SYMBOL}/fundamental/beta`

## Usage

### Accessing the Risk Analysis Page

Navigate to: `http://localhost:3000/risk-analysis`

The page will:
1. Load your active portfolio positions
2. Call `/api/portfolio/analyze` API endpoint
3. Display comprehensive risk analysis

### API Endpoint

**POST** `/api/portfolio/analyze`

Request body:
```json
{
  "positions": [
    {
      "symbol": "RELIANCE",
      "quantity": 10,
      "entryPrice": 2500,
      "currentPrice": 2600,
      "totalValue": 26000
    }
  ],
  "accountId": "account123"
}
```

Response:
```json
{
  "success": true,
  "analysis": {
    "totalValue": 26000,
    "positionCount": 1,
    "sectorDistribution": [...],
    "marketCapDistribution": [...],
    "riskMetrics": {
      "beta": 1.23,
      "standardDeviation": 37.08,
      "sharpeRatio": -0.54,
      "benchmarkBeta": 1.0,
      "benchmarkStdDev": 12.72
    },
    "diversificationScore": 45,
    "warnings": [...],
    "calculatedAt": "2025-01-17T10:30:00Z",
    "dataSource": "duckdb-nse"
  }
}
```

## Metrics Explained

### 1. Sector Distribution

Shows portfolio allocation across different sectors:
- **Utilities**
- **Metals & Mining**
- **Consumer Durables**
- **Chemicals & Petrochemicals**
- **Automobiles & Auto Components**
- **General Industrials**
- **Transportation**

**Ideal**: No single sector should exceed 30-40%

### 2. Market Cap Distribution

Classification based on NSE market capitalization:
- **Large Cap**: Market cap > ₹50,000 Cr (Top 100 stocks)
- **Mid Cap**: ₹10,000 - ₹50,000 Cr (101-250 stocks)
- **Small Cap**: < ₹10,000 Cr (251+ stocks)

**Ideal**: Balanced mix with 40-60% Large Cap, 20-30% Mid Cap, 10-20% Small Cap

### 3. Beta (β)

Measures portfolio volatility relative to Nifty 50:
- **Beta = 1.0**: Moves in line with market (Nifty 50)
- **Beta > 1.0**: More volatile than market (higher risk)
- **Beta < 1.0**: Less volatile than market (lower risk)

**Formula**: `β = Covariance(Portfolio, Nifty) / Variance(Nifty)`

### 4. Standard Deviation

Measures portfolio volatility (annualized):
- **Lower std dev**: More stable, predictable returns
- **Higher std dev**: More volatile, unpredictable returns

**Formula**: `σ = √(Variance) × √252` (annualized)

### 5. Sharpe Ratio

Risk-adjusted return metric:
- **> 3**: Excellent
- **> 2**: Very good
- **> 1**: Good
- **< 0**: Negative (returns below risk-free rate)

**Formula**: `Sharpe = (Portfolio Return - Risk Free Rate) / Portfolio Std Dev`

Default risk-free rate: **7%** (Indian 10Y G-Sec yield)

### 6. Diversification Score (0-100)

Composite score based on:
- **Position count** (25 pts): Ideal 10-20 positions
- **Sector diversity** (40 pts): No sector > 30%, minimum 4 sectors
- **Market cap mix** (35 pts): Balanced large/mid/small caps

**Scoring**:
- **70-100**: Well diversified ✅
- **40-69**: Moderate diversification ⚠️
- **0-39**: Concentrated portfolio ❌

## Calculation Details

### Portfolio Beta Calculation

```typescript
// Weighted average of individual stock betas
portfolioBeta = Σ(weight_i × beta_i)

where:
  weight_i = position_value_i / total_portfolio_value
  beta_i = individual stock beta (from Firestore)
```

### Portfolio Returns Calculation

```typescript
// Daily returns for each stock
dailyReturn_i = (price_today - price_yesterday) / price_yesterday

// Portfolio daily return (weighted average)
portfolioReturn_t = Σ(weight_i × dailyReturn_i_t)

// Annualized return
annualizedReturn = (1 + cumulative_return)^(252/days) - 1
```

### Standard Deviation Calculation

```typescript
// Daily std dev
dailyStdDev = √(Σ(return_i - mean)² / (n - 1))

// Annualized (252 trading days)
annualizedStdDev = dailyStdDev × √252
```

## Data Requirements

### Minimum Data for Analysis

1. **Historical Prices** (at least 100 days):
   - Stock prices in DuckDB
   - Nifty 50 prices in DuckDB

2. **Symbol Metadata** in Firestore:
   - Sector (optional, defaults to "Unknown")
   - Market cap (optional, used for classification)
   - Beta (optional, defaults to 1.0)

### Data Freshness

- **Historical prices**: Updated daily by EOD batch
- **Nifty 50 data**: Updated daily by EOD batch
- **Metadata**: Updated weekly by fundamentals batch
- **Analysis cache**: Calculated on-demand

## Troubleshooting

### Issue: "Insufficient historical data"

**Solution**: Ensure DuckDB has at least 100 days of price data:
```bash
duckdb data/eod.duckdb "SELECT COUNT(*) FROM ohlcv WHERE symbol='RELIANCE'"
```

### Issue: "No Nifty 50 data found"

**Solution**: Fetch Nifty 50 historical data:
```bash
./venv/bin/python3 scripts/fetch-nifty50-index.py
```

### Issue: "Unknown sector" or missing metadata

**Solution**: Run fundamentals analysis:
```bash
./venv/bin/python3 scripts/analyze-fundamentals.py
```

### Issue: API timeout or slow response

**Causes**:
1. Large number of positions (> 30)
2. Missing cached data in DuckDB
3. First-time calculation

**Solutions**:
- Reduce portfolio size or split into multiple accounts
- Ensure DuckDB has recent data
- Consider pre-calculating metrics monthly

## Performance Considerations

### API Response Time

Expected response times:
- **5-10 positions**: 2-3 seconds
- **10-20 positions**: 4-6 seconds
- **20-30 positions**: 6-10 seconds

### Optimization Tips

1. **Pre-fetch data**: Run EOD batch regularly
2. **Cache results**: Consider caching analysis for 24 hours
3. **Limit positions**: Split large portfolios into multiple accounts

## Future Enhancements

### Planned Features

1. **Correlation Matrix**: Show correlation between holdings
2. **Value at Risk (VaR)**: Calculate potential portfolio loss
3. **Historical Performance**: Track portfolio metrics over time
4. **Comparison Tool**: Compare multiple portfolios
5. **Rebalancing Suggestions**: AI-powered portfolio optimization

### Data Enhancements

1. **Real-time beta calculation**: Calculate beta from historical data
2. **Sector benchmarks**: Compare sector allocations with indices
3. **Risk-free rate API**: Auto-fetch from RBI
4. **International stocks**: Support for US/global stocks

## References

### Risk Metrics

- [Beta Definition - Investopedia](https://www.investopedia.com/terms/b/beta.asp)
- [Sharpe Ratio - Investopedia](https://www.investopedia.com/terms/s/sharperatio.asp)
- [Portfolio Standard Deviation](https://www.investopedia.com/terms/s/standarddeviation.asp)

### NSE Resources

- [NSE Market Capitalization Categories](https://www.nseindia.com/market-data/live-equity-market)
- [NSE Sector Indices](https://www.nseindia.com/products-services/indices-nifty-sectoral-indices)

## Support

For issues or questions:
1. Check logs: `logs/eod-batch-*.log`
2. Test Nifty 50 data: `duckdb data/eod.duckdb "SELECT * FROM ohlcv WHERE symbol='NIFTY50' LIMIT 10"`
3. Verify Firestore metadata: Check Firebase console > `symbols` collection

---

**Version**: 1.0.0
**Last Updated**: January 17, 2025
**Author**: Portfolio Risk Analysis Team
