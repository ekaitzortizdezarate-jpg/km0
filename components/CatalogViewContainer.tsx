'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import {
  Sprout,
  Store,
  Heart,
  Search,
  Filter,
  Clock,
  Phone,
  MessageCircle,
  Truck,
  Package,
  Scale,
  Sparkles,
  ChevronRight,
  X,
  PlusCircle,
  Edit,
} from 'lucide-react';
import type { ProductWithSeller, Profile, ProductCategory } from '@/types/database';
import { QuickAddToCartModal } from '@/components/QuickAddToCartModal';
import { FavoriteButton } from '@/components/FavoriteButton';
import { DeleteProductButton } from '@/components/DeleteProductButton';
import { getDeliveryEstimate, formatTimeAgo } from '@/lib/delivery';

interface SellerWithProducts {
  profile: Profile;
  products: ProductWithSeller[];
  deliveryPointsCount: number;
}

interface CatalogViewContainerProps {
  products: ProductWithSeller[];
  sellers: Profile[];
  userProfile: Profile | null;
  selectedCategory?: string;
  selectedTown?: string;
}

const CATEGORIES: { id: ProductCategory; name: string; icon: string }[] = [
  { id: 'verduras_hortalizas', name: 'Verduras y Hortalizas', icon: '🥬' },
  { id: 'frutas', name: 'Frutas', icon: '🍎' },
  { id: 'quesos_lacteos', name: 'Quesos y Lácteos', icon: '🧀' },
  { id: 'bebidas', name: 'Bebidas (Sidra, Txakoli...)', icon: '🍷' },
  { id: 'otros_alimentos', name: 'Otros Alimentos (Huevos, Miel...)', icon: '🍯' },
  { id: 'plantas_flores', name: 'Plantas y Flores', icon: '🌸' },
  { id: 'articulos_diversos', name: 'Artículos Diversos', icon: '📦' },
  { id: 'artesania', name: 'Artesanía de Caserío', icon: '🪵' },
];

function subscribeFavorites(callback: () => void) {
  window.addEventListener('km0_favorites_updated', callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener('km0_favorites_updated', callback);
    window.removeEventListener('storage', callback);
  };
}

function getFavList(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key) || '[]';
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

export function CatalogViewContainer({
  products,
  sellers,
  userProfile,
  selectedCategory,
  selectedTown,
}: CatalogViewContainerProps) {
  const [mainTab, setMainTab] = useState<'todos' | 'favoritos'>('todos');
  const [viewMode, setViewMode] = useState<'productos' | 'vendedores'>('productos');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(selectedCategory || null);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);

  const favProducts = useSyncExternalStore(
    subscribeFavorites,
    () => getFavList('km0_fav_products'),
    () => new Set<string>()
  );

  const favSellers = useSyncExternalStore(
    subscribeFavorites,
    () => getFavList('km0_fav_sellers'),
    () => new Set<string>()
  );

  const isSeller = userProfile?.role === 'vendedor';

  // Agrupar productos por vendedor
  const sellersMap: Record<string, SellerWithProducts> = {};
  sellers.forEach((s) => {
    sellersMap[s.id] = {
      profile: s,
      products: [],
      deliveryPointsCount: 0,
    };
  });

  products.forEach((p) => {
    if (sellersMap[p.seller_id]) {
      sellersMap[p.seller_id].products.push(p);
    } else if (p.profiles) {
      sellersMap[p.seller_id] = {
        profile: p.profiles as unknown as Profile,
        products: [p],
        deliveryPointsCount: 0,
      };
    }
  });

  const allSellersList = Object.values(sellersMap);

  // Filtrado de productos
  const filteredProducts = products.filter((product) => {
    // Pestaña Favoritos
    if (mainTab === 'favoritos' && !favProducts.has(product.id)) {
      return false;
    }

    // Filtro por vendedor seleccionado
    if (selectedSellerId && product.seller_id !== selectedSellerId) {
      return false;
    }

    // Filtro por categoría
    if (activeCategory && product.category !== activeCategory) {
      return false;
    }

    // Filtro por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = product.name.toLowerCase().includes(term);
      const matchTown = product.profiles?.town?.toLowerCase().includes(term);
      const matchSeller = product.profiles?.full_name?.toLowerCase().includes(term);
      if (!matchName && !matchTown && !matchSeller) return false;
    }

    return true;
  });

  // Filtrado de vendedores
  const filteredSellers = allSellersList.filter((item) => {
    if (mainTab === 'favoritos' && !favSellers.has(item.profile.id)) {
      return false;
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = item.profile.full_name?.toLowerCase().includes(term);
      const matchTown = item.profile.town?.toLowerCase().includes(term);
      const matchProducts = item.products.some((p) => p.name.toLowerCase().includes(term));
      if (!matchName && !matchTown && !matchProducts) return false;
    }

    return true;
  });

  const activeSellerObj = selectedSellerId ? sellersMap[selectedSellerId]?.profile : null;

  return (
    <div className="space-y-6">
      {/* 1. Nivel Superior: Pestañas Principales (Todo el Catálogo vs Favoritos) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b-2 border-stone-200 pb-4">
        {/* Pestañas Principales */}
        <div className="flex items-center gap-2 bg-stone-200/80 p-1.5 rounded-2xl w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setMainTab('todos');
              setSelectedSellerId(null);
            }}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 ${
              mainTab === 'todos'
                ? 'bg-emerald-800 text-white shadow-md'
                : 'text-stone-700 hover:text-stone-900 font-bold'
            }`}
          >
            <Sprout className="w-4 h-4" />
            <span>Todo el Catálogo</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMainTab('favoritos');
              setSelectedSellerId(null);
            }}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 ${
              mainTab === 'favoritos'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-stone-700 hover:text-stone-900 font-bold'
            }`}
          >
            <Heart className={`w-4 h-4 ${mainTab === 'favoritos' ? 'fill-white' : 'text-rose-500'}`} />
            <span>Mis Favoritos</span>
            {(favProducts.size > 0 || favSellers.size > 0) && (
              <span className="bg-white text-rose-600 text-[10px] font-black px-1.5 py-0.5 rounded-full ml-0.5">
                {favProducts.size + favSellers.size}
              </span>
            )}
          </button>
        </div>

        {/* Sub-selector de Vista: Productos vs Vendedores */}
        <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-300 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setViewMode('productos')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              viewMode === 'productos'
                ? 'bg-white text-emerald-950 shadow-sm border border-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <span>🥦 Productos</span>
            <span className="text-[10px] opacity-75">
              ({mainTab === 'favoritos' ? favProducts.size : products.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setViewMode('vendedores');
              setSelectedSellerId(null);
            }}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              viewMode === 'vendedores'
                ? 'bg-white text-emerald-950 shadow-sm border border-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <span>🏡 Caseríos y Vendedores</span>
            <span className="text-[10px] opacity-75">
              ({mainTab === 'favoritos' ? favSellers.size : allSellersList.length})
            </span>
          </button>
        </div>
      </div>

      {/* 2. Barra de Búsqueda y Filtros */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              viewMode === 'productos'
                ? 'Buscar por nombre de producto, caserío o pueblo (ej. tomate, Gernika...)'
                : 'Buscar por caserío, productor o pueblo...'
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

        {isSeller && (
          <Link
            href="/vendedor/productos/nuevo"
            className="w-full sm:w-auto px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs rounded-2xl shadow-sm transition-all flex items-center justify-center gap-1.5 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Publicar Cosecha</span>
          </Link>
        )}
      </div>

      {/* Banner de Filtro de Vendedor Activo */}
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

      {/* 3. Selector de Categorías (solo en vista productos) */}
      {viewMode === 'productos' && (
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

      {/* 4. CONTENIDO SEGÚN MODO DE VISTA */}

      {/* VISTA A: VENDEDORES / CASERÍOS */}
      {viewMode === 'vendedores' && (
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
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-900 font-black text-lg flex items-center justify-center border border-emerald-300 shrink-0">
                          {profile.full_name?.charAt(0) || 'C'}
                        </div>
                        <div>
                          <h3 className="text-base font-black text-stone-900 leading-tight">
                            {profile.full_name}
                          </h3>
                          <p className="text-xs font-bold text-stone-500 flex items-center gap-1 mt-0.5">
                            <Store className="w-3.5 h-3.5 text-emerald-700" />
                            <span>{profile.town || 'Euskadi'}</span>
                          </p>
                        </div>
                      </div>

                      <FavoriteButton id={profile.id} type="seller" />
                    </div>

                    {profile.bio && (
                      <p className="text-xs font-medium text-stone-600 line-clamp-2">
                        {profile.bio}
                      </p>
                    )}

                    {/* Resumen de Productos disponibles */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-black uppercase text-stone-400 block tracking-wider">
                        Productos de temporada ({sellerProds.length}):
                      </span>

                      {sellerProds.length > 0 ? (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {sellerProds.map((prod) => (
                            <div
                              key={prod.id}
                              className="flex items-center justify-between text-xs bg-stone-50 p-2 rounded-xl border border-stone-200 font-semibold"
                            >
                              <span className="font-bold text-stone-900 truncate max-w-[150px]">
                                {prod.name}
                              </span>
                              <span className="font-black text-emerald-900 shrink-0">
                                {prod.format === 'granel'
                                  ? `${Number(prod.price_per_kilo || prod.price).toFixed(2)} €/kg`
                                  : `${Number(prod.price).toFixed(2)} €`}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-stone-400 font-semibold italic bg-stone-50 p-2.5 rounded-xl text-center">
                          Actualmente sin cosechas publicadas.
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
                        setViewMode('productos');
                      }}
                      className="flex-1 py-2.5 px-3 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-black rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <span>Ver Productos ({sellerProds.length})</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <Link
                      href={`/chat/${profile.id}`}
                      className="p-2.5 bg-white hover:bg-stone-100 text-stone-800 rounded-xl border border-stone-300 transition-colors"
                      title="Chatear con el caserío"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-800" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border-2 border-stone-200 p-10 text-center space-y-3 shadow-sm">
              <Store className="w-12 h-12 text-stone-400 mx-auto" />
              <h3 className="text-base font-black text-stone-900">
                {mainTab === 'favoritos'
                  ? 'No tienes caseríos guardados en favoritos'
                  : 'No se encontraron caseríos'}
              </h3>
              <p className="text-xs font-semibold text-stone-500 max-w-sm mx-auto">
                {mainTab === 'favoritos'
                  ? 'Guarda caseríos como favoritos pulsando la estrella para verlos aquí.'
                  : 'Prueba a cambiar los términos de búsqueda.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* VISTA B: PRODUCTOS DE LA HUERTA */}
      {viewMode === 'productos' && (
        <div className="space-y-4">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => {
                const isOutOfStock = !product.is_unlimited_stock && (Number(product.stock) || 0) <= 0;
                const stockQty = Number(product.stock) || 0;
                const estimate = getDeliveryEstimate(
                  product.availability_type,
                  product.availability_days,
                  product.availability_weekdays,
                  product.available_from_date
                );

                const itemPayload = {
                  productId: product.id,
                  sellerId: product.seller_id,
                  name: product.name,
                  category: product.category,
                  quantity: 1,
                  price: Number(product.price) || 0,
                  unitPrice:
                    product.format === 'granel'
                      ? Number(product.price_per_kilo || product.price) || 0
                      : Number(product.price) || 0,
                  format: product.format,
                  weightKg: product.weight_kg,
                  pricePerKilo: product.price_per_kilo,
                  imageUrl: product.image_url,
                  sellerName: product.profiles?.full_name || 'Caserío',
                  sellerTown: product.profiles?.town || 'Euskadi',
                  deliveryBadge: estimate.badgeText,
                  deliveryBadgeDetail: estimate.detailText,
                  estimatedDeliveryDate: estimate.estimatedDate.toISOString(),
                  deliveryMethods: product.delivery_methods,
                  isOrganic: product.is_organic,
                  stock: stockQty,
                  isUnlimitedStock: product.is_unlimited_stock,
                };

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-3xl border-2 border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    {/* Parte Superior: Imagen y Modal de Compra */}
                    <div className="relative">
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
                    </div>

                    {/* Parte Inferior Independiente: Caserío, Chat y Añadir */}
                    <div className="px-4 pb-4 pt-0 space-y-3">
                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSellerId(product.seller_id);
                          }}
                          className="text-left flex-1 group"
                          title={`Ver todos los productos de ${product.profiles?.full_name}`}
                        >
                          <span className="text-xs font-black text-stone-800 group-hover:text-emerald-800 block truncate">
                            {product.profiles?.full_name}
                          </span>
                          <span className="text-[11px] font-semibold text-stone-500 block truncate">
                            {product.profiles?.town}
                          </span>
                        </button>

                        <div className="flex items-center gap-1 shrink-0">
                          <Link
                            href={`/chat/${product.seller_id}`}
                            className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg transition-colors border border-stone-200"
                            title="Chatear con el caserío"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-800" />
                          </Link>

                          <FavoriteButton id={product.id} type="product" />
                        </div>
                      </div>

                      {/* Botón Añadir explícito */}
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
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border-2 border-stone-200 p-10 text-center space-y-3 shadow-sm">
              <Sparkles className="w-12 h-12 text-stone-400 mx-auto" />
              <h3 className="text-base font-black text-stone-900">
                {mainTab === 'favoritos'
                  ? 'No tienes productos guardados en favoritos'
                  : 'No se encontraron productos'}
              </h3>
              <p className="text-xs font-semibold text-stone-500 max-w-sm mx-auto">
                {mainTab === 'favoritos'
                  ? 'Guarda productos con el corazón para tenerlos siempre a mano.'
                  : 'Prueba a seleccionar otra categoría o limpiar la búsqueda.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CatalogViewContainer;
