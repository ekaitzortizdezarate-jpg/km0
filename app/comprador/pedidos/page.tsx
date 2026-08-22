import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { RefreshCw, Store, MessageCircle, Calendar, Clock, CheckCircle2, Truck, Phone } from 'lucide-react';
import Link from 'next/link';
import ReviewForm from '@/components/ReviewForm';
import { CancelOrderButton } from '@/components/CancelOrderButton';
import { DeliveryMethodsBadges } from '@/components/DeliveryMethodsBadges';

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
      profiles!orders_seller_id_fkey(id, full_name, town, address, phone, avatar_url),
      delivery_points(name, town, address_details, opening_time, closing_time, schedule_notes),
      order_items(*, products(id, name, format, image_url, delivery_methods))
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
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      {/* Cabecera */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border-2 border-stone-200 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900">Mis Compras</h1>
          <p className="text-xs font-bold text-stone-600 mt-0.5">
            Historial de pedidos, validaciones de caseríos y fechas confirmadas de entrega
          </p>
        </div>

        <Link
          href="/cesta"
          className="inline-flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-900 font-black text-xs px-3.5 py-2 rounded-xl border border-stone-300 transition-colors shadow-sm"
        >
          <span>Ver mi Cesta</span>
        </Link>
      </div>

      {/* Lista de Pedidos */}
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
                {/* 1. Foto a la izquierda + Nombre, Pueblo, Teléfono, Chat (en 4 líneas) + Estado del Pedido a la derecha */}
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-3.5 min-w-0">
                    {order.profiles?.avatar_url ? (
                      <img
                        src={order.profiles.avatar_url}
                        alt={order.profiles.full_name || 'Vendedor'}
                        className="w-20 h-20 rounded-2xl object-cover border border-stone-200 shrink-0 shadow-sm"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-xl flex items-center justify-center border border-emerald-300 shrink-0">
                        {order.profiles?.full_name?.charAt(0) || 'C'}
                      </div>
                    )}

                    <div className="flex flex-col justify-center min-w-0 space-y-0.5 text-xs">
                      {/* Línea 1: Nombre */}
                      <span className="text-sm sm:text-base font-black text-stone-900 leading-tight truncate">
                        {order.profiles?.full_name}
                      </span>

                      {/* Línea 2: Pueblo */}
                      <span className="text-xs font-bold text-stone-600 truncate">
                        {order.profiles?.town || 'Ubicación no especificada'}
                      </span>

                      {/* Línea 3: Teléfono */}
                      <div className="text-xs font-bold text-stone-600 truncate">
                        {order.profiles?.phone ? (
                          <a
                            href={`tel:${order.profiles.phone}`}
                            className="inline-flex items-center gap-1 hover:text-emerald-800 transition-colors"
                            title="Llamar por teléfono"
                          >
                            <Phone className="w-3 h-3 text-stone-400" />
                            <span>{order.profiles.phone}</span>
                          </a>
                        ) : (
                          <span className="text-stone-400 italic">Sin teléfono</span>
                        )}
                      </div>

                      {/* Línea 4: Chat */}
                      <div className="pt-0.5">
                        <Link
                          href={`/chat/${order.profiles?.id}`}
                          className="inline-flex items-center gap-1 text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200 transition-colors font-black text-[11px]"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>Chat</span>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Estado del Pedido a la derecha ocupando dos alturas */}
                  <div className="flex flex-col items-end shrink-0 gap-1">
                    <div
                      className={`h-12 sm:h-14 px-3 sm:px-4 flex items-center justify-center rounded-2xl border shadow-sm text-xs sm:text-sm font-black uppercase tracking-wider text-center ${
                        statusColors[order.status] || 'bg-stone-100 text-stone-900 border-stone-300'
                      }`}
                    >
                      {statusLabels[order.status] || order.status.toUpperCase()}
                    </div>
                    {order.is_recurring && (
                      <span className="flex items-center gap-1 text-[9px] font-black bg-emerald-100 text-emerald-950 border border-emerald-300 px-2 py-0.5 rounded-full">
                        <RefreshCw className="w-2.5 h-2.5" /> Recurrente ({order.recurrence_interval_days}d)
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. Información estructurada de Pedido realizado, validado, y recuadro verde con Fecha de Entrega + Tipo de Envío */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-bold text-stone-800 bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
                  {/* Pedido realizado */}
                  <div className="flex items-center gap-2">
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

                  {/* Pedido validado */}
                  {isValidated ? (
                    <div className="flex items-center gap-2 text-emerald-950">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>
                        <strong className="text-stone-900">Pedido validado:</strong>{' '}
                        <span className="capitalize font-semibold text-stone-800">
                          {new Date(order.updated_at || order.created_at).toLocaleDateString('es-ES', {
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
                  ) : (
                    <div className="flex items-center gap-2 text-stone-400">
                      <Clock className="w-4 h-4 text-stone-400 shrink-0" />
                      <span>
                        <strong className="text-stone-500">Pedido validado:</strong>{' '}
                        <span>Pendiente de validación por el caserío</span>
                      </span>
                    </div>
                  )}

                  {/* RECUADRO VERDE: Fecha de Entrega + Tipo de Envío/Entrega */}
                  <div className="sm:col-span-2 bg-emerald-100/70 p-3.5 rounded-2xl border border-emerald-300 space-y-2.5 text-emerald-950">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-800 shrink-0" />
                      <span>
                        <strong className="text-stone-900">Fecha entrega:</strong>{' '}
                        {order.estimated_delivery_date ? (
                          <span className="capitalize font-black text-emerald-950">
                            {new Date(order.estimated_delivery_date).toLocaleDateString('es-ES', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                        ) : (
                          <span className="font-semibold text-stone-700">Pendiente de confirmación</span>
                        )}
                        {order.delivery_points ? (
                          order.delivery_points.opening_time && order.delivery_points.closing_time ? (
                            <span className="font-bold ml-1.5 text-emerald-900">
                              (de {order.delivery_points.opening_time} a {order.delivery_points.closing_time})
                            </span>
                          ) : order.delivery_points.schedule_notes ? (
                            <span className="font-bold ml-1.5 text-emerald-900">
                              ({order.delivery_points.schedule_notes})
                            </span>
                          ) : null
                        ) : null}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-emerald-200/80 flex items-start gap-2 text-xs">
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
                            <strong className="text-stone-900 block">Envío:</strong>
                            <p className="text-stone-800 font-semibold">{order.shipping_address}</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <Store className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <strong className="text-stone-900 block">Recogida caserío:</strong>
                            <p className="text-stone-800 font-semibold">
                              {order.profiles?.address ? `${order.profiles.address}, ` : ''}{order.profiles?.town || 'Caserío del productor'}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Si está pendiente, botón para cancelar el pedido */}
                {order.status === 'pendiente' && (
                  <div className="flex justify-end pt-1">
                    <CancelOrderButton orderId={order.id} />
                  </div>
                )}

                {/* 3. Lista de productos: justo debajo de la imagen, entre el nombre y el precio los 3 iconos de entrega */}
                <div className="space-y-2.5 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                  <span className="text-[11px] font-black text-stone-500 uppercase tracking-wider block">
                    Productos ({totalProductItems} {totalProductItems === 1 ? 'línea' : 'líneas'}, {totalProductQty} uds/kg):
                  </span>

                  <div className="space-y-2">
                    {order.order_items?.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-xs bg-white p-3 rounded-2xl border border-stone-200 shadow-2xs gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Imagen */}
                          <div className="shrink-0">
                            {item.products?.image_url ? (
                              <img
                                src={item.products.image_url}
                                alt={item.products?.name || 'Producto'}
                                className="w-14 h-14 rounded-xl object-cover border border-stone-200 shrink-0 shadow-2xs"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200 font-bold shrink-0 text-base">
                                🌿
                              </div>
                            )}
                          </div>

                          {/* Nombre del producto con los 3 iconos a la derecha */}
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                              <span className="font-black text-stone-900 text-xs sm:text-sm leading-tight">
                                {item.products?.name || 'Producto'}
                              </span>
                              <DeliveryMethodsBadges deliveryMethods={item.products?.delivery_methods} />
                            </div>

                            {/* Cantidad y precio unitario */}
                            <span className="text-[11px] font-bold text-stone-500 block">
                              {item.quantity} {item.products?.format === 'granel' ? 'kg' : 'ud(s)'} x {Number(item.unit_price).toFixed(2)} €
                            </span>
                          </div>
                        </div>

                        {/* Subtotal del producto */}
                        <div className="text-right shrink-0">
                          <span className="font-black text-stone-900 text-sm block">
                            {Number(item.subtotal ?? item.quantity * item.unit_price).toFixed(2)} €
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-stone-200 text-sm font-black text-stone-900">
                    <span>Total del Pedido:</span>
                    <span className="text-base text-emerald-950 font-black">
                      {Number(order.total_amount).toFixed(2)} €
                    </span>
                  </div>
                </div>

                {/* Si está entregado, formulario para valorar al vendedor */}
                {order.status === 'entregado' && (
                  <div className="pt-2 border-t border-stone-100">
                    <ReviewForm
                      orderId={order.id}
                      targetId={order.seller_id}
                    />
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-3xl border-2 border-stone-200 p-12 text-center space-y-3 shadow-sm">
            <Store className="w-12 h-12 text-stone-300 mx-auto" />
            <h3 className="text-base font-black text-stone-900">Aún no has realizado pedidos</h3>
            <p className="text-xs font-semibold text-stone-500 max-w-sm mx-auto">
              Explora el mercado de caseríos locales y añade productos a tu cesta.
            </p>
            <Link
              href="/"
              className="inline-block bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm"
            >
              Ir al Mercado
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}