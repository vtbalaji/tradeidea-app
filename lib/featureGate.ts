import {
  Feature,
  FEATURE_ACCESS,
  FREE_TIER_LIMITS,
  SubscriptionData,
  SubscriptionTier,
} from '@/types/subscription';
import { Timestamp } from 'firebase/firestore';

/**
 * Check if a subscription is currently active
 */
export function isSubscriptionActive(subscription: Partial<SubscriptionData>): boolean {
  // If manually granted, always active
  if (subscription.manuallyGranted === true) {
    return true;
  }

  // Check if premium tier
  if (subscription.subscriptionTier !== 'premium') {
    return false;
  }

  // Check expiry date
  if (subscription.subscriptionEndDate) {
    const now = new Date();
    const endDate = subscription.subscriptionEndDate.toDate();

    if (now > endDate) {
      return false; // Expired
    }
  }

  // Check if cancelled
  if (subscription.cancelledAt) {
    return false;
  }

  return true;
}

/**
 * Get user's effective subscription tier
 */
export function getEffectiveTier(subscription: Partial<SubscriptionData>): SubscriptionTier {
  if (isSubscriptionActive(subscription)) {
    return 'premium';
  }
  return 'free';
}

/**
 * Check if user has access to a specific feature
 */
export function hasFeatureAccess(
  subscription: Partial<SubscriptionData>,
  feature: Feature
): boolean {
  const tier = getEffectiveTier(subscription);
  const allowedTiers = FEATURE_ACCESS[feature];
  return allowedTiers.includes(tier);
}

/**
 * Check if user can create a new portfolio position
 */
export function canCreatePosition(
  subscription: Partial<SubscriptionData>,
  currentPositionCount: number
): { allowed: boolean; reason?: string; limit?: number } {
  const tier = getEffectiveTier(subscription);

  if (tier === 'premium') {
    return { allowed: true };
  }

  // Free tier - check limit
  if (currentPositionCount >= FREE_TIER_LIMITS.MAX_POSITIONS) {
    return {
      allowed: false,
      reason: `Free tier limited to ${FREE_TIER_LIMITS.MAX_POSITIONS} positions`,
      limit: FREE_TIER_LIMITS.MAX_POSITIONS,
    };
  }

  return { allowed: true };
}

/**
 * Check if user can create a new account
 */
export function canCreateAccount(
  subscription: Partial<SubscriptionData>,
  currentAccountCount: number
): { allowed: boolean; reason?: string; limit?: number } {
  const tier = getEffectiveTier(subscription);

  if (tier === 'premium') {
    return { allowed: true };
  }

  // Free tier - check limit
  if (currentAccountCount >= FREE_TIER_LIMITS.MAX_ACCOUNTS) {
    return {
      allowed: false,
      reason: `Free tier limited to ${FREE_TIER_LIMITS.MAX_ACCOUNTS} account`,
      limit: FREE_TIER_LIMITS.MAX_ACCOUNTS,
    };
  }

  return { allowed: true };
}

/**
 * Check if user can create trading ideas
 */
export function canCreateIdea(subscription: Partial<SubscriptionData>): {
  allowed: boolean;
  reason?: string;
} {
  const tier = getEffectiveTier(subscription);

  if (tier === 'premium') {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'Creating trading ideas requires a premium subscription',
  };
}

/**
 * Get remaining positions for free tier
 */
export function getRemainingPositions(
  subscription: Partial<SubscriptionData>,
  currentPositionCount: number
): number {
  const tier = getEffectiveTier(subscription);

  if (tier === 'premium') {
    return Infinity;
  }

  const remaining = FREE_TIER_LIMITS.MAX_POSITIONS - currentPositionCount;
  return Math.max(0, remaining);
}

/**
 * Get subscription expiry info
 */
export function getSubscriptionExpiry(subscription: Partial<SubscriptionData>): {
  isExpiring: boolean;
  daysRemaining: number;
  expiryDate: Date | null;
} {
  if (!subscription.subscriptionEndDate) {
    return {
      isExpiring: false,
      daysRemaining: Infinity,
      expiryDate: null,
    };
  }

  const now = new Date();
  const endDate = subscription.subscriptionEndDate.toDate();
  const diffTime = endDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    isExpiring: daysRemaining <= 30 && daysRemaining > 0,
    daysRemaining: Math.max(0, daysRemaining),
    expiryDate: endDate,
  };
}

/**
 * Check if user is on trial
 */
export function isOnTrial(subscription: Partial<SubscriptionData>): boolean {
  if (!subscription.trialEndDate) {
    return false;
  }

  const now = new Date();
  const trialEnd = subscription.trialEndDate.toDate();

  return now <= trialEnd;
}

/**
 * Format subscription status for display
 */
export function formatSubscriptionStatus(subscription: Partial<SubscriptionData>): string {
  if (subscription.manuallyGranted) {
    if (subscription.premiumType === 'lifetime') {
      return 'Lifetime Premium';
    }
    return 'Premium (Complimentary)';
  }

  if (isOnTrial(subscription)) {
    return 'Trial';
  }

  if (isSubscriptionActive(subscription)) {
    return 'Premium';
  }

  const tier = subscription.subscriptionTier || 'free';
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}
