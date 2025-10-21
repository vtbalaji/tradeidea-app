#!/usr/bin/env python3
"""
Debug script to check user's notifications
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

print(f'🔍 Checking notifications for user: {user_id}')
print('=' * 70)

# Get all notifications for this user
notifications_ref = db.collection('notifications')
query = notifications_ref.where('userId', '==', user_id).order_by('createdAt', direction=firestore.Query.DESCENDING).limit(50)

notifications = list(query.stream())

print(f'Found {len(notifications)} total notifications\n')

# Filter for POCL notifications
pocl_notifications = []
for doc in notifications:
    data = doc.to_dict()
    if data.get('ideaSymbol') == symbol or symbol.lower() in data.get('message', '').lower():
        pocl_notifications.append({
            'id': doc.id,
            'data': data
        })

if pocl_notifications:
    print(f'🚨 Found {len(pocl_notifications)} POCL notification(s):')
    for notif in pocl_notifications:
        data = notif['data']
        print(f'\n  Notification ID: {notif["id"]}')
        print(f'  Type: {data.get("type")}')
        print(f'  Symbol: {data.get("ideaSymbol")}')
        print(f'  User ID: {data.get("userId")}')
        print(f'  From: {data.get("fromUserName")}')
        print(f'  Message: {data.get("message")}')
        print(f'  Created At: {data.get("createdAt")}')
        print(f'  Position ID: {data.get("positionId")}')
else:
    print(f'✅ No POCL notifications found for this user')

# Check for any POCL notifications in the entire database
print(f'\n\n🌍 ALL POCL notifications in database (any user):')
print('=' * 70)

query_all = notifications_ref.where('ideaSymbol', '==', symbol).order_by('createdAt', direction=firestore.Query.DESCENDING).limit(10)
all_pocl_notifs = list(query_all.stream())

if all_pocl_notifs:
    print(f'Found {len(all_pocl_notifs)} POCL notification(s):')
    for doc in all_pocl_notifs:
        data = doc.to_dict()
        uid = data.get('userId', 'unknown')
        print(f'\n  User: {uid[:30]}...')
        print(f'  Type: {data.get("type")}')
        print(f'  Message: {data.get("message")}')
        print(f'  Created At: {data.get("createdAt")}')
else:
    print('No POCL notifications found')

print('\n' + '=' * 70)
