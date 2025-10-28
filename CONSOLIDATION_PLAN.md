# Company Report Consolidation Plan

**Date**: October 28, 2025
**Goal**: Consolidate 3 separate analysis scripts into one comprehensive report

## Current Scripts to Consolidate:

1. **scripts/analysis/enhanced_company_report_v2.py** (Base script - KEEP & ENHANCE)
   - Already has: Overview, Forensic Scores (basic), Technical, Valuation
   - Needs: Enhanced forensics, Quarterly financials, Peer comparison

2. **scripts/forensics/forensic_analyzer.py** (Detailed forensics)
   - Complete forensic breakdown with all models
   - Red flags detection
   - Should be integrated into Section 5

3. **scripts/reports/quarterly_financial_report.py** (Quarterly data)
   - Last 5 quarters financial metrics
   - Sector-specific metrics (Banking vs IT vs Others)
   - YoY and QoQ growth
   - Should be added to Section 3

## New Report Structure:

### Section 1: Company Overview ✅ (Already exists)
- Basic company info
- Market cap, Price, etc.

### Section 2: Financial Overview (NEW - from quarterly_financial_report.py)
- Last 5 quarters financial metrics
- Sector-specific metrics (Banking NII/NIM, etc.)
- Revenue & Profit trends
- YoY and QoQ growth

### Section 3: Peer Comparison (NEW - from quarterly_financial_report.py --compare)
- Compare with sector peers (TCS, INFY, WIPRO for IT)
- Side-by-side quarterly comparison
- Relative performance

### Section 4: Technical Analysis ✅ (Already exists)
- Price trends, Support/Resistance
- Volume analysis

### Section 5: Comprehensive Forensic Analysis (ENHANCED - from forensic_analyzer.py)
**Current**: Basic M-Score, Z-Score, F-Score, J-Score with 1-line each
**Enhanced to include**:
- Beneish M-Score: Full breakdown with all 8 ratios
- Altman Z-Score: Component analysis
- Piotroski F-Score: All 9 criteria
- J-Score: Detailed cash flow flags
- Red Flags Detection: Full list with severity
- Data validation warnings
- Overall risk assessment

### Section 6: Valuation ✅ (Already exists)
- DCF, PE, PB valuations

### Section 7: Final Recommendation ✅ (Already exists)
- BUY/HOLD/SELL with reasoning

## Implementation Steps:

1. ✅ Add QuarterlyFinancialReport import to enhanced_company_report_v2.py
2. ✅ Create Section 2: Financial Overview (quarterly data)
3. ✅ Create Section 3: Peer Comparison
4. ✅ Enhance Section 5: Detailed forensics from forensic_analyzer.py
5. ✅ Update command-line args to support --peers flag
6. ✅ Test with: `./scripts/analysis/enhanced_company_report_v2.py WIPRO --peers TCS INFY`
7. ✅ Move old scripts to scripts/tobedeleted/
8. ✅ Update documentation

## Command Line Interface:

```bash
# Single company comprehensive report
./scripts/analysis/enhanced_company_report_v2.py WIPRO

# With peer comparison
./scripts/analysis/enhanced_company_report_v2.py WIPRO --peers TCS INFY

# Or auto-detect peers from sector
./scripts/analysis/enhanced_company_report_v2.py WIPRO --compare-sector
```

## Files to Delete After Consolidation:

- ❌ scripts/forensics/forensic_analyzer.py (keep as library, but no standalone use)
- ❌ scripts/reports/quarterly_financial_report.py (functions integrated)

## Status: READY TO IMPLEMENT
