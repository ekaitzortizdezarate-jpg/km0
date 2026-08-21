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
} from 'lucide-react';
import { updateOrderStatus, cancelActiveOrderWithReason } from '@/app/actions/order-status';
import type { OrderStatus } from '@/types/database';
import ReviewForm from '@/components/ReviewForm';

interface SellerActiveOrderCardProps {
  order: any;
}

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

  return (
    <div className="bg-white rounded-3xl border-2 border-stone-200 p-5 sm:p-6 shadow-sm space-y-4">
      {/* Cabecera */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100">
        <div>
          <h3 className="text-base font-black text-stone-900">
            Cliente: {order.profiles?.full_name} ({order.profiles?.town})
          </h3>
          {order.profiles?.phone && (
            <p className="text-xs font-bold text-stone-600 flex items-center gap-1 mt-0.5">
              <Phone className="w-3.5 h-3.5 text-stone-500" /> {order.profiles?.phone}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/chat/${order.profiles?.id}`}
            className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-900 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors border border-stone-200"
          >
            <MessageCircle className="w-3.5 h-3.5" /> Chat
          </Link>

          {order.is_recurring && (
            <span className="flex items-center gap-1 text-[10px] font-black bg-emerald-100 text-emerald-950 border border-emerald-300 px-2 py-0.5 rounded-md">
              <RefreshCw className="w-3 h-3" /> Periódico ({order.recurrence_interval_days}d)
            </span>
          )}
        </div>
      </div>

      {/* Fecha confirmada de entrega */}
      {order.estimated_delivery_date && (
        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs font-bold text-emerald-950 flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            Fecha confirmada de entrega:{' '}
            <strong>
              {new Date(order.estimated_delivery_date).toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </strong>
          </span>
        </div>
      )}

      {/* Items del pedido */}
      <div className="space-y-1.5 bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
        {order.order_items?.map((item: any) => (
          <div key={item.id} className="flex justify-between text-xs font-bold text-stone-900">
            <span>
              {item.products?.name} x {item.quantity}{' '}
              {item.products?.format === 'granel' ? 'kg' : 'uds'}
            </span>
            <span className="font-black">{Number(item.subtotal).toFixed(2)} €</span>
          </div>
        ))}
        <div className="pt-2 mt-2 border-t border-stone-300 flex justify-between text-xs font-black text-stone-900">
          <span>Total Cobro</span>
          <span className="text-sm font-black text-emerald-900">
            {Number(order.total_amount).toFixed(2)} €
          </span>
        </div>
      </div>

      {/* Lugar de Entrega */}
      <div className="text-xs font-semibold text-stone-800 bg-stone-50 p-3 rounded-xl border border-stone-200 flex items-center gap-2">
        {order.delivery_points ? (
          <>
            <Store className="w-4 h-4 text-emerald-800 shrink-0" />
            <span>
              Punto de recogida:{' '}
              <strong className="text-stone-900">{order.delivery_points.name}</strong> (
              {order.delivery_points.address_details})
            </span>
          </>
        ) : (
          <>
            <MapPin className="w-4 h-4 text-emerald-800 shrink-0" />
            <span>
              Dirección de envío:{' '}
              <strong className="text-stone-900">{order.shipping_address}</strong>
            </span>
          </>
        )}
      </div>

      {/* Selector de Estado interactivo + Botón Cancelar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <label className="text-xs font-black text-stone-800">Estado:</label>
          <select
            value={currentStatus}
            disabled={loading}
            onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
            className="px-3 py-1.5 text-xs font-bold border-2 border-stone-300 rounded-xl bg-white text-stone-900 capitalize focus:ring-2 focus:ring-emerald-600 focus:outline-none"
          >
            <option value="confirmado">Confirmado / Aceptado</option>
            <option value="preparando">Preparando Cosecha</option>
            <option value="listo_entrega">Listo para Entrega</option>
            <option value="entregado">Entregado</option>
          </select>

          {statusUpdated && (
            <span className="text-[11px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1 animate-fadeIn">
              <CheckCircle2 className="w-3.5 h-3.5" /> ¡Actualizado!
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Botón Cancelar y Eliminar Pedido */}
          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl border border-red-200 transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" /> Cancelar Pedido
          </button>

          {currentStatus === 'entregado' && (
            <ReviewForm orderId={order.id} targetId={order.buyer_id} />
          )}
        </div>
      </div>

      {/* Modal de Confirmación de Cancelación */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div
            className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl border-2 border-stone-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <h3 className="text-base font-black">Cancelar Pedido en Curso</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="p-1 rounded-full hover:bg-stone-100 text-stone-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs font-semibold text-stone-600">
              ¿Estás seguro de que deseas cancelar este pedido? Se repondrá el stock de los productos automáticamente y se enviará un mensaje al cliente informándole de la cancelación.
            </p>

            <form onSubmit={handleConfirmCancel} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Motivo de la cancelación (se enviará al comprador por chat):
                </label>
                <textarea
                  required
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Ej. Incidencia con la cosecha, falta de stock de última hora..."
                  className="w-full p-2.5 border-2 border-stone-300 rounded-xl text-xs font-bold text-stone-900 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={cancelling}
                  className="flex-1 py-2.5 bg-red-700 hover:bg-red-800 text-white font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
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
