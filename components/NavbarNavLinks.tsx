'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShoppingBasket,
  User,
  ShieldCheck,
  Calendar,
  MessageCircle,
  LogIn,
  UserPlus,
  MapPin,
  LogOut,
} from 'lucide-react';
import type { Profile } from '@/types/database';
import { CartNavButton } from '@/components/CartNavButton';
import { signout } from '@/app/actions/auth';
import { getUnreadOrdersCount } from '@/lib/order-read-tracker';

interface NavbarNavLinksProps {
  user: { id: string } | null;
  profile: Profile | null;
  unreadMessagesCount: number;
  orders?: any[];
}

export function NavbarNavLinks({
  user,
  profile,
  unreadMessagesCount,
  orders = [],
}: NavbarNavLinksProps) {
  const pathname = usePathname();

  const isCatalogueActive = pathname === '/';
  const isOrdersActive = pathname.includes('/pedidos');
  const isCalendarActive = pathname.includes('/calendario');
  const isDeliveryPointsActive = pathname.startsWith('/vendedor/puntos-entrega');
  const isChatActive = pathname.startsWith('/chat');
  const isAdminActive = pathname.startsWith('/admin');
  const isProfileActive = pathname.startsWith('/perfil');

  const [localUnread, setLocalUnread] = useState(unreadMessagesCount);
  const isSeller = profile?.role === 'vendedor';
  const role = isSeller ? 'vendedor' : 'comprador';

  const relevantOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    if (!user) return [];
    return orders.filter((o) => (isSeller ? o.seller_id === user.id : o.buyer_id === user.id));
  }, [orders, isSeller, user]);

  const [unreadOrdersCount, setUnreadOrdersCount] = useState(0);

  useEffect(() => {
    setLocalUnread(unreadMessagesCount);
  }, [unreadMessagesCount]);

  useEffect(() => {
    if (isChatActive) {
      setLocalUnread(0);
    }
  }, [pathname, isChatActive]);

  useEffect(() => {
    const count = getUnreadOrdersCount(relevantOrders, role);
    setUnreadOrdersCount(count);
  }, [relevantOrders, role]);

  useEffect(() => {
    const handleOrderReadEvent = () => {
      const count = getUnreadOrdersCount(relevantOrders, role);
      setUnreadOrdersCount(count);
    };
    window.addEventListener('km0_orders_read_updated', handleOrderReadEvent);
    return () => {
      window.removeEventListener('km0_orders_read_updated', handleOrderReadEvent);
    };
  }, [relevantOrders, role]);

  const calendarHref =
    profile?.role === 'vendedor'
      ? '/vendedor/calendario'
      : '/comprador/calendario';

  const ordersHref =
    profile?.role === 'vendedor'
      ? '/vendedor/pedidos'
      : '/comprador/pedidos';

  const ordersBadgeCount = unreadOrdersCount;

  return (
    <div className="flex items-center justify-between w-full gap-1 sm:gap-2">
      {/* 1. Lado Izquierdo: Mercado, Cesta, Pedidos, Fechas, y si es Vendedor: Sitios */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
        {/* 1. MERCADO / km0 */}
        <Link
          href="/"
          title="Mercado y Catálogo - km0"
          className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl transition-all ${
            isCatalogueActive
              ? 'bg-emerald-800 text-white font-black shadow-sm border-2 border-emerald-800'
              : 'border-2 border-emerald-600/90 hover:border-emerald-700 bg-transparent hover:bg-emerald-50 text-emerald-900 hover:text-emerald-950 font-black shadow-2xs'
          }`}
        >
          <span
            className={`font-black text-xs sm:text-sm leading-none tracking-tight ${
              isCatalogueActive ? 'text-white' : 'text-emerald-800'
            }`}
          >
            km0
          </span>
          <span
            className={`text-[8px] sm:text-[10px] font-black uppercase leading-tight tracking-wider text-center sm:text-left max-w-[46px] sm:max-w-none truncate ${
              isCatalogueActive ? 'text-white' : 'text-emerald-950'
            }`}
          >
            MERCADO
          </span>
        </Link>

        {/* 2. CESTA (solo compradores / visitantes) */}
        {!isSeller && <CartNavButton />}

        {user && profile && (
          <>
            {/* 3. PEDIDOS (Pestaña Naranja si hay aviso de pedido) */}
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

            {/* 4. FECHAS (Calendario) */}
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
                className={`w-4 h-4 shrink-0 ${
                  isCalendarActive ? 'text-white' : 'text-emerald-700'
                }`}
              />
              <span className="text-[8px] sm:text-[10px] font-black uppercase leading-tight tracking-wider text-center max-w-[46px] sm:max-w-none truncate">
                FECHAS
              </span>
            </Link>

            {/* 5. SITIOS (Puntos de entrega para vendedores a la derecha de Fechas con icono arriba) */}
            {isSeller && (
              <Link
                href="/vendedor/puntos-entrega"
                title="Puntos de Entrega y Ubicaciones del Caserío"
                className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-xl transition-all ${
                  isDeliveryPointsActive
                    ? 'bg-emerald-800 text-white font-black shadow-sm'
                    : 'text-stone-700 hover:text-emerald-800 hover:bg-stone-100 font-bold'
                }`}
              >
                <MapPin
                  className={`w-4 h-4 shrink-0 ${
                    isDeliveryPointsActive ? 'text-white' : 'text-emerald-700'
                  }`}
                />
                <span className="text-[8px] sm:text-[10px] font-black uppercase leading-tight tracking-wider text-center max-w-[46px] sm:max-w-none truncate">
                  SITIOS
                </span>
              </Link>
            )}
          </>
        )}
      </div>

      {/* 2. Lado Derecho: Chat y Cuenta alineados a la derecha (y Admin / Salir) */}
      <div className="flex items-center gap-1 sm:gap-1.5 ml-auto shrink-0">
        {user && profile ? (
          <>
            {/* CHAT (Pestaña Naranja si hay mensaje nuevo) */}
            <Link
              href="/chat"
              title={
                localUnread > 0
                  ? `${localUnread} mensajes nuevos sin leer`
                  : 'Mis conversaciones y chat'
              }
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

            {/* CUENTA (Vendedor y Comprador) */}
            <Link
              href="/perfil"
              title="Mi Cuenta"
              className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-xl transition-all ${
                isProfileActive
                  ? 'bg-emerald-800 text-white font-black shadow-sm'
                  : 'text-stone-700 hover:text-emerald-800 hover:bg-stone-100 font-bold'
              }`}
            >
              <User
                className={`w-4 h-4 shrink-0 ${
                  isProfileActive ? 'text-white' : 'text-emerald-700'
                }`}
              />
              <span className="text-[8px] sm:text-[10px] font-black uppercase leading-tight tracking-wider text-center max-w-[46px] sm:max-w-none truncate">
                CUENTA
              </span>
            </Link>

            {/* ADMIN (si aplica) */}
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

            {/* CERRAR SESIÓN */}
            <form action={signout} className="ml-0.5 shrink-0">
              <button
                type="submit"
                title="Cerrar sesión"
                className="p-1.5 sm:p-2 text-stone-400 hover:text-red-700 rounded-xl hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/login"
              className="flex items-center gap-1 text-stone-700 hover:text-emerald-800 font-black uppercase text-[10px] sm:text-xs px-2 sm:px-3 py-1.5 rounded-xl hover:bg-stone-100 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5 sm:hidden text-stone-500" />
              <span>ENTRAR</span>
            </Link>
            <Link
              href="/register"
              className="flex items-center gap-1 bg-emerald-800 hover:bg-emerald-900 text-white font-black uppercase text-[10px] sm:text-xs px-2.5 sm:px-3.5 py-1.5 rounded-xl shadow-sm transition-all"
            >
              <UserPlus className="w-3.5 h-3.5 sm:hidden" />
              <span>REGISTRO</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
