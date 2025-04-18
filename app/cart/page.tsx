'use client';

import { Minus, Plus, ShoppingBag, Trash2, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { formatNaira } from '@/lib/utils';
import { useState, useEffect } from 'react';

export default function CartPage() {
  const { items, updateQuantity, removeItem, total } = useCart();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen pt-32 pb-20">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 w-48 rounded mb-8" />
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!items || items.length === 0) {
    return (
      <main className="min-h-screen pt-32 pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center py-20">
            <div className="bg-pink-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-12 h-12 text-pink-500" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
            <p className="text-gray-600 mb-8">
              Looks like you haven't added anything to your cart yet.
            </p>
            <Link 
              href="/shop"
              className="inline-flex items-center justify-center px-8 py-3 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Shopping Cart ({items.length})</h1>
          <Link 
            href="/shop" 
            className="text-gray-500 hover:text-gray-700 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Continue Shopping
          </Link>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {items.map((item) => (
              <div 
                key={item.id} 
                className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-pink-100 transition-colors"
              >
                <div className="flex gap-6">
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-medium hover:text-pink-500 transition-colors">
                          <Link href={`/product/${item.id}`}>{item.name}</Link>
                        </h3>
                        {(item.color || item.size) && (
                          <p className="text-sm text-gray-500 mt-1 space-x-2">
                            {item.color && (
                              <span className="inline-flex items-center">
                                <span className="w-3 h-3 rounded-full mr-1" 
                                      style={{ backgroundColor: item.color.toLowerCase() }} />
                                {item.color}
                              </span>
                            )}
                            {item.size && <span>Size: {item.size}</span>}
                          </p>
                        )}
                      </div>
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="p-2 hover:bg-pink-50 rounded-lg transition-colors group"
                      >
                        <Trash2 className="w-5 h-5 text-gray-400 group-hover:text-pink-500" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:border-pink-500 hover:bg-pink-50 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:border-pink-500 hover:bg-pink-50 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="font-medium text-lg">
                        {formatNaira(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:sticky lg:top-32">
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h2 className="text-lg font-bold mb-6">Order Summary</h2>
              <div className="space-y-4 pb-6 border-b">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({items.length} items)</span>
                  <span className="font-medium text-black">{formatNaira(total)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="font-medium text-black">Calculated at checkout</span>
                </div>
              </div>
              <div className="flex justify-between py-6 border-b">
                <span className="text-lg font-bold">Total</span>
                <span className="text-lg font-bold text-pink-500">{formatNaira(total)}</span>
              </div>
              <Link
                href="/checkout"
                className="w-full bg-pink-500 text-white py-4 rounded-xl mt-6 hover:bg-pink-600 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                Proceed to Checkout
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 