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
      className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-xl transition-all ${
        isCestaActive
          ? 'bg-emerald-800 text-white font-black shadow-sm'
          : cartCount > 0
          ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 font-black border border-amber-300'
          : 'text-stone-700 hover:text-emerald-800 hover:bg-stone-100 font-bold'
      }`}
    >
      <ShoppingCart className={`w-4 h-4 shrink-0 ${isCestaActive ? 'text-white' : 'text-emerald-700'}`} />
      <span className="text-[9px] sm:text-xs font-bold leading-tight tracking-tight text-center max-w-[44px] sm:max-w-none truncate">
        Cesta{cartCount > 0 ? ` (${cartCount})` : ''}
      </span>
    </Link>
  );
}

export default CartNavButton;
