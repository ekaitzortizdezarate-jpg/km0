'use client';

import { useState, useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import {
  Search,
  Store,
  Clock,
  Sparkles,
  Sprout,
  Heart,
  PlusCircle,
  MessageCircle,
  X,
  Edit2,
  Trash2,
  Package,
  ArrowUpDown,
} from 'lucide-react';
import { ProductCategory, ProductWithSeller, Profile } from '@/types/database';
import { QuickAddToCartModal } from '@/components/QuickAddToCartModal';
import { FavoriteButton } from '@/components/FavoriteButton';
import { getDeliveryEstimate } from '@/lib/delivery';
import { deleteProduct } from '@/app/actions/products';

const CATEGORIES: { id: ProductCategory; name: string; icon: string }[] = [
  { id: 'verduras_hortalizas', name: 'Verduras', icon: '🥬' },
  { id: 'frutas', name: 'Frutas', icon: '🍎' },
  { id: 'quesos_lacteos', name: 'Lácteos', icon: '🧀' },
  { id: 'bebidas', name: 'Bebidas', icon: '🍷' },
  { id: 'otros_alimentos', name: 'Otros', icon: '🍯' },
  { id: 'plantas_flores', name: 'Plantas', icon: '🌻' },
  { id: 'artesania', name: 'Artesanía', icon: '🧶' },
];

const EMPTY_FAV_SET = new Set<string>();
const cachedFavSets: Record<string, Set<string>> = {};
const cachedFavStrings: Record<string, string> = {};

function getFavList(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key) || '[]';
    if (raw === cachedFavStrings[key]) {
      return cachedFavSets[key] || EMPTY_FAV_SET;
    }
    cachedFavStrings[key] = raw;
    const parsed: string[] = JSON.parse(raw);
    const set = new Set(parsed);
    cachedFavSets[key] = set;
    return set;
  } catch {
    return EMPTY_FAV_SET;
  }
}

function subscribeFavorites(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('km0_favorites_updated', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('km0_favorites_updated', callback);
  };
}

interface SellerWithProducts {
  profile: Profile;
  products: ProductWithSeller[];
  deliveryPointsCount: number;
}

interface CatalogViewContainerProps {
  products: ProductWithSeller[];
  sellers: Profile[];
  userProfile?: Profile | null;
  selectedCategory?: ProductCategory;
  selectedTown?: string;
}

type SortOption =
  | 'nombre_asc'
  | 'nombre_desc'
  | 'precio_asc'
  | 'precio_desc'
  | 'fecha_asc'
  | 'fecha_desc'
  | 'stock_desc'
  | 'stock_asc';

export function CatalogViewContainer({
  products,
  sellers,
  userProfile,
  selectedCategory,
  selectedTown,
}: CatalogViewContainerProps) {
  const isSeller = userProfile?.role === 'vendedor';

  // Pestaña activa: para vendedor por defecto 'mis_productos', para comprador 'todos_productos'
  const [activeTab, setActiveTab] = useState<
    'mis_productos' | 'todos_productos' | 'vendedores' | 'favoritos'
  >(isSeller ? 'mis_productos' : 'todos_productos');

  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(selectedCategory || null);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('nombre_asc');

  const handleDeleteProduct = async (productId: string, productName: string) => {
    const confirmDelete = window.confirm(`¿Estás seguro de que deseas eliminar permanentemente "${productName}"?`);
    if (!confirmDelete) return;

    setDeletingId(productId);
    const res = await deleteProduct(productId);
    setDeletingId(null);

    if (res?.error) {
      alert('Error al borrar producto: ' + res.error);
    } else {
      window.location.reload();
    }
  };

  const favProducts = useSyncExternalStore(
    subscribeFavorites,
    () => getFavList('km0_fav_products'),
    () => EMPTY_FAV_SET
  );

  const favSellers = useSyncExternalStore(
    subscribeFavorites,
    () => getFavList('km0_fav_sellers'),
    () => EMPTY_FAV_SET
  );

  // Agrupar productos por vendedor (memoizado)
  const sellersMap = useMemo(() => {
    const map: Record<string, SellerWithProducts> = {};
    sellers.forEach((s) => {
      map[s.id] = {
        profile: s,
        products: [],
        deliveryPointsCount: 0,
      };
    });

    products.forEach((p) => {
      if (map[p.seller_id]) {
        map[p.seller_id].products.push(p);
      } else if (p.profiles) {
        map[p.seller_id] = {
          profile: p.profiles as unknown as Profile,
          products: [p],
          deliveryPointsCount: 0,
        };
      }
    });
    return map;
  }, [sellers, products]);

  const allSellersList = useMemo(() => Object.values(sellersMap), [sellersMap]);

  const mySellerProductsCount = useMemo(() => {
    return userProfile ? products.filter((p) => p.seller_id === userProfile.id).length : 0;
  }, [products, userProfile]);

  // Filtrado de Vendedores para la pestaña "Vendedores / Caseríos" (memoizado)
  const filteredSellers = useMemo(() => {
    return allSellersList.filter(({ profile, products: sellerProds }) => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchName = profile.full_name?.toLowerCase().includes(q);
        const matchTown = profile.town?.toLowerCase().includes(q);
        const matchBio = profile.bio?.toLowerCase().includes(q);
        const matchProd = sellerProds.some((p) => p.name.toLowerCase().includes(q));
        if (!matchName && !matchTown && !matchBio && !matchProd) return false;
      }
      if (selectedTown) {
        if (profile.town?.toLowerCase() !== selectedTown.toLowerCase()) return false;
      }
      return true;
    });
  }, [allSellersList, searchTerm, selectedTown]);

  // Filtrado y Ordenación de Productos (memoizado)
  const sortedProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      // 1. Filtrado por Pestaña
      if (activeTab === 'mis_productos') {
        if (!userProfile || product.seller_id !== userProfile.id) return false;
      } else if (activeTab === 'favoritos') {
        if (!favProducts.has(product.id)) return false;
      }

      // 2. Filtrado por Vendedor específico seleccionado
      if (selectedSellerId && product.seller_id !== selectedSellerId) {
        return false;
      }

      // 3. Filtrado por Categoría
      if (activeCategory && product.category !== activeCategory) {
        return false;
      }

      // 4. Filtrado por Pueblo
      if (selectedTown && product.profiles?.town?.toLowerCase() !== selectedTown.toLowerCase()) {
        return false;
      }

      // 5. Filtrado por Búsqueda de Texto (Nombre, Pueblo, Caserío)
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchName = product.name.toLowerCase().includes(q);
        const matchDesc = product.description?.toLowerCase().includes(q);
        const matchSeller = product.profiles?.full_name?.toLowerCase().includes(q);
        const matchTown = product.profiles?.town?.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchSeller && !matchTown) return false;
      }

      return true;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'nombre_asc') {
        return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
      }
      if (sortBy === 'nombre_desc') {
        return b.name.localeCompare(a.name, 'es', { sensitivity: 'base' });
      }
      if (sortBy === 'precio_asc') {
        const priceA = a.format === 'granel' ? (a.price_per_kilo || a.price) : a.price;
        const priceB = b.format === 'granel' ? (b.price_per_kilo || b.price) : b.price;
        return Number(priceA) - Number(priceB);
      }
      if (sortBy === 'precio_desc') {
        const priceA = a.format === 'granel' ? (a.price_per_kilo || a.price) : a.price;
        const priceB = b.format === 'granel' ? (b.price_per_kilo || b.price) : b.price;
        return Number(priceB) - Number(priceA);
      }
      if (sortBy === 'fecha_asc') {
        const estA = getDeliveryEstimate(
          a.availability_type,
          a.availability_days,
          a.availability_weekdays,
          a.available_from_date
        );
        const estB = getDeliveryEstimate(
          b.availability_type,
          b.availability_days,
          b.availability_weekdays,
          b.available_from_date
        );
        return estA.estimatedDate.getTime() - estB.estimatedDate.getTime();
      }
      if (sortBy === 'fecha_desc') {
        const estA = getDeliveryEstimate(
          a.availability_type,
          a.availability_days,
          a.availability_weekdays,
          a.available_from_date
        );
        const estB = getDeliveryEstimate(
          b.availability_type,
          b.availability_days,
          b.availability_weekdays,
          b.available_from_date
        );
        return estB.estimatedDate.getTime() - estA.estimatedDate.getTime();
      }
      if (sortBy === 'stock_desc') {
        const stockA = a.is_unlimited_stock ? 999999 : Number(a.stock) || 0;
        const stockB = b.is_unlimited_stock ? 999999 : Number(b.stock) || 0;
        return stockB - stockA;
      }
      if (sortBy === 'stock_asc') {
        const stockA = a.is_unlimited_stock ? 999999 : Number(a.stock) || 0;
        const stockB = b.is_unlimited_stock ? 999999 : Number(b.stock) || 0;
        return stockA - stockB;
      }
      return 0;
    });
  }, [
    products,
    activeTab,
    userProfile,
    favProducts,
    selectedSellerId,
    activeCategory,
    selectedTown,
    searchTerm,
    sortBy,
  ]);

  const filteredProducts = sortedProducts;

  const activeSellerObj = selectedSellerId ? sellersMap[selectedSellerId]?.profile : null;

  return (
    <div className="space-y-6">
      {/* 1. Barra Superior de Pestañas Unificadas */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-stone-200 pb-4">
        <div className="grid grid-cols-3 gap-1 sm:gap-2 bg-stone-200/80 p-1 sm:p-1.5 rounded-2xl w-full sm:w-auto">
          {/* Pestañas para VENDEDOR */}
          {isSeller ? (
            <>
              {/* 1. Mis Productos (Por defecto) */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('mis_productos');
                  setSelectedSellerId(null);
                }}
                className={`px-1.5 sm:px-4 py-1.5 sm:py-2.5 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 ${
                  activeTab === 'mis_productos'
                    ? 'bg-emerald-800 text-white shadow-md'
                    : 'text-stone-700 hover:text-stone-900 font-bold'
                }`}
              >
                <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <div className="flex flex-col items-center sm:items-start leading-tight">
                  <span className="text-[8px] sm:text-[11px] font-semibold opacity-90">Mis</span>
                  <span className="text-[9px] sm:text-xs font-black uppercase sm:normal-case">Productos</span>
                </div>
                <span className={`text-[8px] sm:text-[10px] font-black px-1 sm:px-1.5 py-0.5 rounded-md ${
                  activeTab === 'mis_productos' ? 'bg-emerald-950 text-white' : 'bg-stone-300 text-stone-700'
                }`}>
                  {mySellerProductsCount}
                </span>
              </button>

              {/* 2. Todos los productos */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('todos_productos');
                  setSelectedSellerId(null);
                }}
                className={`px-1.5 sm:px-4 py-1.5 sm:py-2.5 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 ${
                  activeTab === 'todos_productos'
                    ? 'bg-emerald-800 text-white shadow-md'
                    : 'text-stone-700 hover:text-stone-900 font-bold'
                }`}
              >
                <Sprout className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <div className="flex flex-col items-center sm:items-start leading-tight">
                  <span className="text-[8px] sm:text-[11px] font-semibold opacity-90">Todos los</span>
                  <span className="text-[9px] sm:text-xs font-black uppercase sm:normal-case">Productos</span>
                </div>
                <span className={`text-[8px] sm:text-[10px] font-black px-1 sm:px-1.5 py-0.5 rounded-md ${
                  activeTab === 'todos_productos' ? 'bg-emerald-950 text-white' : 'bg-stone-300 text-stone-700'
                }`}>
                  {products.length}
                </span>
              </button>

              {/* 3. Caseríos y vendedores */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('vendedores');
                  setSelectedSellerId(null);
                }}
                className={`px-1.5 sm:px-4 py-1.5 sm:py-2.5 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 ${
                  activeTab === 'vendedores'
                    ? 'bg-emerald-800 text-white shadow-md'
                    : 'text-stone-700 hover:text-stone-900 font-bold'
                }`}
              >
                <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <div className="flex flex-col items-center sm:items-start leading-tight">
                  <span className="text-[8px] sm:text-[11px] font-semibold opacity-90">Caseríos y</span>
                  <span className="text-[9px] sm:text-xs font-black uppercase sm:normal-case">Vendedores</span>
                </div>
                <span className={`text-[8px] sm:text-[10px] font-black px-1 sm:px-1.5 py-0.5 rounded-md ${
                  activeTab === 'vendedores' ? 'bg-emerald-950 text-white' : 'bg-stone-300 text-stone-700'
                }`}>
                  {allSellersList.length}
                </span>
              </button>
            </>
          ) : (
            /* Pestañas para COMPRADOR / VISITANTE */
            <>
              {/* 1. Todos los productos */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('todos_productos');
                  setSelectedSellerId(null);
                }}
                className={`px-1.5 sm:px-4 py-1.5 sm:py-2.5 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 ${
                  activeTab === 'todos_productos'
                    ? 'bg-emerald-800 text-white shadow-md'
                    : 'text-stone-700 hover:text-stone-900 font-bold'
                }`}
              >
                <Sprout className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <div className="flex flex-col items-center sm:items-start leading-tight">
                  <span className="text-[8px] sm:text-[11px] font-semibold opacity-90">Todos los</span>
                  <span className="text-[9px] sm:text-xs font-black uppercase sm:normal-case">Productos</span>
                </div>
                <span className={`text-[8px] sm:text-[10px] font-black px-1 sm:px-1.5 py-0.5 rounded-md ${
                  activeTab === 'todos_productos' ? 'bg-emerald-950 text-white' : 'bg-stone-300 text-stone-700'
                }`}>
                  {products.length}
                </span>
              </button>

              {/* 2. Caseríos y Productores */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('vendedores');
                  setSelectedSellerId(null);
                }}
                className={`px-1.5 sm:px-4 py-1.5 sm:py-2.5 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 ${
                  activeTab === 'vendedores'
                    ? 'bg-emerald-800 text-white shadow-md'
                    : 'text-stone-700 hover:text-stone-900 font-bold'
                }`}
              >
                <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <div className="flex flex-col items-center sm:items-start leading-tight">
                  <span className="text-[8px] sm:text-[11px] font-semibold opacity-90">Caseríos y</span>
                  <span className="text-[9px] sm:text-xs font-black uppercase sm:normal-case">Vendedores</span>
                </div>
                <span className={`text-[8px] sm:text-[10px] font-black px-1 sm:px-1.5 py-0.5 rounded-md ${
                  activeTab === 'vendedores' ? 'bg-emerald-950 text-white' : 'bg-stone-300 text-stone-700'
                }`}>
                  {allSellersList.length}
                </span>
              </button>

              {/* 3. Favoritos */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('favoritos');
                  setSelectedSellerId(null);
                }}
                className={`px-1.5 sm:px-4 py-1.5 sm:py-2.5 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 ${
                  activeTab === 'favoritos'
                    ? 'bg-emerald-800 text-white shadow-md'
                    : 'text-stone-700 hover:text-stone-900 font-bold'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${favProducts.size > 0 ? 'fill-rose-400 text-rose-400' : ''}`} />
                <div className="flex flex-col items-center sm:items-start leading-tight">
                  <span className="text-[8px] sm:text-[11px] font-semibold opacity-90">Tus</span>
                  <span className="text-[9px] sm:text-xs font-black uppercase sm:normal-case">Favoritos</span>
                </div>
                <span className={`text-[8px] sm:text-[10px] font-black px-1 sm:px-1.5 py-0.5 rounded-md ${
                  activeTab === 'favoritos' ? 'bg-emerald-950 text-white' : 'bg-stone-300 text-stone-700'
                }`}>
                  {favProducts.size}
                </span>
              </button>
            </>
          )}
        </div>

        {/* Botón de Publicar Producto para Vendedores (Doble de alto, texto en dos líneas) */}
        {isSeller && (
          <Link
            href="/vendedor/productos/nuevo"
            className="w-full sm:w-auto px-6 py-3.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl shadow-md transition-all flex items-center justify-center gap-2.5 shrink-0 border border-emerald-950 hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusCircle className="w-5 h-5 text-emerald-300 shrink-0" />
            <div className="flex flex-col items-center sm:items-start leading-tight">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-200">
                PUBLICAR
              </span>
              <span className="text-xs sm:text-sm font-black uppercase tracking-wide text-white">
                PRODUCTO
              </span>
            </div>
          </Link>
        )}
      </div>

      {/* 2. Barra de Búsqueda */}
      <div className="relative w-full">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={
            activeTab === 'vendedores'
              ? 'Buscar por caserío, productor o pueblo...'
              : 'Buscar por nombre de producto, caserío o pueblo (ej. tomate, Gernika...)'
          }
          className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-stone-300 rounded-2xl text-xs font-bold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-sm"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Banner de Filtro de Vendedor Activo (al hacer clic en Ver productos de un caserío) */}
      {selectedSellerId && activeSellerObj && (
        <div className="p-4 bg-emerald-50 rounded-2xl border-2 border-emerald-300 flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <Store className="w-5 h-5 text-emerald-800 shrink-0" />
            <div>
              <p className="text-xs font-black text-emerald-950">
                Mostrando productos del Caserío: <strong>{activeSellerObj.full_name}</strong> ({activeSellerObj.town})
              </p>
              <p className="text-[11px] font-semibold text-emerald-800">
                {filteredProducts.length} productos disponibles
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSelectedSellerId(null)}
            className="px-3 py-1.5 bg-white hover:bg-emerald-100 text-emerald-900 font-black text-xs rounded-xl border border-emerald-300 transition-colors flex items-center gap-1 shadow-sm"
          >
            <X className="w-3.5 h-3.5" /> Ver todos los caseríos
          </button>
        </div>
      )}

      {/* 3. Selector de Categorías (cuando se visualizan productos) */}
      {activeTab !== 'vendedores' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              activeCategory === null
                ? 'bg-emerald-800 text-white border-emerald-900 shadow-sm'
                : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
            }`}
          >
            Todas las Categorías
          </button>

          {CATEGORIES.map((cat) => (
            <button
              type="button"
              key={cat.id}
              onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                activeCategory === cat.id
                  ? 'bg-emerald-800 text-white border-emerald-900 shadow-sm'
                  : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Selector de Ordenación (para productos) */}
      {activeTab !== 'vendedores' && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <span className="text-xs font-bold text-stone-500">
            {sortedProducts.length} {sortedProducts.length === 1 ? 'producto' : 'productos'}
          </span>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-stone-500 shrink-0" />
            <label className="text-xs font-bold text-stone-700 shrink-0">Ordenar por:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-1.5 bg-white border-2 border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none shadow-sm cursor-pointer"
            >
              <option value="nombre_asc">Nombre (A - Z)</option>
              <option value="nombre_desc">Nombre (Z - A)</option>
              <option value="precio_asc">Precio: Menor a Mayor</option>
              <option value="precio_desc">Precio: Mayor a Menor</option>
              <option value="fecha_asc">Fecha entrega: Más próxima</option>
              <option value="fecha_desc">Fecha entrega: Más lejana</option>
              <option value="stock_desc">Cantidad disponible: Mayor a Menor</option>
              <option value="stock_asc">Cantidad disponible: Menor a Mayor</option>
            </select>
          </div>
        </div>
      )}

      {/* 4. CONTENIDO PRINCIPAL */}

      {/* VISTA A: VENDEDORES / CASERÍOS */}
      {activeTab === 'vendedores' && (
        <div className="space-y-4">
          {filteredSellers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSellers.map(({ profile, products: sellerProds }) => (
                <div
                  key={profile.id}
                  className="bg-white rounded-3xl border-2 border-stone-200 overflow-hidden shadow-sm hover:shadow-md hover:border-emerald-700 transition-all flex flex-col justify-between"
                >
                  <div className="p-5 sm:p-6 space-y-4">
                    {/* Cabecera del Caserío */}
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-stone-100">
                      <div className="flex items-center gap-3">
                        {profile.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt={profile.full_name || 'Vendedor'}
                            className="w-12 h-12 rounded-2xl object-cover border border-stone-200 shrink-0 shadow-sm"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-900 font-black text-lg flex items-center justify-center border border-emerald-300 shrink-0">
                            {profile.full_name?.charAt(0) || 'C'}
                          </div>
                        )}
                        <div>
                          <h3 className="text-base font-black text-stone-900 leading-tight">
                            {profile.full_name}
                          </h3>
                          <span className="text-xs font-bold text-emerald-800">
                            📍 {profile.town}
                          </span>
                        </div>
                      </div>

                      <FavoriteButton id={profile.id} type="seller" />
                    </div>

                    {profile.bio && (
                      <p className="text-xs font-medium text-stone-600 line-clamp-2">
                        {profile.bio}
                      </p>
                    )}

                    {/* Resumen de Productos disponibles con stock */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-black uppercase text-stone-400 block tracking-wider">
                        Productos de temporada ({sellerProds.length}):
                      </span>

                      {sellerProds.length > 0 ? (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {sellerProds.map((prod) => {
                            const prodStock = Number(prod.stock) || 0;
                            const prodOutOfStock = !prod.is_unlimited_stock && prodStock <= 0;
                            return (
                              <div
                                key={prod.id}
                                className="flex items-center justify-between text-xs bg-stone-50 p-2 rounded-xl border border-stone-200 font-semibold"
                              >
                                <div className="flex flex-col truncate max-w-[160px]">
                                  <span className="font-bold text-stone-900 truncate">
                                    {prod.name}
                                  </span>
                                  <span className={`text-[10px] font-semibold ${prodOutOfStock ? 'text-red-700 font-bold' : 'text-stone-500'}`}>
                                    {prod.is_unlimited_stock
                                      ? 'Stock ilimitado'
                                      : prodOutOfStock
                                      ? 'Agotado'
                                      : `${prodStock} ${prod.format === 'granel' ? 'kg' : 'uds'} disponibles`}
                                  </span>
                                </div>
                                <span className="font-black text-emerald-900 shrink-0">
                                  {prod.format === 'granel'
                                    ? `${Number(prod.price_per_kilo || prod.price).toFixed(2)} €/kg`
                                    : `${Number(prod.price).toFixed(2)} €`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-stone-400 font-semibold italic bg-stone-50 p-2.5 rounded-xl text-center">
                          Actualmente sin productos publicados.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Acciones del Caserío */}
                  <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSellerId(profile.id);
                        setActiveTab('todos_productos');
                      }}
                      className="flex-1 py-2.5 px-3 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-black rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <Sprout className="w-3.5 h-3.5" />
                      <span>Ver Productos ({sellerProds.length})</span>
                    </button>

                    <Link
                      href={`/chat/${profile.id}`}
                      className="p-2.5 bg-white hover:bg-emerald-50 text-emerald-900 border border-stone-300 rounded-xl transition-colors shadow-sm"
                      title="Chatear con el productor"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border-2 border-stone-200 p-10 text-center space-y-3 shadow-sm">
              <Store className="w-12 h-12 text-stone-400 mx-auto" />
              <h3 className="text-base font-black text-stone-900">
                No se encontraron caseríos ni productores
              </h3>
              <p className="text-xs font-semibold text-stone-500 max-w-sm mx-auto">
                Prueba a limpiar la búsqueda o cambia el pueblo seleccionado.
              </p>
            </div>
          )}
        </div>
      )}

      {/* VISTA B: PRODUCTOS (MIS PRODUCTOS / TODOS LOS PRODUCTOS / FAVORITOS) */}
      {activeTab !== 'vendedores' && (
        <div className="space-y-6">
          {sortedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {sortedProducts.map((product) => {
                const isMyProduct = userProfile?.id === product.seller_id;
                const stockQty = Number(product.stock) || 0;
                const isOutOfStock = !product.is_unlimited_stock && stockQty <= 0;

                // Cálculo de entrega estimada
                const estimate = getDeliveryEstimate(
                  product.availability_type,
                  product.availability_days,
                  product.availability_weekdays,
                  product.available_from_date
                );

                const itemPayload = {
                  productId: product.id,
                  sellerId: product.seller_id,
                  sellerName: product.profiles?.full_name || 'Caserío',
                  sellerTown: product.profiles?.town || '',
                  sellerAvatarUrl: product.profiles?.avatar_url || null,
                  name: product.name,
                  category: product.category,
                  format: product.format,
                  price: product.price,
                  unitPrice: product.format === 'granel' ? (product.price_per_kilo || product.price) : product.price,
                  weightKg: product.weight_kg,
                  imageUrl: product.image_url,
                  quantity: 1,
                  packItems: product.pack_items,
                  availabilityType: product.availability_type,
                  availabilityDays: product.availability_days,
                  availabilityWeekdays: product.availability_weekdays,
                  availableFromDate: product.available_from_date,
                  estimatedDeliveryDate: estimate.estimatedDate.toISOString(),
                  deliveryBadge: estimate.badgeText,
                  deliveryBadgeDetail: estimate.detailText,
                  deliveryMethods: product.delivery_methods,
                  caserioSchedule: product.caserio_schedule,
                  isOrganic: product.is_organic,
                  stock: stockQty,
                  isUnlimitedStock: product.is_unlimited_stock,
                };

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-3xl border-2 border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative"
                  >
                    {/* Botón Favorito arriba a la derecha */}
                    {!isMyProduct && (
                      <div className="absolute top-2.5 right-2.5 z-20">
                        <FavoriteButton
                          id={product.id}
                          type="product"
                          className="bg-white/95 backdrop-blur-sm shadow-sm hover:bg-white p-2 rounded-xl border border-stone-200"
                        />
                      </div>
                    )}

                    {/* Parte Superior: Imagen y Detalles (Si es vendedor -> sin modal de añadir; Si es comprador -> modal rápido) */}
                    <div className="relative">
                      {isSeller ? (
                        <div className="w-full text-left">
                          <div className="aspect-square bg-stone-100 relative overflow-hidden group cursor-default">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 p-4">
                                <Sprout className="w-12 h-12 text-emerald-800 mb-2" />
                                <span className="text-xs font-bold text-stone-500">Caserío km0</span>
                              </div>
                            )}

                            {/* Disponibilidad / Stock */}
                            <div className="absolute top-2.5 left-2.5 z-10">
                              {product.is_unlimited_stock ? (
                                <span className="bg-emerald-900/90 backdrop-blur-sm text-emerald-100 text-[10px] font-black px-2 py-0.5 rounded-lg border border-emerald-700 shadow-sm">
                                  Disponibilidad Continua
                                </span>
                              ) : isOutOfStock ? (
                                <span className="bg-red-700 text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm">
                                  Agotado
                                </span>
                              ) : (
                                <span className="bg-stone-900/90 backdrop-blur-sm text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm">
                                  {stockQty} {product.format === 'granel' ? 'kg' : 'uds'} disponibles
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Título y Precio */}
                          <div className="p-4 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-black text-sm text-stone-900 line-clamp-1">
                                {product.name}
                              </h3>
                              <span className="font-black text-sm text-emerald-950 shrink-0">
                                {product.format === 'granel'
                                  ? `${Number(product.price_per_kilo || product.price).toFixed(2)} €/kg`
                                  : `${Number(product.price).toFixed(2)} €`}
                              </span>
                            </div>

                            {/* Disponibilidad de Stock */}
                            <div className="flex items-center justify-between text-[11px] font-bold text-stone-600 bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200">
                              <span>Disponibilidad:</span>
                              <span className={isOutOfStock ? 'text-red-700 font-black' : 'text-emerald-950 font-black'}>
                                {product.is_unlimited_stock
                                  ? 'Ilimitada'
                                  : isOutOfStock
                                  ? 'Agotado'
                                  : `${stockQty} ${product.format === 'granel' ? 'kg' : 'uds'} disponibles`}
                              </span>
                            </div>

                            {/* Plazo de Entrega en 2 filas */}
                            <div className="p-2 bg-emerald-50/90 rounded-xl border border-emerald-200 text-[11px] font-bold text-emerald-950 space-y-0.5">
                              <div className="flex items-center gap-1 text-emerald-800 text-[10px] uppercase font-black">
                                <Clock className="w-3 h-3 shrink-0" />
                                <span>Entrega prevista:</span>
                              </div>
                              <p className="text-stone-800 font-semibold leading-tight">
                                {estimate.detailText}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <QuickAddToCartModal
                          item={itemPayload}
                          isCardOverlay={true}
                          className="w-full text-left"
                        >
                          <div className="aspect-square bg-stone-100 relative overflow-hidden group cursor-pointer">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 p-4">
                                <Sprout className="w-12 h-12 text-emerald-800 mb-2" />
                                <span className="text-xs font-bold text-stone-500">Caserío km0</span>
                              </div>
                            )}

                            {/* Disponibilidad / Stock */}
                            <div className="absolute top-2.5 left-2.5 z-10">
                              {product.is_unlimited_stock ? (
                                <span className="bg-emerald-900/90 backdrop-blur-sm text-emerald-100 text-[10px] font-black px-2 py-0.5 rounded-lg border border-emerald-700 shadow-sm">
                                  Disponibilidad Continua
                                </span>
                              ) : isOutOfStock ? (
                                <span className="bg-red-700 text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm">
                                  Agotado
                                </span>
                              ) : (
                                <span className="bg-stone-900/90 backdrop-blur-sm text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm">
                                  {stockQty} {product.format === 'granel' ? 'kg' : 'uds'} disponibles
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Título y Precio */}
                          <div className="p-4 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-black text-sm text-stone-900 group-hover:text-emerald-800 transition-colors line-clamp-1">
                                {product.name}
                              </h3>
                              <span className="font-black text-sm text-emerald-950 shrink-0">
                                {product.format === 'granel'
                                  ? `${Number(product.price_per_kilo || product.price).toFixed(2)} €/kg`
                                  : `${Number(product.price).toFixed(2)} €`}
                              </span>
                            </div>

                            {/* Disponibilidad de Stock */}
                            <div className="flex items-center justify-between text-[11px] font-bold text-stone-600 bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200">
                              <span>Disponibilidad:</span>
                              <span className={isOutOfStock ? 'text-red-700 font-black' : 'text-emerald-950 font-black'}>
                                {product.is_unlimited_stock
                                  ? 'Ilimitada'
                                  : isOutOfStock
                                  ? 'Agotado'
                                  : `${stockQty} ${product.format === 'granel' ? 'kg' : 'uds'} disponibles`}
                              </span>
                            </div>

                            {/* Plazo de Entrega en 2 filas */}
                            <div className="p-2 bg-emerald-50/90 rounded-xl border border-emerald-200 text-[11px] font-bold text-emerald-950 space-y-0.5">
                              <div className="flex items-center gap-1 text-emerald-800 text-[10px] uppercase font-black">
                                <Clock className="w-3 h-3 shrink-0" />
                                <span>Entrega prevista:</span>
                              </div>
                              <p className="text-stone-800 font-semibold leading-tight">
                                {estimate.detailText}
                              </p>
                            </div>
                          </div>
                        </QuickAddToCartModal>
                      )}
                    </div>

                    {/* Parte Inferior: Caserío, Acciones y Añadir / Editar */}
                    <div className="px-4 pb-4 pt-0 space-y-3">
                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSellerId(product.seller_id);
                            setActiveTab('todos_productos');
                          }}
                          className="text-left flex-1 group flex items-center gap-2 min-w-0"
                          title={`Ver todos los productos de ${product.profiles?.full_name}`}
                        >
                          {product.profiles?.avatar_url ? (
                            <img
                              src={product.profiles.avatar_url}
                              alt={product.profiles.full_name || 'Vendedor'}
                              className="w-8 h-8 rounded-full object-cover border border-stone-200 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center border border-emerald-300 shrink-0">
                              {product.profiles?.full_name?.charAt(0) || 'C'}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-black text-stone-800 group-hover:text-emerald-800 block truncate">
                              {product.profiles?.full_name}
                            </span>
                            <span className="text-[11px] font-semibold text-stone-500 block truncate">
                              {product.profiles?.town}
                            </span>
                          </div>
                        </button>

                        <div className="flex items-center gap-1 shrink-0">
                          {isMyProduct ? (
                            <>
                              <Link
                                href={`/vendedor/productos/${product.id}/editar`}
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg transition-colors border border-emerald-200"
                                title="Editar este producto"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(product.id, product.name)}
                                disabled={deletingId === product.id}
                                className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors border border-red-200"
                                title="Borrar este producto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <Link
                              href={`/chat/${product.seller_id}`}
                              className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg transition-colors border border-stone-200"
                              title="Chatear con el caserío"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-800" />
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Botón de acción: Si es mi producto -> Editar y Borrar; Si es otro vendedor -> Contactar; Si es comprador -> Añadir */}
                      {isMyProduct ? (
                        <div className="flex items-center gap-2 w-full">
                          <Link
                            href={`/vendedor/productos/${product.id}/editar`}
                            className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-900 text-xs font-black rounded-xl transition-all border border-stone-300 flex items-center justify-center gap-1.5"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-stone-700" />
                            <span>Editar</span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(product.id, product.name)}
                            disabled={deletingId === product.id}
                            className="py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 text-xs font-black rounded-xl transition-all border border-red-200 flex items-center justify-center gap-1.5"
                            title="Borrar este producto"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                            <span>{deletingId === product.id ? 'Borrando...' : 'Borrar'}</span>
                          </button>
                        </div>
                      ) : isSeller ? (
                        <Link
                          href={`/chat/${product.seller_id}`}
                          className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-900 text-xs font-black rounded-xl transition-all border border-stone-300 flex items-center justify-center gap-1.5"
                        >
                          <MessageCircle className="w-4 h-4 text-emerald-800" />
                          <span>Contactar con el Caserío</span>
                        </Link>
                      ) : (
                        <QuickAddToCartModal
                          item={itemPayload}
                          isCardOverlay={false}
                          className="w-full"
                        >
                          <button
                            type="button"
                            disabled={isOutOfStock}
                            className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white text-xs font-black rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                          >
                            {isOutOfStock ? 'Agotado' : 'Añadir a la Cesta'}
                          </button>
                        </QuickAddToCartModal>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border-2 border-stone-200 p-10 text-center space-y-3 shadow-sm">
              <Sparkles className="w-12 h-12 text-stone-400 mx-auto" />
              <h3 className="text-base font-black text-stone-900">
                {activeTab === 'mis_productos'
                  ? 'Aún no has publicado productos'
                  : activeTab === 'favoritos'
                  ? 'No tienes productos guardados en favoritos'
                  : 'No se encontraron productos'}
              </h3>
              <p className="text-xs font-semibold text-stone-500 max-w-sm mx-auto">
                {activeTab === 'mis_productos'
                  ? 'Comienza a vender tus cosechas y productos de proximidad en el mercado de km0.'
                  : activeTab === 'favoritos'
                  ? 'Guarda productos con el corazón para tenerlos siempre a mano.'
                  : 'Prueba a seleccionar otra categoría o limpiar la búsqueda.'}
              </p>

              {activeTab === 'mis_productos' && (
                <div className="pt-2">
                  <Link
                    href="/vendedor/productos/nuevo"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-black rounded-xl shadow-md transition-all"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Publicar mi Primer Producto</span>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Botón inferior idéntico para Publicar Producto (siempre debajo del último producto y vendedor) */}
      {isSeller && (
        <div className="pt-6 pb-2 flex justify-center w-full border-t border-stone-200">
          <Link
            href="/vendedor/productos/nuevo"
            className="w-full sm:w-auto px-8 py-3.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 border border-emerald-950 hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusCircle className="w-5 h-5 text-emerald-300 shrink-0" />
            <div className="flex flex-col items-center sm:items-start leading-tight">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-200">
                PUBLICAR
              </span>
              <span className="text-xs sm:text-sm font-black uppercase tracking-wide text-white">
                PRODUCTO
              </span>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}

export default CatalogViewContainer;
