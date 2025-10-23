'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { SubscriptionPlan } from '@/types/subscription';

interface PaymentButtonProps {
  plan: SubscriptionPlan;
  className?: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function PaymentButton({ plan, className }: PaymentButtonProps) {
  const { user, userData } = useAuth();
  const { refreshSubscription } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    if (!user || !userData) {
      setError('Please login to continue');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get auth token
      const token = await user.getIdToken();

      // Create order
      const orderResponse = await fetch('/api/subscription/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ planId: plan.id }),
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create order');
      }

      const orderData = await orderResponse.json();

      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);

        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      }

      // Open Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'MyPortfolio Premium',
        description: plan.name,
        order_id: orderData.orderId,
        prefill: {
          name: userData.displayName,
          email: userData.email,
          contact: userData.userMobileNo || '',
        },
        theme: {
          color: '#3b82f6',
        },
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/subscription/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId: plan.id,
              }),
            });

            if (!verifyResponse.ok) {
              throw new Error('Payment verification failed');
            }

            // Refresh subscription data
            await refreshSubscription();

            // Show success message
            alert('Payment successful! Your premium subscription is now active.');
            window.location.href = '/portfolio'; // Redirect to portfolio
          } catch (error) {
            console.error('Payment verification error:', error);
            setError('Payment verification failed. Please contact support.');
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error: any) {
      console.error('Payment error:', error);
      setError(error.message || 'Payment failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handlePayment}
        disabled={loading}
        className={className || 'w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed'}
      >
        {loading ? 'Processing...' : `Subscribe for ₹${plan.price.toLocaleString()}/year`}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
