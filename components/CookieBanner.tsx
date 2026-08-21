'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie, Check, Shield } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'km0_cookie_consent';

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = (type: 'all' | 'necessary') => {
    localStorage.setItem(COOKIE_CONSENT_KEY, type);
    setShowBanner(false);
  };

  if (!mounted || !showBanner) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[99990] p-4 sm:p-6 bg-stone-900/95 text-white backdrop-blur-md border-t-2 border-emerald-600 shadow-2xl animate-fadeIn">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3 max-w-3xl">
          <div className="p-2 bg-emerald-700 text-white rounded-xl shrink-0 mt-0.5">
            <Cookie className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <p className="text-xs sm:text-sm font-bold text-white">
              Privacidad y Cookies en km0
            </p>
            <p className="text-[11px] sm:text-xs text-stone-300 leading-snug">
              Utilizamos cookies técnicas y almacenamiento local estrictamente necesarios para mantener tu sesión segura y gestionar tu cesta de la compra. No utilizamos cookies publicitarias de terceros. Consulta nuestra{' '}
              <Link href="/cookies" className="text-emerald-400 underline font-bold hover:text-emerald-300">
                Política de Cookies
              </Link>{' '}
              y{' '}
              <Link href="/privacidad" className="text-emerald-400 underline font-bold hover:text-emerald-300">
                Política de Privacidad
              </Link>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={() => handleAccept('necessary')}
            className="flex-1 sm:flex-none px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-xl border border-stone-600 transition-colors"
          >
            Solo Necesarias
          </button>

          <button
            type="button"
            onClick={() => handleAccept('all')}
            className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Check className="w-3.5 h-3.5" /> Aceptar Todas
          </button>
        </div>
      </div>
    </div>
  );
}

export default CookieBanner;
