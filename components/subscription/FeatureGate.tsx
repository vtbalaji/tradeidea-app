'use client';

import React, { ReactNode } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Feature, FEATURE_NAMES } from '@/types/subscription';
import { UpgradePrompt } from './UpgradePrompt';

interface FeatureGateProps {
  feature: Feature;
  children: ReactNode;
  fallback?: ReactNode;
  showPrompt?: boolean;
}

export function FeatureGate({
  feature,
  children,
  fallback,
  showPrompt = true,
}: FeatureGateProps) {
  const { hasAccess } = useSubscription();

  const hasFeatureAccess = hasAccess(feature);

  if (hasFeatureAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showPrompt) {
    return <UpgradePrompt featureName={FEATURE_NAMES[feature]} />;
  }

  return null;
}
