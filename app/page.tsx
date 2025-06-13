'use client';

import { useEffect, useState } from 'react';
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShoppingBag, Star, Heart } from "lucide-react";
import { getProducts } from '@/lib/firebase';
import { Product } from '@/types/product';
import { generateSlug, generateSEOUrl, formatNaira, generateCategorySEOUrl } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, where, limit } from 'firebase/firestore';
import { Category } from '@/types/category';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { getDoc, doc, updateDoc, arrayRemove, arrayUnion } from 'firebase/firestore';
import ProductCard from '@/components/ProductCard';

export default function Home() {
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<{
    id: string;
    name: string;
    description: string;
    image: string;
    count: number;
  }[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchTrendingProducts() {
      console.log('Fetching featured products...');
      const products = await getProducts({
        featured: true,
        limit: 4
      });
      console.log('Featured products received:', products);
      setTrendingProducts(products);
      setLoading(false);
    }

    async function fetchCategories() {
      try {
        // Fetch categories from the categories collection
        const q = query(collection(db, 'categories'), orderBy('order'), limit(4));
        const snapshot = await getDocs(q);
        const categoriesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Category[];
        
        // Fetch products to count items per category
      const products = await getProducts();
      const categoryCounts = products.reduce((acc, product) => {
        acc[product.category] = (acc[product.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

        // Combine category data with counts
        const categoriesWithCounts = categoriesData.map(category => ({
          id: category.id,
          name: category.name,
          description: category.description || '',
          image: category.image || '/placeholder.jpg', // Default image if none is provided
          count: categoryCounts[category.id] || 0
        }));
        
        setCategories(categoriesWithCounts);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setCategoriesLoading(false);
      }
    }

    // Add this function to check wishlist
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

    async function fetchNewArrivals() {
      try {
        const now = new Date();
        const q = query(
          collection(db, 'products'),
          where('status', '==', 'active'),
          where('isNewArrival', '==', true),
          orderBy('createdAt', 'desc'),
          limit(4)
        );
        
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
            newArrivalUntil: doc.data().newArrivalUntil?.toDate()
          }))
          .filter((product: any) => {
            if (product.newArrivalUntil) {
              return product.newArrivalUntil > now;
            }
            return true;
          }) as Product[];
      } catch (error) {
        console.error('Error fetching new arrivals:', error);
        return [];
      }
    }

    const loadNewArrivals = async () => {
      const arrivals = await fetchNewArrivals();
      setNewArrivals(arrivals);
    };

    fetchTrendingProducts();
    fetchCategories();
    checkWishlist();
    loadNewArrivals();
  }, []);

  // Add toggle wishlist function
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

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[90vh] md:h-screen flex items-center justify-center text-center text-white">
        <div className="absolute inset-0">
          <Image
            src="/background.jpg"
            alt="Background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="relative z-10 px-4 container mx-auto">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 leading-tight">
            Your Style, Your Story
          </h1>
          <p className="text-md md:text-lg max-w-2xl mx-auto mb-8 text-gray-200">
            Discover our new collection of accessories and essentials.
          </p>
          <Link
            href="/shop"
            className="px-6 py-3 md:px-8 md:py-4 bg-white text-black rounded-full font-semibold hover:bg-gray-200 transition-colors"
          >
            Shop Now
          </Link>
        </div>
      </section>
  {/* Featured Products section */}
  <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-2">Featured Products</h2>
              <p className="text-gray-600">Our most popular products based on sales</p>
            </div>
            <Link href="/shop" className="flex items-center gap-2 text-pink-500 font-medium hover:text-pink-600 transition-colors">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              // Loading skeletons remain the same
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 rounded-xl aspect-square mb-3" />
                  <div className="space-y-2 px-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                  </div>
                </div>
              ))
            ) : (
              trendingProducts.map((product) => (
                <Link href={generateSEOUrl(product)} key={product.id} className="group bg-white rounded-2xl p-3 hover:shadow-lg transition-shadow">
                  {/* Product image container */}
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-3">
                    <Image
                      src={product.images[0] || '/placeholder.jpg'}
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
                      {/* <span className="px-2 py-0.5 bg-pink-50 text-[#DA0988] text-xs font-medium rounded-full">
                        {product.status === 'active' ? 'New' : product.categoryName || product.category}
                        </span> */}
                    </div>
                    <p className="text-gray-500 text-xs">{product.description?.substring(0, 60)}...</p>
                    <div className="flex items-center justify-between">
                      <p className="text-base font-semibold">
                        {formatNaira(product.price)}
                      </p>
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-pink-500 fill-pink-500" />
                        <span className="text-xs text-gray-600">{product.ratings.average.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
      {/* New Arrivals Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">New Arrivals</h2>
              <p className="text-gray-600">Check out our latest products</p>
            </div>
            <Link 
              href="/new" 
              className="flex items-center gap-2 text-pink-500 hover:text-pink-600 font-medium"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              // Loading skeletons
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 rounded-2xl aspect-square mb-4" />
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="flex justify-between">
                      <div className="h-4 bg-gray-200 rounded w-1/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/4" />
                    </div>
                  </div>
                </div>
              ))
            ) : newArrivals.length > 0 ? (
              newArrivals.map((product) => (
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
        </div>
      </section>

    

      {/* Categories */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Shop by Category</h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
            Explore our wide range of categories, each carefully curated to match your unique style
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {categoriesLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 rounded-2xl aspect-square" />
                </div>
              ))
            ) : (
              categories.map((category) => (
                <Link 
                  key={category.id}
                  href={`/category/${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className="group relative overflow-hidden rounded-2xl"
                >
                  <div className="aspect-square relative">
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute inset-0 flex flex-col justify-end p-6">
                      <h3 className="text-white text-xl font-medium mb-1">{category.name}</h3>
                      <p className="text-white/80 text-sm">{category.count}+ Products</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
