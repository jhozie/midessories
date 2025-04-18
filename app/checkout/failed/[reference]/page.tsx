'use client';

import { XCircle, ArrowLeft, RefreshCcw } from 'lucide-react';
import Link from 'next/link';

export default function FailedPage({ params }: { params: { reference: string } }) {
  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-2">Payment Failed</h1>
            <p className="text-gray-600 mb-6">
              Something went wrong with order #{params.reference}
            </p>
            <div className="space-y-4">
              <Link 
                href="/checkout"
                className="inline-block bg-pink-500 text-white px-6 py-3 rounded-xl hover:bg-pink-600"
              >
                <span className="flex items-center gap-2">
                  <RefreshCcw className="w-4 h-4" />
                  Try Again
                </span>
              </Link>
              <div>
                <Link 
                  href="/"
                  className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-600"
                >
                  <ArrowLeft className="w-4 h-4" />
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