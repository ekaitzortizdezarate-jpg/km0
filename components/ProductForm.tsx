'use client';

import { useState } from 'react';
import { createProduct, updateProduct } from '@/app/actions/products';
import { Product, ProductFormat, AvailabilityType, ProductCategory } from '@/types/database';
import {
  Sprout,
  AlertCircle,
  Clock,
  Layers,
  Scale,
  Package,
  Check,
  Tag,
  Calendar,
  X,
  History,
} from 'lucide-react';
import { ImageSelector } from '@/components/ImageSelector';
import { TouchNumberInput } from '@/components/TouchNumberInput';

interface ProductFormProps {
  product?: Product; // If provided, edit mode
  isEdit?: boolean;
  existingProducts?: Product[];
}

const WEEKDAYS = [
  { id: 'lunes', label: 'Lunes' },
  { id: 'martes', label: 'Martes' },
  { id: 'miercoles', label: 'Miércoles' },
  { id: 'jueves', label: 'Jueves' },
  { id: 'viernes', label: 'Viernes' },
  { id: 'sabado', label: 'Sábado' },
  { id: 'domingo', label: 'Domingo' },
];

export function ProductForm({
  product,
  isEdit = false,
  existingProducts = [],
}: ProductFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [name, setName] = useState<string>(product?.name || '');
  const [category, setCategory] = useState<ProductCategory>(
    product?.category || 'verduras_hortalizas'
  );

  // Format: 'granel' | 'suelto' | 'pack'
  const [format, setFormat] = useState<ProductFormat>(
    product?.format || 'suelto'
  );

  // Sub-mode for suelto: 'unidad' (precio por unidad sin kilos) o 'peso' (pieza con peso en kg)
  const [sueltoMode, setSueltoMode] = useState<'unidad' | 'peso'>(
    product?.weight_kg ? 'peso' : 'unidad'
  );

  // Values for auto-calculation
  const [price, setPrice] = useState<number>(product?.price || 0);
  const [pricePerKilo, setPricePerKilo] = useState<number>(
    product?.price_per_kilo || 0
  );
  const [weightKg, setWeightKg] = useState<number>(product?.weight_kg || 1);
  const [stock, setStock] = useState<number>(product?.stock || 10);
  const [isUnlimitedStock, setIsUnlimitedStock] = useState<boolean>(
    Boolean(product?.is_unlimited_stock)
  );

  // Delivery conditions
  const [availabilityType, setAvailabilityType] = useState<AvailabilityType>(
    product?.availability_type || 'inmediato'
  );
  const [availabilityDays, setAvailabilityDays] = useState<number>(
    product?.availability_days || 2
  );
  const [enableWeekdays, setEnableWeekdays] = useState<boolean>(
    Boolean(product?.availability_weekdays && product.availability_weekdays.length > 0)
  );
  const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>(
    product?.availability_weekdays || ['viernes']
  );
  const [availableFromDate, setAvailableFromDate] = useState<string>(
    product?.available_from_date || ''
  );

  // Unique list of previous product names for autocomplete / dropdown
  const uniquePreviousProducts = Array.from(
    new Map(existingProducts.map((p) => [p.name.trim().toLowerCase(), p])).values()
  );

  const handleSelectPreviousProduct = (selectedName: string) => {
    if (!selectedName) return;
    const match = uniquePreviousProducts.find(
      (p) => p.name.trim().toLowerCase() === selectedName.trim().toLowerCase()
    );
    setName(selectedName);
    if (match) {
      if (match.category) setCategory(match.category);
      if (match.format) setFormat(match.format);
      if (match.price) setPrice(match.price);
      if (match.price_per_kilo) setPricePerKilo(match.price_per_kilo);
    }
  };

  // Auto calculate for Suelto format with peso mode
  const handlePriceChange = (val: number) => {
    setPrice(val);
    if (format === 'suelto' && sueltoMode === 'peso' && weightKg > 0) {
      setPricePerKilo(Number((val / weightKg).toFixed(2)));
    }
  };

  const handlePricePerKiloChange = (val: number) => {
    setPricePerKilo(val);
    if (format === 'suelto' && sueltoMode === 'peso' && weightKg > 0) {
      setPrice(Number((val * weightKg).toFixed(2)));
    } else if (format === 'granel') {
      setPrice(val);
    }
  };

  const handleWeightKgChange = (val: number) => {
    setWeightKg(val);
    if (format === 'suelto' && sueltoMode === 'peso') {
      if (pricePerKilo > 0) {
        setPrice(Number((pricePerKilo * val).toFixed(2)));
      } else if (price > 0 && val > 0) {
        setPricePerKilo(Number((price / val).toFixed(2)));
      }
    }
  };

  const toggleWeekday = (dayId: string) => {
    if (selectedWeekdays.includes(dayId)) {
      if (selectedWeekdays.length > 1) {
        setSelectedWeekdays(selectedWeekdays.filter((d) => d !== dayId));
      }
    } else {
      setSelectedWeekdays([...selectedWeekdays, dayId]);
    }
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    formData.set('name', name);
    formData.set('category', category);
    formData.set('format', format);
    formData.set('price', price.toString());
    formData.set(
      'price_per_kilo',
      format === 'granel'
        ? (pricePerKilo || price).toString()
        : format === 'suelto' && sueltoMode === 'peso' && pricePerKilo
        ? pricePerKilo.toString()
        : ''
    );
    formData.set(
      'weight_kg',
      format === 'suelto' && sueltoMode === 'peso' && weightKg ? weightKg.toString() : ''
    );
    formData.set('stock', stock.toString());
    if (isUnlimitedStock) {
      formData.set('is_unlimited_stock', 'on');
    }
    formData.set('availability_type', availabilityType);
    if (availabilityType === 'dias') {
      formData.set('availability_days', availabilityDays.toString());
    }
    if (availabilityType === 'fecha_concreta') {
      formData.set('available_from_date', availableFromDate);
    }

    formData.delete('availability_weekdays');
    if (enableWeekdays && selectedWeekdays.length > 0) {
      selectedWeekdays.forEach((day) => {
        formData.append('availability_weekdays', day);
      });
    }

    const result = isEdit && product
      ? await updateProduct(product.id, formData)
      : await createProduct(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-300 text-red-900 font-bold text-sm rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-700" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. SELECCIÓN DE TIPO / FORMATO DE PRODUCTO */}
      <div className="bg-stone-50 p-4 sm:p-5 rounded-2xl border border-stone-200 space-y-3">
        <label className="block text-xs font-black text-stone-900 uppercase tracking-wider">
          Tipo de Producto *
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => {
              setFormat('granel');
              if (pricePerKilo > 0) setPrice(pricePerKilo);
            }}
            className={`p-3.5 rounded-xl border-2 flex flex-col items-start gap-1 text-left transition-all ${
              format === 'granel'
                ? 'border-emerald-700 bg-white ring-2 ring-emerald-600 shadow-sm'
                : 'border-stone-200 bg-white hover:bg-stone-100 text-stone-700'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-extrabold text-stone-900 text-sm flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-emerald-700" /> A Granel
              </span>
              {format === 'granel' && <Check className="w-4 h-4 text-emerald-700" />}
            </div>
            <p className="text-[11px] font-semibold text-stone-600">
              Venta al peso en €/kg. El comprador pide los kilos que desee.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setFormat('suelto')}
            className={`p-3.5 rounded-xl border-2 flex flex-col items-start gap-1 text-left transition-all ${
              format === 'suelto'
                ? 'border-emerald-700 bg-white ring-2 ring-emerald-600 shadow-sm'
                : 'border-stone-200 bg-white hover:bg-stone-100 text-stone-700'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-extrabold text-stone-900 text-sm flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-700" /> Suelto / Por Unidad
              </span>
              {format === 'suelto' && <Check className="w-4 h-4 text-emerald-700" />}
            </div>
            <p className="text-[11px] font-semibold text-stone-600">
              Por unidad fija (sin kilos) o por pieza con peso en Kg.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setFormat('pack')}
            className={`p-3.5 rounded-xl border-2 flex flex-col items-start gap-1 text-left transition-all ${
              format === 'pack'
                ? 'border-emerald-700 bg-white ring-2 ring-emerald-600 shadow-sm'
                : 'border-stone-200 bg-white hover:bg-stone-100 text-stone-700'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-extrabold text-stone-900 text-sm flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-700" /> Pack / Cesta
              </span>
              {format === 'pack' && <Check className="w-4 h-4 text-emerald-700" />}
            </div>
            <p className="text-[11px] font-semibold text-stone-600">
              Cesta o lote variado con varios productos incluidos.
            </p>
          </button>
        </div>
      </div>

      {/* 2. DATOS PRINCIPALES Y DESPLEGABLE DE PRODUCTOS ANTERIORES */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-black text-stone-900 uppercase tracking-wider">
              Nombre del Producto *
            </label>

            {uniquePreviousProducts.length > 0 && !isEdit && (
              <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                <History className="w-3.5 h-3.5" /> Opciones de tus productos anteriores:
              </span>
            )}
          </div>

          {/* Desplegable de productos anteriores si existen */}
          {uniquePreviousProducts.length > 0 && !isEdit && (
            <div className="mb-2">
              <select
                onChange={(e) => handleSelectPreviousProduct(e.target.value)}
                className="w-full px-3 py-2 border-2 border-emerald-300 rounded-xl text-xs font-bold text-emerald-950 bg-emerald-50 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              >
                <option value="">-- Elige uno de tus productos anteriores para rellenar --</option>
                {uniquePreviousProducts.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name} ({p.category.replace('_', ' ')})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="relative">
            <input
              name="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              list="seller-previous-products"
              placeholder="Ej. Lechuga, Tomate de caserío, Queso Idiazabal..."
              className="w-full px-3.5 py-2.5 border-2 border-stone-300 rounded-xl text-sm font-bold text-stone-900 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none placeholder:text-stone-400"
            />
            <datalist id="seller-previous-products">
              {uniquePreviousProducts.map((p) => (
                <option key={`dl-${p.id}`} value={p.name} />
              ))}
            </datalist>
          </div>
        </div>

        <div>
          <label className="block text-xs font-black text-stone-900 uppercase tracking-wider mb-1">
            Categoría *
          </label>
          <select
            name="category"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value as ProductCategory)}
            className="w-full px-3.5 py-2.5 border-2 border-stone-300 rounded-xl text-sm font-bold text-stone-900 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
          >
            <option value="verduras_hortalizas">Verduras y Hortalizas</option>
            <option value="frutas">Frutas</option>
            <option value="quesos_lacteos">Quesos y Lácteos</option>
            <option value="bebidas">Bebidas (Txakoli / Sidra)</option>
            <option value="otros_alimentos">Otros Alimentos (Miel / Huevos)</option>
            <option value="plantas_flores">Plantas y Flores</option>
            <option value="articulos_diversos">Artículos Diversos</option>
            <option value="artesania">Artesanía Local</option>
          </select>
        </div>
      </div>

      {/* 3. PRECIO Y PESO SEGÚN FORMATO */}
      <div className="bg-stone-50 p-4 sm:p-5 rounded-2xl border border-stone-200 space-y-4">
        <h3 className="text-xs font-black text-stone-900 uppercase tracking-wider">
          Configuración de Precio y Stock
        </h3>

        {/* Formato 1: A GRANEL */}
        {format === 'granel' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                Precio por Kilo (€ / kg) *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  required
                  value={pricePerKilo || ''}
                  onChange={(e) => handlePricePerKiloChange(parseFloat(e.target.value) || 0)}
                  placeholder="Ej. 3.50"
                  className="w-36 px-3 py-2 border-2 border-stone-300 rounded-xl text-base font-black text-stone-900 bg-white"
                />
                <span className="text-sm font-bold text-stone-700">€ / kg</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-800">
                  Kilos disponibles en stock:
                </label>
                <label className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isUnlimitedStock}
                    onChange={(e) => setIsUnlimitedStock(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-700"
                  />
                  Ilimitado / Continuo
                </label>
              </div>

              {!isUnlimitedStock ? (
                <TouchNumberInput
                  name="stock"
                  label="Kilos disponibles"
                  min={1}
                  max={500}
                  value={stock}
                  onChange={setStock}
                  unit="kg"
                  quickOptions={[5, 10, 20, 50, 100]}
                />
              ) : (
                <p className="text-xs font-semibold text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                  ✓ El producto siempre estará disponible sin límite de kilos establecido.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Formato 2: SUELTO / POR UNIDAD */}
        {format === 'suelto' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-800">
                Modalidad de precio:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setSueltoMode('unidad');
                    setWeightKg(0);
                    setPricePerKilo(0);
                  }}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    sueltoMode === 'unidad'
                      ? 'border-emerald-700 bg-white ring-2 ring-emerald-600 shadow-sm'
                      : 'border-stone-200 bg-white text-stone-700'
                  }`}
                >
                  <span className="font-extrabold text-stone-900 text-xs flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-700" /> Precio por Unidad (Sin Kilos)
                  </span>
                  <span className="text-[10px] font-semibold text-stone-600 block mt-0.5">
                    Ej. 1 lechuga (1.50€), 1 docena huevos (3€), 1 tarro miel (7€)...
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSueltoMode('peso');
                    if (weightKg === 0) setWeightKg(1);
                  }}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    sueltoMode === 'peso'
                      ? 'border-emerald-700 bg-white ring-2 ring-emerald-600 shadow-sm'
                      : 'border-stone-200 bg-white text-stone-700'
                  }`}
                >
                  <span className="font-extrabold text-stone-900 text-xs flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-emerald-700" /> Pieza con Peso exacto (Kg)
                  </span>
                  <span className="text-[10px] font-semibold text-stone-600 block mt-0.5">
                    Ej. 1 queso entero que pesa 1.2 kg con precio total o €/kg.
                  </span>
                </button>
              </div>
            </div>

            {/* Caso A: Precio por Unidad (SIN KILOS) */}
            {sueltoMode === 'unidad' && (
              <div className="space-y-4 p-4 bg-white rounded-xl border border-stone-200 shadow-sm">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Precio por Unidad / Pieza (€) *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.05"
                      min="0.1"
                      required
                      value={price || ''}
                      onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                      placeholder="Ej. 1.80"
                      className="w-36 px-3.5 py-2 border-2 border-stone-300 rounded-xl text-base font-black text-stone-900 bg-white"
                    />
                    <span className="text-sm font-bold text-stone-700">€ / unidad</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-800">
                      Unidades disponibles:
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isUnlimitedStock}
                        onChange={(e) => setIsUnlimitedStock(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-700"
                      />
                      Ilimitado / Continuo
                    </label>
                  </div>

                  {!isUnlimitedStock ? (
                    <TouchNumberInput
                      name="stock"
                      label="Unidades en stock"
                      min={1}
                      max={200}
                      value={stock}
                      onChange={setStock}
                      unit="uds"
                      quickOptions={[1, 5, 10, 20, 50]}
                    />
                  ) : (
                    <p className="text-xs font-semibold text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                      ✓ Unidades siempre disponibles sin límite de stock.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Caso B: Pieza con Peso en Kg */}
            {sueltoMode === 'peso' && (
              <div className="space-y-4 p-4 bg-white rounded-xl border border-stone-200 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      Peso de la pieza (Kg) *
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.05"
                      required
                      value={weightKg || ''}
                      onChange={(e) => handleWeightKgChange(parseFloat(e.target.value) || 0)}
                      placeholder="Ej. 1.2"
                      className="w-full px-3 py-2 border-2 border-stone-300 rounded-xl text-sm font-bold text-stone-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      Precio Total (€) *
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.1"
                      required
                      value={price || ''}
                      onChange={(e) => handlePriceChange(parseFloat(e.target.value) || 0)}
                      placeholder="Ej. 12.00"
                      className="w-full px-3 py-2 border-2 border-stone-300 rounded-xl text-sm font-bold text-stone-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      Precio / Kilo (€/kg)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.1"
                      value={pricePerKilo || ''}
                      onChange={(e) => handlePricePerKiloChange(parseFloat(e.target.value) || 0)}
                      placeholder="Calculado solo"
                      className="w-full px-3 py-2 border-2 border-stone-300 rounded-xl text-sm font-bold text-stone-900 bg-white"
                    />
                  </div>
                </div>

                <TouchNumberInput
                  name="stock"
                  label="Piezas disponibles en stock"
                  min={1}
                  max={100}
                  value={stock}
                  onChange={setStock}
                  unit="piezas"
                  quickOptions={[1, 5, 10, 20]}
                />
              </div>
            )}
          </div>
        )}

        {/* Formato 3: PACK CON PRODUCTOS INCLUIDOS */}
        {format === 'pack' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                Precio del Pack (€) *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  required
                  value={price || ''}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  placeholder="Ej. 25.00"
                  className="w-36 px-3 py-2 border-2 border-stone-300 rounded-xl text-base font-black text-stone-900 bg-white"
                />
                <span className="text-sm font-bold text-stone-700">€ / pack</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                Productos / Contenido que incluye el pack *
              </label>
              <textarea
                name="pack_items"
                rows={3}
                required
                defaultValue={product?.pack_items || ''}
                placeholder="Ej. 1kg Tomate de caserío, 500g Pimientos de Gernika, 1 Lechuga de roble, 1 docena de Huevos camperos..."
                className="w-full px-3.5 py-2 border-2 border-stone-300 rounded-xl text-xs font-semibold text-stone-900 bg-white placeholder:text-stone-400"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-800">
                  Packs disponibles en stock:
                </label>
                <label className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isUnlimitedStock}
                    onChange={(e) => setIsUnlimitedStock(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-700"
                  />
                  Ilimitado / Continuo
                </label>
              </div>

              {!isUnlimitedStock ? (
                <TouchNumberInput
                  name="stock"
                  label="Packs disponibles"
                  min={1}
                  max={50}
                  value={stock}
                  onChange={setStock}
                  unit="packs"
                  quickOptions={[1, 3, 5, 10]}
                />
              ) : (
                <p className="text-xs font-semibold text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                  ✓ Packs siempre disponibles sin límite de stock.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. CONDICIONES DE DISPONIBILIDAD Y ENTREGA (COMBINABLES) */}
      <div className="bg-stone-50 p-4 sm:p-5 rounded-2xl border border-stone-200 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-700" />
            <h3 className="text-xs font-black text-stone-900 uppercase tracking-wider">
              Condiciones de Disponibilidad y Entrega
            </h3>
          </div>
        </div>

        {/* Resumen de Condiciones Seleccionadas Activas con botones para editar o quitar */}
        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
          <span className="text-[11px] font-black text-emerald-950 block">
            Condiciones activas para esta cosecha:
          </span>
          <div className="flex flex-wrap gap-2">
            {/* Plazo Base Activo */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-emerald-300 rounded-lg text-xs font-extrabold text-emerald-950 shadow-sm">
              <Clock className="w-3.5 h-3.5 text-emerald-700" />
              {availabilityType === 'inmediato' && 'Listo en 24h'}
              {availabilityType === 'dias' && `Preparación en ${availabilityDays} días`}
              {availabilityType === 'fecha_concreta' &&
                (availableFromDate ? `A partir del ${availableFromDate}` : 'Fecha concreta')}
            </span>

            {/* Días Fijos Activos */}
            {enableWeekdays && selectedWeekdays.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-700 text-white rounded-lg text-xs font-extrabold shadow-sm">
                <Calendar className="w-3.5 h-3.5" />
                Entregas: {selectedWeekdays.join(', ')}
                <button
                  type="button"
                  onClick={() => setEnableWeekdays(false)}
                  className="hover:text-red-300 ml-1"
                  title="Quitar días fijos"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Paso 1: Plazo base */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-stone-800">
            1. ¿Cuándo está listo el producto? (Plazo base)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setAvailabilityType('inmediato')}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                availabilityType === 'inmediato'
                  ? 'border-emerald-700 bg-white ring-2 ring-emerald-600 font-bold shadow-sm'
                  : 'border-stone-200 bg-white text-stone-700'
              }`}
            >
              <span className="text-xs font-bold block text-stone-900">
                ⚡ Disponible ya
              </span>
              <span className="text-[11px] text-stone-600">Listo en 24h</span>
            </button>

            <button
              type="button"
              onClick={() => setAvailabilityType('dias')}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                availabilityType === 'dias'
                  ? 'border-emerald-700 bg-white ring-2 ring-emerald-600 font-bold shadow-sm'
                  : 'border-stone-200 bg-white text-stone-700'
              }`}
            >
              <span className="text-xs font-bold block text-stone-900">
                ⏳ X días tras el pedido
              </span>
              <span className="text-[11px] text-stone-600">Tiempo de recolección</span>
            </button>

            <button
              type="button"
              onClick={() => setAvailabilityType('fecha_concreta')}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                availabilityType === 'fecha_concreta'
                  ? 'border-emerald-700 bg-white ring-2 ring-emerald-600 font-bold shadow-sm'
                  : 'border-stone-200 bg-white text-stone-700'
              }`}
            >
              <span className="text-xs font-bold block text-stone-900">
                🗓️ A partir de una fecha
              </span>
              <span className="text-[11px] text-stone-600">Inicio de cosecha</span>
            </button>
          </div>

          {availabilityType === 'dias' && (
            <div className="pt-2">
              <TouchNumberInput
                name="availability_days"
                label="Días necesarios para preparar:"
                min={1}
                max={14}
                value={availabilityDays}
                onChange={setAvailabilityDays}
                unit="días"
                quickOptions={[1, 2, 3, 5, 7]}
              />
            </div>
          )}

          {availabilityType === 'fecha_concreta' && (
            <div className="pt-2 space-y-1">
              <label className="block text-xs font-bold text-stone-800">
                Fecha a partir de la cual estará disponible:
              </label>
              <input
                type="date"
                value={availableFromDate}
                onChange={(e) => setAvailableFromDate(e.target.value)}
                className="px-3.5 py-2 border-2 border-stone-300 rounded-xl text-sm font-bold text-stone-900 bg-white"
              />
            </div>
          )}
        </div>

        {/* Paso 2: Combinar con Días Específicos de la semana (Opcional) */}
        <div className="pt-3 border-t border-stone-200 space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-bold text-stone-900 cursor-pointer">
              <input
                type="checkbox"
                checked={enableWeekdays}
                onChange={(e) => setEnableWeekdays(e.target.checked)}
                className="w-4 h-4 text-emerald-700 rounded border-stone-300 focus:ring-emerald-600"
              />
              <span>Combinar con días fijos de entrega semanal (Opcional)</span>
            </label>

            {enableWeekdays && (
              <button
                type="button"
                onClick={() => setEnableWeekdays(false)}
                className="text-[11px] font-bold text-stone-500 hover:text-red-700"
              >
                Quitar días fijos
              </button>
            )}
          </div>

          {enableWeekdays && (
            <div className="space-y-2 bg-white p-3.5 rounded-xl border border-stone-200">
              <p className="text-[11px] font-semibold text-stone-700">
                El pedido estará listo según el plazo anterior, y se entregará en el siguiente día seleccionado:
              </p>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((day) => {
                  const isSelected = selectedWeekdays.includes(day.id);
                  return (
                    <button
                      type="button"
                      key={day.id}
                      onClick={() => toggleWeekday(day.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                        isSelected
                          ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                          : 'bg-stone-50 text-stone-700 border-stone-300 hover:bg-stone-100'
                      }`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. FOTO DEL PRODUCTO */}
      <ImageSelector
        name="image_url"
        defaultValue={product?.image_url}
        label="Foto del Producto"
        type="product"
      />

      {/* 6. OTROS DETALLES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-black text-stone-900 uppercase tracking-wider mb-1">
            Tipo de Cultivo
          </label>
          <select
            name="cultivation"
            defaultValue={product?.cultivation || 'no_aplica'}
            className="w-full px-3.5 py-2.5 border-2 border-stone-300 rounded-xl text-xs font-bold text-stone-900 bg-white"
          >
            <option value="no_aplica">No aplica / Tradicional</option>
            <option value="exterior">Cultivo Exterior / Aire Libre</option>
            <option value="invernadero">Invernadero</option>
          </select>
        </div>

        <div className="flex items-center gap-3 pt-6">
          <input
            name="is_organic"
            type="checkbox"
            id="is_organic"
            defaultChecked={product?.is_organic}
            className="w-5 h-5 text-emerald-700 rounded border-stone-300 focus:ring-emerald-600"
          />
          <label htmlFor="is_organic" className="text-sm font-bold text-stone-900 cursor-pointer">
            Producto ecológico
          </label>
        </div>
      </div>

      <div>
        <label className="block text-xs font-black text-stone-900 uppercase tracking-wider mb-1">
          Descripción o notas de recolección
        </label>
        <textarea
          name="description"
          rows={3}
          defaultValue={product?.description || ''}
          placeholder="Detalles sobre maduración, características especiales de tu caserío..."
          className="w-full px-3.5 py-2.5 border-2 border-stone-300 rounded-xl text-xs font-semibold text-stone-900 bg-white placeholder:text-stone-400"
        />
      </div>

      {/* BOTÓN SUBMIT */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-extrabold py-3.5 rounded-xl text-base shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Sprout className="w-5 h-5" />
        {loading
          ? 'Guardando...'
          : isEdit
          ? 'Guardar Cambios del Producto'
          : 'Publicar Producto en km0'}
      </button>
    </form>
  );
}

export default ProductForm;
