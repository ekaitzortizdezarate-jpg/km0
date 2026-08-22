'use client';

import { useState } from 'react';
import { LayoutGrid, Grid2X2, List } from 'lucide-react';
import type { ProductViewMode } from '@/components/OrderProductItemsList';

interface OrdersViewContainerProps {
  children: (viewMode: ProductViewMode) => React.ReactNode;
  title?: string;
  subtitle?: string;
  totalOrdersCount?: number;
}

export function OrdersViewContainer({
  children,
  title,
  subtitle,
  totalOrdersCount,
}: OrdersViewContainerProps) {
  const [viewMode, setViewMode] = useState<ProductViewMode>('mediano');

  return (
    <div className="space-y-6">
      {/* Cabecera y Selector de Vista */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border-2 border-stone-200 shadow-sm">
        <div>
          {title && <h1 className="text-xl sm:text-2xl font-black text-stone-900">{title}</h1>}
          {subtitle && (
            <p className="text-xs font-bold text-stone-600 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {/* Selector de modo de vista de productos */}
        <div className="flex items-center gap-1.5 bg-stone-100 p-1.5 rounded-2xl border border-stone-200">
          <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 px-1.5 hidden sm:inline">
            Vista:
          </span>

          {/* 1. Grande */}
          <button
            type="button"
            onClick={() => setViewMode('grande')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black transition-all ${
              viewMode === 'grande'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200'
            }`}
            title="Vista de imágenes grandes"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden sm:inline">Grande</span>
          </button>

          {/* 2. Mediano */}
          <button
            type="button"
            onClick={() => setViewMode('mediano')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black transition-all ${
              viewMode === 'mediano'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200'
            }`}
            title="Vista estándar mediana"
          >
            <Grid2X2 className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden sm:inline">Mediano</span>
          </button>

          {/* 3. Lista */}
          <button
            type="button"
            onClick={() => setViewMode('lista')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black transition-all ${
              viewMode === 'lista'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200'
            }`}
            title="Vista compacta tipo lista"
          >
            <List className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden sm:inline">Lista</span>
          </button>
        </div>
      </div>

      {/* Renderizado de pedidos con el modo de vista activo */}
      {children(viewMode)}
    </div>
  );
}
