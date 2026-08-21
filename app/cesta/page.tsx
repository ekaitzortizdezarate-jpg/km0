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
} from 'lucide-react';
import type { DeliveryPoint } from '@/types/database';

interface SellerDeliveryConfig {
  deliveryType: 'sitio_fisico' | 'envio';
  deliveryPointId: string | null;
  shippingAddress: string;
}

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, clearCart, totalPrice } = useCart();
  const router = useRouter();
  const supabase = createClient();

  const [deliveryConfigs, setDeliveryConfigs] = useState<Record<string, SellerDeliveryConfig>>({});
  const [sellerDeliveryPoints, setSellerDeliveryPoints] = useState<Record<string, DeliveryPoint[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Agrupar items por vendedor
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
        points.forEach((pt) => {
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
          };
        });
        setDeliveryConfigs((prev) => ({ ...initialConfigs, ...prev }));
      }
    }
    loadDeliveryPoints();
  }, [sellerIdsKey, supabase]);

  const handleDeliveryTypeChange = (sellerId: string, type: 'sitio_fisico' | 'envio') => {
    setDeliveryConfigs((prev) => ({
      ...prev,
      [sellerId]: {
        ...prev[sellerId],
        deliveryType: type,
        deliveryPointId: prev[sellerId]?.deliveryPointId || sellerDeliveryPoints[sellerId]?.[0]?.id || null,
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

      // Tomar la fecha estimada del primer item o más tardía del grupo
      const estimatedDate = group.items[0]?.estimatedDeliveryDate || null;

      payload.push({
        sellerId,
        deliveryType: config?.deliveryType || 'sitio_fisico',
        deliveryPointId: config?.deliveryType === 'sitio_fisico' ? config.deliveryPointId : null,
        shippingAddress: config?.deliveryType === 'envio' ? config.shippingAddress : null,
        estimatedDeliveryDate: estimatedDate,
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
      router.push('/comprador/pedidos');
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center bg-white rounded-3xl border-2 border-stone-200 p-8 space-y-4 shadow-sm">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-3xl flex items-center justify-center mx-auto">
          <ShoppingBasket className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-stone-900">Tu cesta de la compra está vacía</h1>
        <p className="text-sm font-semibold text-stone-600">
          Explora los productos de caserío y añade tus alimentos favoritos a la cesta.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs px-5 py-3 rounded-xl transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Ir al Catálogo de Productos
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-stone-900">Cesta de la Compra</h1>
          <p className="text-xs font-bold text-stone-600 mt-0.5">
            Revisa tus productos seleccionados y confirma tu pedido agrupado por caserío
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700 hover:text-stone-900 bg-white px-3 py-1.5 rounded-lg border border-stone-200 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Seguir Comprando
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-300 text-red-900 font-bold text-sm rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-700" />
          <span>{error}</span>
        </div>
      )}

      {/* LISTA DE PRODUCTOS AGRUPADOS POR CASERÍO */}
      <div className="space-y-6">
        {sellerIds.map((sellerId) => {
          const group = groupedBySeller[sellerId];
          const config = deliveryConfigs[sellerId] || {
            deliveryType: 'sitio_fisico',
            deliveryPointId: null,
            shippingAddress: '',
          };
          const points = sellerDeliveryPoints[sellerId] || [];

          const sellerTotal = group.items.reduce(
            (sum, item) => sum + item.unitPrice * item.quantity,
            0
          );

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
                    <h2 className="text-base font-black text-stone-900">
                      Caserío: {group.sellerName}
                    </h2>
                    <p className="text-[11px] font-bold text-stone-600">
                      {group.sellerTown} · Venta directa
                    </p>
                  </div>
                </div>

                <span className="text-xs font-black text-emerald-950 bg-emerald-100 px-3 py-1 rounded-lg">
                  Subtotal: {sellerTotal.toFixed(2)} €
                </span>
              </div>

              {/* Items del Caserío */}
              <div className="space-y-3">
                {group.items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-stone-50 rounded-2xl border border-stone-200"
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
                        <h3 className="font-extrabold text-stone-900 text-sm">{item.name}</h3>
                        <p className="text-[11px] font-semibold text-stone-600">
                          {item.unitPrice.toFixed(2)} € /{' '}
                          {item.format === 'granel'
                            ? 'kg'
                            : item.format === 'suelto' && item.weightKg
                            ? `${item.weightKg}kg`
                            : 'ud'}
                        </p>
                        {item.deliveryBadge && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded mt-0.5 border border-emerald-200">
                            <Clock className="w-3 h-3 text-emerald-700" />
                            {item.deliveryBadge}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Controles de Cantidad y Subtotal */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-200">
                      {/* Stepper +/- */}
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

              {/* Forma de Entrega para este Caserío */}
              <div className="bg-stone-100/70 p-4 rounded-2xl border border-stone-300/80 space-y-3">
                <label className="block text-xs font-black text-stone-900 uppercase tracking-wider">
                  Forma de entrega para {group.sellerName}:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDeliveryTypeChange(sellerId, 'sitio_fisico')}
                    className={`p-3 rounded-xl border-2 text-left text-xs font-black transition-all flex items-center gap-2 ${
                      config.deliveryType === 'sitio_fisico'
                        ? 'border-emerald-700 bg-white ring-2 ring-emerald-600 text-emerald-950 shadow-sm'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <Store className="w-4 h-4 text-emerald-700" />
                    <span>Recogida en Punto del Caserío</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeliveryTypeChange(sellerId, 'envio')}
                    className={`p-3 rounded-xl border-2 text-left text-xs font-black transition-all flex items-center gap-2 ${
                      config.deliveryType === 'envio'
                        ? 'border-emerald-700 bg-white ring-2 ring-emerald-600 text-emerald-950 shadow-sm'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <Truck className="w-4 h-4 text-emerald-700" />
                    <span>Envío a Domicilio</span>
                  </button>
                </div>

                {config.deliveryType === 'sitio_fisico' ? (
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
                ) : (
                  <div>
                    <input
                      type="text"
                      value={config.shippingAddress}
                      onChange={(e) => handleAddressChange(sellerId, e.target.value)}
                      placeholder="Calle, número, piso, pueblo para el envío..."
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
              Total Cesta ({items.length} productos)
            </span>
            <span className="text-3xl sm:text-4xl font-black text-white">
              {totalPrice.toFixed(2)} €
            </span>
          </div>

          <div className="text-right text-xs font-semibold text-stone-300">
            <p>✓ El vendedor validará y confirmará la fecha exacta de entrega.</p>
            <p className="text-emerald-400 font-bold mt-0.5">Trato directo con los caseríos de km0.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCheckout}
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black py-4 rounded-2xl text-base shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            'Tramitando pedidos...'
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" /> Confirmar y Enviar Pedidos a los Caseríos
            </>
          )}
        </button>
      </div>
    </div>
  );
}
