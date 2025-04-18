import { Product } from '@/types/product';

export const products: Product[] = [
  {
    id: '1',
    name: 'Modern Phone Case',
    description: 'Premium Protection for Your Device',
    price: 29.99,
    rating: 4.8,
    reviews: 120,
    purchases: 300,
    images: ['/phonecase.jpg', '/phonecase.jpg', '/phonecase.jpg', '/phonecase.jpg'],
    colors: ['bg-black', 'bg-white', 'bg-pink-500', 'bg-blue-500'],
    sizes: ['iPhone 13', 'iPhone 13 Pro', 'iPhone 14', 'iPhone 14 Pro'],
    category: 'Phone Cases',
    tags: ['protection', 'modern', 'slim']
  },
  // Add more products...
]; 