import { getAdminDb } from './firebaseAdmin';
import { SubscriptionData, Feature } from '@/types/subscription';
import { isSubscriptionActive, hasFeatureAccess, canCreatePosition, canCreateAccount } from './featureGate';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Get user's subscription data from Firestore
 */
export async function getUserSubscription(userId: string): Promise<Partial<SubscriptionData>> {
  const db = getAdminDb();
  const userDoc = await db.collection('users').doc(userId).get();

  if (!userDoc.exists) {
    throw new Error('User not found');
  }

  const userData = userDoc.data();

  // Return subscription fields
  return {
    subscriptionStatus: userData?.subscriptionStatus || 'free',
    subscriptionTier: userData?.subscriptionTier || 'free',
    subscriptionStartDate: userData?.subscriptionStartDate || null,
    subscriptionEndDate: userData?.subscriptionEndDate || null,
    paymentProvider: userData?.paymentProvider || null,
    razorpayCustomerId: userData?.razorpayCustomerId || null,
    razorpaySubscriptionId: userData?.razorpaySubscriptionId || null,
    lastPaymentDate: userData?.lastPaymentDate || null,
    lastPaymentAmount: userData?.lastPaymentAmount || null,
    premiumType: userData?.premiumType || null,
    manuallyGranted: userData?.manuallyGranted || false,
    grantedBy: userData?.grantedBy || null,
    grantedReason: userData?.grantedReason || null,
    grantedAt: userData?.grantedAt || null,
    autoRenew: userData?.autoRenew || false,
    cancelledAt: userData?.cancelledAt || null,
    trialStartDate: userData?.trialStartDate || null,
    trialEndDate: userData?.trialEndDate || null,
  };
}

/**
 * Verify if user has premium access (active subscription)
 */
export async function verifyPremiumAccess(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId);
  return isSubscriptionActive(subscription);
}

/**
 * Verify if user has access to a specific feature
 */
export async function verifyFeatureAccess(userId: string, feature: Feature): Promise<boolean> {
  const subscription = await getUserSubscription(userId);
  return hasFeatureAccess(subscription, feature);
}

/**
 * Verify if user can create a position (with count check)
 */
export async function verifyCanCreatePosition(
  userId: string,
  currentCount: number
): Promise<{ allowed: boolean; reason?: string; limit?: number }> {
  const subscription = await getUserSubscription(userId);
  return canCreatePosition(subscription, currentCount);
}

/**
 * Verify if user can create an account (with count check)
 */
export async function verifyCanCreateAccount(
  userId: string,
  currentCount: number
): Promise<{ allowed: boolean; reason?: string; limit?: number }> {
  const subscription = await getUserSubscription(userId);
  return canCreateAccount(subscription, currentCount);
}

/**
 * Update user subscription after payment
 */
export async function updateUserSubscription(
  userId: string,
  subscriptionData: Partial<SubscriptionData>
): Promise<void> {
  const db = getAdminDb();
  const userRef = db.collection('users').doc(userId);

  await userRef.update({
    ...subscriptionData,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Grant premium access manually (for admin use)
 */
export async function grantPremiumAccess(params: {
  userId: string;
  durationDays: number;
  reason: string;
  grantedBy: string;
  premiumType?: 'complimentary' | 'lifetime' | 'manual';
}): Promise<void> {
  const { userId, durationDays, reason, grantedBy, premiumType = 'complimentary' } = params;

  const db = getAdminDb();
  const userRef = db.collection('users').doc(userId);

  const now = Timestamp.now();
  const endDate = new Date();

  // Lifetime = 100 years from now
  if (durationDays === -1 || premiumType === 'lifetime') {
    endDate.setFullYear(endDate.getFullYear() + 100);
  } else {
    endDate.setDate(endDate.getDate() + durationDays);
  }

  await userRef.update({
    subscriptionStatus: 'premium',
    subscriptionTier: 'premium',
    premiumType,
    manuallyGranted: true,
    grantedBy,
    grantedReason: reason,
    grantedAt: now,
    subscriptionStartDate: now,
    subscriptionEndDate: Timestamp.fromDate(endDate),
    updatedAt: now,
  });
}

/**
 * Revoke premium access
 */
export async function revokePremiumAccess(userId: string): Promise<void> {
  const db = getAdminDb();
  const userRef = db.collection('users').doc(userId);

  const now = Timestamp.now();

  await userRef.update({
    subscriptionStatus: 'free',
    subscriptionTier: 'free',
    subscriptionEndDate: now,
    cancelledAt: now,
    updatedAt: now,
  });
}

/**
 * Extend subscription by days
 */
export async function extendSubscription(userId: string, additionalDays: number): Promise<void> {
  const subscription = await getUserSubscription(userId);

  if (!subscription.subscriptionEndDate) {
    throw new Error('No active subscription to extend');
  }

  const db = getAdminDb();
  const userRef = db.collection('users').doc(userId);

  const currentEndDate = subscription.subscriptionEndDate.toDate();
  const newEndDate = new Date(currentEndDate);
  newEndDate.setDate(newEndDate.getDate() + additionalDays);

  await userRef.update({
    subscriptionEndDate: Timestamp.fromDate(newEndDate),
    updatedAt: Timestamp.now(),
  });
}

/**
 * Check if user is an admin
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  const db = getAdminDb();
  const userDoc = await db.collection('users').doc(userId).get();

  if (!userDoc.exists) {
    return false;
  }

  const userData = userDoc.data();

  // Check if user email is in admin list
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || [];
  if (adminEmails.includes(userData?.email)) {
    return true;
  }

  // Check if user has isAdmin flag
  return userData?.isAdmin === true;
}

/**
 * Verify admin access (throws if not admin)
 */
export async function verifyAdminAccess(userId: string): Promise<void> {
  const isAdmin = await isUserAdmin(userId);

  if (!isAdmin) {
    throw new Error('Admin access required');
  }
}
