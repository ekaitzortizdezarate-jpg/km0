'use client';

import { useState } from 'react';
import { deleteProduct } from '@/app/actions/products';
import { Trash2 } from 'lucide-react';

export function DeleteProductButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm('¿Estás seguro de eliminar este producto del catálogo?')) return;
    setLoading(true);
    await deleteProduct(productId);
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      title="Eliminar producto"
      className="p-2 bg-stone-100 hover:bg-red-50 text-stone-600 hover:text-red-700 rounded-xl transition-colors border border-stone-200 disabled:opacity-50"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

export default DeleteProductButton;
