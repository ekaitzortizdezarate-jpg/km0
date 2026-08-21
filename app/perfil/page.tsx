import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { updateProfile } from '@/app/actions/profile';
import { User, MapPin, Phone, FileText } from 'lucide-react';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="max-w-xl mx-auto py-6">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-700">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone-900">Configuración de Cuenta</h1>
            <p className="text-xs text-stone-500 capitalize">Rol: {profile?.role} ({profile?.seller_status})</p>
          </div>
        </div>

        <form
          action={async (formData: FormData) => {
            'use server';
            await updateProfile(formData);
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-stone-500" /> Nombre Completo / Caserío
            </label>
            <input
              name="full_name"
              type="text"
              defaultValue={profile?.full_name}
              required
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-stone-500" /> Pueblo / Municipio
            </label>
            <input
              name="town"
              type="text"
              defaultValue={profile?.town}
              required
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-stone-500" /> Teléfono
            </label>
            <input
              name="phone"
              type="tel"
              defaultValue={profile?.phone || ''}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-stone-500" /> Dirección habitual
            </label>
            <input
              name="address"
              type="text"
              defaultValue={profile?.address || ''}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-stone-500" /> Biografía / Presentación
            </label>
            <textarea
              name="bio"
              rows={3}
              defaultValue={profile?.bio || ''}
              placeholder="Cuéntanos un poco sobre tu huerta o actividad..."
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            Guardar Cambios
          </button>
        </form>
      </div>
    </div>
  );
}