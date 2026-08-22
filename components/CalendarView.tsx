'use client';

import { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Store,
  Truck,
  User,
} from 'lucide-react';
import Link from 'next/link';

export interface CalendarEvent {
  id: string;
  type: 'order' | 'product_available';
  date: string; // YYYY-MM-DD
  title: string;
  subtitle?: string;
  status?: string;
  amount?: number;
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

export function CalendarView({ events, role }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // First day of month (0 = Sunday, 1 = Monday)
  const firstDay = new Date(year, month, 1);
  const startingDay = (firstDay.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Map events by date string
  const eventsByDate = events.reduce((acc, ev) => {
    const key = ev.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(ev);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  const selectedDateEvents = eventsByDate[selectedDateStr] || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                    <div>
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
                    </div>

                    {ev.amount !== undefined && (
                      <span className="font-black text-stone-900 text-sm">
                        {ev.amount.toFixed(2)} €
                      </span>
                    )}
                  </div>

                  {ev.items && (
                    <p className="text-xs font-semibold text-stone-700">
                      Productos: {ev.items}
                    </p>
                  )}

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
                        <Store className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      ) : (
                        <Truck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
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
