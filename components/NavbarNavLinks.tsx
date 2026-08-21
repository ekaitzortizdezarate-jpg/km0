'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShoppingBasket,
  User,
  ShieldCheck,
  Calendar,
  MessageCircle,
  Store,
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
      ? sellerPendingCount
      : buyerConfirmedCount;

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {/* 1. Catálogo */}
      <Link
        href="/"
        className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm transition-all flex items-center gap-1.5 ${
          isCatalogueActive
            ? 'bg-emerald-800 text-white font-black shadow-sm'
            : 'text-stone-700 hover:text-emerald-800 hover:bg-stone-100 font-bold'
        }`}
      >
        <span>Catálogo</span>
      </Link>

      {/* 2. Cesta (solo compradores/visitantes) */}
      {profile?.role !== 'vendedor' && <CartNavButton />}

      {user && profile ? (
        <>
          {/* 3. Mensajes / Chat (Pestaña Naranja si hay mensaje nuevo) */}
          <Link
            href="/chat"
            title={unreadMessagesCount > 0 ? `${unreadMessagesCount} mensajes nuevos sin leer` : 'Mis mensajes y chats'}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm transition-all flex items-center gap-1.5 ${
              isChatActive
                ? 'bg-emerald-800 text-white font-black shadow-sm'
                : unreadMessagesCount > 0
                ? 'bg-amber-500 hover:bg-amber-600 text-stone-950 font-black shadow-md border-2 border-amber-600 animate-pulse'
                : 'text-stone-700 hover:text-emerald-800 hover:bg-stone-100 font-bold'
            }`}
          >
            <MessageCircle
              className={`w-4 h-4 ${
                isChatActive
                  ? 'text-white'
                  : unreadMessagesCount > 0
                  ? 'text-stone-950'
                  : 'text-emerald-700'
              }`}
            />
            <span className="hidden md:inline">Mensajes</span>
          </Link>

          {/* 4. Calendario */}
          <Link
            href={calendarHref}
            title="Calendario de entregas y compras"
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm transition-all flex items-center gap-1.5 ${
              isCalendarActive
                ? 'bg-emerald-800 text-white font-black shadow-sm'
                : 'text-stone-700 hover:text-emerald-800 hover:bg-stone-100 font-bold'
            }`}
          >
            <Calendar
              className={`w-4 h-4 ${isCalendarActive ? 'text-white' : 'text-emerald-700'}`}
            />
            <span className="hidden md:inline">Calendario</span>
          </Link>

          {/* 5. Pedidos (Pestaña Naranja si hay aviso de pedido) */}
          <Link
            href={ordersHref}
            title={
              profile.role === 'vendedor'
                ? `${ordersBadgeCount} pedidos pendientes por validar`
                : `${ordersBadgeCount} pedidos confirmados por el caserío`
            }
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm transition-all flex items-center gap-1.5 ${
              isOrdersActive
                ? 'bg-emerald-800 text-white font-black shadow-sm'
                : ordersBadgeCount > 0
                ? 'bg-amber-500 hover:bg-amber-600 text-stone-950 font-black shadow-md border-2 border-amber-600 animate-pulse'
                : 'text-stone-700 hover:text-emerald-800 hover:bg-stone-100 font-bold'
            }`}
          >
            <ShoppingBasket
              className={`w-4 h-4 ${
                isOrdersActive
                  ? 'text-white'
                  : ordersBadgeCount > 0
                  ? 'text-stone-950'
                  : 'text-stone-700'
              }`}
            />
            <span className="hidden md:inline">Pedidos</span>
          </Link>

          {/* 6. Admin (si aplica) */}
          {profile.role === 'admin' && (
            <Link
              href="/admin"
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm transition-all flex items-center gap-1.5 ${
                isAdminActive
                  ? 'bg-emerald-800 text-white font-black shadow-sm'
                  : 'bg-stone-100 text-stone-900 hover:bg-stone-200 font-black border border-stone-300'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Admin</span>
            </Link>
          )}

          {/* 7. Perfil */}
          <Link
            href="/perfil"
            title="Mi Perfil"
            className={`flex items-center gap-2 p-1.5 rounded-xl transition-all border ${
              isProfileActive
                ? 'bg-emerald-800 text-white border-emerald-900 font-black shadow-sm'
                : 'hover:bg-stone-100 border-stone-200 text-stone-900'
            }`}
          >
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                className="w-6 h-6 rounded-full object-cover border border-emerald-500"
              />
            ) : (
              <User
                className={`w-4 h-4 ${isProfileActive ? 'text-white' : 'text-stone-700'}`}
              />
            )}
            <div className="hidden lg:flex flex-col text-left">
              <span
                className={`text-xs font-black leading-none truncate max-w-[100px] ${
                  isProfileActive ? 'text-white' : 'text-stone-900'
                }`}
              >
                {profile.full_name}
              </span>
              <span
                className={`text-[9px] font-bold capitalize ${
                  isProfileActive ? 'text-emerald-200' : 'text-stone-500'
                }`}
              >
                {profile.role}
              </span>
            </div>
          </Link>
        </>
      ) : (
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link
            href="/login"
            className="text-xs sm:text-sm font-bold text-stone-800 hover:text-emerald-800 px-3 py-1.5 rounded-xl hover:bg-stone-100"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="text-xs sm:text-sm font-black bg-emerald-800 hover:bg-emerald-900 text-white px-3.5 py-1.5 rounded-xl transition-colors shadow-sm"
          >
            Registrarse
          </Link>
        </div>
      )}
    </div>
  );
}

export default NavbarNavLinks;
