'use client';

import { useState } from 'react';
import { User, MapPin, Phone, FileText, Pencil, CheckCircle2, X } from 'lucide-react';
import { ImageSelector } from '@/components/ImageSelector';
import { updateProfile } from '@/app/actions/profile';
import type { Profile } from '@/types/database';
import { useRouter } from 'next/navigation';

interface ProfileEditorProps {
  initialProfile: Profile;
}

export function ProfileEditor({ initialProfile }: ProfileEditorProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData(e.currentTarget);
    const res = await updateProfile(formData);

    setLoading(false);
    if (res?.error) {
      setErrorMsg(res.error);
    } else {
      setSuccessMsg('Perfil actualizado correctamente.');
      // Actualizar el estado local
      setProfile((prev) => ({
        ...prev,
        full_name: (formData.get('full_name') as string) || prev.full_name,
        town: (formData.get('town') as string) || prev.town,
        phone: (formData.get('phone') as string) || null,
        address: (formData.get('address') as string) || null,
        bio: (formData.get('bio') as string) || null,
        avatar_url: (formData.get('avatar_url') as string) || prev.avatar_url,
      }));
      setIsEditing(false);
      router.refresh();
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-stone-200 shadow-sm p-6 sm:p-8 space-y-6">
      {/* CABECERA: Si ya tiene imagen, se muestra a la izquierda de Configurar Cuenta */}
      <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.full_name || 'Avatar'}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-400 shadow-sm shrink-0"
          />
        ) : (
          <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-800 shrink-0">
            <User className="w-6 h-6" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-black text-stone-900">Configurar Cuenta</h1>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border-2 border-emerald-200 text-emerald-900 rounded-2xl text-xs font-black flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-red-50 border-2 border-red-200 text-red-900 rounded-2xl text-xs font-black">
          {errorMsg}
        </div>
      )}

      {/* MODO VISTA O MODO EDICIÓN */}
      {!isEditing ? (
        /* MODO VISTA: Solo visible, sin selector de imagen, con botón Editar abajo */
        <div className="space-y-4">
          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
            <span className="text-[11px] font-black text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-stone-600" /> Nombre Completo / Caserío
            </span>
            <p className="text-sm font-bold text-stone-900">
              {profile.full_name || <span className="text-stone-400 font-normal">Sin especificar</span>}
            </p>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
            <span className="text-[11px] font-black text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-stone-600" /> Pueblo / Municipio
            </span>
            <p className="text-sm font-bold text-stone-900">
              {profile.town || <span className="text-stone-400 font-normal">Sin especificar</span>}
            </p>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
            <span className="text-[11px] font-black text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-stone-600" /> Teléfono
            </span>
            <p className="text-sm font-bold text-stone-900">
              {profile.phone || <span className="text-stone-400 font-normal">Sin especificar</span>}
            </p>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
            <span className="text-[11px] font-black text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-stone-600" /> Dirección habitual
            </span>
            <p className="text-sm font-bold text-stone-900">
              {profile.address || <span className="text-stone-400 font-normal">Sin especificar</span>}
            </p>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
            <span className="text-[11px] font-black text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-stone-600" /> Biografía / Presentación de tu huerta
            </span>
            <p className="text-xs font-semibold text-stone-800 whitespace-pre-wrap">
              {profile.bio || <span className="text-stone-400 font-normal">Sin biografía añadida</span>}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="w-full bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white font-extrabold py-3 rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-4"
          >
            <Pencil className="w-4 h-4" />
            <span>Editar</span>
          </button>
        </div>
      ) : (
        /* MODO EDICIÓN: Con selector de imagen y todos los inputs editables */
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Foto del Vendedor / Avatar: se muestra en modo edición */}
          <ImageSelector
            name="avatar_url"
            defaultValue={profile.avatar_url}
            label={profile.role === 'vendedor' ? 'Foto de tu Caserío o Perfil' : 'Foto de Perfil'}
            type="avatar"
          />

          <div>
            <label className="text-xs font-black text-stone-900 mb-1 flex items-center gap-1.5 uppercase tracking-wider">
              <User className="w-3.5 h-3.5 text-stone-600" /> Nombre Completo / Caserío *
            </label>
            <input
              name="full_name"
              type="text"
              defaultValue={profile.full_name || ''}
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
              defaultValue={profile.town || ''}
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
              defaultValue={profile.phone || ''}
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
              defaultValue={profile.address || ''}
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
              defaultValue={profile.bio || ''}
              placeholder="Cuéntanos un poco sobre tu huerta o actividad agrícola..."
              className="w-full px-3.5 py-2.5 border-2 border-stone-300 rounded-xl text-xs font-semibold text-stone-900 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white font-extrabold py-3 rounded-xl text-sm shadow-md transition-all disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar cambios del perfil'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
