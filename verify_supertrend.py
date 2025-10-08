#!/usr/bin/env python3
"""
Verify Supertrend calculation for ADANIPOWER
"""

import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def calculate_atr(df, period=14):
    """Calculate Average True Range"""
    high_low = df['High'] - df['Low']
    high_close = np.abs(df['High'] - df['Close'].shift())
    low_close = np.abs(df['Low'] - df['Close'].shift())

    ranges = pd.concat([high_low, high_close, low_close], axis=1)
    true_range = np.max(ranges, axis=1)
    atr = true_range.rolling(period).mean()

    return atr

def calculate_supertrend(df, period=10, multiplier=3):
    """Calculate Supertrend indicator with proper ATR"""
    atr = calculate_atr(df, period)
    hl2 = (df['High'] + df['Low']) / 2

    # Calculate basic upper and lower bands
    basic_upper = hl2 + (multiplier * atr)
    basic_lower = hl2 - (multiplier * atr)

    # Initialize final bands
    final_upper = pd.Series(index=df.index, dtype=float)
    final_lower = pd.Series(index=df.index, dtype=float)
    supertrend = pd.Series(index=df.index, dtype=float)
    direction = pd.Series(index=df.index, dtype=int)

    for i in range(period, len(df)):
        # Adjust upper band
        if i == period:
            final_upper.iloc[i] = basic_upper.iloc[i]
        else:
            if basic_upper.iloc[i] < final_upper.iloc[i-1] or df['Close'].iloc[i-1] > final_upper.iloc[i-1]:
                final_upper.iloc[i] = basic_upper.iloc[i]
            else:
                final_upper.iloc[i] = final_upper.iloc[i-1]

        # Adjust lower band
        if i == period:
            final_lower.iloc[i] = basic_lower.iloc[i]
        else:
            if basic_lower.iloc[i] > final_lower.iloc[i-1] or df['Close'].iloc[i-1] < final_lower.iloc[i-1]:
                final_lower.iloc[i] = basic_lower.iloc[i]
            else:
                final_lower.iloc[i] = final_lower.iloc[i-1]

        # Determine supertrend direction
        if i == period:
            supertrend.iloc[i] = final_upper.iloc[i]
            direction.iloc[i] = -1
        else:
            prev_direction = direction.iloc[i-1]

            if prev_direction == 1:
                # Was in uptrend
                if df['Close'].iloc[i] <= final_lower.iloc[i]:
                    supertrend.iloc[i] = final_upper.iloc[i]
                    direction.iloc[i] = -1
                else:
                    supertrend.iloc[i] = final_lower.iloc[i]
                    direction.iloc[i] = 1
            else:
                # Was in downtrend
                if df['Close'].iloc[i] >= final_upper.iloc[i]:
                    supertrend.iloc[i] = final_lower.iloc[i]
                    direction.iloc[i] = 1
                else:
                    supertrend.iloc[i] = final_upper.iloc[i]
                    direction.iloc[i] = -1

    return supertrend, direction

def resample_to_weekly(df):
    """Resample daily data to weekly data"""
    weekly = df.resample('W').agg({
        'Open': 'first',
        'High': 'max',
        'Low': 'min',
        'Close': 'last',
        'Volume': 'sum'
    }).dropna()
    return weekly

# Fetch ADANIPOWER data
print("Fetching ADANIPOWER data...")
ticker = yf.Ticker('ADANIPOWER.NS')
end_date = datetime.now()
start_date = end_date - timedelta(days=730)
df = ticker.history(start=start_date, end=end_date)

print(f"\nDaily Data: {len(df)} rows")
print(f"52-week High: ₹{df['High'].tail(252).max():.2f}")
print(f"52-week Low: ₹{df['Low'].tail(252).max():.2f}")
print(f"Current Price: ₹{df['Close'].iloc[-1]:.2f}")

# Resample to weekly
weekly_df = resample_to_weekly(df)
print(f"\nWeekly Data: {len(weekly_df)} rows")
print(f"Weekly 52-week High: ₹{weekly_df['High'].tail(52).max():.2f}")
print(f"Weekly Current Price: ₹{weekly_df['Close'].iloc[-1]:.2f}")

# Calculate weekly supertrend
supertrend, direction = calculate_supertrend(weekly_df, period=10, multiplier=3)

print(f"\n=== WEEKLY SUPERTREND ANALYSIS ===")
print(f"Latest Supertrend: ₹{supertrend.iloc[-1]:.2f}")
print(f"Direction: {'BULLISH ↗' if direction.iloc[-1] == 1 else 'BEARISH ↘'}")

# Show last 10 weeks
print(f"\n=== Last 10 Weeks ===")
print(weekly_df[['Close', 'High', 'Low']].tail(10))
print(f"\nSupertrend values:")
print(supertrend.tail(10))

# Calculate ATR for context
atr = calculate_atr(weekly_df, 10)
print(f"\nWeekly ATR (10): ₹{atr.iloc[-1]:.2f}")
print(f"Multiplier: 3")
print(f"HL2: ₹{((weekly_df['High'].iloc[-1] + weekly_df['Low'].iloc[-1]) / 2):.2f}")
print(f"Upper Band: ₹{((weekly_df['High'].iloc[-1] + weekly_df['Low'].iloc[-1]) / 2) + (3 * atr.iloc[-1]):.2f}")
print(f"Lower Band: ₹{((weekly_df['High'].iloc[-1] + weekly_df['Low'].iloc[-1]) / 2) - (3 * atr.iloc[-1]):.2f}")
