import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { signout } from '@/app/actions/auth';
import { ShoppingBasket, User, LogOut, PlusCircle, ShieldCheck } from 'lucide-react';
import type { Profile } from '@/types/database';

export default async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="bg-emerald-700 text-white font-black text-xl px-2.5 py-1 rounded-lg">
            km0
          </span>
          <span className="font-bold text-stone-900 text-lg hidden sm:inline">
            Caserío y Proximidad
          </span>
        </Link>

        {/* Enlaces y Acciones */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/"
            className="text-sm font-medium text-stone-700 hover:text-emerald-700 transition-colors"
          >
            Catálogo
          </Link>

          {user && profile ? (
            <div className="flex items-center gap-3">
              {/* Acciones según el rol */}
              {profile.role === 'vendedor' && (
                <>
                  <Link
                    href="/vendedor/productos/nuevo"
                    className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Publicar Producto</span>
                  </Link>
                </>
              )}

              {profile.role === 'admin' && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 bg-stone-100 text-stone-800 hover:bg-stone-200 text-xs font-semibold px-3 py-1.5 rounded-lg border border-stone-300 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Admin</span>
                </Link>
              )}

              {/* Panel de pedidos */}
              <Link
                href={profile.role === 'vendedor' ? '/vendedor/pedidos' : '/comprador/pedidos'}
                className="flex items-center gap-1.5 text-sm font-medium text-stone-700 hover:text-emerald-700 transition-colors"
              >
                <ShoppingBasket className="w-4 h-4" />
                <span className="hidden md:inline">Mis Pedidos</span>
              </Link>

              {/* Perfil */}
              <Link
                href="/perfil"
                title="Mi Perfil"
                className="p-2 text-stone-600 hover:text-emerald-700 rounded-lg hover:bg-stone-100 transition-colors flex items-center gap-1 text-xs"
              >
                <User className="w-4 h-4" />
                <span className="hidden md:inline font-medium">Perfil</span>
              </Link>

              {/* Nombre y Rol */}
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-stone-900 leading-tight">
                  {profile.full_name}
                </span>
                <span className="text-[10px] text-stone-500 capitalize">
                  {profile.role} ({profile.town})
                </span>
              </div>

              {/* Cerrar Sesión */}
              <form action={signout}>
                <button
                  type="submit"
                  title="Cerrar sesión"
                  className="p-2 text-stone-500 hover:text-red-600 rounded-lg hover:bg-stone-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-sm font-medium text-stone-700 hover:text-emerald-700 px-3 py-1.5"
              >
                Entrar
              </Link>
              <Link
                href="/register"
                className="text-sm font-medium bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-1.5 rounded-lg transition-colors"
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