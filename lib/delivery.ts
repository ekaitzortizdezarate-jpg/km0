import { AvailabilityType } from '@/types/database';

export interface DeliveryEstimate {
  badgeText: string;
  detailText: string;
  estimatedDate: Date;
  formattedDate: string;
  isPreorder: boolean;
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
  let isPreorder = false;
  let availText = 'Disponible ya';

  // 1. Determinar cuándo está disponible el producto/cosecha
  if (availabilityType === 'fecha_concreta' && availableFromDate) {
    const parsed = new Date(availableFromDate + 'T12:00:00');
    if (!isNaN(parsed.getTime())) {
      const now = new Date(baseDate);
      if (parsed.getTime() > now.getTime()) {
        readyDate.setTime(parsed.getTime());
        isPreorder = true;
        availText = `Cosecha desde ${readyDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`;
      }
    }
  }

  // 2. Determinar plazo de entrega tras estar disponible
  const hasFixedWeekdays =
    availabilityWeekdays && availabilityWeekdays.length > 0;

  const resultDate = new Date(readyDate);

  if (hasFixedWeekdays) {
    const weekdays = availabilityWeekdays!.map((d) => d.toLowerCase());
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

    const badge = isPreorder
      ? `${availText} · Entregas ${readableDays}`
      : `Entregas ${readableDays}`;

    return {
      badgeText: badge,
      detailText: `${availText}. Entregas los ${readableDays} (prevista el ${resultDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })})`,
      estimatedDate: resultDate,
      formattedDate: resultDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      isPreorder,
    };
  }

  // Entrega a X días tras pedido / disponibilidad
  const days = availabilityDays !== null && availabilityDays !== undefined ? availabilityDays : 1;
  resultDate.setDate(resultDate.getDate() + days);

  let deliveryLeadText = '';
  if (days === 0) {
    deliveryLeadText = 'Mismo día';
  } else if (days === 1) {
    deliveryLeadText = 'Al día siguiente (24h)';
  } else {
    deliveryLeadText = `En ${days} días tras pedido`;
  }

  const badge = isPreorder
    ? `${availText} · Entrega ${deliveryLeadText}`
    : days === 0
    ? 'Entrega en el día'
    : days === 1
    ? 'Entrega en 24h'
    : `Entrega en ${days} días`;

  return {
    badgeText: badge,
    detailText: isPreorder
      ? `${availText}. Preparación y entrega ${deliveryLeadText} (${resultDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })})`
      : `Entrega prevista: ${resultDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })} (${deliveryLeadText})`,
    estimatedDate: resultDate,
    formattedDate: resultDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    isPreorder,
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
