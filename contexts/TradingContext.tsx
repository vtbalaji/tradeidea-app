'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { apiClient } from '@/lib/apiClient';

interface TradingIdea {
  id: string;
  symbol: string;
  title: string;
  analysis: string;
  visibility?: string;
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
  createdAt: string;
  updatedAt: string;
  technicals?: any;
  fundamentals?: any;
}

interface Comment {
  id: string;
  ideaId: string;
  userId: string;
  userName: string;
  userEmail: string;
  text: string;
  createdAt: string;
}

interface Notification {
  id: string;
  userId: string;
  type: string;
  ideaId?: string;
  ideaTitle?: string;
  fromUserId?: string;
  fromUserName?: string;
  commentText?: string;
  read: boolean;
  createdAt: string;
}

interface TradingContextType {
  ideas: TradingIdea[];
  loading: boolean;
  error: string | null;
  notifications: Notification[];
  unreadCount: number;

  // Ideas operations
  fetchIdeas: (filter?: string, status?: string) => Promise<void>;
  createIdea: (data: any) => Promise<any>;
  updateIdea: (ideaId: string, data: any) => Promise<void>;
  deleteIdea: (ideaId: string) => Promise<void>;
  toggleLike: (ideaId: string) => Promise<void>;
  toggleFollow: (ideaId: string) => Promise<void>;

  // Comments operations
  fetchComments: (ideaId: string) => Promise<Comment[]>;
  addComment: (ideaId: string, text: string) => Promise<void>;

  // Notifications operations
  fetchNotifications: () => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;

  // Portfolio operations (pass-through to apiClient)
  addToPortfolio: (ideaId: string, positionData: any) => Promise<void>;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

export const TradingProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<TradingIdea[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = (notifications || []).filter(n => !n.read).length;

  // Fetch ideas
  const fetchIdeas = async (filter?: string, status: string = 'active') => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.ideas.list(filter, status, 50);
      setIdeas(response.ideas || []);
    } catch (err: any) {
      console.error('Error fetching ideas:', err);
      // Don't show auth errors to user - they'll be redirected to login
      if (err.status !== 401) {
        setError(err.message || 'Failed to fetch ideas');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const response = await apiClient.notifications.list(false, 50);
      setNotifications(response.notifications || []);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      // Silently fail for notifications - not critical
    }
  };

  // Load ideas and notifications on mount
  useEffect(() => {
    if (user) {
      fetchIdeas();
      fetchNotifications();

      // Set up polling for updates (every 5 minutes)
      const interval = setInterval(() => {
        fetchIdeas();
        fetchNotifications();
      }, 300000); // 5 minutes

      return () => clearInterval(interval);
    } else {
      // Clear data when user logs out
      setIdeas([]);
      setNotifications([]);
      setLoading(false);
      setError(null);
    }
  }, [user]);

  // Create idea
  const createIdea = async (data: any) => {
    try {
      const response = await apiClient.ideas.create(data);
      await fetchIdeas(); // Refresh list
      return response;
    } catch (err: any) {
      console.error('Error creating idea:', err);
      throw err;
    }
  };

  // Update idea
  const updateIdea = async (ideaId: string, data: any) => {
    try {
      await apiClient.ideas.update(ideaId, data);
      await fetchIdeas(); // Refresh list
    } catch (err: any) {
      console.error('Error updating idea:', err);
      throw err;
    }
  };

  // Delete idea
  const deleteIdea = async (ideaId: string) => {
    try {
      await apiClient.ideas.delete(ideaId);
      await fetchIdeas(); // Refresh list
    } catch (err: any) {
      console.error('Error deleting idea:', err);
      throw err;
    }
  };

  // Toggle like
  const toggleLike = async (ideaId: string) => {
    if (!user) return;

    const idea = ideas.find(i => i.id === ideaId);
    if (!idea) return;

    const isLiked = idea.likedBy?.includes(user.uid);

    try {
      // Optimistic update
      setIdeas(prevIdeas =>
        prevIdeas.map(i =>
          i.id === ideaId
            ? {
                ...i,
                likes: isLiked ? i.likes - 1 : i.likes + 1,
                likedBy: isLiked
                  ? i.likedBy.filter(id => id !== user.uid)
                  : [...i.likedBy, user.uid],
              }
            : i
        )
      );

      await apiClient.ideas.like(ideaId, !isLiked);
    } catch (err: any) {
      console.error('Error toggling like:', err);
      // Revert on error
      await fetchIdeas();
    }
  };

  // Toggle follow
  const toggleFollow = async (ideaId: string) => {
    if (!user) return;

    const idea = ideas.find(i => i.id === ideaId);
    if (!idea) return;

    const isFollowing = idea.followers?.includes(user.uid);

    try {
      // Optimistic update
      setIdeas(prevIdeas =>
        prevIdeas.map(i =>
          i.id === ideaId
            ? {
                ...i,
                followers: isFollowing
                  ? i.followers.filter(id => id !== user.uid)
                  : [...i.followers, user.uid],
              }
            : i
        )
      );

      await apiClient.ideas.follow(ideaId, !isFollowing);
    } catch (err: any) {
      console.error('Error toggling follow:', err);
      // Revert on error
      await fetchIdeas();
    }
  };

  // Fetch comments for an idea
  const fetchComments = async (ideaId: string): Promise<Comment[]> => {
    try {
      const response = await apiClient.ideas.comments.list(ideaId);
      return response.comments || [];
    } catch (err: any) {
      console.error('Error fetching comments:', err);
      return [];
    }
  };

  // Add comment
  const addComment = async (ideaId: string, text: string) => {
    try {
      await apiClient.ideas.comments.create(ideaId, text);

      // Update comment count locally
      setIdeas(prevIdeas =>
        prevIdeas.map(i =>
          i.id === ideaId ? { ...i, commentCount: i.commentCount + 1 } : i
        )
      );
    } catch (err: any) {
      console.error('Error adding comment:', err);
      throw err;
    }
  };

  // Mark notification as read
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      // Optimistic update
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
      );

      await apiClient.notifications.markAsRead(notificationId);
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      // Revert on error
      await fetchNotifications();
    }
  };

  // Mark all notifications as read
  const markAllNotificationsAsRead = async () => {
    try {
      // Optimistic update
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));

      await apiClient.notifications.markAllAsRead();
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err);
      // Revert on error
      await fetchNotifications();
    }
  };

  // Add to portfolio (pass-through to API client)
  const addToPortfolio = async (ideaId: string, positionData: any) => {
    try {
      await apiClient.portfolio.create({
        ideaId,
        ...positionData,
      });
    } catch (err: any) {
      console.error('Error adding to portfolio:', err);
      throw err;
    }
  };

  const value: TradingContextType = {
    ideas,
    loading,
    error,
    notifications,
    unreadCount,
    fetchIdeas,
    createIdea,
    updateIdea,
    deleteIdea,
    toggleLike,
    toggleFollow,
    fetchComments,
    addComment,
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    addToPortfolio,
  };

  return <TradingContext.Provider value={value}>{children}</TradingContext.Provider>;
};

export const useTrading = () => {
  const context = useContext(TradingContext);
  if (context === undefined) {
    throw new Error('useTrading must be used within a TradingProvider');
  }
  return context;
};
