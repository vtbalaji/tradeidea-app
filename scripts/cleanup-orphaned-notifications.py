#!/usr/bin/env python3
"""
Cleanup script to remove notifications for positions that no longer exist
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

print('🧹 Cleaning up orphaned notifications')
print('=' * 70)

# Get all notifications with position IDs
notifications_ref = db.collection('notifications')
query = notifications_ref.where('positionId', '!=', None)

notifications = list(query.stream())
print(f'Found {len(notifications)} notifications with position IDs\n')

deleted_count = 0
portfolios_ref = db.collection('portfolios')

for notif_doc in notifications:
    notif_id = notif_doc.id
    notif_data = notif_doc.to_dict()

    position_id = notif_data.get('positionId')
    user_id = notif_data.get('userId')
    symbol = notif_data.get('ideaSymbol')

    if not position_id:
        continue

    # Check if position still exists
    position_doc = portfolios_ref.document(position_id).get()

    if not position_doc.exists:
        print(f'❌ Orphaned notification found:')
        print(f'  Notification ID: {notif_id}')
        print(f'  User: {user_id[:30]}...')
        print(f'  Symbol: {symbol}')
        print(f'  Position ID: {position_id} (does not exist)')
        print(f'  Type: {notif_data.get("type")}')
        print(f'  Created: {notif_data.get("createdAt")}')

        # Delete the notification
        notifications_ref.document(notif_id).delete()
        print(f'  ✅ Deleted orphaned notification\n')
        deleted_count += 1

print('=' * 70)
print(f'Cleanup complete: Deleted {deleted_count} orphaned notification(s)')
print('=' * 70)
