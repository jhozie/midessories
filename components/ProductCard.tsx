import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Star, Heart } from 'lucide-react';
import { Product } from '@/types/product';
import { formatNaira } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  onWishlistToggle?: (e: React.MouseEvent, productId: string) => void;
  isInWishlist?: boolean;
}

export default function ProductCard({ product, onWishlistToggle, isInWishlist }: ProductCardProps) {
  return (
    <div className="group">
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.isNewArrival && (
            <span className="bg-pink-500 text-white px-3 py-1 rounded-full text-xs font-medium">
              New
            </span>
          )}
          {product.featured && (
            <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium">
              Featured
            </span>
          )}
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
              Save {Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}%
            </span>
          )}
        </div>

        {/* Quick actions */}
        <div className="absolute bottom-3 right-3 flex gap-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200">
          {onWishlistToggle && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onWishlistToggle(e, product.id);
              }}
              className={`p-2 rounded-full bg-white shadow-md hover:bg-pink-50 transition-colors
                ${isInWishlist ? 'text-pink-500' : 'text-gray-600'}`}
            >
              <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-current' : ''}`} />
            </button>
          )}
          <button 
            className="p-2 rounded-full bg-white shadow-md hover:bg-pink-50 transition-colors text-gray-600"
            onClick={(e) => e.preventDefault()}
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>

      <Link href={`/product/${product.id}`} className="block pt-4 space-y-2">
        <h3 className="font-medium text-gray-900 group-hover:text-pink-500 transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-gray-500">{product.categoryName || product.category}</p>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">{formatNaira(product.price)}</span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-sm text-gray-500 line-through">
                  {formatNaira(product.compareAtPrice)}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm text-gray-600">
              {product.ratings.average.toFixed(1)}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
} 