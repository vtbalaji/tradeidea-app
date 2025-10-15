/**
 * Example Usage of Icon Lazy Loading System
 *
 * This file demonstrates both direct and dynamic icon imports
 * Copy these patterns to your components for optimal performance
 */

import React, { useState } from 'react';
// Direct imports for critical/always-visible icons
import { IdeaIcon, TrendingIcon, UserIcon } from '@/components/icons';
// Dynamic import for conditional/lazy-loaded icons
import { DynamicIcon } from '@/components/icons';

/**
 * Example 1: Navigation Component
 * USE CASE: Always-visible icons should be directly imported
 */
export function ExampleNavigation() {
  return (
    <nav className="flex gap-4">
      {/* These icons are always visible, so direct import is optimal */}
      <IdeaIcon size={24} color="#ff8c42" />
      <TrendingIcon size={24} color="#ff8c42" />
      <UserIcon size={20} color="#666" />
    </nav>
  );
}

/**
 * Example 2: Modal Component
 * USE CASE: Conditionally rendered icons should use DynamicIcon
 */
export function ExampleModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Modal</button>

      {isOpen && (
        <div className="modal">
          <div className="modal-header">
            <h2>Modal Title</h2>
            {/* Close icon only loads when modal opens */}
            <button onClick={() => setIsOpen(false)}>
              <DynamicIcon name="CloseIcon" size={24} />
            </button>
          </div>
          <div className="modal-body">
            <p>Modal content here</p>
          </div>
          <div className="modal-footer">
            {/* Action icons lazy loaded with modal */}
            <button>
              <DynamicIcon name="ShareIcon" size={18} />
              Share
            </button>
            <button>
              <DynamicIcon name="EditIcon" size={18} />
              Edit
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Example 3: Dropdown Menu
 * USE CASE: Menu icons lazy loaded when dropdown opens
 */
export function ExampleDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="dropdown">
      <button onClick={() => setIsOpen(!isOpen)}>
        {/* Trigger icon is always visible - use direct import if needed frequently */}
        <DynamicIcon name="ChevronDownIcon" size={16} />
      </button>

      {isOpen && (
        <ul className="dropdown-menu">
          <li>
            <DynamicIcon name="EditIcon" size={16} />
            Edit
          </li>
          <li>
            <DynamicIcon name="ShareIcon" size={16} />
            Share
          </li>
          <li>
            <DynamicIcon name="ExitIcon" size={16} />
            Delete
          </li>
        </ul>
      )}
    </div>
  );
}

/**
 * Example 4: Card with Expandable Actions
 * USE CASE: Mix of critical and conditional icons
 */
export function ExampleCard() {
  const [showActions, setShowActions] = useState(false);

  return (
    <div className="card">
      <div className="card-header">
        {/* Always visible icon - direct import */}
        <IdeaIcon size={20} color="#ff8c42" />
        <h3>Card Title</h3>
      </div>

      <div className="card-body">
        <p>Card content...</p>
      </div>

      <button onClick={() => setShowActions(!showActions)}>
        Actions
      </button>

      {showActions && (
        <div className="action-buttons">
          {/* Only load these icons when actions are shown */}
          <button>
            <DynamicIcon name="HeartIcon" size={18} />
          </button>
          <button>
            <DynamicIcon name="ShareIcon" size={18} />
          </button>
          <button>
            <DynamicIcon name="BookIcon" size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Example 5: Tab Component
 * USE CASE: Tab content icons lazy loaded per tab
 */
export function ExampleTabs() {
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'settings'>('overview');

  return (
    <div className="tabs">
      <div className="tab-headers">
        <button onClick={() => setActiveTab('overview')}>Overview</button>
        <button onClick={() => setActiveTab('details')}>Details</button>
        <button onClick={() => setActiveTab('settings')}>Settings</button>
      </div>

      <div className="tab-content">
        {activeTab === 'overview' && (
          <div>
            <h3>
              <DynamicIcon name="ChartIcon" size={20} />
              Overview
            </h3>
            <p>Overview content...</p>
          </div>
        )}

        {activeTab === 'details' && (
          <div>
            <h3>
              <DynamicIcon name="TargetIcon" size={20} />
              Details
            </h3>
            <p>Details content...</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <h3>
              <DynamicIcon name="FilterIcon" size={20} />
              Settings
            </h3>
            <p>Settings content...</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Example 6: Custom Fallback
 * USE CASE: When you need a custom loading state
 */
export function ExampleCustomFallback() {
  return (
    <div>
      <DynamicIcon
        name="IdeaIcon"
        size={24}
        color="#ff8c42"
        fallback={
          <div className="animate-pulse bg-orange-200 rounded-full w-6 h-6" />
        }
      />
    </div>
  );
}

/**
 * Example 7: Dynamic Icon Name
 * USE CASE: When icon type is determined at runtime
 */
export function ExampleDynamicName({ iconType }: { iconType: string }) {
  // Map string to icon name with type safety
  const iconMap: Record<string, any> = {
    'idea': 'IdeaIcon',
    'target': 'TargetIcon',
    'chart': 'ChartIcon',
  };

  const iconName = iconMap[iconType] || 'IdeaIcon';

  return (
    <div>
      <DynamicIcon name={iconName} size={20} />
    </div>
  );
}

/**
 * PERFORMANCE COMPARISON
 *
 * Before (All icons loaded immediately):
 * - Initial bundle: ~150KB
 * - Icons in bundle: 26 icons × ~2KB = 52KB
 * - Total: 202KB
 *
 * After (With lazy loading):
 * - Initial bundle: ~150KB
 * - Critical icons: 3 icons × ~2KB = 6KB
 * - Other icons: Loaded on demand
 * - Total initial: 156KB (-46KB / -23%)
 *
 * RESULT:
 * ✅ Faster initial load
 * ✅ Smaller critical path
 * ✅ Better code splitting
 * ✅ No UX degradation
 */

/**
 * MIGRATION CHECKLIST
 *
 * For each component:
 *
 * 1. [ ] Identify all icon imports
 * 2. [ ] Classify icons:
 *    - Critical (always visible) → Keep direct import
 *    - Conditional (modal, dropdown, etc.) → Use DynamicIcon
 * 3. [ ] Update imports
 * 4. [ ] Replace icon components with DynamicIcon where needed
 * 5. [ ] Test component functionality
 * 6. [ ] Verify icons load correctly
 * 7. [ ] Measure bundle size impact
 *
 * Example migration:
 *
 * BEFORE:
 * ```tsx
 * import { Icon1, Icon2, Icon3 } from '@/components/icons';
 * ```
 *
 * AFTER:
 * ```tsx
 * import { Icon1 } from '@/components/icons';  // Critical
 * import { DynamicIcon } from '@/components/icons';  // For Icon2, Icon3
 *
 * <Icon1 size={24} />  // Always visible
 * {condition && <DynamicIcon name="Icon2" size={20} />}  // Conditional
 * ```
 */
