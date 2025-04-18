'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';

type PromoCodeProps = {
  onApply: (discount: number) => void;
  onRemove: () => void;
}

export default function PromoCode({ onApply, onRemove }: PromoCodeProps) {
  const [code, setCode] = useState('');
  const [isApplied, setIsApplied] = useState(false);
  const [error, setError] = useState('');

  // Mock promo codes - in real app, this would be validated on the server
  const promoCodes = {
    'WELCOME10': 10,
    'SAVE20': 20,
  };

  const handleApply = () => {
    const discount = promoCodes[code as keyof typeof promoCodes];
    if (discount) {
      onApply(discount);
      setIsApplied(true);
      setError('');
    } else {
      setError('Invalid promo code');
    }
  };

  const handleRemove = () => {
    setCode('');
    setIsApplied(false);
    setError('');
    onRemove();
  };

  return (
    <div className="space-y-2">
      {!isApplied ? (
        <>
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter promo code"
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500 uppercase"
            />
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Apply
            </button>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </>
      ) : (
        <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium">{code} applied</span>
          </div>
          <button
            onClick={handleRemove}
            className="p-1 hover:bg-green-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      )}
    </div>
  );
} 