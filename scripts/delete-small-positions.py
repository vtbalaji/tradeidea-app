#!/usr/bin/env python3
"""
Delete portfolio positions with quantity <= 1
Removes positions with 0 or 1 shares
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

def delete_small_positions():
    """Delete all positions with quantity <= 1"""
    print('=' * 70)
    print('🗑️  Delete Small Portfolio Positions (Quantity <= 1)')
    print('=' * 70)
    print(f'Started at: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}\n')

    try:
        # Fetch all open positions
        portfolios_ref = db.collection('portfolios')
        query = portfolios_ref.where('status', '==', 'open')

        positions_to_delete = []
        total_positions = 0

        print('📊 Scanning for positions with quantity <= 1...\n')

        for doc in query.stream():
            total_positions += 1
            data = doc.to_dict()
            quantity = data.get('quantity', 0)
            symbol = data.get('symbol', 'UNKNOWN')

            if quantity <= 1:
                positions_to_delete.append({
                    'id': doc.id,
                    'symbol': symbol,
                    'quantity': quantity,
                    'entryPrice': data.get('entryPrice', 0),
                    'currentPrice': data.get('currentPrice', 0),
                })

        print(f'📊 Total open positions: {total_positions}')
        print(f'🗑️  Positions to delete (qty <= 1): {len(positions_to_delete)}\n')

        if not positions_to_delete:
            print('✅ No positions found with quantity <= 1!')
            return

        # Show positions that will be deleted
        print('Positions to be deleted:')
        print('-' * 70)
        for pos in positions_to_delete:
            print(f'  {pos["symbol"]:<15} Qty: {pos["quantity"]:<5} Entry: ₹{pos["entryPrice"]:<10.2f} Current: ₹{pos["currentPrice"]:.2f}')
        print('-' * 70)

        # Confirm deletion
        print(f'\n⚠️  WARNING: This will permanently delete {len(positions_to_delete)} positions!')

        # Check if --confirm flag is passed
        if '--confirm' not in sys.argv:
            confirm = input('Type "DELETE" to confirm: ')
            if confirm != 'DELETE':
                print('\n❌ Deletion cancelled.')
                return
        else:
            print('✅ Auto-confirmed via --confirm flag')

        print('\n🗑️  Deleting positions...\n')

        deleted_count = 0
        error_count = 0

        for pos in positions_to_delete:
            try:
                print(f'  Deleting {pos["symbol"]} (qty: {pos["quantity"]})... ', end='', flush=True)
                db.collection('portfolios').document(pos['id']).delete()
                print('✅')
                deleted_count += 1
            except Exception as e:
                print(f'❌ Error: {str(e)}')
                error_count += 1

        print()
        print('=' * 70)
        print('📊 Summary')
        print('=' * 70)
        print(f'Total scanned: {total_positions}')
        print(f'✅ Deleted: {deleted_count}')
        print(f'❌ Errors: {error_count}')
        print('=' * 70)

    except Exception as e:
        print(f'❌ Fatal error: {str(e)}')
        sys.exit(1)

if __name__ == '__main__':
    try:
        delete_small_positions()
        print('\n✅ Job completed successfully')
        sys.exit(0)
    except KeyboardInterrupt:
        print('\n\n❌ Cancelled by user')
        sys.exit(1)
    except Exception as e:
        print(f'\n❌ Job failed: {str(e)}')
        sys.exit(1)
