# Companies Ready for Forensic Analysis

**Generated:** October 25, 2025

## Summary

We have **60+ companies** with XBRL data, but varying levels of completeness. Here's what's available for forensic analysis:

## Best Companies for Full Analysis

These companies have **multiple quarters** across **2 financial years** with **standalone** data:

### ⭐ Top Tier (3 quarters including Q4)

| Symbol | Statement Type | Quarters Available | Periods |
|--------|---------------|-------------------|---------|
| **RELIANCE** | Standalone | 3 | FY2025-Q4, FY2026-Q1, FY2026-Q2 |
| **TCS** | Standalone | 3 | FY2025-Q4, FY2026-Q1, FY2026-Q2 |
| **INFY** | Standalone | 3 | FY2025-Q4, FY2026-Q1, FY2026-Q2 |
| **360ONE** | Standalone | 3 | FY2025-Q4, FY2026-Q1, FY2026-Q2 |
| **ANGELONE** | Standalone | 3 | FY2025-Q4, FY2026-Q1, FY2026-Q2 |
| **ABSLAMC** | Standalone | 3 | FY2025-Q4, FY2026-Q1, FY2026-Q2 |
| **ANURAS** | Standalone | 3 | FY2025-Q4, FY2026-Q1, FY2026-Q2 |

### ⭐ Top Tier (3 quarters consolidated)

| Symbol | Statement Type | Quarters Available | Periods |
|--------|---------------|-------------------|---------|
| **WIPRO** | Consolidated | 3 | FY2025-Q4, FY2026-Q1, FY2026-Q2 |
| **ANANDRATHI** | Consolidated | 3 | FY2025-Q4, FY2026-Q1, FY2026-Q2 |

## Forensic Analysis Example - RELIANCE

Based on 3 quarters of data (Q4-FY2025, Q1-FY2026, Q2-FY2026):

### Results Summary

```
📊 RELIANCE Standalone Analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Financial Data (3 Quarters):
  • FY2026 Q2: Revenue ₹130,610 Cr, Profit ₹9,129 Cr
  • FY2026 Q1: Revenue ₹121,369 Cr, Profit ₹17,904 Cr
  • FY2025 Q4: Revenue ₹136,147 Cr, Profit ₹11,217 Cr

Forensic Scores:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 Beneish M-Score: 3.60 (HIGH RISK)
   Status: ⚠️ MANIPULATOR FLAG
   Analysis: Q2 vs Q1 comparison shows red flags

💼 Altman Z-Score: 12.44 (SAFE)
   Bankruptcy Risk: Very Low (<10%)
   Analysis: Strong financial position

⭐ Piotroski F-Score: 3/9 (LOW QUALITY)
   Investment Quality: Low
   Analysis: Weak fundamentals on quarterly comparison

Key Findings:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Strong solvency (Z-Score 12.44)
✓ Gross margin improving
⚠️ M-Score indicates potential manipulation
⚠️ Low F-Score suggests weak quarter-over-quarter performance
⚠️ Profit volatility (₹17,904 Cr → ₹9,129 Cr)
```

## Analysis Capabilities by Data Completeness

### With 3 Quarters (Current Data)

✅ **Can Analyze:**
- Altman Z-Score (latest quarter)
- Beneish M-Score (Q2 vs Q1 or Q4 vs earlier)
- Piotroski F-Score (quarterly comparison)
- Red Flags (latest quarter)
- Trend analysis (3-quarter trend)

❌ **Cannot Analyze:**
- Multi-year J-Score (needs 2+ years of Q4 data)
- Long-term trend analysis (needs 3-5 years)
- Full year-over-year comparison (needs matching quarters)

### With Ideal Data (5 Years of Q4)

✅ **Can Analyze Everything:**
- All 5 forensic models fully
- Multi-year trends
- Seasonality detection
- Comprehensive risk assessment

## How to Run Analysis

### Quick Analysis (Current Data)

```bash
# Best companies for current analysis
./scripts/forensics/forensic_analyzer.py RELIANCE --statement-type standalone
./scripts/forensics/forensic_analyzer.py TCS --statement-type standalone
./scripts/forensics/forensic_analyzer.py INFY --statement-type standalone
./scripts/forensics/forensic_analyzer.py WIPRO --statement-type consolidated
```

### Batch Analysis

```bash
# Analyze all top companies
for symbol in RELIANCE TCS INFY WIPRO ANGELONE 360ONE; do
    echo "Analyzing $symbol..."
    ./scripts/forensics/forensic_analyzer.py $symbol --statement-type standalone --output json
done
```

### Compare Standalone vs Consolidated

```bash
# For companies with both types
./scripts/forensics/forensic_analyzer.py TCS --statement-type standalone > tcs_standalone.txt
./scripts/forensics/forensic_analyzer.py TCS --statement-type consolidated > tcs_consolidated.txt
diff tcs_standalone.txt tcs_consolidated.txt
```

## Interpretation Guide for Quarterly Analysis

### ⚠️ Important Caveats

1. **Quarterly vs Annual Data**
   - Quarterly comparisons are more volatile
   - Seasonal patterns may affect ratios
   - Annual (Q4) data is more reliable

2. **Single Year Limitation**
   - We have FY2025 Q4 and FY2026 Q1-Q2
   - This is essentially 1 year of data
   - Some models show "INSUFFICIENT_DATA"

3. **M-Score on Quarterly Data**
   - Designed for annual data
   - Quarterly comparison may show false positives
   - Use with caution

### ✅ Reliable Metrics with Current Data

1. **Altman Z-Score** - Very reliable, point-in-time measure
2. **Red Flags Detection** - Works well on latest quarter
3. **Liquidity Ratios** - Current ratio, quick ratio accurate
4. **Profitability Margins** - Reliable for latest quarter

### ⚠️ Less Reliable with Quarterly Data

1. **Beneish M-Score** - May show false positives
2. **Piotroski F-Score** - Better with annual data
3. **J-Score** - Needs multiple years

## Recommendations

### For Best Results NOW

1. **Use RELIANCE, TCS, or INFY standalone data**
2. **Focus on Altman Z-Score and Red Flags**
3. **Treat M-Score as indicative only**
4. **Compare multiple companies** to identify outliers

### For Future (Complete Analysis)

1. **Download historical Q4 data**
   - FY2024 Q4 (Mar 2024)
   - FY2023 Q4 (Mar 2023)
   - FY2022 Q4 (Mar 2022)

2. **Process historical files**
   ```bash
   ./scripts/xbrl_eod.py --dir xbrl/
   ```

3. **Then run full analysis**
   ```bash
   ./scripts/forensics/forensic_analyzer.py RELIANCE --years 5
   ```

## Companies by Data Quality

### Excellent (3 quarters, 2 FYs)
RELIANCE, TCS, INFY, 360ONE, ANGELONE, ABSLAMC, WIPRO, ANANDRATHI, ANURAS

### Good (2 quarters, 2 FYs)
AFFLE, APLLTD, AEGISLOG, AJANTPHARM, APTUS, ABDL, APOLLOTYRE, AGARWALEYE, AFCONS, AEGISVOPAK

### Limited (2 quarters, 1 FY)
Many others - can do basic analysis only

## Next Steps

1. **Try analysis on top companies** listed above
2. **Download more historical XBRL files** for comprehensive analysis
3. **Run batch analysis** to find best investment opportunities
4. **Compare peer companies** in same sector

---

**Note:** The forensic system works with available data but gives better results with 3-5 years of annual (Q4) data. Current quarterly analysis is useful but should be interpreted with caution.
