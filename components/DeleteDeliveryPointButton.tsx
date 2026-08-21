'use client';

import { useState } from 'react';
import { deleteDeliveryPoint } from '@/app/actions/delivery-points';
import { Trash2 } from 'lucide-react';

export function DeleteDeliveryPointButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm('¿Estás seguro de eliminar este punto de entrega?')) return;
    setLoading(true);
    await deleteDeliveryPoint(id);
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      title="Eliminar punto"
      className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

export default DeleteDeliveryPointButton;
