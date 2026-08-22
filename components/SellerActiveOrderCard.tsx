'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { updateOrderStatus, cancelActiveOrderWithReason } from '@/app/actions/order-status';
import type { OrderStatus } from '@/types/database';
import ReviewForm from '@/components/ReviewForm';

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
    <div className="bg-white rounded-3xl border-2 border-stone-200 p-5 sm:p-6 shadow-sm space-y-4">
      {/* 1. Foto (ocupando dos líneas) + Nombre y población (arriba) + Teléfono y Chat (abajo) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100">
        <div className="flex items-center gap-3">
          {order.profiles?.avatar_url ? (
            <img
              src={order.profiles.avatar_url}
              alt={order.profiles.full_name || 'Cliente'}
              className="w-12 h-12 rounded-2xl object-cover border border-stone-200 shrink-0 shadow-sm"
            />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center border border-emerald-300 shrink-0">
              {order.profiles?.full_name?.charAt(0) || 'U'}
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
                  title="Llamar al cliente"
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
            <RefreshCw className="w-3 h-3" /> Periódico ({order.recurrence_interval_days}d)
          </span>
        )}
      </div>

      {/* 2. Estado del Pedido: Centrado y en MAYÚSCULAS */}
      <div className="flex justify-center py-0.5">
        <span
          className={`text-xs sm:text-sm font-black px-5 py-1.5 rounded-full border shadow-sm uppercase tracking-wider text-center ${
            statusColors[currentStatus] || 'bg-stone-100 text-stone-900 border-stone-300'
          }`}
        >
          {statusLabels[currentStatus] || currentStatus.toUpperCase()}
        </span>
      </div>

      {/* 3, 4, 5, 6: Información estructurada de Pedido realizado, validado, fecha entrega y entrega */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-bold text-stone-800 bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
        {/* 3. Pedido realizado: fecha y hora con día de la semana */}
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-stone-500 shrink-0" />
          <span>
            <strong className="text-stone-900">Pedido realizado:</strong>{' '}
            <span className="capitalize">
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

        {/* 4. Pedido validado: fecha y hora con día de la semana */}
        {isValidated && (
          <div className="flex items-center gap-2 text-emerald-950">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              <strong className="text-stone-900">Pedido validado:</strong>{' '}
              <span className="capitalize">
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
        )}

        {/* 5. Fecha entrega: fecha en la que se hará la entrega (con hora si no es domicilio) */}
        {isValidated && order.estimated_delivery_date && (
          <div className="flex items-center gap-2 text-emerald-950 sm:col-span-2 bg-emerald-100/70 p-2.5 rounded-xl border border-emerald-300">
            <Calendar className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              <strong className="text-stone-900">Fecha entrega:</strong>{' '}
              <span className="capitalize">
                {new Date(order.estimated_delivery_date).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
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
        )}

        {/* 6. Entrega: Recogida caserío / Punto de entrega / Envío a domicilio */}
        <div className="flex items-start gap-2 sm:col-span-2 pt-1 border-t border-stone-200">
          {order.delivery_points ? (
            <>
              <Store className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <strong className="text-stone-900 block">Punto de entrega:</strong>
                <p className="text-stone-700 font-semibold">
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
                <p className="text-stone-700 font-semibold">{order.shipping_address}</p>
              </div>
            </>
          ) : (
            <>
              <Store className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <strong className="text-stone-900 block">Recogida caserío:</strong>
                <p className="text-stone-700 font-semibold">En las instalaciones de tu caserío</p>
              </div>
            </>
          )}
        </div>
      </div>

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

      {/* Selector de Estado interactivo + Botón Cancelar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <label className="text-xs font-black text-stone-800">Cambiar Estado:</label>
          <select
            value={currentStatus}
            disabled={loading}
            onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
            className="px-3 py-1.5 text-xs font-black border-2 border-stone-300 rounded-xl bg-white text-stone-900 uppercase focus:ring-2 focus:ring-emerald-600 focus:outline-none"
          >
            <option value="confirmado">VALIDADO</option>
            <option value="preparando">PREPARANDO</option>
            <option value="listo_entrega">LISTO PARA ENTREGA</option>
            <option value="entregado">ENTREGADO</option>
          </select>
          {loading && <span className="text-xs font-bold text-stone-400 animate-pulse">Actualizando...</span>}
          {statusUpdated && <span className="text-xs font-black text-emerald-800 flex items-center gap-1">✓ Guardado</span>}
        </div>

        {currentStatus !== 'entregado' && (
          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            className="text-xs font-black text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-xl transition-colors flex items-center gap-1 border border-red-200"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Cancelar Pedido</span>
          </button>
        )}
      </div>

      {currentStatus === 'entregado' && (
        <div className="pt-2 border-t border-stone-100 flex justify-end">
          <ReviewForm orderId={order.id} targetId={order.buyer_id} />
        </div>
      )}

      {/* MODAL DE CANCELACIÓN CON MOTIVO */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border-2 border-stone-200 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100">
              <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" /> Cancelar Pedido
              </h3>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs font-bold text-stone-700">
              ¿Estás seguro de cancelar este pedido? Se restablecerá el stock y se enviará una notificación con el motivo al comprador.
            </p>

            <form onSubmit={handleConfirmCancel} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-stone-900 mb-1">
                  Motivo de cancelación:
                </label>
                <textarea
                  required
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Ej. Incidencia climatológica que afecta a la cosecha..."
                  className="w-full text-xs font-semibold p-3 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 text-xs font-bold text-stone-700 hover:bg-stone-100 rounded-xl border border-stone-300"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={cancelling}
                  className="px-4 py-2 text-xs font-black text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-sm flex items-center gap-1"
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
