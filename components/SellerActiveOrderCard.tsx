'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  MessageCircle,
  Phone,
  Clock,
  Store,
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
      {/* 1. Foto (ocupando dos líneas) + Nombre y población (arriba) + Teléfono y Chat (abajo) + ESTADO (derecha, 2 alturas) */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-stone-100">
        <div className="flex items-center gap-3 min-w-0">
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
          <div className="flex flex-col justify-center min-w-0">
            {/* Línea arriba: Nombre y población */}
            <span className="text-sm sm:text-base font-black text-stone-900 leading-tight truncate">
              {order.profiles?.full_name} ({order.profiles?.town})
            </span>
            {/* Línea abajo: Teléfono y Chat */}
            <div className="flex items-center gap-2.5 mt-1 text-xs font-bold text-stone-600">
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

        {/* Estado del Pedido a la derecha ocupando dos alturas */}
        <div className="flex flex-col items-end shrink-0 gap-1">
          <div
            className={`h-12 px-3 sm:px-4 flex items-center justify-center rounded-2xl border shadow-sm text-xs sm:text-sm font-black uppercase tracking-wider text-center ${
              statusColors[currentStatus] || 'bg-stone-100 text-stone-900 border-stone-300'
            }`}
          >
            {statusLabels[currentStatus] || currentStatus.toUpperCase()}
          </div>
          {order.is_recurring && (
            <span className="flex items-center gap-1 text-[9px] font-black bg-emerald-100 text-emerald-950 border border-emerald-300 px-2 py-0.5 rounded-full">
              <RefreshCw className="w-2.5 h-2.5" /> Periódico ({order.recurrence_interval_days}d)
            </span>
          )}
        </div>
      </div>

      {/* 2, 3, 4: Información estructurada de Pedido realizado, validado, y recuadro verde con Fecha de Entrega + Tipo de Envío */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-bold text-stone-800 bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
        {/* Pedido realizado: fecha y hora con día de la semana */}
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

        {/* Pedido validado: fecha y hora con día de la semana (si ya lo está) */}
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

      {/* 5. Los productos y total de productos */}
      <div className="space-y-2.5 bg-stone-50 p-4 rounded-2xl border border-stone-200">
        <span className="text-[11px] font-black text-stone-500 uppercase tracking-wider block">
          Productos ({totalProductItems} {totalProductItems === 1 ? 'línea' : 'líneas'}, {totalProductQty} uds/kg):
        </span>
        <div className="space-y-2">
          {order.order_items?.map((item: any) => (
            <div
              key={item.id}
              className="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl border border-stone-200 shadow-sm"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {item.products?.image_url ? (
                  <img
                    src={item.products.image_url}
                    alt={item.products.name}
                    className="w-10 h-10 rounded-xl object-cover border border-stone-200 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200 font-bold shrink-0">
                    🌿
                  </div>
                )}
                <div className="min-w-0">
                  <span className="font-black text-stone-900 block truncate">
                    {item.products?.name}
                  </span>
                  <span className="text-[11px] font-semibold text-stone-500">
                    {item.quantity} {item.products?.format === 'granel' ? 'kg' : 'ud(s)'} x {Number(item.unit_price).toFixed(2)} €
                  </span>
                </div>
              </div>
              <span className="font-black text-sm text-stone-900 shrink-0 ml-2">
                {Number(item.subtotal).toFixed(2)} €
              </span>
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
                Marcar: Preparando
              </button>
            )}
            {(currentStatus === 'confirmado' || currentStatus === 'preparando') && (
              <button
                type="button"
                disabled={loading}
                onClick={() => handleStatusChange('listo_entrega')}
                className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-950 font-black text-xs rounded-xl border border-blue-300 transition-colors"
              >
                Marcar: Listo para entrega
              </button>
            )}
            {currentStatus === 'listo_entrega' && (
              <button
                type="button"
                disabled={loading}
                onClick={() => handleStatusChange('entregado')}
                className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs rounded-xl shadow-sm transition-colors"
              >
                Marcar: Entregado ✅
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            className="text-xs font-bold text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-xl border border-transparent hover:border-red-200 transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Cancelar pedido</span>
          </button>
        </div>
      )}

      {/* Valoración al comprador cuando está entregado */}
      {currentStatus === 'entregado' && (
        <div className="pt-2 border-t border-stone-100">
          <ReviewForm
            orderId={order.id}
            targetId={order.buyer_id}
          />
        </div>
      )}

      {/* Modal de Cancelación de Pedido */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border-2 border-stone-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-stone-900 text-base flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" /> Cancelar Pedido
              </h3>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs font-semibold text-stone-600">
              Indica el motivo de la cancelación. Se notificará al cliente y se restaurará el stock.
            </p>

            <form onSubmit={handleConfirmCancel} className="space-y-4">
              <textarea
                required
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ej. Incidencia con la cosecha, falta de stock puntual, acuerdo con el cliente..."
                className="w-full px-3 py-2 border-2 border-stone-300 rounded-xl text-xs font-bold text-stone-900 bg-white focus:ring-2 focus:ring-red-600 focus:outline-none"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-black rounded-xl transition-colors"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={cancelling}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl transition-colors shadow-sm disabled:opacity-50"
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

export default SellerActiveOrderCard;
