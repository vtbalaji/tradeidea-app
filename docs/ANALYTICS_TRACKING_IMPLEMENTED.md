# Analytics Tracking - Implemented Events

This document lists all the Google Analytics tracking events that have been implemented in the TradeIdea app.

## ✅ Currently Tracking

### 1. **Idea Interactions** (app/ideas/[id]/page.tsx)

| Event | When It Fires | Data Captured |
|-------|---------------|---------------|
| **`idea_viewed`** | User opens an idea detail page | `ideaId`, `symbol` |
| **`idea_liked`** | User clicks the like/heart button | `ideaId` |
| **`idea_followed`** | User clicks the follow/eye button | `ideaId` |
| **`position_added`** | User adds idea to portfolio | `symbol`, `source: 'idea'` |

### 2. **Portfolio Actions** (app/portfolio/page.tsx)

| Event | When It Fires | Data Captured |
|-------|---------------|---------------|
| **`position_added`** | User manually adds a position | `symbol`, `source: 'manual'` |
| **`position_added`** | User imports positions via CSV | `symbol`, `source: 'manual'` (per position) |
| **`position_exited`** | User exits a position | `symbol`, `pnl` (profit/loss amount) |
| **`analysis_viewed`** | User clicks Analysis button | `symbol`, `type: 'portfolio'` |

### 3. **Screener Interactions** (app/cross50200/page.tsx)

| Event | When It Fires | Data Captured |
|-------|---------------|---------------|
| **`screener_viewed`** | User switches screener tabs | `type: 'both'/'50ma'/'200ma'/'supertrend'/'volume'` |
| **`screener_converted_to_idea`** | User clicks "Convert to Idea" | `symbol`, `screener_type` |
| **`analysis_viewed`** | User clicks Analysis button | `symbol`, `type: 'screener'` |

**Implementation Examples**:

#### Idea Interactions
```typescript
// app/ideas/[id]/page.tsx

// Page view tracking
useEffect(() => {
  if (foundIdea) {
    trackIdeaViewed(ideaId, foundIdea.symbol);
  }
}, [ideaId, ideas]);

// Like tracking
const handleLike = async () => {
  await toggleLike(ideaId);
  trackIdeaLiked(ideaId);
};

// Follow tracking
const handleFollow = async () => {
  await toggleFollow(ideaId);
  trackIdeaFollowed(ideaId);
};

// Add to portfolio tracking
await addToPortfolio(ideaId, positionData);
trackPositionAdded(idea.symbol, 'idea');
```

#### Portfolio Actions
```typescript
// app/portfolio/page.tsx

// Exit position tracking
const handleExitTrade = async () => {
  const exitPrice = parseFloat(exitDetails.exitPrice);
  const pnl = (exitPrice - selectedPosition.entryPrice) * selectedPosition.quantity;

  await exitTrade(selectedPosition.id, exitPrice, exitDate, exitReason);
  trackPositionExited(selectedPosition.symbol, pnl);
};

// Manual position add tracking
const handleAddToPortfolio = async (ideaId: string, position: any) => {
  await addToPortfolio(ideaId, position);
  const source = ideaId ? 'idea' : 'manual';
  trackPositionAdded(position.symbol, source);
};

// Analysis viewed from portfolio
const handleOpenAnalysis = (position: any) => {
  trackAnalysisViewed(position.symbol, 'portfolio');
  // ... show analysis modal
};
```

#### Screener Interactions
```typescript
// app/cross50200/page.tsx

// Tab change tracking
const handleTabChange = (tab: 'both' | '50ma' | '200ma' | 'supertrend' | 'volume') => {
  setActiveTab(tab);
  trackScreenerViewed(tab);
};

// Convert to idea tracking
const handleConvertToIdea = (symbol: string, displaySymbol: string, ...) => {
  trackScreenerConvertedToIdea(displaySymbol, activeTab);
  router.push(`/ideas/new?symbol=...`);
};

// Analysis viewed from screener
const handleAnalyze = (e: React.MouseEvent, crossover: Crossover) => {
  trackAnalysisViewed(crossover.symbol, 'screener');
  // ... show analysis modal
};
```

---

## 📊 Analytics Insights You'll Get

### User Engagement
- Which ideas get the most views?
- Like vs Follow ratio
- Idea view to portfolio conversion rate
- Most popular symbols/stocks across all features
- Which screener tabs users prefer (50MA vs 200MA vs Supertrend vs Volume)

### Feature Adoption
- **Portfolio Management**: Manual adds vs CSV imports vs Idea conversions
- **Screener Usage**: Most popular screener types and conversion rates
- **Analysis Tool**: How often users check technical/fundamental analysis
- **Idea Conversion**: Screener to Idea vs Idea to Portfolio flow

### Trading Behavior
- **Exit Performance**: Average P&L per position, win/loss ratio
- **Position Sources**: Which source generates better returns (manual/idea/screener)
- **Symbol Popularity**: Most tracked symbols across portfolio and screeners

---

## 🎯 Recommended Next: Add Tracking To

### High Priority

#### 1. **CSV Import Summary Event** (components/portfolio/modals/ImportCsvModal.tsx)
```typescript
// Track import summary (currently tracks individual position_added events)
// Could add a summary event like:
trackCSVImportCompleted(validCount, invalidCount, broker);
```

**Value**: Track bulk import behavior, broker preferences, success rates

**Note**: Individual positions are already tracked via `position_added` events with `source: 'manual'`

#### 2. **Notification Clicks**
```typescript
// In NotificationBell component
const handleNotificationClick = (notification: any) => {
  trackNotificationClicked(notification.type); // 'entry', 'target', 'stoploss'
};
```

**Value**: Alert engagement rates

### Medium Priority

#### 3. **Account Management**
```typescript
// Track account creation
const handleCreateAccount = (accountName: string) => {
  trackAccountCreated(accountName);
};

// Track account switching
const handleSwitch = (accountName: string) => {
  trackAccountSwitched(accountName);
};
```

**Value**: Multi-account feature adoption

#### 7. **Idea Creation**
```typescript
// Track new idea posts
const handleSubmit = async (data) => {
  await createIdea(data);
  trackIdeaCreated(data.symbol, data.ideaType);
};
```

**Value**: User contribution rates, content generation

---

## 📈 How to View This Data in GA4

### 1. **Real-Time Monitoring**
- Go to GA4 → **Reports** → **Realtime**
- See events as they happen
- Verify tracking is working

### 2. **Event Reports**
- GA4 → **Reports** → **Engagement** → **Events**
- See all custom events
- Event counts, users, parameters

### 3. **Custom Reports**
Create exploration to answer:
- **Which ideas are most popular?**
  - Filter: `event_name = idea_viewed`
  - Group by: `event_label` (shows ideaId_symbol)

- **Idea engagement funnel?**
  - Funnel: `idea_viewed` → `idea_liked` → `idea_followed` → `position_added`

- **Which symbols get added to portfolio most?**
  - Filter: `event_name = position_added`
  - Group by: `event_label` (shows symbol)

### 4. **Conversion Tracking**
Set up conversions in GA4:
1. Go to Admin → Events → Mark as conversion:
   - `position_added` (key conversion!)
   - `idea_created` (content contribution)
   - `csv_imported` (onboarding milestone)
   - `position_exited` (transaction completion)

---

## 🔧 Adding New Tracking Events

### Step 1: Import the tracking function
```typescript
import { trackEventName } from '@/lib/analytics';
```

### Step 2: Call it at the right moment
```typescript
const handleAction = async () => {
  // Your existing logic
  await doSomething();

  // Add tracking
  trackEventName(param1, param2);
};
```

### Step 3: Test it
1. Open browser DevTools → Network tab
2. Filter by `google-analytics` or `gtag`
3. Perform the action
4. See the event fire in Network tab
5. Check GA4 Realtime report

---

## 📝 Available Tracking Functions

See `lib/analytics.ts` for the complete list:

### Authentication
- `trackSignUp(method)` - User registration
- `trackLogin(method)` - User login
- `trackLogout()` - User logout

### Ideas
- ✅ `trackIdeaCreated(symbol, type)` - New idea posted
- ✅ `trackIdeaViewed(id, symbol)` - Idea page opened
- ✅ `trackIdeaLiked(id)` - Idea liked
- ✅ `trackIdeaFollowed(id)` - Idea followed

### Portfolio
- ✅ `trackPositionAdded(symbol, source)` - Position added ('manual'/'csv'/'idea')
- `trackPositionExited(symbol, pnl)` - Position closed
- `trackCSVImport(count, broker)` - CSV imported

### Screeners
- `trackScreenerViewed(type)` - Screener tab viewed
- `trackScreenerConvertedToIdea(symbol, type)` - Converted to idea

### Analysis
- `trackAnalysisViewed(symbol, type)` - Analysis opened
- `trackInvestorAnalysisOpened(symbol)` - Investor analysis modal

### Accounts
- `trackAccountCreated(name)` - New account created
- `trackAccountSwitched(name)` - Account switched

### Alerts
- `trackAlertConfigured(type, enabled)` - Exit criteria configured
- `trackNotificationClicked(type)` - Notification clicked

### General
- `trackFeatureUsed(name, details)` - Feature usage
- `trackSearch(query, results)` - Search performed
- `trackThemeChanged(theme)` - Theme toggled
- `trackError(message, location)` - Error occurred

---

## 🎯 Success Metrics to Track

### Engagement Metrics
- Daily Active Users (DAU)
- Weekly Active Users (WAU)
- Average session duration
- Pages per session
- Event count per user

### Feature Adoption
- % of users who view ideas
- % of users who like/follow ideas
- % of users who add positions
- % of users who use screeners
- % of users who import CSV

### Conversion Funnels
1. **Screener → Portfolio**:
   `screener_viewed` → `screener_converted` → `position_added`

2. **Idea → Portfolio**:
   `idea_viewed` → `idea_liked` → `position_added`

3. **Onboarding**:
   `sign_up` → `account_created` → `position_added`

### Content Engagement
- Most viewed ideas
- Most liked ideas
- Most followed ideas
- Symbols with most positions

### Revenue Indicators (if applicable)
- User retention (DAU/MAU ratio)
- Feature usage depth
- Time to first value (sign up → first position)

---

## 🚀 Next Steps

1. **Add remaining high-priority tracking** (screeners, portfolio, CSV)
2. **Set up GA4 conversions** for key events
3. **Create custom dashboards** in GA4 Explore
4. **Monitor for 1 week** to gather baseline data
5. **Analyze patterns** and optimize features
6. **A/B test improvements** using data insights

---

## 📚 Related Documentation

- [Quick Start Guide](./ANALYTICS_QUICK_START.md) - 5-minute setup
- [Complete Setup Guide](./GOOGLE_ANALYTICS_SETUP.md) - Full documentation
- [Analytics Utility Functions](../lib/analytics.ts) - All tracking functions

---

**Last Updated**: 2025-10-14
**Events Tracked**: 11 unique event types (across 3 major features)
**Coverage**:
- ✅ Idea interactions (4 events)
- ✅ Portfolio actions (3 events)
- ✅ Screener interactions (3 events)
- ⏳ Account management (pending)
- ⏳ Notifications (pending)
- ⏳ CSV import summary (pending - individual positions already tracked)
