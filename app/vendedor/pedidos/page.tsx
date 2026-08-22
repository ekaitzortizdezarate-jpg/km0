import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Store, MapPin, MessageCircle, Calendar, Phone, Truck } from 'lucide-react';
import Link from 'next/link';
import { ConfirmOrderForm } from '@/components/ConfirmOrderForm';
import { SellerActiveOrderCard } from '@/components/SellerActiveOrderCard';

export default async function SellerOrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      profiles!orders_buyer_id_fkey(id, full_name, town, phone),
      delivery_points(name, address_details),
      order_items(*, products(id, name, format, image_url))
    `)
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false });

  const pendingOrders = orders?.filter((o) => o.status === 'pendiente') || [];
  const activeOrders = orders?.filter((o) => o.status !== 'pendiente') || [];

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-stone-900">Gestión de Pedidos de Caserío</h1>
          <p className="text-xs font-bold text-stone-600 mt-0.5">
            Valida las compras de tus clientes y confirma la fecha de entrega
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/vendedor/calendario"
            className="inline-flex items-center gap-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-black text-xs px-3.5 py-2 rounded-xl border border-emerald-300 transition-colors shadow-sm"
          >
            <Calendar className="w-4 h-4 text-emerald-800" />
            <span>Ver Calendario</span>
          </Link>
          <Link
            href="/vendedor/puntos-entrega"
            className="text-xs font-black text-stone-900 bg-white hover:bg-stone-100 border-2 border-stone-300 px-3.5 py-2 rounded-xl transition-colors shadow-sm"
          >
            Puntos de Entrega
          </Link>
        </div>
      </div>

      {/* SECCIÓN 1: PEDIDOS PENDIENTES DE VALIDAR POR EL VENDEDOR */}
      {pendingOrders.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
            <h2 className="text-lg font-black text-stone-900">
              Nuevos Pedidos por Validar ({pendingOrders.length})
            </h2>
          </div>

          <div className="space-y-4">
            {pendingOrders.map((order) => {
              const baseOrderDate = new Date(order.created_at);
              baseOrderDate.setDate(baseOrderDate.getDate() + 1);
              const defaultDateStr = order.estimated_delivery_date
                ? order.estimated_delivery_date.split('T')[0]
                : baseOrderDate.toISOString().split('T')[0];

              return (
                <div
                  key={order.id}
                  className="bg-amber-50/80 rounded-3xl border-2 border-amber-300 p-5 sm:p-6 shadow-sm space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-amber-200">
                    <div>
                      <span className="text-[10px] font-black uppercase bg-amber-200 text-amber-950 px-2 py-0.5 rounded-md">
                        Requiere tu confirmación
                      </span>
                      <h3 className="text-base font-black text-stone-900 mt-1">
                        Cliente: {order.profiles?.full_name} ({order.profiles?.town})
                      </h3>
                      {order.profiles?.phone && (
                        <p className="text-xs font-bold text-stone-700 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-stone-500" /> {order.profiles?.phone}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/chat/${order.profiles?.id}`}
                        className="p-2 bg-white hover:bg-stone-100 text-stone-900 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors border border-stone-300 shadow-sm"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> Chat
                      </Link>
                    </div>
                  </div>

                  {/* Productos con Imagen */}
                  <div className="space-y-2 bg-white p-3.5 rounded-2xl border border-amber-200 shadow-inner">
                    {order.order_items?.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 text-xs font-bold text-stone-900 bg-stone-50 p-2.5 rounded-xl border border-stone-200"
                      >
                        <div className="flex items-center gap-2.5">
                          {item.products?.image_url ? (
                            <img
                              src={item.products.image_url}
                              alt={item.products?.name}
                              className="w-10 h-10 rounded-lg object-cover border border-stone-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-800 font-black text-[10px] flex items-center justify-center border border-emerald-200 shrink-0">
                              km0
                            </div>
                          )}
                          <div>
                            <span className="font-black text-stone-900 block">
                              {item.products?.name}
                            </span>
                            <span className="text-[11px] font-semibold text-stone-500">
                              {item.quantity} {item.products?.format === 'granel' ? 'kg' : 'uds'}
                            </span>
                          </div>
                        </div>

                        <span className="font-black text-stone-900 text-xs shrink-0">
                          {Number(item.subtotal).toFixed(2)} €
                        </span>
                      </div>
                    ))}
                    <div className="pt-2 mt-2 border-t border-stone-200 flex justify-between text-xs font-black text-stone-900 px-1">
                      <span>Total Cobro</span>
                      <span className="text-base font-black text-emerald-900">
                        {Number(order.total_amount).toFixed(2)} €
                      </span>
                    </div>
                  </div>

                  {/* Lugar de Entrega */}
                  <div className="text-xs font-semibold text-stone-800 bg-white p-3 rounded-xl border border-amber-200 flex items-center gap-2">
                    {order.delivery_points ? (
                      <>
                        <Store className="w-4 h-4 text-emerald-800 shrink-0" />
                        <span>
                          Recogida en: <strong>{order.delivery_points.name}</strong> ({order.delivery_points.address_details})
                        </span>
                      </>
                    ) : (
                      <>
                        <Truck className="w-4 h-4 text-emerald-800 shrink-0" />
                        <span>
                          Envío: <strong>{order.shipping_address}</strong>
                        </span>
                      </>
                    )}
                  </div>

                  {/* Formulario de Validación y Confirmación de Fecha */}
                  <ConfirmOrderForm
                    orderId={order.id}
                    defaultDateStr={defaultDateStr}
                    buyerName={order.profiles?.full_name || 'el cliente'}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECCIÓN 2: HISTORIAL Y PEDIDOS CONFIRMADOS / EN CURSO */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-stone-900">
          Pedidos Activos e Histórico ({activeOrders.length})
        </h2>

        {activeOrders.length > 0 ? (
          <div className="space-y-4">
            {activeOrders.map((order) => (
              <SellerActiveOrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-3xl border-2 border-stone-200 text-xs font-bold text-stone-500 p-6">
            No tienes pedidos activos o validados actualmente.
          </div>
        )}
      </div>
    </div>
  );
}