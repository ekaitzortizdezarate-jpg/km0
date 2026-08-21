import { AvailabilityType } from '@/types/database';

export interface DeliveryEstimate {
  badgeText: string;
  detailText: string;
  estimatedDate: Date;
  formattedDate: string;
}

const WEEKDAY_NAMES = [
  'domingo',
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
];

const WEEKDAY_DISPLAY: Record<string, string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
  domingo: 'Domingo',
};

export function getDeliveryEstimate(
  availabilityType: AvailabilityType = 'inmediato',
  availabilityDays: number | null = null,
  availabilityWeekdays: string[] | null = null,
  availableFromDate: string | null = null,
  baseDate: Date = new Date()
): DeliveryEstimate {
  const readyDate = new Date(baseDate);
  let baseDescription = 'Disponible ya (24h)';

  // 1. Calcular fecha base en la que el producto está listo/recolectado
  if (availabilityType === 'dias') {
    const days = Math.max(1, availabilityDays || 1);
    readyDate.setDate(readyDate.getDate() + days);
    baseDescription = `Preparación en ${days} ${days === 1 ? 'día' : 'días'}`;
  } else if (availabilityType === 'fecha_concreta' && availableFromDate) {
    const parsed = new Date(availableFromDate + 'T12:00:00');
    if (!isNaN(parsed.getTime())) {
      readyDate.setTime(parsed.getTime());
      baseDescription = `A partir del ${readyDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`;
    }
  } else {
    // inmediato
    readyDate.setDate(readyDate.getDate() + 1);
    baseDescription = 'Listo en 24h';
  }

  // 2. Si hay días específicos de entrega configurados, combinar
  const weekdays =
    availabilityWeekdays && availabilityWeekdays.length > 0
      ? availabilityWeekdays.map((d) => d.toLowerCase())
      : null;

  const resultDate = new Date(readyDate);

  if (weekdays && weekdays.length > 0) {
    // Avanzar desde readyDate hasta el siguiente día de la semana que coincida
    let daysToAdd = 0;
    while (daysToAdd <= 7) {
      const checkDate = new Date(readyDate);
      checkDate.setDate(checkDate.getDate() + daysToAdd);
      const dayName = WEEKDAY_NAMES[checkDate.getDay()];
      if (weekdays.includes(dayName)) {
        resultDate.setTime(checkDate.getTime());
        break;
      }
      daysToAdd++;
    }

    const readableDays = weekdays
      .map((w) => WEEKDAY_DISPLAY[w] || w)
      .join(' y ');

    return {
      badgeText: `${baseDescription} · Entregas ${readableDays}`,
      detailText: `${baseDescription}. Entrega programada los ${readableDays} (${resultDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })})`,
      estimatedDate: resultDate,
      formattedDate: resultDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    };
  }

  // Sin días fijos de semana
  return {
    badgeText: baseDescription,
    detailText: `Entrega prevista: ${readyDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}`,
    estimatedDate: readyDate,
    formattedDate: readyDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
  };
}

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'hace un momento';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `hace ${diffInMinutes} min`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `hace ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `hace ${diffInDays} ${diffInDays === 1 ? 'día' : 'días'}`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}
