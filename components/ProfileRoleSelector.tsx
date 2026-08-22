'use client';

import { useState } from 'react';
import { Store, ShoppingCart, CheckCircle2, RefreshCw } from 'lucide-react';
import { switchUserRole } from '@/app/actions/profile';
import { useRouter } from 'next/navigation';

interface ProfileRoleSelectorProps {
  currentRole: 'vendedor' | 'comprador' | 'admin';
}

export function ProfileRoleSelector({ currentRole }: ProfileRoleSelectorProps) {
  const router = useRouter();
  const [role, setRole] = useState(currentRole);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleSwitch = async (newRole: 'vendedor' | 'comprador') => {
    if (newRole === role || loading) return;
    setLoading(true);
    setMsg(null);

    const res = await switchUserRole(newRole);
    setLoading(false);

    if (res.error) {
      alert('Error al cambiar rol: ' + res.error);
    } else {
      setRole(newRole);
      setMsg(`¡Cuenta cambiada a modo ${newRole === 'vendedor' ? 'Caserío / Vendedor' : 'Comprador'}!`);
      setTimeout(() => setMsg(null), 3000);
      router.refresh();
      window.location.reload();
    }
  };

  return (
    <div className="bg-stone-50 p-4 sm:p-5 rounded-2xl border-2 border-stone-200 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase text-stone-500 tracking-wider block">
            Tipo de Cuenta Activa
          </span>
          <h3 className="text-sm font-black text-stone-900">
            {role === 'vendedor' ? '🏡 Caserío / Productor Vendedor' : '🛒 Comprador'}
          </h3>
        </div>

        {loading && (
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-800">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Cambiando...
          </span>
        )}
      </div>

      {msg && (
        <div className="p-2.5 bg-emerald-100 text-emerald-950 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <button
          type="button"
          disabled={loading}
          onClick={() => handleSwitch('vendedor')}
          className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col justify-between gap-1 ${
            role === 'vendedor'
              ? 'border-emerald-800 bg-emerald-800 text-white shadow-md'
              : 'border-stone-300 bg-white text-stone-700 hover:border-emerald-700'
          }`}
        >
          <span className="flex items-center gap-1.5 text-xs font-black">
            <Store className="w-4 h-4" />
            <span>Modo Caserío</span>
          </span>
          <span className={`text-[10px] font-semibold ${role === 'vendedor' ? 'text-emerald-100' : 'text-stone-500'}`}>
            Publicar productos y gestionar pedidos
          </span>
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => handleSwitch('comprador')}
          className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col justify-between gap-1 ${
            role === 'comprador'
              ? 'border-emerald-800 bg-emerald-800 text-white shadow-md'
              : 'border-stone-300 bg-white text-stone-700 hover:border-emerald-700'
          }`}
        >
          <span className="flex items-center gap-1.5 text-xs font-black">
            <ShoppingCart className="w-4 h-4" />
            <span>Modo Comprador</span>
          </span>
          <span className={`text-[10px] font-semibold ${role === 'comprador' ? 'text-emerald-100' : 'text-stone-500'}`}>
            Comprar cestas y hacer pedidos
          </span>
        </button>
      </div>
    </div>
  );
}

export default ProfileRoleSelector;
