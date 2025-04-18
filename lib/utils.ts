import { Product } from "@/types/product";
import { Category } from "@/types/category";
export function generateSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function generateSEOUrl(product: Product) {
  // Remove special characters and convert to lowercase
  const cleanName = product.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
    
  return `/product/${cleanName}-${product.id}`;
}

export function generateCategorySEOUrl(category: Category) {
  return `/category/${category.slug}`;
}

export function formatNaira(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
} 