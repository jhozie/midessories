import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { triggerAbandonedCartEmail } from '@/lib/emailTriggers';

// This endpoint should be called by a cron job service (like Vercel Cron)
export async function GET() {
  try {
    // Find carts that have been abandoned for more than 4 hours but less than 24 hours
    const fourHoursAgo = Timestamp.fromDate(new Date(Date.now() - 4 * 60 * 60 * 1000));
    const oneDayAgo = Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
    
    const cartsQuery = query(
      collection(db, 'carts'),
      where('updatedAt', '>', oneDayAgo),
      where('updatedAt', '<', fourHoursAgo),
      where('status', '==', 'active'),
      where('emailSent', '==', false)
    );
    
    const cartsSnapshot = await getDocs(cartsQuery);
    
    let emailsSent = 0;
    
    for (const cartDoc of cartsSnapshot.docs) {
      const cart = cartDoc.data();
      
      // Skip carts without user information
      if (!cart.userId) continue;
      
      // Get user data
      const userRef = doc(db, 'users', cart.userId);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) continue;
      
      const user = userDoc.data();
      
      // Send abandoned cart email
      await triggerAbandonedCartEmail(user, cart.items);
      
      // Mark email as sent
      await updateDoc(doc(db, 'carts', cartDoc.id), {
        emailSent: true
      });
      
      emailsSent++;
    }
    
    return NextResponse.json({ success: true, emailsSent });
  } catch (error) {
    console.error('Error processing abandoned carts:', error);
    return NextResponse.json(
      { error: 'Failed to process abandoned carts' },
      { status: 500 }
    );
  }
} 