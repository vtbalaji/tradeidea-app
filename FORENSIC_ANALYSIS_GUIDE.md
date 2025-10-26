# Financial Forensic Analysis System

## Overview

Comprehensive forensic analysis system that automatically detects earnings manipulation, bankruptcy risk, and financial red flags using multiple proven models.

## Features

### 1. **Beneish M-Score** - Earnings Manipulation Detection
- Detects potential earnings manipulation
- Score > -2.22 indicates possible manipulation
- Analyzes 8 financial indices (DSRI, GMI, AQI, etc.)

### 2. **Altman Z-Score** - Bankruptcy Prediction
- Predicts bankruptcy risk within 2 years
- Z > 2.99: Safe Zone
- Z 1.81-2.99: Grey Zone
- Z < 1.81: Distress Zone

### 3. **Piotroski F-Score** - Fundamental Strength
- 9-point scale assessing financial health
- Score 8-9: Strong fundamentals
- Score 5-7: Moderate
- Score 0-4: Weak

### 4. **J-Score** - Cash Flow Forensics
- Custom score focused on cash flow quality
- Detects receivables buildup, inventory issues
- Identifies other income dependency
- Score 0-5: Low Risk, 6-10: Medium, 11+: High

### 5. **Automated Red Flags Detection**
- 20+ rule-based checks
- Categorized by severity (High/Medium/Low)
- Covers liquidity, leverage, profitability, efficiency

### 6. **Composite Risk Score**
- Weighted average of all models (0-100 scale)
- Higher score = Higher risk
- Automatic recommendation generation

## Installation

Already installed! The system is located in `scripts/forensics/`.

### Dependencies

```bash
# All dependencies already installed with XBRL system
python3 -m pip install duckdb  # Already installed
```

## Usage

### Basic Analysis

```bash
# Analyze a single company
./scripts/forensics/forensic_analyzer.py TCS

# Specify statement type
./scripts/forensics/forensic_analyzer.py TCS --statement-type consolidated

# Analyze multiple companies
./scripts/forensics/forensic_analyzer.py TCS RELIANCE INFY
```

### Advanced Options

```bash
# Analyze last 3 years only
./scripts/forensics/forensic_analyzer.py TCS --years 3

# Export to JSON
./scripts/forensics/forensic_analyzer.py TCS --output json

# Specify company type for Z-Score
./scripts/forensics/forensic_analyzer.py TCS --company-type service
```

### Company Types for Altman Z-Score
- `manufacturing`: Manufacturing companies (default)
- `service`: Service companies, non-manufacturers
- `emerging_market`: Companies in emerging markets

## Data Requirements

### Minimum Requirements
- **2 years** of financial data for year-over-year analysis
- **Standalone** or **Consolidated** financials
- Data stored in `data/fundamentals.duckdb`

### Recommended
- **5 years** of data for trend analysis
- **Q4 (Annual)** data for best results (system will use latest available quarter if Q4 missing)
- Both standalone and consolidated for comparison

## Output Interpretation

### Composite Risk Score

```
0-39:    LOW RISK - Financials appear healthy
40-69:   MEDIUM RISK - Some concerns, investigate further
70-100:  HIGH RISK - Critical issues detected, avoid
```

### Recommendations

1. **ACCEPTABLE**: Proceed with regular fundamental analysis
2. **MONITOR**: Acceptable with ongoing monitoring
3. **CAUTION**: Detailed investigation required
4. **AVOID**: Critical red flags, not suitable for investment

## Example Output

```
======================================================================
🔍 FORENSIC ANALYSIS: TCS
======================================================================
Statement Type: STANDALONE
Analysis Period: 5 years
======================================================================

📊 Loading financial data...
   ✓ Loaded 5 years of data

📈 Calculating Beneish M-Score (Earnings Manipulation)...
   M-Score: -2.45
   Risk: LOW

💼 Calculating Altman Z-Score (Bankruptcy Risk)...
   Z-Score: 4.52
   Risk: Safe

⭐ Calculating Piotroski F-Score (Fundamental Strength)...
   F-Score: 7/9
   Quality: Average Quality

💰 Calculating J-Score (Cash Flow Quality)...
   J-Score: 4
   Risk: Low
   Flags: 2

🚩 Running Red Flags Detection...
   Total Flags: 3
   High Severity: 0
   Medium Severity: 2
   Assessment: LOW_RISK

🎯 Calculating Composite Risk Score...
   Overall Risk: LOW
   Composite Score: 32.5/100

📝 Final Recommendation: MONITOR
   Some concerns present but not critical. Acceptable for further analysis.

======================================================================
```

## File Structure

```
scripts/forensics/
├── data_loader.py              # Load data from DuckDB
├── beneish_m_score.py          # M-Score calculator
├── altman_z_score.py           # Z-Score calculator
├── piotroski_f_score.py        # F-Score calculator
├── j_score.py                  # J-Score calculator
├── red_flags.py                # Red flags detector
└── forensic_analyzer.py        # Main analysis runner
```

## Integration with XBRL Pipeline

### Workflow

1. **Download XBRL files**
   ```bash
   ./scripts/fetch_nse_financial_results.py TCS
   ```

2. **Process XBRL files**
   ```bash
   ./scripts/xbrl_eod.py --symbol TCS
   ```

3. **Run forensic analysis**
   ```bash
   ./scripts/forensics/forensic_analyzer.py TCS
   ```

### Data Flow

```
NSE/BSE → XBRL Files → xbrl_eod.py → DuckDB → Forensic Analyzer → Report
```

## Understanding the Scores

### Beneish M-Score Components

| Component | What It Measures | Red Flag |
|-----------|-----------------|----------|
| DSRI | Receivables growth vs revenue | > 1.2 |
| GMI | Gross margin deterioration | > 1.1 |
| AQI | Asset quality decline | > 1.1 |
| SGI | Sales growth | > 1.465 |
| DEPI | Depreciation rate changes | > 1.1 |
| SGAI | SG&A expense growth | > 1.1 |
| TATA | Accruals quality | > 0.06 |
| LVGI | Leverage increase | > 1.2 |

### Altman Z-Score Components

| Component | Formula | Meaning |
|-----------|---------|---------|
| X1 | Working Capital / Total Assets | Liquidity |
| X2 | Retained Earnings / Total Assets | Profitability |
| X3 | EBIT / Total Assets | Operating efficiency |
| X4 | Market Value / Liabilities | Solvency |
| X5 | Sales / Total Assets | Asset turnover |

### Piotroski F-Score Signals

**Profitability (4 points):**
- Positive ROA
- Positive Operating Cash Flow
- Improving ROA
- Quality of Earnings (OCF > Net Income)

**Leverage/Liquidity (3 points):**
- Decreasing Debt
- Improving Current Ratio
- No Equity Dilution

**Operating Efficiency (2 points):**
- Improving Gross Margin
- Improving Asset Turnover

## Troubleshooting

### "No data available"
- Ensure XBRL files have been processed with `xbrl_eod.py`
- Check data exists: `duckdb data/fundamentals.duckdb "SELECT * FROM xbrl_data WHERE symbol='TCS'"`

### "Insufficient data"
- Need at least 2 years for analysis
- Process more XBRL files or use `--years 2` flag

### "High risk score but company looks good"
- Check individual model scores
- Review red flags details
- Compare with industry peers
- May be sector-specific patterns

## Advanced Usage

### Batch Analysis

```bash
# Create symbols list
cat > forensic_symbols.txt << EOF
TCS
RELIANCE
INFY
HDFCBANK
ICICIBANK
EOF

# Analyze all
for symbol in $(cat forensic_symbols.txt); do
    ./scripts/forensics/forensic_analyzer.py $symbol --output json
done
```

### JSON Export

```bash
# Export to JSON for custom processing
./scripts/forensics/forensic_analyzer.py TCS --output json

# Output: forensic_report_20251025_133045.json
```

### Database Queries

```bash
# View all processed data
duckdb data/fundamentals.duckdb "SELECT symbol, fy, quarter FROM xbrl_data ORDER BY symbol, fy"

# Check specific company
duckdb data/fundamentals.duckdb "
    SELECT fy, quarter, roe, debt_to_equity, current_ratio
    FROM xbrl_data
    WHERE symbol='TCS'
    ORDER BY fy DESC
"
```

## Best Practices

1. **Always analyze 5 years** when available for trend analysis
2. **Compare standalone vs consolidated** for group companies
3. **Run quarterly** when new results are published
4. **Cross-reference** with industry peers
5. **Investigate** all high-severity red flags
6. **Don't rely solely** on automated scores - use as screening tool

## Limitations

### What the System CAN'T Detect
- Fraud in non-financial disclosures
- Management quality/integrity
- Industry/macro changes
- Related party transactions (unless in notes)
- Off-balance sheet items
- Future growth potential

### Human Review Required For
- Auditor qualifications
- Contingent liabilities
- Pending litigation
- Regulatory issues
- Related party transactions rationale
- Business model sustainability

## Future Enhancements

Planned features:
- Peer comparison automation
- Industry benchmarks integration
- Quarterly trend analysis
- Alert system for deteriorating scores
- Visual dashboards
- PDF report generation
- Related party transaction analysis (from notes parsing)

## Support & Contribution

For issues or enhancements:
1. Check existing XBRL data is complete
2. Review error messages carefully
3. Test with known good companies first
4. Report issues with full error output

## References

- Beneish, M. D. (1999). "The Detection of Earnings Manipulation"
- Altman, Edward I. (1968). "Financial Ratios and Corporate Bankruptcy"
- Piotroski, Joseph D. (2000). "Value Investing"
- Indian Accounting Standards (Ind-AS)

---

**Last Updated:** October 25, 2025
**Version:** 1.0.0
