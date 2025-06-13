'use client';

import { ShoppingBag, Star, Heart, Filter, Grid3X3, List, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove, query, where, orderBy, limit } from 'firebase/firestore';
import { formatNaira } from '@/lib/utils';
import { Product } from '@/types/product';
import ProductCard from '@/components/ProductCard';
import { Loader2 } from 'lucide-react';

export default function NewArrivalsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<string[]>([]);

  useEffect(() => {
    async function fetchNewArrivals() {
      try {
        setLoading(true);
        
        // Get current date for comparison with newArrivalUntil
        const now = new Date();
        console.log('Fetching new arrivals...');
        
        // Query for products marked as new arrivals
        const q = query(
          collection(db, 'products'),
          where('status', '==', 'active'),
          where('isNewArrival', '==', true),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        console.log('Found', querySnapshot.docs.length, 'products');
        
        // Filter out products whose newArrivalUntil date has passed
        const newArrivalsData = querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
            newArrivalUntil: doc.data().newArrivalUntil?.toDate()
          }))
          .filter((product: any) => {
            // If newArrivalUntil is set, check if it's in the future
            if (product.newArrivalUntil) {
              return product.newArrivalUntil > now;
            }
            // If not set, include all products marked as new arrivals
            return true;
          }) as Product[];
        
        console.log('After filtering:', newArrivalsData.length, 'products');
        setProducts(newArrivalsData);
      } catch (error) {
        console.error('Error fetching new arrivals:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchNewArrivals();
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-full flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
            </div>
          ) : products.length > 0 ? (
            products.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product}
                onWishlistToggle={toggleWishlist}
                isInWishlist={wishlist.includes(product.id)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">No new arrivals at the moment. Check back soon!</p>
            </div>
          )}
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