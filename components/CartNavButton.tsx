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
          : 'text-stone-700 hover:text-emerald-800 hover:bg-stone-100 font-bold'
      }`}
    >
      <div className="relative flex items-center justify-center">
        <ShoppingCart
          className={`w-4 h-4 shrink-0 ${
            isCestaActive ? 'text-white' : 'text-emerald-700'
          }`}
        />
        {cartCount > 0 && !isCestaActive && (
          <span className="absolute -top-1.5 -right-2 bg-emerald-800 text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-sm">
            {cartCount}
          </span>
        )}
      </div>
      <span className="text-[9px] sm:text-xs font-black uppercase leading-tight tracking-wider text-center max-w-[48px] sm:max-w-none truncate">
        CESTA{cartCount > 0 && isCestaActive ? ` (${cartCount})` : ''}
      </span>
    </Link>
  );
}

export default CartNavButton;
