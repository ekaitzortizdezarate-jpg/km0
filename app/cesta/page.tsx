'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBasket,
  Trash2,
  Plus,
  Minus,
  MessageCircle,
  Truck,
  Store,
  MapPin,
  Clock,
  CheckCircle2,
  LogIn,
  UserPlus,
  Layers,
  Bookmark,
  X,
} from 'lucide-react';
import { useCart, CartItem } from '@/context/CartContext';
import { createCartOrders, CartCheckoutSellerGroup } from '@/app/actions/orders';
import { createClient } from '@/lib/supabase/client';
import { saveBuyerAddresses } from '@/app/actions/profile';
import type { DeliveryPoint } from '@/types/database';

interface SavedAddress {
  id: string;
  label: string;
  address: string;
  town?: string;
}

interface SellerDeliveryConfig {
  deliveryType: 'caserio' | 'sitio_fisico' | 'envio';
  deliveryPointId: string | null;
  shippingAddress: string;
  groupMode: 'junto_tardio' | 'individual';
}

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeFromCart, clearCart, totalPrice } = useCart();
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Puntos de entrega por caserío
  const [sellerDeliveryPoints, setSellerDeliveryPoints] = useState<
    Record<string, DeliveryPoint[]>
  >({});

  // Configuración de entrega elegida para cada caserío
  const [deliveryConfigs, setDeliveryConfigs] = useState<
    Record<string, SellerDeliveryConfig>
  >({});

  // Direcciones guardadas del comprador (hasta 3)
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [newAddressLabel, setNewAddressLabel] = useState('Casa');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const supabase = createClient();

  // 1. Cargar usuario y direcciones guardadas
  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);
      setAuthLoading(false);

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('address, town, saved_addresses')
          .eq('id', user.id)
          .single();

        if (profile) {
          let list: SavedAddress[] = [];
          if (Array.isArray(profile.saved_addresses) && profile.saved_addresses.length > 0) {
            list = profile.saved_addresses;
          } else if (profile.address) {
            list = [
              {
                id: 'default',
                label: 'Principal',
                address: profile.address,
                town: profile.town || '',
              },
            ];
          }
          setSavedAddresses(list.slice(0, 3));
        }
      }
    }
    loadUser();
  }, [supabase]);

  // 2. Agrupar productos por Caserío / Vendedor
  const groupedBySeller = items.reduce(
    (acc, item) => {
      if (!acc[item.sellerId]) {
        acc[item.sellerId] = {
          sellerName: item.sellerName,
          sellerTown: item.sellerTown,
          sellerAvatarUrl: item.sellerAvatarUrl || null,
          items: [],
        };
      }
      acc[item.sellerId].items.push(item);
      return acc;
    },
    {} as Record<
      string,
      { sellerName: string; sellerTown: string; sellerAvatarUrl?: string | null; items: CartItem[] }
    >
  );

  const sellerIds = Object.keys(groupedBySeller);

  // 3. Cargar puntos de entrega físicos para cada vendedor
  useEffect(() => {
    async function fetchPoints() {
      if (sellerIds.length === 0) return;

      const { data } = await supabase
        .from('delivery_points')
        .select('*')
        .in('seller_id', sellerIds)
        .eq('is_active', true);

      if (data) {
        const map: Record<string, DeliveryPoint[]> = {};
        for (const pt of data) {
          if (!map[pt.seller_id]) map[pt.seller_id] = [];
          map[pt.seller_id].push(pt);
        }
        setSellerDeliveryPoints(map);

        // Inicializar configuraciones por defecto
        setDeliveryConfigs((prev) => {
          const next = { ...prev };
          for (const sId of sellerIds) {
            if (!next[sId]) {
              const defaultAddr = savedAddresses[0]?.address || '';
              const firstPoint = map[sId]?.[0]?.id || null;
              next[sId] = {
                deliveryType: 'caserio',
                deliveryPointId: firstPoint,
                shippingAddress: defaultAddr,
                groupMode: 'junto_tardio',
              };
            }
          }
          return next;
        });
      }
    }

    fetchPoints();
  }, [sellerIds.join(','), savedAddresses.length, supabase]);

  const handleDeliveryTypeChange = (
    sellerId: string,
    type: 'caserio' | 'sitio_fisico' | 'envio'
  ) => {
    setDeliveryConfigs((prev) => ({
      ...prev,
      [sellerId]: {
        ...prev[sellerId],
        deliveryType: type,
        deliveryPointId: prev[sellerId]?.deliveryPointId || sellerDeliveryPoints[sellerId]?.[0]?.id || null,
        shippingAddress: prev[sellerId]?.shippingAddress || savedAddresses[0]?.address || '',
        groupMode: prev[sellerId]?.groupMode || 'junto_tardio',
      },
    }));
  };

  const handleDeliveryPointChange = (sellerId: string, pointId: string) => {
    setDeliveryConfigs((prev) => ({
      ...prev,
      [sellerId]: {
        ...prev[sellerId],
        deliveryPointId: pointId,
      },
    }));
  };

  const handleAddressChange = (sellerId: string, address: string) => {
    setDeliveryConfigs((prev) => ({
      ...prev,
      [sellerId]: {
        ...prev[sellerId],
        shippingAddress: address,
      },
    }));
  };

  const handleGroupModeChange = (sellerId: string, mode: 'junto_tardio' | 'individual') => {
    setDeliveryConfigs((prev) => ({
      ...prev,
      [sellerId]: {
        ...prev[sellerId],
        groupMode: mode,
      },
    }));
  };

  const handleSaveCurrentAddress = async (sellerId: string) => {
    const addr = deliveryConfigs[sellerId]?.shippingAddress;
    if (!addr || !addr.trim()) return;

    const newObj: SavedAddress = {
      id: String(Date.now()),
      label: newAddressLabel,
      address: addr.trim(),
      town: '',
    };

    const updated = [...savedAddresses.filter((a) => a.address !== addr.trim()), newObj].slice(0, 3);
    setSavedAddresses(updated);
    await saveBuyerAddresses(updated);
  };

  const handleOpenSummary = () => {
    setError(null);
    for (const sellerId of sellerIds) {
      const group = groupedBySeller[sellerId];
      const config = deliveryConfigs[sellerId];

      if (config?.deliveryType === 'envio' && !config.shippingAddress.trim()) {
        setError(`Por favor, introduce la dirección de envío para el caserío ${group.sellerName}.`);
        return;
      }
    }
    setShowSummaryModal(true);
  };

  const handleConfirmAndCheckout = async () => {
    setError(null);
    setLoading(true);

    const payload: CartCheckoutSellerGroup[] = [];

    for (const sellerId of sellerIds) {
      const group = groupedBySeller[sellerId];
      const config = deliveryConfigs[sellerId];

      let finalEstimatedDate: string | null = null;
      if (group.items.length > 0) {
        const dates = group.items
          .map((i) => (i.estimatedDeliveryDate ? new Date(i.estimatedDeliveryDate).getTime() : 0))
          .filter((t) => t > 0);

        if (dates.length > 0) {
          const maxTime = Math.max(...dates);
          finalEstimatedDate = new Date(maxTime).toISOString();
        }
      }

      payload.push({
        sellerId,
        deliveryType: config?.deliveryType || 'caserio',
        deliveryPointId: config?.deliveryType === 'sitio_fisico' ? config.deliveryPointId : null,
        shippingAddress: config?.deliveryType === 'envio' ? config.shippingAddress : null,
        estimatedDeliveryDate: finalEstimatedDate,
        items: group.items.map((it) => ({
          productId: it.productId,
          quantity: Number(it.quantity) || 1,
          unitPrice: it.unitPrice,
        })),
      });
    }

    const result = await createCartOrders(payload);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      setShowSummaryModal(false);
    } else {
      clearCart();
      setShowSummaryModal(false);
      setLoading(false);
      router.push('/comprador/pedidos');
    }
  };

  if (!authLoading && !currentUser) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
          <ShoppingBasket className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900">
            Inicia sesión para ver tu cesta o regístrate
          </h1>
          <p className="text-sm font-semibold text-stone-600 max-w-md mx-auto mt-2">
            Para realizar tus pedidos directos a los caseríos y coordinar la entrega con los baserritarras necesitas una cuenta en km0.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-stone-900 hover:bg-black text-white font-extrabold text-xs px-6 py-3.5 rounded-xl transition-all shadow-sm"
          >
            <LogIn className="w-4 h-4" /> Iniciar Sesión
          </Link>
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs px-6 py-3.5 rounded-xl transition-all shadow-md"
          >
            <UserPlus className="w-4 h-4" /> Registrarse Gratis
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-5">
        <div className="w-16 h-16 bg-stone-100 text-stone-400 rounded-3xl flex items-center justify-center mx-auto">
          <ShoppingBasket className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-stone-900">Tu Cesta está vacía</h1>
          <p className="text-sm font-semibold text-stone-500 mt-1">
            Explora el mercado de caseríos locales y añade productos frescos a tu cesta.
          </p>
        </div>
        <Link
          href="/"
          className="inline-block bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs px-6 py-3 rounded-xl transition-all shadow-md"
        >
          Explorar Mercado
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-stone-900">Cesta de Compra</h1>
        <p className="text-xs font-semibold text-stone-500 mt-1">
          Tus productos se gestionan agrupados por caserío productor para coordinar la entrega directa.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-900 border-2 border-red-200 rounded-2xl text-xs font-bold">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Columna Izquierda: Pedidos agrupados por Caserío */}
        <div className="lg:col-span-8 space-y-6">
          {sellerIds.map((sellerId) => {
            const group = groupedBySeller[sellerId];
            const config = deliveryConfigs[sellerId] || {
              deliveryType: 'caserio',
              deliveryPointId: null,
              shippingAddress: savedAddresses[0]?.address || '',
              groupMode: 'junto_tardio',
            };
            const points = sellerDeliveryPoints[sellerId] || [];

            // Calcular fecha unificada más tardía para este caserío
            const datesMs = group.items
              .map((i) => (i.estimatedDeliveryDate ? new Date(i.estimatedDeliveryDate).getTime() : 0))
              .filter((t) => t > 0);
            const maxDateMs = datesMs.length > 0 ? Math.max(...datesMs) : 0;
            const unifiedDateObj = maxDateMs > 0 ? new Date(maxDateMs) : null;

            const datesSet = new Set(
              group.items.map((i) => i.estimatedDeliveryDate || i.deliveryBadge).filter(Boolean)
            );
            const hasMultipleDates = datesSet.size > 1;

            return (
              <div
                key={sellerId}
                className="bg-white rounded-3xl border-2 border-stone-200 p-5 sm:p-6 space-y-5 shadow-sm"
              >
                {/* Cabecera del Caserío */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-3">
                    {group.sellerAvatarUrl ? (
                      <img
                        src={group.sellerAvatarUrl}
                        alt={group.sellerName}
                        className="w-10 h-10 rounded-2xl object-cover border border-stone-200 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-black text-sm border border-emerald-200 shrink-0">
                        {group.sellerName?.charAt(0) || 'C'}
                      </div>
                    )}
                    <div>
                      <h2 className="text-base font-black text-stone-900">{group.sellerName}</h2>
                      <span className="text-[11px] font-bold text-emerald-800">
                        📍 {group.sellerTown}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/chat/${sellerId}`}
                    className="inline-flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold text-xs px-3 py-1.5 rounded-xl border border-stone-200 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Preguntar al Caserío
                  </Link>
                </div>

                {/* Lista de Productos de este Caserío */}
                <div className="space-y-3">
                  {group.items.map((item) => {
                    const itemKey =
                      item.cartItemId ||
                      `${item.productId}_${item.selectedDeliveryType || 'caserio'}_${item.selectedPointId || 'none'}`;

                    // Si se eligió entregar todo junto, se muestra la fecha unificada calculada
                    const displayDeliveryDate =
                      config.groupMode === 'junto_tardio' && unifiedDateObj
                        ? unifiedDateObj.toISOString()
                        : item.estimatedDeliveryDate;

                    return (
                      <div
                        key={itemKey}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-stone-50 rounded-2xl border border-stone-200"
                      >
                        <div className="flex items-center gap-3">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-14 h-14 rounded-xl object-cover border border-stone-200 shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-white text-emerald-800 flex items-center justify-center border border-stone-200 shrink-0 font-black text-xs">
                              km0
                            </div>
                          )}

                          <div>
                            <h3 className="text-xs font-black text-stone-900">{item.name}</h3>
                            <p className="text-[11px] font-semibold text-stone-600">
                              {item.unitPrice.toFixed(2)} € /{' '}
                              {item.format === 'granel'
                                ? 'kg'
                                : item.format === 'suelto' && item.weightKg
                                ? `${item.weightKg}kg`
                                : 'ud'}
                            </p>

                            {/* Modalidad de Entrega del producto */}
                            <div className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border mt-1 bg-white text-stone-800 border-stone-300">
                              {item.selectedDeliveryType === 'caserio' ? (
                                <>
                                  <Store className="w-3 h-3 text-emerald-700 shrink-0" />
                                  <span>Recogida en Caserío</span>
                                </>
                              ) : item.selectedDeliveryType === 'punto_entrega' ? (
                                <>
                                  <MapPin className="w-3 h-3 text-emerald-700 shrink-0" />
                                  <span>Punto de Entrega: {item.selectedPointName || 'Punto acordado'}</span>
                                </>
                              ) : (
                                <>
                                  <Truck className="w-3 h-3 text-emerald-700 shrink-0" />
                                  <span>Envío</span>
                                </>
                              )}
                            </div>

                            {/* Fecha de Entrega */}
                            {displayDeliveryDate ? (
                              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-md mt-1 border border-emerald-300">
                                <Clock className="w-3 h-3 text-emerald-700 shrink-0" />
                                <span>
                                  Fecha estimada de entrega:{' '}
                                  {new Date(displayDeliveryDate).toLocaleDateString('es-ES', {
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'short',
                                  })}
                                  {config.groupMode === 'junto_tardio' && hasMultipleDates ? ' (unificada)' : ''}
                                </span>
                              </div>
                            ) : item.deliveryBadge ? (
                              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-md mt-1 border border-emerald-300">
                                <Clock className="w-3 h-3 text-emerald-700 shrink-0" />
                                <span>Fecha estimada de entrega: {item.deliveryBadge}</span>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        {/* Controles de Cantidad y Subtotal */}
                        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-200">
                          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-stone-300">
                            <button
                              type="button"
                              onClick={() => {
                                const step = item.format === 'granel' ? 0.5 : 1;
                                const nextQty = Math.max(step, item.quantity - step);
                                updateQuantity(itemKey, nextQty);
                              }}
                              className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-900 flex items-center justify-center font-black"
                              aria-label="Disminuir"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>

                            <span className="text-xs font-black text-stone-900 px-2 min-w-[36px] text-center">
                              {item.quantity}{' '}
                              <span className="text-[10px] font-semibold text-stone-600">
                                {item.format === 'granel' ? 'kg' : 'uds'}
                              </span>
                            </span>

                            <button
                              type="button"
                              disabled={!item.isUnlimitedStock && item.stock !== undefined && item.quantity >= item.stock}
                              onClick={() => {
                                const step = item.format === 'granel' ? 0.5 : 1;
                                const maxStock = item.isUnlimitedStock ? 9999 : item.stock ?? 9999;
                                if (item.quantity < maxStock) {
                                  updateQuantity(itemKey, item.quantity + step);
                                }
                              }}
                              className="w-7 h-7 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white flex items-center justify-center font-black"
                              aria-label="Aumentar"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="text-right min-w-[70px]">
                            <span className="text-sm font-black text-stone-900 block">
                              {(item.unitPrice * item.quantity).toFixed(2)} €
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFromCart(itemKey)}
                            className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            title="Quitar producto de la cesta"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Agrupación de fechas si son distintas */}
                {hasMultipleDates && (
                  <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
                    <label className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-amber-700" />
                      Tus productos de este caserío tienen plazos de entrega distintos:
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleGroupModeChange(sellerId, 'junto_tardio')}
                        className={`p-2.5 rounded-xl border-2 text-left text-xs font-bold transition-all ${
                          config.groupMode === 'junto_tardio'
                            ? 'border-amber-700 bg-white ring-2 ring-amber-600 text-amber-950 font-black shadow-sm'
                            : 'border-amber-200 bg-white/60 text-amber-800 hover:bg-white'
                        }`}
                      >
                        <span className="block font-black">📦 Entregar todo junto</span>
                        <span className="text-[10px] font-semibold text-amber-700 block">
                          {unifiedDateObj
                            ? `Fecha calculada: ${unifiedDateObj.toLocaleDateString('es-ES', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                              })}`
                            : 'En la fecha del producto más tardío'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleGroupModeChange(sellerId, 'individual')}
                        className={`p-2.5 rounded-xl border-2 text-left text-xs font-bold transition-all ${
                          config.groupMode === 'individual'
                            ? 'border-amber-700 bg-white ring-2 ring-amber-600 text-amber-950 font-black shadow-sm'
                            : 'border-amber-200 bg-white/60 text-amber-800 hover:bg-white'
                        }`}
                      >
                        <span className="block font-black">🚚 Entregas separadas</span>
                        <span className="text-[10px] font-semibold text-amber-700 block">
                          Según disponibilidad de cada producto
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Selección de Modalidad de Entrega (limitada a lo que los productos de este vendedor permiten) */}
                {(() => {
                  const allowedMethods = new Set<string>();
                  group.items.forEach((it) => {
                    const methods = (it.deliveryMethods && it.deliveryMethods.length > 0)
                      ? it.deliveryMethods
                      : ['caserio'];
                    methods.forEach((m: string) => {
                      if (m === 'caserio') allowedMethods.add('caserio');
                      if (m === 'punto_entrega' || m === 'sitio_fisico') allowedMethods.add('sitio_fisico');
                      if (m === 'domicilio' || m === 'envio') allowedMethods.add('envio');
                    });
                  });
                  if (allowedMethods.size === 0) allowedMethods.add('caserio');

                  const allowsCaserio = allowedMethods.has('caserio');
                  const allowsPunto = allowedMethods.has('sitio_fisico');
                  const allowsEnvio = allowedMethods.has('envio');

                  return (
                    <div className="p-4 bg-stone-100/70 rounded-2xl border border-stone-200 space-y-3">
                      <label className="block text-xs font-black text-stone-900 uppercase tracking-wider">
                        Modalidad de Entrega para este Caserío:
                      </label>

                      <div className={`grid gap-2 ${
                        allowedMethods.size === 1
                          ? 'grid-cols-1'
                          : allowedMethods.size === 2
                          ? 'grid-cols-2'
                          : 'grid-cols-1 sm:grid-cols-3'
                      }`}>
                        {allowsCaserio && (
                          <button
                            type="button"
                            onClick={() => handleDeliveryTypeChange(sellerId, 'caserio')}
                            className={`p-3 rounded-xl border-2 text-left text-xs font-black transition-all flex flex-col justify-between gap-1 ${
                              config.deliveryType === 'caserio'
                                ? 'border-emerald-700 bg-white ring-2 ring-emerald-600 text-emerald-950 shadow-sm'
                                : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              <Store className="w-4 h-4 text-emerald-700" />
                              <span>En Caserío</span>
                            </span>
                            <span className="text-[10px] font-semibold text-stone-500">Recogida directa</span>
                          </button>
                        )}

                        {allowsPunto && (
                          <button
                            type="button"
                            onClick={() => handleDeliveryTypeChange(sellerId, 'sitio_fisico')}
                            className={`p-3 rounded-xl border-2 text-left text-xs font-black transition-all flex flex-col justify-between gap-1 ${
                              config.deliveryType === 'sitio_fisico'
                                ? 'border-emerald-700 bg-white ring-2 ring-emerald-600 text-emerald-950 shadow-sm'
                                : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-4 h-4 text-emerald-700" />
                              <span>Punto Entrega</span>
                            </span>
                            <span className="text-[10px] font-semibold text-stone-500">Mercado / Plaza</span>
                          </button>
                        )}

                        {allowsEnvio && (
                          <button
                            type="button"
                            onClick={() => handleDeliveryTypeChange(sellerId, 'envio')}
                            className={`p-3 rounded-xl border-2 text-left text-xs font-black transition-all flex flex-col justify-between gap-1 ${
                              config.deliveryType === 'envio'
                                ? 'border-emerald-700 bg-white ring-2 ring-emerald-600 text-emerald-950 shadow-sm'
                                : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              <Truck className="w-4 h-4 text-emerald-700" />
                              <span>Envío</span>
                            </span>
                            <span className="text-[10px] font-semibold text-stone-500">A Domicilio</span>
                          </button>
                        )}
                      </div>

                      {config.deliveryType === 'caserio' && (
                        <div className="p-3 bg-white rounded-xl border border-stone-200 text-xs font-semibold text-stone-800 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span>Recogida directa en las instalaciones del caserío ({group.sellerTown}).</span>
                        </div>
                      )}

                  {config.deliveryType === 'sitio_fisico' && (
                    <div>
                      {points.length > 0 ? (
                        <select
                          value={config.deliveryPointId || points[0]?.id}
                          onChange={(e) => handleDeliveryPointChange(sellerId, e.target.value)}
                          className="w-full px-3 py-2 border-2 border-stone-300 rounded-xl text-xs font-bold bg-white text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                        >
                          {points.map((pt) => (
                            <option key={pt.id} value={pt.id}>
                              {pt.name} - {pt.town} ({pt.address_details})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-xs font-semibold text-stone-800 bg-white p-2.5 rounded-xl border border-stone-200">
                          Recogida directa en el caserío ({group.sellerTown}).
                        </p>
                      )}
                    </div>
                  )}

                  {config.deliveryType === 'envio' && (
                    <div className="space-y-2">
                      {/* Selector de hasta 3 direcciones guardadas */}
                      {savedAddresses.length > 0 && (
                        <div className="space-y-1">
                          <label className="text-[11px] font-black text-stone-700 flex items-center gap-1">
                            <Bookmark className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Tus direcciones guardadas (hasta 3):</span>
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {savedAddresses.map((sa) => (
                              <button
                                type="button"
                                key={sa.id}
                                onClick={() => handleAddressChange(sellerId, sa.address)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                  config.shippingAddress === sa.address
                                    ? 'bg-emerald-800 text-white border-emerald-900 shadow-sm'
                                    : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                                }`}
                              >
                                🏠 {sa.label}: {sa.address}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          required
                          value={config.shippingAddress}
                          onChange={(e) => handleAddressChange(sellerId, e.target.value)}
                          placeholder="Introduce tu calle, portal, piso, municipio y CP..."
                          className="w-full px-3 py-2 border-2 border-stone-300 rounded-xl text-xs font-bold bg-white text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                        />

                        {config.shippingAddress.trim() && (
                          <button
                            type="button"
                            onClick={() => handleSaveCurrentAddress(sellerId)}
                            title="Guardar en mis direcciones habituales"
                            className="shrink-0 bg-stone-200 hover:bg-stone-300 text-stone-900 text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                          >
                            Guardar
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        );
      })}
        </div>

        {/* Columna Derecha: Resumen de Totales y Botón Pedir */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border-2 border-stone-200 p-6 space-y-5 sticky top-20 shadow-sm">
            <h2 className="text-lg font-black text-stone-900 border-b border-stone-100 pb-3">
              Resumen Global
            </h2>

            <div className="space-y-2.5 text-xs font-bold text-stone-700">
              <div className="flex justify-between">
                <span>Total Productos:</span>
                <span className="font-black text-stone-900">{items.length} líneas</span>
              </div>
              <div className="flex justify-between">
                <span>Caseríos Productores:</span>
                <span className="font-black text-stone-900">{sellerIds.length}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-stone-900 pt-2 border-t border-stone-200">
                <span>Total Pedido:</span>
                <span className="text-lg font-black text-emerald-950">
                  {totalPrice.toFixed(2)} €
                </span>
              </div>
            </div>

            <p className="text-[11px] text-stone-500 font-medium">
              Al pulsar a continuación, revisarás un resumen con las fechas de entrega calculadas y fotos de cada producto antes de confirmar.
            </p>

            <button
              type="button"
              onClick={handleOpenSummary}
              className="w-full py-3.5 bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar y Enviar Pedidos</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DE RESUMEN FINAL DEL PEDIDO (CON FOTOS Y FECHAS ACTUALIZADAS) */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div
            className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl border-2 border-stone-200 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-100 text-emerald-900 rounded-2xl">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-stone-900">Resumen de tu Pedido</h3>
                  <p className="text-xs font-semibold text-stone-500">
                    Revisa los productos, fotos y plazos antes de enviar el pedido
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSummaryModal(false)}
                className="p-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Desglose por caseríos con fotos y fechas */}
            <div className="space-y-3 text-xs">
              {sellerIds.map((sId) => {
                const group = groupedBySeller[sId];
                const config = deliveryConfigs[sId];
                const points = sellerDeliveryPoints[sId] || [];
                const pointObj = points.find((p) => p.id === config?.deliveryPointId);

                // Calcular fecha unificada para el modal si groupMode === 'junto_tardio'
                const datesMs = group.items
                  .map((i) => (i.estimatedDeliveryDate ? new Date(i.estimatedDeliveryDate).getTime() : 0))
                  .filter((t) => t > 0);
                const maxDateMs = datesMs.length > 0 ? Math.max(...datesMs) : 0;
                const unifiedDateObj = maxDateMs > 0 ? new Date(maxDateMs) : null;

                return (
                  <div key={sId} className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                    <div className="flex justify-between font-black text-stone-900">
                      <span>🏡 {group.sellerName}</span>
                      <span className="text-emerald-800">{group.sellerTown}</span>
                    </div>

                    <div className="pl-2 border-l-2 border-emerald-600 space-y-1">
                      <div className="font-bold text-stone-800">
                        Modalidad:{' '}
                        <span className="font-black text-emerald-900">
                          {config?.deliveryType === 'caserio'
                            ? 'Recogida en Caserío'
                            : config?.deliveryType === 'sitio_fisico'
                            ? `Punto de Entrega (${pointObj?.name || 'Punto acordado'})`
                            : `Envío (${config?.shippingAddress})`}
                        </span>
                      </div>

                      <div className="text-stone-600 font-semibold">
                        Agrupación:{' '}
                        {config?.groupMode === 'junto_tardio'
                          ? 'Entrega agrupada en la fecha más lejana'
                          : 'Entregas individuales según cosecha'}
                      </div>
                    </div>

                    {/* Lista de productos con foto y fecha */}
                    <div className="pt-2 border-t border-stone-200 space-y-2 font-semibold text-stone-700">
                      {group.items.map((it) => {
                        const itKey =
                          it.cartItemId ||
                          `${it.productId}_${it.selectedDeliveryType || 'caserio'}_${it.selectedPointId || 'none'}`;

                        const dateToDisplay =
                          config.groupMode === 'junto_tardio' && unifiedDateObj
                            ? unifiedDateObj.toISOString()
                            : it.estimatedDeliveryDate;

                        return (
                          <div key={itKey} className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-stone-200">
                            <div className="flex items-center gap-2.5">
                              {it.imageUrl ? (
                                <img
                                  src={it.imageUrl}
                                  alt={it.name}
                                  className="w-11 h-11 rounded-lg object-cover border border-stone-200 shrink-0"
                                />
                              ) : (
                                <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-800 font-bold flex items-center justify-center text-[10px] shrink-0 border border-emerald-200">
                                  km0
                                </div>
                              )}

                              <div>
                                <span className="font-black text-stone-900 block leading-tight">
                                  {it.name}
                                </span>
                                <span className="text-[11px] font-bold text-stone-500">
                                  {it.quantity} {it.format === 'granel' ? 'kg' : 'uds'} x {it.unitPrice.toFixed(2)} €
                                </span>

                                {dateToDisplay ? (
                                  <span className="text-[10px] text-emerald-900 font-bold block">
                                    📅 Fecha estimada de entrega:{' '}
                                    {new Date(dateToDisplay).toLocaleDateString('es-ES', {
                                      weekday: 'long',
                                      day: 'numeric',
                                      month: 'long',
                                    })}
                                    {config.groupMode === 'junto_tardio' ? ' (todo junto)' : ''}
                                  </span>
                                ) : it.deliveryBadge ? (
                                  <span className="text-[10px] text-emerald-900 font-bold block">
                                    📅 Fecha estimada de entrega: {it.deliveryBadge}
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            <span className="font-black text-stone-900 text-xs shrink-0">
                              {(it.unitPrice * it.quantity).toFixed(2)} €
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total final */}
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-800 block uppercase">
                  Total a confirmar
                </span>
                <span className="text-2xl font-black text-emerald-950">{totalPrice.toFixed(2)} €</span>
              </div>
              <span className="text-xs font-extrabold text-emerald-900 bg-white px-3 py-1.5 rounded-xl border border-emerald-300">
                {items.length} productos
              </span>
            </div>

            <p className="text-[11px] font-medium text-stone-500 leading-snug">
              Al confirmar, el pedido se enviará al baserritarra. Podrás seguir su estado en la pestaña <strong>Pedidos</strong> y cancelarlo en cualquier momento mientras esté pendiente de validación.
            </p>

            {/* Botones modal */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSummaryModal(false)}
                className="flex-1 py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 font-black rounded-xl text-xs transition-colors"
              >
                Atrás
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleConfirmAndCheckout}
                className="flex-[2] py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  'Enviando pedido...'
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Confirmar y Enviar Pedido
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
