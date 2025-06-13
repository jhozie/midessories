import Link from 'next/link';
import { Instagram, Facebook, Twitter } from 'lucide-react';
import Image from 'next/image';
export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div>
          <div>
                <Link href="/">
                  <Image src="/logo-mide.jpg" alt="Midessories" width={60} height={40} className="rounded-md" />
                </Link>
              </div>
              
            <p className="text-gray-600 text-sm pt-4">
              Elevating your style with modern accessories. Quality products that make a statement in 2025 and beyond.
            </p>
            <div className="flex gap-4 mt-6">
              <a href="#" className="text-gray-400 hover:text-pink-500 transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-pink-500 transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-pink-500 transition-colors">
                <Twitter size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-6">Quick Links</h3>
            <ul className="space-y-3">
              <li><Link href="/shop" className="text-gray-600 hover:text-pink-500 transition-colors">Shop</Link></li>     
              <li><Link href="/category/bags" className="text-gray-600 hover:text-pink-500 transition-colors">Bags</Link></li>
              <li><Link href="/category/jewelleries" className="text-gray-600 hover:text-pink-500 transition-colors">Jewelleries</Link></li>
              <li><Link href="/category/hair-accessories" className="text-gray-600 hover:text-pink-500 transition-colors">Hair Accessories</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-6">Customer Care</h3>
            <ul className="space-y-3">
              <li><Link href="/contact" className="text-gray-600 hover:text-pink-500 transition-colors">Contact Us</Link></li>
              <li><Link href="/shipping" className="text-gray-600 hover:text-pink-500 transition-colors">Shipping Info</Link></li>
              <li><Link href="/returns" className="text-gray-600 hover:text-pink-500 transition-colors">Returns</Link></li>
              <li><Link href="/faq" className="text-gray-600 hover:text-pink-500 transition-colors">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-6">Newsletter</h3>
            <p className="text-gray-600 text-sm mb-4">
              Subscribe to get special offers and be the first to know about new releases.
            </p>
            <form className="space-y-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-pink-500"
              />
              <button 
                type="submit" 
                className="w-full bg-black hover:bg-pink-500 text-white py-3 rounded-lg transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
        
        <div className="border-t border-gray-100 mt-16 pt-8 text-center text-gray-500 text-sm">
          <p>&copy; 2025 Midessories. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
} 