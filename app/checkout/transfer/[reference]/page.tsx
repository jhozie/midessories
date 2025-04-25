'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Copy, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { triggerTransferOrderEmail } from '@/lib/emailTriggers';

export default function TransferConfirmationPage({ params }: { params: { reference: string } }) {
  const [copied, setCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    async function sendTransferOrderEmail() {
      try {
        // Get order data from localStorage
        const orderDataString = localStorage.getItem('lastOrder');
        if (!orderDataString) {
          console.error('No order data found in localStorage');
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
        
        // Send transfer order email
        await triggerTransferOrderEmail(orderData, user);
        setEmailSent(true);
      } catch (error) {
        console.error('Error sending transfer order email:', error);
      }
    }
    
    sendTransferOrderEmail();
  }, [params.reference]);

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="text-center mb-8">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Order Placed Successfully!</h1>
              <p className="text-gray-600">
                Please complete your payment using the bank details below
              </p>
              {emailSent && (
                <p className="text-sm text-green-600 mt-2">
                  We've sent you an email with your order details
                </p>
              )}
            </div>

            <div className="space-y-6">
              <div className="p-4 bg-blue-50 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">
                  Please use <strong>{params.reference}</strong> as your payment reference. 
                  This helps us track your payment and process your order quickly.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Bank Name</p>
                      <p className="font-medium">First Bank</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard('First Bank')}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Account Number</p>
                      <p className="font-medium">0123456789</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard('0123456789')}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Account Name</p>
                      <p className="font-medium">Midessories LTD</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard('Midessories LTD')}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>

              {copied && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg">
                  Copied to clipboard!
                </div>
              )}

              <div className="pt-6 text-center">
                <Link
                  href="/"
                  className="text-pink-500 hover:text-pink-600 font-medium"
                >
                  Return to Homepage
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 