'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';

type AddToCartAnimationProps = {
  isVisible: boolean;
  onComplete: () => void;
};

export default function AddToCartAnimation({ isVisible, onComplete }: AddToCartAnimationProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          onAnimationComplete={onComplete}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full 
                     shadow-lg flex items-center gap-2"
        >
          <ShoppingBag className="w-5 h-5" />
          <span>Added to cart!</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 