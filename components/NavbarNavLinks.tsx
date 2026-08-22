'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShoppingBasket,
  User,
  ShieldCheck,
  Calendar,
  MessageCircle,
} from 'lucide-react';
import type { Profile } from '@/types/database';
import { CartNavButton } from '@/components/CartNavButton';

interface NavbarNavLinksProps {
  user: { id: string } | null;
  profile: Profile | null;
  unreadMessagesCount: number;
  sellerPendingCount: number;
  buyerConfirmedCount: number;
}

export function NavbarNavLinks({
  user,
  profile,
  unreadMessagesCount,
  sellerPendingCount,
  buyerConfirmedCount,
}: NavbarNavLinksProps) {
  const pathname = usePathname();

  const isCatalogueActive = pathname === '/';
  const isChatActive = pathname.startsWith('/chat');
  const isCalendarActive = pathname.includes('/calendario');
  const isOrdersActive = pathname.includes('/pedidos');
  const isAdminActive = pathname.startsWith('/admin');
  const isProfileActive = pathname.startsWith('/perfil');

  // Estado local para limpiar alertas en cuanto se entra en la sección
  const [localUnread, setLocalUnread] = useState(unreadMessagesCount);
  const [localSellerPending, setLocalSellerPending] = useState(sellerPendingCount);
  const [localBuyerConfirmed, setLocalBuyerConfirmed] = useState(buyerConfirmedCount);

  useEffect(() => {
    setLocalUnread(unreadMessagesCount);
  }, [unreadMessagesCount]);

  useEffect(() => {
    setLocalSellerPending(sellerPendingCount);
  }, [sellerPendingCount]);

  useEffect(() => {
    setLocalBuyerConfirmed(buyerConfirmedCount);
  }, [buyerConfirmedCount]);

  useEffect(() => {
    if (isChatActive) {
      setLocalUnread(0);
    }
    if (isOrdersActive) {
      if (profile?.role === 'vendedor') {
        setLocalSellerPending(0);
      } else {
        setLocalBuyerConfirmed(0);
      }
    }
  }, [pathname, isChatActive, isOrdersActive, profile?.role]);

  const calendarHref =
    profile?.role === 'vendedor'
      ? '/vendedor/calendario'
      : '/comprador/calendario';

  const ordersHref =
    profile?.role === 'vendedor'
      ? '/vendedor/pedidos'
      : '/comprador/pedidos';

  const ordersBadgeCount =
    profile?.role === 'vendedor'
      ? localSellerPending
      : localBuyerConfirmed;

  return (
    <div className="flex items-center gap-1 sm:gap-1.5">
      {/* 1. km0 y Mercado unificados */}
      <Link
        href="/"
        title="Mercado y Catálogo - km0"
        className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-xl transition-all ${
          isCatalogueActive
            ? 'bg-emerald-800 text-white font-black shadow-sm'
            : 'text-stone-700 hover:text-emerald-800 hover:bg-stone-100 font-bold'
        }`}
      >
        <span className={`font-black text-xs sm:text-sm leading-none tracking-tight ${isCatalogueActive ? 'text-white' : 'text-emerald-700'}`}>
          km0
        </span>
        <span className="text-[8px] sm:text-[10px] font-black uppercase leading-tight tracking-wider text-center sm:text-left max-w-[46px] sm:max-w-none truncate">
          MERCADO
        </span>
      </Link>

      {/* 2. Cesta (solo compradores/visitantes) */}
      {profile?.role !== 'vendedor' && <CartNavButton />}

      {user && profile ? (
        <>
          {/* 3. Chat (Pestaña Naranja si hay mensaje nuevo) */}
          <Link
            href="/chat"
            title={localUnread > 0 ? `${localUnread} mensajes nuevos sin leer` : 'Mis conversaciones y chat'}
            className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-xl transition-all ${
              isChatActive
                ? 'bg-emerald-800 text-white font-black shadow-sm'
                : localUnread > 0
                ? 'bg-amber-500 hover:bg-amber-600 text-stone-950 font-black shadow-md border-2 border-amber-600 animate-pulse'
                : 'text-stone-700 hover:text-emerald-800 hover:bg-stone-100 font-bold'
            }`}
          >
            <MessageCircle
              className={`w-4 h-4 shrink-0 ${
                isChatActive
                  ? 'text-white'
                  : localUnread > 0
                  ? 'text-stone-950'
                  : 'text-emerald-700'
              }`}
            />
            <span className="text-[8px] sm:text-[10px] font-black uppercase leading-tight tracking-wider text-center max-w-[44px] sm:max-w-none truncate">
              CHAT
            </span>
          </Link>

          {/* 4. Fechas (Calendario) */}
          <Link
            href={calendarHref}
            title="Fechas y calendario de entregas"
            className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-xl transition-all ${
              isCalendarActive
                ? 'bg-emerald-800 text-white font-black shadow-sm'
                : 'text-stone-700 hover:text-emerald-800 hover:bg-stone-100 font-bold'
            }`}
          >
            <Calendar
              className={`w-4 h-4 shrink-0 ${isCalendarActive ? 'text-white' : 'text-emerald-700'}`}
            />
            <span className="text-[8px] sm:text-[10px] font-black uppercase leading-tight tracking-wider text-center max-w-[46px] sm:max-w-none truncate">
              FECHAS
            </span>
          </Link>

          {/* 5. Pedidos (Pestaña Naranja si hay aviso de pedido) */}
          <Link
            href={ordersHref}
            title={
              profile.role === 'vendedor'
                ? `${ordersBadgeCount} pedidos pendientes por validar`
                : `${ordersBadgeCount} pedidos confirmados por el caserío`
            }
            className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-xl transition-all ${
              isOrdersActive
                ? 'bg-emerald-800 text-white font-black shadow-sm'
                : ordersBadgeCount > 0
                ? 'bg-amber-500 hover:bg-amber-600 text-stone-950 font-black shadow-md border-2 border-amber-600 animate-pulse'
                : 'text-stone-700 hover:text-emerald-800 hover:bg-stone-100 font-bold'
            }`}
          >
            <ShoppingBasket
              className={`w-4 h-4 shrink-0 ${
                isOrdersActive
                  ? 'text-white'
                  : ordersBadgeCount > 0
                  ? 'text-stone-950'
                  : 'text-emerald-700'
              }`}
            />
            <span className="text-[8px] sm:text-[10px] font-black uppercase leading-tight tracking-wider text-center max-w-[46px] sm:max-w-none truncate">
              PEDIDOS
            </span>
          </Link>

          {/* 6. Admin (si aplica) */}
          {profile.role === 'admin' && (
            <Link
              href="/admin"
              title="Panel de Administración"
              className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-xl transition-all ${
                isAdminActive
                  ? 'bg-emerald-800 text-white font-black shadow-sm'
                  : 'bg-stone-100 text-stone-900 hover:bg-stone-200 font-black border border-stone-300'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-700" />
              <span className="text-[8px] sm:text-[10px] font-black uppercase leading-tight tracking-wider text-center max-w-[44px] sm:max-w-none truncate">
                ADMIN
              </span>
            </Link>
          )}

          {/* 7. Perfil / Mi Cuenta */}
          <Link
            href="/perfil"
            title={profile.role === 'vendedor' ? 'Mi Caserío' : 'Mi Perfil'}
            className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-xl transition-all ${
              isProfileActive
                ? 'bg-emerald-800 text-white font-black shadow-sm'
                : 'text-stone-700 hover:text-emerald-800 hover:bg-stone-100 font-bold'
            }`}
          >
            <User className={`w-4 h-4 shrink-0 ${isProfileActive ? 'text-white' : 'text-emerald-700'}`} />
            <span className="text-[8px] sm:text-[10px] font-black uppercase leading-tight tracking-wider text-center max-w-[46px] sm:max-w-none truncate">
              {profile.role === 'vendedor' ? 'CASERÍO' : 'PERFIL'}
            </span>
          </Link>
        </>
      ) : (
        /* Visitante / No Logueado */
        <div className="flex items-center gap-1 sm:gap-1.5">
          <Link
            href="/login"
            className="text-stone-700 hover:text-emerald-800 font-black uppercase text-[10px] sm:text-xs px-2 sm:px-2.5 py-1.5 rounded-xl hover:bg-stone-100 transition-colors"
          >
            ENTRAR
          </Link>
          <Link
            href="/register"
            className="bg-emerald-800 hover:bg-emerald-900 text-white font-black uppercase text-[10px] sm:text-xs px-2.5 sm:px-3 py-1.5 rounded-xl shadow-sm transition-all"
          >
            REGISTRO
          </Link>
        </div>
      )}
    </div>
  );
}
