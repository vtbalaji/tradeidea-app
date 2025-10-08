#!/usr/bin/env python3
"""
Debug ADANIPOWER signal calculation
"""

# ADANIPOWER values from batch output:
# Price: ₹148.78
# RSI: 57.3
# 50EMA: ₹133.45
# 100MA: ₹121.88
# 200MA: ₹112.73
# Weekly Supertrend: ₹186.04 (BEARISH ↘)
# 🔥 50 EMA/200 MA CROSSOVER!
# ⭐ GOLDEN CROSS!

last_price = 148.78
sma50 = 133.45  # Inferred from 50EMA
sma100 = 121.88
sma200 = 112.73
ema50 = 133.45
rsi14 = 57.3
supertrend_direction = -1  # BEARISH
macd_histogram = 0  # Not shown, assuming neutral

print("=== ADANIPOWER SIGNAL BREAKDOWN ===\n")

score = 0

# Price vs SMA200
if last_price > sma200:
    print(f"✅ Price ({last_price}) > SMA200 ({sma200}): +2")
    score += 2
else:
    print(f"❌ Price ({last_price}) < SMA200 ({sma200}): -2")
    score -= 2

# Price vs SMA100
if last_price > sma100:
    print(f"✅ Price ({last_price}) > SMA100 ({sma100}): +1")
    score += 1
else:
    print(f"❌ Price ({last_price}) < SMA100 ({sma100}): -1")
    score -= 1

# Price vs EMA50
if last_price > ema50:
    print(f"✅ Price ({last_price}) > EMA50 ({ema50}): +1")
    score += 1
else:
    print(f"❌ Price ({last_price}) < EMA50 ({ema50}): -1")
    score -= 1

# Supertrend
if supertrend_direction == 1:
    print(f"✅ Supertrend BULLISH: +2")
    score += 2
else:
    print(f"❌ Supertrend BEARISH: -2")
    score -= 2

# RSI
if rsi14 < 30:
    print(f"✅ RSI Oversold ({rsi14}): +2")
    score += 2
elif rsi14 > 70:
    print(f"❌ RSI Overbought ({rsi14}): -2")
    score -= 2
else:
    print(f"⚪ RSI Neutral ({rsi14}): 0")

# Golden Cross (SMA50 > SMA200)
if sma50 > sma200:
    print(f"✅ Golden Cross (SMA50 {sma50} > SMA200 {sma200}): +2")
    score += 2
else:
    print(f"❌ Death Cross: -2")
    score -= 2

print(f"\n=== TOTAL SCORE: {score} ===")

if score >= 5:
    signal = "STRONG_BUY"
elif score >= 2:
    signal = "BUY"
elif score <= -5:
    signal = "STRONG_SELL"
elif score <= -2:
    signal = "SELL"
else:
    signal = "NEUTRAL"

print(f"Signal: {signal}\n")

print("=== ISSUE IDENTIFIED ===")
print("The problem: Supertrend is giving -2 (bearish) which conflicts with:")
print("  - Price above all MAs (+2 +1 +1 = +4)")
print("  - Golden Cross (+2)")
print("  - Total positive momentum: +6")
print("  - Total negative from Supertrend: -2")
print("  - Net score: +4 = BUY")
print("\nThis makes sense! Despite bearish weekly supertrend, the daily trend is bullish.")
print("Weekly supertrend is a longer-term resistance indicator.")
