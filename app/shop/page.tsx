'use client';

import { useState, useEffect, Suspense } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Filter, Grid3X3, List, ShoppingBag, Star, Heart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { formatNaira } from '@/lib/utils';

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

// Create a client component that uses useSearchParams
function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<string[]>([]);
  
  const searchQuery = searchParams.get('search');
  const category = searchParams.get('category');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsSnapshot = await getDocs(collection(db, 'products'));
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
    e.preventDefault(); // Prevent navigation to product page
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

  // Filter products based on search query and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !category ||
      product.category.toLowerCase() === category.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <main className="min-h-screen pt-32 pb-20">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 w-48 rounded mb-8" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-80 bg-gray-200 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-8">
          <h1 className="text-4xl font-bold">
            {searchQuery ? `Search Results for "${searchQuery}"` : 'Shop Collection'}
          </h1>
          <p className="text-gray-600">
            {searchQuery 
              ? `Found ${filteredProducts.length} products matching your search`
              : 'Discover our latest accessories and trendsetting designs'
            }
          </p>
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-8">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 hover:border-pink-500 transition-colors">
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </button>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200">
              <button className="p-1 rounded hover:bg-gray-100 transition-colors">
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button className="p-1 rounded hover:bg-gray-100 transition-colors">
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
          <select className="px-4 py-2 bg-white rounded-xl border border-gray-200 outline-none focus:border-pink-500">
            <option>Most Popular</option>
            <option>Newest First</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
          </select>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <Link 
              href={`/product/${product.id}`} 
              key={product.id} 
              className="group bg-white rounded-2xl p-3 hover:shadow-lg transition-shadow"
            >
              {/* Product image container */}
              <div className="relative aspect-square rounded-xl overflow-hidden mb-3">
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {/* Action Buttons */}
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <button 
                    onClick={(e) => toggleWishlist(e, product.id)}
                    className={`bg-white p-2.5 rounded-full shadow-lg translate-y-full opacity-0 
                              group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 
                              hover:bg-pink-50 ${wishlist.includes(product.id) ? 'text-pink-500' : 'text-gray-500'}`}
                  >
                    <Heart className={`w-4 h-4 ${wishlist.includes(product.id) ? 'fill-pink-500' : ''}`} />
                  </button>
                  <button 
                    className="bg-white text-black p-2.5 rounded-full shadow-lg translate-y-full opacity-0 
                             group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-75
                             hover:bg-pink-50"
                  >
                    <ShoppingBag size={16} />
                  </button>
                </div>
              </div>
              {/* Product info */}
              <div className="space-y-2 px-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-medium group-hover:text-pink-500 transition-colors">
                    {product.name}
                  </h3>
                  <span className="px-2 py-0.5 bg-pink-50 text-pink-500 text-xs font-medium rounded-full">
                    {product.category}
                  </span>
                </div>
                <p className="text-gray-500 text-xs">{product.description}</p>
                <div className="flex items-center justify-between">
                  <p className="text-base font-semibold">${product.price}</p>
                  <div className="flex items-center gap-1">
                    <Star size={12} className="text-pink-500 fill-pink-500" />
                    <span className="text-xs text-gray-600">4.9</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Pagination */}
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

// Main page component with Suspense boundary
export default function ShopPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen pt-32 pb-20">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 w-48 rounded mb-8" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-80 bg-gray-200 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </main>
    }>
      <ShopContent />
    </Suspense>
  );
} 