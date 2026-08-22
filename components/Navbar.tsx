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
  let unreadMessagesCount = 0;
  let ordersList: any[] = [];

  if (user) {
    const [userProfile, unreadRes, ordersRes] = await Promise.all([
      getOrCreateUserProfile(supabase, user),
      supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false),
      supabase
        .from('orders')
        .select('id, updated_at, created_at, status, seller_id, buyer_id')
        .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`)
        .order('updated_at', { ascending: false })
        .limit(50),
    ]);

    profile = userProfile;
    unreadMessagesCount = unreadRes.count || 0;
    ordersList = ordersRes.data || [];
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b-2 border-stone-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-1 sm:gap-2">
        {/* Enlaces y Navegación Unificada con km0 Mercado */}
        <NavbarNavLinks
          user={user}
          profile={profile}
          unreadMessagesCount={unreadMessagesCount}
          orders={ordersList}
        />
      </div>
    </header>
  );
}