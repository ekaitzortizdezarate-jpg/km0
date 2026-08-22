import { createClient } from '@/lib/supabase/server';
import { signout } from '@/app/actions/auth';
import { LogOut } from 'lucide-react';
import type { Profile } from '@/types/database';
import { NavbarNavLinks } from '@/components/NavbarNavLinks';
import { getOrCreateUserProfile } from '@/lib/profile-utils';

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
    const [userProfile, unreadRes, sellerOrdersRes, buyerOrdersRes] = await Promise.all([
      getOrCreateUserProfile(supabase, user),
      supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false),
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', user.id)
        .eq('status', 'pendiente'),
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('buyer_id', user.id)
        .eq('status', 'confirmado'),
    ]);

    profile = userProfile;
    unreadMessagesCount = unreadRes.count || 0;
    if (profile?.role === 'vendedor') {
      sellerPendingCount = sellerOrdersRes.count || 0;
    } else {
      buyerConfirmedCount = buyerOrdersRes.count || 0;
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b-2 border-stone-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-1 sm:gap-2">
        {/* Enlaces y Navegación Unificada con km0 Mercado */}
        <NavbarNavLinks
          user={user}
          profile={profile}
          unreadMessagesCount={unreadMessagesCount}
          sellerPendingCount={sellerPendingCount}
          buyerConfirmedCount={buyerConfirmedCount}
        />

        {user && (
          <form action={signout} className="ml-1 shrink-0">
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
    </header>
  );
}