import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Store, MessageCircle, Calendar, Phone, Truck, Clock } from 'lucide-react';
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
      profiles!orders_buyer_id_fkey(id, full_name, town, address, phone, avatar_url),
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
                  {/* 1. Foto a la izquierda + Nombre, Pueblo, Teléfono, Chat (en 4 líneas) + Estado del Pedido a la derecha */}
                  <div className="flex items-center justify-between gap-3 pb-3 border-b border-amber-200">
                    <div className="flex items-center gap-3.5 min-w-0">
                      {order.profiles?.avatar_url ? (
                        <img
                          src={order.profiles.avatar_url}
                          alt={order.profiles.full_name || 'Cliente'}
                          className="w-20 h-20 rounded-2xl object-cover border border-amber-300 shrink-0 shadow-sm"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-amber-200 text-amber-950 font-black text-xl flex items-center justify-center border border-amber-300 shrink-0">
                          {order.profiles?.full_name?.charAt(0) || 'U'}
                        </div>
                      )}

                      <div className="flex flex-col justify-center min-w-0 space-y-0.5 text-xs">
                        {/* Línea 1: Nombre */}
                        <span className="text-sm sm:text-base font-black text-stone-900 leading-tight truncate">
                          {order.profiles?.full_name}
                        </span>

                        {/* Línea 2: Pueblo */}
                        <span className="text-xs font-bold text-stone-700 truncate">
                          {order.profiles?.town || 'Ubicación no especificada'}
                        </span>

                        {/* Línea 3: Teléfono */}
                        <div className="text-xs font-bold text-stone-700 truncate">
                          {order.profiles?.phone ? (
                            <a
                              href={`tel:${order.profiles.phone}`}
                              className="inline-flex items-center gap-1 hover:text-emerald-800 transition-colors"
                              title="Llamar al cliente"
                            >
                              <Phone className="w-3 h-3 text-stone-500" />
                              <span>{order.profiles.phone}</span>
                            </a>
                          ) : (
                            <span className="text-stone-500 italic">Sin teléfono</span>
                          )}
                        </div>

                        {/* Línea 4: Chat */}
                        <div className="pt-0.5">
                          <Link
                            href={`/chat/${order.profiles?.id}`}
                            className="inline-flex items-center gap-1 text-amber-950 hover:bg-amber-200 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-300 transition-colors font-black text-[11px]"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>Chat</span>
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Estado a la derecha ocupando dos alturas */}
                    <div className="h-12 sm:h-14 px-3 sm:px-4 flex items-center justify-center rounded-2xl border border-amber-300 bg-amber-100 text-amber-950 shadow-sm text-xs sm:text-sm font-black uppercase tracking-wider text-center shrink-0">
                      POR VALIDAR
                    </div>
                  </div>

                  {/* 2, 3: Información estructurada de Pedido realizado y Recuadro de Entrega */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-bold text-stone-800 bg-white p-3.5 rounded-2xl border border-amber-200 shadow-inner">
                    {/* Pedido realizado: con día de la semana */}
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <Clock className="w-4 h-4 text-stone-500 shrink-0" />
                      <span>
                        <strong className="text-stone-900">Pedido realizado:</strong>{' '}
                        <span className="capitalize font-semibold text-stone-800">
                          {new Date(order.created_at).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </span>
                    </div>

                    {/* RECUADRO DE ENTREGA / ENVÍO */}
                    <div className="sm:col-span-2 bg-emerald-100/70 p-3.5 rounded-2xl border border-emerald-300 space-y-2 text-emerald-950">
                      <div className="flex items-start gap-2">
                        {order.delivery_points ? (
                          <>
                            <Store className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <strong className="text-stone-900 block">Punto de entrega:</strong>
                              <p className="text-stone-800 font-semibold">
                                {order.delivery_points.name} — {order.delivery_points.address_details} ({order.delivery_points.town})
                              </p>
                              {(order.delivery_points.opening_time || order.delivery_points.schedule_notes) && (
                                <p className="text-[11px] text-emerald-900 font-bold">
                                  🕒 Horario:{' '}
                                  {order.delivery_points.opening_time && order.delivery_points.closing_time
                                    ? `de ${order.delivery_points.opening_time} a ${order.delivery_points.closing_time}`
                                    : order.delivery_points.schedule_notes}
                                </p>
                              )}
                            </div>
                          </>
                        ) : order.shipping_address ? (
                          <>
                            <Truck className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <strong className="text-stone-900 block">Envío a domicilio:</strong>
                              <p className="text-stone-800 font-semibold">{order.shipping_address}</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <Store className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <strong className="text-stone-900 block">Recogida caserío:</strong>
                              <p className="text-stone-800 font-semibold">En las instalaciones de tu caserío</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 4. Los productos y total de productos */}
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
                        {Number(order.total_amount).toFixed(2)} €
                      </span>
                    </div>
                  </div>

                  {/* Formulario de Confirmación y Fecha de Entrega */}
                  <ConfirmOrderForm
                    orderId={order.id}
                    defaultDateStr={defaultDateStr}
                    buyerName={order.profiles?.full_name}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECCIÓN 2: PEDIDOS ACTIVOS Y VALIDADOS */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-stone-900">
          Pedidos Validados y en Curso ({activeOrders.length})
        </h2>

        {activeOrders.length > 0 ? (
          <div className="space-y-4">
            {activeOrders.map((order) => (
              <SellerActiveOrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border-2 border-stone-200 p-8 text-center space-y-2">
            <Store className="w-8 h-8 text-stone-300 mx-auto" />
            <p className="text-xs font-bold text-stone-600">
              No tienes pedidos activos en curso.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}