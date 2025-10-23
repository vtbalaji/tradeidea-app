'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  SubscriptionData,
  Feature,
  SUBSCRIPTION_PLANS,
} from '@/types/subscription';
import {
  isSubscriptionActive,
  hasFeatureAccess,
  canCreatePosition,
  canCreateAccount,
  canCreateIdea,
  getRemainingPositions,
  getSubscriptionExpiry,
  formatSubscriptionStatus,
  getEffectiveTier,
} from '@/lib/featureGate';

interface SubscriptionContextType {
  subscription: Partial<SubscriptionData> | null;
  loading: boolean;
  isActive: boolean;
  isPremium: boolean;
  isFree: boolean;

  // Feature access checks
  hasAccess: (feature: Feature) => boolean;
  canCreateNewPosition: (currentCount: number) => { allowed: boolean; reason?: string; limit?: number };
  canCreateNewAccount: (currentCount: number) => { allowed: boolean; reason?: string; limit?: number };
  canCreateNewIdea: () => { allowed: boolean; reason?: string };

  // Helper methods
  getRemainingPositionSlots: (currentCount: number) => number;
  getExpiryInfo: () => { isExpiring: boolean; daysRemaining: number; expiryDate: Date | null };
  getStatusDisplay: () => string;

  // Plans
  plans: typeof SUBSCRIPTION_PLANS;

  // Refresh subscription data
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { userData, user } = useAuth();
  const [subscription, setSubscription] = useState<Partial<SubscriptionData> | null>(null);
  const [loading, setLoading] = useState(true);

  // Load subscription data from userData
  useEffect(() => {
    if (userData) {
      const subscriptionData: Partial<SubscriptionData> = {
        subscriptionStatus: userData.subscriptionStatus || 'free',
        subscriptionTier: userData.subscriptionTier || 'free',
        subscriptionStartDate: userData.subscriptionStartDate || null,
        subscriptionEndDate: userData.subscriptionEndDate || null,
        paymentProvider: userData.paymentProvider || null,
        razorpayCustomerId: userData.razorpayCustomerId || null,
        razorpaySubscriptionId: userData.razorpaySubscriptionId || null,
        lastPaymentDate: userData.lastPaymentDate || null,
        lastPaymentAmount: userData.lastPaymentAmount || null,
        premiumType: userData.premiumType || null,
        manuallyGranted: userData.manuallyGranted || false,
        grantedBy: userData.grantedBy || null,
        grantedReason: userData.grantedReason || null,
        grantedAt: userData.grantedAt || null,
        autoRenew: userData.autoRenew || false,
        cancelledAt: userData.cancelledAt || null,
        trialStartDate: userData.trialStartDate || null,
        trialEndDate: userData.trialEndDate || null,
      };

      setSubscription(subscriptionData);
      setLoading(false);
    } else if (user === null) {
      // User not logged in
      setSubscription(null);
      setLoading(false);
    }
  }, [userData, user]);

  // Refresh subscription from server
  const refreshSubscription = async () => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/subscription/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error('Error refreshing subscription:', error);
    }
  };

  // Computed values
  const isActive = subscription ? isSubscriptionActive(subscription) : false;
  const effectiveTier = subscription ? getEffectiveTier(subscription) : 'free';
  const isPremium = effectiveTier === 'premium';
  const isFree = effectiveTier === 'free';

  // Feature access methods
  const hasAccess = (feature: Feature): boolean => {
    if (!subscription) return false;
    return hasFeatureAccess(subscription, feature);
  };

  const canCreateNewPosition = (currentCount: number) => {
    if (!subscription) return { allowed: false, reason: 'No subscription data' };
    return canCreatePosition(subscription, currentCount);
  };

  const canCreateNewAccount = (currentCount: number) => {
    if (!subscription) return { allowed: false, reason: 'No subscription data' };
    return canCreateAccount(subscription, currentCount);
  };

  const canCreateNewIdea = () => {
    if (!subscription) return { allowed: false, reason: 'No subscription data' };
    return canCreateIdea(subscription);
  };

  const getRemainingPositionSlots = (currentCount: number): number => {
    if (!subscription) return 0;
    return getRemainingPositions(subscription, currentCount);
  };

  const getExpiryInfo = () => {
    if (!subscription) {
      return { isExpiring: false, daysRemaining: 0, expiryDate: null };
    }
    return getSubscriptionExpiry(subscription);
  };

  const getStatusDisplay = (): string => {
    if (!subscription) return 'Free';
    return formatSubscriptionStatus(subscription);
  };

  const value: SubscriptionContextType = {
    subscription,
    loading,
    isActive,
    isPremium,
    isFree,
    hasAccess,
    canCreateNewPosition,
    canCreateNewAccount,
    canCreateNewIdea,
    getRemainingPositionSlots,
    getExpiryInfo,
    getStatusDisplay,
    plans: SUBSCRIPTION_PLANS,
    refreshSubscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
