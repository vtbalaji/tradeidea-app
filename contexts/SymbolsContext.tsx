'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Symbol {
  id: string;
  symbol: string;
  name: string;
  exchange: 'NSE' | 'BSE';
  sector?: string;
  industry?: string;
  marketCap?: number;
  currency: string;
  isin?: string;
  isActive: boolean;
}

interface SymbolsContextType {
  searchSymbols: (query: string, maxResults?: number) => Promise<Symbol[]>;
  getSymbol: (symbolId: string) => Promise<Symbol | null>;
  loading: boolean;
}

const SymbolsContext = createContext<SymbolsContextType | undefined>(undefined);

export const useSymbols = () => {
  const context = useContext(SymbolsContext);
  if (!context) {
    throw new Error('useSymbols must be used within SymbolsProvider');
  }
  return context;
};

export const SymbolsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);

  // Search symbols by symbol code or name
  const searchSymbols = async (searchQuery: string, maxResults: number = 10): Promise<Symbol[]> => {
    if (!searchQuery || searchQuery.length < 1) return [];

    setLoading(true);
    try {
      const symbolsRef = collection(db, 'symbols');
      const searchTerm = searchQuery.toUpperCase();

      // Search by symbol (exact match or starts with)
      const symbolQuery = query(
        symbolsRef,
        where('symbol', '>=', searchTerm),
        where('symbol', '<=', searchTerm + '\uf8ff'),
        where('isActive', '==', true),
        orderBy('symbol'),
        limit(maxResults)
      );

      const snapshot = await getDocs(symbolQuery);
      const results = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Symbol[];

      // If no results, try searching by name
      if (results.length === 0) {
        const nameQuery = query(
          symbolsRef,
          where('searchName', '>=', searchTerm),
          where('searchName', '<=', searchTerm + '\uf8ff'),
          where('isActive', '==', true),
          limit(maxResults)
        );

        const nameSnapshot = await getDocs(nameQuery);
        return nameSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Symbol[];
      }

      return results;
    } catch (error) {
      console.error('Error searching symbols:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Get single symbol by ID
  const getSymbol = async (symbolId: string): Promise<Symbol | null> => {
    try {
      const symbolsRef = collection(db, 'symbols');
      const q = query(symbolsRef, where('symbol', '==', symbolId.toUpperCase()), limit(1));
      const snapshot = await getDocs(q);

      if (snapshot.empty) return null;

      return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
      } as Symbol;
    } catch (error) {
      console.error('Error getting symbol:', error);
      return null;
    }
  };

  return (
    <SymbolsContext.Provider value={{ searchSymbols, getSymbol, loading }}>
      {children}
    </SymbolsContext.Provider>
  );
};
