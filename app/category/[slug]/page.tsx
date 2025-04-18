'use client';

import { useState, useEffect, Suspense } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Filter, Grid3X3, List, ShoppingBag, Star, Heart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove, query, where } from 'firebase/firestore';
import { formatNaira, generateSEOUrl } from '@/lib/utils';
import { Product } from '@/types/product';
import { Category } from '@/types/category';

function CategoryContent({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const categorySlug = params.slug;
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  useEffect(() => {
    const fetchCategoryAndProducts = async () => {
      try {
        console.log("Fetching category with slug:", categorySlug);
        
        // First, find the category by slug
        const categoriesSnapshot = await getDocs(collection(db, 'categories'));
        const categories = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Category[];
        
        // Find the category that matches the slug
        const foundCategory = categories.find(cat => {
          // More robust slug generation that matches what we use in the links
          const catSlug = cat.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          console.log(`Comparing: "${catSlug}" with "${categorySlug}"`);
          return catSlug === categorySlug;
        });
        
        if (!foundCategory) {
          console.error('Category not found for slug:', categorySlug);
          router.push('/shop');
          return;
        }
        
        console.log("Found category:", foundCategory);
        setCategory(foundCategory);
        
        // Fetch products for this category
        const q = query(collection(db, 'products'), where('category', '==', foundCategory.id));
        const productsSnapshot = await getDocs(q);
        const productsData = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        
        console.log(`Found ${productsData.length} products for category:`, foundCategory.name);
        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching category data:', error);
      } finally {
        setLoading(false);
      }
    };

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

    fetchCategoryAndProducts();
    checkWishlist();
  }, [categorySlug, router]);

  const toggleWishlist = async (e: React.MouseEvent, productId: string) => {
    // ... existing toggleWishlist implementation
  };

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
      {/* Rest of your component UI */}
      <div className="container mx-auto px-4">
        {/* Category Header, Product Grid, etc. */}
        {/* Copy the UI from your existing implementation */}
      </div>
    </main>
  );
}

// Main page component with Suspense boundary
export default function CategoryPage({ params }: { params: { slug: string } }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CategoryContent params={params} />
    </Suspense>
  );
} 