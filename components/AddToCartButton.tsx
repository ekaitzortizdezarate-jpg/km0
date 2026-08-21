'use client';

import { useState } from 'react';
import { ShoppingCart, Check } from 'lucide-react';
import { useCart, CartItem } from '@/context/CartContext';

interface AddToCartButtonProps {
  item: CartItem;
  className?: string;
  variant?: 'compact' | 'full';
}

export function AddToCartButton({
  item,
  className = '',
  variant = 'compact',
}: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addToCart(item);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
    }, 1800);
  };

  if (variant === 'full') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`w-full py-3.5 px-5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${
          added
            ? 'bg-emerald-600 text-white'
            : 'bg-emerald-700 hover:bg-emerald-800 text-white'
        } ${className}`}
      >
        {added ? (
          <>
            <Check className="w-5 h-5" /> ¡Añadido a la Cesta!
          </>
        ) : (
          <>
            <ShoppingCart className="w-5 h-5" /> Añadir a la Cesta
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Añadir a la cesta"
      className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 shadow-sm ${
        added
          ? 'bg-emerald-600 text-white'
          : 'bg-emerald-700 hover:bg-emerald-800 text-white'
      } ${className}`}
    >
      {added ? (
        <>
          <Check className="w-3.5 h-3.5" />
          <span>¡Añadido!</span>
        </>
      ) : (
        <>
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Añadir</span>
        </>
      )}
    </button>
  );
}

export default AddToCartButton;
