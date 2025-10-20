#!/usr/bin/env python3
"""
Add default exitCriteria to all positions that don't have it
This allows Smart SL alerts to show up in the UI
"""

import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
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

def add_default_exit_criteria():
    """Add default exitCriteria to all open positions without it"""
    print('=' * 70)
    print('🔧 Adding Default Exit Criteria to Positions')
    print('=' * 70)
    print(f'Started at: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}\n')

    # Default exit criteria - monitor stop loss at minimum
    default_exit_criteria = {
        'exitAtStopLoss': True,          # Always monitor stop loss
        'exitAtTarget': False,           # Don't auto-exit at target
        'exitBelow50EMA': False,         # Optional
        'exitBelow100MA': False,         # Optional
        'exitBelow200MA': False,         # Optional
        'exitOnWeeklySupertrend': False, # Optional
        'customNote': ''
    }

    try:
        # Fetch all open positions
        portfolios_ref = db.collection('portfolios')
        query = portfolios_ref.where('status', '==', 'open')

        positions_without_criteria = []
        total_positions = 0

        for doc in query.stream():
            total_positions += 1
            data = doc.to_dict()

            if 'exitCriteria' not in data:
                positions_without_criteria.append({
                    'id': doc.id,
                    'symbol': data.get('symbol'),
                    'userId': data.get('userId')
                })

        print(f'📊 Total open positions: {total_positions}')
        print(f'❌ Positions without exitCriteria: {len(positions_without_criteria)}')
        print()

        if not positions_without_criteria:
            print('✅ All positions already have exitCriteria!')
            return

        print('Adding exitCriteria to positions...\n')

        updated_count = 0
        error_count = 0

        for pos in positions_without_criteria:
            try:
                print(f'  {pos["symbol"]}... ', end='', flush=True)

                position_ref = db.collection('portfolios').document(pos['id'])
                position_ref.update({
                    'exitCriteria': default_exit_criteria
                })

                print('✅')
                updated_count += 1

            except Exception as e:
                print(f'❌ Error: {str(e)}')
                error_count += 1

        print()
        print('=' * 70)
        print('📊 Summary')
        print('=' * 70)
        print(f'✅ Updated: {updated_count}')
        print(f'❌ Errors: {error_count}')
        print('=' * 70)

    except Exception as e:
        print(f'❌ Fatal error: {str(e)}')
        sys.exit(1)

if __name__ == '__main__':
    try:
        add_default_exit_criteria()
        print('\n✅ Job completed successfully')
        sys.exit(0)
    except Exception as e:
        print(f'\n❌ Job failed: {str(e)}')
        sys.exit(1)
