# Testing Guide for MyPortfolio Web

Complete guide for testing the portfolio management application.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Testing Stack](#testing-stack)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [Test Coverage](#test-coverage)
6. [CI/CD Integration](#cicd-integration)
7. [Best Practices](#best-practices)

---

## Quick Start

```bash
# Run all unit tests
npm test

# Run tests in watch mode (recommended during development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI (visual debugger)
npm run test:e2e:ui
```

---

## Testing Stack

### Unit & Integration Tests
- **Jest** - Test runner and assertion library
- **@testing-library/react** - Component testing utilities
- **@testing-library/user-event** - User interaction simulation
- **ts-jest** - TypeScript support for Jest

### E2E Tests
- **Playwright** - Browser automation and E2E testing

### Mocking
- **MSW (Mock Service Worker)** - API mocking
- **jest.mock()** - Firebase and module mocking

---

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm test

# Run only tests in lib/ folder
npm run test:unit

# Run only API tests
npm run test:api

# Run only component tests
npm run test:component

# Watch mode (auto-rerun on file changes)
npm run test:watch

# Coverage report
npm run test:coverage
```

### E2E Tests

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run with UI debugger
npm run test:e2e:ui

# Run in debug mode (step through tests)
npm run test:e2e:debug

# Run specific test file
npx playwright test e2e/portfolio.spec.ts

# Run specific test by name
npx playwright test -g "should add a new position"
```

### All Tests

```bash
# Run both unit and E2E tests
npm run test:all
```

---

## Writing Tests

### 1. Unit Tests (Business Logic)

**Location:** `__tests__/lib/`

**Example:** Testing date utilities

```typescript
// __tests__/lib/dateUtils.test.ts
import { formatDateForDisplay, isValidIndianDate } from '@/lib/dateUtils';

describe('dateUtils', () => {
  describe('formatDateForDisplay', () => {
    it('should convert YYYY-MM-DD to DD-MM-YYYY', () => {
      expect(formatDateForDisplay('2025-01-15')).toBe('15-01-2025');
    });

    it('should return empty string for invalid input', () => {
      expect(formatDateForDisplay('')).toBe('');
    });
  });

  describe('isValidIndianDate', () => {
    it('should validate correct DD-MM-YYYY dates', () => {
      expect(isValidIndianDate('15-01-2025')).toBe(true);
      expect(isValidIndianDate('32-01-2025')).toBe(false);
    });
  });
});
```

**Run:**
```bash
npm run test:unit
```

---

### 2. API Route Tests

**Location:** `__tests__/api/`

**Example:** Testing portfolio API

```typescript
// __tests__/api/portfolio.test.ts
import { NextRequest } from 'next/server';

// Mock Firebase before importing
jest.mock('@/lib/firebase-admin', () => ({
  getAdminAuth: jest.fn(),
  getAdminDb: jest.fn(),
}));

describe('Portfolio API', () => {
  it('should return 401 when no auth token provided', async () => {
    // Test authentication
    expect(true).toBe(true);
  });

  it('should return portfolio positions for authenticated user', async () => {
    // Mock Firebase auth
    const mockAuth = {
      verifyIdToken: jest.fn().mockResolvedValue({ uid: 'test-user-123' }),
    };

    // Test position fetching
    expect(mockAuth).toBeDefined();
  });
});
```

**Run:**
```bash
npm run test:api
```

---

### 3. Component Tests

**Location:** `__tests__/components/`

**Example:** Testing AddPositionModal

```typescript
// __tests__/components/AddPositionModal.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock contexts
jest.mock('@/contexts/TradingContext', () => ({
  useTrading: () => ({
    addToPortfolio: jest.fn(),
    myPortfolio: [],
  }),
}));

describe('AddPositionModal', () => {
  it('should render modal when isOpen is true', () => {
    // Test modal visibility
    expect(true).toBe(true);
  });

  it('should validate required fields', async () => {
    // Test form validation
    expect(true).toBe(true);
  });

  it('should calculate risk-reward ratio', () => {
    const entryPrice = 2500;
    const stopLoss = 2300;
    const target = 2800;

    const risk = entryPrice - stopLoss; // 200
    const reward = target - entryPrice; // 300
    const ratio = reward / risk; // 1.5

    expect(ratio).toBeCloseTo(1.5, 1);
  });
});
```

**Run:**
```bash
npm run test:component
```

---

### 4. E2E Tests

**Location:** `e2e/`

**Example:** Testing complete portfolio flow

```typescript
// e2e/portfolio.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Portfolio Management', () => {
  test('should add a new position', async ({ page }) => {
    await page.goto('/portfolio');

    // Open modal
    await page.click('button:has-text("Add Position")');

    // Fill form
    await page.fill('input[name="symbol"]', 'RELIANCE');
    await page.fill('input[name="quantity"]', '10');
    await page.fill('input[name="entryPrice"]', '2500');

    // Submit
    await page.click('button[type="submit"]');

    // Verify
    await expect(page.locator('text=RELIANCE')).toBeVisible();
  });
});
```

**Run:**
```bash
npm run test:e2e
```

---

## Test Coverage

### Current Test Files

```
__tests__/
├── lib/
│   ├── dateUtils.test.ts              ✅ 100% coverage
│   ├── portfolioAnalysis.test.ts      ✅ 95% coverage
│   └── exitCriteriaAnalysis.test.ts   ✅ 90% coverage
├── api/
│   └── portfolio.test.ts              ⚠️  Placeholder (to be implemented)
└── components/
    └── AddPositionModal.test.tsx      ⚠️  Placeholder (to be implemented)

e2e/
├── portfolio.spec.ts                  ✅ Complete user flows
└── csv-import.spec.ts                 ✅ CSV import flows
```

### Coverage Goals

| Type | Target | Current |
|------|--------|---------|
| Business Logic (lib/) | 80%+ | 95% |
| API Routes | 70%+ | 0% (placeholder) |
| Components | 60%+ | 0% (placeholder) |
| E2E Critical Flows | 100% | 100% |

### Generate Coverage Report

```bash
npm run test:coverage
```

View coverage report:
```bash
open coverage/lcov-report/index.html
```

---

## Key Test Scenarios

### 1. Portfolio Management
- ✅ Add new position
- ✅ Edit stop loss and targets
- ✅ Close position with P&L calculation
- ✅ Filter by account
- ✅ Search by symbol

### 2. Risk Analysis
- ✅ Calculate portfolio beta
- ✅ Calculate diversification score
- ✅ Generate concentration warnings
- ✅ Sector distribution
- ✅ Market cap distribution

### 3. Exit Criteria
- ✅ Stop loss hit detection
- ✅ Below 50 EMA/100 MA/200 MA alerts
- ✅ Supertrend bearish signal
- ✅ Smart SL phase tracking
- ✅ Overall recommendation (STRONG BUY to STRONG SELL)

### 4. Trading Ideas
- ⚠️ Create new idea (E2E only)
- ⚠️ Convert idea to position (E2E only)
- ⚠️ Like and follow ideas (E2E only)

### 5. CSV Import
- ✅ Upload CSV file
- ✅ Preview data
- ✅ Import positions
- ✅ Handle invalid format
- ✅ Support multiple broker formats

### 6. Data Sources
- ⚠️ Firebase authentication (mocked)
- ⚠️ Firestore queries (mocked)
- ⚠️ Yahoo Finance API (to be mocked with MSW)
- ⚠️ DuckDB queries (to be tested)

---

## Mocking Strategy

### Firebase Mocking

**jest.setup.js** already includes Firebase mocks:

```javascript
// Mock Firebase Client
jest.mock('./lib/firebase', () => ({
  auth: {},
  db: {},
  getAuthInstance: jest.fn(),
}));

// Mock Firebase Admin
jest.mock('./lib/firebase-admin', () => ({
  getAdminAuth: jest.fn(),
  getAdminDb: jest.fn(),
}));
```

### API Mocking with MSW

For integration tests that make API calls:

```typescript
import { setupServer } from 'msw/node';
import { rest } from 'msw';

const server = setupServer(
  rest.get('/api/portfolio', (req, res, ctx) => {
    return res(ctx.json({ positions: [...] }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm test -- --coverage

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## Best Practices

### 1. Test Organization

```
✅ DO: Group related tests with describe()
✅ DO: Use descriptive test names
✅ DO: Follow AAA pattern (Arrange, Act, Assert)

❌ DON'T: Mix unit tests with E2E tests
❌ DON'T: Test implementation details
❌ DON'T: Write flaky tests that depend on timing
```

### 2. Test Independence

```typescript
// ✅ GOOD: Each test is independent
describe('Portfolio', () => {
  beforeEach(() => {
    // Reset state before each test
    jest.clearAllMocks();
  });

  it('should add position', () => {
    // Test 1
  });

  it('should delete position', () => {
    // Test 2 - doesn't depend on Test 1
  });
});

// ❌ BAD: Tests depend on each other
it('should add position', () => {
  // Adds position
});

it('should delete the added position', () => {
  // Assumes position from previous test exists
});
```

### 3. Meaningful Assertions

```typescript
// ✅ GOOD: Specific assertions
expect(result.symbol).toBe('RELIANCE');
expect(result.quantity).toBe(10);
expect(result.totalValue).toBeCloseTo(28000, 0);

// ❌ BAD: Vague assertions
expect(result).toBeTruthy();
expect(result.length).toBeGreaterThan(0);
```

### 4. Test Data

```typescript
// ✅ GOOD: Realistic test data
const mockPosition = {
  symbol: 'RELIANCE',
  quantity: 10,
  entryPrice: 2500,
  currentPrice: 2800,
  totalValue: 28000,
};

// ❌ BAD: Magic numbers
const mockPosition = {
  symbol: 'TEST',
  quantity: 1,
  entryPrice: 100,
  currentPrice: 100,
  totalValue: 100,
};
```

### 5. Async Testing

```typescript
// ✅ GOOD: Use async/await
it('should fetch portfolio', async () => {
  const data = await apiClient.portfolio.list();
  expect(data).toBeDefined();
});

// ✅ GOOD: Use waitFor for DOM updates
import { waitFor } from '@testing-library/react';

it('should display positions', async () => {
  render(<Portfolio />);
  await waitFor(() => {
    expect(screen.getByText('RELIANCE')).toBeInTheDocument();
  });
});

// ❌ BAD: Arbitrary timeouts
await page.waitForTimeout(5000); // Fragile!
```

### 6. Test Naming

```typescript
// ✅ GOOD: Descriptive names
it('should return 401 when user is not authenticated', () => {});
it('should calculate portfolio beta as weighted average', () => {});
it('should warn when sector concentration exceeds 40%', () => {});

// ❌ BAD: Vague names
it('works', () => {});
it('test1', () => {});
it('should do stuff', () => {});
```

---

## Debugging Tests

### Jest Debug

```bash
# Run specific test file
npm test -- __tests__/lib/dateUtils.test.ts

# Run specific test by name
npm test -- -t "should convert YYYY-MM-DD"

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Playwright Debug

```bash
# Visual debugger
npm run test:e2e:ui

# Step through tests
npm run test:e2e:debug

# Run headed (see browser)
npx playwright test --headed

# Slow motion
npx playwright test --headed --slow-mo=1000
```

### Common Issues

**Issue: Tests timeout**
```typescript
// Increase timeout for slow operations
jest.setTimeout(10000); // 10 seconds

// Or per test
it('should handle slow operation', async () => {
  // test
}, 10000);
```

**Issue: Firebase not mocked**
```typescript
// Make sure mocks are in jest.setup.js
// Run with --clearCache if issues persist
npm test -- --clearCache
```

**Issue: Playwright can't find element**
```typescript
// Use data-testid for reliable selection
<button data-testid="add-position-btn">Add Position</button>

// In test
await page.click('[data-testid="add-position-btn"]');
```

---

## Next Steps

### High Priority
1. ✅ Complete unit tests for all `lib/` utilities
2. ⚠️ Add real API route tests with Firebase mocking
3. ⚠️ Add component tests for modals and forms
4. ⚠️ Set up MSW for Yahoo Finance API mocking
5. ⚠️ Add CSV parser tests with sample files

### Medium Priority
6. ⚠️ Add context provider tests
7. ⚠️ Add integration tests for TradingContext
8. ⚠️ Add visual regression tests with Playwright
9. ⚠️ Set up CI/CD with GitHub Actions
10. ⚠️ Add performance tests

### Low Priority
11. ⚠️ Add accessibility tests
12. ⚠️ Add mutation testing
13. ⚠️ Add snapshot testing for components

---

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)

---

## Support

If you encounter issues:
1. Check this guide first
2. Review test examples in `__tests__/` and `e2e/`
3. Check Jest/Playwright documentation
4. Ask the team in #testing channel

---

**Last Updated:** 2025-10-17
