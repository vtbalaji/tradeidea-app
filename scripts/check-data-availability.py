#!/usr/bin/env python3
"""
Check data availability for symbols in Firestore
Shows which symbols have sufficient technical and fundamental data
"""

import firebase_admin
from firebase_admin import credentials, firestore
import sys
import os
from datetime import datetime, timedelta

# Initialize Firebase
cred_path = os.path.join(os.getcwd(), 'serviceAccountKey.json')
if not os.path.exists(cred_path):
    print('❌ serviceAccountKey.json not found')
    sys.exit(1)

try:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
except ValueError:
    pass

db = firestore.client()

def check_symbol_data(symbol):
    """Check if a symbol has sufficient technical and fundamental data"""
    doc = db.collection('symbols').document(symbol).get()
    
    if not doc.exists:
        return {
            'symbol': symbol,
            'exists': False,
            'hasTechnical': False,
            'hasFundamental': False,
            'technicalFields': 0,
            'fundamentalFields': 0
        }
    
    data = doc.to_dict()
    technical = data.get('technical', {})
    fundamental = data.get('fundamental', {})
    
    # Count non-null fields in technical data
    technical_fields = sum(1 for v in technical.values() if v is not None and v != 0)
    
    # Count non-null fields in fundamental data
    fundamental_fields = sum(1 for v in fundamental.values() if v is not None and v != 0)
    
    return {
        'symbol': symbol,
        'exists': True,
        'hasTechnical': bool(technical and technical_fields > 5),
        'hasFundamental': bool(fundamental and fundamental_fields > 5),
        'technicalFields': technical_fields,
        'fundamentalFields': fundamental_fields,
        'lastFetched': data.get('lastFetched', None)
    }

def main():
    # If symbol provided as argument, check just that one
    if len(sys.argv) > 1:
        symbol = sys.argv[1].upper()
        if not symbol.startswith('NS_'):
            symbol = f'NS_{symbol}'
        
        result = check_symbol_data(symbol)
        print(f"\n📊 Data Availability for {result['symbol']}")
        print("=" * 50)
        print(f"Exists in Firestore: {'✅' if result['exists'] else '❌'}")
        print(f"Technical Data: {'✅' if result['hasTechnical'] else '❌'} ({result['technicalFields']} fields)")
        print(f"Fundamental Data: {'✅' if result['hasFundamental'] else '❌'} ({result['fundamentalFields']} fields)")
        print(f"Last Fetched: {result.get('lastFetched', 'Never')}")
        
        if not result['hasTechnical']:
            print("\n⚠️  Missing technical data - Run: ./scripts/daily-eod-batch.sh")
        if not result['hasFundamental']:
            print("⚠️  Missing fundamental data - Run: ./scripts/weekly-fundamentals-batch.sh")
        
        return
    
    # Otherwise check all symbols
    print("\n🔍 Checking data availability for all symbols...")
    symbols_ref = db.collection('symbols').limit(100).stream()
    
    total = 0
    with_technical = 0
    with_fundamental = 0
    with_both = 0
    
    print("\n📋 Sample of symbols:")
    print("-" * 80)
    print(f"{'Symbol':<20} {'Technical':<12} {'Fundamental':<12} {'Last Updated'}")
    print("-" * 80)
    
    for doc in symbols_ref:
        total += 1
        data = doc.to_dict()
        technical = data.get('technical', {})
        fundamental = data.get('fundamental', {})
        
        has_tech = bool(technical and len([v for v in technical.values() if v]) > 5)
        has_fund = bool(fundamental and len([v for v in fundamental.values() if v]) > 5)
        
        if has_tech:
            with_technical += 1
        if has_fund:
            with_fundamental += 1
        if has_tech and has_fund:
            with_both += 1
        
        # Print first 10 as sample
        if total <= 10:
            tech_status = '✅ Yes' if has_tech else '❌ No'
            fund_status = '✅ Yes' if has_fund else '❌ No'
            last_updated = data.get('lastFetched', 'Never')
            if hasattr(last_updated, 'strftime'):
                last_updated = last_updated.strftime('%Y-%m-%d')
            print(f"{doc.id:<20} {tech_status:<12} {fund_status:<12} {str(last_updated)}")
    
    print("-" * 80)
    print(f"\n📊 Summary (first 100 symbols):")
    print(f"Total symbols checked: {total}")
    print(f"With technical data: {with_technical} ({with_technical/total*100:.1f}%)")
    print(f"With fundamental data: {with_fundamental} ({with_fundamental/total*100:.1f}%)")
    print(f"With BOTH (ready for analysis): {with_both} ({with_both/total*100:.1f}%)")
    
    if with_both < total:
        print("\n💡 Recommendations:")
        if with_technical < total:
            print(f"   Run daily EOD batch to populate technical data")
            print(f"   Command: ./scripts/daily-eod-batch.sh")
        if with_fundamental < total:
            print(f"   Run weekly fundamentals batch to populate fundamental data")
            print(f"   Command: ./scripts/weekly-fundamentals-batch.sh")

if __name__ == '__main__':
    main()
