import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { signout } from '@/app/actions/auth';
import {
  ShoppingBasket,
  User,
  LogOut,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import type { Profile } from '@/types/database';
import { CartNavButton } from '@/components/CartNavButton';

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  let sellerPendingCount = 0;

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = data;

    if (profile?.role === 'vendedor') {
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', user.id)
        .eq('status', 'pendiente');
      sellerPendingCount = count || 0;
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b-2 border-stone-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="bg-emerald-800 text-white font-black text-xl px-2.5 py-1 rounded-xl shadow-sm">
            km0
          </span>
          <span className="font-black text-stone-900 text-lg hidden sm:inline">
            Caserío y Proximidad
          </span>
        </Link>

        {/* Enlaces y Acciones */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="text-xs sm:text-sm font-bold text-stone-800 hover:text-emerald-800 px-2 py-1.5 rounded-lg transition-colors"
          >
            Catálogo
          </Link>

          {/* Botón de Cesta de la compra (solo para compradores y visitantes) */}
          {profile?.role !== 'vendedor' && <CartNavButton />}

          {user && profile ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Acceso a Admin */}
              {profile.role === 'admin' && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 bg-stone-100 text-stone-900 hover:bg-stone-200 text-xs font-black px-3 py-1.5 rounded-xl border border-stone-300 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Admin</span>
                </Link>
              )}

              {/* Pestaña Calendario */}
              <Link
                href={
                  profile.role === 'vendedor'
                    ? '/vendedor/calendario'
                    : '/comprador/calendario'
                }
                title="Ver calendario de entregas y pedidos"
                className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-stone-800 hover:text-emerald-800 p-1.5 sm:px-2 sm:py-1.5 rounded-xl hover:bg-stone-100 transition-colors"
              >
                <Calendar className="w-4 h-4 text-emerald-700" />
                <span className="hidden md:inline">Calendario</span>
              </Link>

              {/* Panel de Pedidos con Globo Notificación para Vendedor */}
              <Link
                href={
                  profile.role === 'vendedor'
                    ? '/vendedor/pedidos'
                    : '/comprador/pedidos'
                }
                className="relative flex items-center gap-1.5 text-xs sm:text-sm font-bold text-stone-800 hover:text-emerald-800 p-1.5 sm:px-2 sm:py-1.5 rounded-xl hover:bg-stone-100 transition-colors"
              >
                <ShoppingBasket className="w-4 h-4 text-stone-700" />
                <span className="hidden md:inline">Pedidos</span>
                {profile.role === 'vendedor' && sellerPendingCount > 0 && (
                  <span
                    title={`${sellerPendingCount} nuevos pedidos por validar`}
                    className="bg-amber-400 text-stone-950 font-black text-[10px] px-1.5 py-0.2 rounded-full animate-bounce shadow-sm border border-amber-600"
                  >
                    {sellerPendingCount}
                  </span>
                )}
              </Link>

              {/* Perfil con Avatar */}
              <Link
                href="/perfil"
                title="Mi Perfil"
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-stone-100 transition-colors border border-stone-200"
              >
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    className="w-6 h-6 rounded-full object-cover border border-emerald-600"
                  />
                ) : (
                  <User className="w-4 h-4 text-stone-700" />
                )}
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs font-black text-stone-900 leading-none truncate max-w-[110px]">
                    {profile.full_name}
                  </span>
                  <span className="text-[10px] font-bold text-stone-500 capitalize">
                    {profile.role}
                  </span>
                </div>
              </Link>

              {/* Cerrar Sesión */}
              <form action={signout}>
                <button
                  type="submit"
                  title="Cerrar sesión"
                  className="p-2 text-stone-500 hover:text-red-700 rounded-xl hover:bg-stone-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-xs sm:text-sm font-bold text-stone-800 hover:text-emerald-800 px-3 py-1.5"
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
      </div>
    </header>
  );
}