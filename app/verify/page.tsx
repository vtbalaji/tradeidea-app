'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { MyPortfolioIcon } from '@/components/icons';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [checking, setChecking] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const checkVerification = async () => {
      if (!user) {
        router.push('/login');
        return;
      }

      // Reload user to get latest verification status
      await user.reload();

      if (user.emailVerified) {
        setVerified(true);
        setChecking(false);
        // Redirect to ideas page after 2 seconds
        setTimeout(() => {
          router.push('/ideas');
        }, 2000);
      } else {
        setChecking(false);
      }
    };

    if (user) {
      checkVerification();
    }
  }, [user, router]);

  const handleCheckAgain = async () => {
    if (!user) return;

    setChecking(true);

    try {
      // Force reload the user from Firebase
      await user.reload();

      // Get fresh user object from auth
      const auth = user.auth;
      const currentUser = auth.currentUser;

      if (currentUser?.emailVerified) {
        setVerified(true);
        setTimeout(() => {
          router.push('/ideas');
        }, 2000);
      } else {
        setChecking(false);
        alert('Email not verified yet. Please check your inbox and click the verification link.');
      }
    } catch (error) {
      console.error('Error checking verification:', error);
      setChecking(false);
      alert('Error checking verification. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1419] flex items-center justify-center px-4">
      <div className="bg-white dark:bg-[#1c2128] rounded-xl p-8 w-full max-w-md border border-gray-200 dark:border-[#30363d] text-center">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-[#ff8c42] flex items-center justify-center">
            <MyPortfolioIcon size={48} />
          </div>
        </div>

        {checking ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Checking Verification...</h1>
            <div className="inline-block w-12 h-12 border-4 border-[#ff8c42] border-t-transparent rounded-full animate-spin mb-4"></div>
          </>
        ) : verified ? (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Email Verified!</h1>
            <p className="text-gray-600 dark:text-[#8b949e] mb-6">
              Your email has been successfully verified. Redirecting to TradeIdea...
            </p>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">📧</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Verify Your Email</h1>
            <p className="text-gray-600 dark:text-[#8b949e] mb-6">
              We've sent a verification link to <span className="text-gray-900 dark:text-white font-semibold">{user?.email}</span>.
              Please check your inbox and click the link to verify your account.
            </p>

            <div className="bg-gray-50 dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-2">Next steps:</p>
              <ol className="text-sm text-gray-600 dark:text-[#8b949e] list-decimal list-inside space-y-1">
                <li>Check your email inbox</li>
                <li>Click the verification link</li>
                <li>Return here and click "I've Verified"</li>
              </ol>
            </div>

            <button
              onClick={handleCheckAgain}
              className="w-full bg-[#ff8c42] hover:bg-[#ff9a58] text-white font-semibold py-3 px-4 rounded-lg transition-colors mb-3"
            >
              I've Verified My Email
            </button>

            <button
              onClick={() => router.push('/login')}
              className="w-full bg-gray-100 dark:bg-[#30363d] hover:bg-gray-200 dark:hover:bg-[#3c444d] text-gray-900 dark:text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
