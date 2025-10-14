# Google Analytics 4 (GA4) Setup Guide

Complete guide to set up and use Google Analytics 4 to track user behavior and feature usage in TradeIdea.

## Table of Contents
1. [Create GA4 Property](#create-ga4-property)
2. [Configure Environment Variables](#configure-environment-variables)
3. [Verify Installation](#verify-installation)
4. [Track Custom Events](#track-custom-events)
5. [View Analytics Dashboard](#view-analytics-dashboard)
6. [Key Metrics to Monitor](#key-metrics-to-monitor)

---

## Create GA4 Property

### Step 1: Create Google Analytics Account

1. Go to [Google Analytics](https://analytics.google.com/)
2. Click **"Start measuring"** or **"Admin"** (gear icon)
3. Create a new **Account** (or use existing)
   - Account name: `TradeIdea`
   - Configure data sharing settings

### Step 2: Create Property

1. Click **"Create Property"**
2. Property details:
   - **Property name**: `TradeIdea Web App`
   - **Reporting time zone**: `India Standard Time (GMT+5:30)`
   - **Currency**: `Indian Rupee (INR)`
3. Click **"Next"**

### Step 3: Business Information

1. **Industry category**: `Finance & Insurance`
2. **Business size**: Select appropriate size
3. **How you plan to use Google Analytics**: Select relevant options
4. Click **"Create"**
5. Accept **Terms of Service**

### Step 4: Set Up Data Stream

1. Select **"Web"** platform
2. Enter details:
   - **Website URL**: `https://tradeidea.co.in`
   - **Stream name**: `TradeIdea Production`
3. Click **"Create stream"**

### Step 5: Get Measurement ID

1. After creating the stream, you'll see the **Measurement ID**
   - Format: `G-XXXXXXXXXX`
2. **Copy this Measurement ID** - you'll need it for environment variables

---

## Configure Environment Variables

### Step 1: Create/Update `.env.local`

Create or update the `.env.local` file in your project root:

```bash
# .env.local
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Replace `G-XXXXXXXXXX` with your actual Measurement ID from GA4.

### Step 2: Restart Development Server

```bash
# Stop the server (Ctrl+C)
# Start again
npm run dev
```

### Important Notes:
- ✅ Use `NEXT_PUBLIC_` prefix to expose to client-side
- ✅ Never commit `.env.local` to git (already in .gitignore)
- ✅ For production, add this to your deployment platform's environment variables

---

## Verify Installation

### Method 1: Using Browser Developer Tools

1. Open your app in browser: `http://localhost:3001`
2. Open **Developer Tools** (F12)
3. Go to **Network** tab
4. Filter by `gtag` or `google-analytics`
5. You should see requests to:
   - `https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX`
   - Analytics events being sent

### Method 2: Using GA4 Real-Time Reports

1. Go to [Google Analytics](https://analytics.google.com/)
2. Select your property
3. Navigate to **Reports** → **Realtime**
4. Open your app in another tab
5. You should see **1 user online** in real-time report
6. Navigate to different pages - you should see page views updating

### Method 3: Using GA4 DebugView

1. Install [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna) Chrome extension
2. Enable the debugger
3. Go to GA4 → **Configure** → **DebugView**
4. Browse your app
5. Events should appear in DebugView in real-time

---

## Track Custom Events

### Example: Track Idea Creation

```typescript
// In your component
import { trackIdeaCreated } from '@/lib/analytics';

const handleCreateIdea = async (ideaData) => {
  try {
    // Your existing code to create idea
    await createIdea(ideaData);

    // Track the event
    trackIdeaCreated(ideaData.symbol, ideaData.ideaType);
  } catch (error) {
    // Handle error
  }
};
```

### Example: Track Position Added

```typescript
import { trackPositionAdded } from '@/lib/analytics';

const handleAddPosition = async (symbol: string) => {
  try {
    // Add position logic
    await addPosition(symbol);

    // Track event
    trackPositionAdded(symbol, 'manual'); // or 'csv', 'idea'
  } catch (error) {
    // Handle error
  }
};
```

### Example: Track CSV Import

```typescript
import { trackCSVImport } from '@/lib/analytics';

const handleCSVUpload = async (file: File) => {
  try {
    const data = await parseCSV(file);
    await importPositions(data);

    // Track successful import
    trackCSVImport(data.length, 'zerodha'); // or 'icici', 'standard'
  } catch (error) {
    // Handle error
  }
};
```

### Example: Track Screener Usage

```typescript
import { trackScreenerViewed, trackScreenerConvertedToIdea } from '@/lib/analytics';

// When user opens screener tab
const handleTabChange = (tab: string) => {
  trackScreenerViewed(tab); // '50ma', '200ma', 'supertrend'
};

// When user converts screener result to idea
const handleConvertToIdea = (symbol: string, screenerType: string) => {
  trackScreenerConvertedToIdea(symbol, screenerType);
};
```

### Available Event Tracking Functions

See `lib/analytics.ts` for all available functions:

| Function | Purpose | Parameters |
|----------|---------|------------|
| `trackSignUp(method)` | User registration | 'google', 'email' |
| `trackLogin(method)` | User login | 'google', 'email' |
| `trackIdeaCreated(symbol, type)` | New idea created | symbol, ideaType |
| `trackIdeaViewed(id, symbol)` | Idea page viewed | ideaId, symbol |
| `trackPositionAdded(symbol, source)` | Position added | symbol, 'manual'/'csv'/'idea' |
| `trackPositionExited(symbol, pnl)` | Position exited | symbol, profitLoss |
| `trackCSVImport(count, broker)` | CSV imported | rowCount, broker |
| `trackScreenerViewed(type)` | Screener viewed | screenerType |
| `trackScreenerConvertedToIdea(symbol, type)` | Screener converted | symbol, screenerType |
| `trackAnalysisViewed(symbol, type)` | Analysis opened | symbol, analysisType |
| `trackAccountCreated(name)` | New account created | accountName |
| `trackNotificationClicked(type)` | Notification clicked | notificationType |
| `trackFeatureUsed(name, details)` | Feature usage | featureName, details |
| `trackThemeChanged(theme)` | Theme changed | 'light'/'dark'/'system' |

---

## View Analytics Dashboard

### Navigate to Reports

1. Go to [Google Analytics](https://analytics.google.com/)
2. Select **TradeIdea** property
3. Navigate to **Reports**

### Key Reports to Monitor

#### 1. **Realtime Overview**
- **Location**: Reports → Realtime
- **What to see**: Current active users, pages they're viewing, events happening now
- **Use case**: Monitor live traffic, verify events are firing

#### 2. **User Acquisition**
- **Location**: Reports → Life cycle → Acquisition → User acquisition
- **What to see**: How users find your site (Direct, Referral, Organic Search, etc.)
- **Filters**: View by source, medium, campaign

#### 3. **Engagement Overview**
- **Location**: Reports → Life cycle → Engagement → Overview
- **What to see**:
  - Total users, new users
  - Event count by event name
  - Engagement rate
  - Session duration

#### 4. **Events Report**
- **Location**: Reports → Life cycle → Engagement → Events
- **What to see**: All custom events you're tracking
- **Example events**:
  - `idea_created`
  - `position_added`
  - `csv_imported`
  - `screener_viewed`
  - `analysis_viewed`

#### 5. **Pages and Screens**
- **Location**: Reports → Life cycle → Engagement → Pages and screens
- **What to see**:
  - Most viewed pages
  - Average engagement time per page
  - Page views and unique users

#### 6. **Custom Explorations**
- **Location**: Explore (left sidebar)
- **What to do**: Create custom reports, funnels, path analysis
- **Example**: Create funnel for `screener_viewed` → `screener_converted` → `position_added`

---

## Key Metrics to Monitor

### 1. **User Engagement Metrics**

| Metric | What it tells you | Where to find |
|--------|-------------------|---------------|
| **Active Users** | How many people use your app daily/weekly | Realtime, Overview |
| **New vs Returning** | User retention rate | Acquisition → Overview |
| **Session Duration** | How long users stay | Engagement → Overview |
| **Bounce Rate** | Single-page sessions | Engagement → Pages |
| **Events per Session** | User engagement level | Engagement → Events |

### 2. **Feature Usage Metrics**

Track these custom events to understand feature adoption:

```typescript
// Portfolio features
- position_added (source: manual, csv, idea)
- position_exited
- csv_imported (broker: zerodha, icici)

// Screener features
- screener_viewed (type: 50ma, 200ma, supertrend)
- screener_converted (how many convert to ideas)

// Analysis features
- analysis_viewed (type: technical, fundamental, investor)
- investor_analysis_opened

// Ideas features
- idea_created
- idea_viewed
- idea_liked
- idea_followed

// Alerts/Notifications
- notification_clicked (type: entry, target, stoploss)
- alert_configured
```

### 3. **Conversion Funnels**

Create funnels to track user journeys:

#### Screener to Portfolio Funnel:
```
screener_viewed → screener_converted → position_added
```

#### Idea to Portfolio Funnel:
```
idea_viewed → idea_liked → position_added (from idea)
```

#### Onboarding Funnel:
```
sign_up → account_created → first_position_added
```

### 4. **User Behavior Insights**

Questions to answer with GA4:

1. **Which screener types are most popular?**
   - Filter events by `screener_viewed` → group by `event_label`

2. **CSV import success rate?**
   - Compare `csv_imported` events with file upload attempts

3. **Most viewed pages?**
   - Pages and screens report → sort by views

4. **Which features are unused?**
   - Events report → find events with 0 count

5. **User retention over time?**
   - Retention report → cohort analysis

---

## Advanced: Custom Dashboards

### Create Feature Usage Dashboard

1. Go to **Explore** → **Create new exploration**
2. Choose **Free form** template
3. Add dimensions:
   - `Event name`
   - `Event category`
   - `Event label`
4. Add metrics:
   - `Event count`
   - `Total users`
   - `Events per user`
5. Add filters:
   - Category = 'screener'
   - Category = 'portfolio'
   - Category = 'ideas'

### Create Conversion Dashboard

1. Go to **Explore** → **Funnel exploration**
2. Define funnel steps:
   - Step 1: `screener_viewed`
   - Step 2: `screener_converted`
   - Step 3: `position_added`
3. View completion rates between steps

---

## Troubleshooting

### Events Not Showing Up

1. **Check Measurement ID**:
   ```bash
   # Verify in .env.local
   echo $NEXT_PUBLIC_GA_MEASUREMENT_ID
   ```

2. **Check Browser Console**:
   - Look for errors related to `gtag` or `google-analytics`
   - Verify `window.gtag` is defined

3. **Check Network Tab**:
   - Filter by `google-analytics.com`
   - Should see POST requests with event data

4. **Wait 24-48 hours**:
   - Some reports update with delay
   - Use Realtime or DebugView for immediate feedback

### No Real-Time Data

1. **Disable Ad Blockers**: May block GA scripts
2. **Check Privacy Extensions**: uBlock, Privacy Badger, etc.
3. **Use Incognito Mode**: Test without extensions
4. **Verify Environment Variable**: Must have `NEXT_PUBLIC_` prefix

### Events Fire But Wrong Data

1. **Check Event Parameters**:
   ```typescript
   // Log before sending
   console.log('Tracking event:', { action, category, label, value });
   ```

2. **Verify Event Names**: Should be lowercase with underscores
3. **Check Data Types**: Values must be numbers, labels must be strings

---

## Privacy & GDPR Compliance

### Important Considerations

1. **Cookie Consent**:
   - GA4 uses cookies
   - Consider adding cookie consent banner
   - Only load GA after user accepts

2. **IP Anonymization**:
   - GA4 automatically anonymizes IPs by default

3. **Data Retention**:
   - Configure in GA4 Admin → Data Settings → Data Retention
   - Recommended: 14 months

4. **User Data Deletion**:
   - GA4 Admin → Data Settings → User Data Deletion Requests
   - Process deletion requests as needed

5. **Privacy Policy**:
   - Update your privacy policy to mention Google Analytics
   - Explain what data is collected and why

---

## Production Deployment

### Environment Variables

Add to your production environment:

**Vercel**:
```bash
vercel env add NEXT_PUBLIC_GA_MEASUREMENT_ID
```

**Other platforms**:
- Add `NEXT_PUBLIC_GA_MEASUREMENT_ID` to environment variables
- Value: `G-XXXXXXXXXX` (your production Measurement ID)

### Testing in Production

1. Deploy with GA4 enabled
2. Check Realtime reports
3. Verify events are firing correctly
4. Monitor for 24-48 hours to ensure data flows properly

---

## Quick Reference

| Action | Command/Location |
|--------|------------------|
| View Realtime Data | GA4 → Reports → Realtime |
| View Events | GA4 → Reports → Engagement → Events |
| Debug Events | GA4 → Configure → DebugView |
| Create Custom Report | GA4 → Explore → New exploration |
| Check Implementation | Browser DevTools → Network → Filter: gtag |
| Update Tracking | Edit `lib/analytics.ts` |
| Add New Event | Import tracking function → Call in component |

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify Measurement ID is correct
3. Test in incognito mode (no ad blockers)
4. Check GA4 DebugView for real-time events
5. Wait 24-48 hours for reports to populate
