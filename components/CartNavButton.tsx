'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export function CartNavButton() {
  const pathname = usePathname();
  const { cartCount } = useCart();
  const isCestaActive = pathname.startsWith('/cesta');

  return (
    <Link
      href="/cesta"
      title="Ver mi cesta de la compra"
      className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm transition-all flex items-center gap-1.5 ${
        isCestaActive
          ? 'bg-emerald-800 text-white font-black shadow-sm'
          : cartCount > 0
          ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 font-black border border-amber-300'
          : 'text-stone-700 hover:text-emerald-800 hover:bg-stone-100 font-bold'
      }`}
    >
      <ShoppingCart className={`w-4 h-4 ${isCestaActive ? 'text-white' : 'text-emerald-700'}`} />
      <span className="hidden sm:inline">Cesta</span>
      {cartCount > 0 && (
        <span className="text-[11px] font-black">
          ({cartCount})
        </span>
      )}
    </Link>
  );
}

export default CartNavButton;
