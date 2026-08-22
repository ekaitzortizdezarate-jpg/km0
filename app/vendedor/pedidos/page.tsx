import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Store, MessageCircle, Calendar, Phone, Truck } from 'lucide-react';
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
      profiles!orders_buyer_id_fkey(id, full_name, town, phone, avatar_url),
      delivery_points(name, town, address_details, opening_time, closing_time, schedule_notes),
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

              const totalProductItems = order.order_items?.length || 0;
              const totalProductQty =
                order.order_items?.reduce(
                  (acc: number, it: any) => acc + Number(it.quantity || 0),
                  0
                ) || 0;

              return (
                <div
                  key={order.id}
                  className="bg-amber-50/80 rounded-3xl border-2 border-amber-300 p-5 sm:p-6 shadow-sm space-y-4"
                >
                  {/* 1. Foto (ocupando dos líneas) + Nombre y población (arriba) + Teléfono y Chat (abajo) */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-amber-200">
                    <div className="flex items-center gap-3">
                      {order.profiles?.avatar_url ? (
                        <img
                          src={order.profiles.avatar_url}
                          alt={order.profiles.full_name || 'Cliente'}
                          className="w-12 h-12 rounded-2xl object-cover border border-amber-300 shrink-0 shadow-sm"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-amber-200 text-amber-950 font-black text-sm flex items-center justify-center border border-amber-300 shrink-0">
                          {order.profiles?.full_name?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div className="flex flex-col justify-center">
                        {/* Línea arriba: Nombre y población */}
                        <span className="text-sm sm:text-base font-black text-stone-900 leading-tight">
                          {order.profiles?.full_name} ({order.profiles?.town})
                        </span>
                        {/* Línea abajo: Teléfono y Chat */}
                        <div className="flex items-center gap-3 mt-1 text-xs font-bold text-stone-700">
                          {order.profiles?.phone ? (
                            <a
                              href={`tel:${order.profiles.phone}`}
                              className="flex items-center gap-1 hover:text-emerald-800 transition-colors"
                              title="Llamar al cliente"
                            >
                              <Phone className="w-3.5 h-3.5 text-stone-500" />
                              <span>{order.profiles.phone}</span>
                            </a>
                          ) : null}
                          <Link
                            href={`/chat/${order.profiles?.id}`}
                            className="inline-flex items-center gap-1 text-amber-950 hover:bg-amber-200 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-300 transition-colors font-black text-[11px]"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Chat</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. Estado del Pedido: Centrado y en MAYÚSCULAS */}
                  <div className="flex justify-center py-0.5">
                    <span className="text-xs sm:text-sm font-black px-5 py-1.5 rounded-full border border-amber-300 bg-amber-100 text-amber-950 shadow-sm uppercase tracking-wider text-center">
                      POR VALIDAR
                    </span>
                  </div>

                  {/* 3, 5, 6: Información estructurada de Pedido realizado y Entrega */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-bold text-stone-800 bg-white p-3.5 rounded-2xl border border-amber-200 shadow-inner">
                    {/* 3. Pedido realizado: */}
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <Calendar className="w-4 h-4 text-stone-500 shrink-0" />
                      <span>
                        <strong className="text-stone-900">Pedido realizado:</strong>{' '}
                        {new Date(order.created_at).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* 6. Entrega: la opción de envio seleccionada y hora (la hora si no es envio a domicilio) */}
                    <div className="flex items-start gap-2 sm:col-span-2 pt-1 border-t border-stone-100">
                      {order.delivery_points ? (
                        <>
                          <Store className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                          <div>
                            <span>
                              <strong className="text-stone-900">Entrega:</strong> Punto de recogida en{' '}
                              <span className="font-semibold text-stone-700">
                                {order.delivery_points.name} ({order.delivery_points.address_details || order.delivery_points.town})
                              </span>
                            </span>
                            {(order.delivery_points.opening_time || order.delivery_points.schedule_notes) && (
                              <span className="block text-[11px] text-emerald-900 font-bold mt-0.5">
                                🕒 Hora:{' '}
                                {order.delivery_points.opening_time && order.delivery_points.closing_time
                                  ? `de ${order.delivery_points.opening_time} a ${order.delivery_points.closing_time}`
                                  : order.delivery_points.schedule_notes}
                              </span>
                            )}
                          </div>
                        </>
                      ) : order.shipping_address ? (
                        <>
                          <Truck className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                          <span>
                            <strong className="text-stone-900">Entrega:</strong> Envío a domicilio en{' '}
                            <span className="font-semibold text-stone-700">{order.shipping_address}</span>
                          </span>
                        </>
                      ) : (
                        <>
                          <Store className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                          <div>
                            <span>
                              <strong className="text-stone-900">Entrega:</strong> Recogida directa en tu caserío
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 7. Los productos y total de productos */}
                  <div className="space-y-2 bg-white p-3.5 rounded-2xl border border-amber-200 shadow-inner">
                    <span className="text-[11px] font-black text-stone-500 uppercase tracking-wider block">
                      Productos ({totalProductItems} {totalProductItems === 1 ? 'producto' : 'productos'}):
                    </span>

                    {order.order_items?.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 text-xs font-bold text-stone-900 bg-stone-50 p-2.5 rounded-xl border border-stone-200"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {item.products?.image_url ? (
                            <img
                              src={item.products.image_url}
                              alt={item.products?.name}
                              className="w-11 h-11 rounded-lg object-cover border border-stone-200 shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-800 font-black text-[10px] flex items-center justify-center border border-emerald-200 shrink-0">
                              km0
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-black text-stone-900 block truncate">
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

                    <div className="pt-2 mt-2 border-t border-stone-200 flex justify-between items-center text-xs font-black text-stone-900 px-1">
                      <span>
                        Total de productos: {totalProductQty} {order.order_items?.some((i: any) => i.products?.format === 'granel') ? 'uds/kg' : 'uds'}
                      </span>
                      <span className="text-base font-black text-emerald-900">
                        Total Cobro: {Number(order.total_amount).toFixed(2)} €
                      </span>
                    </div>
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
          <div className="text-center py-12 bg-white rounded-3xl border-2 border-stone-200 text-sm font-bold text-stone-600 p-6 space-y-2">
            <p>No tienes pedidos en curso ni históricos.</p>
          </div>
        )}
      </div>
    </div>
  );
}