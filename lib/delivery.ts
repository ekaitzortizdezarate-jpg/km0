import { AvailabilityType, DeliveryPoint } from '@/types/database';

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

export function getBaseAvailabilityDate(
  availabilityType?: string,
  availableFromDate?: string | null,
  baseDate: Date = new Date()
): { readyDate: Date; isPreorder: boolean; availPrefix: string } {
  const readyDate = new Date(baseDate);
  let isPreorder = false;
  let availPrefix = '';

  if (availabilityType === 'fecha_concreta' && availableFromDate) {
    const parsed = new Date(availableFromDate + 'T12:00:00');
    if (!isNaN(parsed.getTime())) {
      const now = new Date(baseDate);
      if (parsed.getTime() > now.getTime()) {
        readyDate.setTime(parsed.getTime());
        isPreorder = true;
        availPrefix = `(Cosecha a partir del ${readyDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}) `;
      }
    }
  }

  return { readyDate, isPreorder, availPrefix };
}

export function getCaserioEstimate(
  item: {
    availabilityType?: string;
    availableFromDate?: string | null;
    caserioSchedule?: string | null;
  },
  baseDate: Date = new Date()
): { dateStr: string; scheduleText?: string } {
  const { readyDate, availPrefix } = getBaseAvailabilityDate(item.availabilityType, item.availableFromDate, baseDate);
  const schedule = item.caserioSchedule || '';

  const lowerSched = schedule.toLowerCase();
  const matchedWeekdays: string[] = [];
  const daysMap: Record<string, string> = {
    lunes: 'lunes',
    martes: 'martes',
    miércoles: 'miercoles',
    miercoles: 'miercoles',
    jueves: 'jueves',
    viernes: 'viernes',
    sábado: 'sabado',
    sabado: 'sabado',
    domingo: 'domingo',
  };

  for (const [key, val] of Object.entries(daysMap)) {
    if (lowerSched.includes(key) && !matchedWeekdays.includes(val)) {
      matchedWeekdays.push(val);
    }
  }

  const resultDate = new Date(readyDate);
  if (matchedWeekdays.length > 0) {
    let daysToAdd = 0;
    while (daysToAdd <= 7) {
      const checkDate = new Date(readyDate);
      checkDate.setDate(checkDate.getDate() + daysToAdd);
      const dayName = WEEKDAY_NAMES[checkDate.getDay()];
      if (matchedWeekdays.includes(dayName)) {
        resultDate.setTime(checkDate.getTime());
        break;
      }
      daysToAdd++;
    }
  } else {
    resultDate.setDate(resultDate.getDate() + 1);
  }

  const formattedDate = resultDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

  const hoursMatch = schedule.match(/\bde\s+\d{1,2}:\d{2}\s+a\s+\d{1,2}:\d{2}\b/i) || schedule.match(/\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}/i);
  const hoursText = hoursMatch ? `(${hoursMatch[0]})` : '';

  return {
    dateStr: `${availPrefix}${formattedDate} ${hoursText}`.trim(),
    scheduleText: schedule || 'Horario de caserío',
  };
}

export function getPuntoEntregaEstimate(
  item: {
    availabilityType?: string;
    availableFromDate?: string | null;
    availabilityWeekdays?: string[] | null;
  },
  point?: DeliveryPoint | null,
  baseDate: Date = new Date()
): { dateStr: string; scheduleText?: string } {
  const { readyDate, availPrefix } = getBaseAvailabilityDate(item.availabilityType, item.availableFromDate, baseDate);

  let pointWeekdays: string[] = [];
  if (point?.days_of_week && point.days_of_week.length > 0) {
    pointWeekdays = point.days_of_week.map((d) => d.toLowerCase());
  } else if (point?.schedule_notes) {
    const lowerSched = point.schedule_notes.toLowerCase();
    const daysMap: Record<string, string> = {
      lunes: 'lunes',
      martes: 'martes',
      miércoles: 'miercoles',
      miercoles: 'miercoles',
      jueves: 'jueves',
      viernes: 'viernes',
      sábado: 'sabado',
      sabado: 'sabado',
      domingo: 'domingo',
    };
    for (const [key, val] of Object.entries(daysMap)) {
      if (lowerSched.includes(key) && !pointWeekdays.includes(val)) {
        pointWeekdays.push(val);
      }
    }
  } else if (item.availabilityWeekdays && item.availabilityWeekdays.length > 0) {
    pointWeekdays = item.availabilityWeekdays.map((d) => d.toLowerCase());
  }

  const resultDate = new Date(readyDate);
  if (pointWeekdays.length > 0) {
    let daysToAdd = 0;
    while (daysToAdd <= 7) {
      const checkDate = new Date(readyDate);
      checkDate.setDate(checkDate.getDate() + daysToAdd);
      const dayName = WEEKDAY_NAMES[checkDate.getDay()];
      if (pointWeekdays.includes(dayName)) {
        resultDate.setTime(checkDate.getTime());
        break;
      }
      daysToAdd++;
    }
  } else {
    resultDate.setDate(resultDate.getDate() + 1);
  }

  const formattedDate = resultDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

  const hoursText = point?.opening_time && point?.closing_time
    ? `(de ${point.opening_time} a ${point.closing_time})`
    : point?.schedule_notes
    ? `(${point.schedule_notes})`
    : '';

  return {
    dateStr: `${availPrefix}${formattedDate} ${hoursText}`.trim(),
    scheduleText: point?.schedule_notes || (point?.opening_time && point?.closing_time ? `De ${point.opening_time} a ${point.closing_time}` : undefined),
  };
}

export function getDomicilioEstimate(
  item: {
    availabilityType?: string;
    availableFromDate?: string | null;
    availabilityDays?: number | null;
    availabilityWeekdays?: string[] | null;
  },
  baseDate: Date = new Date()
): { dateStr: string; detailLead?: string } {
  const { readyDate, availPrefix } = getBaseAvailabilityDate(item.availabilityType, item.availableFromDate, baseDate);

  const resultDate = new Date(readyDate);
  const hasFixedWeekdays = item.availabilityWeekdays && item.availabilityWeekdays.length > 0;

  if (hasFixedWeekdays) {
    const weekdays = item.availabilityWeekdays!.map((d) => d.toLowerCase());
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

    const readableDays = weekdays.map((w) => WEEKDAY_DISPLAY[w] || w).join(', ');
    const formattedDate = resultDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
    });

    return {
      dateStr: `${availPrefix}${formattedDate}`,
      detailLead: `Días fijos de reparto: ${readableDays}`,
    };
  }

  const days = item.availabilityDays !== null && item.availabilityDays !== undefined ? item.availabilityDays : 1;
  resultDate.setDate(resultDate.getDate() + days);

  const formattedDate = resultDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

  const leadText = days === 0 ? 'Mismo día (0d)' : days === 1 ? 'En 24h (1 día)' : `En ${days} días`;

  return {
    dateStr: `${availPrefix}${formattedDate} (${leadText})`,
    detailLead: leadText,
  };
}

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
