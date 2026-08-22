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
  ArrowUpRight,
} from 'lucide-react';
import Link from 'next/link';

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
  deliverySchedule?: string | null;
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

function getRelativeDateLabel(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `Pasado (${Math.abs(diffDays)}d)`;
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Mañana';
  if (diffDays === 2) return 'En 2 días';
  if (diffDays > 2 && diffDays <= 7) return `En ${diffDays} días`;
  if (diffDays > 7 && diffDays <= 14) return 'Próxima semana';
  return '';
}

function formatDateHeader(dateStr: string): string {
  const target = new Date(dateStr + 'T00:00:00');
  const dayName = target.toLocaleDateString('es-ES', { weekday: 'long' });
  const dayNum = target.getDate();
  const monthName = target.toLocaleDateString('es-ES', { month: 'long' });

  const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const rel = getRelativeDateLabel(dateStr);
  const relSuffix = rel ? `, ${rel}` : '';

  return `${capitalizedDay} ${dayNum} ${capitalizedMonth}${relSuffix}`;
}

export function CalendarView({ events, role }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

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

  // 1. Agrupar eventos por fechas únicas ordenadas de la más cercana a la más lejana
  const groupedDates = useMemo(() => {
    const datesMap = new Map<string, CalendarEvent[]>();
    const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));

    sorted.forEach((ev) => {
      if (!datesMap.has(ev.date)) {
        datesMap.set(ev.date, []);
      }
      datesMap.get(ev.date)!.push(ev);
    });

    return Array.from(datesMap.entries()).map(([dateStr, dateEvents]) => ({
      dateStr,
      events: dateEvents,
    }));
  }, [events]);

  // Mapa de eventos por fecha para el calendario inferior
  const eventsByDate = useMemo(() => {
    return events.reduce((acc, ev) => {
      const key = ev.date;
      if (!acc[key]) acc[key] = [];
      acc[key].push(ev);
      return acc;
    }, {} as Record<string, CalendarEvent[]>);
  }, [events]);

  const selectedDateEvents = eventsByDate[selectedDateStr] || [];

  const handleJumpToEvent = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    const evDate = new Date(dateStr + 'T00:00:00');
    setCurrentDate(new Date(evDate.getFullYear(), evDate.getMonth(), 1));
    const calendarEl = document.getElementById('calendario-grid-section');
    if (calendarEl) {
      calendarEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. SECCIÓN SUPERIOR: PRÓXIMAS FECHAS */}
      <div className="bg-white rounded-3xl border-2 border-stone-200 shadow-sm p-5 sm:p-6 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-800 text-white rounded-2xl shadow-sm">
              <CalendarDays className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              Próximas Fechas
            </h1>
          </div>

          <span className="text-xs font-black text-emerald-950 bg-emerald-100/90 px-3 py-1.5 rounded-xl border border-emerald-300 shadow-2xs">
            {events.length} {events.length === 1 ? 'evento' : 'eventos'}
          </span>
        </div>

        {/* LISTA AGRUPADA POR FECHA CON ESPACIADO ENTRE FECHAS */}
        {groupedDates.length > 0 ? (
          <div className="space-y-7">
            {groupedDates.map(({ dateStr, events: dateEvents }) => (
              <div key={dateStr} className="space-y-3">
                {/* LÍNEA DE FECHA */}
                <div className="flex items-center gap-2 pb-1.5 border-b-2 border-emerald-800/20 text-stone-900 font-black text-sm sm:text-base">
                  <CalendarDays className="w-4 h-4 text-emerald-800 shrink-0" />
                  <span>{formatDateHeader(dateStr)}</span>
                </div>

                {/* LISTA DE EVENTOS Y PRODUCTOS EN ESTA FECHA */}
                <div className="space-y-3">
                  {dateEvents.map((ev) => {
                    const isOrder = ev.type === 'order';
                    const stStyle = ev.status ? statusStyles[ev.status] : null;

                    // Si es un pedido con varios productos, desglosamos cada producto
                    if (isOrder && ev.orderProducts && ev.orderProducts.length > 0) {
                      return ev.orderProducts.map((product, pIdx) => {
                        const totalProductPrice = product.unitPrice
                          ? product.unitPrice * product.quantity
                          : null;

                        return (
                          <div
                            key={`${ev.id}-${pIdx}`}
                            className="flex items-center gap-3.5 sm:gap-5 p-3.5 sm:p-4 rounded-2xl border-2 border-stone-200 bg-stone-50/70 hover:bg-stone-50 hover:border-emerald-400 transition-all shadow-2xs"
                          >
                            {/* A LA IZQUIERDA: DIBUJO DEL PRODUCTO Y NOMBRE JUSTO DEBAJO */}
                            <div className="w-20 sm:w-24 shrink-0 flex flex-col items-center text-center">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-stone-200 shadow-2xs bg-white"
                                />
                              ) : (
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-100/80 text-emerald-800 font-black text-base flex items-center justify-center border-2 border-emerald-300 shadow-2xs">
                                  🌿
                                </div>
                              )}
                              <span className="font-black text-stone-900 text-xs sm:text-sm mt-1.5 line-clamp-2 leading-tight">
                                {product.name}
                              </span>
                            </div>

                            {/* A SU DERECHA: LAS 3 LÍNEAS */}
                            <div className="flex-1 min-w-0 space-y-1.5">
                              {/* 1. PRIMERA LÍNEA: Cantidad x Precio unidad = Precio total (sin nada más) */}
                              <div className="text-xs sm:text-sm font-black text-stone-900">
                                {product.quantity} {product.format === 'granel' ? 'kg' : 'uds'}
                                {product.unitPrice ? (
                                  <>
                                    {' x '}
                                    {product.unitPrice.toFixed(2)} €/{product.format === 'granel' ? 'kg' : 'ud'}
                                    {' = '}
                                    <span className="text-emerald-950 text-sm sm:text-base font-black">
                                      {totalProductPrice ? totalProductPrice.toFixed(2) : '0.00'} €
                                    </span>
                                  </>
                                ) : null}
                              </div>

                              {/* 2. SEGUNDA LÍNEA: Modalidad de envío y horario (si lo tiene definido), y SEGUIDO el estado del pedido */}
                              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-stone-700">
                                <div className="flex items-center gap-1.5">
                                  {ev.deliveryType === 'sitio_fisico' ? (
                                    <>
                                      <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                      <span>Punto de entrega</span>
                                    </>
                                  ) : ev.deliveryType === 'envio' ? (
                                    <>
                                      <Truck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                      <span>Envío a domicilio</span>
                                    </>
                                  ) : (
                                    <>
                                      <Store className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                      <span>Recogida en caserío</span>
                                    </>
                                  )}
                                  {ev.deliverySchedule && (
                                    <span className="text-stone-600 font-semibold">
                                      (Horario: {ev.deliverySchedule})
                                    </span>
                                  )}
                                </div>

                                <span className="text-stone-400 font-black">•</span>

                                {/* Seguido el estado del pedido */}
                                {stStyle ? (
                                  <span
                                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${stStyle.bg} ${stStyle.text} ${stStyle.border}`}
                                  >
                                    {stStyle.label}
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-stone-100 text-stone-800 border border-stone-300">
                                    Pedido
                                  </span>
                                )}
                              </div>

                              {/* 3. TERCERA LÍNEA (Abajo del todo): Nombre y apellido del comprador, seguido de dirección de entrega (si no se recoge en caserío) */}
                              <div className="flex items-center justify-between gap-2 pt-0.5 text-xs">
                                <div className="flex flex-wrap items-center gap-1 text-stone-800 font-bold min-w-0">
                                  {role === 'vendedor' ? (
                                    <>
                                      <User className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                                      <span>
                                        Comprador: <strong className="text-stone-900 font-black">{ev.customerName || 'Cliente'}</strong>
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <Store className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                      <span>
                                        Vendedor: <strong className="text-stone-900 font-black">{ev.sellerName || 'Caserío'}</strong>
                                      </span>
                                    </>
                                  )}

                                  {/* Si no se recoge en caserío: seguido de dirección de entrega */}
                                  {ev.deliveryType !== 'caserio' && ev.deliveryLocation && (
                                    <>
                                      <span className="text-stone-400 font-black mx-0.5">•</span>
                                      <span className="text-stone-700 font-semibold truncate max-w-[280px] sm:max-w-md">
                                        {ev.deliveryType === 'sitio_fisico'
                                          ? `Dirección: ${ev.deliveryLocation.replace(/^Punto:\s*/i, '')}`
                                          : `Dirección: ${ev.deliveryLocation.replace(/^Envío:\s*/i, '')}`}
                                      </span>
                                    </>
                                  )}
                                </div>

                                {/* Acciones: Ver día en calendario & Chat */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleJumpToEvent(ev.date)}
                                    title="Ver día en el calendario"
                                    className="px-2.5 py-1 bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 rounded-xl text-[11px] font-black transition-colors flex items-center gap-1 shadow-2xs"
                                  >
                                    <CalendarIcon className="w-3 h-3 text-emerald-700" />
                                    <span className="hidden sm:inline">Ver día</span>
                                  </button>

                                  {ev.chatUserId && (
                                    <Link
                                      href={`/chat/${ev.chatUserId}`}
                                      title="Chatear"
                                      className="p-1.5 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 text-emerald-900 rounded-xl transition-colors shadow-2xs"
                                    >
                                      <MessageCircle className="w-3.5 h-3.5" />
                                    </Link>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    }

                    // Caso de evento de Cosecha disponible o producto individual
                    return (
                      <div
                        key={ev.id}
                        className="flex items-center gap-3.5 sm:gap-5 p-3.5 sm:p-4 rounded-2xl border-2 border-amber-200 bg-amber-50/60 hover:bg-amber-50 hover:border-amber-400 transition-all shadow-2xs"
                      >
                        {/* A LA IZQUIERDA: DIBUJO DEL PRODUCTO Y NOMBRE JUSTO DEBAJO */}
                        <div className="w-20 sm:w-24 shrink-0 flex flex-col items-center text-center">
                          {ev.productImageUrl ? (
                            <img
                              src={ev.productImageUrl}
                              alt={ev.title}
                              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-amber-300 shadow-2xs bg-white"
                            />
                          ) : (
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-100 text-amber-800 font-black text-base flex items-center justify-center border-2 border-amber-300 shrink-0 shadow-2xs">
                              🌾
                            </div>
                          )}
                          <span className="font-black text-stone-900 text-xs sm:text-sm mt-1.5 line-clamp-2 leading-tight">
                            {ev.title.replace(/^Cosecha lista:\s*/i, '')}
                          </span>
                        </div>

                        {/* A SU DERECHA: LAS 3 LÍNEAS */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          {/* 1. PRIMERA LÍNEA: Cantidad y Precio */}
                          <div className="text-xs sm:text-sm font-black text-stone-900">
                            {ev.subtitle && (
                              <span className="font-extrabold text-amber-950 mr-2">
                                {ev.subtitle}
                              </span>
                            )}
                            {ev.amount !== undefined && (
                              <span className="text-emerald-950 font-black">
                                {ev.amount.toFixed(2)} €
                              </span>
                            )}
                          </div>

                          {/* 2. SEGUNDA LÍNEA: Modalidad y Estado Cosecha */}
                          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-stone-700">
                            <div className="flex items-center gap-1.5">
                              <Store className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              <span>En instalaciones del caserío</span>
                            </div>

                            <span className="text-stone-400 font-black">•</span>

                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-600 text-white border border-amber-700">
                              Cosecha
                            </span>
                          </div>

                          {/* 3. TERCERA LÍNEA (Abajo del todo): Nombre del Caserío */}
                          <div className="flex items-center justify-between gap-2 pt-0.5 text-xs">
                            <div className="flex items-center gap-1.5 text-stone-800 font-bold">
                              <Store className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              <span>
                                Caserío: <strong className="text-stone-900 font-black">{ev.sellerName || 'Tu caserío'}</strong>
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleJumpToEvent(ev.date)}
                              title="Ver día en el calendario"
                              className="px-2.5 py-1 bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 rounded-xl text-[11px] font-black transition-colors flex items-center gap-1 shadow-2xs"
                            >
                              <CalendarIcon className="w-3 h-3 text-emerald-700" />
                              <span className="hidden sm:inline">Ver día</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-stone-500 space-y-1">
            <CalendarIcon className="w-8 h-8 mx-auto text-stone-400 mb-1" />
            <p className="text-xs font-bold text-stone-800">
              No hay fechas de entrega ni cosechas programadas por el momento.
            </p>
            <p className="text-[11px]">
              Tus próximos pedidos aparecerán organizados por fecha aquí.
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
