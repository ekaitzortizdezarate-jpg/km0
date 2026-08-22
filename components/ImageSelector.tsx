'use client';

import { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, Check, Upload, Sparkles, X, Link as LinkIcon, AlertCircle } from 'lucide-react';

interface ImageSelectorProps {
  name: string;
  defaultValue?: string | null;
  label?: string;
  type?: 'product' | 'avatar' | 'delivery_point';
}

const DELIVERY_POINT_PRESETS = [
  {
    name: 'Puesto de Mercado',
    url: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Caserío / Granja',
    url: 'https://images.unsplash.com/photo-1500076656116-558758c991c1?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Plaza / Frontón',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Tienda de Barrio / Local',
    url: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=600&auto=format&fit=crop&q=80',
  },
];

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
  const [inputUrl, setInputUrl] = useState<string>(
    defaultValue && !defaultValue.startsWith('data:') ? defaultValue : ''
  );
  const [showPresets, setShowPresets] = useState(false);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincronizar cuando defaultValue cambie externamente
  useEffect(() => {
    setSelectedUrl(defaultValue || '');
    setInputUrl(defaultValue && !defaultValue.startsWith('data:') ? defaultValue : '');
    setImageError(false);
  }, [defaultValue]);

  const presets =
    type === 'avatar'
      ? AVATAR_PRESETS
      : type === 'delivery_point'
      ? DELIVERY_POINT_PRESETS
      : PRODUCT_PRESETS;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError(false);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedUrl(reader.result);
        setInputUrl('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = (rawUrl: string) => {
    const trimmed = rawUrl.trim();
    setInputUrl(trimmed);
    setImageError(false);
    setSelectedUrl(trimmed);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-black text-stone-900 uppercase tracking-wider">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowPresets(!showPresets)}
          className="text-xs font-bold text-emerald-900 hover:text-emerald-950 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-300 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
          {showPresets ? 'Ocultar sugerencias' : 'Elegir foto sugerida'}
        </button>
      </div>

      <input type="hidden" name={name} value={selectedUrl} />

      {/* Preset Gallery */}
      {showPresets && (
        <div className="p-3 bg-stone-100 rounded-2xl border border-stone-300 space-y-2 animate-fadeIn">
          <p className="text-xs font-bold text-stone-800">
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
                    setInputUrl(preset.url);
                    setImageError(false);
                    setShowPresets(false);
                  }}
                  className={`relative rounded-xl overflow-hidden border-2 transition-all text-left group ${
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
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl border-2 border-stone-200 shadow-sm">
        {selectedUrl && !imageError ? (
          <div className="relative w-28 h-28 rounded-2xl overflow-hidden border-2 border-emerald-600 shrink-0 bg-stone-100 shadow-sm">
            <img
              src={selectedUrl}
              alt="Vista previa"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => {
                setSelectedUrl('');
                setInputUrl('');
              }}
              className="absolute top-1 right-1 bg-black/80 hover:bg-red-600 text-white p-1 rounded-full transition-colors"
              title="Quitar foto"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 flex flex-col items-center justify-center text-stone-500 shrink-0">
            {imageError ? (
              <>
                <AlertCircle className="w-7 h-7 text-red-500 mb-1" />
                <span className="text-[10px] font-bold text-red-600 text-center px-1">Enlace inválido</span>
              </>
            ) : (
              <>
                <ImageIcon className="w-8 h-8 mb-1 text-stone-400" />
                <span className="text-[10px] font-bold text-stone-600">Sin foto</span>
              </>
            )}
          </div>
        )}

        <div className="flex-1 space-y-3 w-full">
          {/* Opción 1: Subir archivo */}
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto bg-stone-900 hover:bg-black text-white text-xs font-black px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
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

          {/* Opción 2: URL de imagen directa */}
          <div className="space-y-1">
            <span className="text-[11px] font-black text-stone-800 flex items-center gap-1">
              <LinkIcon className="w-3.5 h-3.5 text-stone-600" /> O introduce un enlace / URL de imagen:
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => handleApplyUrl(e.target.value)}
                onPaste={(e) => {
                  const pasted = e.clipboardData.getData('text');
                  if (pasted) handleApplyUrl(pasted);
                }}
                placeholder="https://ejemplo.com/foto.jpg"
                className="flex-1 px-3 py-2 border-2 border-stone-300 rounded-xl text-xs font-bold bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 placeholder:text-stone-400"
              />
              {inputUrl && (
                <button
                  type="button"
                  onClick={() => handleApplyUrl(inputUrl)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black px-3 py-2 rounded-xl transition-colors shrink-0"
                >
                  Aplicar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImageSelector;
