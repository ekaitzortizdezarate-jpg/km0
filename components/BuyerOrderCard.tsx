'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  RefreshCw,
  Store,
  MapPin,
  MessageCircle,
  Calendar,
  Clock,
  CheckCircle2,
  Truck,
  Phone,
  Bell,
} from 'lucide-react';
import ReviewForm from '@/components/ReviewForm';
import { CancelOrderButton } from '@/components/CancelOrderButton';
import { DeliveryMethodsBadges } from '@/components/DeliveryMethodsBadges';
import { isOrderUnreadForRole, markOrderAsRead } from '@/lib/order-read-tracker';

interface BuyerOrderCardProps {
  order: any;
}

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

export function BuyerOrderCard({ order }: BuyerOrderCardProps) {
  const [unread, setUnread] = useState(false);

  useEffect(() => {
    const isUpdated = isOrderUnreadForRole(order, 'comprador');
    setUnread(isUpdated);
  }, [order.id, order.status, order.updated_at, order.created_at]);

  const handleMarkRead = () => {
    markOrderAsRead(order.id, order.updated_at || order.created_at);
    setUnread(false);
  };

  const totalProductItems = order.order_items?.length || 0;
  const totalProductQty =
    order.order_items?.reduce(
      (acc: number, it: any) => acc + Number(it.quantity || 0),
      0
    ) || 0;

  const isValidated = order.status !== 'pendiente' && order.status !== 'cancelado';

  return (
    <div
      className={`rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 transition-all duration-300 ${
        unread
          ? 'bg-amber-50/50 border-2 border-amber-400 ring-4 ring-amber-400/30 shadow-md'
          : 'bg-white border-2 border-stone-200'
      }`}
    >
      {/* Barra de Aviso de Actualización con Botón 'Leído' */}
      {unread && (
        <div className="flex items-center justify-between gap-3 p-3 bg-amber-100 border-2 border-amber-300 rounded-2xl text-amber-950 animate-fadeIn">
          <div className="flex items-center gap-2 text-xs font-black">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            <Bell className="w-4 h-4 text-amber-800 shrink-0" />
            <span>Actualización en este pedido ({statusLabels[order.status] || order.status})</span>
          </div>
          <button
            type="button"
            onClick={handleMarkRead}
            className="bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-black text-xs px-3.5 py-1.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5 hover:scale-105 shrink-0"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Leído</span>
          </button>
        </div>
      )}

      {/* 1. Cabecera: Estado ENCIMA de la foto (anchura de la imagen) + Datos (Nombre, Pueblo, Teléfono, Chat) a la derecha */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-stone-100">
        <div className="flex items-start gap-3 sm:gap-3.5 min-w-0">
          {/* Bloque Izquierdo: Estado arriba + Imagen abajo (misma anchura) */}
          <div className="flex flex-col items-center gap-1.5 w-20 sm:w-24 shrink-0">
            {/* Estado del pedido encima de la foto */}
            <div
              className={`w-full py-1 px-1 rounded-xl border text-[10px] sm:text-[11px] font-black uppercase tracking-tight text-center leading-tight shadow-2xs ${
                statusColors[order.status] || 'bg-stone-100 text-stone-900 border-stone-300'
              }`}
            >
              {statusLabels[order.status] || order.status.toUpperCase()}
            </div>

            {/* Foto */}
            {order.profiles?.avatar_url ? (
              <img
                src={order.profiles.avatar_url}
                alt={order.profiles.full_name || 'Vendedor'}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-stone-200 shadow-sm"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-xl flex items-center justify-center border border-emerald-300 shadow-sm">
                {order.profiles?.full_name?.charAt(0) || 'C'}
              </div>
            )}
          </div>

          {/* Bloque Derecho: Nombre, Pueblo, Teléfono, Chat */}
          <div className="flex flex-col justify-center min-w-0 space-y-1 text-xs pt-0.5">
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
                className="inline-flex items-center gap-1 text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors font-black text-[11px]"
              >
                <MessageCircle className="w-3 h-3" />
                <span>Chat</span>
              </Link>
            </div>
          </div>
        </div>

        {order.is_recurring && (
          <span className="flex items-center gap-1 text-[9px] font-black bg-emerald-100 text-emerald-950 border border-emerald-300 px-2 py-0.5 rounded-full shrink-0">
            <RefreshCw className="w-2.5 h-2.5" /> Recurrente ({order.recurrence_interval_days}d)
          </span>
        )}
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
                <MapPin className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
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
            ) : order.shipping_address && order.shipping_address !== 'Recogida directa en Caserío' ? (
              <>
                <Truck className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <strong className="text-stone-900 block">Envío:</strong>
                  <p className="text-stone-800 font-semibold">{order.shipping_address.replace(/^Para:\s*/i, '')}</p>
                </div>
              </>
            ) : (
              <>
                <Store className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <strong className="text-stone-900 block">Recogida en Caserío:</strong>
                  <p className="text-stone-800 font-semibold">
                    {order.profiles?.address
                      ? `${order.profiles.address} (${order.profiles.town})`
                      : `En caserío del productor (${order.profiles?.town})`}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 3. Lista de Productos del Pedido */}
      <div className="space-y-2 pt-1">
        <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider block">
          Productos del pedido ({totalProductItems} {totalProductItems === 1 ? 'producto' : 'productos'} · {totalProductQty.toFixed(1)} uds/kg):
        </span>

        <div className="space-y-2">
          {order.order_items?.map((item: any) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-stone-50 hover:bg-stone-100/80 rounded-2xl border border-stone-200 text-xs transition-colors gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                {item.products?.image_url ? (
                  <img
                    src={item.products.image_url}
                    alt={item.products.name}
                    className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0 shadow-2xs"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-stone-200 text-stone-600 flex items-center justify-center shrink-0 font-black">
                    {item.products?.name?.charAt(0) || 'P'}
                  </div>
                )}

                <div className="min-w-0">
                  <h4 className="font-extrabold text-stone-900 text-xs sm:text-sm truncate">
                    {item.products?.name || 'Producto de caserío'}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5 text-stone-600 font-bold text-[11px]">
                    <span>
                      {item.quantity} {item.products?.format === 'granel' ? 'kg' : 'uds'} × {item.unit_price.toFixed(2)} €
                    </span>
                    {item.products?.delivery_methods && (
                      <DeliveryMethodsBadges deliveryMethods={item.products.delivery_methods} />
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-sm font-black text-stone-900">
                  {(item.quantity * item.unit_price).toFixed(2)} €
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Importe Total y Acciones (Cancelar / Valorar) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t-2 border-stone-100">
        <div>
          <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider block">
            Importe Total del Pedido
          </span>
          <span className="text-xl font-black text-emerald-950">
            {Number(order.total_price || 0).toFixed(2)} €
          </span>
        </div>

        <div className="flex items-center gap-2">
          {order.status === 'pendiente' && (
            <CancelOrderButton orderId={order.id} />
          )}

          {order.status === 'entregado' && (
            <ReviewForm orderId={order.id} targetId={order.seller_id} />
          )}
        </div>
      </div>
    </div>
  );
}
