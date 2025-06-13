'use client';

import Link from 'next/link';
import { ShoppingBag, User, Search as SearchIcon, Menu, X, ChevronDown } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import MiniCart from './MiniCart';
import { useState, useEffect } from 'react';
import Search from './Search';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export default function Header() {
  const { itemCount, setIsCartOpen } = useCart();
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isShopDropdownOpen, setIsShopDropdownOpen] = useState(false);
  const pathname = usePathname();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm' : 'bg-white'
      }`}>
        {/* Announcement bar */}
        <div className="bg-[#DA0988] text-white py-2 text-center text-sm font-medium">
          New arrivals just dropped! Shop the latest collection today
        </div>
        
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Left */}
            <div className="flex items-center gap-4 md:gap-8">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 hover:bg-gray-50 rounded-xl transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6 text-gray-600" />
                ) : (
                  <Menu className="h-6 w-6 text-gray-600" />
                )}
              </button> 
              <div>
                <Link href="/">
                  <Image src="/logo-mide.jpg" alt="Midessories" width={60} height={40} className="rounded-md" />
                </Link>
              </div>
              <nav className="hidden lg:flex items-center gap-6">
                <Link
                  href="/shop"
                  className={`text-sm font-medium hover:text-pink-500 transition-colors relative py-2 ${
                    pathname.startsWith('/shop') ? 'text-pink-500' : 'text-gray-700'
                  }`}
                >
                  Shop
                  {pathname.startsWith('/shop') && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-pink-500 rounded-full"></span>
                  )}
                </Link>
                <Link 
                  href="/category/bags" 
                  className={`text-sm font-medium hover:text-pink-500 transition-colors relative py-2 ${
                    pathname.startsWith('/category/bags') ? 'text-pink-500' : 'text-gray-700'
                  }`}
                >
                  Bags
                  {pathname.startsWith('/category/bags') && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-pink-500 rounded-full"></span>
                  )}
                </Link>
                <Link 
                  href="/category/sunglasses" 
                  className={`text-sm font-medium hover:text-pink-500 transition-colors relative py-2 ${
                    pathname.startsWith('/category/sunglasses') ? 'text-pink-500' : 'text-gray-700'
                  }`}
                >
                  Sunglasses
                  {pathname.startsWith('/category/sunglasses') && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-pink-500 rounded-full"></span>
                  )}
                </Link>
                <Link 
                  href="/category/jewelleries" 
                  className={`text-sm font-medium hover:text-pink-500 transition-colors relative py-2 ${
                    pathname.startsWith('/category/jewelleries') ? 'text-pink-500' : 'text-gray-700'
                  }`}
                >
                  Jewelleries
                  {pathname.startsWith('/category/jewelleries') && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-pink-500 rounded-full"></span>
                  )}
                </Link>
                <Link 
                  href="/category/hair-accessories" 
                  className={`text-sm font-medium hover:text-pink-500 transition-colors relative py-2 ${
                    pathname.startsWith('/category/hair-accessories') ? 'text-pink-500' : 'text-gray-700'
                  }`}
                >
                  Hair Accessories
                  {pathname.startsWith('/category/hair-accessories') && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-pink-500 rounded-full"></span>
                  )}
                </Link>
                <Link
                  href="/about"
                  className={`text-sm font-medium hover:text-pink-500 transition-colors relative py-2 ${
                    pathname.startsWith('/about') ? 'text-pink-500' : 'text-gray-700'
                  }`}
                >
                  About
                  {pathname.startsWith('/about') && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-pink-500 rounded-full"></span>
                  )}
                </Link>
              </nav>
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
              <Search />
              <Link 
                href="/account" 
                className="p-2 hover:bg-gray-50 rounded-xl text-gray-600 transition-colors flex items-center gap-1"
              >
                <User className="h-5 w-5" />
                <span className="hidden md:inline text-sm font-medium">Account</span>
              </Link>
              <div 
                className="relative"
                onMouseEnter={() => setIsMiniCartOpen(true)}
                onMouseLeave={() => setIsMiniCartOpen(false)}
              >
                <button 
                  onClick={() => setIsCartOpen(true)}
                  className="p-2 hover:bg-gray-50 rounded-xl text-gray-600 transition-colors flex items-center gap-1"
                  aria-label="Cart"
                >
                  <ShoppingBag className="h-5 w-5" />
                  <span className="hidden md:inline text-sm font-medium">Cart</span>
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

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Panel */}
      <div className={`lg:hidden fixed top-0 bottom-0 left-0 w-[280px] bg-white z-50 transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } shadow-xl`}>
        <div className="pt-24 px-6 h-full overflow-y-auto">
          <nav className="flex flex-col gap-4">
            <Link 
              href="/shop"
              className={`block px-4 py-2 rounded-lg text-lg font-medium transition-colors ${
                pathname.startsWith('/shop') ? 'bg-pink-50 text-pink-500' : 'hover:bg-gray-50'
              }`}
            >
              Shop
            </Link>
            <Link 
              href="/category/bags"
              className={`block px-4 py-2 rounded-lg text-lg font-medium transition-colors ${
                pathname.startsWith('/category/bags') ? 'bg-pink-50 text-pink-500' : 'hover:bg-gray-50'
              }`}
            >
              Bags
            </Link>
            <Link 
              href="/category/sunglasses"
              className={`block px-4 py-2 rounded-lg text-lg font-medium transition-colors ${
                pathname.startsWith('/category/sunglasses') ? 'bg-pink-50 text-pink-500' : 'hover:bg-gray-50'
              }`}
            >
              Sunglasses
            </Link>
            <Link 
              href="/category/jewelleries"
              className={`block px-4 py-2 rounded-lg text-lg font-medium transition-colors ${
                pathname.startsWith('/category/jewelleries') ? 'bg-pink-50 text-pink-500' : 'hover:bg-gray-50'
              }`}
            >
              Jewelleries
            </Link>
            <Link 
              href="/category/hair-accessories"
              className={`block px-4 py-2 rounded-lg text-lg font-medium transition-colors ${
                pathname.startsWith('/category/hair-accessories') ? 'bg-pink-50 text-pink-500' : 'hover:bg-gray-50'
              }`}
            >
              Hair Accessories
            </Link>
            <Link 
              href="/about"
              className={`block px-4 py-2 rounded-lg text-lg font-medium transition-colors ${
                pathname.startsWith('/about') ? 'bg-pink-50 text-pink-500' : 'hover:bg-gray-50'
              }`}
            >
              About
            </Link>
          </nav>
        </div>
      </div>
    </>
  );
} 