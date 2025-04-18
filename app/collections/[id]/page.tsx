'use client';

import { useState } from 'react';
import { Filter, Grid3X3, List, ChevronLeft, ChevronRight, Star, Heart, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

type CollectionPageProps = {
  params: {
    id: string;
  };
};

export default function CollectionPage({ params }: CollectionPageProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Example collection data - In a real app, fetch this based on params.id
  const collection = {
    id: params.id,
    name: params.id === 'summer-2024' ? 'Summer 2024' : 'Collection Name',
    description: 'Discover our exclusive collection featuring premium designs and trendsetting styles. Each piece is carefully crafted to bring you the perfect blend of fashion and functionality.',
    image: '/phonecase.jpg',
    productCount: 24,
    rating: 4.9,
    reviewCount: 128,
  };

  return (
    <main className="min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-4">
        {/* Collection Hero */}
        <div className="relative h-[400px] rounded-2xl overflow-hidden mb-12">
          <Image
            src={collection.image}
            alt={collection.name}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="max-w-2xl">
              <Link 
                href="/collections" 
                className="inline-flex items-center text-white/80 hover:text-white mb-4 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                Back to Collections
              </Link>
              <h1 className="text-4xl font-bold text-white mb-4">{collection.name}</h1>
              <p className="text-white/80 text-lg">{collection.description}</p>
              <div className="flex items-center gap-4 mt-6">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 text-pink-500 fill-pink-500" />
                  <span className="text-white font-medium">{collection.rating}</span>
                  <span className="text-white/80">({collection.reviewCount} reviews)</span>
                </div>
                <span className="text-white/80">•</span>
                <span className="text-white/80">{collection.productCount} products</span>
              </div>
            </div>
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
            <option>Most Popular</option>
            <option>Newest First</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
          </select>
        </div>

        {/* Product Grid */}
        <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1'} gap-6`}>
          {Array.from({ length: 12 }).map((_, i) => (
            <Link 
              href={`/product/${i + 1}`} 
              key={i} 
              className={`group bg-white rounded-2xl p-3 hover:shadow-lg transition-shadow ${
                viewMode === 'list' ? 'flex gap-6' : ''
              }`}
            >
              {/* Product image container */}
              <div className={`relative ${viewMode === 'list' ? 'w-48 h-48' : 'aspect-square'} rounded-xl overflow-hidden mb-3`}>
                <Image
                  src="/phonecase.jpg"
                  alt="Product"
                  fill
                  className="object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <button className="bg-white text-black p-2.5 rounded-full shadow-lg translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hover:bg-pink-50">
                    <Heart size={16} className="text-pink-500" />
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
                    Collection Phone Case
                  </h3>
                </div>
                <p className="text-gray-500 text-xs">Premium Design Collection</p>
                <div className="flex items-center justify-between">
                  <p className="text-base font-semibold">$29.99</p>
                  <div className="flex items-center gap-1">
                    <Star size={12} className="text-pink-500 fill-pink-500" />
                    <span className="text-xs text-gray-600">4.9</span>
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