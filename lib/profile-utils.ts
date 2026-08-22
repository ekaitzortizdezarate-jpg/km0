import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Profile } from '@/types/database';

export async function getOrCreateUserProfile(
  supabase: SupabaseClient,
  user: User | null
): Promise<Profile | null> {
  if (!user) return null;

  try {
    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    // Si el perfil ya existe en la base de datos, respetamos exactamente su rol
    if (existing) {
      return existing as Profile;
    }

    // Si es un usuario nuevo sin perfil creado, creamos su perfil inicial
    const metaRole = (user.user_metadata?.role as string) || 'comprador';
    const metaFullName =
      (user.user_metadata?.full_name as string) ||
      user.email?.split('@')[0] ||
      'Usuario';
    const metaTown = (user.user_metadata?.town as string) || 'Local';
    const metaPhone = (user.user_metadata?.phone as string) || null;
    const metaAddress = (user.user_metadata?.address as string) || null;

    const newProfile = {
      id: user.id,
      role: metaRole as any,
      full_name: metaFullName,
      town: metaTown,
      phone: metaPhone,
      address: metaAddress,
      avatar_url: null,
      bio: null,
      seller_status: 'approved',
    };

    const { data: inserted } = await supabase
      .from('profiles')
      .insert(newProfile)
      .select('*')
      .single();

    if (inserted) return inserted as Profile;

    return {
      ...newProfile,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Profile;
  } catch (err) {
    console.error('Error in getOrCreateUserProfile:', err);
    return null;
  }
}
