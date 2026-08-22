import type { Profile } from '@/types/database';

export interface ProfileValidationResult {
  isComplete: boolean;
  missingFields: string[];
}

export function validateProfileCompleteness(profile?: Partial<Profile> | null): ProfileValidationResult {
  if (!profile) {
    return {
      isComplete: false,
      missingFields: ['Perfil no configurado'],
    };
  }

  const missing: string[] = [];

  // 1. Nombre y Apellido 1
  const nameParts = (profile.full_name || '').trim().split(/\s+/);
  if (!nameParts[0]) {
    missing.push('nombre');
  }
  if (!nameParts[1]) {
    missing.push('apellido 1');
  }

  // 2. Fecha de nacimiento y DNI
  if (!profile.birth_date?.trim()) {
    missing.push('fecha de nacimiento');
  }
  if (!profile.dni?.trim()) {
    missing.push('dni');
  }

  // 3. Teléfono
  if (!profile.phone?.trim()) {
    missing.push('telefono');
  }

  // 4. Pueblo y Código Postal
  if (!profile.town?.trim()) {
    missing.push('pueblo');
  }
  if (!profile.postal_code?.trim()) {
    missing.push('codigo postal');
  }

  // 5. Dirección: calle, portal, piso, puerta
  const rawAddr = profile.address || '';
  let calle = rawAddr;
  let portal = '';
  let piso = '';
  let puerta = '';

  try {
    if (rawAddr.startsWith('{') && rawAddr.endsWith('}')) {
      const parsed = JSON.parse(rawAddr);
      calle = parsed.calle || '';
      portal = parsed.portal || '';
      piso = parsed.piso || '';
      puerta = parsed.puerta || '';
    } else {
      const portalMatch = rawAddr.match(/(?:Nº|N|Portal|Número)\s*(\S+)/i);
      if (portalMatch) portal = portalMatch[1].replace(/,$/, '');

      const pisoMatch = rawAddr.match(/(?:Piso)\s*(\S+)/i);
      if (pisoMatch) piso = pisoMatch[1].replace(/,$/, '');

      const ptaMatch = rawAddr.match(/(?:Pta|Puerta)\s*(\S+)/i);
      if (ptaMatch) puerta = ptaMatch[1].replace(/,$/, '');

      if (rawAddr.includes(',')) {
        calle = rawAddr.split(',')[0].trim();
      }
    }
  } catch {}

  if (!calle?.trim() || calle === rawAddr && !portal) {
    // Si la dirección es solo un string simple sin desglosar o vacía
    if (!calle?.trim()) missing.push('calle');
  }
  if (!portal?.trim()) missing.push('portal');
  if (!piso?.trim()) missing.push('piso');
  if (!puerta?.trim()) missing.push('puerta');

  return {
    isComplete: missing.length === 0,
    missingFields: missing,
  };
}
