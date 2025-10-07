'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../../components/Navigation';
import { useTrading } from '../../contexts/TradingContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatIndianDate } from '@/lib/dateUtils';

export default function ActivityPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { notifications, markNotificationAsRead } = useTrading();

  // Check authentication and email verification
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user && !user.emailVerified) {
      router.push('/verify');
    }
  }, [user, router]);

  const handleNotificationClick = async (notification: any) => {
    try {
      // Mark as read
      if (!notification.read) {
        await markNotificationAsRead(notification.id);
      }

      // Navigate to idea if applicable
      if (notification.ideaId) {
        router.push(`/ideas/${notification.ideaId}`);
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_idea':
        return '💡';
      case 'idea_update':
        return '🔄';
      case 'new_follower':
        return '👤';
      default:
        return '🔔';
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1419]">
      <Navigation />

      <div className="max-w-4xl mx-auto p-5">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Activity Feed</h1>
          <p className="text-sm text-gray-600 dark:text-[#8b949e]">
            Stay updated with new ideas from traders you follow
          </p>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔔</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No activity yet</h3>
              <p className="text-gray-600 dark:text-[#8b949e] mb-6">
                Start following traders to see their new ideas here
              </p>
              <button
                onClick={() => router.push('/ideas')}
                className="px-6 py-3 bg-[#ff8c42] hover:bg-[#ff9a58] text-white font-semibold rounded-lg transition-colors"
              >
                Browse Ideas
              </button>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-5 cursor-pointer transition-all hover:border-[#ff8c42] ${
                  !notification.read ? 'ring-2 ring-blue-500/20' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="text-3xl flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="text-base text-gray-900 dark:text-white leading-relaxed">
                        <span className="font-semibold text-[#ff8c42]">{notification.fromUserName}</span>{' '}
                        {notification.message}
                        {notification.ideaSymbol && (
                          <span className="font-bold text-gray-900 dark:text-white"> {notification.ideaSymbol}</span>
                        )}
                      </p>
                      {!notification.read && (
                        <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-[#8b949e]">
                      <span>{formatIndianDate(notification.createdAt, 'relative')}</span>
                      {notification.ideaId && (
                        <span className="text-[#ff8c42] hover:text-[#ff9a58] font-medium">View idea →</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
