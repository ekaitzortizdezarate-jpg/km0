'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { createOrder } from '@/app/actions/orders';
import {
  ShoppingBasket,
  Truck,
  Store,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Clock,
  MessageCircle,
  Package,
} from 'lucide-react';
import Link from 'next/link';
import type { DeliveryPoint, ProductWithSeller } from '@/types/database';
import { getDeliveryEstimate } from '@/lib/delivery';
import { TouchNumberStepper } from '@/components/TouchNumberStepper';
import { FavoriteButton } from '@/components/FavoriteButton';

export default function CheckoutPage() {
  const params = useParams();
  const productId = params.id as string;
  const supabase = createClient();

  const [product, setProduct] = useState<ProductWithSeller | null>(null);
  const [deliveryPoints, setDeliveryPoints] = useState<DeliveryPoint[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [deliveryType, setDeliveryType] = useState<'sitio_fisico' | 'envio'>('sitio_fisico');
  const [isRecurring, setIsRecurring] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const { data: prod } = await supabase
        .from('products')
        .select('*, profiles!products_seller_id_fkey(*)')
        .eq('id', productId)
        .single();

      if (prod) {
        setProduct(prod as ProductWithSeller);

        const { data: points } = await supabase
          .from('delivery_points')
          .select('*')
          .eq('seller_id', prod.seller_id)
          .eq('is_active', true);

        if (points) setDeliveryPoints(points);
      }
      setLoading(false);
    }
    loadData();
  }, [productId, supabase]);

  if (loading) {
    return (
      <div className="text-center py-20 text-stone-800 font-bold text-sm">
        Cargando detalles del producto...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20 text-stone-800 font-bold text-sm">
        Producto no encontrado.
      </div>
    );
  }

  // Delivery estimation
  const deliveryInfo = getDeliveryEstimate(
    product.availability_type,
    product.availability_days,
    product.availability_weekdays,
    product.available_from_date
  );

  const basePrice = product.format === 'granel'
    ? (product.price_per_kilo || product.price)
    : product.price;

  const finalUnitPrice =
    product.discount_percentage > 0
      ? basePrice * (1 - product.discount_percentage / 100)
      : basePrice;

  const total = (finalUnitPrice * quantity).toFixed(2);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    formData.append('product_id', product!.id);
    formData.append('seller_id', product!.seller_id);
    formData.append('quantity', quantity.toString());
    formData.append('delivery_type', deliveryType);
    formData.append('estimated_delivery_date', deliveryInfo.estimatedDate.toISOString());
    if (isRecurring) formData.append('is_recurring', 'on');

    const result = await createOrder(formData);
    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700 hover:text-stone-900 bg-white px-3 py-1.5 rounded-lg border border-stone-200 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Cancelar y volver al catálogo
        </Link>
      </div>

      <div className="bg-white rounded-3xl border-2 border-stone-200 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Cabecera del Productor y Favoritos */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            {product.profiles?.avatar_url ? (
              <img
                src={product.profiles.avatar_url}
                alt={product.profiles.full_name}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-600 shadow-sm"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-900 font-black text-lg flex items-center justify-center border border-emerald-300">
                {product.profiles?.full_name?.charAt(0) || 'C'}
              </div>
            )}
            <div>
              <h1 className="text-xl font-black text-stone-900">
                {product.profiles?.full_name}
              </h1>
              <p className="text-xs font-bold text-stone-600">
                {product.profiles?.town} · Venta directa de caserío
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 1. Añadir Vendedor Favorito */}
            {product.profiles?.id && (
              <FavoriteButton id={product.profiles.id} type="seller" showText />
            )}

            {/* Mensaje / Chat directo */}
            {product.profiles?.id && (
              <Link
                href={`/chat/${product.profiles.id}`}
                className="inline-flex items-center gap-1 bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold text-xs px-3 py-1.5 rounded-lg border border-stone-200 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Chat</span>
              </Link>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-300 text-red-900 font-bold text-sm rounded-xl flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-700" />
            <span>{error}</span>
          </div>
        )}

        {/* Resumen del Producto con Foto y Favorito */}
        <div className="bg-stone-50 rounded-2xl p-4 sm:p-5 border border-stone-200 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-stone-200 shrink-0 border border-stone-300">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-stone-500">
                <Package className="w-8 h-8 text-stone-400" />
              </div>
            )}
            <div className="absolute top-1.5 right-1.5">
              <FavoriteButton id={product.id} type="product" />
            </div>
          </div>

          <div className="flex-1 space-y-1.5 w-full text-left">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-950 px-2 py-0.5 rounded">
                {product.format === 'granel'
                  ? 'A Granel'
                  : product.format === 'suelto'
                  ? 'Suelto'
                  : 'Pack / Cesta'}
              </span>
              <span className="text-xs font-bold text-stone-600 capitalize">
                {product.category.replace('_', ' ')}
              </span>
            </div>

            <h2 className="text-lg font-black text-stone-900">{product.name}</h2>

            {product.format === 'pack' && product.pack_items && (
              <p className="text-xs font-semibold text-stone-700 line-clamp-2">
                Contiene: {product.pack_items}
              </p>
            )}

            <div className="text-stone-900 font-extrabold text-base">
              {finalUnitPrice.toFixed(2)} €{' '}
              <span className="text-xs font-bold text-stone-600">
                / {product.format === 'granel' ? 'kg' : product.format === 'suelto' && product.weight_kg ? `${product.weight_kg}kg` : 'unidad'}
              </span>
            </div>
          </div>
        </div>

        {/* Banner: Fecha y Condiciones de Entrega Estimada */}
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1">
          <div className="flex items-center gap-2 text-emerald-950 font-black text-sm">
            <Clock className="w-4 h-4 text-emerald-700" />
            <span>Condición de Entrega: {deliveryInfo.badgeText}</span>
          </div>
          <p className="text-xs font-bold text-emerald-900">
            🗓️ Tu pedido estará listo para entrega estimada el:{' '}
            <span className="underline">{deliveryInfo.formattedDate}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selector Táctil Numérico para el Móvil */}
          <div className="bg-stone-50 p-4 sm:p-5 rounded-2xl border border-stone-200">
            <TouchNumberStepper
              name="quantity"
              label={
                product.format === 'granel'
                  ? '¿Cuántos Kilos deseas pedir?'
                  : '¿Cuántas unidades / piezas deseas?'
              }
              min={1}
              max={product.is_unlimited_stock ? 200 : product.stock}
              step={1}
              value={quantity}
              onChange={setQuantity}
              unit={product.format === 'granel' ? 'kg' : 'uds'}
              quickOptions={
                product.format === 'granel' ? [1, 2, 3, 5, 10] : [1, 2, 3, 5]
              }
            />
          </div>

          {/* Método de Entrega */}
          <div className="space-y-3">
            <label className="block text-xs font-black text-stone-900 uppercase tracking-wider">
              Forma de Entrega
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeliveryType('sitio_fisico')}
                className={`p-3.5 rounded-2xl border-2 flex flex-col items-center gap-1.5 text-xs font-black transition-all ${
                  deliveryType === 'sitio_fisico'
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-950 shadow-sm'
                    : 'border-stone-200 text-stone-700 hover:bg-stone-50 bg-white'
                }`}
              >
                <Store className="w-5 h-5 text-emerald-700" />
                Punto de Venta / Recogida
              </button>

              <button
                type="button"
                onClick={() => setDeliveryType('envio')}
                className={`p-3.5 rounded-2xl border-2 flex flex-col items-center gap-1.5 text-xs font-black transition-all ${
                  deliveryType === 'envio'
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-950 shadow-sm'
                    : 'border-stone-200 text-stone-700 hover:bg-stone-50 bg-white'
                }`}
              >
                <Truck className="w-5 h-5 text-emerald-700" />
                Envío a Domicilio
              </button>
            </div>

            {deliveryType === 'sitio_fisico' ? (
              <div className="pt-2">
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Selecciona el punto de recogida del caserío:
                </label>
                {deliveryPoints.length > 0 ? (
                  <select
                    name="delivery_point_id"
                    required
                    className="w-full px-3.5 py-2.5 border-2 border-stone-300 rounded-xl text-xs font-bold bg-white text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    {deliveryPoints.map((pt) => (
                      <option key={pt.id} value={pt.id}>
                        {pt.name} - {pt.town} ({pt.address_details})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs font-semibold text-stone-800 bg-stone-100 p-3 rounded-xl border border-stone-200">
                    Recogida directa en el caserío ({product.profiles?.town}).
                  </p>
                )}
              </div>
            ) : (
              <div className="pt-2">
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Dirección de entrega completa:
                </label>
                <input
                  name="shipping_address"
                  type="text"
                  required
                  placeholder="Calle, número, piso, pueblo..."
                  className="w-full px-3.5 py-2.5 border-2 border-stone-300 rounded-xl text-xs font-bold text-stone-900 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none placeholder:text-stone-500"
                />
              </div>
            )}
          </div>

          {/* Opción de Compra Periódica / Recurrente */}
          <div className="pt-2 border-t border-stone-200">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_recurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-5 h-5 text-emerald-700 rounded border-stone-300 focus:ring-emerald-600"
              />
              <label
                htmlFor="is_recurring"
                className="text-sm font-black text-stone-900 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-emerald-700" /> Reposición Periódica / Automática
              </label>
            </div>

            {isRecurring && (
              <div className="mt-3 pl-8">
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Frecuencia de reposición:
                </label>
                <select
                  name="recurrence_interval_days"
                  className="w-full sm:w-56 px-3 py-2 border-2 border-stone-300 rounded-xl text-xs font-bold bg-white text-stone-900"
                >
                  <option value="7">Cada semana (7 días)</option>
                  <option value="14">Cada 2 semanas (14 días)</option>
                  <option value="30">Mensual (30 días)</option>
                </select>
              </div>
            )}
          </div>

          {/* Total y Confirmación */}
          <div className="pt-4 border-t-2 border-stone-200 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-stone-600 block">Total a pagar</span>
              <span className="text-3xl font-black text-stone-900">{total} €</span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-extrabold py-3.5 px-6 rounded-xl text-sm flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
            >
              {submitting ? (
                'Procesando...'
              ) : (
                <>
                  <ShoppingBasket className="w-5 h-5" /> Confirmar Pedido
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}