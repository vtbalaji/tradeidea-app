# Remaining Changes - 98% Complete!

**Status**: Just 2 small changes left
**Time**: ~3 minutes to complete

---

## ✅ Already Done (98%):
1. ✅ Signature updated: `generate_report(..., peers=None)`
2. ✅ Quarterly financials section added (line 1376-1383)
3. ✅ Peer comparison section added (line 1385-1393)

---

## Change 1: Enhanced Forensics Display (Line ~1450)

**Find this in `_print_comprehensive_report()` method** (around line 1450-1480):
```python
        # Forensic Analysis Section
        print(f'\n{"="*80}')
        print('🔍 FORENSIC ANALYSIS')
        print(f'{"="*80}')
```

**REPLACE with:**
```python
        # Forensic Analysis Section - ENHANCED
        print(f'\n{"="*80}')
        print('🔍 SECTION 5: COMPREHENSIVE FORENSIC ANALYSIS')
        print(f'{"="*80}')

        try:
            ReportDisplays.print_detailed_forensics(forensic)
        except Exception as e:
            print(f'⚠️  Error displaying detailed forensics: {e}')
            # Fallback to basic display
            if 'M_Score' in forensic:
                print(f"   M-Score: {forensic['M_Score'].get('M_Score', 'N/A')}")
            if 'Z_Score' in forensic:
                print(f"   Z-Score: {forensic['Z_Score'].get('Z_Score', 'N/A')}")
            if 'F_Score' in forensic:
                print(f"   F-Score: {forensic['F_Score'].get('F_Score', 'N/A')}")
```

---

## Change 2: Update main() CLI Arguments (Line ~1550)

**Find the main() function** (around line 1550):
```python
def main():
    parser = argparse.ArgumentParser(description='Enhanced Company Analysis Report V2')
    parser.add_argument('symbol', help='Stock symbol (e.g., TCS, RELIANCE)')
    parser.add_argument('--years', type=int, default=5, help='Number of years for analysis (default: 5)')
    parser.add_argument('--sector', default='IT', help='Company sector (default: IT)')
```

**ADD these 2 lines:**
```python
    parser.add_argument('--peers', nargs='+', help='Peer companies to compare (e.g., --peers TCS INFY WIPRO)')
    parser.add_argument('--compare-sector', action='store_true', help='Auto-compare with sector peers')
```

**Find where report is generated** (a few lines below):
```python
    report = generator.generate_report(args.symbol, years=args.years, sector=args.sector)
```

**REPLACE with:**
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

## Testing After Changes

```bash
# Basic report with quarterly financials
./scripts/analysis/enhanced_company_report_v2.py WIPRO

# With specific peers
./scripts/analysis/enhanced_company_report_v2.py WIPRO --peers TCS INFY

# With auto sector comparison
./scripts/analysis/enhanced_company_report_v2.py WIPRO --sector IT --compare-sector
```

---

## What You'll Get

### Section 1: Company Overview ✅
- Already works

### Section 2: Quarterly Financials ✅ (NEW!)
- Last 5 quarters
- Revenue, Profit, Margins
- YoY growth

### Section 3: Peer Comparison ✅ (NEW!)
- Side-by-side metrics
- Only shows if --peers provided

### Section 4: Technical Analysis ✅
- Already works

### Section 5: Comprehensive Forensics ✅ (ENHANCED!)
- M-Score: All 8 ratios explained
- Z-Score: Component breakdown
- F-Score: All 9 criteria
- J-Score: Detailed flags
- Red Flags: Full list

### Section 6: Valuation ✅
- Already works

### Section 7: Recommendation ✅
- Already works

---

## Consolidation Complete! 🎉

Once these 2 changes are done:
- 3 scripts consolidated into 1
- Modular architecture maintained
- All functionality integrated
- Peer comparison working
- Detailed forensics working
