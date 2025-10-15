# Icon Optimization Guide

## Overview

The icon system has been optimized to support lazy loading, which reduces the initial bundle size by only loading icons when they're actually used.

## Performance Benefits

- **Reduced Initial Bundle Size**: Icons are code-split and loaded on-demand
- **Better Tree Shaking**: Unused icons won't be included in the bundle
- **Caching**: Once loaded, icons are cached to prevent re-loading
- **Faster Initial Page Load**: Critical rendering path is lighter

## Usage

### Method 1: Direct Import (For Critical Icons)

Use this for icons that appear immediately on page load (e.g., navigation icons):

```tsx
import { IdeaIcon, TrendingIcon } from '@/components/icons';

function Navigation() {
  return (
    <nav>
      <IdeaIcon size={24} color="#ff8c42" />
      <TrendingIcon size={24} />
    </nav>
  );
}
```

### Method 2: Dynamic Import (Recommended for Most Cases)

Use this for icons in modals, dropdowns, or below-the-fold content:

```tsx
import { DynamicIcon } from '@/components/icons';

function Modal() {
  return (
    <div>
      <DynamicIcon name="CloseIcon" size={24} />
      <DynamicIcon name="ShareIcon" size={18} color="#666" />
    </div>
  );
}
```

## Migration Guide

### Before (All icons loaded immediately)
```tsx
import { IdeaIcon, HeartIcon, ShareIcon, EditIcon } from '@/components/icons';

function Card() {
  return (
    <div>
      <IdeaIcon size={24} />
      {/* Modal that might not be shown */}
      {showModal && (
        <Modal>
          <EditIcon size={20} />
          <ShareIcon size={20} />
        </Modal>
      )}
    </div>
  );
}
```

### After (Lazy load non-critical icons)
```tsx
import { IdeaIcon } from '@/components/icons';  // Critical icon
import { DynamicIcon } from '@/components/icons';  // For lazy loading

function Card() {
  return (
    <div>
      <IdeaIcon size={24} />  {/* Loaded immediately */}
      {/* Modal icons loaded only when modal opens */}
      {showModal && (
        <Modal>
          <DynamicIcon name="EditIcon" size={20} />
          <DynamicIcon name="ShareIcon" size={20} />
        </Modal>
      )}
    </div>
  );
}
```

## When to Use Which Method

### Use Direct Import For:
✅ Navigation icons (always visible)
✅ Logo and branding icons
✅ Critical above-the-fold icons
✅ Icons in loading states

### Use Dynamic Import For:
✅ Modal icons (conditional rendering)
✅ Dropdown menu icons
✅ Card action buttons
✅ Below-the-fold content
✅ Tab content icons
✅ Any icon that's conditionally rendered

## Available Icons

All icons support these props:
- `size?: number` - Default: 18
- `color?: string` - Default: varies by icon
- `className?: string` - Default: ''

Available icon names (for DynamicIcon):
- IdeaIcon
- TargetIcon
- EntryIcon
- ChartIcon
- SparklesIcon
- HeartIcon
- EyeIcon
- ShareIcon
- TrendingIcon
- MyPortfolioIcon
- FilterIcon
- UserIcon
- BookIcon
- HelpIcon
- LogoutIcon
- TrendArrow
- HeartFilledIcon
- EditIcon
- ChevronLeftIcon
- ChevronRightIcon
- ChevronDownIcon
- CloseIcon
- BuySellIcon
- ExitIcon
- AccountsIcon

## Custom Fallback

You can provide a custom fallback while the icon loads:

```tsx
<DynamicIcon
  name="IdeaIcon"
  size={24}
  fallback={<div className="spinner" />}
/>
```

## Implementation Details

- Icons are lazy loaded using React's `lazy()` and `Suspense`
- Loaded icons are cached in a Map to prevent re-loading
- Fallback shows a small gray box matching the icon size
- Compatible with Server-Side Rendering (SSR)

## Measuring Impact

To measure the bundle size impact:

```bash
# Build the app
npm run build

# Check the bundle analyzer output
# Look for icon chunks in .next/static/chunks/
```

Expected improvements:
- Initial bundle: -20KB to -50KB (depending on icon usage)
- Lighthouse score: +2 to +5 points
- First Contentful Paint: -50ms to -200ms

## Best Practices

1. **Import from the main index**: Always import from `@/components/icons`
2. **Keep navigation icons direct**: Don't lazy load always-visible icons
3. **Group dynamic imports**: If multiple icons load together, they'll be in the same chunk
4. **Use TypeScript**: The `IconName` type provides autocomplete safety

## Example: Converting a Component

Here's a complete example of converting a component to use dynamic icons:

```tsx
// Before
import { EditIcon, DeleteIcon, ShareIcon, DownloadIcon } from '@/components/icons';

function ActionMenu({ isOpen }) {
  return (
    <>
      <button>Actions</button>
      {isOpen && (
        <menu>
          <button><EditIcon size={16} /> Edit</button>
          <button><DeleteIcon size={16} /> Delete</button>
          <button><ShareIcon size={16} /> Share</button>
          <button><DownloadIcon size={16} /> Download</button>
        </menu>
      )}
    </>
  );
}

// After
import { DynamicIcon } from '@/components/icons';

function ActionMenu({ isOpen }) {
  return (
    <>
      <button>Actions</button>
      {isOpen && (
        <menu>
          <button><DynamicIcon name="EditIcon" size={16} /> Edit</button>
          <button><DynamicIcon name="DeleteIcon" size={16} /> Delete</button>
          <button><DynamicIcon name="ShareIcon" size={16} /> Share</button>
          <button><DynamicIcon name="DownloadIcon" size={16} /> Download</button>
        </menu>
      )}
    </>
  );
}
```

## Troubleshooting

### Icons not loading
- Check that the icon name is spelled correctly
- Verify the icon exists in `components/icons/`
- Check browser console for import errors

### TypeScript errors
```tsx
// Use the IconName type for type safety
import { DynamicIcon, type IconName } from '@/components/icons';

const iconName: IconName = 'IdeaIcon'; // TypeScript will validate this
```

### Fallback showing too long
- Check network speed
- Verify icon file exists
- Check for circular dependencies

## Future Improvements

Potential future optimizations:
- [ ] SVG sprite sheet for frequently used icons
- [ ] Preload critical icons based on route
- [ ] Icon variants (outlined, filled, etc.)
- [ ] Automatic icon optimization in build pipeline
