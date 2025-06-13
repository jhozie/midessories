export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;  // Base price, can be overridden by variants
  compareAtPrice?: number; // Original price for showing discounts
  images: string[];
  category: string;
  categoryName?: string;
  subcategory?: string;
  stock: number;
  sku: string; // Stock Keeping Unit
  barcode?: string; // EAN, UPC, etc.
  brand?: string;
  tags: string[];
  specifications: {
    [key: string]: string; // e.g., { "Color": "Red", "Size": "Large" }
  };
  hasVariants: boolean;  // New field to indicate if product uses variants
  variantOptions?: VariantOption[];
  variants?: ProductVariant[];
  status: 'active' | 'draft' | 'archived';
  featured: boolean;
  isNewArrival: boolean;
  newArrivalUntil?: Date;
  ratings: {
    average: number;
    count: number;
  };
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  shipping: {
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    freeShipping: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface VariantOption {
  name: string;       // e.g., "Size", "Color", "Material"
  values: string[];   // e.g., ["S", "M", "L"] or ["Red", "Blue"]
}

export interface ProductVariant {
  id: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  attributes: {
    [key: string]: string; // Dynamic key-value pairs
  };
  images: string[];
} 