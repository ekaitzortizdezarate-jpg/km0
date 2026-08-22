'use client';

import { Store, MapPin, Truck } from 'lucide-react';

interface DeliveryMethodsBadgesProps {
  deliveryMethods?: string[] | null;
  className?: string;
}

export function DeliveryMethodsBadges({
  deliveryMethods,
  className = '',
}: DeliveryMethodsBadgesProps) {
  const methods =
    deliveryMethods && Array.isArray(deliveryMethods) && deliveryMethods.length > 0
      ? deliveryMethods
      : ['caserio', 'punto_entrega', 'domicilio'];

  const hasCaserio = methods.includes('caserio');
  const hasPunto = methods.includes('punto_entrega');
  const hasDomicilio = methods.includes('domicilio');

  return (
    <div className={`inline-flex items-center gap-1 shrink-0 ${className}`}>
      {/* 1. Caserío */}
      <span
        title={
          hasCaserio
            ? 'Disponible para recogida en Caserío'
            : 'No disponible para recogida en caserío'
        }
        className={`p-1 rounded-lg border flex items-center justify-center transition-all ${
          hasCaserio
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
            : 'bg-stone-100 text-stone-300 border-stone-200 opacity-40'
        }`}
      >
        <Store className="w-3.5 h-3.5" />
      </span>

      {/* 2. Punto de Entrega */}
      <span
        title={
          hasPunto
            ? 'Disponible en Puntos de Entrega físicos'
            : 'No disponible en puntos de entrega'
        }
        className={`p-1 rounded-lg border flex items-center justify-center transition-all ${
          hasPunto
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
            : 'bg-stone-100 text-stone-300 border-stone-200 opacity-40'
        }`}
      >
        <MapPin className="w-3.5 h-3.5" />
      </span>

      {/* 3. Domicilio */}
      <span
        title={
          hasDomicilio
            ? 'Disponible para Envío a Domicilio'
            : 'No disponible para envío a domicilio'
        }
        className={`p-1 rounded-lg border flex items-center justify-center transition-all ${
          hasDomicilio
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
            : 'bg-stone-100 text-stone-300 border-stone-200 opacity-40'
        }`}
      >
        <Truck className="w-3.5 h-3.5" />
      </span>
    </div>
  );
}
