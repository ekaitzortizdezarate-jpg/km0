'use client';

import { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Store,
  MapPin,
  Truck,
  User,
  MessageCircle,
  CalendarDays,
  Sprout,
  Filter,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { DeliveryMethodsBadges } from '@/components/DeliveryMethodsBadges';

export interface CalendarProductItem {
  name: string;
  quantity: number;
  format?: string | null;
  unitPrice?: number | null;
  imageUrl?: string | null;
  deliveryMethods?: string[] | null;
}

export interface CalendarEvent {
  id: string;
  type: 'order' | 'product_available';
  date: string; // YYYY-MM-DD
  title: string;
  subtitle?: string;
  status?: string;
  amount?: number;
  productImageUrl?: string | null;
  orderProducts?: CalendarProductItem[];
  customerName?: string;
  customerAvatarUrl?: string | null;
  sellerName?: string;
  sellerAvatarUrl?: string | null;
  deliveryType?: string;
  deliveryLocation?: string;
  items?: string;
  chatUserId?: string;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  role: 'vendedor' | 'comprador';
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const WEEKDAY_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const statusStyles: Record<string, { label: string; bg: string; text: string; border: string }> = {
  pendiente: { label: 'Por validar', bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-300' },
  confirmado: { label: 'Validado', bg: 'bg-blue-100', text: 'text-blue-900', border: 'border-blue-300' },
  preparando: { label: 'Preparando', bg: 'bg-purple-100', text: 'text-purple-900', border: 'border-purple-300' },
  listo: { label: 'Listo para entrega', bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-300' },
  entregado: { label: 'Entregado', bg: 'bg-stone-100', text: 'text-stone-700', border: 'border-stone-300' },
  cancelado: { label: 'Cancelado', bg: 'bg-red-100', text: 'text-red-900', border: 'border-red-300' },
};

function getRelativeDateInfo(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: `Pasado (${Math.abs(diffDays)}d)`, badgeClass: 'bg-stone-100 text-stone-600 border-stone-300 font-semibold' };
  if (diffDays === 0) return { label: 'HOY', badgeClass: 'bg-emerald-700 text-white font-black animate-pulse' };
  if (diffDays === 1) return { label: 'MAÑANA', badgeClass: 'bg-emerald-100 text-emerald-950 border-emerald-300 font-black' };
  if (diffDays === 2) return { label: 'En 2 días', badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-200 font-bold' };
  if (diffDays > 2 && diffDays <= 7) return { label: `En ${diffDays} días`, badgeClass: 'bg-stone-100 text-stone-800 border-stone-200 font-semibold' };
  return { label: '', badgeClass: '' };
}

export function CalendarView({ events, role }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [filterType, setFilterType] = useState<'all' | 'order' | 'product_available'>('all');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Primer día del mes (Lunes = 0)
  const firstDay = new Date(year, month, 1);
  const startingDay = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Ordenar TODOS los eventos cronológicamente: de la fecha más cercana a la más lejana
  const sortedEvents = useMemo(() => {
    const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
    if (filterType === 'all') return sorted;
    return sorted.filter((ev) => ev.type === filterType);
  }, [events, filterType]);

  // Mapa de eventos por fecha para el calendario
  const eventsByDate = useMemo(() => {
    return events.reduce((acc, ev) => {
      const key = ev.date;
      if (!acc[key]) acc[key] = [];
      acc[key].push(ev);
      return acc;
    }, {} as Record<string, CalendarEvent[]>);
  }, [events]);

  const selectedDateEvents = eventsByDate[selectedDateStr] || [];

  const handleJumpToEvent = (ev: CalendarEvent) => {
    setSelectedDateStr(ev.date);
    const evDate = new Date(ev.date + 'T00:00:00');
    setCurrentDate(new Date(evDate.getFullYear(), evDate.getMonth(), 1));
    const calendarEl = document.getElementById('calendario-grid-section');
    if (calendarEl) {
      calendarEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const hasCosechas = events.some((e) => e.type === 'product_available');

  return (
    <div className="space-y-8">
      {/* 1. SECCIÓN SUPERIOR: PRÓXIMAS FECHAS (TABLA / LISTA ESTRUCTURADA Y MODERNA) */}
      <div className="bg-white rounded-3xl border-2 border-stone-200 shadow-sm overflow-hidden">
        {/* Cabecera de la Sección */}
        <div className="p-5 sm:p-6 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-800 text-white rounded-2xl shadow-sm">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                Próximas Fechas
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {hasCosechas && (
              <div className="flex items-center bg-white p-1 rounded-xl border border-stone-300 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                    filterType === 'all'
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Todos ({events.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('order')}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                    filterType === 'order'
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  📦 Pedidos ({events.filter((e) => e.type === 'order').length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('product_available')}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                    filterType === 'product_available'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  🌾 Cosechas ({events.filter((e) => e.type === 'product_available').length})
                </button>
              </div>
            )}

            <span className="text-xs font-black text-emerald-950 bg-emerald-100/90 px-3 py-1.5 rounded-xl border border-emerald-300 shadow-2xs">
              {sortedEvents.length} {sortedEvents.length === 1 ? 'fecha' : 'fechas'}
            </span>
          </div>
        </div>

        {/* TABLA MODERNA PARA ESCRITORIO / CARDS PARA MÓVIL */}
        {sortedEvents.length > 0 ? (
          <div className="overflow-x-auto">
            {/* Cabecera de Columnas para Escritorio */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 bg-stone-100/80 border-b border-stone-200 text-[11px] font-black text-stone-600 uppercase tracking-wider">
              <div className="col-span-3">Fecha & Estado</div>
              <div className="col-span-3">Detalle & Modalidad</div>
              <div className="col-span-4">Productos</div>
              <div className="col-span-2 text-right">Total & Acciones</div>
            </div>

            {/* Filas de la Tabla */}
            <div className="divide-y divide-stone-200">
              {sortedEvents.map((ev) => {
                const eventDateObj = new Date(ev.date + 'T00:00:00');
                const dayOfWeek = eventDateObj.toLocaleDateString('es-ES', { weekday: 'short' });
                const dayNum = eventDateObj.getDate();
                const monthShort = eventDateObj.toLocaleDateString('es-ES', { month: 'short' });
                const relative = getRelativeDateInfo(ev.date);
                const isOrder = ev.type === 'order';
                const stStyle = ev.status ? statusStyles[ev.status] : null;

                return (
                  <div
                    key={ev.id}
                    className={`p-4 sm:p-5 lg:px-6 lg:py-4 transition-colors ${
                      isOrder ? 'hover:bg-emerald-50/40' : 'hover:bg-amber-50/40 bg-amber-50/20'
                    }`}
                  >
                    {/* Estructura para Escritorio */}
                    <div className="hidden lg:grid grid-cols-12 gap-4 items-center">
                      {/* Columna 1: Fecha & Estado */}
                      <div className="col-span-3 flex items-center gap-3">
                        <div className="w-14 rounded-2xl bg-white border-2 border-stone-200 p-1.5 text-center shrink-0 shadow-2xs">
                          <span className="text-[10px] font-black uppercase text-stone-500 block leading-tight">
                            {dayOfWeek}
                          </span>
                          <span className="text-xl font-black text-stone-900 block leading-none py-0.5">
                            {dayNum}
                          </span>
                          <span className="text-[10px] font-black uppercase text-emerald-800 block leading-tight">
                            {monthShort}
                          </span>
                        </div>

                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${
                                isOrder
                                  ? 'bg-emerald-800 text-white border-emerald-900'
                                  : 'bg-amber-600 text-white border-amber-700'
                              }`}
                            >
                              {isOrder ? 'Pedido' : 'Cosecha'}
                            </span>

                            {stStyle && (
                              <span
                                className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${stStyle.bg} ${stStyle.text} ${stStyle.border}`}
                              >
                                {stStyle.label}
                              </span>
                            )}
                          </div>

                          {relative.label && (
                            <span
                              className={`inline-block text-[10px] uppercase px-1.5 py-0.5 rounded border ${relative.badgeClass}`}
                            >
                              {relative.label}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Columna 2: Detalle & Modalidad */}
                      <div className="col-span-3 space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {ev.sellerAvatarUrl || ev.customerAvatarUrl ? (
                            <img
                              src={ev.sellerAvatarUrl || ev.customerAvatarUrl || ''}
                              alt={ev.sellerName || ev.customerName || ''}
                              className="w-6 h-6 rounded-lg object-cover border border-stone-200 shrink-0"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-lg bg-stone-100 flex items-center justify-center text-xs font-black text-stone-700 shrink-0 border border-stone-200">
                              {role === 'vendedor' ? '👤' : '🏡'}
                            </div>
                          )}
                          <span className="font-black text-stone-900 text-xs truncate">
                            {role === 'vendedor'
                              ? ev.customerName || 'Cliente'
                              : ev.sellerName || 'Caserío'}
                          </span>
                        </div>

                        {ev.deliveryLocation ? (
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-700">
                            {ev.deliveryType === 'sitio_fisico' ? (
                              <>
                                <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                <span className="truncate">{ev.deliveryLocation}</span>
                              </>
                            ) : ev.deliveryType === 'envio' ? (
                              <>
                                <Truck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                <span className="truncate">{ev.deliveryLocation}</span>
                              </>
                            ) : (
                              <>
                                <Store className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                <span>Recogida en caserío</span>
                              </>
                            )}
                          </div>
                        ) : ev.subtitle ? (
                          <p className="text-[11px] font-bold text-amber-900 truncate">
                            {ev.subtitle}
                          </p>
                        ) : null}
                      </div>

                      {/* Columna 3: Productos */}
                      <div className="col-span-4 min-w-0">
                        {ev.orderProducts && ev.orderProducts.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                            {ev.orderProducts.map((p, pIdx) => (
                              <div
                                key={pIdx}
                                className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl border border-stone-200 text-xs shadow-2xs"
                              >
                                {p.imageUrl ? (
                                  <img
                                    src={p.imageUrl}
                                    alt={p.name}
                                    className="w-6 h-6 rounded-md object-cover border border-stone-200 shrink-0"
                                  />
                                ) : (
                                  <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-800 font-bold text-[10px] flex items-center justify-center border border-emerald-200 shrink-0">
                                    🌿
                                  </div>
                                )}
                                <span className="font-bold text-stone-900 truncate max-w-[110px]">
                                  {p.name}
                                </span>
                                <span className="font-extrabold text-emerald-900 text-[11px]">
                                  x{p.quantity}
                                </span>
                                {p.deliveryMethods && (
                                  <DeliveryMethodsBadges deliveryMethods={p.deliveryMethods} />
                                )}
                              </div>
                            ))}
                          </div>
                        ) : ev.productImageUrl ? (
                          <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-xl border border-amber-200 w-fit">
                            <img
                              src={ev.productImageUrl}
                              alt={ev.title}
                              className="w-6 h-6 rounded-md object-cover border border-amber-300 shrink-0"
                            />
                            <span className="text-xs font-bold text-stone-900">{ev.title}</span>
                          </div>
                        ) : null}
                      </div>

                      {/* Columna 4: Total & Acciones */}
                      <div className="col-span-2 flex items-center justify-end gap-2 text-right">
                        {ev.amount !== undefined && (
                          <span className="text-sm font-black text-emerald-950 pr-1">
                            {ev.amount.toFixed(2)} €
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleJumpToEvent(ev)}
                          title="Ver en el calendario"
                          className="p-2 bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 rounded-xl transition-colors shadow-2xs"
                        >
                          <CalendarIcon className="w-4 h-4 text-emerald-700" />
                        </button>

                        {ev.chatUserId && (
                          <Link
                            href={`/chat/${ev.chatUserId}`}
                            title="Chatear"
                            className="p-2 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 text-emerald-900 rounded-xl transition-colors shadow-2xs"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Estructura Responsive para Móviles */}
                    <div className="lg:hidden space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-13 rounded-2xl bg-white border-2 border-stone-200 p-1.5 text-center shrink-0 shadow-2xs">
                            <span className="text-[9px] font-black uppercase text-stone-500 block leading-tight">
                              {dayOfWeek}
                            </span>
                            <span className="text-lg font-black text-stone-900 block leading-none py-0.5">
                              {dayNum}
                            </span>
                            <span className="text-[9px] font-black uppercase text-emerald-800 block leading-tight">
                              {monthShort}
                            </span>
                          </div>

                          <div className="space-y-0.5">
                            <div className="flex flex-wrap items-center gap-1">
                              <span
                                className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${
                                  isOrder
                                    ? 'bg-emerald-800 text-white border-emerald-900'
                                    : 'bg-amber-600 text-white border-amber-700'
                                }`}
                              >
                                {isOrder ? 'Pedido' : 'Cosecha'}
                              </span>

                              {stStyle && (
                                <span
                                  className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${stStyle.bg} ${stStyle.text} ${stStyle.border}`}
                                >
                                  {stStyle.label}
                                </span>
                              )}

                              {relative.label && (
                                <span
                                  className={`text-[9px] uppercase px-1.5 py-0.5 rounded border ${relative.badgeClass}`}
                                >
                                  {relative.label}
                                </span>
                              )}
                            </div>

                            <h3 className="font-black text-stone-900 text-xs pt-0.5">
                              {role === 'vendedor'
                                ? ev.customerName || ev.title
                                : ev.sellerName || ev.title}
                            </h3>

                            {ev.deliveryLocation && (
                              <div className="flex items-center gap-1 text-[11px] font-semibold text-stone-600">
                                {ev.deliveryType === 'sitio_fisico' ? (
                                  <MapPin className="w-3 h-3 text-emerald-700 shrink-0" />
                                ) : ev.deliveryType === 'envio' ? (
                                  <Truck className="w-3 h-3 text-emerald-700 shrink-0" />
                                ) : (
                                  <Store className="w-3 h-3 text-emerald-700 shrink-0" />
                                )}
                                <span className="truncate">{ev.deliveryLocation}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {ev.amount !== undefined && (
                          <span className="text-sm font-black text-emerald-950 shrink-0">
                            {ev.amount.toFixed(2)} €
                          </span>
                        )}
                      </div>

                      {/* Productos en Móvil */}
                      {ev.orderProducts && ev.orderProducts.length > 0 ? (
                        <div className="pt-2 border-t border-stone-200/80 flex flex-wrap gap-1.5">
                          {ev.orderProducts.map((p, pIdx) => (
                            <div
                              key={pIdx}
                              className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl border border-stone-200 text-xs shadow-2xs"
                            >
                              {p.imageUrl ? (
                                <img
                                  src={p.imageUrl}
                                  alt={p.name}
                                  className="w-6 h-6 rounded-md object-cover border border-stone-200 shrink-0"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-800 font-bold text-[10px] flex items-center justify-center border border-emerald-200 shrink-0">
                                  🌿
                                </div>
                              )}
                              <span className="font-bold text-stone-900 text-xs">{p.name}</span>
                              <span className="font-extrabold text-emerald-900 text-[11px]">
                                x{p.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {/* Acciones en Móvil */}
                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-stone-200/60">
                        <button
                          type="button"
                          onClick={() => handleJumpToEvent(ev)}
                          className="px-3 py-1.5 bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 rounded-xl text-xs font-black transition-colors flex items-center gap-1 shadow-2xs"
                        >
                          <CalendarIcon className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Ver día en calendario</span>
                        </button>

                        {ev.chatUserId && (
                          <Link
                            href={`/chat/${ev.chatUserId}`}
                            className="p-1.5 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 text-emerald-900 rounded-xl transition-colors shadow-2xs"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-10 text-stone-500 space-y-1 p-6">
            <CalendarIcon className="w-8 h-8 mx-auto text-stone-400 mb-1" />
            <p className="text-xs font-bold text-stone-800">
              No hay entregas ni cosechas previstas por el momento.
            </p>
            <p className="text-[11px]">
              Los nuevos pedidos y fechas de cosecha aparecerán ordenados cronológicamente aquí.
            </p>
          </div>
        )}
      </div>

      {/* 2. SECCIÓN INFERIOR: CALENDARIO INTERACTIVO + DETALLE DEL DÍA SELECCIONADO */}
      <div id="calendario-grid-section" className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* CALENDARIO INTERACTIVO */}
        <div className="lg:col-span-2 bg-white rounded-3xl border-2 border-stone-200 shadow-sm p-5 sm:p-6 space-y-4">
          {/* Cabecera del mes */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-emerald-700" />
              <h2 className="text-xl font-black text-stone-900 capitalize">
                {MONTH_NAMES[month]} {year}
              </h2>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors border border-stone-300"
                aria-label="Mes anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  setCurrentDate(now);
                  setSelectedDateStr(todayStr);
                }}
                className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-xs font-bold text-stone-800 transition-colors border border-stone-300"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors border border-stone-300"
                aria-label="Mes siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAY_SHORT.map((day) => (
              <span
                key={day}
                className="text-xs font-black text-stone-600 uppercase py-1"
              >
                {day}
              </span>
            ))}
          </div>

          {/* Grid de Días */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* Celdas vacías del mes anterior */}
            {Array.from({ length: startingDay }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="h-14 sm:h-20 rounded-2xl bg-stone-50/50 border border-stone-100"
              />
            ))}

            {/* Días del mes actual */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
                dayNum
              ).padStart(2, '0')}`;
              const isSelected = selectedDateStr === dateStr;
              const isToday = todayStr === dateStr;
              const dayEvents = eventsByDate[dateStr] || [];
              const hasOrders = dayEvents.some((e) => e.type === 'order');
              const hasAvailability = dayEvents.some(
                (e) => e.type === 'product_available'
              );

              return (
                <button
                  type="button"
                  key={`day-${dayNum}`}
                  onClick={() => setSelectedDateStr(dateStr)}
                  className={`h-14 sm:h-20 rounded-2xl p-1.5 sm:p-2 border-2 transition-all flex flex-col justify-between items-start text-left relative ${
                    isSelected
                      ? 'border-emerald-700 bg-emerald-50 ring-2 ring-emerald-600 shadow-sm'
                      : isToday
                      ? 'border-emerald-400 bg-white'
                      : 'border-stone-200 bg-white hover:bg-stone-50'
                  }`}
                >
                  <span
                    className={`text-xs font-black rounded-lg px-1.5 py-0.5 ${
                      isToday
                        ? 'bg-emerald-800 text-white'
                        : isSelected
                        ? 'text-emerald-950 font-black'
                        : 'text-stone-800'
                    }`}
                  >
                    {dayNum}
                  </span>

                  {/* Indicadores de eventos */}
                  <div className="flex flex-wrap gap-1 w-full">
                    {hasOrders && (
                      <span className="w-2.5 h-2.5 sm:w-auto sm:h-auto sm:px-1.5 sm:py-0.5 rounded-full sm:rounded-md bg-emerald-600 text-white text-[9px] font-black flex items-center justify-center">
                        <span className="hidden sm:inline">
                          {dayEvents.filter((e) => e.type === 'order').length} {role === 'vendedor' ? 'pedidos' : 'entregas'}
                        </span>
                      </span>
                    )}
                    {hasAvailability && (
                      <span className="w-2.5 h-2.5 sm:w-auto sm:h-auto sm:px-1.5 sm:py-0.5 rounded-full sm:rounded-md bg-amber-500 text-white text-[9px] font-black flex items-center justify-center">
                        <span className="hidden sm:inline">Cosecha</span>
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* DETALLE DEL DÍA SELECCIONADO */}
        <div className="bg-white rounded-3xl border-2 border-stone-200 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="pb-3 border-b border-stone-100">
            <span className="text-[11px] font-black text-emerald-800 uppercase tracking-wider block">
              {role === 'vendedor' ? 'Entregas y Cosechas del Día' : 'Tus Pedidos del Día'}
            </span>
            <h3 className="text-lg font-black text-stone-900">
              {new Date(selectedDateStr + 'T12:00:00').toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </h3>
          </div>

          {selectedDateEvents.length > 0 ? (
            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
              {selectedDateEvents.map((ev) => (
                <div
                  key={ev.id}
                  className={`p-3.5 rounded-2xl border-2 space-y-2 ${
                    ev.type === 'order'
                      ? 'bg-emerald-50/70 border-emerald-300'
                      : 'bg-amber-50/70 border-amber-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 min-w-0">
                      {ev.type === 'product_available' && ev.productImageUrl ? (
                        <img
                          src={ev.productImageUrl}
                          alt={ev.title}
                          className="w-14 h-14 rounded-2xl object-cover border border-amber-300 shrink-0 shadow-sm"
                        />
                      ) : null}
                      <div className="min-w-0">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                            ev.type === 'order'
                              ? 'bg-emerald-700 text-white'
                              : 'bg-amber-600 text-white'
                          }`}
                        >
                          {ev.type === 'order' ? 'Pedido Programado' : 'Cosecha Disponible'}
                        </span>
                        <h4 className="font-extrabold text-stone-900 text-sm mt-1">
                          {ev.title}
                        </h4>
                        {ev.subtitle && (
                          <p className="text-xs font-semibold text-stone-600 mt-0.5">
                            {ev.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    {ev.amount !== undefined && (
                      <span className="font-black text-stone-900 text-sm shrink-0">
                        {ev.amount.toFixed(2)} €
                      </span>
                    )}
                  </div>

                  {/* Lista de productos con foto si es pedido */}
                  {ev.orderProducts && ev.orderProducts.length > 0 ? (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-black text-stone-600 block">
                        Productos ({ev.orderProducts.length}):
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {ev.orderProducts.map((p, pIdx) => (
                          <div
                            key={pIdx}
                            className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-xl border border-stone-200 shadow-sm"
                          >
                            {p.imageUrl ? (
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="w-8 h-8 rounded-lg object-cover border border-stone-200 shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center border border-emerald-200 shrink-0">
                                🌿
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-stone-800 block">
                                {p.name} <strong className="text-emerald-800 font-black">(x{p.quantity})</strong>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : ev.items ? (
                    <p className="text-xs font-semibold text-stone-700">
                      Productos: {ev.items}
                    </p>
                  ) : null}

                  {ev.customerName && (
                    <div className="text-xs font-bold text-stone-800 flex items-center gap-2">
                      {ev.customerAvatarUrl ? (
                        <img
                          src={ev.customerAvatarUrl}
                          alt={ev.customerName}
                          className="w-5 h-5 rounded-full object-cover border border-stone-300 shrink-0"
                        />
                      ) : (
                        <User className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                      )}
                      <span>{ev.customerName}</span>
                    </div>
                  )}

                  {ev.sellerName && (
                    <div className="text-xs font-bold text-stone-800 flex items-center gap-2">
                      {ev.sellerAvatarUrl ? (
                        <img
                          src={ev.sellerAvatarUrl}
                          alt={ev.sellerName}
                          className="w-5 h-5 rounded-full object-cover border border-stone-300 shrink-0"
                        />
                      ) : (
                        <Store className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                      )}
                      <span>{ev.sellerName}</span>
                    </div>
                  )}

                  {ev.deliveryLocation && (
                    <div className="text-[11px] font-semibold text-stone-600 flex items-center gap-1.5">
                      {ev.deliveryType === 'sitio_fisico' ? (
                        <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      ) : ev.deliveryType === 'envio' ? (
                        <Truck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      ) : (
                        <Store className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      )}
                      <span>{ev.deliveryLocation}</span>
                    </div>
                  )}

                  {ev.chatUserId && (
                    <div className="pt-1">
                      <Link
                        href={`/chat/${ev.chatUserId}`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-white hover:bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        <Clock className="w-3 h-3" /> Contactar por Chat
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-stone-600 space-y-1">
              <CalendarIcon className="w-8 h-8 mx-auto text-stone-400 mb-1" />
              <p className="text-xs font-bold text-stone-800">
                No hay entregas ni cosechas previstas para este día.
              </p>
              <p className="text-[11px]">
                Selecciona otro día en el calendario para ver las fechas programadas.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CalendarView;
