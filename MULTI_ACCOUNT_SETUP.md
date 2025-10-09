# Multi-Account Portfolio Setup

## Overview
Enable users to manage multiple portfolio accounts (e.g., Personal, Wife's Portfolio, Kids Fund).

## What's Been Created

### 1. AccountsContext (`contexts/AccountsContext.tsx`)
- Manages multiple accounts per user
- Tracks active account
- Auto-creates "Primary" default account on first use
- Persists active account selection

### 2. Accounts Page (`app/accounts/page.tsx`)
- Create new accounts with custom names, descriptions, and colors
- Edit existing accounts
- Switch between accounts
- Set default account
- Color-coded for easy identification

### 3. Firestore Rules Updated
Added accounts collection rules to `firestore.rules`:
```javascript
// Accounts collection
match /accounts/{accountId} {
  allow read: if isSignedIn() && resource.data.userId == request.auth.uid;
  allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
  allow update: if isSignedIn() && resource.data.userId == request.auth.uid;
  allow delete: if false;
}
```

## Next Steps to Complete

### Step 1: Add AccountsProvider to Root Layout

Edit `app/layout.tsx`:

```typescript
import { AccountsProvider } from '../contexts/AccountsContext';

// Wrap your app with AccountsProvider after AuthProvider
<AuthProvider>
  <AccountsProvider>
    <TradingProvider>
      {children}
    </TradingProvider>
  </AccountsProvider>
</AuthProvider>
```

### Step 2: Add Account Field to Portfolio Schema

Update portfolio documents to include `accountId`:

In `contexts/TradingContext.tsx`:
- Add `accountId` field when creating positions
- Filter positions by active account

### Step 3: Add Navigation Link

Edit `components/Navigation.tsx`:

Add navigation item:
```typescript
<Link
  href="/accounts"
  className={`flex items-center gap-1.5 px-4 py-2 rounded-md ${
    pathname === '/accounts' ? 'bg-gray-100 dark:bg-[#30363d] text-gray-900 dark:text-white' : 'text-gray-600 dark:text-[#8b949e]'
  } font-semibold text-sm hover:bg-gray-100 dark:hover:bg-[#30363d] hover:text-gray-900 dark:hover:text-white transition-colors`}
>
  <span>👥</span>
  <span>Accounts</span>
</Link>
```

### Step 4: Add Account Selector to Portfolio Page

At top of `app/portfolio/page.tsx`:

```typescript
import { useAccounts } from '../../contexts/AccountsContext';

// In component:
const { accounts, activeAccount, setActiveAccount } = useAccounts();

// Add selector before metrics:
<div className="flex items-center gap-3 mb-4">
  <label className="text-sm font-semibold text-gray-600 dark:text-[#8b949e]">Account:</label>
  <select
    value={activeAccount?.id || ''}
    onChange={(e) => {
      const account = accounts.find(a => a.id === e.target.value);
      if (account) setActiveAccount(account);
    }}
    className="bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-gray-900 dark:text-white"
  >
    {accounts.map(account => (
      <option key={account.id} value={account.id}>
        {account.name} {account.isDefault ? '(Default)' : ''}
      </option>
    ))}
  </select>
</div>
```

### Step 5: Add Account Selection to Import Modal

In `app/portfolio/page.tsx` import modal:

```typescript
// Add state
const [selectedImportAccount, setSelectedImportAccount] = useState<string>('');

// In import modal, before file upload:
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-2">
    Import to Account
  </label>
  <select
    value={selectedImportAccount}
    onChange={(e) => setSelectedImportAccount(e.target.value)}
    className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-gray-900 dark:text-white"
  >
    <option value="">Select account...</option>
    {accounts.map(account => (
      <option key={account.id} value={account.id}>
        {account.name}
      </option>
    ))}
  </select>
</div>

// When importing, add accountId to position data:
positionData.accountId = selectedImportAccount;
```

### Step 6: Add Link to Profile Page

Edit `app/profile/page.tsx`:

Add link in the stats section:
```typescript
<div className="bg-gray-50 dark:bg-[#1c2128] rounded-xl border border-gray-200 dark:border-[#30363d] p-6">
  <div className="text-gray-600 dark:text-[#8b949e] text-sm font-semibold mb-3">Manage Accounts</div>
  <Link
    href="/accounts"
    className="inline-block bg-[#ff8c42] hover:bg-[#ff9a58] text-white font-semibold py-2 px-4 rounded-lg transition-colors"
  >
    👥 Portfolio Accounts
  </Link>
</div>
```

### Step 7: Update Firebase Rules

Copy the updated `firestore.rules` to Firebase Console and publish.

## Account Features

### Account Properties
- **Name**: Custom name (e.g., "Wife's Portfolio", "Kids Fund")
- **Description**: Optional description
- **Color**: 8 color options for visual distinction
- **isDefault**: One account marked as default
- **Active Account**: Current account being viewed/edited

### Account Operations
- **Create**: Add new accounts
- **Edit**: Modify name, description, color
- **Switch**: Change active account
- **Set Default**: Mark preferred account as default
- **Auto-Create**: First user gets "Primary" account automatically

### Account Usage
- **Portfolio Page**: Filter positions by active account
- **Import**: Choose which account to import into
- **Navigation**: Quick account switcher
- **Color Coding**: Visual identification across the app

## Database Schema

### accounts Collection
```typescript
{
  id: string;
  userId: string;           // Owner
  name: string;            // "Wife's Portfolio"
  description?: string;    // Optional description
  isDefault: boolean;      // Is this the default account?
  color: string;          // "#ff8c42"
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### portfolio Collection (Updated)
```typescript
{
  // ... existing fields ...
  accountId: string;       // NEW: Links to account
}
```

## User Flow

1. **First Time**: User gets auto-created "Primary" account
2. **Add Account**: Click "Accounts" → "Create Account" → Enter details
3. **Switch Account**: Portfolio page → Select account from dropdown
4. **Import**: Import CSV → Select target account → Import
5. **View**: All portfolio views filtered by active account
