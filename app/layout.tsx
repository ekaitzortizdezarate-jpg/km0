import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CookieBanner from '@/components/CookieBanner';
import { CartProvider } from '@/context/CartContext';

export const metadata: Metadata = {
  title: 'km0 | Productos de caserío y proximidad',
  description: 'Compra y venta directa de verduras, frutas, quesos y productos locales.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="bg-stone-50 text-stone-900 antialiased min-h-screen flex flex-col justify-between">
        <CartProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <Footer />
          <CookieBanner />
        </CartProvider>
      </body>
    </html>
  );
}