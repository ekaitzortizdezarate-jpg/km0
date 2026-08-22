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

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const userProfile = (profile || {
    id: user.id,
    role: 'comprador',
    full_name: '',
    town: '',
    phone: '',
    address: '',
    bio: '',
    avatar_url: '',
    seller_status: 'approved',
  }) as Profile;

  return (
    <div className="max-w-xl mx-auto py-6 space-y-6">
      <ProfileEditor initialProfile={userProfile} />
    </div>
  );
}