# Sector Analysis Fixes - 2025-10-30

## Issues Fixed

### 1. IT Sector Showing Zero Values ✅

**Problem:**
- IT sector reports showed 0 for all metrics (revenue/employee, margins, etc.)
- Database had the data but sector analyzer couldn't access it

**Root Cause:**
- Fund data from forensic analyzer didn't include calculated ratio fields
- IT analyzer was looking for `headcount` field that doesn't exist in XBRL
- Field name mismatch: `operating_margin` vs `operating_profit_margin`

**Solution:**
1. **Enriched fund_data** in `enhanced_company_report_v2.py:1361-1389`
   - Added query to fetch margins from database before passing to sector analyzer
   - Now fetches: `ebitda_margin`, `operating_profit_margin`, `net_profit_margin`, `roe`, `roa`, `roce`

2. **Updated IT analyzer** to estimate headcount (`sectors/it_sector.py:107-116`)
   ```python
   # Estimate headcount from employee benefits if not available
   if headcount == 0 and raw_employee_benefits > 0:
       avg_cost_per_employee = 1800000  # 18 lakhs in rupees
       headcount = int(raw_employee_benefits / avg_cost_per_employee)

   # Calculate revenue per employee
   if revenue_per_emp == 0 and headcount > 0 and raw_revenue > 0:
       revenue_per_emp = (raw_revenue / 100000) / headcount
   ```

3. **Fixed field name mismatch** (`sectors/it_sector.py:153`)
   - Changed `operating_margin` → `operating_profit_margin`
   - Changed `net_margin` → `net_profit_margin`

**Result:**
TCS report now shows:
- Revenue/Employee: 31.8 lakhs ✅
- Headcount: 727,922 (estimated) ✅
- EBITDA Margin: 26.9% ✅
- Operating Margin: 24.8% ✅
- Net Margin: 18.4% ✅

**Note:** Attrition and Utilization still show 0 because these aren't in XBRL data. Would need to be added from company presentations/annual reports.

---

### 2. Shell Script Case Sensitivity Bug ✅

**Problem:**
```bash
./scripts/analysis/generate_investment_report.sh bhel  # lowercase
# Generated: enhanced_report_v2_BHEL_*.json
# But looked for: enhanced_report_v2_bhel_*.json  ❌
# Error: JSON report not generated for bhel
```

**Root Cause:**
- Python script converts symbol to uppercase when saving files
- Shell script didn't convert input, so wildcard pattern failed

**Solution:**
Updated `generate_investment_report.sh:8-20`:
```bash
SYMBOL_INPUT=$1
# Convert symbol to uppercase for consistency
SYMBOL=$(echo "$SYMBOL_INPUT" | tr '[:lower:]' '[:upper:]')
```

**Result:**
```bash
./scripts/analysis/generate_investment_report.sh bhel 3 CAPITAL_GOODS
# Now works! ✅
```

---

## Summary of Available Scripts

### 1. **quick_report.py** (Recommended - Most Reliable)
```bash
venv/bin/python scripts/analysis/quick_report.py BHEL 3
venv/bin/python scripts/analysis/quick_report.py TCS 3 IT
venv/bin/python scripts/analysis/quick_report.py HDFCBANK 5 BANKING
```
- Handles all edge cases
- Uses Python's glob for reliable file finding
- Works with upper or lowercase input
- Best for automation

### 2. **generate_investment_report.sh** (Now Fixed)
```bash
./scripts/analysis/generate_investment_report.sh BHEL 3
./scripts/analysis/generate_investment_report.sh bhel 3  # Now works!
./scripts/analysis/generate_investment_report.sh HDFCBANK 5 BANKING
```
- Bash script for command line convenience
- Now handles case conversion
- Good for manual usage

### 3. **enhanced_company_report_v2.py** (Direct)
```bash
venv/bin/python scripts/analysis/enhanced_company_report_v2.py BHEL --years 3 --sector CAPITAL_GOODS --output json
# Then manually run:
venv/bin/python scripts/analysis/generate_pdf_report.py enhanced_report_v2_BHEL_*.json
```
- Direct script execution
- Two-step process
- Use only if you need intermediate JSON for processing

---

## Available Sectors with Analysis

| Sector | Symbols | Key Metrics |
|--------|---------|-------------|
| **Banking** | HDFCBANK, ICICIBANK, SBIN, AXISBANK, KOTAKBANK | GNPA, NNPA, NIM, CASA, CAR, PCR |
| **IT** | TCS, INFY, WIPRO, HCLTECH, TECHM | Revenue/Employee, EBITDA Margin, Headcount (est.) |
| **Capital Goods** | BHEL, LT, ABB, SIEMENS, THERMAX | Order Book, Execution, ROC, Working Capital |

---

## Known Limitations

### IT Sector
- ✅ Revenue per employee: Calculated from employee benefits
- ✅ Margins: From database
- ❌ Attrition rate: Not in XBRL (shows 0)
- ❌ Utilization rate: Not in XBRL (shows 0)
- ❌ Digital revenue %: Not in XBRL (shows 0)

### Capital Goods
- ❌ Order book: Not in XBRL for BHEL (shows 0)
- ✅ All other metrics: Calculated from balance sheet

### Future Enhancements
To get missing metrics, need to:
1. Parse investor presentations (PDF extraction)
2. Parse annual report narratives (MD&A section)
3. Add manual data entry interface
4. Integrate external data sources (Screener, Tijori, etc.)

---

## Testing Summary

### IT Sector (TCS)
```bash
venv/bin/python scripts/analysis/quick_report.py TCS 3 IT
```
**Result:** ✅ All margins showing correctly

### Capital Goods (BHEL)
```bash
venv/bin/python scripts/analysis/quick_report.py BHEL 3 CAPITAL_GOODS
# or
./scripts/analysis/generate_investment_report.sh bhel 3 CAPITAL_GOODS
```
**Result:** ✅ Shell script works with lowercase input

### Banking (HDFCBANK)
```bash
venv/bin/python scripts/analysis/quick_report.py HDFCBANK 5 BANKING
```
**Result:** ✅ All banking metrics working (already tested in previous session)

---

## Recommendation

**Use `quick_report.py` for all report generation:**
```bash
venv/bin/python scripts/analysis/quick_report.py <SYMBOL> [YEARS] [SECTOR]
```

This script:
- Handles all edge cases
- Works reliably across all sectors
- Automatically generates both JSON and HTML
- Provides clear error messages
- Cross-platform compatible

---

## Files Modified

1. `/scripts/analysis/enhanced_company_report_v2.py` (lines 1361-1389)
   - Added margin fields to data enrichment query

2. `/scripts/analysis/sectors/it_sector.py` (lines 107-116, 153)
   - Added headcount estimation from employee benefits
   - Added revenue per employee calculation
   - Fixed field name mismatches

3. `/scripts/analysis/generate_investment_report.sh` (lines 8-20)
   - Added uppercase conversion for symbol

---

*Last Updated: 2025-10-30 10:00*
