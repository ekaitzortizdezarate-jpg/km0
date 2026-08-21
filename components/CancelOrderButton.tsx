'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { cancelPendingOrder } from '@/app/actions/orders';

interface CancelOrderButtonProps {
  orderId: string;
  className?: string;
  label?: string;
}

export function CancelOrderButton({
  orderId,
  className = '',
  label = 'Cancelar / Eliminar Pedido',
}: CancelOrderButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (!confirm('¿Estás seguro de que deseas cancelar y eliminar este pedido?')) {
      return;
    }

    setLoading(true);
    try {
      const res = await cancelPendingOrder(orderId);
      if (res?.error) {
        alert(res.error);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cancelar.';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      disabled={loading}
      onClick={handleCancel}
      title="Cancelar y eliminar este pedido"
      className={`bg-white hover:bg-red-50 text-red-700 hover:text-red-800 border border-red-300 font-bold text-xs px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 shadow-sm disabled:opacity-50 ${className}`}
    >
      <Trash2 className="w-3.5 h-3.5" />
      <span>{loading ? 'Cancelando...' : label}</span>
    </button>
  );
}

export default CancelOrderButton;
