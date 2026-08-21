'use client';

import { useState, useEffect } from 'react';
import { useCart, CartItem } from '@/context/CartContext';
import { createClient } from '@/lib/supabase/client';
import { createCartOrders, CartCheckoutSellerGroup } from '@/app/actions/orders';
import { useRouter } from 'next/navigation';
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
  Layers,
  Sparkles,
  X,
} from 'lucide-react';
import type { DeliveryPoint } from '@/types/database';

interface SellerDeliveryConfig {
  deliveryType: 'caserio' | 'sitio_fisico' | 'envio';
  deliveryPointId: string | null;
  shippingAddress: string;
  groupMode: 'junto_tardio' | 'individual';
}

export default function CartPage() {
  const router = useRouter();
  const { items, removeFromCart, updateQuantity, clearCart, totalPrice } = useCart();
  const supabase = createClient();

  const [currentUser, setCurrentUser] = useState<unknown | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [deliveryConfigs, setDeliveryConfigs] = useState<Record<string, SellerDeliveryConfig>>({});
  const [sellerDeliveryPoints, setSellerDeliveryPoints] = useState<Record<string, DeliveryPoint[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  // Comprobar autenticación
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      setAuthLoading(false);
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
          const sellerItems = groupedBySeller[sId]?.items || [];
          const preferredType =
            sellerItems.find((i) => i.selectedDeliveryType)?.selectedDeliveryType || 'caserio';

          initialConfigs[sId] = {
            deliveryType:
              preferredType === 'domicilio'
                ? 'envio'
                : preferredType === 'punto_entrega'
                ? 'sitio_fisico'
                : 'caserio',
            deliveryPointId:
              sellerItems.find((i) => i.selectedPointId)?.selectedPointId ||
              pointsBySeller[sId]?.[0]?.id ||
              null,
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
        deliveryType: config?.deliveryType || 'caserio',
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
      setShowSummaryModal(false);
    } else {
      clearCart();
      setShowSummaryModal(false);
      setLoading(false);
      router.push('/comprador/pedidos');
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

          {/* TOTAL GENERAL Y BOTÓN REVISAR PEDIDO */}
          <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-8 space-y-4 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-800 pb-4">
              <div>
                <span className="text-xs font-bold text-stone-400 block uppercase tracking-wider">
                  Total del Pedido ({items.length} productos)
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
              onClick={handleOpenSummary}
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black py-4 rounded-2xl text-base shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <CheckCircle2 className="w-5 h-5" /> Confirmar y Enviar Pedido
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border-2 border-stone-200 p-8 text-center space-y-3 shadow-sm">
          <Sparkles className="w-10 h-10 text-emerald-600 mx-auto" />
          <h2 className="text-lg font-black text-stone-900">No tienes productos en la cesta</h2>
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

      {/* MODAL DE RESUMEN FINAL DEL PEDIDO */}
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
                    Revisa los detalles antes de enviar el pedido al caserío
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

            {/* Desglose por caseríos */}
            <div className="space-y-3 text-xs">
              {sellerIds.map((sId) => {
                const group = groupedBySeller[sId];
                const config = deliveryConfigs[sId];
                const points = sellerDeliveryPoints[sId] || [];
                const pointObj = points.find((p) => p.id === config?.deliveryPointId);

                return (
                  <div key={sId} className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                    <div className="flex justify-between font-black text-stone-900">
                      <span>🏡 Caserío: {group.sellerName}</span>
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
                            : `Envío a Domicilio (${config?.shippingAddress})`}
                        </span>
                      </div>

                      <div className="text-stone-600 font-semibold">
                        Agrupación:{' '}
                        {config?.groupMode === 'junto_tardio'
                          ? 'Entrega agrupada en la fecha más lejana'
                          : 'Entregas individuales según cosecha'}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-200 space-y-1 font-semibold text-stone-700">
                      {group.items.map((it) => (
                        <div key={it.productId} className="flex justify-between">
                          <span>
                            {it.name} x {it.quantity} {it.format === 'granel' ? 'kg' : 'uds'}
                          </span>
                          <span className="font-black text-stone-900">
                            {(it.unitPrice * it.quantity).toFixed(2)} €
                          </span>
                        </div>
                      ))}
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
