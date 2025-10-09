'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import {
  collection,
  addDoc,
  setDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';

interface Account {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  color?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface AccountsContextType {
  accounts: Account[];
  activeAccount: Account | null;
  setActiveAccount: (account: Account) => void;
  createAccount: (name: string, description?: string, color?: string) => Promise<void>;
  updateAccount: (accountId: string, updates: Partial<Account>) => Promise<void>;
  setDefaultAccount: (accountId: string) => Promise<void>;
  loading: boolean;
}

const AccountsContext = createContext<AccountsContextType | undefined>(undefined);

export function AccountsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccount, setActiveAccountState] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  // Load accounts when user logs in
  useEffect(() => {
    if (!user) {
      setAccounts([]);
      setActiveAccountState(null);
      setLoading(false);
      return;
    }

    const accountsQuery = query(
      collection(db, 'accounts'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(accountsQuery, async (snapshot) => {
      const accountsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Account[];

      console.log('AccountsContext - snapshot received, count:', accountsList.length);
      console.log('AccountsContext - accounts:', accountsList);

      // If no accounts exist, create default account
      if (accountsList.length === 0) {
        console.log('AccountsContext - No accounts found, creating default...');
        await createDefaultAccount(user.uid);
        return;
      }

      setAccounts(accountsList);
      console.log('AccountsContext - Set accounts:', accountsList);

      // Set active account to default or first account
      const defaultAccount = accountsList.find(a => a.isDefault) || accountsList[0];

      // Only set if not already set or if the current active account is not in the list
      if (!activeAccount || !accountsList.find(a => a.id === activeAccount.id)) {
        setActiveAccountState(defaultAccount);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const createDefaultAccount = async (userId: string) => {
    try {
      // Use userId-specific ID for the primary account to avoid conflicts
      const primaryAccountId = `${userId}-primary`;
      const primaryAccountRef = doc(db, 'accounts', primaryAccountId);
      await setDoc(primaryAccountRef, {
        userId,
        name: 'Primary',
        description: 'Main portfolio account',
        isDefault: true,
        color: '#ff8c42',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('Created default account with ID:', primaryAccountId);
    } catch (error) {
      console.error('Error creating default account:', error);
    }
  };

  const createAccount = async (name: string, description?: string, color?: string) => {
    if (!user) return;

    try {
      await addDoc(collection(db, 'accounts'), {
        userId: user.uid,
        name,
        description: description || '',
        isDefault: false,
        color: color || '#6b7280',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  };

  const updateAccount = async (accountId: string, updates: Partial<Account>) => {
    try {
      await updateDoc(doc(db, 'accounts', accountId), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating account:', error);
      throw error;
    }
  };

  const setDefaultAccount = async (accountId: string) => {
    if (!user) return;

    try {
      // Remove default from all accounts
      const batch = accounts.map(account =>
        updateDoc(doc(db, 'accounts', account.id), { isDefault: false })
      );
      await Promise.all(batch);

      // Set new default
      await updateDoc(doc(db, 'accounts', accountId), {
        isDefault: true,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error setting default account:', error);
      throw error;
    }
  };

  const setActiveAccount = (account: Account) => {
    setActiveAccountState(account);
    // Save to localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeAccountId', account.id);
    }
  };

  // Restore active account from localStorage on mount
  useEffect(() => {
    if (accounts.length > 0 && typeof window !== 'undefined') {
      const savedAccountId = localStorage.getItem('activeAccountId');
      if (savedAccountId) {
        const savedAccount = accounts.find(a => a.id === savedAccountId);
        if (savedAccount) {
          setActiveAccountState(savedAccount);
        }
      }
    }
  }, [accounts]);

  return (
    <AccountsContext.Provider
      value={{
        accounts,
        activeAccount,
        setActiveAccount,
        createAccount,
        updateAccount,
        setDefaultAccount,
        loading
      }}
    >
      {children}
    </AccountsContext.Provider>
  );
}

export function useAccounts() {
  const context = useContext(AccountsContext);
  if (context === undefined) {
    throw new Error('useAccounts must be used within an AccountsProvider');
  }
  return context;
}
