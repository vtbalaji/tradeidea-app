'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { useAccounts } from './AccountsContext';
import { getSymbolData } from '@/lib/symbolDataService';
import { checkAllAlerts } from '@/lib/alertChecker';

interface TradingIdea {
  id: string;
  symbol: string;
  title: string;
  analysis: string;
  visibility: string;
  tradeType: string;
  timeframe: string;
  riskLevel: string;
  entryPrice: number;
  stopLoss: number;
  target1: number;
  target2?: number | null;
  target3?: number | null;
  analysisType: string;
  tags: string[];
  status: string;
  userId: string;
  userEmail: string;
  userName: string;
  likes: number;
  likedBy: string[];
  followers: string[];
  commentCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface Transaction {
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  date: string;
  totalValue: number;
  timestamp: Timestamp;
}

interface ExitCriteria {
  exitBelow50EMA?: boolean;
  exitBelowPrice?: number | null;
  exitAtStopLoss?: boolean;
  exitAtTarget?: boolean;
  customNote?: string;
}

interface TechnicalData {
  lastPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  sma20: number;
  sma50: number;
  sma200: number;
  ema9: number;
  ema21: number;
  ema50: number;
  rsi14: number;
  bollingerUpper: number;
  bollingerMiddle: number;
  bollingerLower: number;
  macd: number;
  macdSignal: number;
  macdHistogram: number;
  volume: number;
  avgVolume20: number;
  signals?: any;
  overallSignal?: string;
  dataPoints?: number;
  symbol?: string;
  updatedAt?: any;
}

interface PortfolioPosition {
  id: string;
  ideaId: string;
  userId: string;
  accountId?: string; // NEW: Links position to account
  symbol: string;
  tradeType: string;
  entryPrice: number;
  currentPrice: number;
  target1: number;
  stopLoss: number;
  quantity: number;
  totalValue: number;
  status: 'open' | 'closed';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  closedAt?: Timestamp;
  exitPrice?: number;
  exitDate?: string;
  exitReason?: string;
  exitCriteria?: ExitCriteria;
  technicals?: TechnicalData;
  fundamentals?: any;
  transactions: Transaction[];
}

interface Comment {
  id: string;
  ideaId: string;
  userId: string;
  userEmail: string;
  userName: string;
  text: string;
  likes: number;
  createdAt: Timestamp;
}

interface Notification {
  id: string;
  userId: string;
  type: 'new_idea' | 'idea_update' | 'new_follower' | 'entry_alert' | 'target_alert' | 'stoploss_alert';
  fromUserId: string;
  fromUserName: string;
  ideaId?: string;
  ideaSymbol?: string;
  positionId?: string;
  message: string;
  read: boolean;
  createdAt: Timestamp;
}

interface TradingContextType {
  ideas: TradingIdea[];
  myPortfolio: PortfolioPosition[];
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  createIdea: (ideaData: Partial<TradingIdea>) => Promise<string>;
  updateIdea: (ideaId: string, updates: Partial<TradingIdea>) => Promise<void>;
  deleteIdea: (ideaId: string) => Promise<void>;
  toggleLike: (ideaId: string) => Promise<void>;
  toggleFollow: (ideaId: string) => Promise<void>;
  addComment: (ideaId: string, commentText: string) => Promise<void>;
  getComments: (ideaId: string) => Promise<Comment[]>;
  addToPortfolio: (ideaId: string, positionData: Partial<PortfolioPosition>) => Promise<string>;
  updatePosition: (positionId: string, updates: Partial<PortfolioPosition>) => Promise<void>;
  closePosition: (positionId: string, closeData: Partial<PortfolioPosition>) => Promise<void>;
  addTransaction: (positionId: string, transaction: Omit<Transaction, 'timestamp'>) => Promise<void>;
  exitTrade: (positionId: string, exitPrice: number, exitDate: string, exitReason?: string) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

export const useTrading = () => {
  const context = useContext(TradingContext);
  if (!context) {
    throw new Error('useTrading must be used within a TradingProvider');
  }
  return context;
};

interface TradingProviderProps {
  children: ReactNode;
}

export const TradingProvider: React.FC<TradingProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { selectedAccount } = useAccounts();
  const [ideas, setIdeas] = useState<TradingIdea[]>([]);
  const [myPortfolio, setMyPortfolio] = useState<PortfolioPosition[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Helper function to enrich data with central symbol data
  const enrichWithSymbolData = async <T extends { symbol: string; technicals?: any; fundamentals?: any; currentPrice?: number }>(
    items: T[]
  ): Promise<T[]> => {
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        try {
          // Add NS_ prefix for lookup
          const symbolId = `NS_${item.symbol}`;
          const symbolData = await getSymbolData(symbolId);

          if (symbolData) {
            // Build enriched object
            const enriched: any = {
              ...item,
              technicals: symbolData.technical || item.technicals,
              fundamentals: symbolData.fundamental || item.fundamentals,
            };

            // Update currentPrice with lastPrice for portfolio positions
            if ('currentPrice' in item && symbolData.technical?.lastPrice) {
              enriched.currentPrice = symbolData.technical.lastPrice;
            }

            return enriched as T;
          }
          return item;
        } catch (error) {
          console.error(`Error fetching symbol data for ${item.symbol}:`, error);
          return item;
        }
      })
    );
    return enrichedItems;
  };

  // Fetch all trading ideas
  useEffect(() => {
    if (!user) {
      setIdeas([]);
      setLoading(false);
      return;
    }

    const ideasRef = collection(db, 'tradingIdeas');
    const q = query(ideasRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const ideasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TradingIdea[];

      // Enrich with central symbol data
      const enrichedIdeas = await enrichWithSymbolData(ideasData);
      setIdeas(enrichedIdeas);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching ideas:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch user's portfolio
  useEffect(() => {
    if (!user) {
      setMyPortfolio([]);
      return;
    }

    const portfolioRef = collection(db, 'portfolios');
    const q = query(portfolioRef, where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const portfolioData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PortfolioPosition[];

      // Enrich with central symbol data
      const enrichedPortfolio = await enrichWithSymbolData(portfolioData);
      setMyPortfolio(enrichedPortfolio);
    }, (error) => {
      console.error('Error fetching portfolio:', error);
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch user's notifications
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];

      // Sort by createdAt in memory (newest first)
      notificationsData.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      setNotifications(notificationsData);
      setUnreadCount(notificationsData.filter(n => !n.read).length);
    }, (error) => {
      console.error('Error fetching notifications:', error);
    });

    return () => unsubscribe();
  }, [user]);

  // Monitor entry prices for "cooking" ideas and auto-update to "active" when within 1% variance
  useEffect(() => {
    if (!user || ideas.length === 0) return;

    const checkEntryPrices = async () => {
      const cookingIdeas = ideas.filter(idea => idea.status === 'cooking');

      // Group ideas by symbol to consolidate alerts per symbol
      const symbolToIdeas = new Map<string, typeof cookingIdeas>();
      cookingIdeas.forEach(idea => {
        if (!symbolToIdeas.has(idea.symbol)) {
          symbolToIdeas.set(idea.symbol, []);
        }
        symbolToIdeas.get(idea.symbol)!.push(idea);
      });

      // Process one alert per symbol
      for (const [symbol, symbolIdeas] of symbolToIdeas.entries()) {
        try {
          // Check if this symbol already has a recent alert (within last 24 hours)
          const oneDayAgo = new Date();
          oneDayAgo.setHours(oneDayAgo.getHours() - 24);

          const notificationsRef = collection(db, 'notifications');
          const existingAlertQuery = query(
            notificationsRef,
            where('ideaSymbol', '==', symbol),
            where('type', '==', 'entry_alert')
          );

          const existingAlerts = await getDocs(existingAlertQuery);
          const hasRecentAlert = existingAlerts.docs.some(doc => {
            const data = doc.data();
            const createdAt = data.createdAt?.toDate?.();
            return createdAt && createdAt > oneDayAgo;
          });

          if (hasRecentAlert) {
            console.log(`⏭️ Skipping duplicate entry alert for ${symbol} (recent alert exists)`);
            continue;
          }

          // Check all ideas for this symbol
          for (const idea of symbolIdeas) {
            const currentPrice = idea.technicals?.lastPrice;
            if (!currentPrice || !idea.entryPrice) continue;

            // Use common alert checker
            const alerts = checkAllAlerts({
              type: 'idea',
              symbol: idea.symbol,
              entryPrice: idea.entryPrice,
              currentPrice,
              technicals: idea.technicals,
              fundamentals: idea.fundamentals
            });

            // Process entry alerts
            for (const alert of alerts) {
              if (alert.type === 'entry_alert' && alert.shouldTrigger) {
                console.log(`🎯 Entry price hit for ${idea.symbol}!`, alert.metadata);

                // Update idea status to "active"
                const ideaRef = doc(db, 'tradingIdeas', idea.id);
                await updateDoc(ideaRef, {
                  status: 'active',
                  updatedAt: serverTimestamp()
                });

                // Notify the idea owner
                await addDoc(notificationsRef, {
                  userId: idea.userId,
                  type: 'entry_alert',
                  fromUserId: 'system',
                  fromUserName: 'TradeIdea',
                  ideaId: idea.id,
                  ideaSymbol: idea.symbol,
                  message: alert.message,
                  read: false,
                  createdAt: serverTimestamp()
                });

                // Notify all followers
                if (idea.followers && idea.followers.length > 0) {
                  const followerNotifications = idea.followers.map(followerId => {
                    if (followerId === idea.userId) return null; // Don't double-notify owner

                    return addDoc(notificationsRef, {
                      userId: followerId,
                      type: 'entry_alert',
                      fromUserId: idea.userId,
                      fromUserName: idea.userName || 'A trader',
                      ideaId: idea.id,
                      ideaSymbol: idea.symbol,
                      message: `idea ${alert.message}`,
                      read: false,
                      createdAt: serverTimestamp()
                    });
                  }).filter(Boolean);

                  await Promise.all(followerNotifications);
                  console.log(`✅ Notified ${followerNotifications.length} followers about ${idea.symbol} entry alert`);
                }

                // Only process the first triggered alert per symbol
                break;
              }
            }
          }
        } catch (error) {
          console.error(`Error checking entry price for ${symbol}:`, error);
        }
      }
    };

    // Check immediately on mount
    checkEntryPrices();

    // Then check once per day
    const interval = setInterval(checkEntryPrices, 86400000); // 24 hours

    return () => clearInterval(interval);
  }, [user, ideas]);

  // Monitor portfolio positions for target/stop-loss alerts
  useEffect(() => {
    if (!user || myPortfolio.length === 0) return;

    const checkPortfolioPrices = async () => {
      const openPositions = myPortfolio.filter(pos => pos.status === 'open');

      // Group positions by symbol to consolidate alerts per symbol
      const symbolToPositions = new Map<string, typeof openPositions>();
      openPositions.forEach(position => {
        if (!symbolToPositions.has(position.symbol)) {
          symbolToPositions.set(position.symbol, []);
        }
        symbolToPositions.get(position.symbol)!.push(position);
      });

      // Process one alert per symbol per type
      for (const [symbol, symbolPositions] of symbolToPositions.entries()) {
        try {
          // Check if this symbol already has recent alerts (within last 24 hours)
          const oneDayAgo = new Date();
          oneDayAgo.setHours(oneDayAgo.getHours() - 24);

          const notificationsRef = collection(db, 'notifications');
          const existingAlertQuery = query(
            notificationsRef,
            where('ideaSymbol', '==', symbol),
            where('userId', '==', user.uid)
          );

          const existingAlerts = await getDocs(existingAlertQuery);
          const recentAlertTypes = new Set<string>();
          existingAlerts.docs.forEach(doc => {
            const data = doc.data();
            const createdAt = data.createdAt?.toDate?.();
            if (createdAt && createdAt > oneDayAgo) {
              recentAlertTypes.add(data.type);
            }
          });

          // Check all positions for this symbol
          for (const position of symbolPositions) {
            const currentPrice = position.technicals?.lastPrice;
            if (!currentPrice) continue;

            // Use common alert checker
            const alerts = checkAllAlerts({
              type: 'portfolio',
              symbol: position.symbol,
              targetPrice: position.target1,
              stopLossPrice: position.stopLoss,
              currentPrice,
              exitCriteria: position.exitCriteria,
              technicals: position.technicals,
              fundamentals: position.fundamentals
            });

            // Process all triggered alerts, but skip if already sent for this symbol today
            for (const alert of alerts) {
              if (alert.shouldTrigger) {
                // Check if this alert type was already sent for this symbol today
                if (recentAlertTypes.has(alert.type)) {
                  console.log(`⏭️ Skipping duplicate ${alert.type} for ${symbol} (recent alert exists)`);
                  continue;
                }

                console.log(`${alert.type === 'target_alert' ? '🎯' : '⚠️'} Alert for ${position.symbol}!`, alert.metadata);

                await addDoc(notificationsRef, {
                  userId: position.userId,
                  type: alert.type,
                  fromUserId: 'system',
                  fromUserName: 'TradeIdea',
                  ideaId: position.ideaId,
                  positionId: position.id,
                  ideaSymbol: position.symbol,
                  message: alert.message,
                  read: false,
                  createdAt: serverTimestamp()
                });
                console.log(`✅ Created ${alert.type} notification for ${position.symbol}`);

                // Mark this alert type as sent for this symbol
                recentAlertTypes.add(alert.type);
              }
            }
          }
        } catch (error) {
          console.error(`Error checking portfolio prices for ${symbol}:`, error);
        }
      }
    };

    // Check immediately on mount
    checkPortfolioPrices();

    // Then check once per day
    const interval = setInterval(checkPortfolioPrices, 86400000); // 24 hours

    return () => clearInterval(interval);
  }, [user, myPortfolio]);

  // Create a new trading idea
  const createIdea = async (ideaData: Partial<TradingIdea>): Promise<string> => {
    if (!user) throw new Error('User must be logged in');

    try {
      const ideasRef = collection(db, 'tradingIdeas');
      const newIdea = {
        ...ideaData,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || user.email,
        likes: 0,
        likedBy: [],
        followers: [],
        commentCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(ideasRef, newIdea);

      // Find all users who follow this trader's ideas
      // Get all ideas by this user and collect unique followers
      const userIdeasQuery = query(
        collection(db, 'tradingIdeas'),
        where('userId', '==', user.uid)
      );
      const userIdeasSnapshot = await getDocs(userIdeasQuery);

      const followerIds = new Set<string>();
      userIdeasSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.followers && Array.isArray(data.followers)) {
          data.followers.forEach((followerId: string) => {
            if (followerId !== user.uid) { // Don't notify yourself
              followerIds.add(followerId);
            }
          });
        }
      });

      // Create notifications for all followers
      const notificationsRef = collection(db, 'notifications');
      const notificationPromises = Array.from(followerIds).map(followerId => {
        const notification = {
          userId: followerId,
          type: 'new_idea' as const,
          fromUserId: user.uid,
          fromUserName: user.displayName || user.email || 'A trader',
          ideaId: docRef.id,
          ideaSymbol: ideaData.symbol || '',
          message: 'posted a new trading idea:',
          read: false,
          createdAt: serverTimestamp()
        };
        return addDoc(notificationsRef, notification);
      });

      await Promise.all(notificationPromises);
      console.log(`✅ Created ${notificationPromises.length} notifications for new idea`);

      return docRef.id;
    } catch (error) {
      console.error('Error creating idea:', error);
      throw error;
    }
  };

  // Update an existing idea
  const updateIdea = async (ideaId: string, updates: Partial<TradingIdea>): Promise<void> => {
    if (!user) throw new Error('User must be logged in');

    try {
      const ideaRef = doc(db, 'tradingIdeas', ideaId);
      await updateDoc(ideaRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating idea:', error);
      throw error;
    }
  };

  // Delete an idea (actually marks it as closed instead of deleting)
  const deleteIdea = async (ideaId: string): Promise<void> => {
    if (!user) throw new Error('User must be logged in');

    try {
      const ideaRef = doc(db, 'tradingIdeas', ideaId);
      // Instead of deleting, update status to 'closed'
      await updateDoc(ideaRef, {
        status: 'closed',
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error closing idea:', error);
      throw error;
    }
  };

  // Like/Unlike an idea
  const toggleLike = async (ideaId: string): Promise<void> => {
    if (!user) throw new Error('User must be logged in');

    try {
      const ideaRef = doc(db, 'tradingIdeas', ideaId);
      const ideaDoc = await getDoc(ideaRef);

      if (ideaDoc.exists()) {
        const ideaData = ideaDoc.data();
        const likedBy = ideaData.likedBy || [];
        const hasLiked = likedBy.includes(user.uid);

        if (hasLiked) {
          // Unlike
          await updateDoc(ideaRef, {
            likes: (ideaData.likes || 1) - 1,
            likedBy: likedBy.filter((id: string) => id !== user.uid)
          });
        } else {
          // Like
          await updateDoc(ideaRef, {
            likes: (ideaData.likes || 0) + 1,
            likedBy: [...likedBy, user.uid]
          });
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  };

  // Follow/Unfollow an idea
  const toggleFollow = async (ideaId: string): Promise<void> => {
    if (!user) throw new Error('User must be logged in');

    try {
      const ideaRef = doc(db, 'tradingIdeas', ideaId);
      const ideaDoc = await getDoc(ideaRef);

      if (ideaDoc.exists()) {
        const ideaData = ideaDoc.data();
        const followers = ideaData.followers || [];
        const isFollowing = followers.includes(user.uid);

        if (isFollowing) {
          // Unfollow
          await updateDoc(ideaRef, {
            followers: followers.filter((id: string) => id !== user.uid)
          });
        } else {
          // Follow
          await updateDoc(ideaRef, {
            followers: [...followers, user.uid]
          });
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      throw error;
    }
  };

  // Add a comment to an idea
  const addComment = async (ideaId: string, commentText: string): Promise<void> => {
    if (!user) throw new Error('User must be logged in');

    try {
      const commentsRef = collection(db, 'comments');
      const newComment = {
        ideaId,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || user.email,
        text: commentText,
        likes: 0,
        createdAt: serverTimestamp()
      };

      console.log('💬 Adding comment:', newComment);
      const docRef = await addDoc(commentsRef, newComment);
      console.log('✅ Comment added with ID:', docRef.id);

      // Update comment count on idea
      const ideaRef = doc(db, 'tradingIdeas', ideaId);
      const ideaDoc = await getDoc(ideaRef);
      if (ideaDoc.exists()) {
        const newCount = (ideaDoc.data().commentCount || 0) + 1;
        await updateDoc(ideaRef, {
          commentCount: newCount
        });
        console.log('✅ Updated comment count to:', newCount);
      }
    } catch (error) {
      console.error('❌ Error adding comment:', error);
      throw error;
    }
  };

  // Get comments for an idea
  const getComments = async (ideaId: string): Promise<Comment[]> => {
    try {
      const commentsRef = collection(db, 'comments');
      const q = query(
        commentsRef,
        where('ideaId', '==', ideaId)
      );

      const snapshot = await getDocs(q);
      const comments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];

      // Sort by createdAt in memory (newest first)
      comments.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      console.log('📝 Fetched comments for idea', ideaId, ':', comments.length);
      return comments;
    } catch (error) {
      console.error('❌ Error fetching comments:', error);
      throw error;
    }
  };

  // Add a position to portfolio (I Took This Trade)
  const addToPortfolio = async (ideaId: string, positionData: Partial<PortfolioPosition>): Promise<string> => {
    if (!user) throw new Error('User must be logged in');

    try {
      const portfoliosRef = collection(db, 'portfolios');

      // Create initial buy transaction
      const initialTransaction = {
        type: 'buy' as const,
        quantity: positionData.quantity || 0,
        price: positionData.entryPrice || 0,
        date: positionData.dateTaken || new Date().toISOString().split('T')[0],
        totalValue: (positionData.quantity || 0) * (positionData.entryPrice || 0),
        timestamp: Timestamp.now()
      };

      // Clean undefined values from positionData
      const cleanedData = Object.fromEntries(
        Object.entries(positionData).filter(([_, value]) => value !== undefined)
      );

      const newPosition = {
        ...cleanedData,
        ideaId,
        userId: user.uid,
        accountId: cleanedData.accountId || selectedAccount?.id || `${user.uid}-primary`, // Use provided accountId, selected account, or default to user's primary
        status: 'open',
        transactions: [initialTransaction],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(portfoliosRef, newPosition);
      return docRef.id;
    } catch (error) {
      console.error('Error adding to portfolio:', error);
      throw error;
    }
  };

  // Update a portfolio position
  const updatePosition = async (positionId: string, updates: Partial<PortfolioPosition>): Promise<void> => {
    if (!user) throw new Error('User must be logged in');

    try {
      const positionRef = doc(db, 'portfolios', positionId);
      await updateDoc(positionRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating position:', error);
      throw error;
    }
  };

  // Close a position
  const closePosition = async (positionId: string, closeData: Partial<PortfolioPosition> & { exitReason?: string }): Promise<void> => {
    if (!user) throw new Error('User must be logged in');

    try {
      const positionRef = doc(db, 'portfolios', positionId);
      await updateDoc(positionRef, {
        ...closeData,
        status: 'closed',
        closedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error closing position:', error);
      throw error;
    }
  };

  // Add a buy/sell transaction to an existing position
  const addTransaction = async (positionId: string, transaction: Omit<Transaction, 'timestamp'>): Promise<void> => {
    if (!user) throw new Error('User must be logged in');

    try {
      const positionRef = doc(db, 'portfolios', positionId);
      const positionDoc = await getDoc(positionRef);

      if (!positionDoc.exists()) {
        throw new Error('Position not found');
      }

      const positionData = positionDoc.data() as PortfolioPosition;
      const transactions = positionData.transactions || [];

      const newTransaction = {
        ...transaction,
        timestamp: Timestamp.now()
      };

      // Calculate new average price and quantity
      let totalQuantity = positionData.quantity;
      let totalInvested = positionData.entryPrice * positionData.quantity;

      if (transaction.type === 'buy') {
        totalQuantity += transaction.quantity;
        totalInvested += transaction.totalValue;
      } else {
        totalQuantity -= transaction.quantity;
      }

      const newAvgPrice = totalQuantity > 0 ? totalInvested / totalQuantity : positionData.entryPrice;

      // If quantity becomes zero or negative after sell, close the position
      if (totalQuantity <= 0) {
        await updateDoc(positionRef, {
          transactions: [...transactions, newTransaction],
          quantity: 0,
          status: 'closed',
          exitPrice: transaction.price,
          exitDate: transaction.date,
          exitReason: 'Sold all shares',
          closedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        await updateDoc(positionRef, {
          transactions: [...transactions, newTransaction],
          quantity: totalQuantity,
          entryPrice: newAvgPrice,
          totalValue: totalQuantity * positionData.currentPrice,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  };

  // Exit a trade with exit price
  const exitTrade = async (positionId: string, exitPrice: number, exitDate: string, exitReason?: string): Promise<void> => {
    if (!user) throw new Error('User must be logged in');

    try {
      const positionRef = doc(db, 'portfolios', positionId);
      const positionDoc = await getDoc(positionRef);

      if (!positionDoc.exists()) {
        throw new Error('Position not found');
      }

      const positionData = positionDoc.data() as PortfolioPosition;
      const transactions = positionData.transactions || [];

      // Create exit transaction
      const exitTransaction = {
        type: 'sell' as const,
        quantity: positionData.quantity,
        price: exitPrice,
        date: exitDate,
        totalValue: exitPrice * positionData.quantity,
        timestamp: Timestamp.now()
      };

      await updateDoc(positionRef, {
        status: 'closed',
        exitPrice,
        exitDate,
        exitReason: exitReason || 'Manual exit',
        currentPrice: exitPrice,
        transactions: [...transactions, exitTransaction],
        closedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error exiting trade:', error);
      throw error;
    }
  };

  // Mark a notification as read
  const markNotificationAsRead = async (notificationId: string): Promise<void> => {
    if (!user) throw new Error('User must be logged in');

    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  };

  // Mark all notifications as read
  const markAllNotificationsAsRead = async (): Promise<void> => {
    if (!user) throw new Error('User must be logged in');

    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      const updatePromises = unreadNotifications.map(notification => {
        const notificationRef = doc(db, 'notifications', notification.id);
        return updateDoc(notificationRef, { read: true });
      });
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  };

  const value: TradingContextType = {
    ideas,
    myPortfolio,
    notifications,
    unreadCount,
    loading,
    createIdea,
    updateIdea,
    deleteIdea,
    toggleLike,
    toggleFollow,
    addComment,
    getComments,
    addToPortfolio,
    updatePosition,
    closePosition,
    addTransaction,
    exitTrade,
    markNotificationAsRead,
    markAllNotificationsAsRead
  };

  return (
    <TradingContext.Provider value={value}>
      {children}
    </TradingContext.Provider>
  );
};
