'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MessageCircle,
  Phone,
  Clock,
  Store,
  MapPin,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Truck,
  Calendar,
  Bell,
} from 'lucide-react';
import { updateOrderStatus, cancelActiveOrderWithReason } from '@/app/actions/order-status';
import type { OrderStatus } from '@/types/database';
import ReviewForm from '@/components/ReviewForm';
import { DeliveryMethodsBadges } from '@/components/DeliveryMethodsBadges';
import { isOrderUnreadForRole, markOrderAsRead } from '@/lib/order-read-tracker';

interface SellerActiveOrderCardProps {
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

export function SellerActiveOrderCard({ order }: SellerActiveOrderCardProps) {
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(order.status);
  const [loading, setLoading] = useState(false);
  const [statusUpdated, setStatusUpdated] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [unread, setUnread] = useState(false);

  useEffect(() => {
    const isUpdated = isOrderUnreadForRole(order, 'vendedor');
    setUnread(isUpdated);
  }, [order.id, order.status, order.updated_at, order.created_at]);

  const handleMarkRead = () => {
    markOrderAsRead(order.id, order.updated_at || order.created_at);
    setUnread(false);
  };

  if (deleted) return null;

  const handleStatusChange = async (newStatus: OrderStatus) => {
    setCurrentStatus(newStatus);
    setLoading(true);
    setStatusUpdated(false);

    const res = await updateOrderStatus(order.id, newStatus);
    setLoading(false);
    if (res.success) {
      setStatusUpdated(true);
      setTimeout(() => setStatusUpdated(false), 2500);
    }
  };

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    setCancelling(true);

    const res = await cancelActiveOrderWithReason(order.id, cancelReason);
    setCancelling(false);

    if (res.success) {
      setShowCancelModal(false);
      setDeleted(true);
    } else {
      alert(res.error || 'Error al cancelar el pedido');
    }
  };

  const totalProductItems = order.order_items?.length || 0;
  const totalProductQty =
    order.order_items?.reduce(
      (acc: number, it: any) => acc + Number(it.quantity || 0),
      0
    ) || 0;

  const isValidated = currentStatus !== 'pendiente' && currentStatus !== 'cancelado';

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
            <span>Actualización en este pedido ({statusLabels[currentStatus] || currentStatus})</span>
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
                statusColors[currentStatus] || 'bg-stone-100 text-stone-900 border-stone-300'
              }`}
            >
              {statusLabels[currentStatus] || currentStatus.toUpperCase()}
            </div>

            {/* Foto */}
            {order.profiles?.avatar_url ? (
              <img
                src={order.profiles.avatar_url}
                alt={order.profiles.full_name || 'Cliente'}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-stone-200 shadow-sm"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-xl flex items-center justify-center border border-emerald-300 shadow-sm">
                {order.profiles?.full_name?.charAt(0) || 'U'}
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
                  title="Llamar al cliente"
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
              <span>Pendiente de validación</span>
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
                <span className="font-semibold text-stone-700">Por definir</span>
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
                <strong className="text-stone-900 block">Recogida en caserío</strong>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 3. Los productos y total de productos con los 3 iconos de entrega entre el nombre y el precio */}
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

      {/* Acciones de Cambio de Estado y Cancelar Pedido */}
      {statusUpdated && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>¡Estado del pedido actualizado con éxito!</span>
        </div>
      )}

      {currentStatus !== 'entregado' && currentStatus !== 'cancelado' && (
        <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-black text-stone-600 mr-1">Cambiar estado:</span>
            {currentStatus === 'confirmado' && (
              <button
                type="button"
                disabled={loading}
                onClick={() => handleStatusChange('preparando')}
                className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-950 font-black text-xs rounded-xl border border-purple-300 transition-colors"
              >
                {loading ? '...' : 'Pasar a Preparando'}
              </button>
            )}
            {currentStatus === 'preparando' && (
              <button
                type="button"
                disabled={loading}
                onClick={() => handleStatusChange('listo_entrega')}
                className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-950 font-black text-xs rounded-xl border border-blue-300 transition-colors"
              >
                {loading ? '...' : 'Listo para Entrega'}
              </button>
            )}
            {currentStatus === 'listo_entrega' && (
              <button
                type="button"
                disabled={loading}
                onClick={() => handleStatusChange('entregado')}
                className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-900 font-black text-xs rounded-xl border border-stone-400 transition-colors"
              >
                {loading ? '...' : 'Marcar como Entregado'}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            className="flex items-center gap-1 text-xs font-bold text-red-700 hover:text-red-900 hover:bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-200 transition-colors ml-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Cancelar Pedido</span>
          </button>
        </div>
      )}

      {/* Modal de Cancelación con Motivo */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border-2 border-red-200 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2 text-red-700 font-black text-sm">
                <AlertCircle className="w-5 h-5" />
                <span>Cancelar Pedido #{order.id.slice(0, 8)}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCancel} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-stone-800 mb-1">
                  Motivo de cancelación para el comprador <span className="text-red-600">*</span>:
                </label>
                <textarea
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Ej: Falta de stock por inclemencias del tiempo, producto no disponible..."
                  rows={3}
                  className="w-full p-3 bg-stone-50 border-2 border-stone-300 rounded-xl text-xs font-bold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-red-600 shadow-inner"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={cancelling || !cancelReason.trim()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  {cancelling ? 'Cancelando...' : 'Confirmar Cancelación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
