import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function getBackInStockSubscribers(productId: string) {
  try {
    const productRef = doc(db, 'products', productId);
    const productSnap = await getDoc(productRef);
    
    if (!productSnap.exists()) {
      return [];
    }
    
    const productData = productSnap.data();
    return productData.backInStockSubscribers || [];
  } catch (error) {
    console.error('Error getting back in stock subscribers:', error);
    return [];
  }
} 