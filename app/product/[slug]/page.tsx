'use client';

import { Heart, Minus, Plus, Share2, ShoppingBag, Star, Truck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import ImageZoom from '@/components/ImageZoom';
import SizeGuide from '@/components/SizeGuide';
import ReviewCard from '@/components/ReviewCard';
import { Review } from '@/types/review';
import ReviewForm from '@/components/ReviewForm';
import { useCart } from '@/contexts/CartContext';
import CartSidebar from '@/components/CartSidebar';
import AddToCartAnimation from '@/components/AddToCartAnimation';
import { getProduct, getProductReviews, addProductReview, getRelatedProducts, auth, db } from '@/lib/firebase';
import { Product } from '@/types/product';
import { generateSlug, formatNaira } from '@/lib/utils';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { uploadToImgBB } from '@/lib/upload';

// Add mock reviews data
const mockReviews: Review[] = [
  {
    id: '1',
    productId: '1',
    customerId: 'user1',
    customerName: 'Sarah Johnson',
    rating: 5,
    title: 'Perfect fit and great protection',
    comment: 'This case is exactly what I was looking for...',
    images: ['/review1.jpg', '/review2.jpg'],
    status: 'approved' as const,
    helpful: 12,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    productId: '1',
    customerId: 'user2',
    customerName: 'Mike Chen',
    rating: 4,
    title: 'Good quality but slightly pricey',
    comment: "The case is well-made and offers good protection...",
    images: [],
    status: 'approved' as const,
    helpful: 8,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export default function ProductPage({ params }: { params: { slug: string } }) {
  const productId = params.slug.split('-').pop() || '';
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState('/phonecase.jpg');
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [showAddedAnimation, setShowAddedAnimation] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [isInWishlist, setIsInWishlist] = useState(false);

  const { addItem } = useCart();
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const [productData, reviewsData] = await Promise.all([
        getProduct(productId),
        getProductReviews(productId)
      ]);
      
      if (productData) {
        setProduct(productData);
        setSelectedImage(productData.images[0]);
        setReviews(reviewsData);
        setLoading(false);
        setLoadingReviews(false);
        
        // Set initial variant selections if product has variants
        if (productData?.variantOptions) {
          const colorOption = productData.variantOptions.find(opt => opt.name.toLowerCase() === 'color');
          const sizeOption = productData.variantOptions.find(opt => opt.name.toLowerCase() === 'size');
          
          if (colorOption?.values.length) setSelectedColor(colorOption.values[0]);
          if (sizeOption?.values.length) setSelectedSize(sizeOption.values[0]);
        }

        // Fetch related products
        const related = await getRelatedProducts(productId, productData.category);
        setRelatedProducts(related);
        setLoadingRelated(false);
      }
    }

    fetchData();
  }, [productId]);

  useEffect(() => {
    const checkWishlist = async () => {
      const user = auth.currentUser;
      if (!user || !productId) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsInWishlist(
            userData.wishlist?.some((item: { productId: string }) => item.productId === productId) || false
          );
        }
      } catch (error) {
        console.error('Error checking wishlist:', error);
      }
    };

    checkWishlist();
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-20">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-96 bg-gray-200 rounded-2xl mb-8" />
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8" />
            <div className="h-24 bg-gray-200 rounded mb-8" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen pt-32 pb-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
            <p className="text-gray-600">The product you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleReviewSubmit = async (reviewData: {
    rating: number;
    title: string;
    comment: string;
    images: File[];
  }) => {
    try {
      // Upload images first and get URLs
      const imageUrls = await Promise.all(
        reviewData.images.map(file => uploadToImgBB(file))
      );

      const newReview = {
        ...reviewData,
        images: imageUrls, // Use uploaded image URLs
        productId,
        customerId: auth.currentUser?.uid || '',
        customerName: auth.currentUser?.displayName || 'Anonymous',
        status: 'pending' as const,
        helpful: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const savedReview = await addProductReview(newReview);
      setReviews(prevReviews => [savedReview as Review, ...prevReviews]);
      setIsReviewFormOpen(false);
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      color: selectedColor,
      size: selectedSize,
    }, quantity);
    setShowAddedAnimation(true);
  };

  const toggleWishlist = async () => {
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

      await updateDoc(userRef, {
        wishlist: isInWishlist
          ? arrayRemove(wishlistItem)
          : arrayUnion(wishlistItem)
      });

      setIsInWishlist(!isInWishlist);
    } catch (error) {
      console.error('Error updating wishlist:', error);
    }
  };

  return (
    <main className="min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-8">
          <Link href="/" className="text-gray-500 hover:text-pink-500">Home</Link>
          <span className="text-gray-300">/</span>
          <Link href="/shop" className="text-gray-500 hover:text-pink-500">Shop</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900">{product.name}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square relative rounded-2xl overflow-hidden">
              <ImageZoom src={selectedImage || product.images[0]} alt={product.name}>
                <Image
                  src={selectedImage || product.images[0]}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </ImageZoom>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {product.images.map((image, index) => (
                <button 
                  key={index}
                  onClick={() => setSelectedImage(image)}
                  className="aspect-square relative rounded-xl overflow-hidden border-2 border-transparent hover:border-pink-500 transition-colors bg-gray-50"
                >
                  <Image
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-8">
            {/* Basic Info */}
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              <p className="text-gray-600 mb-4">{product.description}</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="font-medium">{product.ratings.average.toFixed(1)}</span>
                  <span className="text-gray-500">({product.ratings.count} reviews)</span>
                </div>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span className="text-gray-500">300+ bought this</span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center gap-4">
              <p className="text-3xl font-bold">{formatNaira(product.price)}</p>
              {product.compareAtPrice && (
                <>
                  <span className="text-gray-500 line-through">
                    {formatNaira(product.compareAtPrice)}
                  </span>
                  <span className="bg-pink-50 text-pink-500 px-2 py-1 rounded-lg text-sm font-medium">
                    Save {(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100).toFixed(0)}%
                  </span>
                </>
              )}
            </div>

            {/* Variant Selection */}
            {product.variantOptions?.map((option) => (
              <div key={option.name}>
                <h3 className="font-medium mb-3">{option.name}</h3>
                <div className="flex flex-wrap gap-3">
                  {option.values.map((value) => (
                <button 
                      key={value}
                      onClick={() => {
                        if (option.name.toLowerCase() === 'color') setSelectedColor(value);
                        if (option.name.toLowerCase() === 'size') setSelectedSize(value);
                      }}
                      className={`px-4 py-2 rounded-lg border ${
                        (option.name.toLowerCase() === 'color' && selectedColor === value) ||
                        (option.name.toLowerCase() === 'size' && selectedSize === value)
                          ? 'border-pink-500 bg-pink-50 text-pink-500'
                          : 'border-gray-200 hover:border-pink-500'
                      }`}
                    >
                      {value}
                  </button>
                ))}
              </div>
            </div>
            ))}

            {/* Quantity and Add to Cart */}
            <div className="flex items-center gap-4 mt-6">
              <div className="flex-1">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:border-pink-500 hover:bg-pink-50 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-medium">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:border-pink-500 hover:bg-pink-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <button
                onClick={toggleWishlist}
                className={`w-12 h-12 rounded-xl border flex items-center justify-center ${
                  isInWishlist 
                    ? 'bg-pink-50 border-pink-500 text-pink-500' 
                    : 'border-gray-200 text-gray-500 hover:border-pink-500 hover:text-pink-500'
                }`}
              >
                <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-pink-500' : ''}`} />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4">
              <button 
                onClick={handleAddToCart}
                className="w-full bg-pink-500 text-white py-4 rounded-xl mt-4 hover:bg-pink-600 transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-5 h-5" />
                Add to Cart
              </button>
              <button className="w-14 h-14 flex items-center justify-center rounded-xl border border-gray-200 hover:border-pink-500 transition-colors">
                <Share2 className="w-6 h-6" />
              </button>
            </div>

            {/* Shipping Info */}
            {!product.shipping.freeShipping && (
            <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3">
              <Truck className="w-5 h-5 text-gray-600 mt-0.5" />
              <div>
                  <p className="font-medium text-gray-900">Shipping Information</p>
                  <p className="text-sm text-gray-600">
                    Standard shipping: 3-5 business days
                    {product.shipping.weight > 0 && ` • Weight: ${product.shipping.weight}kg`}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Tabs */}
      <div className="container mx-auto px-4 mt-20">
        <div className="border-b border-gray-200">
          <div className="flex gap-8">
            {['description', 'reviews'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 relative capitalize ${
                  activeTab === tab ? 'text-pink-500' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-pink-500" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="py-8">
          {activeTab === 'description' && (
            <div className="prose max-w-none">
              <p className="text-gray-600 leading-relaxed">
                {product.description}
              </p>
              {/* Show specifications if they exist */}
              {Object.keys(product.specifications).length > 0 && (
                <div className="mt-8">
                  <h3 className="font-medium text-lg mb-4">Specifications</h3>
                  <ul className="space-y-2 text-gray-600">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <li key={key}>• {key}: {value}</li>
                    ))}
              </ul>
            </div>
          )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-8">
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <p className="text-5xl font-bold text-gray-900">
                    {product.ratings.average.toFixed(1)}
                  </p>
                  <div className="flex items-center justify-center gap-1 my-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`w-5 h-5 ${
                          star <= product.ratings.average 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-200'
                        }`} 
                      />
                    ))}
                  </div>
                  <p className="text-gray-500">Based on {product.ratings.count} reviews</p>
                </div>
              </div>

              {/* Write Review Button */}
              <div className="flex justify-center">
                <button 
                  onClick={() => setIsReviewFormOpen(true)}
                  className="bg-pink-500 text-white px-6 py-3 rounded-xl hover:bg-pink-600 transition-colors"
                >
                  Write a Review
                </button>
              </div>

              {/* Reviews List */}
              <div className="mt-12">
                {loadingReviews ? (
                  <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-gray-100 h-32 rounded-xl" />
                    ))}
                  </div>
                ) : reviews.length > 0 ? (
                  reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                  ))
                ) : (
                  <p className="text-center text-gray-500">
                    No reviews yet. Be the first to review this product!
                  </p>
                )}
              </div>

              {/* Load More Button - show only if there are reviews */}
              {reviews.length > 0 && (
              <div className="flex justify-center mt-8">
                  <button 
                    onClick={async () => {
                      const moreReviews = await getProductReviews(productId, 5);
                      setReviews(prev => [...prev, ...moreReviews]);
                    }}
                    className="text-pink-500 hover:text-pink-600 font-medium"
                  >
                  Load More Reviews
                </button>
              </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      <div className="container mx-auto px-4 mt-20">
        <h2 className="text-2xl font-bold mb-8">You May Also Like</h2>
        {loadingRelated ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((item) => (
              <div key={item} className="animate-pulse">
                <div className="bg-gray-200 rounded-xl aspect-square mb-3" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : relatedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((product) => (
            <Link 
                href={`/product/${generateSlug(product.name)}-${product.id}`} 
                key={product.id} 
              className="group bg-white rounded-2xl p-3 hover:shadow-lg transition-shadow"
            >
              <div className="relative aspect-square rounded-xl overflow-hidden mb-3">
                <Image
                    src={product.images[0]}
                    alt={product.name}
                  fill
                  className="object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <button 
                    onClick={toggleWishlist}
                    className={`bg-white text-black p-2.5 rounded-full shadow-lg translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hover:bg-pink-50 ${
                      isInWishlist ? 'text-pink-500' : 'text-gray-500'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-pink-500' : ''}`} />
                  </button>
                  <button className="bg-white text-black p-2.5 rounded-full shadow-lg translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-75 hover:bg-pink-50">
                    <ShoppingBag size={16} />
                  </button>
                </div>
              </div>
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
          ))}
        </div>
        ) : (
          <p className="text-center text-gray-500">No related products found.</p>
        )}
      </div>

      <SizeGuide 
        isOpen={isSizeGuideOpen} 
        onClose={() => setIsSizeGuideOpen(false)} 
      />

      <ReviewForm 
        isOpen={isReviewFormOpen}
        onClose={() => setIsReviewFormOpen(false)}
        onSubmit={handleReviewSubmit}
      />

      <CartSidebar />

      <AddToCartAnimation 
        isVisible={showAddedAnimation}
        onComplete={() => setShowAddedAnimation(false)}
      />
    </main>
  );
} 