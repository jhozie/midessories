'use client';

import { ChevronRight, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function CollectionsPage() {
  // Example collections data
  const collections = [
    {
      id: 'summer-2024',
      name: 'Summer 2024',
      description: 'Vibrant and colorful accessories for the summer season',
      image: '/phonecase.jpg',
      productCount: 24,
      rating: 4.9,
      reviewCount: 128,
    },
    {
      id: 'minimalist',
      name: 'Minimalist Collection',
      description: 'Clean, simple designs for the modern minimalist',
      image: '/phonecase.jpg',
      productCount: 16,
      rating: 4.8,
      reviewCount: 96,
    },
    {
      id: 'luxury',
      name: 'Luxury Edition',
      description: 'Premium accessories with elegant finishes',
      image: '/phonecase.jpg',
      productCount: 12,
      rating: 4.9,
      reviewCount: 84,
    },
    {
      id: 'artistic',
      name: 'Artistic Series',
      description: 'Unique designs inspired by contemporary art',
      image: '/phonecase.jpg',
      productCount: 18,
      rating: 4.7,
      reviewCount: 156,
    },
  ];

  return (
    <main className="min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl font-bold mb-4">Our Collections</h1>
          <p className="text-gray-600">
            Explore our carefully curated collections, each telling its own unique story through design and style
          </p>
        </div>

        {/* Collections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {collections.map((collection) => (
            <Link
              href={`/collections/${collection.id}`}
              key={collection.id}
              className="group"
            >
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src={collection.image}
                    alt={collection.name}
                    fill
                    className="object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h2 className="text-2xl font-bold text-white mb-2">{collection.name}</h2>
                    <p className="text-white/80 text-sm line-clamp-2">{collection.description}</p>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-pink-500 fill-pink-500" />
                      <span className="font-medium">{collection.rating}</span>
                      <span className="text-gray-500">({collection.reviewCount} reviews)</span>
                    </div>
                    <span className="text-gray-500">{collection.productCount} products</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">View Collection</span>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-pink-500 transform group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Featured Categories */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold mb-8">Featured Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Phone Cases', 'Accessories', 'Limited Edition', 'New Arrivals'].map((category) => (
              <Link
                href={`/shop?category=${category.toLowerCase().replace(' ', '-')}`}
                key={category}
                className="group relative h-40 rounded-xl overflow-hidden"
              >
                <Image
                  src="/phonecase.jpg"
                  alt={category}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-medium text-lg">{category}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="mt-20 bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-8 md:p-12">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Stay Updated</h2>
            <p className="text-gray-600 mb-6">
              Subscribe to our newsletter to get updates on new collections and exclusive offers
            </p>
            <div className="flex gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
              />
              <button className="px-6 py-3 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 