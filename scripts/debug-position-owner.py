#!/usr/bin/env python3
"""
Debug script to check position ownership
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

# Position IDs from the notifications
position_ids = ['bLNXA2wFwCO4Nsow1LgN', '3ppMKRmgpc4xNJDg8uFo']
expected_user = 'mnvRoGWLxzLPYsTnh6ZJUIvIZhk2'

print('🔍 Checking position ownership')
print('=' * 70)

portfolios_ref = db.collection('portfolios')

for pos_id in position_ids:
    print(f'\nPosition ID: {pos_id}')
    doc = portfolios_ref.document(pos_id).get()

    if doc.exists:
        data = doc.to_dict()
        actual_user = data.get('userId')
        symbol = data.get('symbol')
        status = data.get('status')
        entry_price = data.get('entryPrice', 0)

        print(f'  Symbol: {symbol}')
        print(f'  Status: {status}')
        print(f'  Entry Price: ₹{entry_price:.2f}')
        print(f'  Actual Owner: {actual_user}')
        print(f'  Expected Owner: {expected_user}')

        if actual_user == expected_user:
            print(f'  ✅ Correct owner')
        else:
            print(f'  ❌ WRONG OWNER! Notification sent to wrong user!')
    else:
        print(f'  ❌ Position not found')

print('\n' + '=' * 70)
