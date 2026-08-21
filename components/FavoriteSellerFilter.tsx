'use client';

import { useSyncExternalStore } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Star } from 'lucide-react';

const STORAGE_KEY_SELLERS = 'km0_fav_sellers';

let cachedFavSellers: string[] = [];
let cachedFavString = '';

function subscribe(callback: () => void) {
  window.addEventListener('km0_favorites_updated', callback);
  window.addEventListener('km0_fav_updated', callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener('km0_favorites_updated', callback);
    window.removeEventListener('km0_fav_updated', callback);
    window.removeEventListener('storage', callback);
  };
}

function getFavSellers(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SELLERS) || '[]';
    if (raw !== cachedFavString) {
      cachedFavString = raw;
      cachedFavSellers = JSON.parse(raw);
    }
    return cachedFavSellers;
  } catch {
    return cachedFavSellers;
  }
}

const EMPTY_FAV_SELLERS: string[] = [];
function getServerFavSellers(): string[] {
  return EMPTY_FAV_SELLERS;
}

export function FavoriteSellerFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const favSellers = useSyncExternalStore(subscribe, getFavSellers, getServerFavSellers);

  const isFilterActive = searchParams.get('fav_sellers') === 'true';

  const toggleFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (isFilterActive) {
      params.delete('fav_sellers');
      params.delete('seller_ids');
    } else {
      params.set('fav_sellers', 'true');
      if (favSellers.length > 0) {
        params.set('seller_ids', favSellers.join(','));
      } else {
        params.set('seller_ids', 'none');
      }
    }
    router.push(`/?${params.toString()}`);
  };

  return (
    <button
      type="button"
      onClick={toggleFilter}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all shadow-sm ${
        isFilterActive
          ? 'bg-amber-100 border-amber-400 text-amber-950 ring-2 ring-amber-300'
          : 'border-stone-300 hover:bg-stone-100 text-stone-800 bg-white'
      }`}
    >
      <Star className={`w-3.5 h-3.5 ${isFilterActive ? 'fill-amber-500 text-amber-500' : 'text-stone-500'}`} />
      <span>Mis Caseríos Favoritos {favSellers.length > 0 ? `(${favSellers.length})` : ''}</span>
    </button>
  );
}

export default FavoriteSellerFilter;
