'use client';

import { useState, useEffect } from 'react';
import { useCart, CartItem } from '@/context/CartContext';
import { createClient } from '@/lib/supabase/client';
import { createCartOrders, cancelPendingOrder, CartCheckoutSellerGroup } from '@/app/actions/orders';
import Link from 'next/link';
import {
  ShoppingBasket,
  Trash2,
  Plus,
  Minus,
  Store,
  Truck,
  ArrowLeft,
  Clock,
  AlertCircle,
  CheckCircle2,
  LogIn,
  UserPlus,
  Calendar,
  MessageCircle,
  Layers,
  Sparkles,
} from 'lucide-react';
import type { DeliveryPoint, OrderStatus } from '@/types/database';

interface SellerDeliveryConfig {
  deliveryType: 'caserio' | 'sitio_fisico' | 'envio';
  deliveryPointId: string | null;
  shippingAddress: string;
  groupMode: 'junto_tardio' | 'individual';
}

interface BuyerOrder {
  id: string;
  seller_id: string;
  status: OrderStatus;
  total_amount: number;
  estimated_delivery_date: string | null;
  shipping_address: string | null;
  created_at: string;
  profiles?: {
    id: string;
    full_name: string;
    town: string;
    phone: string | null;
  } | null;
  delivery_points?: {
    name: string;
    town: string;
    address_details: string;
  } | null;
  order_items?: {
    id: string;
    quantity: number;
    subtotal: number;
    products?: {
      name: string;
    } | null;
  }[];
}

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, clearCart, totalPrice } = useCart();
  const supabase = createClient();

  const [currentUser, setCurrentUser] = useState<unknown | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [deliveryConfigs, setDeliveryConfigs] = useState<Record<string, SellerDeliveryConfig>>({});
  const [sellerDeliveryPoints, setSellerDeliveryPoints] = useState<Record<string, DeliveryPoint[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  // Pedidos activos del comprador
  const [buyerOrders, setBuyerOrders] = useState<BuyerOrder[]>([]);

  // Comprobar autenticación
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      setAuthLoading(false);

      if (user) {
        // Cargar pedidos del comprador
        const { data: orders } = await supabase
          .from('orders')
          .select(`
            *,
            profiles!orders_seller_id_fkey(id, full_name, town, phone),
            delivery_points(name, town, address_details),
            order_items(*, products(name))
          `)
          .eq('buyer_id', user.id)
          .order('created_at', { ascending: false });

        if (orders) {
          setBuyerOrders(orders as unknown as BuyerOrder[]);
        }
      }
    }
    checkAuth();
  }, [supabase]);

  // Agrupar items de la cesta por vendedor
  const groupedBySeller = items.reduce((acc, item) => {
    if (!acc[item.sellerId]) {
      acc[item.sellerId] = {
        sellerId: item.sellerId,
        sellerName: item.sellerName,
        sellerTown: item.sellerTown,
        items: [],
      };
    }
    acc[item.sellerId].items.push(item);
    return acc;
  }, {} as Record<string, { sellerId: string; sellerName: string; sellerTown: string; items: CartItem[] }>);

  const sellerIds = Object.keys(groupedBySeller);
  const sellerIdsKey = sellerIds.join(',');

  // Cargar puntos de entrega para los vendedores en la cesta
  useEffect(() => {
    async function loadDeliveryPoints() {
      const currentIds = sellerIdsKey ? sellerIdsKey.split(',').filter(Boolean) : [];
      if (currentIds.length === 0) return;

      const { data: points } = await supabase
        .from('delivery_points')
        .select('*')
        .in('seller_id', currentIds)
        .eq('is_active', true);

      if (points) {
        const pointsBySeller: Record<string, DeliveryPoint[]> = {};
        (points as unknown as DeliveryPoint[]).forEach((pt) => {
          if (!pointsBySeller[pt.seller_id]) pointsBySeller[pt.seller_id] = [];
          pointsBySeller[pt.seller_id].push(pt);
        });
        setSellerDeliveryPoints(pointsBySeller);

        // Inicializar configuraciones de entrega si no existen
        const initialConfigs: Record<string, SellerDeliveryConfig> = {};
        currentIds.forEach((sId) => {
          initialConfigs[sId] = {
            deliveryType: 'sitio_fisico',
            deliveryPointId: pointsBySeller[sId]?.[0]?.id || null,
            shippingAddress: '',
            groupMode: 'junto_tardio',
          };
        });
        setDeliveryConfigs((prev) => ({ ...initialConfigs, ...prev }));
      }
    }
    loadDeliveryPoints();
  }, [sellerIdsKey, supabase]);

  const handleDeliveryTypeChange = (sellerId: string, type: 'caserio' | 'sitio_fisico' | 'envio') => {
    setDeliveryConfigs((prev) => ({
      ...prev,
      [sellerId]: {
        ...prev[sellerId],
        deliveryType: type,
        deliveryPointId: prev[sellerId]?.deliveryPointId || sellerDeliveryPoints[sellerId]?.[0]?.id || null,
        shippingAddress: prev[sellerId]?.shippingAddress || '',
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

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('¿Estás seguro de que deseas cancelar y eliminar este pedido?')) return;
    setCancellingOrderId(orderId);
    const res = await cancelPendingOrder(orderId);
    if (res.success) {
      setBuyerOrders((prev) => prev.filter((o) => o.id !== orderId));
    } else {
      alert(res.error || 'No se pudo cancelar el pedido');
    }
    setCancellingOrderId(null);
  };

  const handleCheckout = async () => {
    setError(null);
    setLoading(true);

    const payload: CartCheckoutSellerGroup[] = [];

    for (const sellerId of sellerIds) {
      const group = groupedBySeller[sellerId];
      const config = deliveryConfigs[sellerId];

      if (config?.deliveryType === 'envio' && !config.shippingAddress.trim()) {
        setError(`Por favor, introduce la dirección de envío para el caserío ${group.sellerName}.`);
        setLoading(false);
        return;
      }

      // Calcular fecha estimada según la opción elegida (más tardía vs individual)
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
        deliveryType: config?.deliveryType || 'sitio_fisico',
        deliveryPointId: config?.deliveryType === 'sitio_fisico' ? config.deliveryPointId : null,
        shippingAddress: config?.deliveryType === 'envio' ? config.shippingAddress : null,
        estimatedDeliveryDate: finalEstimatedDate,
        items: group.items.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
        })),
      });
    }

    const result = await createCartOrders(payload);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      clearCart();
      // Recargar pedidos activos
      if (currentUser) {
        const { data: orders } = await supabase
          .from('orders')
          .select(`
            *,
            profiles!orders_seller_id_fkey(id, full_name, town, phone),
            delivery_points(name, town, address_details),
            order_items(*, products(name))
          `)
          .order('created_at', { ascending: false });

        if (orders) {
          setBuyerOrders(orders as unknown as BuyerOrder[]);
        }
      }
      setLoading(false);
    }
  };

  // 1. USUARIO NO AUTENTICADO: Mensaje amigable con botones de login / registro
  if (!authLoading && !currentUser) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center bg-white rounded-3xl border-2 border-stone-200 p-8 sm:p-10 space-y-6 shadow-sm">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-3xl flex items-center justify-center mx-auto">
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

        <div className="pt-4 border-t border-stone-100">
          <Link href="/" className="text-xs font-bold text-stone-500 hover:text-stone-800">
            ← Volver a explorar el catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-8">
      {/* Cabecera Principal */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-stone-900">Cesta de la Compra y Pedidos</h1>
          <p className="text-xs font-bold text-stone-600 mt-0.5">
            Tramita tus compras de caserío y revisa el estado de validación de tus pedidos
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700 hover:text-stone-900 bg-white px-3 py-1.5 rounded-lg border border-stone-200 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Catálogo de Productos
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-300 text-red-900 font-bold text-sm rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-700" />
          <span>{error}</span>
        </div>
      )}

      {/* SECCIÓN A: PRODUCTOS EN LA CESTA ACTUAL */}
      {items.length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <ShoppingBasket className="w-5 h-5 text-emerald-800" />
            <h2 className="text-lg font-black text-stone-900">
              Productos en tu Cesta ({items.length})
            </h2>
          </div>

          <div className="space-y-6">
            {sellerIds.map((sellerId) => {
              const group = groupedBySeller[sellerId];
              const config = deliveryConfigs[sellerId] || {
                deliveryType: 'sitio_fisico',
                deliveryPointId: null,
                shippingAddress: '',
                groupMode: 'junto_tardio',
              };
              const points = sellerDeliveryPoints[sellerId] || [];

              const sellerTotal = group.items.reduce(
                (sum, item) => sum + item.unitPrice * item.quantity,
                0
              );

              // Detectar si hay distintas fechas de entrega estimadas
              const uniqueDeliveryBadges = Array.from(
                new Set(group.items.map((i) => i.deliveryBadge).filter(Boolean))
              );
              const hasMultipleDates = uniqueDeliveryBadges.length > 1;

              return (
                <div
                  key={sellerId}
                  className="bg-white rounded-3xl border-2 border-stone-200 p-5 sm:p-6 shadow-sm space-y-5"
                >
                  {/* Cabecera del Caserío */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b-2 border-stone-100">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-emerald-100 rounded-xl text-emerald-900 font-black text-xs">
                        <Store className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-stone-900">
                          Caserío: {group.sellerName}
                        </h3>
                        <p className="text-[11px] font-bold text-stone-600">
                          {group.sellerTown} · Trato directo con el baserritarra
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-black text-emerald-950 bg-emerald-100 px-3 py-1 rounded-lg">
                      Subtotal: {sellerTotal.toFixed(2)} €
                    </span>
                  </div>

                  {/* Items del Caserío con su Fecha Estimada de Entrega según Vendedor */}
                  <div className="space-y-3">
                    {group.items.map((item) => (
                      <div
                        key={item.productId}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-stone-50 rounded-2xl border border-stone-200"
                      >
                        <div className="flex items-center gap-3">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-14 h-14 rounded-xl object-cover border border-stone-300 shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-stone-200 flex items-center justify-center text-stone-500 font-bold text-xs shrink-0">
                              km0
                            </div>
                          )}
                          <div>
                            <h4 className="font-extrabold text-stone-900 text-sm">{item.name}</h4>
                            <p className="text-[11px] font-semibold text-stone-600">
                              {item.unitPrice.toFixed(2)} € /{' '}
                              {item.format === 'granel'
                                ? 'kg'
                                : item.format === 'suelto' && item.weightKg
                                ? `${item.weightKg}kg`
                                : 'ud'}
                            </p>

                            {/* FECHA ESTIMADA DE ENTREGA SEGÚN VENDEDOR */}
                            {item.deliveryBadge && (
                              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-900 bg-emerald-100/80 px-2 py-0.5 rounded-md mt-1 border border-emerald-300">
                                <Clock className="w-3 h-3 text-emerald-700 shrink-0" />
                                <span>Entrega prevista: {item.deliveryBadge}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Controles de Cantidad y Subtotal */}
                        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-200">
                          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-stone-300">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-900 flex items-center justify-center font-black"
                              aria-label="Disminuir"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>

                            <span className="text-xs font-black text-stone-900 px-2 min-w-[32px] text-center">
                              {item.quantity}{' '}
                              <span className="text-[10px] font-semibold text-stone-600">
                                {item.format === 'granel' ? 'kg' : 'uds'}
                              </span>
                            </span>

                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="w-7 h-7 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center font-black"
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
                            onClick={() => removeFromCart(item.productId)}
                            className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            title="Quitar producto de la cesta"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* OPCIÓN: FECHAS DE ENTREGA DISTINTAS (TODO JUNTO O INDIVIDUAL) */}
                  {hasMultipleDates && (
                    <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
                      <label className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-amber-700" />
                        Tus productos de este caserío tienen fechas de cosecha o entrega distintas:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <label className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-amber-200 cursor-pointer">
                          <input
                            type="radio"
                            name={`group_${sellerId}`}
                            checked={config.groupMode === 'junto_tardio'}
                            onChange={() => handleGroupModeChange(sellerId, 'junto_tardio')}
                            className="mt-0.5 text-emerald-700"
                          />
                          <span className="font-bold text-stone-900">
                            Entregar todo junto en la fecha más tardía (1 solo envío/recogida)
                          </span>
                        </label>

                        <label className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-amber-200 cursor-pointer">
                          <input
                            type="radio"
                            name={`group_${sellerId}`}
                            checked={config.groupMode === 'individual'}
                            onChange={() => handleGroupModeChange(sellerId, 'individual')}
                            className="mt-0.5 text-emerald-700"
                          />
                          <span className="font-bold text-stone-900">
                            Entregas por separado según la fecha de cada cosecha
                          </span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Forma de Entrega para este Caserío */}
                  <div className="bg-stone-100/70 p-4 rounded-2xl border border-stone-300/80 space-y-3">
                    <label className="block text-xs font-black text-stone-900 uppercase tracking-wider">
                      Forma de entrega para {group.sellerName}:
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
                          <Store className="w-4 h-4 text-emerald-700" />
                          <span>Punto Entrega</span>
                        </span>
                        <span className="text-[10px] font-semibold text-stone-500">Mercado / Plaza</span>
                      </button>

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
                          <span>A Domicilio</span>
                        </span>
                        <span className="text-[10px] font-semibold text-stone-500">Envío directo</span>
                      </button>
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
                      <div>
                        <input
                          type="text"
                          value={config.shippingAddress}
                          onChange={(e) => handleAddressChange(sellerId, e.target.value)}
                          placeholder="Calle, número, piso, pueblo para el envío a domicilio..."
                          className="w-full px-3 py-2 border-2 border-stone-300 rounded-xl text-xs font-bold bg-white text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none placeholder:text-stone-400"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* TOTAL GENERAL Y CONFIRMACIÓN */}
          <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-8 space-y-4 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-800 pb-4">
              <div>
                <span className="text-xs font-bold text-stone-400 block uppercase tracking-wider">
                  Total a confirmar ({items.length} productos)
                </span>
                <span className="text-3xl sm:text-4xl font-black text-white">
                  {totalPrice.toFixed(2)} €
                </span>
              </div>

              <div className="text-right text-xs font-semibold text-stone-300">
                <p>✓ El vendedor validará y confirmará la fecha de entrega.</p>
                <p className="text-emerald-400 font-bold mt-0.5">Podrás cancelarlo libremente mientras esté por validar.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black py-4 rounded-2xl text-base shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                'Tramitando pedidos a los caseríos...'
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" /> Confirmar y Enviar Pedidos a los Caseríos
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border-2 border-stone-200 p-8 text-center space-y-3 shadow-sm">
          <Sparkles className="w-10 h-10 text-emerald-600 mx-auto" />
          <h2 className="text-lg font-black text-stone-900">No tienes productos pendientes en la cesta</h2>
          <p className="text-xs font-semibold text-stone-600 max-w-sm mx-auto">
            Explora el catálogo y añade verduras, frutas y alimentos de caserío.
          </p>
          <Link
            href="/"
            className="inline-block bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-sm transition-all"
          >
            Ver Catálogo de Productos
          </Link>
        </div>
      )}

      {/* SECCIÓN B: ESTADO DE PEDIDOS DEL COMPRADOR (EN TRÁMITE / ESPERANDO CONFIRMACIÓN) */}
      <div className="space-y-4 pt-6 border-t-2 border-stone-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-800" />
            <h2 className="text-lg font-black text-stone-900">
              Mis Compras Realizadas y Estado ({buyerOrders.length})
            </h2>
          </div>

          <Link
            href="/comprador/calendario"
            className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1"
          >
            <Calendar className="w-3.5 h-3.5" /> Ver en Calendario
          </Link>
        </div>

        {buyerOrders.length > 0 ? (
          <div className="space-y-4">
            {buyerOrders.map((order) => {
              const isPending = order.status === 'pendiente';

              return (
                <div
                  key={order.id}
                  className={`rounded-3xl border-2 p-5 sm:p-6 shadow-sm space-y-4 bg-white ${
                    isPending ? 'border-amber-300' : 'border-stone-200'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100">
                    <div>
                      <h3 className="text-sm font-black text-stone-900">
                        Caserío: {order.profiles?.full_name} ({order.profiles?.town})
                      </h3>
                      <p className="text-xs font-semibold text-stone-600">
                        Pedido realizado el {new Date(order.created_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/chat/${order.profiles?.id}`}
                        className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-900 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors border border-stone-200"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> Chat Caserío
                      </Link>

                      <span
                        className={`text-xs font-extrabold px-3 py-1 rounded-full border capitalize ${
                          isPending
                            ? 'bg-amber-100 text-amber-950 border-amber-300'
                            : order.status === 'confirmado'
                            ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                            : 'bg-stone-100 text-stone-900 border-stone-300'
                        }`}
                      >
                        {isPending
                          ? 'Esperando Confirmación del Caserío'
                          : order.status === 'confirmado'
                          ? 'Confirmado por Caserío'
                          : order.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Estado y Fecha de Entrega */}
                  {isPending ? (
                    <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs font-bold text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-700 shrink-0 animate-pulse" />
                        <span>El caserío está revisando tu pedido para confirmar la fecha de entrega.</span>
                      </div>

                      {/* BOTÓN CANCELAR / ELIMINAR PEDIDO PENDIENTE */}
                      <button
                        type="button"
                        disabled={cancellingOrderId === order.id}
                        onClick={() => handleCancelOrder(order.id)}
                        className="bg-white hover:bg-red-50 text-red-700 border border-red-300 font-black text-xs px-3.5 py-1.5 rounded-xl transition-colors flex items-center gap-1 shadow-sm shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {cancellingOrderId === order.id ? 'Cancelando...' : 'Cancelar / Eliminar Pedido'}
                      </button>
                    </div>
                  ) : order.estimated_delivery_date ? (
                    <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs font-bold text-emerald-950 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>
                        Fecha de entrega confirmada:{' '}
                        <strong>
                          {new Date(order.estimated_delivery_date).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                          })}
                        </strong>
                      </span>
                    </div>
                  ) : null}

                  {/* Productos del pedido */}
                  <div className="space-y-1.5 bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
                    {order.order_items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-xs font-bold text-stone-900"
                      >
                        <span>
                          {item.products?.name} x {item.quantity}
                        </span>
                        <span className="font-black">
                          {Number(item.subtotal).toFixed(2)} €
                        </span>
                      </div>
                    ))}
                    <div className="pt-2 mt-1 border-t border-stone-300 flex justify-between text-xs font-black text-stone-900">
                      <span>Total</span>
                      <span className="text-emerald-900 font-black text-sm">
                        {Number(order.total_amount).toFixed(2)} €
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200 text-center text-xs font-semibold text-stone-600">
            No tienes pedidos activos en trámite actualmente.
          </div>
        )}
      </div>
    </div>
  );
}
