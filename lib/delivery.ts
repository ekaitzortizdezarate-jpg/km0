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
  const resultDate = new Date(baseDate);

  if (availabilityType === 'inmediato') {
    // Listo de inmediato / en 24h
    resultDate.setDate(resultDate.getDate() + 1);
    return {
      badgeText: 'Disponible ya',
      detailText: 'Listo para entrega inmediata (24h)',
      estimatedDate: resultDate,
      formattedDate: resultDate.toLocaleDateString('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }),
    };
  }

  if (availabilityType === 'dias') {
    const days = Math.max(1, availabilityDays || 1);
    resultDate.setDate(resultDate.getDate() + days);
    return {
      badgeText: `Listo en ${days} ${days === 1 ? 'día' : 'días'}`,
      detailText: `Preparación en ${days} ${days === 1 ? 'día' : 'días'} tras el pedido`,
      estimatedDate: resultDate,
      formattedDate: resultDate.toLocaleDateString('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }),
    };
  }

  if (availabilityType === 'dias_semana') {
    const weekdays =
      availabilityWeekdays && availabilityWeekdays.length > 0
        ? availabilityWeekdays.map((d) => d.toLowerCase())
        : ['viernes'];

    // Encontrar el siguiente día de la semana que coincida
    let daysToAdd = 1;
    while (daysToAdd <= 7) {
      const checkDate = new Date(baseDate);
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
      badgeText: `Entregas: ${readableDays}`,
      detailText: `Entregas programadas los ${readableDays}`,
      estimatedDate: resultDate,
      formattedDate: resultDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
      }),
    };
  }

  if (availabilityType === 'fecha_concreta') {
    if (availableFromDate) {
      const parsed = new Date(availableFromDate);
      if (!isNaN(parsed.getTime())) {
        resultDate.setTime(parsed.getTime());
      }
    } else {
      resultDate.setDate(resultDate.getDate() + 3);
    }

    return {
      badgeText: `Desde ${resultDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`,
      detailText: `Disponible a partir del ${resultDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      estimatedDate: resultDate,
      formattedDate: resultDate.toLocaleDateString('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    };
  }

  return {
    badgeText: 'Disponible',
    detailText: 'Consultar disponibilidad',
    estimatedDate: resultDate,
    formattedDate: resultDate.toLocaleDateString('es-ES'),
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
