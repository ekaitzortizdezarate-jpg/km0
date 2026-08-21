'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export function CartNavButton() {
  const { cartCount, totalPrice } = useCart();

  return (
    <Link
      href="/cesta"
      title="Ver mi cesta de la compra"
      className="relative flex items-center gap-2 bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm"
    >
      <ShoppingCart className="w-4 h-4" />
      <span className="hidden sm:inline">Cesta</span>
      {cartCount > 0 && (
        <span className="bg-amber-400 text-stone-950 font-black text-[11px] px-1.5 py-0.2 rounded-full min-w-[18px] text-center">
          {cartCount}
        </span>
      )}
      {cartCount > 0 && totalPrice > 0 && (
        <span className="hidden md:inline font-bold text-emerald-100 text-[11px]">
          ({totalPrice.toFixed(2)}€)
        </span>
      )}
    </Link>
  );
}

export default CartNavButton;
