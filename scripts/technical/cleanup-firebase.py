#!/usr/bin/env python3
"""
Firebase Cleanup Script
Removes old data from Firebase collections:
1. Notifications older than 5 days
2. Screener data older than 5 days (MA crossovers, Advanced Trailstop, Volume Spikes, Darvas Boxes, BB Squeeze)
3. Closed ideas older than 3 days

Run this script daily via cron to keep Firebase clean
"""

import sys
import os
from datetime import datetime, timedelta
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

def cleanup_notifications():
    """
    Delete notifications older than 5 days
    """
    print('\n🔍 Cleaning up notifications older than 5 days...')

    # Calculate cutoff date (3 days ago)
    cutoff_date = datetime.now() - timedelta(days=3)

    try:
        # Get all notifications
        notifications_ref = db.collection('notifications')
        docs = notifications_ref.stream()

        deleted_count = 0
        for doc in docs:
            data = doc.to_dict()

            # Check if notification has createdAt timestamp
            if 'createdAt' in data and data['createdAt']:
                # Convert Firestore timestamp to datetime
                created_at = data['createdAt']

                # Handle both Firestore Timestamp and datetime objects
                if hasattr(created_at, 'seconds'):
                    created_datetime = datetime.fromtimestamp(created_at.seconds)
                else:
                    created_datetime = created_at

                # Delete if older than cutoff
                if created_datetime < cutoff_date:
                    doc.reference.delete()
                    deleted_count += 1

        print(f'✅ Deleted {deleted_count} old notifications')
        return deleted_count

    except Exception as e:
        print(f'❌ Error cleaning notifications: {str(e)}')
        return 0

def cleanup_screener_data():
    """
    Delete screener data older than 5 days
    Collections: macrossover50, macrossover200, advancedtrailstop, volumespike, darvasboxes, bbsqueeze
    """
    print('\n🔍 Cleaning up screener data older than 5 days...')

    # Calculate cutoff date (3 days ago in YYYY-MM-DD format)
    cutoff_date = (datetime.now() - timedelta(days=3)).strftime('%Y-%m-%d')

    screener_collections = [
        'macrossover50',
        'macrossover200',
        'advancedtrailstop',
        'volumespike',
        'darvasboxes',
        'bbsqueeze'
    ]

    total_deleted = 0

    for collection_name in screener_collections:
        try:
            collection_ref = db.collection(collection_name)
            docs = collection_ref.stream()

            deleted_count = 0
            for doc in docs:
                data = doc.to_dict()

                # Check if document has date field
                if 'date' in data and data['date']:
                    doc_date = data['date']

                    # Delete if older than cutoff (date is in YYYY-MM-DD format)
                    if doc_date < cutoff_date:
                        doc.reference.delete()
                        deleted_count += 1

            if deleted_count > 0:
                print(f'  ✅ Deleted {deleted_count} records from {collection_name}')
            total_deleted += deleted_count

        except Exception as e:
            print(f'  ❌ Error cleaning {collection_name}: {str(e)}')

    print(f'✅ Total screener records deleted: {total_deleted}')
    return total_deleted

def cleanup_closed_ideas():
    """
    Delete closed ideas older than 3 days
    An idea is considered closed if status is 'closed', 'target_hit', 'stop_loss_hit', or 'manual_exit'
    """
    print('\n🔍 Cleaning up closed ideas older than 3 days...')

    # Calculate cutoff date (3 days ago)
    cutoff_date = datetime.now() - timedelta(days=3)

    # Closed statuses
    closed_statuses = ['closed', 'target_hit', 'stop_loss_hit', 'manual_exit']

    try:
        ideas_ref = db.collection('ideas')

        deleted_count = 0

        # Query for each closed status separately (Firebase doesn't support OR in array)
        for status in closed_statuses:
            # Get ideas with this status
            docs = ideas_ref.where('status', '==', status).stream()

            for doc in docs:
                data = doc.to_dict()

                # Check exitDate or updatedAt timestamp
                exit_date = data.get('exitDate') or data.get('updatedAt')

                if exit_date:
                    # Handle both Firestore Timestamp and datetime objects
                    if hasattr(exit_date, 'seconds'):
                        exit_datetime = datetime.fromtimestamp(exit_date.seconds)
                    else:
                        exit_datetime = exit_date

                    # Delete if older than cutoff
                    if exit_datetime < cutoff_date:
                        doc.reference.delete()
                        deleted_count += 1

        print(f'✅ Deleted {deleted_count} closed ideas')
        return deleted_count

    except Exception as e:
        print(f'❌ Error cleaning closed ideas: {str(e)}')
        return 0

def get_collection_stats():
    """
    Get current statistics for all collections
    """
    print('\n📊 Current Firebase Statistics:')
    print('=' * 60)

    collections = {
        'notifications': 'Notifications',
        'macrossover50': '50 MA Crossovers',
        'macrossover200': '200 MA Crossovers',
        'advancedtrailstop': 'Advanced Trailstop',
        'volumespike': 'Volume Spikes',
        'darvasboxes': 'Darvas Boxes',
        'bbsqueeze': 'BB Squeeze',
        'ideas': 'Ideas'
    }

    for collection_name, display_name in collections.items():
        try:
            collection_ref = db.collection(collection_name)
            docs = list(collection_ref.stream())
            count = len(docs)
            print(f'  {display_name:<25} {count:>6} records')
        except Exception as e:
            print(f'  {display_name:<25} ERROR: {str(e)}')

    print('=' * 60)

def main():
    """
    Main cleanup function
    """
    print('🧹 Firebase Cleanup Script')
    print('=' * 60)
    print(f'Started at: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')

    # Show current stats
    get_collection_stats()

    # Perform cleanup
    notifications_deleted = cleanup_notifications()
    screener_deleted = cleanup_screener_data()
    ideas_deleted = cleanup_closed_ideas()

    # Show final stats
    print('\n📈 Cleanup Summary:')
    print('=' * 60)
    print(f'  Notifications deleted: {notifications_deleted}')
    print(f'  Screener records deleted: {screener_deleted}')
    print(f'  Closed ideas deleted: {ideas_deleted}')
    print(f'  Total records deleted: {notifications_deleted + screener_deleted + ideas_deleted}')
    print('=' * 60)

    # Show updated stats
    get_collection_stats()

    print(f'\n✅ Cleanup completed at: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')

if __name__ == '__main__':
    try:
        main()
        sys.exit(0)
    except Exception as e:
        print(f'\n❌ Cleanup failed: {str(e)}')
        import traceback
        traceback.print_exc()
        sys.exit(1)
