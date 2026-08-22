import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { updateProfile } from '@/app/actions/profile';
import { User, MapPin, Phone, FileText } from 'lucide-react';
import { ImageSelector } from '@/components/ImageSelector';
import { ProfileRoleSelector } from '@/components/ProfileRoleSelector';
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
      <div className="bg-white rounded-3xl border-2 border-stone-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
          <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-800">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-stone-900">Configuración de Cuenta</h1>
            <p className="text-xs font-bold text-stone-600 capitalize">
              Modo actual: {userProfile.role === 'vendedor' ? 'Caserío / Vendedor' : 'Comprador'}
            </p>
          </div>
        </div>

        {/* Selector Rápido de Rol (Vendedor vs Comprador) */}
        <ProfileRoleSelector currentRole={userProfile.role} />

        <form
          action={async (formData: FormData) => {
            'use server';
            await updateProfile(formData);
          }}
          className="space-y-4"
        >
          {/* Foto del Vendedor / Avatar */}
          <ImageSelector
            name="avatar_url"
            defaultValue={userProfile.avatar_url}
            label={userProfile.role === 'vendedor' ? 'Foto de tu Caserío o Perfil' : 'Foto de Perfil'}
            type="avatar"
          />

          <div>
            <label className="text-xs font-black text-stone-900 mb-1 flex items-center gap-1.5 uppercase tracking-wider">
              <User className="w-3.5 h-3.5 text-stone-600" /> Nombre Completo / Caserío *
            </label>
            <input
              name="full_name"
              type="text"
              defaultValue={userProfile.full_name || ''}
              required
              className="w-full px-3.5 py-2.5 border-2 border-stone-300 rounded-xl text-sm font-bold text-stone-900 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-black text-stone-900 mb-1 flex items-center gap-1.5 uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-stone-600" /> Pueblo / Municipio *
            </label>
            <input
              name="town"
              type="text"
              defaultValue={userProfile.town || ''}
              required
              className="w-full px-3.5 py-2.5 border-2 border-stone-300 rounded-xl text-sm font-bold text-stone-900 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-black text-stone-900 mb-1 flex items-center gap-1.5 uppercase tracking-wider">
              <Phone className="w-3.5 h-3.5 text-stone-600" /> Teléfono
            </label>
            <input
              name="phone"
              type="tel"
              defaultValue={userProfile.phone || ''}
              className="w-full px-3.5 py-2.5 border-2 border-stone-300 rounded-xl text-sm font-bold text-stone-900 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-black text-stone-900 mb-1 flex items-center gap-1.5 uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-stone-600" /> Dirección habitual
            </label>
            <input
              name="address"
              type="text"
              defaultValue={userProfile.address || ''}
              className="w-full px-3.5 py-2.5 border-2 border-stone-300 rounded-xl text-sm font-bold text-stone-900 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-black text-stone-900 mb-1 flex items-center gap-1.5 uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5 text-stone-600" /> Biografía / Presentación de tu huerta
            </label>
            <textarea
              name="bio"
              rows={3}
              defaultValue={userProfile.bio || ''}
              placeholder="Cuéntanos un poco sobre tu huerta o actividad agrícola..."
              className="w-full px-3.5 py-2.5 border-2 border-stone-300 rounded-xl text-xs font-semibold text-stone-900 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white font-extrabold py-3 rounded-xl text-sm shadow-md transition-all"
          >
            Guardar Cambios del Perfil
          </button>
        </form>
      </div>
    </div>
  );
}