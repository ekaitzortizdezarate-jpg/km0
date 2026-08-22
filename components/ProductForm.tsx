'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { createProduct, updateProduct, deleteProduct } from '@/app/actions/products';
import { Product, ProductFormat, AvailabilityType, ProductCategory, DeliveryPoint } from '@/types/database';
import {
  Sprout,
  AlertCircle,
  Clock,
  Layers,
  Scale,
  Package,
  Check,
  Calendar,
  History,
  Store,
  Truck,
  Trash2,
  MapPin,
} from 'lucide-react';
import { ImageSelector } from '@/components/ImageSelector';

interface ProductFormProps {
  product?: Product;
  isEdit?: boolean;
  existingProducts?: Product[];
}

const WEEKDAYS_DISPLAY = [
  { id: 'Lunes', label: 'Lunes' },
  { id: 'Martes', label: 'Martes' },
  { id: 'Miércoles', label: 'Miércoles' },
  { id: 'Jueves', label: 'Jueves' },
  { id: 'Viernes', label: 'Viernes' },
  { id: 'Sábado', label: 'Sábado' },
  { id: 'Domingo', label: 'Domingo' },
];

const WEEKDAYS_IDS = [
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
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!product?.id) return;
    const confirmDelete = window.confirm(`¿Estás seguro de que deseas eliminar permanentemente el producto "${product.name}"?`);
    if (!confirmDelete) return;

    setDeleting(true);
    setError(null);
    const res = await deleteProduct(product.id);
    setDeleting(false);

    if (res?.error) {
      setError(res.error);
    } else {
      router.push('/');
      router.refresh();
    }
  }

  // Form Fields
  const [name, setName] = useState<string>(product?.name || '');
  const [category, setCategory] = useState<ProductCategory>(
    product?.category || 'verduras_hortalizas'
  );

  // Format: 'granel' (A Peso) por defecto | 'suelto' | 'pack'
  const [format, setFormat] = useState<ProductFormat>(
    product?.format || 'granel'
  );

  // Sub-mode for suelto: 'unidad' (precio por unidad sin kilos) o 'peso' (pieza con peso en kg)
  const [sueltoMode, setSueltoMode] = useState<'unidad' | 'peso'>(
    product?.weight_kg ? 'peso' : 'unidad'
  );

  // Values for price, weight, stock
  const [price, setPrice] = useState<number>(product?.price || 0);
  const [pricePerKilo, setPricePerKilo] = useState<number>(
    product?.price_per_kilo || (product?.format === 'granel' ? product?.price || 0 : 0)
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

  const hasCaserioPoints = deliveryPoints.some((p) => p.type === 'caserio');
  const hasPuntosEntrega = deliveryPoints.some((p) => p.type === 'sitio_fisico');
  const hasEnvioDomicilio = deliveryPoints.some((p) => p.type === 'envio');

  const [deliveryMethods, setDeliveryMethods] = useState<string[]>(
    product?.delivery_methods && product.delivery_methods.length > 0
      ? product.delivery_methods
      : ['caserio', 'punto_entrega', 'domicilio']
  );

  // Configuración de Caserío (Días y Horarios para este producto)
  const [caserioDays, setCaserioDays] = useState<string[]>(['Lunes', 'Miércoles', 'Viernes']);
  const [caserioOpeningTime, setCaserioOpeningTime] = useState<string>('10:00');
  const [caserioClosingTime, setCaserioClosingTime] = useState<string>('14:00');

  // Configuración de Puntos de Entrega (Días y Horarios para este producto)
  const [puntosDays, setPuntosDays] = useState<string[]>(['Viernes', 'Sábado']);
  const [puntosOpeningTime, setPuntosOpeningTime] = useState<string>('09:00');
  const [puntosClosingTime, setPuntosClosingTime] = useState<string>('14:00');

  // Configuración de Envío a Domicilio (Plazo o Días fijos)
  const [homeDeliveryMode, setHomeDeliveryMode] = useState<'dias' | 'dias_semana'>(
    product?.availability_weekdays && product.availability_weekdays.length > 0
      ? 'dias_semana'
      : 'dias'
  );
  const [homeDeliveryDays, setHomeDeliveryDays] = useState<number>(
    product?.availability_days !== null && product?.availability_days !== undefined
      ? product.availability_days
      : 1
  );
  const [homeDeliveryWeekdays, setHomeDeliveryWeekdays] = useState<string[]>(
    product?.availability_weekdays || ['viernes']
  );

  const toggleDeliveryMethod = (method: string) => {
    setDeliveryMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );
  };

  const toggleCaserioDay = (day: string) => {
    setCaserioDays((prev) =>
      prev.includes(day) ? (prev.length > 1 ? prev.filter((d) => d !== day) : prev) : [...prev, day]
    );
  };

  const togglePuntosDay = (day: string) => {
    setPuntosDays((prev) =>
      prev.includes(day) ? (prev.length > 1 ? prev.filter((d) => d !== day) : prev) : [...prev, day]
    );
  };

  const toggleHomeDeliveryWeekday = (dayId: string) => {
    setHomeDeliveryWeekdays((prev) =>
      prev.includes(dayId) ? (prev.length > 1 ? prev.filter((d) => d !== dayId) : prev) : [...prev, dayId]
    );
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    formData.set('name', name);
    formData.set('category', category);
    formData.set('format', format);
    formData.set('price', (format === 'granel' ? (pricePerKilo || price) : price).toString());
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

    // Disponibilidad
    const calculatedAvailabilityType: AvailabilityType =
      availType === 'fecha' ? 'fecha_concreta' : 'inmediato';

    formData.set('availability_type', calculatedAvailabilityType);

    if (availType === 'fecha') {
      formData.set('available_from_date', availableFromDate);
    } else {
      formData.set('available_from_date', '');
    }

    // Modalidades de entrega habilitadas
    formData.delete('delivery_methods');
    deliveryMethods.forEach((m) => {
      formData.append('delivery_methods', m);
    });

    // Horarios de Caserío formateados
    const formattedCaserioSchedule = deliveryMethods.includes('caserio')
      ? `${caserioDays.join(', ')} de ${caserioOpeningTime} a ${caserioClosingTime}`
      : '';
    formData.set('caserio_schedule', formattedCaserioSchedule);

    // Días de reparto a domicilio o disponibilidad
    if (deliveryMethods.includes('domicilio')) {
      if (homeDeliveryMode === 'dias') {
        formData.set('availability_days', homeDeliveryDays.toString());
        formData.delete('availability_weekdays');
      } else {
        formData.delete('availability_weekdays');
        homeDeliveryWeekdays.forEach((day) => {
          formData.append('availability_weekdays', day);
        });
      }
    } else if (deliveryMethods.includes('punto_entrega')) {
      formData.delete('availability_weekdays');
      puntosDays.forEach((day) => {
        formData.append('availability_weekdays', day.toLowerCase());
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

      {/* 1. SELECCIÓN DE TIPO / FORMATO DE PRODUCTO (POR DEFECTO "A PESO") */}
      <div className="bg-stone-50 p-4 sm:p-5 rounded-2xl border border-stone-200 space-y-3">
        <label className="block text-xs font-black text-stone-900 uppercase tracking-wider">
          Tipo de Venta / Formato *
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Opción 1: A Peso (por defecto) */}
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
                <Scale className="w-4 h-4 text-emerald-700" /> A Peso
              </span>
              {format === 'granel' && <Check className="w-4 h-4 text-emerald-700" />}
            </div>
            <p className="text-[11px] font-semibold text-stone-600">
              Venta al peso en €/kg. El comprador indica los kilos o gramos que desea.
            </p>
          </button>

          {/* Opción 2: Suelto / Por Unidad */}
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

          {/* Opción 3: Pack / Cesta */}
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
            placeholder="Ej. Tomate de caserío, Lechuga fresca, Queso Idiazabal..."
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

      {/* 3. PRECIO Y STOCK */}
      <div className="bg-stone-50 p-4 sm:p-5 rounded-2xl border border-stone-200 space-y-4">
        <h3 className="text-xs font-black text-stone-900 uppercase tracking-wider">
          Configuración de Precio y Stock
        </h3>

        {/* Formato 1: A PESO */}
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

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                Stock / Kilos Totales Disponibles *
              </label>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    disabled={isUnlimitedStock}
                    value={isUnlimitedStock ? '' : stock}
                    onChange={(e) => setStock(parseFloat(e.target.value) || 0)}
                    placeholder="Ej. 50"
                    className="w-36 px-3.5 py-2 border-2 border-stone-300 rounded-xl text-base font-black text-stone-900 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none disabled:bg-stone-100 disabled:text-stone-400"
                  />
                  <span className="text-sm font-bold text-stone-700">kg</span>
                </div>

                <label className="flex items-center gap-2 text-xs font-bold text-stone-800 cursor-pointer bg-white px-3 py-2 rounded-xl border border-stone-300">
                  <input
                    type="checkbox"
                    checked={isUnlimitedStock}
                    onChange={(e) => setIsUnlimitedStock(e.target.checked)}
                    className="w-4 h-4 text-emerald-700 rounded border-stone-300 focus:ring-emerald-600"
                  />
                  <span>Stock Ilimitado / Continuo</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Formato 2: SUELTO / POR UNIDAD */}
        {format === 'suelto' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-2 bg-white rounded-xl border border-stone-200">
              <label className="flex items-center gap-2 text-xs font-bold text-stone-800 cursor-pointer">
                <input
                  type="radio"
                  name="suelto_mode_choice"
                  checked={sueltoMode === 'unidad'}
                  onChange={() => setSueltoMode('unidad')}
                  className="text-emerald-700"
                />
                <span>Unidad Fija (sin peso en kg)</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-bold text-stone-800 cursor-pointer">
                <input
                  type="radio"
                  name="suelto_mode_choice"
                  checked={sueltoMode === 'peso'}
                  onChange={() => setSueltoMode('peso')}
                  className="text-emerald-700"
                />
                <span>Pieza con Peso aproximado (kg)</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Precio por Unidad (€ / ud) *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={price || ''}
                    onChange={(e) => handlePriceChange(parseFloat(e.target.value) || 0)}
                    placeholder="Ej. 2.00"
                    className="w-36 px-3.5 py-2 border-2 border-stone-300 rounded-xl text-base font-black text-stone-900 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                  <span className="text-sm font-bold text-stone-700">€ / ud</span>
                </div>
              </div>

              {sueltoMode === 'peso' && (
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Peso de la pieza (kg)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={weightKg || ''}
                      onChange={(e) => handleWeightKgChange(parseFloat(e.target.value) || 0)}
                      placeholder="Ej. 1.2"
                      className="w-36 px-3.5 py-2 border-2 border-stone-300 rounded-xl text-base font-black text-stone-900 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                    <span className="text-sm font-bold text-stone-700">kg</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                Unidades Disponibles en Stock *
              </label>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    disabled={isUnlimitedStock}
                    value={isUnlimitedStock ? '' : stock}
                    onChange={(e) => setStock(parseInt(e.target.value, 10) || 0)}
                    placeholder="Ej. 25"
                    className="w-36 px-3.5 py-2 border-2 border-stone-300 rounded-xl text-base font-black text-stone-900 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none disabled:bg-stone-100 disabled:text-stone-400"
                  />
                  <span className="text-sm font-bold text-stone-700">uds</span>
                </div>

                <label className="flex items-center gap-2 text-xs font-bold text-stone-800 cursor-pointer bg-white px-3 py-2 rounded-xl border border-stone-300">
                  <input
                    type="checkbox"
                    checked={isUnlimitedStock}
                    onChange={(e) => setIsUnlimitedStock(e.target.checked)}
                    className="w-4 h-4 text-emerald-700 rounded border-stone-300 focus:ring-emerald-600"
                  />
                  <span>Stock Ilimitado / Continuo</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Formato 3: PACK / CESTA */}
        {format === 'pack' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                Contenido del Pack / Cesta *
              </label>
              <textarea
                name="pack_items"
                rows={2}
                required
                defaultValue={product?.pack_items || ''}
                placeholder="Ej. 1kg Tomates, 1 Lechuga, 500g Zanahorias, 1 Botella Sidra..."
                className="w-full px-3.5 py-2 border-2 border-stone-300 rounded-xl text-xs font-bold text-stone-900 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Precio Total del Pack (€) *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={price || ''}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    placeholder="Ej. 15.00"
                    className="w-36 px-3.5 py-2 border-2 border-stone-300 rounded-xl text-base font-black text-stone-900 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                  <span className="text-sm font-bold text-stone-700">€</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Packs Disponibles en Stock *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    disabled={isUnlimitedStock}
                    value={isUnlimitedStock ? '' : stock}
                    onChange={(e) => setStock(parseInt(e.target.value, 10) || 0)}
                    placeholder="Ej. 10"
                    className="w-36 px-3.5 py-2 border-2 border-stone-300 rounded-xl text-base font-black text-stone-900 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none disabled:bg-stone-100 disabled:text-stone-400"
                  />
                  <span className="text-sm font-bold text-stone-700">packs</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. DISPONIBILIDAD Y PLAZO DE ENTREGA */}
      <div className="bg-stone-50 p-4 sm:p-5 rounded-2xl border border-stone-200 space-y-5">
        <h3 className="text-xs font-black text-stone-900 uppercase tracking-wider">
          Disponibilidad y Opciones de Entrega
        </h3>

        {/* PASO 1: DISPONIBILIDAD DE LA COSECHA / PRODUCTO */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-stone-800">
            1. ¿Cuándo está disponible el producto? *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAvailType('ya')}
              className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                availType === 'ya'
                  ? 'border-emerald-700 bg-white ring-2 ring-emerald-600 font-bold shadow-sm'
                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
              }`}
            >
              <span className="text-xs font-black block text-stone-900">
                🟢 Disponible Ya (Stock Inmediato)
              </span>
              <span className="text-[11px] font-semibold text-stone-600 block mt-0.5">
                Cosechado y listo para entregar según tus días de reparto.
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
              <span className="text-xs font-black block text-stone-900">
                📅 Disponible a partir de una fecha concreta
              </span>
              <span className="text-[11px] font-semibold text-stone-600 block mt-0.5">
                Preventa de cosecha futura (ej. maduración en fecha determinada).
              </span>
            </button>
          </div>

          {availType === 'fecha' && (
            <div className="p-3.5 bg-white rounded-xl border border-stone-200 space-y-1 mt-2">
              <label className="block text-xs font-bold text-stone-800">
                Fecha exacta a partir de la cual estará disponible: *
              </label>
              <input
                type="date"
                required
                value={availableFromDate}
                onChange={(e) => setAvailableFromDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="px-3.5 py-2 border-2 border-stone-300 rounded-xl text-xs font-bold text-stone-900 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* PASO 2: OPCIONES DE ENTREGA Y HORARIOS POR TIPO */}
        <div className="space-y-4 pt-3 border-t border-stone-200">
          <div>
            <label className="block text-xs font-black text-stone-900 uppercase tracking-wider">
              2. Opciones de entrega disponibles para este producto: *
            </label>
            <p className="text-[11px] font-semibold text-stone-500 mt-0.5">
              Marca las opciones habilitadas y define los días y horarios correspondientes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Modalidad 1: Recogida en Caserío */}
            <div
              onClick={() => {
                if (hasCaserioPoints) {
                  toggleDeliveryMethod('caserio');
                }
              }}
              className={`p-3.5 rounded-xl border-2 text-left transition-all flex flex-col justify-between gap-1.5 ${
                !hasCaserioPoints
                  ? 'border-stone-200 bg-stone-50 opacity-75 cursor-not-allowed'
                  : deliveryMethods.includes('caserio')
                  ? 'border-emerald-700 bg-emerald-50 text-emerald-950 shadow-sm cursor-pointer'
                  : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 cursor-pointer'
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
                  disabled={!hasCaserioPoints}
                  readOnly
                  className="w-4 h-4 text-emerald-700 rounded cursor-pointer"
                />
              </div>
              {hasCaserioPoints ? (
                <span className="text-[10px] font-semibold text-stone-500">
                  El cliente recoge en tus instalaciones.
                </span>
              ) : (
                <div className="text-[10px] font-bold text-amber-800 bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                  Añade primero tu caserío en{' '}
                  <Link href="/vendedor/puntos-entrega" className="underline font-black text-amber-950">
                    Puntos de Entrega
                  </Link>
                </div>
              )}
            </div>

            {/* Modalidad 2: Punto de Entrega Físico */}
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
                  <MapPin className="w-4 h-4 text-emerald-700" />
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
                  Mercado, plaza o puesto registrado.
                </span>
              ) : (
                <div className="text-[10px] font-bold text-amber-800 bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                  Añade puntos en{' '}
                  <Link href="/vendedor/puntos-entrega" className="underline font-black text-amber-950">
                    Puntos de Entrega
                  </Link>
                </div>
              )}
            </div>

            {/* Modalidad 3: Envío a Domicilio */}
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
                  Reparto directo en la casa del cliente.
                </span>
              ) : (
                <div className="text-[10px] font-bold text-amber-800 bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                  Activa reparto en{' '}
                  <Link href="/vendedor/puntos-entrega" className="underline font-black text-amber-950">
                    Puntos de Entrega
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* DETALLES Y HORARIOS PARA RECOGIDA EN CASERÍO */}
          {deliveryMethods.includes('caserio') && (
            <div className="p-4 bg-white rounded-2xl border-2 border-emerald-300 space-y-3">
              <div className="flex items-center gap-2 text-emerald-950 font-black text-xs">
                <Store className="w-4 h-4 text-emerald-700" />
                <span>Configuración de Recogida en Caserío:</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Días de la semana para recogida en Caserío:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {WEEKDAYS_DISPLAY.map((day) => (
                    <button
                      type="button"
                      key={day.id}
                      onClick={() => toggleCaserioDay(day.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        caserioDays.includes(day.id)
                          ? 'bg-emerald-800 text-white border-emerald-900 shadow-sm'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Horario de recogida en Caserío:
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-sm">
                  <div>
                    <span className="text-[10px] font-bold text-stone-500 block mb-0.5">Hora Inicio:</span>
                    <input
                      type="time"
                      value={caserioOpeningTime}
                      onChange={(e) => setCaserioOpeningTime(e.target.value)}
                      className="w-full px-3 py-1.5 border-2 border-stone-300 rounded-xl text-xs font-bold bg-white text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-stone-500 block mb-0.5">Hora Fin:</span>
                    <input
                      type="time"
                      value={caserioClosingTime}
                      onChange={(e) => setCaserioClosingTime(e.target.value)}
                      className="w-full px-3 py-1.5 border-2 border-stone-300 rounded-xl text-xs font-bold bg-white text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DETALLES Y HORARIOS PARA PUNTOS DE ENTREGA FÍSICOS */}
          {deliveryMethods.includes('punto_entrega') && (
            <div className="p-4 bg-white rounded-2xl border-2 border-emerald-300 space-y-3">
              <div className="flex items-center gap-2 text-emerald-950 font-black text-xs">
                <MapPin className="w-4 h-4 text-emerald-700" />
                <span>Configuración de Puntos Físicos / Mercados:</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Días de la semana para entrega en Punto Físico:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {WEEKDAYS_DISPLAY.map((day) => (
                    <button
                      type="button"
                      key={day.id}
                      onClick={() => togglePuntosDay(day.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        puntosDays.includes(day.id)
                          ? 'bg-emerald-800 text-white border-emerald-900 shadow-sm'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Horario de atención en Punto Físico:
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-sm">
                  <div>
                    <span className="text-[10px] font-bold text-stone-500 block mb-0.5">Hora Inicio:</span>
                    <input
                      type="time"
                      value={puntosOpeningTime}
                      onChange={(e) => setPuntosOpeningTime(e.target.value)}
                      className="w-full px-3 py-1.5 border-2 border-stone-300 rounded-xl text-xs font-bold bg-white text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-stone-500 block mb-0.5">Hora Fin:</span>
                    <input
                      type="time"
                      value={puntosClosingTime}
                      onChange={(e) => setPuntosClosingTime(e.target.value)}
                      className="w-full px-3 py-1.5 border-2 border-stone-300 rounded-xl text-xs font-bold bg-white text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DETALLES Y PLAZOS PARA ENVÍO A DOMICILIO */}
          {deliveryMethods.includes('domicilio') && (
            <div className="p-4 bg-white rounded-2xl border-2 border-emerald-300 space-y-3">
              <div className="flex items-center gap-2 text-emerald-950 font-black text-xs">
                <Truck className="w-4 h-4 text-emerald-700" />
                <span>Modalidad de Reparto a Domicilio:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <label
                  onClick={() => setHomeDeliveryMode('dias')}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    homeDeliveryMode === 'dias'
                      ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold shadow-sm'
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="home_delivery_mode_radio"
                    checked={homeDeliveryMode === 'dias'}
                    onChange={() => setHomeDeliveryMode('dias')}
                    className="text-emerald-700 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="font-black text-stone-900 block">
                      Entrega al día siguiente (24h) / en plazo
                    </span>
                    <span className="text-[10px] text-stone-500 font-semibold block">
                      Reparto según plazo tras disponibilidad.
                    </span>
                  </div>
                </label>

                <label
                  onClick={() => setHomeDeliveryMode('dias_semana')}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    homeDeliveryMode === 'dias_semana'
                      ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold shadow-sm'
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="home_delivery_mode_radio"
                    checked={homeDeliveryMode === 'dias_semana'}
                    onChange={() => setHomeDeliveryMode('dias_semana')}
                    className="text-emerald-700 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="font-black text-stone-900 block">
                      Selección de días fijos de reparto semanal
                    </span>
                    <span className="text-[10px] text-stone-500 font-semibold block">
                      Solo repartes en días concretos de la semana.
                    </span>
                  </div>
                </label>
              </div>

              {homeDeliveryMode === 'dias' && (
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2 mt-2">
                  <label className="block text-xs font-bold text-stone-800">
                    Días de plazo de preparación y entrega a domicilio:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="14"
                      value={homeDeliveryDays}
                      onChange={(e) => setHomeDeliveryDays(parseInt(e.target.value, 10) || 0)}
                      className="w-24 px-3 py-1.5 border-2 border-stone-300 rounded-xl text-base font-black text-stone-900 bg-white"
                    />
                    <span className="text-xs font-bold text-stone-700">
                      {homeDeliveryDays === 0
                        ? 'día (Mismo día del pedido)'
                        : homeDeliveryDays === 1
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
                        onClick={() => setHomeDeliveryDays(opt.days)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                          homeDeliveryDays === opt.days
                            ? 'bg-emerald-700 text-white border-emerald-800'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {homeDeliveryMode === 'dias_semana' && (
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2 mt-2">
                  <label className="block text-xs font-bold text-stone-800">
                    Selecciona los días fijos de reparto a domicilio:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAYS_IDS.map((day) => {
                      const isSelected = homeDeliveryWeekdays.includes(day.id);
                      return (
                        <button
                          type="button"
                          key={day.id}
                          onClick={() => toggleHomeDeliveryWeekday(day.id)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                            isSelected
                              ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                              : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
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

      {/* BOTONES DE ACCIÓN */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading || deleting}
          className="w-full flex-1 bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white font-extrabold py-3.5 rounded-xl text-base shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Sprout className="w-5 h-5" />
          {loading
            ? 'Guardando...'
            : isEdit
            ? 'Guardar Cambios del Producto'
            : 'Publicar Producto en km0'}
        </button>

        {isEdit && product?.id && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading || deleting}
            className="w-full sm:w-auto px-5 py-3.5 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 font-black text-sm rounded-xl border border-red-200 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
            <span>{deleting ? 'Borrando...' : 'Borrar Producto'}</span>
          </button>
        )}
      </div>
    </form>
  );
}

export default ProductForm;
