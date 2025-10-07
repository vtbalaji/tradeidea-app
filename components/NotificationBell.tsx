'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTrading } from '../contexts/TradingContext';
import { formatIndianDate } from '@/lib/dateUtils';

export default function NotificationBell() {
  const router = useRouter();
  const { notifications, unreadCount, markNotificationAsRead, markAllNotificationsAsRead } = useTrading();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

      setIsOpen(false);
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
    } catch (error) {
      console.error('Error marking all as read:', error);
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
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-[#8b949e] hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path d="M8 16a2 2 0 0 0 1.985-1.75c.017-.137-.097-.25-.235-.25h-3.5c-.138 0-.252.113-.235.25A2 2 0 0 0 8 16z"/>
          <path d="M8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-[#ff8c42] rounded-full transform translate-x-1/2 -translate-y-1/2">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg shadow-lg overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-[#30363d]">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Notifications {unreadCount > 0 && `(${unreadCount})`}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-[#ff8c42] hover:text-[#ff9a58] transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-2">🔔</div>
                <p className="text-sm text-gray-600 dark:text-[#8b949e]">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-3 border-b border-gray-200 dark:border-[#30363d] cursor-pointer transition-colors ${
                    !notification.read
                      ? 'bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-[#0f1419]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white leading-relaxed">
                        <span className="font-semibold">{notification.fromUserName}</span>{' '}
                        {notification.message}
                        {notification.ideaSymbol && (
                          <span className="font-semibold text-[#ff8c42]"> {notification.ideaSymbol}</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-[#8b949e] mt-1">
                        {formatIndianDate(notification.createdAt, 'relative')}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-[#ff8c42] rounded-full flex-shrink-0 mt-1.5"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2 border-t border-gray-200 dark:border-[#30363d] bg-gray-50 dark:bg-[#0f1419]">
              <button
                onClick={() => {
                  router.push('/activity');
                  setIsOpen(false);
                }}
                className="w-full text-center text-sm text-[#ff8c42] hover:text-[#ff9a58] py-2 transition-colors"
              >
                View all activity
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
