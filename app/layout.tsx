import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
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
      <body className="bg-stone-50 text-stone-900 antialiased min-h-screen flex flex-col">
        <CartProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <footer className="border-t-2 border-stone-200 bg-white py-6 text-center text-xs font-bold text-stone-600">
            <p>© {new Date().getFullYear()} km0 - Comercio local directo de caserío y proximidad.</p>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}