'use client';

import { useCart } from '@/contexts/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

export default function MiniCart() {
  const { items, total } = useCart();

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-4">
      {items.length === 0 ? (
        <div className="text-center py-8">
          <ShoppingBag className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">Your cart is empty</p>
        </div>
      ) : (
        <>
          <div className="space-y-4 max-h-80 overflow-auto">
            {items.slice(0, 3).map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium">{item.name}</h4>
                  <p className="text-xs text-gray-500">
                    {item.color && `Color: ${item.color}`}
                    {item.size && ` • Size: ${item.size}`}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                    <span className="text-sm font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
            {items.length > 3 && (
              <p className="text-sm text-center text-gray-500">
                and {items.length - 3} more items...
              </p>
            )}
          </div>
          <div className="border-t mt-4 pt-4">
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium">Subtotal</span>
              <span className="font-medium">${total.toFixed(2)}</span>
            </div>
            <Link
              href="/cart"
              className="block w-full bg-pink-500 text-white text-center py-2 rounded-xl hover:bg-pink-600 transition-colors text-sm"
            >
              View Cart
            </Link>
          </div>
        </>
      )}
    </div>
  );
} 