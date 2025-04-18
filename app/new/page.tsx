'use client';

import { ShoppingBag, Star, Heart, Filter, Grid3X3, List, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove, query, where, orderBy, limit } from 'firebase/firestore';
import { formatNaira } from '@/lib/utils';

// Add interfaces
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  status: string;
  ratings: {
    average: number;
    count: number;
  };
}

export default function NewArrivalsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<string[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsQuery = query(
          collection(db, 'products'),
          where('status', '==', 'active'),
          orderBy('createdAt', 'desc'),
          limit(12)
        );
        const productsSnapshot = await getDocs(productsQuery);
        const productsData = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const checkWishlist = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setWishlist(userData.wishlist?.map((item: { productId: string }) => item.productId) || []);
        }
      } catch (error) {
        console.error('Error checking wishlist:', error);
      }
    };

    checkWishlist();
  }, []);

  const toggleWishlist = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    try {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      const userRef = doc(db, 'users', user.uid);
      const wishlistItem = {
        productId,
        dateAdded: new Date()
      };

      const isInWishlist = wishlist.includes(productId);

      await updateDoc(userRef, {
        wishlist: isInWishlist
          ? arrayRemove(wishlistItem)
          : arrayUnion(wishlistItem)
      });

      setWishlist(prev => 
        isInWishlist 
          ? prev.filter(id => id !== productId)
          : [...prev, productId]
      );
    } catch (error) {
      console.error('Error updating wishlist:', error);
    }
  };

  return (
    <main className="min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-8 mb-12">
          <div className="max-w-2xl">
            <span className="inline-block bg-pink-500 text-white px-4 py-1 rounded-full text-sm font-medium mb-4">
              Just Landed
            </span>
            <h1 className="text-4xl font-bold mb-4">New Arrivals</h1>
            <p className="text-gray-600 text-lg">
              Discover our latest collection of trending accessories and fashion items. 
              Be the first to explore what's new and fresh.
            </p>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-8">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 hover:border-pink-500 transition-colors">
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </button>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded hover:bg-gray-100 transition-colors ${viewMode === 'grid' ? 'text-pink-500' : ''}`}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1 rounded hover:bg-gray-100 transition-colors ${viewMode === 'list' ? 'text-pink-500' : ''}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
          <select className="px-4 py-2 bg-white rounded-xl border border-gray-200 outline-none focus:border-pink-500">
            <option>Latest First</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Most Popular</option>
          </select>
        </div>

        {/* Product Grid */}
        <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1'} gap-6`}>
          {products.map((product) => (
            <Link 
              href={`/product/${product.id}`} 
              key={product.id} 
              className={`group bg-white rounded-2xl p-3 hover:shadow-lg transition-shadow ${
                viewMode === 'list' ? 'flex gap-6' : ''
              }`}
            >
              {/* Product image container */}
              <div className={`relative ${viewMode === 'list' ? 'w-48 h-48' : 'aspect-square'} rounded-xl overflow-hidden mb-3`}>
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-3 left-3">
                  <span className="bg-pink-500 text-white px-2 py-1 rounded-lg text-xs font-medium">
                    New
                  </span>
                </div>
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <button 
                    onClick={(e) => toggleWishlist(e, product.id)}
                    className={`bg-white p-2.5 rounded-full shadow-lg translate-y-full opacity-0 
                              group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 
                              hover:bg-pink-50 ${wishlist.includes(product.id) ? 'text-pink-500' : 'text-gray-500'}`}
                  >
                    <Heart className={`w-4 h-4 ${wishlist.includes(product.id) ? 'fill-pink-500' : ''}`} />
                  </button>
                  <button className="bg-white text-black p-2.5 rounded-full shadow-lg translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-75 hover:bg-pink-50">
                    <ShoppingBag size={16} />
                  </button>
                </div>
              </div>

              {/* Product info */}
              <div className={`${viewMode === 'list' ? 'flex-1' : ''} space-y-2 px-1`}>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-medium group-hover:text-pink-500 transition-colors">
                    {product.name}
                  </h3>
                </div>
                <p className="text-gray-500 text-xs">{product.category}</p>
                <div className="flex items-center justify-between">
                  <p className="text-base font-semibold">{formatNaira(product.price)}</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-pink-500 fill-pink-500" />
                    <span className="text-xs text-gray-600">{product.ratings.average.toFixed(1)}</span>
                  </div>
                </div>
                {viewMode === 'list' && (
                  <p className="text-gray-600 mt-4">
                    Experience premium protection with our latest phone case design. 
                    Featuring a sleek modern aesthetic and military-grade drop protection.
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Replace Load More with Pagination */}
        <div className="flex justify-center items-center gap-2 mt-12">
          <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 hover:border-pink-500 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          {[1, 2, 3, '...', 8].map((page, i) => (
            <button 
              key={i}
              className={`w-10 h-10 flex items-center justify-center rounded-lg border 
                        ${page === 1 ? 'bg-pink-500 text-white border-pink-500' : 'border-gray-200 hover:border-pink-500'} 
                        transition-colors`}
            >
              {page}
            </button>
          ))}
          <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 hover:border-pink-500 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </main>
  );
} 