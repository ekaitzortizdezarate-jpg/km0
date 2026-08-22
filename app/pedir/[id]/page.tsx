'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useCart } from '@/context/CartContext';
import {
  ShoppingCart,
  ArrowLeft,
  Clock,
  MessageCircle,
  Package,
  Check,
  User,
} from 'lucide-react';
import Link from 'next/link';
import type { ProductWithSeller } from '@/types/database';
import { validateProfileCompleteness } from '@/lib/profile-validation';
import { getDeliveryEstimate } from '@/lib/delivery';
import { TouchNumberStepper } from '@/components/TouchNumberStepper';
import { FavoriteButton } from '@/components/FavoriteButton';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const supabase = createClient();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<ProductWithSeller | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addedNotice, setAddedNotice] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: prod } = await supabase
        .from('products')
        .select('*, profiles!products_seller_id_fkey(*)')
        .eq('id', productId)
        .single();

      if (prod) {
        setProduct(prod as ProductWithSeller);
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

  const [profileMissing, setProfileMissing] = useState<string[] | null>(null);

  const handleAddToCart = async (goToCart = false) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      const val = validateProfileCompleteness(profile);
      if (!val.isComplete) {
        setProfileMissing(val.missingFields);
        return;
      }
    }

    addToCart({
      productId: product.id,
      sellerId: product.seller_id,
      sellerName: product.profiles?.full_name || 'Caserío',
      sellerTown: product.profiles?.town || '',
      sellerAvatarUrl: product.profiles?.avatar_url || null,
      name: product.name,
      category: product.category,
      format: product.format,
      price: product.price,
      unitPrice: finalUnitPrice,
      weightKg: product.weight_kg,
      imageUrl: product.image_url,
      quantity,
      packItems: product.pack_items,
      estimatedDeliveryDate: deliveryInfo.estimatedDate.toISOString(),
      deliveryBadge: deliveryInfo.badgeText,
      deliveryBadgeDetail: deliveryInfo.detailText,
      deliveryMethods: product.delivery_methods,
      caserioSchedule: product.caserio_schedule,
      stock: Number(product.stock) || 0,
      isUnlimitedStock: product.is_unlimited_stock,
    });

    if (goToCart) {
      router.push('/cesta');
    } else {
      setAddedNotice(true);
      setTimeout(() => setAddedNotice(false), 3000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700 hover:text-stone-900 bg-white px-3 py-1.5 rounded-lg border border-stone-200 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al catálogo
        </Link>

        <Link
          href="/cesta"
          className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-950 bg-emerald-100 hover:bg-emerald-200 px-3.5 py-1.5 rounded-xl border border-emerald-300 transition-colors shadow-sm"
        >
          <ShoppingCart className="w-4 h-4 text-emerald-800" /> Ir a la Cesta
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
            {product.profiles?.id && (
              <FavoriteButton id={product.profiles.id} type="seller" showText />
            )}

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

        {/* Notificación de Añadido a la Cesta */}
        {addedNotice && (
          <div className="p-4 bg-emerald-100 border-2 border-emerald-400 text-emerald-950 font-black text-sm rounded-2xl flex items-center justify-between gap-2 shadow-sm animate-fadeIn">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-emerald-800 shrink-0" />
              <span>¡{product.name} ({quantity} {product.format === 'granel' ? 'kg' : 'uds'}) añadido a tu cesta!</span>
            </div>
            <Link
              href="/cesta"
              className="bg-emerald-800 text-white text-xs font-black px-3 py-1.5 rounded-xl hover:bg-emerald-900 transition-colors"
            >
              Ver Cesta
            </Link>
          </div>
        )}

        {/* Resumen del Producto con Foto y Favorito */}
        <div className="bg-stone-50 rounded-2xl p-4 sm:p-5 border border-stone-200 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-stone-200 shrink-0 border border-stone-300">
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
                  ? 'A Peso'
                  : product.format === 'suelto'
                  ? product.weight_kg
                    ? 'Pieza pesada'
                    : 'Por Unidad'
                  : 'Pack / Cesta'}
              </span>
              <span className="text-xs font-bold text-stone-600 capitalize">
                {product.category.replace('_', ' ')}
              </span>
            </div>

            <h2 className="text-xl font-black text-stone-900">{product.name}</h2>

            {product.format === 'pack' && product.pack_items && (
              <p className="text-xs font-semibold text-stone-700">
                Contiene: {product.pack_items}
              </p>
            )}

            {product.description && (
              <p className="text-xs text-stone-600 font-medium">
                {product.description}
              </p>
            )}

            <div className="text-stone-900 font-black text-xl pt-1">
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
            🗓️ {deliveryInfo.detailText}
          </p>
        </div>

        {/* Selector Táctil de Cantidad */}
        <div className="bg-stone-50 p-4 sm:p-5 rounded-2xl border border-stone-200 space-y-3">
          <TouchNumberStepper
            name="quantity"
            label={
              product.format === 'granel'
                ? '¿Cuántos Kilos deseas añadir a tu cesta?'
                : '¿Cuántas unidades / piezas deseas añadir?'
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

        {/* Aviso de Perfil Incompleto */}
        {profileMissing && profileMissing.length > 0 && (
          <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl space-y-3">
            <div className="flex items-start gap-2.5">
              <User className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h4 className="text-xs sm:text-sm font-black text-amber-950">
                  Completa los datos de tu cuenta para poder añadir a la cesta
                </h4>
                <p className="text-[11px] font-semibold text-amber-900 mt-0.5">
                  Es obligatorio rellenar tu nombre, apellido 1, fecha de nacimiento, DNI, teléfono y dirección.
                </p>
                <div className="mt-2 text-[10px] text-amber-900 font-bold">
                  <span>Pendiente: {profileMissing.join(', ')}</span>
                </div>
              </div>
            </div>
            <Link
              href="/perfil"
              className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-black rounded-xl text-xs shadow-sm transition-all"
            >
              <User className="w-3.5 h-3.5" />
              <span>Configurar mi cuenta ahora</span>
            </Link>
          </div>
        )}

        {/* Botones de Añadir a la Cesta e Ir a Pagar */}
        <div className="pt-4 border-t-2 border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-stone-600 block">Subtotal estimado</span>
            <span className="text-3xl font-black text-stone-900">{total} €</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleAddToCart(false)}
              className="w-full sm:w-auto bg-stone-900 hover:bg-black text-white font-black py-3.5 px-5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <ShoppingCart className="w-4 h-4 text-emerald-400" /> Añadir a la Cesta
            </button>

            <button
              type="button"
              onClick={() => handleAddToCart(true)}
              className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-black py-3.5 px-6 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md transition-all"
            >
              Comprar e Ir a la Cesta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}