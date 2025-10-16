'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Symbol {
  id: string;          // NS_{SYMBOL}
  symbol: string;      // RELIANCE
  name: string;        // Reliance Industries Ltd
  exchange: string;    // NSE
  yahooSymbol: string; // RELIANCE.NS
  active: boolean;
  addedAt?: any;
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

    if (!db) {
      console.error('Firebase not initialized');
      return [];
    }

    setLoading(true);
    try {
      const symbolsRef = collection(db, 'symbols');
      const searchTerm = searchQuery.toUpperCase();

      // Search by originalSymbol field (which doesn't have NS_ prefix)
      const symbolQuery = query(
        symbolsRef,
        where('originalSymbol', '>=', searchTerm),
        where('originalSymbol', '<=', searchTerm + '\uf8ff'),
        orderBy('originalSymbol'),
        limit(maxResults)
      );

      const snapshot = await getDocs(symbolQuery);

      // Map results to match the Symbol interface
      const results = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            symbol: data.originalSymbol || data.symbol?.replace('NS_', ''), // Use originalSymbol, fallback to symbol without prefix
            name: data.name || '',
            exchange: 'NSE',
            yahooSymbol: `${data.originalSymbol || data.symbol?.replace('NS_', '')}.NS`,
            active: data.active !== false,
            addedAt: data.lastFetched
          } as Symbol;
        })
        .filter(symbol => symbol.active !== false);

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
    if (!db) {
      console.error('Firebase not initialized');
      return null;
    }

    try {
      const symbolsRef = collection(db, 'symbols');
      const searchId = symbolId.toUpperCase();

      // Try searching by originalSymbol first
      const q = query(symbolsRef, where('originalSymbol', '==', searchId), limit(1));
      const snapshot = await getDocs(q);

      if (snapshot.empty) return null;

      const data = snapshot.docs[0].data();
      return {
        id: snapshot.docs[0].id,
        symbol: data.originalSymbol || data.symbol?.replace('NS_', ''),
        name: data.name || '',
        exchange: 'NSE',
        yahooSymbol: `${data.originalSymbol || data.symbol?.replace('NS_', '')}.NS`,
        active: data.active !== false,
        addedAt: data.lastFetched
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
