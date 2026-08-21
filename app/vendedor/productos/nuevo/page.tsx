import Link from 'next/link';
import { ArrowLeft, Sprout } from 'lucide-react';
import { ProductForm } from '@/components/ProductForm';

export default function NewProductPage() {
  return (
    <div className="max-w-3xl mx-auto py-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700 hover:text-stone-900 mb-6 bg-white px-3 py-1.5 rounded-lg border border-stone-200 shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Volver al catálogo
      </Link>

      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
          <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-800">
            <Sprout className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-stone-900">Publicar Producto</h1>
            <p className="text-xs font-medium text-stone-600">
              Añade un producto a granel, suelto o pack con sus condiciones de entrega
            </p>
          </div>
        </div>

        <ProductForm isEdit={false} />
      </div>
    </div>
  );
}