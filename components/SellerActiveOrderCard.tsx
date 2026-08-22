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

  const totalProductItems = order.order_items?.length || 0;
  const totalProductQty =
    order.order_items?.reduce(
      (acc: number, it: any) => acc + Number(it.quantity || 0),
      0
    ) || 0;

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

        <div className="flex items-center gap-2">
          {order.is_recurring && (
            <span className="flex items-center gap-1 text-[10px] font-black bg-emerald-100 text-emerald-950 border border-emerald-300 px-2 py-0.5 rounded-md">
              <RefreshCw className="w-3 h-3" /> Periódico ({order.recurrence_interval_days}d)
            </span>
          )}
        </div>
      </div>

      {/* 2, 3, 4, 5: Información estructurada */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-bold text-stone-800 bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
        {/* 2. Pedido realizado: */}
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

        {/* 3. Pedido validado: */}
        <div className="flex items-center gap-2 text-emerald-950">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            <strong className="text-stone-900">Pedido validado:</strong>{' '}
            {currentStatus === 'confirmado'
              ? 'Confirmado / Aceptado'
              : currentStatus === 'preparando'
              ? 'Preparando Cosecha'
              : currentStatus === 'listo_entrega'
              ? 'Listo para Entrega'
              : currentStatus === 'entregado'
              ? 'Entregado'
              : 'Validado'}
          </span>
        </div>

        {/* 4. Fecha entrega: (si ya lo está) */}
        {order.estimated_delivery_date ? (
          <div className="flex items-center gap-2 text-emerald-950 sm:col-span-2 bg-emerald-100/70 p-2.5 rounded-xl border border-emerald-300">
            <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
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
        ) : null}

        {/* 5. Envío: */}
        <div className="flex items-center gap-2 sm:col-span-2 pt-1 border-t border-stone-200">
          {order.delivery_points ? (
            <>
              <Store className="w-4 h-4 text-emerald-800 shrink-0" />
              <span>
                <strong className="text-stone-900">Envío:</strong> Punto de recogida:{' '}
                <span className="font-semibold text-stone-700">
                  {order.delivery_points.name} ({order.delivery_points.address_details})
                </span>
              </span>
            </>
          ) : order.shipping_address ? (
            <>
              <MapPin className="w-4 h-4 text-emerald-800 shrink-0" />
              <span>
                <strong className="text-stone-900">Envío:</strong> A domicilio en{' '}
                <span className="font-semibold text-stone-700">{order.shipping_address}</span>
              </span>
            </>
          ) : (
            <>
              <Store className="w-4 h-4 text-emerald-800 shrink-0" />
              <span>
                <strong className="text-stone-900">Envío:</strong> Recogida en instalaciones del caserío
              </span>
            </>
          )}
        </div>
      </div>

      {/* 6. Los productos y total de productos */}
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
