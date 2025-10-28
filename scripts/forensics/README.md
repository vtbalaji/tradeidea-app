# Forensic Accounting Scripts

Scripts for detecting financial fraud, earnings manipulation, and bankruptcy risk using forensic accounting models.

## 📋 Scripts Overview

### 1. `forensic_analyzer.py` - Main Analyzer
**Purpose:** Orchestrate all forensic tests

**Usage:**
```bash
python scripts/forensics/forensic_analyzer.py --symbol TCS
```

### 2. `beneish_m_score.py` - Earnings Manipulation Detection
**Purpose:** Detect earnings manipulation (M-Score)

**Interpretation:**
- M-Score < -2.22: Low risk ✅
- M-Score > -2.22: Potential manipulator ⚠️

**Usage:**
```bash
python scripts/forensics/beneish_m_score.py --symbol TCS
```

### 3. `altman_z_score.py` - Bankruptcy Risk
**Purpose:** Predict bankruptcy risk (Z-Score)

**Interpretation:**
- Z > 2.99: Safe zone ✅
- 1.81 < Z < 2.99: Grey zone ⚠️
- Z < 1.81: Distress zone 🚨

**Usage:**
```bash
python scripts/forensics/altman_z_score.py --symbol TCS
```

### 4. `piotroski_f_score.py` - Financial Strength
**Purpose:** Measure financial strength (F-Score)

**Interpretation:**
- F-Score 8-9: Strong ✅
- F-Score 5-7: Average
- F-Score 0-4: Weak 🚨

**Usage:**
```bash
python scripts/forensics/piotroski_f_score.py --symbol TCS
```

### 5. `j_score.py` - J-Score
**Purpose:** Additional forensic analysis

**Usage:**
```bash
python scripts/forensics/j_score.py --symbol TCS
```

### 6. `red_flags.py` - Red Flags Detection
**Purpose:** Identify accounting red flags

**Detects:**
- Revenue recognition issues
- Inventory buildup
- Receivables growth > Revenue growth
- Cash flow vs. Profit discrepancies
- Frequent restatements
- Related party transactions

**Usage:**
```bash
python scripts/forensics/red_flags.py --symbol TCS
```

### 7. `data_loader.py` - Data Loading Utilities
**Purpose:** Load financial data for forensic analysis

### 8. `data_validator.py` - Data Validation
**Purpose:** Validate data quality before analysis

### 9. `multi_source_loader.py` - Multi-source Data Loader
**Purpose:** Load from multiple data sources

### 10. `test_multi_source.py` - Test Multi-source Loading

## 🔄 Typical Workflow

```bash
# Run complete forensic analysis
python scripts/forensics/forensic_analyzer.py --symbol TCS

# Or run individual tests
python scripts/forensics/beneish_m_score.py --symbol TCS
python scripts/forensics/altman_z_score.py --symbol TCS
python scripts/forensics/piotroski_f_score.py --symbol TCS
python scripts/forensics/red_flags.py --symbol TCS
```

## 🚨 Red Flags to Watch

1. **M-Score > -2.22** - Possible earnings manipulation
2. **Z-Score < 1.81** - Bankruptcy risk
3. **F-Score < 5** - Weak financials
4. **Revenue > Cash** - Cash flow issues
5. **Growing receivables** - Collection problems

## 🔗 Used By

- `scripts/analysis/enhanced_company_report_v2.py` - Includes all forensic scores

**Last Updated:** October 28, 2025
