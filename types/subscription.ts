import { Timestamp } from 'firebase/firestore';

export type SubscriptionStatus = 'free' | 'premium' | 'trial' | 'expired';
export type SubscriptionTier = 'free' | 'premium';
export type PaymentProvider = 'razorpay' | null;
export type PremiumType = 'paid' | 'complimentary' | 'lifetime' | 'manual' | null;

export interface SubscriptionData {
  subscriptionStatus: SubscriptionStatus;
  subscriptionTier: SubscriptionTier;
  subscriptionStartDate: Timestamp | null;
  subscriptionEndDate: Timestamp | null;
  paymentProvider: PaymentProvider;

  // Payment gateway IDs
  razorpayCustomerId: string | null;
  razorpaySubscriptionId: string | null;
  lastPaymentDate: Timestamp | null;
  lastPaymentAmount: number | null;

  // Premium type tracking
  premiumType: PremiumType;

  // Admin control
  manuallyGranted: boolean;
  grantedBy: string | null;
  grantedReason: string | null;
  grantedAt: Timestamp | null;

  // Auto-renewal
  autoRenew: boolean;
  cancelledAt: Timestamp | null;

  // Trial
  trialStartDate: Timestamp | null;
  trialEndDate: Timestamp | null;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  duration: number; // in days
  features: string[];
  popular?: boolean;
}

export interface SubscriptionTransaction {
  userId: string;
  orderId: string;
  paymentId: string | null;
  subscriptionId: string | null;
  amount: number;
  currency: string;
  status: 'created' | 'paid' | 'failed' | 'refunded';
  planId: string;
  validFrom: Timestamp;
  validUntil: Timestamp;
  razorpaySignature: string | null;
  metadata: Record<string, any>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Define feature access levels
export enum Feature {
  MY_PORTFOLIO = 'myportfolio',
  REPORTS = 'reports',
  SCREENERS = 'screeners',
  ANALYSIS = 'analysis',
  ACCOUNT_MANAGEMENT = 'accounts',
  CREATE_IDEAS = 'create_ideas',
  VIEW_IDEAS = 'view_ideas',
  UNLIMITED_POSITIONS = 'unlimited_positions',
}

// Feature access mapping
export const FEATURE_ACCESS: Record<Feature, SubscriptionTier[]> = {
  [Feature.MY_PORTFOLIO]: ['premium'],
  [Feature.REPORTS]: ['premium'],
  [Feature.SCREENERS]: ['premium'],
  [Feature.ANALYSIS]: ['premium'],
  [Feature.ACCOUNT_MANAGEMENT]: ['premium'],
  [Feature.CREATE_IDEAS]: ['premium'],
  [Feature.VIEW_IDEAS]: ['free', 'premium'], // Everyone can view
  [Feature.UNLIMITED_POSITIONS]: ['premium'],
};

// Feature display names
export const FEATURE_NAMES: Record<Feature, string> = {
  [Feature.MY_PORTFOLIO]: 'My Portfolio',
  [Feature.REPORTS]: 'Reports & Risk Analysis',
  [Feature.SCREENERS]: 'Stock Screeners',
  [Feature.ANALYSIS]: 'Technical & Fundamental Analysis',
  [Feature.ACCOUNT_MANAGEMENT]: 'Multiple Accounts',
  [Feature.CREATE_IDEAS]: 'Create Trading Ideas',
  [Feature.VIEW_IDEAS]: 'View Trading Ideas',
  [Feature.UNLIMITED_POSITIONS]: 'Unlimited Positions',
};

// Free tier limits
export const FREE_TIER_LIMITS = {
  MAX_POSITIONS: 5,
  MAX_ACCOUNTS: 1,
  MAX_IDEAS: 0, // Cannot create ideas
  MAX_SCREENER_RESULTS: 10,
};

// Subscription plans
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'premium_yearly',
    name: 'Premium Yearly',
    price: 2999, // in INR
    currency: 'INR',
    duration: 365,
    popular: true,
    features: [
      'Unlimited portfolio positions',
      'Advanced reports and risk analysis',
      'Custom stock screeners',
      'Technical & fundamental analysis',
      'Multiple account management',
      'Create and share trading ideas',
      'Priority support',
      'No advertisements',
    ],
  },
];
