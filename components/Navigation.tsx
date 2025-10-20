'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { IdeaIcon, SparklesIcon, TrendingIcon, MyPortfolioIcon, FilterIcon, UserIcon, BookIcon, HelpIcon, LogoutIcon, AccountsIcon } from '@/components/icons';
import NotificationBell from './NotificationBell';
import Logo from './Logo';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="bg-white dark:bg-[#1c2128] border-b border-gray-200 dark:border-[#30363d] px-5 py-3">
      <div className="flex justify-between items-center">
        {/* Left - Brand */}
        <Link href="/ideas" className="flex items-center gap-3">
          <Logo size={40} />
          <div className="text-base font-bold text-gray-900 dark:text-white leading-tight">TradeIdea</div>
        </Link>

        {/* Center - Nav Items - Desktop Only */}
        <div className="hidden md:flex gap-2">
          <Link
            href="/ideas"
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md ${
              pathname === '/ideas' ? 'bg-gray-100 dark:bg-[#30363d] text-gray-900 dark:text-white' : 'text-gray-600 dark:text-[#8b949e]'
            } font-semibold text-sm hover:bg-gray-100 dark:hover:bg-[#30363d] hover:text-gray-900 dark:hover:text-white transition-colors`}
          >
            <IdeaIcon size={18} />
            <span>Ideas Hub</span>
          </Link>

          <Link
            href="/portfolio"
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md ${
              pathname === '/portfolio' ? 'bg-gray-100 dark:bg-[#30363d] text-gray-900 dark:text-white' : 'text-gray-600 dark:text-[#8b949e]'
            } font-semibold text-sm hover:bg-gray-100 dark:hover:bg-[#30363d] hover:text-gray-900 dark:hover:text-white transition-colors`}
          >
            <TrendingIcon size={18} />
            <span>My Portfolio</span>
          </Link>

          <Link
            href="/risk-analysis"
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md ${
              pathname === '/risk-analysis' ? 'bg-gray-100 dark:bg-[#30363d] text-gray-900 dark:text-white' : 'text-gray-600 dark:text-[#8b949e]'
            } font-semibold text-sm hover:bg-gray-100 dark:hover:bg-[#30363d] hover:text-gray-900 dark:hover:text-white transition-colors`}
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="#ff8c42" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
              />
            </svg>
            <span>Reports</span>
          </Link>

          {/* <Link
            href="/accounts"
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md ${
              pathname === '/accounts' ? 'bg-gray-100 dark:bg-[#30363d] text-gray-900 dark:text-white' : 'text-gray-600 dark:text-[#8b949e]'
            } font-semibold text-sm hover:bg-gray-100 dark:hover:bg-[#30363d] hover:text-gray-900 dark:hover:text-white transition-colors`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M19 8V14M22 11H16M12.5 7C12.5 9.20914 10.7091 11 8.5 11C6.29086 11 4.5 9.20914 4.5 7C4.5 4.79086 6.29086 3 8.5 3C10.7091 3 12.5 4.79086 12.5 7Z" stroke="#ff8c42" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Accounts</span>
          </Link> */}

          <Link
            href="/screeners"
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md ${
              pathname === '/screeners' ? 'bg-gray-100 dark:bg-[#30363d] text-gray-900 dark:text-white' : 'text-gray-600 dark:text-[#8b949e]'
            } font-semibold text-sm hover:bg-gray-100 dark:hover:bg-[#30363d] hover:text-gray-900 dark:hover:text-white transition-colors`}
          >
            <FilterIcon size={18} />
            <span>Screeners</span>
          </Link>

          <Link
            href="/analysis"
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md ${
              pathname === '/analysis' ? 'bg-gray-100 dark:bg-[#30363d] text-gray-900 dark:text-white' : 'text-gray-600 dark:text-[#8b949e]'
            } font-semibold text-sm hover:bg-gray-100 dark:hover:bg-[#30363d] hover:text-gray-900 dark:hover:text-white transition-colors`}
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="#ff8c42" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <span>Analysis</span>
          </Link>

          <Link
            href="/ideas/new"
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md ${
              pathname === '/ideas/new' ? 'bg-gray-100 dark:bg-[#30363d] text-gray-900 dark:text-white' : 'text-gray-600 dark:text-[#8b949e]'
            } font-semibold text-sm hover:bg-gray-100 dark:hover:bg-[#30363d] hover:text-gray-900 dark:hover:text-white transition-colors`}
          >
            <SparklesIcon size={18} />
            <span>New Idea</span>
          </Link>
        </div>

        {/* Right - User Menu */}
        <div className="flex items-center gap-2">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden w-9 h-9 rounded-md bg-gray-200 dark:bg-[#30363d] flex items-center justify-center text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-[#3c444d] transition-colors"
          >
            {showMobileMenu ? '✕' : '☰'}
          </button>

          {/* Theme Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="w-9 h-9 rounded-full bg-gray-200 dark:bg-[#30363d] flex items-center justify-center text-base hover:bg-gray-300 dark:hover:bg-[#3c444d] transition-colors"
            >
              {theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '💻'}
            </button>

            {showThemeMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowThemeMenu(false)}
                />
                <div className="absolute top-12 right-0 bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg min-w-[140px] shadow-xl z-50">
                  <button
                    onClick={() => {
                      console.log('Setting theme to light');
                      setTheme('light');
                      setShowThemeMenu(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-[#30363d] transition-colors ${theme === 'light' ? 'bg-gray-50 dark:bg-[#30363d]' : ''}`}
                  >
                    <span className="text-lg">☀️</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">Light</span>
                  </button>
                  <button
                    onClick={() => {
                      console.log('Setting theme to dark');
                      setTheme('dark');
                      setShowThemeMenu(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-[#30363d] transition-colors ${theme === 'dark' ? 'bg-gray-50 dark:bg-[#30363d]' : ''}`}
                  >
                    <span className="text-lg">🌙</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">Dark</span>
                  </button>
                  <button
                    onClick={() => {
                      console.log('Setting theme to system');
                      setTheme('system');
                      setShowThemeMenu(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-[#30363d] transition-colors ${theme === 'system' ? 'bg-gray-50 dark:bg-[#30363d]' : ''}`}
                  >
                    <span className="text-lg">💻</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">System</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Notification Bell */}
          <div className="mr-2">
            <NotificationBell />
          </div>

          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-9 h-9 rounded-full bg-[#ff8c42] flex items-center justify-center hover:bg-[#ff9a58] transition-colors"
            >
              <span className="text-lg font-bold text-white">{user?.email?.charAt(0).toUpperCase() || 'U'}</span>
            </button>

            {showProfileMenu && (
              <>
                {/* Backdrop to close menu when clicking outside */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProfileMenu(false)}
                />

                {/* Dropdown Menu */}
                <div className="absolute top-12 right-0 bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-lg min-w-[180px] shadow-xl z-50">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      router.push('/profile');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-[#30363d] transition-colors"
                  >
                    <UserIcon size={18} />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      router.push('/accounts');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-[#30363d] transition-colors"
                  >
                    <AccountsIcon size={18} className="text-[#ff8c42]" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">Accounts</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      router.push('/guide');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-[#30363d] transition-colors"
                  >
                    <BookIcon size={18} />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">User Guide</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      router.push('/faq');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-[#30363d] transition-colors"
                  >
                    <HelpIcon size={18} />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">FAQ</span>
                  </button>

                  <div className="h-px bg-gray-200 dark:bg-[#30363d] mx-2" />

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-[#30363d] transition-colors"
                  >
                    <LogoutIcon size={18} />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">Logout</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {showMobileMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 z-40 md:hidden"
            onClick={() => setShowMobileMenu(false)}
          />

          {/* Menu Drawer */}
          <div className="fixed top-[57px] left-0 right-0 bg-white dark:bg-[#1c2128] border-b border-gray-200 dark:border-[#30363d] z-50 md:hidden">
            <div className="flex flex-col p-4 space-y-2">
              <Link
                href="/ideas"
                onClick={() => setShowMobileMenu(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-md ${
                  pathname === '/ideas' ? 'bg-gray-100 dark:bg-[#30363d] text-gray-900 dark:text-white' : 'text-gray-600 dark:text-[#8b949e]'
                } font-semibold text-sm hover:bg-gray-100 dark:hover:bg-[#30363d] hover:text-gray-900 dark:hover:text-white transition-colors`}
              >
                <IdeaIcon size={20} />
                <span>Ideas Hub</span>
              </Link>

              <Link
                href="/portfolio"
                onClick={() => setShowMobileMenu(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-md ${
                  pathname === '/portfolio' ? 'bg-gray-100 dark:bg-[#30363d] text-gray-900 dark:text-white' : 'text-gray-600 dark:text-[#8b949e]'
                } font-semibold text-sm hover:bg-gray-100 dark:hover:bg-[#30363d] hover:text-gray-900 dark:hover:text-white transition-colors`}
              >
                <TrendingIcon size={20} />
                <span>My Portfolio</span>
              </Link>

              <Link
                href="/risk-analysis"
                onClick={() => setShowMobileMenu(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-md ${
                  pathname === '/risk-analysis' ? 'bg-gray-100 dark:bg-[#30363d] text-gray-900 dark:text-white' : 'text-gray-600 dark:text-[#8b949e]'
                } font-semibold text-sm hover:bg-gray-100 dark:hover:bg-[#30363d] hover:text-gray-900 dark:hover:text-white transition-colors`}
              >
                <svg className="w-[20px] h-[20px]" fill="none" stroke="#ff8c42" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
                  />
                </svg>
                <span>Reports</span>
              </Link>

              {/* <Link
                href="/accounts"
                onClick={() => setShowMobileMenu(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-md ${
                  pathname === '/accounts' ? 'bg-gray-100 dark:bg-[#30363d] text-gray-900 dark:text-white' : 'text-gray-600 dark:text-[#8b949e]'
                } font-semibold text-sm hover:bg-gray-100 dark:hover:bg-[#30363d] hover:text-gray-900 dark:hover:text-white transition-colors`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M19 8V14M22 11H16M12.5 7C12.5 9.20914 10.7091 11 8.5 11C6.29086 11 4.5 9.20914 4.5 7C4.5 4.79086 6.29086 3 8.5 3C10.7091 3 12.5 4.79086 12.5 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Accounts</span>
              </Link> */}

              <Link
                href="/screeners"
                onClick={() => setShowMobileMenu(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-md ${
                  pathname === '/screeners' ? 'bg-gray-100 dark:bg-[#30363d] text-gray-900 dark:text-white' : 'text-gray-600 dark:text-[#8b949e]'
                } font-semibold text-sm hover:bg-gray-100 dark:hover:bg-[#30363d] hover:text-gray-900 dark:hover:text-white transition-colors`}
              >
                <FilterIcon size={20} />
                <span>Screeners</span>
              </Link>

              <Link
                href="/analysis"
                onClick={() => setShowMobileMenu(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-md ${
                  pathname === '/analysis' ? 'bg-gray-100 dark:bg-[#30363d] text-gray-900 dark:text-white' : 'text-gray-600 dark:text-[#8b949e]'
                } font-semibold text-sm hover:bg-gray-100 dark:hover:bg-[#30363d] hover:text-gray-900 dark:hover:text-white transition-colors`}
              >
                <svg className="w-[20px] h-[20px]" fill="none" stroke="#ff8c42" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <span>Analysis</span>
              </Link>

              <Link
                href="/ideas/new"
                onClick={() => setShowMobileMenu(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-md ${
                  pathname === '/ideas/new' ? 'bg-gray-100 dark:bg-[#30363d] text-gray-900 dark:text-white' : 'text-gray-600 dark:text-[#8b949e]'
                } font-semibold text-sm hover:bg-gray-100 dark:hover:bg-[#30363d] hover:text-gray-900 dark:hover:text-white transition-colors`}
              >
                <SparklesIcon size={20} />
                <span>New Idea</span>
              </Link>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
