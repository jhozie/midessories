'use client';

import { useEffect, useState } from 'react';
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShoppingBag, Star, Heart, TrendingUp, Package, Sparkles } from "lucide-react";
import { getProducts } from '@/lib/firebase';
import { Product } from '@/types/product';
import { generateSlug, generateSEOUrl, formatNaira } from '@/lib/utils';

export default function Home() {
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<{
    name: string;
    image: string;
    count: number;
  }[]>([]);

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
      const products = await getProducts();
      const categoryCounts = products.reduce((acc, product) => {
        acc[product.category] = (acc[product.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      setCategories(Object.entries(categoryCounts).map(([name, count]) => ({
        name,
        image: '/phonecase.jpg', // You might want to store category images separately
        count: count
      })));
    }

    fetchTrendingProducts();
    fetchCategories();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen bg-gradient-to-br from-white via-pink-50 to-purple-50 pt-40 pb-20 overflow-hidden">
        {/* Gradient Orbs - slightly larger */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 -right-1/4 w-2/5 h-2/5 bg-gradient-to-br from-pink-200/20 to-purple-300/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/4 -left-1/4 w-2/5 h-2/5 bg-gradient-to-tr from-pink-200/20 to-purple-300/20 rounded-full blur-3xl" />
        </div>

        {/* Mesh Gradient Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,192,203,0.1),rgba(255,255,255,0))]" />

        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="relative z-10 space-y-8">
              {/* Sale Badge - adjusted size */}
              <div className="inline-flex items-center gap-3 bg-white/70 backdrop-blur-xl px-5 py-2.5 rounded-xl shadow-lg shadow-pink-500/10">
                <span className="text-pink-500 text-base font-medium">Trending Collection</span>
                <div className="w-px h-4 bg-gray-200" />
                <span className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-3 py-1 rounded-full text-sm">
                  New Season
                </span>
              </div>

              {/* Main Heading - balanced size */}
              <div className="space-y-5">
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                  <span className="text-gray-900">Style That</span>
                  <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-transparent bg-clip-text">
                    Makes a
                  </div>
                </h1>
                <p className="text-gray-600 text-xl leading-relaxed max-w-lg">
                  Express yourself with our exclusive collection of fashion accessories. Each piece tells a unique story.
                </p>
              </div>

              {/* CTA Buttons - adjusted size */}
              <div className="flex flex-wrap gap-4">
                <Link 
                  href="/shop" 
                  className="group inline-flex items-center px-7 py-3.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl 
                           transition-all duration-300 shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 
                           hover:scale-105 active:scale-100 text-base"
                >
                  Shop Latest
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  href="/collections" 
                  className="inline-flex items-center px-7 py-3.5 bg-white/70 backdrop-blur-xl text-gray-900 
                           rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl 
                           hover:bg-white/90 font-medium text-base"
                >
                  View Collections
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-5">
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-pink-500" />
                    <div>
                      <p className="font-medium text-gray-900">Trendsetting</p>
                      <p className="text-sm text-gray-500">Designs</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-pink-500" />
                    <div>
                      <p className="font-medium text-gray-900">Express</p>
                      <p className="text-sm text-gray-500">Delivery</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5 text-pink-500" />
                    <div>
                      <p className="font-medium text-gray-900">Exclusive</p>
                      <p className="text-sm text-gray-500">Collection</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content - Image */}
            <div className="relative lg:h-[550px] mt-8 lg:mt-0 p-3">
              {/* Main Image Container */}
              <div className="relative z-10 rounded-2xl overflow-visible shadow-2xl
                            bg-gradient-to-br from-white/50 to-white/30 backdrop-blur-xl p-2 h-[400px] lg:h-[480px]">
                <div className="relative h-full rounded-xl overflow-hidden">
                  <Image
                    src="/phonecase.jpg"
                    alt="Fashion Accessories Collection"
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-700"
                    priority
                  />
                </div>

                {/* Floating Stats Card */}
                <div className="absolute -right-3 top-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between gap-3 p-3 min-w-[160px]">
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-gray-900 whitespace-nowrap">Top Rated</p>
                      <p className="text-xs text-gray-500">This Week</p>
                    </div>
                    <div className="shrink-0">
                      <TrendingUp className="h-5 w-5 text-pink-500" />
                    </div>
                  </div>
                </div>

                {/* Floating Collection Card */}
                <div className="absolute -left-3 bottom-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between gap-3 p-3 min-w-[160px]">
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-gray-900 whitespace-nowrap">Featured</p>
                      <p className="text-xs text-gray-500">New Arrivals</p>
                    </div>
                    <div className="shrink-0">
                      <Sparkles className="h-5 w-5 text-pink-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-r from-pink-200/20 to-purple-200/20 
                            rounded-full blur-3xl opacity-70 scale-95 -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {/* Section header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Featured Products</h2>
              <p className="text-gray-600 max-w-lg">Discover our most sought-after accessories, carefully curated for the modern lifestyle.</p>
            </div>
            <Link 
              href="/shop" 
              className="group flex items-center gap-2 text-pink-500 hover:text-pink-600 font-medium"
            >
              Browse All Products 
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          {/* Product grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              // Add loading skeletons here
              Array(4).fill(0).map((_, i) => (
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
                    <button className="absolute bottom-3 right-3 bg-white text-black p-2.5 rounded-full shadow-lg translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <ShoppingBag size={16} />
                    </button>
                  </div>
                  {/* Product info */}
                  <div className="space-y-2 px-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-medium group-hover:text-pink-500 transition-colors">
                        {product.name}
                      </h3>
                      {product.status === 'active' && (
                        <span className="px-2 py-0.5 bg-pink-50 text-pink-500 text-xs font-medium rounded-full">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-xs">{product.category}</p>
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

      {/* Categories */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Shop by Category</h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
            Explore our wide range of categories, each carefully curated to match your unique style
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link 
                key={category.name}
                href={`/category/${category.name.toLowerCase().replace(' ', '-')}`}
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
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
