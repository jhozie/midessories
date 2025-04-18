'use client';

import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import { useCart, CartItem } from '@/contexts/CartContext';
import Link from 'next/link';
import { formatNaira } from '@/lib/utils';

export default function CartSidebar() {
  const { items, isCartOpen, setIsCartOpen, updateQuantity, removeItem, total } = useCart();

  if (!isCartOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-[400px] bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            <span className="font-medium">Shopping Cart ({items.length})</span>
          </div>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Your cart is empty</p>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="mt-4 text-pink-500 hover:text-pink-600 font-medium"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            items.map((item) => (
              <CartItem key={item.id} item={item} />
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-4 space-y-4">
            <div className="flex items-center justify-between font-medium">
              <span>Subtotal</span>
              <p className="text-lg font-bold">
                {formatNaira(total)}
              </p>
            </div>
            <p className="text-sm text-gray-500">Shipping and taxes calculated at checkout</p>
            <Link
              href="/checkout"
              className="block w-full bg-pink-500 text-white text-center py-3 rounded-xl hover:bg-pink-600 transition-colors"
            >
              Checkout
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

// Cart Item Component
function CartItem({ item }: { item: CartItem }) {
  const { updateQuantity, removeItem } = useCart();

  return (
    <div className="flex gap-4">
      <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
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
            <h4 className="font-medium">{item.name}</h4>
            <p className="text-sm text-gray-500">
              {item.color && `Color: ${item.color}`}
              {item.size && ` • Size: ${item.size}`}
            </p>
          </div>
          <button 
            onClick={() => removeItem(item.id)}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center">{item.quantity}</span>
            <button 
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <p className="font-semibold">
            {formatNaira(item.price * item.quantity)}
          </p>
        </div>
      </div>
    </div>
  );
} 