'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { MyPortfolioIcon } from '@/components/icons';

export default function LoginPage() {
  const router = useRouter();
  const { login, register, signInWithGoogle, user } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [userMobileNo, setUserMobileNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      // Redirect based on verification status
      if (user.emailVerified) {
        router.push('/ideas');
      } else {
        router.push('/verify');
      }
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (isSignUp && (!displayName || !userMobileNo)) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    try {
      if (isSignUp) {
        await register(email, password, displayName, userMobileNo, '');
        // Show success message - user needs to verify email
        setError('');
        alert('Registration successful! Please check your email to verify your account before logging in.');
        setIsSignUp(false);
        setEmail('');
        setPassword('');
        setDisplayName('');
        setUserMobileNo('');
      } else {
        const result = await login(email, password);
        // Check if email is verified
        if (!result.user.emailVerified) {
          setError('Please verify your email before logging in. Check your inbox for the verification link.');
          return;
        }
        router.push('/ideas');
      }
    } catch (error: any) {
      setError(error.message || (isSignUp ? 'Sign up failed' : 'Login failed'));
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithGoogle();
      // Google sign-in doesn't require email verification
      // as Google has already verified the email
      router.push('/ideas');
    } catch (error: any) {
      setError(error.message || 'Google Sign-In failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1419] flex items-center justify-center px-4">
      <div className="bg-white dark:bg-[#1c2128] rounded-xl p-8 w-full max-w-md border border-gray-200 dark:border-[#30363d]">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-[#ff8c42] flex items-center justify-center">
            <MyPortfolioIcon size={48} />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-2">
          Welcome to TradeIdea
        </h1>
        <p className="text-gray-600 dark:text-[#8b949e] text-center mb-8">
          {isSignUp ? 'Create your account' : 'Sign in to continue'}
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
          className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-white font-semibold py-3 px-4 rounded-lg border border-gray-300 dark:border-gray-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mb-6"
        >
          <span className="text-xl font-bold text-blue-600">G</span>
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-gray-200 dark:bg-[#30363d]"></div>
          <span className="text-gray-600 dark:text-[#8b949e] text-sm font-medium">OR</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-[#30363d]"></div>
        </div>

        {/* Login/Signup Form */}
        <form onSubmit={handleSubmit}>
          {/* Display Name - Only for Sign Up */}
          {isSignUp && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-600 dark:text-[#8b949e] mb-2">
                Full Name
              </label>
              <div className="flex items-center bg-gray-50 dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-4 py-3 focus-within:border-[#ff8c42] transition-colors">
                <span className="text-lg mr-2">👤</span>
                <input
                  type="text"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="flex-1 bg-transparent text-gray-900 dark:text-white outline-none placeholder-gray-400 dark:placeholder-[#8b949e]"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* Email Input */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-600 dark:text-[#8b949e] mb-2">
              Email
            </label>
            <div className="flex items-center bg-gray-50 dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-3">
              <span className="text-lg mr-2">✉️</span>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-transparent text-gray-900 dark:text-white outline-none placeholder-gray-400 dark:placeholder-[#8b949e]"
                disabled={loading}
              />
            </div>
          </div>

          {/* Mobile Number - Only for Sign Up */}
          {isSignUp && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-600 dark:text-[#8b949e] mb-2">
                Mobile Number
              </label>
              <div className="flex items-center bg-gray-50 dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-4 py-3 focus-within:border-[#ff8c42] transition-colors">
                <span className="text-lg mr-2">📱</span>
                <input
                  type="tel"
                  placeholder="Your mobile number"
                  value={userMobileNo}
                  onChange={(e) => setUserMobileNo(e.target.value)}
                  className="flex-1 bg-transparent text-gray-900 dark:text-white outline-none placeholder-gray-400 dark:placeholder-[#8b949e]"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* Password Input */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-600 dark:text-[#8b949e] mb-2">
              Password
            </label>
            <div className="flex items-center bg-gray-50 dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-3">
              <span className="text-lg mr-2">🔒</span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 bg-transparent text-gray-900 dark:text-white outline-none placeholder-gray-400 dark:placeholder-[#8b949e]"
                disabled={loading}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#ff8c42] hover:bg-[#ff9a58] text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed mb-5"
          >
            {loading ? (isSignUp ? 'Creating account...' : 'Signing in...') : (isSignUp ? 'Sign up' : 'Sign in')}
          </button>
        </form>

        {/* Footer Links */}
        <div className="flex justify-between items-center text-sm">
          {!isSignUp && (
            <button className="text-gray-600 dark:text-[#8b949e] hover:text-gray-900 dark:hover:text-white transition-colors">
              Forgot password?
            </button>
          )}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
            className="text-gray-600 dark:text-[#8b949e] hover:text-gray-900 dark:hover:text-white transition-colors ml-auto"
          >
            {isSignUp ? (
              <>Already have an account? <span className="font-semibold text-gray-900 dark:text-white">Sign in</span></>
            ) : (
              <>Need an account? <span className="font-semibold text-gray-900 dark:text-white">Sign up</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
