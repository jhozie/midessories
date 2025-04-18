'use client';

import { CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SuccessPage({ params }: { params: { reference: string } }) {
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
                We'll send you a confirmation email with your order details
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