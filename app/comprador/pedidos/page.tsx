import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { RefreshCw, Store, MessageCircle, Calendar, Clock, CheckCircle2, Truck, Phone } from 'lucide-react';
import Link from 'next/link';
import ReviewForm from '@/components/ReviewForm';
import { CancelOrderButton } from '@/components/CancelOrderButton';

export default async function BuyerOrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      profiles!orders_seller_id_fkey(id, full_name, town, phone, avatar_url),
      delivery_points(name, town, address_details, opening_time, closing_time, schedule_notes),
      order_items(*, products(id, name, format, image_url))
    `)
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false });

  const statusLabels: Record<string, string> = {
    pendiente: 'POR VALIDAR',
    confirmado: 'VALIDADO',
    preparando: 'PREPARANDO',
    listo_entrega: 'LISTO PARA ENTREGA',
    entregado: 'ENTREGADO',
    cancelado: 'CANCELADO',
  };

  const statusColors: Record<string, string> = {
    pendiente: 'bg-amber-100 text-amber-950 border-amber-300',
    confirmado: 'bg-emerald-100 text-emerald-950 border-emerald-300',
    preparando: 'bg-purple-100 text-purple-950 border-purple-300',
    listo_entrega: 'bg-blue-100 text-blue-950 border-blue-300',
    entregado: 'bg-stone-200 text-stone-900 border-stone-300',
    cancelado: 'bg-red-100 text-red-950 border-red-300',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-stone-900">Mis Compras</h1>
          <p className="text-xs font-bold text-stone-600 mt-0.5">
            Historial de pedidos, validaciones de caseríos y fechas confirmadas de entrega
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/cesta"
            className="inline-flex items-center gap-1.5 bg-white hover:bg-stone-100 text-stone-900 font-black text-xs px-3.5 py-2 rounded-xl border border-stone-300 transition-colors shadow-sm"
          >
            <span>Ver mi Cesta</span>
          </Link>
          <Link
            href="/comprador/calendario"
            className="inline-flex items-center gap-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-black text-xs px-3.5 py-2 rounded-xl border border-emerald-300 transition-colors shadow-sm"
          >
            <Calendar className="w-4 h-4 text-emerald-800" />
            <span>Ver en Calendario</span>
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {orders && orders.length > 0 ? (
          orders.map((order) => {
            const totalProductItems = order.order_items?.length || 0;
            const totalProductQty =
              order.order_items?.reduce(
                (acc: number, it: any) => acc + Number(it.quantity || 0),
                0
              ) || 0;

            const isValidated = order.status !== 'pendiente' && order.status !== 'cancelado';

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border-2 border-stone-200 p-5 sm:p-6 shadow-sm space-y-4"
              >
                {/* 1. Foto (ocupando dos líneas) + Nombre y población (arriba) + Teléfono y Chat (abajo) */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-3">
                    {order.profiles?.avatar_url ? (
                      <img
                        src={order.profiles.avatar_url}
                        alt={order.profiles.full_name || 'Vendedor'}
                        className="w-12 h-12 rounded-2xl object-cover border border-stone-200 shrink-0 shadow-sm"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center border border-emerald-300 shrink-0">
                        {order.profiles?.full_name?.charAt(0) || 'C'}
                      </div>
                    )}
                    <div className="flex flex-col justify-center">
                      {/* Línea arriba: Nombre y población */}
                      <span className="text-sm sm:text-base font-black text-stone-900 leading-tight">
                        {order.profiles?.full_name} ({order.profiles?.town})
                      </span>
                      {/* Línea abajo: Teléfono y Chat */}
                      <div className="flex items-center gap-3 mt-1 text-xs font-bold text-stone-600">
                        {order.profiles?.phone ? (
                          <a
                            href={`tel:${order.profiles.phone}`}
                            className="flex items-center gap-1 hover:text-emerald-800 transition-colors"
                            title="Llamar por teléfono"
                          >
                            <Phone className="w-3.5 h-3.5 text-stone-500" />
                            <span>{order.profiles.phone}</span>
                          </a>
                        ) : null}
                        <Link
                          href={`/chat/${order.profiles?.id}`}
                          className="inline-flex items-center gap-1 text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200 transition-colors font-black text-[11px]"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Chat</span>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {order.is_recurring && (
                    <span className="flex items-center gap-1 text-[10px] font-black bg-emerald-100 text-emerald-950 border border-emerald-300 px-2.5 py-1 rounded-full">
                      <RefreshCw className="w-3 h-3" /> Recurrente ({order.recurrence_interval_days}d)
                    </span>
                  )}
                </div>

                {/* 2. Estado del Pedido: Centrado y en MAYÚSCULAS */}
                <div className="flex justify-center py-0.5">
                  <span
                    className={`text-xs sm:text-sm font-black px-5 py-1.5 rounded-full border shadow-sm uppercase tracking-wider text-center ${
                      statusColors[order.status] || 'bg-stone-100 text-stone-900 border-stone-300'
                    }`}
                  >
                    {statusLabels[order.status] || order.status.toUpperCase()}
                  </span>
                </div>

                {/* 3, 4, 5, 6: Información estructurada de Pedido realizado, validado, fecha entrega y entrega */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-bold text-stone-800 bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
                  {/* 3. Pedido realizado: fecha y hora en la que se ha realizado */}
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-stone-500 shrink-0" />
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

                  {/* 4. Pedido validado: fecha en la que se ha validado por el vendedor (si ya lo está) */}
                  {isValidated && (
                    <div className="flex items-center gap-2 text-emerald-950">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>
                        <strong className="text-stone-900">Pedido validado:</strong>{' '}
                        {new Date(order.updated_at || order.created_at).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}

                  {/* 5. Fecha entrega: fecha en la que se hará la entrega (si está validado por el vendedor) */}
                  {isValidated && order.estimated_delivery_date && (
                    <div className="flex items-center gap-2 text-emerald-950 sm:col-span-2 bg-emerald-100/70 p-2.5 rounded-xl border border-emerald-300">
                      <Calendar className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>
                        <strong className="text-stone-900">Fecha entrega:</strong>{' '}
                        {new Date(order.estimated_delivery_date).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}

                  {/* 6. Entrega: la opción de envio seleccionada y hora (la hora si no es envio a domicilio) */}
                  <div className="flex items-start gap-2 sm:col-span-2 pt-1 border-t border-stone-200">
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
                            <strong className="text-stone-900">Entrega:</strong> Recogida directa en las instalaciones del caserío ({order.profiles?.town})
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Si está pendiente, botón para cancelar el pedido */}
                {order.status === 'pendiente' && (
                  <div className="flex justify-end pt-1">
                    <CancelOrderButton orderId={order.id} />
                  </div>
                )}

                {/* 7. Los productos y total de productos */}
                <div className="space-y-2 bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
                  <span className="text-[11px] font-black text-stone-500 uppercase tracking-wider block">
                    Productos ({totalProductItems} {totalProductItems === 1 ? 'producto' : 'productos'}):
                  </span>

                  {order.order_items?.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 text-xs font-bold text-stone-900 bg-white p-2.5 rounded-xl border border-stone-200"
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

                  <div className="pt-2 mt-2 border-t border-stone-300 flex justify-between items-center text-xs font-black text-stone-900 px-1">
                    <span>
                      Total de productos: {totalProductQty} {order.order_items?.some((i: any) => i.products?.format === 'granel') ? 'uds/kg' : 'uds'}
                    </span>
                    <span className="text-sm font-black text-emerald-950">
                      Total Pedido: {Number(order.total_amount).toFixed(2)} €
                    </span>
                  </div>
                </div>

                {order.status === 'entregado' && (
                  <div className="pt-2 border-t border-stone-100 flex justify-end">
                    <ReviewForm orderId={order.id} targetId={order.seller_id} />
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-white rounded-3xl border-2 border-stone-200 text-sm font-bold text-stone-700 p-6 space-y-3">
            <p>Aún no has realizado ningún pedido.</p>
            <Link
              href="/"
              className="inline-block bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm"
            >
              Explorar Mercado y Catálogo
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}