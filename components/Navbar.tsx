import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { signout } from '@/app/actions/auth';
import { LogOut } from 'lucide-react';
import type { Profile } from '@/types/database';
import { NavbarNavLinks } from '@/components/NavbarNavLinks';

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  let sellerPendingCount = 0;
  let buyerConfirmedCount = 0;
  let unreadMessagesCount = 0;

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = data;

    // Contar mensajes no leídos
    const { count: unreadCount } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('is_read', false);
    unreadMessagesCount = unreadCount || 0;

    if (profile?.role === 'vendedor') {
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', user.id)
        .eq('status', 'pendiente');
      sellerPendingCount = count || 0;
    } else {
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('buyer_id', user.id)
        .eq('status', 'confirmado');
      buyerConfirmedCount = count || 0;
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b-2 border-stone-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="bg-emerald-800 text-white font-black text-xl px-2.5 py-1 rounded-xl shadow-sm">
            km0
          </span>
          <span className="font-black text-stone-900 text-lg hidden sm:inline">
            Caserío y Proximidad
          </span>
        </Link>

        {/* Enlaces con Resaltado Activo y Globos */}
        <div className="flex items-center gap-1 sm:gap-2">
          <NavbarNavLinks
            user={user}
            profile={profile}
            unreadMessagesCount={unreadMessagesCount}
            sellerPendingCount={sellerPendingCount}
            buyerConfirmedCount={buyerConfirmedCount}
          />

          {user && (
            <form action={signout} className="ml-1">
              <button
                type="submit"
                title="Cerrar sesión"
                className="p-2 text-stone-500 hover:text-red-700 rounded-xl hover:bg-stone-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}