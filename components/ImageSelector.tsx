'use client';

import { useState, useRef } from 'react';
import { Image as ImageIcon, Check, Upload, Sparkles, X } from 'lucide-react';

interface ImageSelectorProps {
  name: string;
  defaultValue?: string | null;
  label?: string;
  type?: 'product' | 'avatar';
}

const PRODUCT_PRESETS = [
  {
    name: 'Tomates de Caserío',
    url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Pimientos de Gernika',
    url: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Queso Idiazabal',
    url: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Cesta de Verduras',
    url: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Txakoli / Bebida',
    url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Miel Artesana',
    url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Frutas Variadas',
    url: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Huevos de Caserío',
    url: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600&auto=format&fit=crop&q=80',
  },
];

const AVATAR_PRESETS = [
  {
    name: 'Caserío Tradicional',
    url: 'https://images.unsplash.com/photo-1500076656116-558758c991c1?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Huerta Familiar',
    url: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Agricultor / Baserritarra',
    url: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Granja Verde',
    url: 'https://images.unsplash.com/photo-1516253593875-bd7ba052fbc5?w=400&auto=format&fit=crop&q=80',
  },
];

export function ImageSelector({
  name,
  defaultValue = null,
  label = 'Foto',
  type = 'product',
}: ImageSelectorProps) {
  const [selectedUrl, setSelectedUrl] = useState<string>(defaultValue || '');
  const [showPresets, setShowPresets] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const presets = type === 'avatar' ? AVATAR_PRESETS : PRODUCT_PRESETS;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert file to Data URL
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-stone-900 uppercase tracking-wider">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowPresets(!showPresets)}
          className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
          {showPresets ? 'Ocultar sugerencias' : 'Elegir foto sugerida'}
        </button>
      </div>

      <input type="hidden" name={name} value={selectedUrl} />

      {/* Preset Gallery */}
      {showPresets && (
        <div className="p-3 bg-stone-100 rounded-xl border border-stone-200 space-y-2 animate-fadeIn">
          <p className="text-xs font-semibold text-stone-700">
            Selecciona una imagen de muestra para tu caserío:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {presets.map((preset) => {
              const isSelected = selectedUrl === preset.url;
              return (
                <button
                  type="button"
                  key={preset.name}
                  onClick={() => {
                    setSelectedUrl(preset.url);
                    setShowPresets(false);
                  }}
                  className={`relative rounded-lg overflow-hidden border-2 transition-all text-left group ${
                    isSelected ? 'border-emerald-600 ring-2 ring-emerald-500' : 'border-stone-300 hover:border-stone-400'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="w-full h-20 object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                    <span className="text-[10px] font-bold text-white leading-tight">
                      {preset.name}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="absolute top-1 right-1 bg-emerald-600 text-white rounded-full p-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Preview & Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
        {selectedUrl ? (
          <div className="relative w-28 h-28 rounded-xl overflow-hidden border-2 border-emerald-600 shrink-0 bg-stone-100 shadow-sm">
            <img
              src={selectedUrl}
              alt="Vista previa"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => setSelectedUrl('')}
              className="absolute top-1 right-1 bg-black/70 hover:bg-red-600 text-white p-1 rounded-full transition-colors"
              title="Quitar foto"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="w-28 h-28 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 flex flex-col items-center justify-center text-stone-600 shrink-0">
            <ImageIcon className="w-8 h-8 mb-1 text-stone-400" />
            <span className="text-[10px] font-bold text-stone-600">Sin foto</span>
          </div>
        )}

        <div className="flex-1 space-y-2 w-full">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 sm:flex-initial bg-stone-900 hover:bg-black text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <Upload className="w-4 h-4" /> Subir foto desde el móvil / PC
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          <div>
            <span className="text-[11px] font-semibold text-stone-600 block mb-1">
              O pega un enlace de imagen (URL):
            </span>
            <input
              type="url"
              value={selectedUrl.startsWith('data:') ? '' : selectedUrl}
              onChange={(e) => setSelectedUrl(e.target.value)}
              placeholder="https://ejemplo.com/foto.jpg"
              className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImageSelector;
