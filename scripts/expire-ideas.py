#!/usr/bin/env python3
"""
Trading Ideas Auto-Expiry Batch Job

Auto-expires ACTIVE trading ideas that have passed their expiry date.
Expiry is calculated based on timeframe:
- short term: 30 days from creation
- medium term: 90 days from creation
- long term: 180 days from creation

Runs as part of daily EOD batch process.
"""

import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timedelta
import sys
import os

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

# Expiry duration in days based on timeframe
EXPIRY_DAYS = {
    'short term': 30,
    'short': 30,
    'medium term': 90,
    'medium': 90,
    'long term': 180,
    'long': 180
}

def calculate_expiry_date(created_at, timeframe):
    """Calculate expiry date based on creation date and timeframe"""
    if not created_at:
        return None

    # Get creation date
    if hasattr(created_at, 'timestamp'):
        created_date = datetime.fromtimestamp(created_at.timestamp())
    elif hasattr(created_at, 'toDate'):
        created_date = created_at.toDate()
    else:
        created_date = created_at

    # Get expiry days for this timeframe (default to 90 days)
    days = EXPIRY_DAYS.get(timeframe, 90)

    # Calculate expiry date
    expiry_date = created_date + timedelta(days=days)
    return expiry_date

def expire_old_ideas():
    """Find and expire ACTIVE ideas that have passed their expiry date"""
    print('🔍 Checking for expired trading ideas...')

    # Fetch all ACTIVE ideas
    ideas_ref = db.collection('tradingIdeas')
    query = ideas_ref.where('status', '==', 'active')

    expired_count = 0
    batch = db.batch()
    batch_count = 0

    now = datetime.now()

    for doc in query.stream():
        idea = doc.to_dict()
        idea_id = doc.id

        # Calculate expiry date
        created_at = idea.get('createdAt')
        timeframe = idea.get('timeframe', 'medium')

        expiry_date = calculate_expiry_date(created_at, timeframe)

        if not expiry_date:
            print(f'  ⚠️  Skipping {idea_id}: No creation date')
            continue

        # Check if expired
        if now > expiry_date:
            symbol = idea.get('symbol', 'UNKNOWN')
            title = idea.get('title', 'Untitled')
            days_old = (now - expiry_date).days

            print(f'  ⏰ Expiring: {symbol} - {title} (expired {days_old} days ago)')

            # Update to EXPIRED status
            idea_ref = ideas_ref.document(idea_id)

            # Prepare state history entry
            state_history = idea.get('stateHistory', [])
            state_history.append({
                'from': 'active',
                'to': 'EXPIRED',
                'timestamp': firestore.SERVER_TIMESTAMP,
                'reason': f'Auto-expired (entry not hit within {timeframe} timeframe)',
                'updatedBy': 'system'
            })

            # Update document
            batch.update(idea_ref, {
                'status': 'expired',
                'updatedAt': firestore.SERVER_TIMESTAMP,
                'stateHistory': state_history,
                'expiresAt': expiry_date  # Store for future reference
            })

            batch_count += 1
            expired_count += 1

            # Firestore batch limit is 500 operations
            if batch_count >= 500:
                batch.commit()
                print(f'  💾 Committed batch of {batch_count} updates')
                batch = db.batch()
                batch_count = 0

    # Commit remaining batch
    if batch_count > 0:
        batch.commit()
        print(f'  💾 Committed final batch of {batch_count} updates')

    return expired_count

def main():
    """Main execution"""
    try:
        print('=' * 50)
        print('🚀 Trading Ideas Auto-Expiry Job')
        print('=' * 50)

        expired = expire_old_ideas()

        print('\n' + '=' * 50)
        if expired > 0:
            print(f'✅ Expired {expired} trading idea(s)')
        else:
            print('✅ No ideas to expire')
        print('=' * 50)

    except Exception as e:
        print(f'\n❌ Error: {str(e)}')
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
