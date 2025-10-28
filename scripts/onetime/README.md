# One-time & Test Scripts

Scripts for testing, validation, and one-time operations. These scripts are not part of regular workflows.

## 📋 Scripts Overview

### Test Scripts

#### 1. `test_xbrl_v3.py`
**Purpose:** Test XBRL parser v3
**Usage:**
```bash
python scripts/onetime/test_xbrl_v3.py --file xbrl/TCS_FY2025_Q2.xml
```

#### 2. `test_xbrl_pipeline.py`
**Purpose:** Test complete XBRL processing pipeline
**Usage:**
```bash
python scripts/onetime/test_xbrl_pipeline.py
```

#### 3. `test_xbrl_comprehensive_v2.py`
**Purpose:** Comprehensive XBRL tests with validation
**Usage:**
```bash
python scripts/onetime/test_xbrl_comprehensive_v2.py
```

### Data Extraction Scripts

#### 4. `extract_metrics_for_validation.py`
**Purpose:** Extract metrics for validation purposes
**Usage:**
```bash
python scripts/onetime/extract_metrics_for_validation.py --symbol TCS
```

#### 5. `extract_test_data_metrics.py`
**Purpose:** Extract test data for unit tests
**Usage:**
```bash
python scripts/onetime/extract_test_data_metrics.py
```

## ⚠️ Note

These scripts are for:
- Testing new features
- One-time data operations
- Validation and debugging
- Development purposes

**Not intended for production use or regular workflows.**

**Last Updated:** October 28, 2025
