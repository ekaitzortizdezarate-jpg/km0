'use client';

import { useSyncExternalStore } from 'react';
import { Heart, Star } from 'lucide-react';

interface FavoriteButtonProps {
  id: string; // Product ID or Seller ID
  type: 'product' | 'seller';
  className?: string;
  showText?: boolean;
}

const STORAGE_KEYS = {
  product: 'km0_fav_products',
  seller: 'km0_fav_sellers',
};

function subscribe(callback: () => void) {
  window.addEventListener('km0_favorites_updated', callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener('km0_favorites_updated', callback);
    window.removeEventListener('storage', callback);
  };
}

export function FavoriteButton({
  id,
  type,
  className = '',
  showText = false,
}: FavoriteButtonProps) {
  const isFavorite = useSyncExternalStore(
    subscribe,
    () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS[type]);
        if (stored) {
          const list: string[] = JSON.parse(stored);
          return list.includes(id);
        }
      } catch {
        // Ignore errors
      }
      return false;
    },
    () => false // Server snapshot
  );

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const key = STORAGE_KEYS[type];
      const stored = localStorage.getItem(key);
      let list: string[] = stored ? JSON.parse(stored) : [];

      if (list.includes(id)) {
        list = list.filter((item) => item !== id);
      } else {
        list.push(id);
      }

      localStorage.setItem(key, JSON.stringify(list));
      window.dispatchEvent(new Event('km0_favorites_updated'));
    } catch {
      // Ignore errors
    }
  };

  if (type === 'seller') {
    return (
      <button
        type="button"
        onClick={toggleFavorite}
        title={isFavorite ? 'Quitar caserío de favoritos' : 'Guardar caserío como favorito'}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
          isFavorite
            ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-sm'
            : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200'
        } ${className}`}
      >
        <Star
          className={`w-3.5 h-3.5 ${
            isFavorite ? 'fill-amber-500 text-amber-500' : 'text-stone-500'
          }`}
        />
        {showText && (
          <span>{isFavorite ? 'Caserío Favorito' : 'Guardar Caserío'}</span>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      title={isFavorite ? 'Quitar de favoritos' : 'Guardar producto como favorito'}
      className={`inline-flex items-center gap-1.5 p-2 rounded-xl transition-all ${
        isFavorite
          ? 'bg-rose-50 text-rose-600 border border-rose-200'
          : 'bg-stone-100/90 hover:bg-stone-200 text-stone-600 border border-stone-200'
      } ${className}`}
    >
      <Heart
        className={`w-4 h-4 transition-transform active:scale-125 ${
          isFavorite ? 'fill-rose-500 text-rose-500' : 'text-stone-500'
        }`}
      />
      {showText && (
        <span className="text-xs font-bold">
          {isFavorite ? 'Producto Favorito' : 'Favorito'}
        </span>
      )}
    </button>
  );
}

export default FavoriteButton;
