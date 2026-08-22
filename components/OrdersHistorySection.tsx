'use client';

import { useState } from 'react';
import {
  History,
  ChevronDown,
  ChevronUp,
  Store,
  User,
  Calendar,
  Package,
  MapPin,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import Link from 'next/link';

interface OrdersHistorySectionProps {
  orders: any[];
  role: 'comprador' | 'vendedor';
}

const statusLabels: Record<string, string> = {
  pendiente: 'POR VALIDAR',
  confirmado: 'VALIDADO',
  preparando: 'PREPARANDO',
  listo_entrega: 'LISTO ENTREGA',
  entregado: 'ENTREGADO',
  cancelado: 'CANCELADO',
};

const statusColors: Record<string, string> = {
  pendiente: 'bg-amber-100 text-amber-950 border-amber-300',
  confirmado: 'bg-emerald-100 text-emerald-950 border-emerald-300',
  preparando: 'bg-purple-100 text-purple-950 border-purple-300',
  listo_entrega: 'bg-blue-100 text-blue-950 border-blue-300',
  entregado: 'bg-stone-100 text-stone-800 border-stone-300',
  cancelado: 'bg-red-100 text-red-950 border-red-300',
};

export function OrdersHistorySection({ orders, role }: OrdersHistorySectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const isSeller = role === 'vendedor';

  const filteredOrders = orders.filter((order) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const otherPartyName = (order.profiles?.full_name || '').toLowerCase();
    const otherPartyTown = (order.profiles?.town || '').toLowerCase();
    const statusText = (statusLabels[order.status] || order.status || '').toLowerCase();
    const itemsText = (
      order.order_items
        ?.map((it: any) => it.products?.name || '')
        .join(' ') || ''
    ).toLowerCase();

    return (
      otherPartyName.includes(term) ||
      otherPartyTown.includes(term) ||
      statusText.includes(term) ||
      itemsText.includes(term)
    );
  });

  return (
    <div className="pt-6 border-t-2 border-stone-200 space-y-4">
      {/* Botón Principal para Desplegar el Histórico */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 sm:p-5 bg-stone-900 hover:bg-stone-800 text-white rounded-3xl shadow-md transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-stone-800 group-hover:bg-stone-700 flex items-center justify-center transition-colors">
            <History className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-black tracking-wide">HISTÓRICO</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700">
                Últimos {orders.length} pedidos
              </span>
            </div>
            <p className="text-[11px] font-semibold text-stone-400">
              Consulta pedidos finalizados, entregados y cancelados
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-stone-800 px-3 py-1.5 rounded-2xl border border-stone-700">
          <span>{isOpen ? 'Ocultar' : 'Ver histórico'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Contenido Desplegable */}
      {isOpen && (
        <div className="bg-white rounded-3xl border-2 border-stone-200 p-4 sm:p-6 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-200">
            <div>
              <h3 className="text-base font-black text-stone-900">
                Historial de los últimos 100 pedidos
              </h3>
              <p className="text-xs font-bold text-stone-500">
                Registro histórico guardado en base de datos
              </p>
            </div>

            {orders.length > 5 && (
              <div className="w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Buscar en el histórico..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:border-emerald-700 outline-none transition-all"
                />
              </div>
            )}
          </div>

          {filteredOrders.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <History className="w-8 h-8 text-stone-300 mx-auto" />
              <p className="text-xs font-bold text-stone-500">
                {orders.length === 0
                  ? 'Aún no hay pedidos en el histórico.'
                  : 'No se encontraron pedidos con ese criterio de búsqueda.'}
              </p>
            </div>
          ) : (
            <>
              {/* Vista para Pantallas Medianas / Grandes (Tabla) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 font-black uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-3">Fecha</th>
                      <th className="py-3 px-3">{isSeller ? 'Cliente' : 'Caserío'}</th>
                      <th className="py-3 px-3">Productos</th>
                      <th className="py-3 px-3">Modalidad</th>
                      <th className="py-3 px-3 text-right">Total</th>
                      <th className="py-3 px-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-bold text-stone-800">
                    {filteredOrders.map((order) => {
                      const totalProductQty =
                        order.order_items?.reduce(
                          (acc: number, it: any) => acc + Number(it.quantity || 0),
                          0
                        ) || 0;

                      return (
                        <tr key={order.id} className="hover:bg-stone-50 transition-colors">
                          {/* Fecha */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="block font-black text-stone-900">
                              {new Date(order.created_at).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                            <span className="text-[10px] font-semibold text-stone-400">
                              {new Date(order.created_at).toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </td>

                          {/* Cliente / Caserío */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              {order.profiles?.avatar_url ? (
                                <img
                                  src={order.profiles.avatar_url}
                                  alt={order.profiles.full_name}
                                  className="w-7 h-7 rounded-lg object-cover border border-stone-200 shrink-0"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-900 font-black text-[10px] flex items-center justify-center shrink-0">
                                  {order.profiles?.full_name?.charAt(0) || 'U'}
                                </div>
                              )}
                              <div className="min-w-0">
                                <span className="font-extrabold text-stone-900 block truncate max-w-[140px]">
                                  {order.profiles?.full_name || 'Desconocido'}
                                </span>
                                <span className="text-[10px] text-stone-500 font-semibold truncate block max-w-[140px]">
                                  {order.profiles?.town || 'Bizkaia'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Productos */}
                          <td className="py-3 px-3">
                            <div className="space-y-0.5 max-w-[200px]">
                              {order.order_items?.map((it: any, idx: number) => (
                                <div key={idx} className="text-[11px] truncate text-stone-700">
                                  • {it.quantity} {it.products?.format === 'granel' ? 'kg' : 'uds'}{' '}
                                  <strong className="text-stone-900">{it.products?.name}</strong>
                                </div>
                              ))}
                            </div>
                          </td>

                          {/* Modalidad */}
                          <td className="py-3 px-3">
                            {order.delivery_points ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-stone-700">
                                <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                <span className="truncate max-w-[120px]">{order.delivery_points.name}</span>
                              </span>
                            ) : order.shipping_address && order.shipping_address !== 'Recogida directa en Caserío' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-stone-700">
                                <Truck className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                                <span>Envío a domicilio</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-stone-700">
                                <Store className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                                <span>Recogida caserío</span>
                              </span>
                            )}
                          </td>

                          {/* Total */}
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <span className="font-black text-sm text-stone-900">
                              {Number(order.total_amount || order.total_price || 0).toFixed(2)} €
                            </span>
                          </td>

                          {/* Estado */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span
                              className={`inline-block py-1 px-2.5 rounded-xl border text-[10px] font-black uppercase tracking-tight ${
                                statusColors[order.status] || 'bg-stone-100 text-stone-800 border-stone-300'
                              }`}
                            >
                              {statusLabels[order.status] || order.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Vista Móvil (Tarjetas Compactas) */}
              <div className="md:hidden space-y-3">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-200">
                      <div className="flex items-center gap-2 min-w-0">
                        {order.profiles?.avatar_url ? (
                          <img
                            src={order.profiles.avatar_url}
                            alt={order.profiles.full_name}
                            className="w-8 h-8 rounded-lg object-cover border border-stone-200 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-900 font-black text-xs flex items-center justify-center shrink-0">
                            {order.profiles?.full_name?.charAt(0) || 'U'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="font-black text-stone-900 block truncate">
                            {order.profiles?.full_name}
                          </span>
                          <span className="text-[10px] font-semibold text-stone-500 block">
                            {new Date(order.created_at).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`py-1 px-2 rounded-lg border text-[9px] font-black uppercase shrink-0 ${
                          statusColors[order.status] || 'bg-stone-100 text-stone-800 border-stone-300'
                        }`}
                      >
                        {statusLabels[order.status] || order.status}
                      </span>
                    </div>

                    {/* Productos y Total */}
                    <div className="space-y-1 text-[11px] text-stone-700">
                      {order.order_items?.map((it: any, idx: number) => (
                        <div key={idx} className="flex justify-between">
                          <span className="truncate pr-2">
                            • {it.quantity} {it.products?.format === 'granel' ? 'kg' : 'uds'} {it.products?.name}
                          </span>
                          <span className="font-bold text-stone-900 shrink-0">
                            {(it.quantity * it.unit_price).toFixed(2)} €
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-stone-200 flex items-center justify-between font-black">
                      <span className="text-stone-500 text-[10px] uppercase">Total</span>
                      <span className="text-emerald-950 text-sm">
                        {Number(order.total_amount || order.total_price || 0).toFixed(2)} €
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
