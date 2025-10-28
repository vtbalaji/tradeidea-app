# Shared Utilities

Reusable utility modules imported by other scripts.

## 📋 Modules Overview

### 1. `fundamental_metrics.py`
**Purpose:** Common fundamental ratio calculations

**Contains:**
- ROE, ROA, ROCE calculations
- Margin calculations
- Ratio utilities
- Reusable across all scripts

**Usage:**
```python
from shared.fundamental_metrics import calculate_roe, calculate_margins

roe = calculate_roe(net_profit, equity)
margins = calculate_margins(revenue, operating_profit, net_profit)
```

### 2. `forensic_scores.py`
**Purpose:** Forensic score calculation utilities

**Contains:**
- M-Score calculations
- Z-Score calculations
- F-Score calculations
- Shared forensic functions

**Usage:**
```python
from shared.forensic_scores import calculate_m_score

m_score = calculate_m_score(financial_data)
```

### 3. `valuation.py`
**Purpose:** Valuation models and methods

**Contains:**
- DCF (Discounted Cash Flow)
- Graham Number calculation
- Intrinsic value estimation
- Relative valuation methods

**Usage:**
```python
from shared.valuation import calculate_dcf, calculate_graham_number

intrinsic_value = calculate_dcf(cash_flows, discount_rate)
graham_value = calculate_graham_number(eps, book_value)
```

### 4. `load_env.py`
**Purpose:** Environment variable loader

**Usage:**
```python
from shared.load_env import load_environment

env = load_environment()
db_path = env.get('EOD_DB', 'data/eod.duckdb')
```

### 5. `__init__.py`
**Purpose:** Package initialization

## 🎯 Benefits

✅ **DRY Principle** - Don't Repeat Yourself
✅ **Consistency** - Same calculation across all scripts
✅ **Maintainability** - Fix once, applies everywhere
✅ **Testability** - Easy to unit test

## 📖 Adding New Utilities

When adding new shared code:

1. **Create module** in `scripts/shared/`
2. **Document functions** with docstrings
3. **Add to __init__.py** for easy imports
4. **Write tests** in `scripts/onetime/test_*.py`

**Example:**
```python
# scripts/shared/my_utility.py
def calculate_something(value):
    """
    Calculate something useful
    
    Args:
        value: Input value
        
    Returns:
        Calculated result
    """
    return value * 2
```

**Last Updated:** October 28, 2025
