import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProfileEditor } from '@/components/ProfileEditor';
import type { Profile } from '@/types/database';

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Si quedaron datos base64 inflados en user_metadata de sesiones previas, limpiarlos del JWT
  if (
    user.user_metadata?.avatar_url &&
    typeof user.user_metadata.avatar_url === 'string' &&
    (user.user_metadata.avatar_url.startsWith('data:') || user.user_metadata.avatar_url.length > 500)
  ) {
    await supabase.auth.updateUser({
      data: { avatar_url: null },
    });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const meta = user.user_metadata || {};
  const userProfile: Profile = {
    id: user.id,
    role: profile?.role || meta.role || 'comprador',
    full_name: profile?.full_name || meta.full_name || '',
    town: profile?.town || meta.town || '',
    phone: profile?.phone || meta.phone || '',
    postal_code: profile?.postal_code || meta.postal_code || null,
    birth_date: profile?.birth_date || meta.birth_date || null,
    dni: profile?.dni || meta.dni || null,
    address: profile?.address || meta.address || null,
    address_notes: profile?.address_notes || meta.address_notes || null,
    bio: profile?.bio || meta.bio || null,
    avatar_url: profile?.avatar_url || (meta.avatar_url && !meta.avatar_url.startsWith('data:') ? meta.avatar_url : null),
    seller_status: profile?.seller_status || 'approved',
    created_at: profile?.created_at || new Date().toISOString(),
    updated_at: profile?.updated_at || new Date().toISOString(),
  };

  return (
    <div className="max-w-xl mx-auto py-6 space-y-6">
      <ProfileEditor initialProfile={userProfile} />
    </div>
  );
}