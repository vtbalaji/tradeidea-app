'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { MyPortfolioIcon } from '@/components/icons';

export default function LoginPage() {
  const router = useRouter();
  const { login, signInWithGoogle, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      router.push('/ideas');
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await login(email, password);
      router.push('/ideas');
    } catch (error: any) {
      setError(error.message || 'Login failed');
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      router.push('/ideas');
    } catch (error: any) {
      setError(error.message || 'Google Sign-In failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0f1419] flex items-center justify-center px-4">
      <div className="bg-[#1c2128] rounded-xl p-8 w-full max-w-md border border-[#30363d]">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-[#ff8c42] flex items-center justify-center">
            <MyPortfolioIcon size={48} />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white text-center mb-2">
          Welcome to TradeIdea
        </h1>
        <p className="text-[#8b949e] text-center mb-8">
          Sign in to continue
        </p>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3 px-4 rounded-lg border border-gray-300 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mb-6"
        >
          <span className="text-xl font-bold text-blue-600">G</span>
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-[#30363d]"></div>
          <span className="text-[#8b949e] text-sm font-medium">OR</span>
          <div className="flex-1 h-px bg-[#30363d]"></div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          {/* Email Input */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-[#8b949e] mb-2">
              Email
            </label>
            <div className="flex items-center bg-[#0f1419] border border-[#30363d] rounded-lg px-3 py-3">
              <span className="text-lg mr-2">✉️</span>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-transparent text-white outline-none placeholder-[#8b949e]"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-[#8b949e] mb-2">
              Password
            </label>
            <div className="flex items-center bg-[#0f1419] border border-[#30363d] rounded-lg px-3 py-3">
              <span className="text-lg mr-2">🔒</span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 bg-transparent text-white outline-none placeholder-[#8b949e]"
                disabled={loading}
              />
            </div>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#ff8c42] hover:bg-[#ff9a58] text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed mb-5"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {/* Footer Links */}
        <div className="flex justify-between items-center text-sm">
          <button className="text-[#8b949e] hover:text-white transition-colors">
            Forgot password?
          </button>
          <button className="text-[#8b949e] hover:text-white transition-colors">
            Need an account? <span className="font-semibold text-white">Sign up</span>
          </button>
        </div>
      </div>
    </div>
  );
}
