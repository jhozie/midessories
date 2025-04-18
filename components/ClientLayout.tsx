'use client';

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CartProvider } from '@/contexts/CartContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');

  return (
    <AuthProvider>
      <CartProvider>
        {!isAdminPage && <Header />}
        {children}
        {!isAdminPage && <Footer />}
      </CartProvider>
    </AuthProvider>
  );
} 