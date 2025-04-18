'use client';

import { MapPin, Phone, Mail } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function AboutPage() {
  const values = [
    {
      title: 'Quality First',
      description: 'We never compromise on quality, using only the finest materials and craftsmanship in every piece.'
    },
    {
      title: 'Innovative Design',
      description: 'Our designs blend contemporary trends with timeless aesthetics, creating pieces that stand out.'
    },
    {
      title: 'Customer Focus',
      description: 'Your satisfaction is our priority. We are committed to providing exceptional service at every step.'
    }
  ];

  return (
    <main className="min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-12 mb-32 overflow-hidden">
          <div className="relative z-10 text-center max-w-3xl mx-auto">
            <span className="inline-block bg-pink-500 text-white px-4 py-1 rounded-full text-sm font-medium mb-6">
              Est. 2023
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">About Midessories</h1>
            <p className="text-gray-600 text-lg md:text-xl">
              Crafting premium accessories that blend style with functionality. 
              Our mission is to help you express your unique personality through carefully designed pieces.
            </p>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-pink-200 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-200 rounded-full blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2" />
        </div>

        {/* Story Section */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-32">
          <div className="relative">
            <div className="relative h-[600px] rounded-2xl overflow-hidden">
              <Image
                src="/phonecase.jpg"
                alt="Our Story"
                fill
                className="object-cover"
              />
            </div>
            {/* Decorative overlay */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Story</h2>
              <div className="w-20 h-1 bg-pink-500 rounded-full mb-6" />
              <div className="space-y-4">
                <p className="text-gray-600">
                  Founded in 2023, Midessories began with a simple vision: to create accessories 
                  that make a statement. We noticed a gap in the market for high-quality, 
                  design-focused accessories that truly reflect individual style.
                </p>
                <p className="text-gray-600">
                  What started as a small collection of phone cases has grown into a comprehensive 
                  range of accessories, each piece carefully crafted to bring together aesthetics 
                  and functionality.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-8">
                <h3 className="font-bold text-4xl text-pink-500 mb-2">5K+</h3>
                <p className="text-gray-600 font-medium">Happy Customers</p>
              </div>
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-8">
                <h3 className="font-bold text-4xl text-pink-500 mb-2">100+</h3>
                <p className="text-gray-600 font-medium">Unique Designs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Values</h2>
            <div className="w-20 h-1 bg-pink-500 rounded-full mx-auto" />
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, i) => (
              <div 
                key={i} 
                className="group bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl flex items-center justify-center mb-6">
                  <div className="w-6 h-6 bg-pink-500 rounded-lg group-hover:rotate-45 transition-transform duration-300" />
                </div>
                <h3 className="text-xl font-bold mb-4">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-8 md:p-12 relative overflow-hidden">
          <div className="relative z-10 max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Get in Touch</h2>
              <div className="w-20 h-1 bg-pink-500 rounded-full mx-auto" />
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center bg-white/80 backdrop-blur-sm rounded-xl p-8">
                <div className="w-16 h-16 bg-gradient-to-r from-pink-50 to-purple-50 rounded-full flex items-center justify-center mb-6">
                  <MapPin className="w-8 h-8 text-pink-500" />
                </div>
                <h3 className="font-bold text-lg mb-2">Visit Us</h3>
                <p className="text-gray-600">123 Fashion Street<br />Lagos, Nigeria</p>
              </div>
              <div className="flex flex-col items-center text-center bg-white/80 backdrop-blur-sm rounded-xl p-8">
                <div className="w-16 h-16 bg-gradient-to-r from-pink-50 to-purple-50 rounded-full flex items-center justify-center mb-6">
                  <Phone className="w-8 h-8 text-pink-500" />
                </div>
                <h3 className="font-bold text-lg mb-2">Call Us</h3>
                <p className="text-gray-600">+234 123 456 7890</p>
              </div>
              <div className="flex flex-col items-center text-center bg-white/80 backdrop-blur-sm rounded-xl p-8">
                <div className="w-16 h-16 bg-gradient-to-r from-pink-50 to-purple-50 rounded-full flex items-center justify-center mb-6">
                  <Mail className="w-8 h-8 text-pink-500" />
                </div>
                <h3 className="font-bold text-lg mb-2">Email Us</h3>
                <p className="text-gray-600">hello@Midessories.com</p>
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-pink-200 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200 rounded-full blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2" />
        </div>
      </div>
    </main>
  );
} 