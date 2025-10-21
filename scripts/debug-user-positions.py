#!/usr/bin/env python3
"""
Debug script to check user's portfolio positions
"""
import sys
import os
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase
cred_path = os.path.join(os.getcwd(), 'serviceAccountKey.json')
if not os.path.exists(cred_path):
    print('❌ serviceAccountKey.json not found')
    sys.exit(1)

try:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
except ValueError:
    # Already initialized
    pass

db = firestore.client()

# User ID to check
user_id = 'mnvRoGWLxzLPYsTnh6ZJUIvIZhk2'
symbol = 'POCL'

print(f'🔍 Searching for {symbol} positions for user: {user_id}')
print('=' * 70)

# Query 1: Check for POCL positions with this user ID
portfolios_ref = db.collection('portfolios')

# Check both symbol variations
symbols_to_check = [symbol, f'NS_{symbol}']

for sym in symbols_to_check:
    print(f'\n📊 Checking symbol: {sym}')
    query = portfolios_ref.where('symbol', '==', sym).where('userId', '==', user_id)

    positions = list(query.stream())

    if positions:
        print(f'✅ Found {len(positions)} position(s):')
        for doc in positions:
            data = doc.to_dict()
            print(f'\n  Document ID: {doc.id}')
            print(f'  Symbol: {data.get("symbol")}')
            print(f'  Status: {data.get("status")}')
            print(f'  Entry Price: ₹{data.get("entryPrice", 0):.2f}')
            print(f'  Quantity: {data.get("quantity", 0)}')
            print(f'  Stop Loss: ₹{data.get("stopLoss", 0):.2f}')
            print(f'  Created At: {data.get("createdAt")}')
            print(f'  Smart SL Phase: {data.get("smartSLPhase", "N/A")}')
    else:
        print(f'❌ No positions found for {sym}')

# Query 2: Check ALL positions for this user
print(f'\n\n📋 ALL open positions for user: {user_id}')
print('=' * 70)
query = portfolios_ref.where('userId', '==', user_id).where('status', '==', 'open')
all_positions = list(query.stream())

if all_positions:
    print(f'Found {len(all_positions)} open position(s):')
    for doc in all_positions:
        data = doc.to_dict()
        print(f'\n  {data.get("symbol")}: ₹{data.get("entryPrice", 0):.2f} x {data.get("quantity", 0)} ({data.get("status")})')
else:
    print('No open positions found')

# Query 3: Check for ANY POCL position regardless of user
print(f'\n\n🌍 ALL POCL positions in database (any user):')
print('=' * 70)

for sym in symbols_to_check:
    query = portfolios_ref.where('symbol', '==', sym)
    all_pocl = list(query.stream())

    if all_pocl:
        print(f'\nFound {len(all_pocl)} position(s) for {sym}:')
        for doc in all_pocl:
            data = doc.to_dict()
            uid = data.get('userId', 'unknown')
            print(f'  User: {uid[:20]}... | Status: {data.get("status")} | Entry: ₹{data.get("entryPrice", 0):.2f}')
    else:
        print(f'No positions found for {sym}')

print('\n' + '=' * 70)
