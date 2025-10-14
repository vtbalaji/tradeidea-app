# Google Analytics Quick Start

Get Google Analytics 4 tracking up and running in 5 minutes.

## Step 1: Create GA4 Property

1. Go to [Google Analytics](https://analytics.google.com/)
2. Create new **Property** → Select **Web**
3. Enter URL: `https://tradeidea.co.in`
4. **Copy your Measurement ID** (format: `G-XXXXXXXXXX`)

## Step 2: Add Environment Variable

Create `.env.local` in your project root:

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Replace `G-XXXXXXXXXX` with your actual Measurement ID.

## Step 3: Restart Server

```bash
npm run dev
```

## Step 4: Verify It's Working

1. Open your app: `http://localhost:3001`
2. Go to GA4 → **Reports** → **Realtime**
3. You should see **1 user active** 🎉

## Step 5: Add Event Tracking (Optional)

Add tracking to your features:

```typescript
// Example: Track when user creates an idea
import { trackIdeaCreated } from '@/lib/analytics';

const handleSubmit = async (data) => {
  await createIdea(data);
  trackIdeaCreated(data.symbol, data.ideaType); // 👈 Add this line
};
```

## Available Tracking Functions

See `lib/analytics.ts` for full list:

- `trackSignUp(method)` - User registration
- `trackLogin(method)` - User login
- `trackIdeaCreated(symbol, type)` - New idea
- `trackPositionAdded(symbol, source)` - Portfolio position
- `trackCSVImport(count, broker)` - CSV import
- `trackScreenerViewed(type)` - Screener usage
- `trackAnalysisViewed(symbol, type)` - Analysis opened
- `trackNotificationClicked(type)` - Notification clicked

## View Analytics

Go to [Google Analytics](https://analytics.google.com/) and navigate to:

- **Realtime** - Live user activity
- **Events** - All tracked events
- **Pages and screens** - Most viewed pages
- **Acquisition** - How users find your site

## Complete Guide

For detailed documentation, see [`docs/GOOGLE_ANALYTICS_SETUP.md`](./GOOGLE_ANALYTICS_SETUP.md)

---

**That's it!** You're now tracking user behavior and feature usage with Google Analytics 4.
