import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, addDoc, collection, getDocs, query, orderBy, where, limit } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import { Product } from '@/types/product';
import { Review } from '@/types/review';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ''
};

// Only initialize Firebase if all required config values are present
const shouldInitialize = 
  firebaseConfig.apiKey && 
  firebaseConfig.authDomain && 
  firebaseConfig.projectId;

// Initialize Firebase conditionally
const app = shouldInitialize 
  ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0])
  : undefined;

// Initialize services only if app is defined
const auth = app ? getAuth(app) : getAuth();
const db = app ? getFirestore(app) : getFirestore();
const storage = app ? getStorage(app) : getStorage();

// Initialize Analytics only on client side
let analytics = null;
if (typeof window !== 'undefined' && app) {
  analytics = getAnalytics(app);
}

export async function getProducts(options: {
  featured?: boolean;
  limit?: number;
  category?: string;
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
} = {}) {
  try {
    if (!db) return [];
    
    const productsRef = collection(db, 'products');
    const constraints = [];
    
    if (options.featured) {
      constraints.push(where('featured', '==', true));
    }
    
    if (options.category) {
      constraints.push(where('category', '==', options.category));
    }
    
    if (options.orderByField) {
      constraints.push(orderBy(options.orderByField, options.orderDirection || 'desc'));
    }
    
    if (options.limit) {
      constraints.push(limit(options.limit));
    }
    
    const snapshot = await getDocs(query(productsRef, ...constraints));
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];

    console.log('Firebase Query Results:', {
      options,
      productCount: products.length,
      products
    });

    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export async function getProduct(productId: string) {
  try {
    if (!db) return null;
    
    const docRef = doc(db, 'products', productId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data()
    } as Product;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export async function getProductReviews(productId: string, limitCount: number = 5) {
  try {
    if (!db) return [];
    
    const q = query(
      collection(db, 'reviews'),
      where('productId', '==', productId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Review[];
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
}

export async function addProductReview(review: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    if (!db) throw new Error("Firestore not initialized");
    
    const reviewData = {
      ...review,
      status: 'pending',
      helpful: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const docRef = await addDoc(collection(db, 'reviews'), reviewData);
    return { id: docRef.id, ...reviewData };
  } catch (error) {
    console.error('Error adding review:', error);
    throw error;
  }
}

export async function getRelatedProducts(productId: string, category: string, limitCount = 4) {
  try {
    if (!db) return [];
    
    const q = query(
      collection(db, 'products'),
      where('category', '==', category),
      where('id', '!=', productId),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as Product[];

    return products;
  } catch (error) {
    console.error('Error fetching related products:', error);
    return [];
  }
}

export { app, auth, db, storage, analytics }; 