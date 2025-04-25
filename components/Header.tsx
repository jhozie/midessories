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
              <Link href="/" className="text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent flex items-center">
                {/* You can add a small logo here */}
                {/* <Image src="/logo.png" alt="Midessories" width={32} height={32} className="mr-2" /> */}
                MIDESSORIES
              </Link>
              <nav className="hidden lg:flex items-center gap-6">
                <div 
                  className="relative group"
                  onMouseEnter={() => setIsShopDropdownOpen(true)}
                  onMouseLeave={() => setIsShopDropdownOpen(false)}
                >
                  <Link 
                    href="/shop" 
                    className={`text-sm font-medium hover:text-pink-500 transition-colors relative py-2 flex items-center gap-1 ${
                      pathname === '/shop' ? 'text-pink-500' : 'text-gray-700'
                    }`}
                  >
                    SHOP
                    <ChevronDown className="h-4 w-4" />
                    {pathname === '/shop' && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-pink-500 rounded-full"></span>
                    )}
                  </Link>
                  
                  {/* Shop dropdown */}
                  {isShopDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl shadow-lg p-4 grid grid-cols-1 gap-2 z-50">
                      <Link 
                        href="/shop/all" 
                        className="px-3 py-2 hover:bg-pink-50 rounded-lg text-gray-700 hover:text-pink-500 transition-colors"
                      >
                        All Products
                      </Link>
                      <Link 
                        href="/shop/phone-cases" 
                        className="px-3 py-2 hover:bg-pink-50 rounded-lg text-gray-700 hover:text-pink-500 transition-colors"
                      >
                        Phone Cases
                      </Link>
                      <Link 
                        href="/shop/accessories" 
                        className="px-3 py-2 hover:bg-pink-50 rounded-lg text-gray-700 hover:text-pink-500 transition-colors"
                      >
                        Accessories
                      </Link>
                      <div className="border-t border-gray-100 my-2"></div>
                      <Link 
                        href="/shop/sale" 
                        className="px-3 py-2 hover:bg-pink-50 rounded-lg text-pink-500 font-medium"
                      >
                        Sale Items
                      </Link>
                    </div>
                  )}
                </div>
                
                <Link 
                  href="/new" 
                  className={`text-sm font-medium hover:text-pink-500 transition-colors relative py-2 ${
                    pathname === '/new' ? 'text-pink-500' : 'text-gray-700'
                  }`}
                >
                  NEW ARRIVALS
                  {pathname === '/new' && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-pink-500 rounded-full"></span>
                  )}
                </Link>
                <Link 
                  href="/collections" 
                  className={`text-sm font-medium hover:text-pink-500 transition-colors relative py-2 ${
                    pathname === '/collections' ? 'text-pink-500' : 'text-gray-700'
                  }`}
                >
                  COLLECTIONS
                  {pathname === '/collections' && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-pink-500 rounded-full"></span>
                  )}
                </Link>
                <Link 
                  href="/about" 
                  className={`text-sm font-medium hover:text-pink-500 transition-colors relative py-2 ${
                    pathname === '/about' ? 'text-pink-500' : 'text-gray-700'
                  }`}
                >
                  ABOUT
                  {pathname === '/about' && (
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
            <div className="space-y-2">
              <Link 
                href="/shop" 
                className={`text-lg font-medium p-3 rounded-xl ${
                  pathname === '/shop' ? 'bg-pink-50 text-pink-500' : 'text-gray-700 hover:bg-gray-50'
                } transition-colors flex justify-between items-center`}
              >
                SHOP
                <ChevronDown className="h-5 w-5" />
              </Link>
              <div className="pl-4 space-y-1">
                <Link 
                  href="/shop/all" 
                  className="block p-2 text-gray-600 hover:text-pink-500 rounded-lg"
                >
                  All Products
                </Link>
                <Link 
                  href="/shop/phone-cases" 
                  className="block p-2 text-gray-600 hover:text-pink-500 rounded-lg"
                >
                  Phone Cases
                </Link>
                <Link 
                  href="/shop/accessories" 
                  className="block p-2 text-gray-600 hover:text-pink-500 rounded-lg"
                >
                  Accessories
                </Link>
                <Link 
                  href="/shop/sale" 
                  className="block p-2 text-pink-500 font-medium rounded-lg"
                >
                  Sale Items
                </Link>
              </div>
            </div>
            <Link 
              href="/new" 
              className={`text-lg font-medium p-3 rounded-xl ${
                pathname === '/new' ? 'bg-pink-50 text-pink-500' : 'text-gray-700 hover:bg-gray-50'
              } transition-colors`}
            >
              NEW ARRIVALS
            </Link>
            <Link 
              href="/collections" 
              className={`text-lg font-medium p-3 rounded-xl ${
                pathname === '/collections' ? 'bg-pink-50 text-pink-500' : 'text-gray-700 hover:bg-gray-50'
              } transition-colors`}
            >
              COLLECTIONS
            </Link>
            <Link 
              href="/about" 
              className={`text-lg font-medium p-3 rounded-xl ${
                pathname === '/about' ? 'bg-pink-50 text-pink-500' : 'text-gray-700 hover:bg-gray-50'
              } transition-colors`}
            >
              ABOUT
            </Link>
            <div className="border-t border-gray-100 my-4"></div>
            <Link 
              href="/account" 
              className="text-lg font-medium p-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
            >
              <User className="h-5 w-5" />
              My Account
            </Link>
            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-600 mb-2">Need help?</p>
              <Link 
                href="/contact" 
                className="text-pink-500 font-medium text-sm hover:underline"
              >
                Contact Support
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
} 