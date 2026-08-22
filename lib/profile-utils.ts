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

    const metaRole = (user.user_metadata?.role as string) || null;
    const metaFullName =
      (user.user_metadata?.full_name as string) ||
      user.email?.split('@')[0] ||
      'Usuario';
    const metaTown = (user.user_metadata?.town as string) || 'Local';
    const metaPhone = (user.user_metadata?.phone as string) || null;
    const metaAddress = (user.user_metadata?.address as string) || null;

    // Caso 1: El perfil existe
    if (existing) {
      // Si en los metadatos de auth el usuario se registró como 'vendedor' pero en la BD quedó como 'comprador':
      if (metaRole === 'vendedor' && existing.role !== 'vendedor') {
        const { data: updated } = await supabase
          .from('profiles')
          .update({
            role: 'vendedor',
            seller_status: 'approved',
          })
          .eq('id', user.id)
          .select('*')
          .single();

        return updated || { ...existing, role: 'vendedor', seller_status: 'approved' };
      }

      return existing as Profile;
    }

    // Caso 2: El perfil no existe todavía en la tabla profiles -> Crearlo
    const roleToSet = metaRole || 'comprador';
    const newProfile = {
      id: user.id,
      role: roleToSet as any,
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
    return {
      id: user.id,
      role: (user.user_metadata?.role as any) || 'comprador',
      full_name: (user.user_metadata?.full_name as string) || 'Usuario',
      town: (user.user_metadata?.town as string) || 'Local',
      phone: (user.user_metadata?.phone as string) || null,
      address: (user.user_metadata?.address as string) || null,
      avatar_url: null,
      bio: null,
      seller_status: 'approved',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Profile;
  }
}
