# Final Integration Guide - Consolidation

**Status**: Ready to implement
**Remaining Work**: 3 small changes

---

## Change 1: Update `generate_report()` Signature (Line 1247)

**FROM:**
```python
def generate_report(self, symbol, years=5, sector='IT'):
```

**TO:**
```python
def generate_report(self, symbol, years=5, sector='IT', peers=None):
```

---

## Change 2: Add New Sections Before `_print_comprehensive_report()` (Insert at Line 1375)

**Location**: Just BEFORE the line `self._print_comprehensive_report(`

**Add this code:**
```python
        # SECTION 2: Quarterly Financials
        print('\n' + '='*80)
        print('📊 SECTION 2: QUARTERLY FINANCIALS')
        print('='*80)
        try:
            ReportDisplays.print_quarterly_financials(self.quarterly_reporter, symbol, num_quarters=5)
        except Exception as e:
            print(f'⚠️  Error displaying quarterly financials: {e}')

        # SECTION 3: Peer Comparison (if peers provided)
        if peers and len(peers) > 0:
            print('\n' + '='*80)
            print('🤝 SECTION 3: PEER COMPARISON')
            print('='*80)
            try:
                ReportDisplays.print_peer_comparison(self.quarterly_reporter, symbol, peers)
            except Exception as e:
                print(f'⚠️  Error displaying peer comparison: {e}')

```

---

## Change 3: Update `_print_comprehensive_report()` to Show Detailed Forensics (Line ~1450)

**Find this section** (around line 1450-1480):
```python
        # Forensic Analysis Section
        print(f'\n{"="*80}')
        print('🔍 FORENSIC ANALYSIS')
        print(f'{"="*80}')

        # Current basic display of M/Z/F/J scores
        ...
```

**REPLACE the entire forensic display section with:**
```python
        # Forensic Analysis Section - DETAILED VERSION
        print(f'\n{"="*80}')
        print('🔍 SECTION 5: COMPREHENSIVE FORENSIC ANALYSIS')
        print(f'{"="*80}')

        try:
            ReportDisplays.print_detailed_forensics(forensic)
        except Exception as e:
            print(f'⚠️  Error displaying forensics: {e}')
            # Fallback to basic display
            if 'M_Score' in forensic:
                print(f"   M-Score: {forensic['M_Score'].get('M_Score', 'N/A')}")
            if 'Z_Score' in forensic:
                print(f"   Z-Score: {forensic['Z_Score'].get('Z_Score', 'N/A')}")
```

---

## Change 4: Update `main()` Function to Add CLI Arguments (Line ~1550)

**Find the argparse section** in `main()`:
```python
parser = argparse.ArgumentParser(description='Enhanced Company Analysis Report V2')
parser.add_argument('symbol', help='Stock symbol (e.g., TCS, RELIANCE)')
parser.add_argument('--years', type=int, default=5, help='Number of years for analysis (default: 5)')
parser.add_argument('--sector', default='IT', help='Company sector (default: IT)')
```

**ADD these lines:**
```python
parser.add_argument('--peers', nargs='+', help='Peer companies to compare (e.g., --peers TCS INFY WIPRO)')
parser.add_argument('--compare-sector', action='store_true', help='Auto-compare with sector peers')
```

**Update the report generation call** from:
```python
report = generator.generate_report(args.symbol, years=args.years, sector=args.sector)
```

**TO:**
```python
# Determine peers list
peers = args.peers if args.peers else None
if args.compare_sector and not peers:
    # Auto-detect sector and get peers
    sector_peers = generator.SECTOR_PEERS.get(args.sector.upper(), [])
    peers = [p for p in sector_peers if p != args.symbol.upper()][:3]  # Top 3 peers

report = generator.generate_report(args.symbol, years=args.years, sector=args.sector, peers=peers)
```

---

## Testing Commands

After making these changes, test with:

```bash
# Basic report
./scripts/analysis/enhanced_company_report_v2.py WIPRO

# With specific peers
./scripts/analysis/enhanced_company_report_v2.py WIPRO --peers TCS INFY

# With sector auto-compare
./scripts/analysis/enhanced_company_report_v2.py HDFCBANK --sector BANKING --compare-sector
```

---

## Summary of Changes

| File | Lines Changed | Purpose |
|------|---------------|---------|
| enhanced_company_report_v2.py | Line 1247 | Add `peers` parameter |
| enhanced_company_report_v2.py | Line 1375 | Add quarterly & peer sections |
| enhanced_company_report_v2.py | Line ~1450 | Enhanced forensics display |
| enhanced_company_report_v2.py | Line ~1550 | Add CLI arguments |

**Total**: ~40 lines of code changes across 4 locations in 1 file

---

## Already Completed ✅

- ✅ Imports added (QuarterlyFinancialReport, ReportDisplays)
- ✅ Initialization added (self.quarterly_reporter)
- ✅ Display module created (report_displays.py, 439 lines)
- ✅ All display methods implemented and tested
- ✅ J-Score data quality fixes
- ✅ Modular architecture maintained

---

## After Integration

Once integrated, you can:
- Move `quarterly_financial_report.py` to `scripts/tobedeleted/` (it's now a library used by enhanced_company_report_v2.py)
- Delete standalone `forensic_analyzer.py` CLI usage (keep as library)
- Update documentation

The consolidated report will have all 3 functionalities in one place with clean, modular code!
