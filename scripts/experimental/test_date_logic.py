#!/usr/bin/env python3
"""
Test the smart date logic for EOD data fetching
"""

from datetime import datetime, timedelta, date
import pytz

def get_last_trading_day(test_time=None):
    """
    Get the last trading day based on current time and day of week

    Rules:
    - If time < 16:00 (4 PM IST): fetch yesterday's data
    - If time >= 16:00: fetch today's data
    - If Saturday: fetch Friday's data
    - If Sunday: fetch Friday's data

    Args:
        test_time: Optional datetime for testing (in IST)

    Returns:
        date: Last trading day
    """
    # Get current time in IST
    ist = pytz.timezone('Asia/Kolkata')

    if test_time:
        now = test_time
    else:
        now = datetime.now(ist)

    today = now.date()
    current_hour = now.hour

    # Determine the target date based on time
    if current_hour < 16:
        # Before 4 PM: fetch yesterday's data
        target_date = today - timedelta(days=1)
        reason = f"Before 4 PM ({current_hour}:00), using yesterday"
    else:
        # After 4 PM: fetch today's data
        target_date = today
        reason = f"After 4 PM ({current_hour}:00), using today"

    # Adjust for weekends
    weekday = target_date.weekday()
    weekday_name = target_date.strftime('%A')

    if weekday == 5:  # Saturday
        target_date = target_date - timedelta(days=1)  # Go to Friday
        reason += f" -> {weekday_name}, adjusted to Friday"
    elif weekday == 6:  # Sunday
        target_date = target_date - timedelta(days=2)  # Go to Friday
        reason += f" -> {weekday_name}, adjusted to Friday"

    return target_date, reason


def test_scenarios():
    """Test various date/time scenarios"""
    ist = pytz.timezone('Asia/Kolkata')

    print("🧪 Testing Smart Date Logic for EOD Data Fetch\n")
    print("=" * 80)

    test_cases = [
        # Weekday scenarios
        ("Monday 10 AM", datetime(2025, 10, 13, 10, 0, tzinfo=ist)),
        ("Monday 5 PM", datetime(2025, 10, 13, 17, 0, tzinfo=ist)),
        ("Friday 3 PM", datetime(2025, 10, 10, 15, 0, tzinfo=ist)),
        ("Friday 4:30 PM", datetime(2025, 10, 10, 16, 30, tzinfo=ist)),

        # Weekend scenarios
        ("Saturday 10 AM", datetime(2025, 10, 11, 10, 0, tzinfo=ist)),
        ("Saturday 5 PM", datetime(2025, 10, 11, 17, 0, tzinfo=ist)),
        ("Sunday 10 AM", datetime(2025, 10, 12, 10, 0, tzinfo=ist)),
        ("Sunday 5 PM", datetime(2025, 10, 12, 17, 0, tzinfo=ist)),

        # Edge cases
        ("Monday 3:59 PM", datetime(2025, 10, 13, 15, 59, tzinfo=ist)),
        ("Monday 4:00 PM", datetime(2025, 10, 13, 16, 0, tzinfo=ist)),
        ("Monday 4:01 PM", datetime(2025, 10, 13, 16, 1, tzinfo=ist)),
    ]

    for test_name, test_time in test_cases:
        target_date, reason = get_last_trading_day(test_time)

        print(f"\n📅 Test: {test_name}")
        print(f"   Current: {test_time.strftime('%Y-%m-%d %A %I:%M %p')}")
        print(f"   Target:  {target_date.strftime('%Y-%m-%d %A')}")
        print(f"   Reason:  {reason}")

    print("\n" + "=" * 80)
    print("\n✅ Current time test:")
    target_date, reason = get_last_trading_day()
    ist = pytz.timezone('Asia/Kolkata')
    now = datetime.now(ist)
    print(f"   Current: {now.strftime('%Y-%m-%d %A %I:%M %p IST')}")
    print(f"   Target:  {target_date.strftime('%Y-%m-%d %A')}")
    print(f"   Reason:  {reason}")
    print("\n" + "=" * 80)


if __name__ == '__main__':
    test_scenarios()
