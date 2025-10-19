#!/usr/bin/env python3
"""
Fetch and calculate technical indicators for ADANIPOWER
"""

import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

symbol = 'ADANIPOWER'

print('=' * 80)
print(f'📊 TECHNICAL ANALYSIS - {symbol}')
print('=' * 80)

# Fetch historical data (1 year)
ticker = yf.Ticker(f'{symbol}.NS')
hist = ticker.history(period='1y')

if hist.empty:
    print('❌ No historical data available')
    exit(1)

# Calculate technical indicators
def calculate_sma(data, period):
    return data['Close'].rolling(window=period).mean()

def calculate_ema(data, period):
    return data['Close'].ewm(span=period, adjust=False).mean()

def calculate_rsi(data, period=14):
    delta = data['Close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    return rsi

def calculate_macd(data):
    ema12 = data['Close'].ewm(span=12, adjust=False).mean()
    ema26 = data['Close'].ewm(span=26, adjust=False).mean()
    macd = ema12 - ema26
    signal = macd.ewm(span=9, adjust=False).mean()
    histogram = macd - signal
    return macd, signal, histogram

def calculate_bollinger_bands(data, period=20, std_dev=2):
    sma = data['Close'].rolling(window=period).mean()
    std = data['Close'].rolling(window=period).std()
    upper = sma + (std * std_dev)
    lower = sma - (std * std_dev)
    return upper, sma, lower

# Calculate all indicators
hist['SMA20'] = calculate_sma(hist, 20)
hist['SMA50'] = calculate_sma(hist, 50)
hist['SMA100'] = calculate_sma(hist, 100)
hist['SMA200'] = calculate_sma(hist, 200)
hist['EMA9'] = calculate_ema(hist, 9)
hist['EMA21'] = calculate_ema(hist, 21)
hist['EMA50'] = calculate_ema(hist, 50)
hist['RSI14'] = calculate_rsi(hist, 14)

macd, signal, histogram = calculate_macd(hist)
hist['MACD'] = macd
hist['MACD_Signal'] = signal
hist['MACD_Histogram'] = histogram

upper, middle, lower = calculate_bollinger_bands(hist)
hist['BB_Upper'] = upper
hist['BB_Middle'] = middle
hist['BB_Lower'] = lower

# Calculate volume average
hist['Volume_SMA20'] = hist['Volume'].rolling(window=20).mean()

# Get latest values
latest = hist.iloc[-1]
prev = hist.iloc[-2]

# Get price at different intervals
price_1w_ago = hist.iloc[-5]['Close'] if len(hist) >= 5 else latest['Close']
price_1m_ago = hist.iloc[-20]['Close'] if len(hist) >= 20 else latest['Close']
price_3m_ago = hist.iloc[-60]['Close'] if len(hist) >= 60 else latest['Close']

# Calculate change percentages
change_1d = ((latest['Close'] - prev['Close']) / prev['Close']) * 100
change_1w = ((latest['Close'] - price_1w_ago) / price_1w_ago) * 100
change_1m = ((latest['Close'] - price_1m_ago) / price_1m_ago) * 100
change_3m = ((latest['Close'] - price_3m_ago) / price_3m_ago) * 100

# Display results
print(f'\n📍 CURRENT PRICE DATA:')
print(f'   Last Price: ₹{latest["Close"]:.2f}')
print(f'   Previous Close: ₹{prev["Close"]:.2f}')
print(f'   Change: ₹{latest["Close"] - prev["Close"]:.2f} ({change_1d:+.2f}%)')
print(f'   High: ₹{latest["High"]:.2f}')
print(f'   Low: ₹{latest["Low"]:.2f}')
print(f'   Volume: {latest["Volume"]:,.0f}')

print(f'\n📈 PRICE CHANGES:')
print(f'   1 Day: {change_1d:+.2f}%')
print(f'   1 Week: {change_1w:+.2f}%')
print(f'   1 Month: {change_1m:+.2f}%')
print(f'   3 Months: {change_3m:+.2f}%')

print(f'\n📊 MOVING AVERAGES:')
print(f'   SMA 20: ₹{latest["SMA20"]:.2f}')
print(f'   SMA 50: ₹{latest["SMA50"]:.2f}')
print(f'   SMA 100: ₹{latest["SMA100"]:.2f}')
print(f'   SMA 200: ₹{latest["SMA200"]:.2f}')
print(f'   EMA 9: ₹{latest["EMA9"]:.2f}')
print(f'   EMA 21: ₹{latest["EMA21"]:.2f}')
print(f'   EMA 50: ₹{latest["EMA50"]:.2f}')

print(f'\n🎯 OSCILLATORS:')
print(f'   RSI (14): {latest["RSI14"]:.2f}')
print(f'   MACD: {latest["MACD"]:.4f}')
print(f'   MACD Signal: {latest["MACD_Signal"]:.4f}')
print(f'   MACD Histogram: {latest["MACD_Histogram"]:.4f}')

print(f'\n📉 BOLLINGER BANDS:')
print(f'   Upper: ₹{latest["BB_Upper"]:.2f}')
print(f'   Middle: ₹{latest["BB_Middle"]:.2f}')
print(f'   Lower: ₹{latest["BB_Lower"]:.2f}')

print(f'\n📊 VOLUME:')
print(f'   Current: {latest["Volume"]:,.0f}')
print(f'   Avg (20): {latest["Volume_SMA20"]:,.0f}')
print(f'   Volume Ratio: {latest["Volume"] / latest["Volume_SMA20"]:.2f}x')

# Analyze signals
print(f'\n🔍 TECHNICAL SIGNALS:')

# Price vs MAs
print(f'   Price vs SMA200: {"ABOVE ✓" if latest["Close"] > latest["SMA200"] else "BELOW ✗"}')
print(f'   Price vs EMA50: {"ABOVE ✓" if latest["Close"] > latest["EMA50"] else "BELOW ✗"}')
print(f'   Price vs SMA100: {"ABOVE ✓" if latest["Close"] > latest["SMA100"] else "BELOW ✗"}')
print(f'   Price vs SMA50: {"ABOVE ✓" if latest["Close"] > latest["SMA50"] else "BELOW ✗"}')
print(f'   Price vs SMA20: {"ABOVE ✓" if latest["Close"] > latest["SMA20"] else "BELOW ✗"}')

# Golden/Death Cross
golden_cross = latest["EMA50"] > latest["SMA200"]
death_cross = latest["EMA50"] < latest["SMA200"]
print(f'   Golden Cross (EMA50 > SMA200): {"YES ✓" if golden_cross else "NO ✗"}')
print(f'   Death Cross (EMA50 < SMA200): {"YES ✗" if death_cross else "NO ✓"}')

# MACD
macd_bullish = latest["MACD"] > 0 and latest["MACD_Histogram"] > 0
macd_bearish = latest["MACD"] < 0 or latest["MACD_Histogram"] < 0
print(f'   MACD Bullish: {"YES ✓" if macd_bullish else "NO ✗"}')
print(f'   MACD Bearish: {"YES ✗" if macd_bearish else "NO ✓"}')

# RSI
rsi_overbought = latest["RSI14"] > 70
rsi_oversold = latest["RSI14"] < 30
print(f'   RSI Overbought (>70): {"YES ⚠" if rsi_overbought else "NO"}')
print(f'   RSI Oversold (<30): {"YES ⚠" if rsi_oversold else "NO"}')
if not rsi_overbought and not rsi_oversold:
    print(f'   RSI Neutral (30-70): YES ✓')

# Volume
volume_spike = latest["Volume"] > (latest["Volume_SMA20"] * 1.5)
print(f'   Volume Spike (>1.5x avg): {"YES ✓" if volume_spike else "NO"}')

# Bollinger Bands
bb_position = "UPPER" if latest["Close"] > latest["BB_Upper"] else ("LOWER" if latest["Close"] < latest["BB_Lower"] else "MIDDLE")
print(f'   BB Position: {bb_position}')

# Overall signal determination
bullish_signals = sum([
    latest["Close"] > latest["SMA200"],
    latest["Close"] > latest["EMA50"],
    golden_cross,
    macd_bullish,
    latest["RSI14"] >= 50 and latest["RSI14"] <= 70,
    latest["Volume"] / latest["Volume_SMA20"] >= 0.8
])

bearish_signals = sum([
    latest["Close"] < latest["SMA200"],
    latest["Close"] < latest["EMA50"],
    death_cross,
    macd_bearish,
    latest["RSI14"] < 40
])

if bullish_signals >= 5:
    overall_signal = "STRONG_BUY"
elif bullish_signals >= 3:
    overall_signal = "BUY"
elif bearish_signals >= 4:
    overall_signal = "STRONG_SELL"
elif bearish_signals >= 2:
    overall_signal = "SELL"
else:
    overall_signal = "NEUTRAL"

print(f'\n🎯 OVERALL SIGNAL: {overall_signal}')
print(f'   Bullish Signals: {bullish_signals}/6')
print(f'   Bearish Signals: {bearish_signals}/5')

# Create technical data object
technical_data = {
    'lastPrice': float(latest['Close']),
    'previousClose': float(prev['Close']),
    'change': float(latest['Close'] - prev['Close']),
    'changePercent': float(change_1d),
    'weeklyChangePercent': float(change_1w),
    'monthlyChangePercent': float(change_1m),
    'quarterlyChangePercent': float(change_3m),
    'sma20': float(latest['SMA20']),
    'sma50': float(latest['SMA50']),
    'sma100': float(latest['SMA100']),
    'sma200': float(latest['SMA200']),
    'ema9': float(latest['EMA9']),
    'ema21': float(latest['EMA21']),
    'ema50': float(latest['EMA50']),
    'rsi14': float(latest['RSI14']),
    'bollingerUpper': float(latest['BB_Upper']),
    'bollingerMiddle': float(latest['BB_Middle']),
    'bollingerLower': float(latest['BB_Lower']),
    'macd': float(latest['MACD']),
    'macdSignal': float(latest['MACD_Signal']),
    'macdHistogram': float(latest['MACD_Histogram']),
    'volume': float(latest['Volume']),
    'avgVolume20': float(latest['Volume_SMA20']),
    'overallSignal': overall_signal,
}

print('\n' + '=' * 80)
print('✅ Technical analysis complete!')
print('=' * 80)

# Output as JSON for easy consumption
import json
print('\n📄 JSON OUTPUT:')
print(json.dumps(technical_data, indent=2))
