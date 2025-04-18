'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    PaystackPop: any;
  }
}

type PaystackPaymentProps = {
  email: string;
  amount: number;
  reference: string;
  onSuccess: (reference: string) => void;
  onClose: () => void;
};

export default function PaystackPayment({
  email,
  amount,
  reference,
  onSuccess,
  onClose
}: PaystackPaymentProps) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkPaystackScript = () => {
      if (typeof window !== 'undefined' && window.PaystackPop) {
        setIsScriptLoaded(true);
      } else {
        setTimeout(checkPaystackScript, 100);
      }
    };

    checkPaystackScript();
  }, []);

  useEffect(() => {
    if (!isScriptLoaded || !email || !amount || !reference) return;

    try {
      const handler = window.PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email,
        amount: Math.round(amount * 100),
        ref: reference,
        currency: 'NGN',
        channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
        label: 'Midessories LTD',
        onClose: () => {
          router.push(`/checkout/failed/${reference}`);
          onClose();
        },
        callback: (response: any) => {
          if (response.status === 'success') {
            onSuccess(response.reference);
          } else {
            router.push(`/checkout/failed/${reference}`);
          }
        }
      });

      handler.openIframe();
    } catch (error) {
      console.error('Paystack setup error:', error);
      router.push(`/checkout/failed/${reference}`);
      onClose();
    }
  }, [isScriptLoaded, email, amount, reference, onSuccess, onClose, router]);

  return null;
} 