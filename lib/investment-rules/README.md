# Investment Rule Engine

A comprehensive rule-based system to analyze stocks for different investor types and provide tailored entry/exit recommendations.

## 📁 File Structure

```
lib/investment-rules/
├── index.ts                    # Public API exports
├── types.ts                    # TypeScript interfaces and types
├── InvestmentRuleEngine.ts     # Main engine orchestrator
└── rules/                      # Individual investor rule files
    ├── valueInvestor.ts        # Value investing rules
    ├── growthInvestor.ts       # Growth investing rules
    ├── momentumTrader.ts       # Momentum trading rules
    ├── qualityInvestor.ts      # Quality investing rules
    └── dividendInvestor.ts     # Dividend investing rules
```

## 🎯 Investor Types

### 1. **Value Investor** 💎
- **Focus**: Buying undervalued stocks with strong fundamentals
- **Time Horizon**: Long-term (2-5 years)
- **Risk**: Medium
- **Key Criteria**: Low P/E, P/B ratios, strong profit margins, low debt

### 2. **Growth Investor** 📈
- **Focus**: High-growth companies with strong momentum
- **Time Horizon**: Medium-term (6 months - 2 years)
- **Risk**: High
- **Key Criteria**: High earnings growth, revenue growth, momentum signals

### 3. **Momentum Trader** 🚀
- **Focus**: Riding short-term trends with strong technical signals
- **Time Horizon**: Short-term (days - 2 months)
- **Risk**: Very High
- **Key Criteria**: Strong momentum, volume, technical indicators

### 4. **Quality Investor** ⭐
- **Focus**: High-quality businesses with strong competitive moats
- **Time Horizon**: Long-term (3-10 years)
- **Risk**: Low-Medium
- **Key Criteria**: High margins, low debt, consistent earnings, strong rating

### 5. **Dividend Investor** 💰
- **Focus**: Income generation through stable dividend-paying stocks
- **Time Horizon**: Very Long-term (5+ years)
- **Risk**: Low
- **Key Criteria**: High dividend yield, sustainable payout ratio, stability

## 🚀 Usage

### Basic Usage

```typescript
import { createInvestmentEngine } from '@/lib/investment-rules';

// Assume you have technical and fundamental data
const technical = idea.technicals;
const fundamental = idea.fundamentals;

// Create engine instance
const engine = createInvestmentEngine(technical, fundamental);

// Get recommendation for all investor types
const recommendation = engine.getRecommendation();

console.log('Suitable for:', recommendation.suitableFor);
console.log('Best match:', recommendation.bestMatch);

// Check specific investor type
const valueAnalysis = engine.checkEntry('value');
console.log('Can value investor enter?', valueAnalysis.canEnter);
console.log('Criteria met:', valueAnalysis.met, '/', valueAnalysis.total);
```

### In React Components

```typescript
import React, { useState } from 'react';
import { createInvestmentEngine } from '@/lib/investment-rules';
import InvestorAnalysisModal from '@/components/InvestorAnalysisModal';

function IdeaCard({ idea }) {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [recommendation, setRecommendation] = useState(null);

  const handleAnalyze = () => {
    if (idea.technicals && idea.fundamentals) {
      const engine = createInvestmentEngine(
        idea.technicals,
        idea.fundamentals
      );
      const rec = engine.getRecommendation();
      setRecommendation(rec);
      setShowAnalysis(true);
    }
  };

  return (
    <>
      <button onClick={handleAnalyze}>
        📊 Analyze
      </button>

      <InvestorAnalysisModal
        isOpen={showAnalysis}
        onClose={() => setShowAnalysis(false)}
        symbol={idea.symbol}
        recommendation={recommendation}
      />
    </>
  );
}
```

## 📝 Modifying Rules

Each investor type has its own rule file in `lib/investment-rules/rules/`.

### Example: Modifying Value Investor Rules

Edit `/lib/investment-rules/rules/valueInvestor.ts`:

```typescript
export function checkValueInvestorEntry(...) {
  const conditions = {
    // Modify these thresholds as needed
    priceToBook: fundamental.priceToBook < 3.0,  // Change to < 2.5 for stricter criteria
    forwardPE: fundamental.forwardPE < 20.0,     // Change to < 15.0 for stricter criteria
    // ... other conditions
  };

  // All conditions must be met
  const allMet = Object.values(conditions).every(v => v === true);

  return {
    canEnter: allMet,
    conditions,
    met: Object.values(conditions).filter(v => v === true).length,
    total: Object.keys(conditions).length,
    failedConditions: Object.keys(conditions).filter(k => !conditions[k])
  };
}
```

### Exit Rules

Exit rules work similarly but also consider position data:

```typescript
export function checkValueInvestorExit(
  signals,
  technical,
  fundamental,
  entryPrice,      // Original entry price
  holdingDays      // Days held
) {
  const exitConditions = {
    profitTarget: (technical.lastPrice / entryPrice) >= 1.50,  // 50% profit
    stopLoss: (technical.lastPrice / entryPrice) <= 0.85,      // 15% loss
    // ... other conditions
  };

  // ANY condition triggers exit
  const shouldExit = Object.values(exitConditions).some(v => v === true);

  return {
    shouldExit,
    conditions: exitConditions,
    triggerReasons: Object.keys(exitConditions).filter(k => exitConditions[k]),
    currentReturn: ((technical.lastPrice / entryPrice - 1) * 100).toFixed(2) + '%'
  };
}
```

## 🔧 Adding Analysis Button to Idea Cards

In `app/ideas/page.tsx`, add the analyze button to the `renderIdeaCard` function:

```typescript
const renderIdeaCard = (idea: any) => {
  const [showAnalysis, setShowAnalysis] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<any>(null);

  const handleAnalyze = (e: React.MouseEvent, idea: any) => {
    e.stopPropagation();

    if (idea.technicals && idea.fundamentals) {
      const engine = createInvestmentEngine(
        idea.technicals,
        idea.fundamentals
      );
      const rec = engine.getRecommendation();
      setRecommendation(rec);
      setShowAnalysis(idea.id);
    } else {
      alert('Technical or fundamental data not available for this stock');
    }
  };

  return (
    <div>
      {/* ... existing card content ... */}

      {/* Add this button in the footer section */}
      <div className="flex justify-between items-center">
        <button
          onClick={(e) => handleAnalyze(e, idea)}
          className="px-3 py-1.5 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded hover:bg-blue-500/30 transition-colors"
          disabled={!idea.technicals || !idea.fundamentals}
        >
          📊 Analyze
        </button>

        <button onClick={() => router.push(`/ideas/${idea.id}`)}>
          View Details
        </button>
      </div>

      {/* Modal */}
      {showAnalysis === idea.id && (
        <InvestorAnalysisModal
          isOpen={true}
          onClose={() => setShowAnalysis(null)}
          symbol={idea.symbol}
          recommendation={recommendation}
        />
      )}
    </div>
  );
};
```

## 📊 Data Requirements

The engine requires:

### Technical Data
- Price data (lastPrice, previousClose, change)
- Moving averages (SMA20, SMA50, SMA200, EMA9, EMA50)
- RSI14
- Bollinger Bands
- MACD
- Volume
- Overall signal (optional)

### Fundamental Data
- Valuation: P/E, P/B, P/S ratios
- Profitability: margins, ROE, ROA
- Growth: earnings, revenue growth
- Financial health: debt-to-equity, current ratio
- Dividends: yield, payout ratio
- Market cap, beta

## 🎨 Customization

### Adding a New Investor Type

1. Create new rule file in `rules/` directory
2. Implement `checkXXXEntry()` and `checkXXXExit()` functions
3. Add to `InvestmentRuleEngine.ts` methods object
4. Add to type definition in `types.ts`
5. Update `InvestorAnalysisModal.tsx` info object

### Sharing Rules

Simply share the rule file (e.g., `valueInvestor.ts`) with others. They can:
1. Copy it to their `lib/investment-rules/rules/` folder
2. Import and use it immediately
3. Modify thresholds to match their strategy

## 📚 Examples

See the implementation in:
- `components/InvestorAnalysisModal.tsx` - Modal UI
- `lib/investment-rules/` - Rule engine and types

## 🔒 Important Notes

- Rules are evaluated independently for each investor type
- Entry rules require ALL conditions to be met (AND logic)
- Exit rules trigger if ANY condition is met (OR logic)
- Always validate that technical/fundamental data exists before analysis
- This is a decision support tool - not financial advice

## 🚀 Next Steps

1. Add the analyze button to idea cards
2. Test with various stocks
3. Fine-tune rule thresholds based on backtesting
4. Add more investor types as needed
5. Consider adding confidence scores
6. Implement historical tracking of recommendations
