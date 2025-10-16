'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { apiClient } from '@/lib/apiClient';

interface Account {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  color?: string;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

interface AccountsContextType {
  accounts: Account[];
  activeAccount: Account | null;
  setActiveAccount: (account: Account) => void;
  createAccount: (name: string, description?: string, color?: string) => Promise<void>;
  updateAccount: (accountId: string, updates: Partial<Account>) => Promise<void>;
  setDefaultAccount: (accountId: string) => Promise<void>;
  refreshAccounts: () => Promise<void>;
  loading: boolean;
}

const AccountsContext = createContext<AccountsContextType | undefined>(undefined);

export function AccountsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccount, setActiveAccountState] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch accounts from API
  const fetchAccounts = async () => {
    if (!user) {
      setAccounts([]);
      setActiveAccountState(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.accounts.list();
      const accountsList = response.accounts as Account[];

      console.log('AccountsContext - fetched accounts, count:', accountsList.length);

      // If no accounts exist, create default account
      if (accountsList.length === 0) {
        console.log('AccountsContext - No accounts found, creating default...');
        await createAccount('Primary', 'Main portfolio account', '#ff8c42');
        return; // fetchAccounts will be called again after creation
      }

      setAccounts(accountsList);

      // Set active account to default or first account
      const defaultAccount = accountsList.find(a => a.isDefault) || accountsList[0];

      // Only set if not already set or if the current active account is not in the list
      if (!activeAccount || !accountsList.find(a => a.id === activeAccount.id)) {
        setActiveAccountState(defaultAccount);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load accounts when user logs in
  useEffect(() => {
    fetchAccounts();
  }, [user]);

  const createAccount = async (name: string, description?: string, color?: string) => {
    if (!user) throw new Error('Not authenticated');

    try {
      await apiClient.accounts.create({ name, description, color });
      // Refresh accounts after creation
      await fetchAccounts();
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  };

  const updateAccount = async (accountId: string, updates: Partial<Account>) => {
    // Store old state for rollback
    const oldAccounts = accounts;

    try {
      // Optimistically update local state FIRST (instant UI update)
      setAccounts(prev =>
        prev.map(acc =>
          acc.id === accountId ? { ...acc, ...updates, updatedAt: new Date().toISOString() } : acc
        )
      );

      // Then update on server (in background)
      await apiClient.accounts.update(accountId, {
        name: updates.name,
        description: updates.description,
        color: updates.color,
      });

      // No need to refetch - optimistic update is enough
    } catch (error) {
      console.error('Error updating account:', error);
      // Rollback on error
      setAccounts(oldAccounts);
      throw error;
    }
  };

  const setDefaultAccount = async (accountId: string) => {
    if (!user) throw new Error('Not authenticated');

    // Store old state for rollback
    const oldAccounts = accounts;

    try {
      // Optimistically update local state FIRST (instant UI update)
      setAccounts(prev =>
        prev.map(acc => ({
          ...acc,
          isDefault: acc.id === accountId,
          updatedAt: new Date().toISOString(),
        }))
      );

      // Then update on server (in background)
      await apiClient.accounts.setDefault(accountId);

      // No need to refetch - optimistic update is enough
    } catch (error) {
      console.error('Error setting default account:', error);
      // Rollback on error
      setAccounts(oldAccounts);
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
        refreshAccounts: fetchAccounts,
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
