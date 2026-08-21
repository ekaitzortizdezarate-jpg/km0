'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { createProduct, updateProduct } from '@/app/actions/products';
import { Product, ProductFormat, AvailabilityType, ProductCategory, DeliveryPoint } from '@/types/database';
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
  History,
  Store,
  Truck,
} from 'lucide-react';
import { ImageSelector } from '@/components/ImageSelector';

interface ProductFormProps {
  product?: Product;
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

  // Values for price, weight, stock
  const [price, setPrice] = useState<number>(product?.price || 0);
  const [pricePerKilo, setPricePerKilo] = useState<number>(
    product?.price_per_kilo || 0
  );
  const [weightKg, setWeightKg] = useState<number>(product?.weight_kg || 1);
  const [stock, setStock] = useState<number>(product?.stock || 10);
  const [isUnlimitedStock, setIsUnlimitedStock] = useState<boolean>(
    Boolean(product?.is_unlimited_stock)
  );

  // Paso 1: Disponibilidad del producto
  const [availType, setAvailType] = useState<'ya' | 'fecha'>(
    product?.availability_type === 'fecha_concreta' && product?.available_from_date
      ? 'fecha'
      : 'ya'
  );
  const [availableFromDate, setAvailableFromDate] = useState<string>(
    product?.available_from_date || ''
  );

  // Paso 2: Plazo y Método de entrega
  const [deliveryMode, setDeliveryMode] = useState<'dias' | 'dias_semana'>(
    product?.availability_weekdays && product.availability_weekdays.length > 0
      ? 'dias_semana'
      : 'dias'
  );
  const [deliveryDays, setDeliveryDays] = useState<number>(
    product?.availability_days !== null && product?.availability_days !== undefined
      ? product.availability_days
      : 1
  );
  const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>(
    product?.availability_weekdays || ['viernes']
  );

  // Opciones de Entrega ofrecidas
  const [deliveryPoints, setDeliveryPoints] = useState<DeliveryPoint[]>([]);
  useEffect(() => {
    async function loadDeliveryPoints() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('delivery_points')
          .select('*')
          .eq('seller_id', user.id);
        if (data) setDeliveryPoints(data as unknown as DeliveryPoint[]);
      }
    }
    loadDeliveryPoints();
  }, []);

  const hasCaserioPoints = deliveryPoints.some((p) => p.type === 'caserio') || deliveryPoints.length > 0 || Boolean(product?.caserio_schedule);
  const hasPuntosEntrega = deliveryPoints.some((p) => p.type === 'sitio_fisico');
  const hasEnvioDomicilio = deliveryPoints.some((p) => p.type === 'envio');

  const [deliveryMethods, setDeliveryMethods] = useState<string[]>(
    product?.delivery_methods && product.delivery_methods.length > 0
      ? product.delivery_methods
      : ['caserio', 'punto_entrega', 'domicilio']
  );
  const [caserioSchedule, setCaserioSchedule] = useState<string>(
    product?.caserio_schedule || 'Lunes a Sábado de 10:00 a 14:00'
  );

  const toggleDeliveryMethod = (method: string) => {
    if (deliveryMethods.includes(method)) {
      if (deliveryMethods.length > 1) {
        setDeliveryMethods(deliveryMethods.filter((m) => m !== method));
      }
    } else {
      setDeliveryMethods([...deliveryMethods, method]);
    }
  };

  // Previous products for dropdown autocomplete
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

    // Disponibilidad y entrega
    const calculatedAvailabilityType: AvailabilityType =
      availType === 'fecha' ? 'fecha_concreta' : deliveryMode === 'dias_semana' ? 'dias_semana' : 'dias';

    formData.set('availability_type', calculatedAvailabilityType);

    if (availType === 'fecha') {
      formData.set('available_from_date', availableFromDate);
    } else {
      formData.set('available_from_date', '');
    }

    if (deliveryMode === 'dias') {
      formData.set('availability_days', deliveryDays.toString());
      formData.delete('availability_weekdays');
    } else {
      formData.delete('availability_weekdays');
      selectedWeekdays.forEach((day) => {
        formData.append('availability_weekdays', day);
      });
    }

    // Modalidades de entrega habilitadas
    formData.delete('delivery_methods');
    deliveryMethods.forEach((m) => {
      formData.append('delivery_methods', m);
    });
    formData.set('caserio_schedule', deliveryMethods.includes('caserio') ? caserioSchedule : '');

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
                <History className="w-3.5 h-3.5" /> Tus productos anteriores:
              </span>
            )}
          </div>

          {uniquePreviousProducts.length > 0 && !isEdit && (
            <div className="mb-2">
              <select
                onChange={(e) => handleSelectPreviousProduct(e.target.value)}
                className="w-full px-3 py-2 border-2 border-emerald-300 rounded-xl text-xs font-bold text-emerald-950 bg-emerald-50 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              >
                <option value="">-- Selecciona uno de tus productos anteriores para rellenar rápido --</option>
                {uniquePreviousProducts.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name} ({p.category.replace('_', ' ')})
                  </option>
                ))}
              </select>
            </div>
          )}

          <input
            name="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Lechuga, Tomate de caserío, Queso Idiazabal..."
            className="w-full px-3.5 py-2.5 border-2 border-stone-300 rounded-xl text-sm font-bold text-stone-900 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none placeholder:text-stone-400"
          />
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

      {/* 3. PRECIO Y STOCK (ENTRADA NUMÉRICA LIMPIA COMO PRECIO) */}
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
                  step="0.01"
                  min="0.01"
                  required
                  value={pricePerKilo || ''}
                  onChange={(e) => handlePricePerKiloChange(parseFloat(e.target.value) || 0)}
                  placeholder="Ej. 3.50"
                  className="w-36 px-3.5 py-2 border-2 border-stone-300 rounded-xl text-base font-black text-stone-900 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
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

              {!isUnlimitedStock && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={stock || ''}
                      onChange={(e) => setStock(parseInt(e.target.value, 10) || 0)}
                      placeholder="Ej. 50"
                      className="w-36 px-3.5 py-2 border-2 border-stone-300 rounded-xl text-base font-black text-stone-900 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                    <span className="text-sm font-bold text-stone-700">kg en stock</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {[5, 10, 20, 50, 100].map((num) => (
                      <button
                        type="button"
                        key={num}
                        onClick={() => setStock(num)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                          stock === num
                            ? 'bg-emerald-700 text-white border-emerald-800'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                        }`}
                      >
                        {num} kg
                      </button>
                    ))}
                  </div>
                </div>
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
                      step="0.01"
                      min="0.01"
                      required
                      value={price || ''}
                      onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                      placeholder="Ej. 1.80"
                      className="w-36 px-3.5 py-2 border-2 border-stone-300 rounded-xl text-base font-black text-stone-900 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
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

                  {!isUnlimitedStock && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          value={stock || ''}
                          onChange={(e) => setStock(parseInt(e.target.value, 10) || 0)}
                          placeholder="Ej. 20"
                          className="w-36 px-3.5 py-2 border-2 border-stone-300 rounded-xl text-base font-black text-stone-900 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                        />
                        <span className="text-sm font-bold text-stone-700">unidades</span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {[1, 5, 10, 20, 50].map((num) => (
                          <button
                            type="button"
                            key={num}
                            onClick={() => setStock(num)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                              stock === num
                                ? 'bg-emerald-700 text-white border-emerald-800'
                                : 'bg-stone-50 text-stone-700 border-stone-300 hover:bg-stone-100'
                            }`}
                          >
                            {num} uds
                          </button>
                        ))}
                      </div>
                    </div>
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
                      step="0.01"
                      min="0.01"
                      required
                      value={weightKg || ''}
                      onChange={(e) => handleWeightKgChange(parseFloat(e.target.value) || 0)}
                      placeholder="Ej. 1.2"
                      className="w-full px-3.5 py-2 border-2 border-stone-300 rounded-xl text-sm font-bold text-stone-900 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      Precio Total (€) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={price || ''}
                      onChange={(e) => handlePriceChange(parseFloat(e.target.value) || 0)}
                      placeholder="Ej. 12.00"
                      className="w-full px-3.5 py-2 border-2 border-stone-300 rounded-xl text-sm font-bold text-stone-900 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      Precio / Kilo (€/kg)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={pricePerKilo || ''}
                      onChange={(e) => handlePricePerKiloChange(parseFloat(e.target.value) || 0)}
                      placeholder="Calculado solo"
                      className="w-full px-3.5 py-2 border-2 border-stone-300 rounded-xl text-sm font-bold text-stone-900 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-stone-800">
                    Piezas disponibles en stock:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={stock || ''}
                      onChange={(e) => setStock(parseInt(e.target.value, 10) || 0)}
                      placeholder="Ej. 10"
                      className="w-36 px-3.5 py-2 border-2 border-stone-300 rounded-xl text-base font-black text-stone-900 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                    <span className="text-sm font-bold text-stone-700">piezas</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {[1, 5, 10, 20].map((num) => (
                      <button
                        type="button"
                        key={num}
                        onClick={() => setStock(num)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                          stock === num
                            ? 'bg-emerald-700 text-white border-emerald-800'
                            : 'bg-stone-50 text-stone-700 border-stone-300 hover:bg-stone-100'
                        }`}
                      >
                        {num} piezas
                      </button>
                    ))}
                  </div>
                </div>
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
                  step="0.01"
                  min="0.01"
                  required
                  value={price || ''}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  placeholder="Ej. 25.00"
                  className="w-36 px-3.5 py-2 border-2 border-stone-300 rounded-xl text-base font-black text-stone-900 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
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
                className="w-full px-3.5 py-2 border-2 border-stone-300 rounded-xl text-xs font-semibold text-stone-900 bg-white placeholder:text-stone-400 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
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

              {!isUnlimitedStock && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={stock || ''}
                      onChange={(e) => setStock(parseInt(e.target.value, 10) || 0)}
                      placeholder="Ej. 10"
                      className="w-36 px-3.5 py-2 border-2 border-stone-300 rounded-xl text-base font-black text-stone-900 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                    <span className="text-sm font-bold text-stone-700">packs</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {[1, 3, 5, 10, 20].map((num) => (
                      <button
                        type="button"
                        key={num}
                        onClick={() => setStock(num)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                          stock === num
                            ? 'bg-emerald-700 text-white border-emerald-800'
                            : 'bg-stone-50 text-stone-700 border-stone-300 hover:bg-stone-100'
                        }`}
                      >
                        {num} packs
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. CONDICIONES DE DISPONIBILIDAD Y ENTREGA (EN 2 PASOS CLAROS) */}
      <div className="bg-stone-50 p-4 sm:p-5 rounded-2xl border border-stone-200 space-y-5">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-700" />
          <h3 className="text-xs font-black text-stone-900 uppercase tracking-wider">
            Disponibilidad y Plazo de Entrega
          </h3>
        </div>

        {/* PASO A: ¿Cuándo está disponible el producto / cosecha? */}
        <div className="space-y-2">
          <label className="block text-xs font-black text-stone-900">
            A) Disponibilidad del producto en tu caserío:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setAvailType('ya')}
              className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                availType === 'ya'
                  ? 'border-emerald-700 bg-white ring-2 ring-emerald-600 font-bold shadow-sm'
                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
              }`}
            >
              <span className="text-xs font-black block text-stone-900 flex items-center gap-1.5">
                ⚡ Disponible desde ya
              </span>
              <span className="text-[11px] font-semibold text-stone-600 block mt-0.5">
                El producto ya está cosechado o listo para servir.
              </span>
            </button>

            <button
              type="button"
              onClick={() => setAvailType('fecha')}
              className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                availType === 'fecha'
                  ? 'border-emerald-700 bg-white ring-2 ring-emerald-600 font-bold shadow-sm'
                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
              }`}
            >
              <span className="text-xs font-black block text-stone-900 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" /> A partir de una fecha concreta
              </span>
              <span className="text-[11px] font-semibold text-stone-600 block mt-0.5">
                Próxima cosecha programada (los compradores pueden reservarlo ya).
              </span>
            </button>
          </div>

          {availType === 'fecha' && (
            <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-1 mt-2">
              <label className="block text-xs font-bold text-stone-800">
                Fecha exacta a partir de la cual estará lista la cosecha:
              </label>
              <input
                type="date"
                required={availType === 'fecha'}
                value={availableFromDate}
                onChange={(e) => setAvailableFromDate(e.target.value)}
                className="px-3.5 py-2 border-2 border-stone-300 rounded-xl text-sm font-bold text-stone-900 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* PASO B: ¿Cuándo y cómo se realiza la entrega? */}
        <div className="space-y-2 pt-3 border-t border-stone-200">
          <label className="block text-xs font-black text-stone-900">
            B) Plazo y días de entrega al comprador:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setDeliveryMode('dias')}
              className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                deliveryMode === 'dias'
                  ? 'border-emerald-700 bg-white ring-2 ring-emerald-600 font-bold shadow-sm'
                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
              }`}
            >
              <span className="text-xs font-black block text-stone-900">
                ⏳ A X días tras el pedido
              </span>
              <span className="text-[11px] font-semibold text-stone-600 block mt-0.5">
                Mismo día, al día siguiente (24h) o en X días de preparación.
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDeliveryMode('dias_semana')}
              className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                deliveryMode === 'dias_semana'
                  ? 'border-emerald-700 bg-white ring-2 ring-emerald-600 font-bold shadow-sm'
                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
              }`}
            >
              <span className="text-xs font-black block text-stone-900">
                📅 Días fijos de la semana
              </span>
              <span className="text-[11px] font-semibold text-stone-600 block mt-0.5">
                Entregas programadas en días concretos (ej. solo los Viernes).
              </span>
            </button>
          </div>

          {deliveryMode === 'dias' && (
            <div className="p-3.5 bg-white rounded-xl border border-stone-200 space-y-2 mt-2">
              <label className="block text-xs font-bold text-stone-800">
                Días de plazo para la entrega tras hacer el pedido:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="14"
                  value={deliveryDays}
                  onChange={(e) => setDeliveryDays(parseInt(e.target.value, 10) || 0)}
                  className="w-24 px-3 py-1.5 border-2 border-stone-300 rounded-xl text-base font-black text-stone-900 bg-white"
                />
                <span className="text-xs font-bold text-stone-700">
                  {deliveryDays === 0
                    ? 'día (Mismo día del pedido)'
                    : deliveryDays === 1
                    ? 'día (Al día siguiente / 24h)'
                    : 'días de preparación'}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  { days: 0, label: 'Mismo día (0d)' },
                  { days: 1, label: '24h (1d)' },
                  { days: 2, label: '2 días' },
                  { days: 3, label: '3 días' },
                  { days: 5, label: '5 días' },
                ].map((opt) => (
                  <button
                    type="button"
                    key={opt.days}
                    onClick={() => setDeliveryDays(opt.days)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                      deliveryDays === opt.days
                        ? 'bg-emerald-700 text-white border-emerald-800'
                        : 'bg-stone-50 text-stone-700 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {deliveryMode === 'dias_semana' && (
            <div className="p-3.5 bg-white rounded-xl border border-stone-200 space-y-2 mt-2">
              <label className="block text-xs font-bold text-stone-800">
                Selecciona los días en que repartes o entregas:
              </label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((day) => {
                  const isSelected = selectedWeekdays.includes(day.id);
                  return (
                    <button
                      type="button"
                      key={day.id}
                      onClick={() => toggleWeekday(day.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
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

          {/* Modalidades de Entrega Ofrecidas para este Producto */}
          <div className="p-4 bg-stone-50 rounded-2xl border-2 border-stone-200 space-y-3 mt-4">
            <div>
              <label className="block text-xs font-black text-stone-900 uppercase tracking-wider">
                Opciones de entrega disponibles para el comprador: *
              </label>
              <p className="text-[11px] font-semibold text-stone-500 mt-0.5">
                Puedes marcar una o varias opciones para que el cliente elija la que prefiera.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Opción 1: Recogida en Caserío */}
              <div
                onClick={() => toggleDeliveryMethod('caserio')}
                className={`p-3.5 rounded-xl border-2 text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
                  deliveryMethods.includes('caserio')
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-950 shadow-sm'
                    : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black flex items-center gap-1.5">
                    <Store className="w-4 h-4 text-emerald-700" />
                    <span>Recogida en Caserío</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={deliveryMethods.includes('caserio')}
                    readOnly
                    className="w-4 h-4 text-emerald-700 rounded cursor-pointer"
                  />
                </div>
                <span className="text-[10px] font-semibold text-stone-500">
                  El cliente acude a tu caserío (con días y horarios).
                </span>
              </div>

              {/* Opción 2: Punto de Entrega */}
              <div
                onClick={() => {
                  if (hasPuntosEntrega) {
                    toggleDeliveryMethod('punto_entrega');
                  }
                }}
                className={`p-3.5 rounded-xl border-2 text-left transition-all flex flex-col justify-between gap-1.5 ${
                  !hasPuntosEntrega
                    ? 'border-stone-200 bg-stone-50 opacity-75 cursor-not-allowed'
                    : deliveryMethods.includes('punto_entrega')
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-950 shadow-sm cursor-pointer'
                    : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black flex items-center gap-1.5">
                    <Store className="w-4 h-4 text-emerald-700" />
                    <span>Punto de Entrega</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={deliveryMethods.includes('punto_entrega')}
                    disabled={!hasPuntosEntrega}
                    readOnly
                    className="w-4 h-4 text-emerald-700 rounded cursor-pointer"
                  />
                </div>
                {hasPuntosEntrega ? (
                  <span className="text-[10px] font-semibold text-stone-500">
                    Mercado, plaza o punto fijo (con días y horarios).
                  </span>
                ) : (
                  <div className="text-[10px] font-bold text-amber-800 bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                    No disponible: añade primero puntos en{' '}
                    <Link href="/vendedor/puntos-entrega" className="underline font-black text-amber-950">
                      Puntos de Entrega
                    </Link>
                  </div>
                )}
              </div>

              {/* Opción 3: Envío a Domicilio */}
              <div
                onClick={() => {
                  if (hasEnvioDomicilio) {
                    toggleDeliveryMethod('domicilio');
                  }
                }}
                className={`p-3.5 rounded-xl border-2 text-left transition-all flex flex-col justify-between gap-1.5 ${
                  !hasEnvioDomicilio
                    ? 'border-stone-200 bg-stone-50 opacity-75 cursor-not-allowed'
                    : deliveryMethods.includes('domicilio')
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-950 shadow-sm cursor-pointer'
                    : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-emerald-700" />
                    <span>Envío a Domicilio</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={deliveryMethods.includes('domicilio')}
                    disabled={!hasEnvioDomicilio}
                    readOnly
                    className="w-4 h-4 text-emerald-700 rounded cursor-pointer"
                  />
                </div>
                {hasEnvioDomicilio ? (
                  <span className="text-[10px] font-semibold text-stone-500">
                    Reparto directo a la casa del comprador.
                  </span>
                ) : (
                  <div className="text-[10px] font-bold text-amber-800 bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                    No disponible: activa el reparto en{' '}
                    <Link href="/vendedor/puntos-entrega" className="underline font-black text-amber-950">
                      Puntos de Entrega
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Horario de Recogida en Caserío si está activo */}
            {deliveryMethods.includes('caserio') && (
              <div className="p-3.5 bg-white rounded-xl border border-stone-200 space-y-1 mt-2">
                <label className="block text-xs font-bold text-stone-800">
                  Días y Horarios para la recogida en el Caserío:
                </label>
                <input
                  type="text"
                  value={caserioSchedule}
                  onChange={(e) => setCaserioSchedule(e.target.value)}
                  placeholder="Ej. Lunes a Sábado de 10:00 a 14:00"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-bold text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            )}

            {/* Opciones de Envío a Domicilio si está activo */}
            {deliveryMethods.includes('domicilio') && (
              <div className="p-3.5 bg-white rounded-xl border border-stone-200 space-y-2 mt-2">
                <label className="block text-xs font-bold text-stone-800">
                  Opciones de entrega a domicilio para este producto:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 bg-stone-50 rounded-lg border border-stone-200">
                    <input
                      type="checkbox"
                      checked={deliveryMode === 'dias' || deliveryMode === 'dias_semana'}
                      readOnly
                      className="text-emerald-700 rounded"
                    />
                    <span className="font-bold text-stone-900">
                      Entrega al día siguiente de disponibilidad (24h)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-stone-50 rounded-lg border border-stone-200">
                    <input
                      type="checkbox"
                      checked={deliveryMode === 'dias_semana' || deliveryMode === 'dias'}
                      readOnly
                      className="text-emerald-700 rounded"
                    />
                    <span className="font-bold text-stone-900">
                      Selección de días fijos de reparto semanal
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>
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
            <option value="no_aplica">No aplica</option>
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
          className="w-full px-3.5 py-2.5 border-2 border-stone-300 rounded-xl text-xs font-semibold text-stone-900 bg-white placeholder:text-stone-400 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
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
