'use client';

import { CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { triggerOrderConfirmationEmail } from '@/lib/emailTriggers';

export default function SuccessPage({ params }: { params: { reference: string } }) {
  const [isLoading, setIsLoading] = useState(true);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    // Get order data from localStorage instead of Firebase
    const sendOrderConfirmation = async () => {
      try {
        setIsLoading(true);
        
        // Try to get order data from localStorage
        const orderDataString = localStorage.getItem('lastOrder');
        if (!orderDataString) {
          console.error('No order data found in localStorage');
          setIsLoading(false);
          return;
        }
        
        const orderData = JSON.parse(orderDataString);
        
        // Get user data from localStorage
        const userDataString = localStorage.getItem('userData');
        const userData = userDataString ? JSON.parse(userDataString) : null;
        
        // Prepare user object for email
        const user = {
          email: orderData.customerEmail,
          firstName: orderData.shipping.address.firstName,
          lastName: orderData.shipping.address.lastName,
          ...userData
        };
        
        // Send confirmation email
        await triggerOrderConfirmationEmail(orderData, user);
        setEmailSent(true);
      } catch (error) {
        console.error('Error sending order confirmation:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    sendOrderConfirmation();
  }, [params.reference]);

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
            <p className="text-gray-600 mb-6">
              Your order #{params.reference} has been confirmed
            </p>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                {emailSent 
                  ? "We've sent you a confirmation email with your order details"
                  : isLoading 
                    ? "Sending confirmation email..."
                    : "We'll send you a confirmation email with your order details"}
              </p>
              <Link 
                href="/"
                className="inline-flex items-center gap-2 text-pink-500 hover:text-pink-600 font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Return to Homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 