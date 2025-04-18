'use client';

import Link from 'next/link';
import { ShoppingBag, User, Search as SearchIcon, Menu } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import MiniCart from './MiniCart';
import { useState } from 'react';
import Search from './Search';

export default function Header() {
  const { itemCount, setIsCartOpen } = useCart();
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-100 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Left */}
          <div className="flex items-center gap-8">
            <button className="lg:hidden p-2 hover:bg-gray-50 rounded-xl">
              <Menu className="h-6 w-6 text-gray-600" />
            </button>
            <Link href="/" className="text-2xl font-bold">
              MIDECESSORIES
            </Link>
            <nav className="hidden lg:flex items-center gap-6">
              <Link href="/shop" className="text-sm font-medium text-gray-700 hover:text-pink-500">
                SHOP
              </Link>
              <Link href="/new" className="text-sm font-medium text-gray-700 hover:text-pink-500">
                NEW ARRIVALS
              </Link>
              <Link href="/collections" className="text-sm font-medium text-gray-700 hover:text-pink-500">
                COLLECTIONS
              </Link>
              <Link href="/about" className="text-sm font-medium text-gray-700 hover:text-pink-500">
                ABOUT
              </Link>
            </nav>
          </div>

          {/* Right */}
          <div className="flex items-center gap-4">
            <Search />
            <Link href="/account" className="p-2 hover:bg-gray-50 rounded-xl text-gray-600">
              <User className="h-5 w-5" />
            </Link>
            <div className="relative"
              onMouseEnter={() => setIsMiniCartOpen(true)}
              onMouseLeave={() => setIsMiniCartOpen(false)}
            >
              <button 
                onClick={() => setIsCartOpen(true)}
                className="p-2 hover:bg-gray-50 rounded-xl text-gray-600"
              >
                <ShoppingBag className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-pink-500 text-white text-xs rounded-full">
                    {itemCount}
                  </span>
                )}
              </button>
              {isMiniCartOpen && <MiniCart />}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
} 