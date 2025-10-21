#!/usr/bin/env python3
"""
Debug script to check current POCL position
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

print('🔍 Checking current POCL position')
print('=' * 70)

portfolios_ref = db.collection('portfolios')
query = portfolios_ref.where('symbol', '==', 'POCL').where('status', '==', 'open')

for doc in query.stream():
    data = doc.to_dict()
    print(f'\nPosition ID: {doc.id}')
    print(f'Symbol: {data.get("symbol")}')
    print(f'Status: {data.get("status")}')
    print(f'Owner User ID: {data.get("userId")}')
    print(f'Entry Price: ₹{data.get("entryPrice", 0):.2f}')
    print(f'Stop Loss: ₹{data.get("stopLoss", 0):.2f}')
    print(f'Quantity: {data.get("quantity", 0)}')
    print(f'Smart SL Phase: {data.get("smartSLPhase", "N/A")}')
    print(f'Created At: {data.get("createdAt")}')

    # Check stopLossManagement object
    slm = data.get('stopLossManagement')
    if slm:
        print(f'\nStop Loss Management:')
        print(f'  Phase: {slm.get("phase")}')
        print(f'  Effective SL: ₹{slm.get("effectiveStopLoss", 0):.2f}')
        print(f'  Initial Entry: ₹{slm.get("initialEntry", 0):.2f}')
        print(f'  Initialized At: {slm.get("initializedAt")}')

print('\n' + '=' * 70)
