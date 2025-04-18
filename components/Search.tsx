'use client';

import { Search as SearchIcon, X, ArrowRight } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types/product';
import { db } from '@/lib/firebase';
import { collection, getDocs, query as firebaseQuery, where, orderBy, limit } from 'firebase/firestore';
import { generateSlug, formatNaira } from '@/lib/utils';

export default function Search() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('recentSearches');
      if (saved) {
        try {
          setRecentSearches(JSON.parse(saved).slice(0, 4));
        } catch (e) {
          console.error('Error parsing recent searches:', e);
        }
      }
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;
    
    const updated = [
      term,
      ...recentSearches.filter(s => s !== term)
    ].slice(0, 4);
    
    setRecentSearches(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    }
  };

  // Close search when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (typeof window !== 'undefined') {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, []);

  // Focus input when search opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Command/Ctrl + K to open search
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setIsOpen(true);
      }
      // Escape to close search
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (typeof window !== 'undefined') {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, []);

  // Handle search
  useEffect(() => {
    const searchProducts = async () => {
      if (query.length > 1) {
        setLoading(true);
        try {
          const productsRef = collection(db, 'products');
          const productsSnapshot = await getDocs(
            firebaseQuery(productsRef, where('status', '==', 'active'), limit(10))
          );
          
          const allProducts = productsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Product[];
          
          // Filter products client-side
          const filtered = allProducts.filter(product => 
            product.name.toLowerCase().includes(query.toLowerCase()) ||
            product.description.toLowerCase().includes(query.toLowerCase()) ||
            product.category.toLowerCase().includes(query.toLowerCase())
          );
          
          setResults(filtered);
        } catch (error) {
          console.error('Error searching products:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    };

    const debounce = setTimeout(() => {
      searchProducts();
    }, 300);

    return () => clearTimeout(debounce);
  }, [query]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query) {
      saveRecentSearch(query);
      router.push(`/shop?search=${encodeURIComponent(query)}`);
      setIsOpen(false);
      setQuery('');
    }
  }

  return (
    <div className="relative" ref={searchRef}>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 hover:bg-gray-50 rounded-xl text-gray-600 transition-colors"
        aria-label="Search"
      >
        <SearchIcon className="h-5 w-5" />
      </button>

      {/* Search Modal */}
      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" onClick={() => setIsOpen(false)} />
          <div className="fixed inset-x-0 top-0 z-50 p-4 pt-[10vh] md:pt-[15vh] flex justify-center">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[70vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
              {/* Search Input */}
              <form onSubmit={handleSearch} className="p-4 border-b border-gray-100 flex items-center gap-3">
                <SearchIcon className="h-5 w-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products..."
                  className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-400"
                />
                {query && (
                  <button 
                    type="button"
                    onClick={() => setQuery('')}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                )}
                <div className="hidden md:flex items-center justify-center px-2 py-1 bg-gray-100 rounded text-xs text-gray-500">
                  ESC
                </div>
              </form>

              {/* Loading State */}
              {loading && (
                <div className="p-8 text-center">
                  <div className="animate-spin h-8 w-8 border-2 border-pink-500 border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Searching...</p>
                </div>
              )}

              {/* Results */}
              {!loading && results.length > 0 && (
                <div className="max-h-[50vh] overflow-auto p-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                  <h3 className="text-xs font-medium text-gray-400 px-3 py-2">RESULTS</h3>
                  {results.map((product) => (
                    <Link
                      key={product.id}
                      href={`/product/${generateSlug(product.name)}-${product.id}`}
                      onClick={() => {
                        saveRecentSearch(query);
                        setIsOpen(false);
                        setQuery('');
                      }}
                      className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors"
                    >
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                        <p className="text-sm text-gray-500">{product.category}</p>
                        <p className="text-sm font-medium text-pink-500">
                          {formatNaira(product.price)}
                        </p>
                      </div>
                    </Link>
                  ))}
                  
                  <div className="p-3 mt-2">
                    <Link
                      href={`/shop?search=${encodeURIComponent(query)}`}
                      onClick={() => {
                        saveRecentSearch(query);
                        setIsOpen(false);
                        setQuery('');
                      }}
                      className="flex items-center justify-center gap-2 w-full p-2 bg-pink-50 text-pink-500 rounded-xl hover:bg-pink-100 transition-colors"
                    >
                      <span>View all results</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              )}

              {/* No Results */}
              {!loading && query.length > 1 && results.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <div className="mb-4">
                    <SearchIcon className="w-12 h-12 mx-auto text-gray-300" />
                  </div>
                  <p className="text-lg font-medium mb-2">No results found</p>
                  <p className="text-sm text-gray-400">
                    We couldn't find any products matching "{query}"
                  </p>
                </div>
              )}

              {/* Recent Searches */}
              {query.length <= 1 && recentSearches.length > 0 && !loading && (
                <div className="p-4">
                  <h3 className="text-xs font-medium text-gray-400 mb-2">RECENT SEARCHES</h3>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setQuery(term);
                        }}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Links */}
              {query.length <= 1 && !loading && (
                <div className="p-4 border-t border-gray-100">
                  <h3 className="text-xs font-medium text-gray-400 mb-2">QUICK LINKS</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {['New Arrivals', 'Best Sellers', 'Phone Cases', 'Accessories'].map((link) => (
                      <Link
                        key={link}
                        href={`/shop?category=${link.toLowerCase().replace(' ', '-')}`}
                        onClick={() => setIsOpen(false)}
                        className="p-3 hover:bg-gray-50 rounded-xl text-sm text-gray-600 transition-colors flex items-center justify-between"
                      >
                        <span>{link}</span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
} 