'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface UserData {
  email: string;
  displayName: string;
  userMobileNo: string;
  farmMobileNo: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Subscription fields
  subscriptionStatus?: 'free' | 'premium' | 'trial' | 'expired';
  subscriptionTier?: 'free' | 'premium';
  subscriptionStartDate?: Timestamp | null;
  subscriptionEndDate?: Timestamp | null;
  paymentProvider?: 'razorpay' | null;
  razorpayCustomerId?: string | null;
  razorpaySubscriptionId?: string | null;
  lastPaymentDate?: Timestamp | null;
  lastPaymentAmount?: number | null;
  premiumType?: 'paid' | 'complimentary' | 'lifetime' | 'manual' | null;
  manuallyGranted?: boolean;
  grantedBy?: string | null;
  grantedReason?: string | null;
  grantedAt?: Timestamp | null;
  autoRenew?: boolean;
  cancelledAt?: Timestamp | null;
  trialStartDate?: Timestamp | null;
  trialEndDate?: Timestamp | null;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, password: string, displayName: string, userMobileNo: string, farmMobileNo: string) => Promise<any>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<any>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (updates: Partial<UserData>) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data() as UserData);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string, displayName: string, userMobileNo: string, farmMobileNo: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Send email verification
      await sendEmailVerification(result.user);

      // Save user data to Firestore
      await setDoc(doc(db, 'users', result.user.uid), {
        email: email,
        displayName: displayName,
        userMobileNo: userMobileNo,
        farmMobileNo: farmMobileNo,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        // Initialize with free tier
        subscriptionStatus: 'free',
        subscriptionTier: 'free',
        subscriptionStartDate: null,
        subscriptionEndDate: null,
        paymentProvider: null,
        razorpayCustomerId: null,
        razorpaySubscriptionId: null,
        lastPaymentDate: null,
        lastPaymentAmount: null,
        premiumType: null,
        manuallyGranted: false,
        grantedBy: null,
        grantedReason: null,
        grantedAt: null,
        autoRenew: false,
        cancelledAt: null,
        trialStartDate: null,
        trialEndDate: null,
      });

      // Sign out user until they verify email
      await signOut(auth);

      return result;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // Check if user exists in Firestore, if not create profile
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', result.user.uid), {
          email: result.user.email || '',
          displayName: result.user.displayName || '',
          userMobileNo: '',
          farmMobileNo: '',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          // Initialize with free tier
          subscriptionStatus: 'free',
          subscriptionTier: 'free',
          subscriptionStartDate: null,
          subscriptionEndDate: null,
          paymentProvider: null,
          razorpayCustomerId: null,
          razorpaySubscriptionId: null,
          lastPaymentDate: null,
          lastPaymentAmount: null,
          premiumType: null,
          manuallyGranted: false,
          grantedBy: null,
          grantedReason: null,
          grantedAt: null,
          autoRenew: false,
          cancelledAt: null,
          trialStartDate: null,
          trialEndDate: null,
        });
      }

      return result;
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw error;
    }
  };

  const updateUserProfile = async (updates: Partial<UserData>) => {
    try {
      if (user) {
        await setDoc(doc(db, 'users', user.uid), {
          ...userData,
          ...updates,
          updatedAt: Timestamp.now()
        });
        setUserData(prev => prev ? { ...prev, ...updates } : null);
      }
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    userData,
    login,
    register,
    logout,
    signInWithGoogle,
    resetPassword,
    updateUserProfile,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
