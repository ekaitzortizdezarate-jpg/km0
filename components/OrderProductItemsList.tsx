'use client';

import { DeliveryMethodsBadges } from '@/components/DeliveryMethodsBadges';

export type ProductViewMode = 'grande' | 'mediano' | 'lista';

interface OrderItemProduct {
  id?: string;
  name?: string;
  format?: 'granel' | 'suelto' | 'pack' | string;
  image_url?: string | null;
  delivery_methods?: string[] | null;
}

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  subtotal?: number;
  products?: OrderItemProduct | null;
}

interface OrderProductItemsListProps {
  items: OrderItem[];
  viewMode?: ProductViewMode;
}

export function OrderProductItemsList({
  items,
  viewMode = 'mediano',
}: OrderProductItemsListProps) {
  if (!items || items.length === 0) {
    return (
      <p className="text-xs text-stone-500 italic py-2">
        No hay detalles de productos disponibles.
      </p>
    );
  }

  // VISTA GRANDE
  if (viewMode === 'grande') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item) => {
          const prod = item.products;
          const subtotal = item.subtotal ?? item.quantity * item.unit_price;

          return (
            <div
              key={item.id}
              className="bg-white p-3.5 rounded-2xl border-2 border-stone-200 shadow-sm flex flex-col justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                {prod?.image_url ? (
                  <img
                    src={prod.image_url}
                    alt={prod.name || 'Producto'}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-stone-200 shrink-0 shadow-2xs"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center text-2xl border border-emerald-200 shrink-0 font-bold">
                    🌿
                  </div>
                )}

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-black text-stone-900 text-xs sm:text-sm leading-snug">
                      {prod?.name || 'Producto'}
                    </span>
                    <DeliveryMethodsBadges deliveryMethods={prod?.delivery_methods} />
                  </div>

                  <p className="text-[11px] font-bold text-stone-500">
                    Formato: <span className="capitalize">{prod?.format === 'granel' ? 'A granel (kg)' : prod?.format || 'Unidad'}</span>
                  </p>

                  <p className="text-xs font-black text-emerald-900">
                    {item.quantity} {prod?.format === 'granel' ? 'kg' : 'ud(s)'} x {Number(item.unit_price).toFixed(2)} €
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                <span className="font-bold text-stone-500 uppercase text-[10px]">Subtotal:</span>
                <span className="font-black text-stone-900 text-sm">{Number(subtotal).toFixed(2)} €</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // VISTA LISTA COMPACTA
  if (viewMode === 'lista') {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100 overflow-hidden">
        {items.map((item) => {
          const prod = item.products;
          const subtotal = item.subtotal ?? item.quantity * item.unit_price;

          return (
            <div
              key={item.id}
              className="flex items-center justify-between gap-2 px-3 py-2 text-xs hover:bg-stone-50 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {prod?.image_url ? (
                  <img
                    src={prod.image_url}
                    alt={prod.name || 'Producto'}
                    className="w-8 h-8 rounded-lg object-cover border border-stone-200 shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center text-xs border border-emerald-200 shrink-0 font-bold">
                    🌿
                  </div>
                )}

                <span className="font-black text-stone-900 truncate">
                  {prod?.name || 'Producto'}
                </span>

                <DeliveryMethodsBadges deliveryMethods={prod?.delivery_methods} />
              </div>

              <div className="flex items-center gap-3 shrink-0 text-right">
                <span className="text-[11px] font-semibold text-stone-500 hidden sm:inline">
                  {item.quantity} {prod?.format === 'granel' ? 'kg' : 'ud'} x {Number(item.unit_price).toFixed(2)} €
                </span>
                <span className="font-black text-stone-900 text-xs">
                  {Number(subtotal).toFixed(2)} €
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // VISTA MEDIANA (POR DEFECTO)
  return (
    <div className="space-y-2">
      {items.map((item) => {
        const prod = item.products;
        const subtotal = item.subtotal ?? item.quantity * item.unit_price;

        return (
          <div
            key={item.id}
            className="flex items-center justify-between text-xs bg-white p-2.5 rounded-2xl border border-stone-200 shadow-2xs gap-2"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {prod?.image_url ? (
                <img
                  src={prod.image_url}
                  alt={prod.name || 'Producto'}
                  className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200 font-bold shrink-0 text-sm">
                  🌿
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-black text-stone-900 block truncate leading-tight">
                    {prod?.name || 'Producto'}
                  </span>
                  <DeliveryMethodsBadges deliveryMethods={prod?.delivery_methods} />
                </div>
                <span className="text-[11px] font-bold text-stone-500 block mt-0.5">
                  {item.quantity} {prod?.format === 'granel' ? 'kg' : 'ud(s)'} x {Number(item.unit_price).toFixed(2)} €
                </span>
              </div>
            </div>

            <span className="font-black text-stone-900 text-xs shrink-0 bg-stone-50 px-2.5 py-1.5 rounded-xl border border-stone-200">
              {Number(subtotal).toFixed(2)} €
            </span>
          </div>
        );
      })}
    </div>
  );
}
