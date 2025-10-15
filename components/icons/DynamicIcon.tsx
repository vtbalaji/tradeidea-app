import React, { lazy, Suspense, ComponentType } from 'react';

// Define icon props interface
interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

// Icon name type for type safety
export type IconName =
  | 'IdeaIcon'
  | 'TargetIcon'
  | 'EntryIcon'
  | 'ChartIcon'
  | 'SparklesIcon'
  | 'HeartIcon'
  | 'EyeIcon'
  | 'ShareIcon'
  | 'TrendingIcon'
  | 'MyPortfolioIcon'
  | 'FilterIcon'
  | 'UserIcon'
  | 'BookIcon'
  | 'HelpIcon'
  | 'LogoutIcon'
  | 'TrendArrow'
  | 'HeartFilledIcon'
  | 'EditIcon'
  | 'ChevronLeftIcon'
  | 'ChevronRightIcon'
  | 'ChevronDownIcon'
  | 'CloseIcon'
  | 'BuySellIcon'
  | 'ExitIcon'
  | 'AccountsIcon';

interface DynamicIconProps extends IconProps {
  name: IconName;
  fallback?: React.ReactNode;
}

// Cache for loaded icons to prevent re-loading
const iconCache = new Map<IconName, ComponentType<IconProps>>();

// Lazy load icon components
const loadIcon = (name: IconName): ComponentType<IconProps> => {
  if (iconCache.has(name)) {
    return iconCache.get(name)!;
  }

  const LazyIcon = lazy(() =>
    import(`./${name}`).then((module) => ({
      default: module[name] || module.default,
    }))
  );

  iconCache.set(name, LazyIcon);
  return LazyIcon;
};

// Fallback component shown while icon loads
const IconFallback: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <div
    className={`inline-block bg-gray-200 dark:bg-gray-700 rounded ${className}`}
    style={{ width: size, height: size }}
  />
);

/**
 * DynamicIcon - Lazy loads icon components on demand
 *
 * Benefits:
 * - Reduces initial bundle size by code-splitting icons
 * - Only loads icons that are actually used
 * - Caches loaded icons to prevent re-loading
 *
 * Usage:
 * ```tsx
 * <DynamicIcon name="IdeaIcon" size={24} color="#ff8c42" />
 * ```
 */
export const DynamicIcon: React.FC<DynamicIconProps> = ({
  name,
  fallback,
  ...iconProps
}) => {
  const Icon = loadIcon(name);

  return (
    <Suspense fallback={fallback || <IconFallback {...iconProps} />}>
      <Icon {...iconProps} />
    </Suspense>
  );
};

export default DynamicIcon;
