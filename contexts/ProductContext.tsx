'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@/types/product';
import { getProduct } from '@/lib/firebase';

interface ProductContextType {
  product: Product | null;
  loading: boolean;
}

const ProductContext = createContext<ProductContextType>({
  product: null,
  loading: true
});

export function ProductProvider({ children, productId }: { children: React.ReactNode, productId: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProduct() {
      if (!productId) return;
      const data = await getProduct(productId);
      setProduct(data);
      setLoading(false);
    }
    fetchProduct();
  }, [productId]);

  return (
    <ProductContext.Provider value={{ product, loading }}>
      {children}
    </ProductContext.Provider>
  );
}

export const useProduct = () => useContext(ProductContext); 