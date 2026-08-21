'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { createOrder } from '@/app/actions/orders';
import { ShoppingBasket, Truck, Store, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import type { DeliveryPoint, ProductWithSeller } from '@/types/database';

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
    return <div className="text-center py-20 text-stone-500">Cargando producto...</div>;
  }

  if (!product) {
    return <div className="text-center py-20 text-stone-500">Producto no encontrado.</div>;
  }

  const finalUnitPrice =
    product.discount_percentage > 0
      ? product.price * (1 - product.discount_percentage / 100)
      : product.price;

  const total = (finalUnitPrice * quantity).toFixed(2);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    formData.append('product_id', product!.id);
    formData.append('seller_id', product!.seller_id);
    formData.append('delivery_type', deliveryType);
    if (isRecurring) formData.append('is_recurring', 'on');

    const result = await createOrder(formData);
    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Cancelar y volver
      </Link>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 sm:p-8">
        <h1 className="text-xl font-bold text-stone-900 mb-2">Finalizar Pedido</h1>
        <p className="text-xs text-stone-500 mb-6">
          Comprando directamente a <span className="font-semibold text-stone-800">{product.profiles?.full_name}</span> ({product.profiles?.town})
        </p>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Resumen del Producto */}
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-stone-900 text-sm">{product.name}</h3>
              <p className="text-xs text-stone-500 capitalize">{product.category.replace('_', ' ')}</p>
            </div>
            <div className="text-right">
              <span className="font-bold text-stone-900 text-base">{finalUnitPrice.toFixed(2)} €</span>
              <span className="text-xs text-stone-500 block">/ unidad</span>
            </div>
          </div>

          {/* Cantidad */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Cantidad (Disponibles: {product.stock})
            </label>
            <input
              name="quantity"
              type="number"
              min="1"
              max={product.stock}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-24 px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          {/* Método de Entrega */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
              Forma de Entrega
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeliveryType('sitio_fisico')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs ${
                  deliveryType === 'sitio_fisico'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold'
                    : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                <Store className="w-4 h-4 text-emerald-700" />
                Punto de Venta / Recogida
              </button>

              <button
                type="button"
                onClick={() => setDeliveryType('envio')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs ${
                  deliveryType === 'envio'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold'
                    : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                <Truck className="w-4 h-4 text-emerald-700" />
                Envío a Domicilio
              </button>
            </div>

            {deliveryType === 'sitio_fisico' ? (
              <div className="pt-2">
                <label className="block text-xs text-stone-600 mb-1">
                  Selecciona el punto de recogida del productor:
                </label>
                {deliveryPoints.length > 0 ? (
                  <select
                    name="delivery_point_id"
                    required
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
                  >
                    {deliveryPoints.map((pt) => (
                      <option key={pt.id} value={pt.id}>
                        {pt.name} - {pt.town} ({pt.address_details})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-stone-500 bg-stone-100 p-2.5 rounded-lg">
                    Recogida directa en el caserío ({product.profiles?.town}).
                  </p>
                )}
              </div>
            ) : (
              <div className="pt-2">
                <label className="block text-xs text-stone-600 mb-1">
                  Dirección de entrega completa:
                </label>
                <input
                  name="shipping_address"
                  type="text"
                  required
                  placeholder="Calle, número, piso, pueblo..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Opción de Compra Recurrente */}
          <div className="pt-2 border-t border-stone-100">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_recurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
              />
              <label htmlFor="is_recurring" className="text-sm font-medium text-stone-800 flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-emerald-700" /> Compra periódica / recurrente
              </label>
            </div>

            {isRecurring && (
              <div className="mt-3 pl-7">
                <label className="block text-xs text-stone-600 mb-1">Frecuencia de reposición:</label>
                <select
                  name="recurrence_interval_days"
                  className="w-full sm:w-48 px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
                >
                  <option value="7">Cada semana (7 días)</option>
                  <option value="14">Cada 2 semanas (14 días)</option>
                  <option value="30">Mensual (30 días)</option>
                </select>
              </div>
            )}
          </div>

          {/* Total y Confirmar */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-stone-500 block">Total a pagar</span>
              <span className="text-2xl font-extrabold text-stone-900">{total} €</span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-medium py-2.5 px-6 rounded-lg text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Procesando...' : (
                <>
                  <ShoppingBasket className="w-4 h-4" /> Confirmar Pedido
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}