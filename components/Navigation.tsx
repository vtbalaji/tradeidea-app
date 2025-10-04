'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { IdeaIcon, SparklesIcon, TrendingIcon, MyPortfolioIcon } from '@/components/icons';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="bg-[#1c2128] border-b border-[#30363d] px-5 py-3">
      <div className="flex justify-between items-center">
        {/* Left - Brand */}
        <Link href="/ideas" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#ff8c42] flex items-center justify-center">
            <MyPortfolioIcon size={24} />
          </div>
          <div>
            <div className="text-base font-bold text-white leading-tight">TradeIdea</div>
            <div className="text-xs text-[#8b949e] leading-tight">Portfolio Manager</div>
          </div>
        </Link>

        {/* Center - Nav Items */}
        <div className="flex gap-2">
          <Link
            href="/ideas"
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md ${
              pathname === '/ideas' ? 'bg-[#30363d] text-white' : 'text-[#8b949e]'
            } font-semibold text-sm hover:bg-[#30363d] hover:text-white transition-colors`}
          >
            <IdeaIcon size={18} />
            <span>Ideas Hub</span>
          </Link>

          <Link
            href="/ideas/new"
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md ${
              pathname === '/ideas/new' ? 'bg-[#30363d] text-white' : 'text-[#8b949e]'
            } font-semibold text-sm hover:bg-[#30363d] hover:text-white transition-colors`}
          >
            <SparklesIcon size={18} />
            <span>New Idea</span>
          </Link>

          <Link
            href="/portfolio"
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md ${
              pathname === '/portfolio' ? 'bg-[#30363d] text-white' : 'text-[#8b949e]'
            } font-semibold text-sm hover:bg-[#30363d] hover:text-white transition-colors`}
          >
            <TrendingIcon size={18} />
            <span>My Portfolio</span>
          </Link>
        </div>

        {/* Right - User Menu */}
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 rounded-full bg-[#30363d] flex items-center justify-center text-base hover:bg-[#3c444d] transition-colors">
            🔔
          </button>


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
                <div className="absolute top-12 right-0 bg-[#1c2128] border border-[#30363d] rounded-lg min-w-[180px] shadow-xl z-50">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      router.push('/profile');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#30363d] transition-colors"
                  >
                    <span className="text-lg">👤</span>
                    <span className="text-sm font-semibold text-white">Profile</span>
                  </button>

                  <div className="h-px bg-[#30363d] mx-2" />

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#30363d] transition-colors"
                  >
                    <span className="text-lg">🚪</span>
                    <span className="text-sm font-semibold text-white">Logout</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
