'use client';

import { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  color?: string;
  size?: string;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity: number) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  total: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType>({
  items: [],
  itemCount: 0,
  addItem: () => {},
  updateQuantity: () => {},
  removeItem: () => {},
  total: 0,
  isCartOpen: false,
  setIsCartOpen: () => {},
  clearCart: () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setItems(JSON.parse(savedCart));
    }
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const addItem = (newItem: Omit<CartItem, 'quantity'>, quantity: number) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(item => 
        item.id === newItem.id && 
        item.color === newItem.color && 
        item.size === newItem.size
      );

      if (existingItem) {
        return currentItems.map(item =>
          item === existingItem
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [...currentItems, { ...newItem, quantity }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id: string, quantity: number) => {
    setItems(currentItems =>
      quantity < 1
        ? currentItems.filter(item => item.id !== id)
        : currentItems.map(item =>
            item.id === id ? { ...item, quantity } : item
          )
    );
  };

  const removeItem = (id: string) => {
    setItems(currentItems => currentItems.filter(item => item.id !== id));
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const clearCart = () => setItems([]);

  return (
    <CartContext.Provider value={{
      items,
      itemCount: items.length,
      addItem,
      updateQuantity,
      removeItem,
      total,
      isCartOpen,
      setIsCartOpen,
      clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext); 