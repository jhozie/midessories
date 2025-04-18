'use client';

import { Search as SearchIcon, X } from 'lucide-react';
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
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close search when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

    searchProducts();
  }, [query]);

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

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query) {
      router.push(`/shop?search=${encodeURIComponent(query)}`);
      setIsOpen(false);
      setQuery('');
    }
  }

  return (
    <div ref={searchRef} className="relative">
      {/* Search Trigger */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 hover:bg-gray-50 rounded-xl flex items-center gap-2 text-gray-500"
      >
        <SearchIcon className="w-5 h-5" />
        <span className="hidden md:inline text-sm">Search</span>
        <span className="hidden md:inline text-sm text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
          ⌘K
        </span>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-screen max-w-xl">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <form onSubmit={handleSearch}>
              <div className="flex items-center px-4 py-3 border-b border-gray-100">
                <SearchIcon className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products..."
                  className="flex-1 px-4 py-1 outline-none text-gray-600"
                  autoFocus
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="p-1 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
            </form>

            {/* Loading State */}
            {loading && (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500"></div>
              </div>
            )}

            {/* Search Results */}
            {!loading && results.length > 0 && (
              <div className="max-h-[60vh] overflow-auto p-2">
                {results.map((product) => (
                  <Link
                    key={product.id}
                    href={`/product/${generateSlug(product.name)}-${product.id}`}
                    onClick={() => {
                      setIsOpen(false);
                      setQuery('');
                    }}
                    className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl"
                  >
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-500">{product.category}</p>
                      <p className="text-sm font-medium text-pink-500">
                        {formatNaira(product.price)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* No Results */}
            {!loading && query.length > 1 && results.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No results found for "{query}"
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
                      className="p-2 hover:bg-gray-50 rounded-lg text-sm text-gray-600"
                    >
                      {link}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 