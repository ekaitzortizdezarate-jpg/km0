'use client';

import { useState } from 'react';
import {
  Plus,
  Trash2,
  Store,
  Truck,
  Clock,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Edit2,
} from 'lucide-react';
import type { DeliveryPoint } from '@/types/database';
import {
  createDeliveryPoint,
  deleteDeliveryPoint,
  toggleHomeDeliveryService,
} from '@/app/actions/delivery-points';

interface DeliveryPointsManagerProps {
  initialPoints: DeliveryPoint[];
}

const WEEKDAYS = [
  { id: 'Lunes', label: 'Lunes' },
  { id: 'Martes', label: 'Martes' },
  { id: 'Miércoles', label: 'Miércoles' },
  { id: 'Jueves', label: 'Jueves' },
  { id: 'Viernes', label: 'Viernes' },
  { id: 'Sábado', label: 'Sábado' },
  { id: 'Domingo', label: 'Domingo' },
];

export function DeliveryPointsManager({ initialPoints }: DeliveryPointsManagerProps) {
  const [points, setPoints] = useState<DeliveryPoint[]>(initialPoints);
  const [selectedType, setSelectedType] = useState<'caserio' | 'sitio_fisico'>('sitio_fisico');
  const [name, setName] = useState('');
  const [town, setTown] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [addressDetails, setAddressDetails] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Lunes', 'Miércoles', 'Viernes']);
  const [openingTime, setOpeningTime] = useState('10:00');
  const [closingTime, setClosingTime] = useState('14:00');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Comprobar si ya existe caserio y servicio a domicilio
  const caserioPoint = points.find((p) => p.type === 'caserio');
  const envioPoint = points.find((p) => p.type === 'envio');
  const [homeDeliveryActive, setHomeDeliveryActive] = useState<boolean>(
    Boolean(envioPoint && envioPoint.is_active !== false)
  );

  const physicalPoints = points.filter((p) => p.type !== 'envio');

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSelectType = (type: 'caserio' | 'sitio_fisico') => {
    setSelectedType(type);
    if (type === 'caserio' && caserioPoint) {
      setName(caserioPoint.name);
      setTown(caserioPoint.town);
      setPostalCode(caserioPoint.postal_code || '');
      setAddressDetails(caserioPoint.address_details);
      if (caserioPoint.days_of_week && caserioPoint.days_of_week.length > 0) {
        setSelectedDays(caserioPoint.days_of_week);
      }
      if (caserioPoint.opening_time) setOpeningTime(caserioPoint.opening_time);
      if (caserioPoint.closing_time) setClosingTime(caserioPoint.closing_time);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('type', selectedType);
    formData.append('town', town);
    formData.append('postal_code', postalCode);
    formData.append('address_details', addressDetails);
    selectedDays.forEach((d) => formData.append('days_of_week', d));
    formData.append('opening_time', openingTime);
    formData.append('closing_time', closingTime);

    const res = await createDeliveryPoint(formData);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      setSuccessMsg(
        selectedType === 'caserio' && res.updated
          ? 'Datos del caserío actualizados con éxito'
          : 'Punto de entrega guardado correctamente'
      );
      setTimeout(() => setSuccessMsg(null), 3000);

      // Limpiar formulario si fue sitio fisico
      if (selectedType === 'sitio_fisico') {
        setName('');
        setAddressDetails('');
      }

      window.location.reload();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este punto de entrega?')) return;
    const res = await deleteDeliveryPoint(id);
    if (res.success) {
      setPoints((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleToggleHomeDelivery = async () => {
    const nextState = !homeDeliveryActive;
    setHomeDeliveryActive(nextState);
    const res = await toggleHomeDeliveryService(nextState);
    if (res.error) {
      setHomeDeliveryActive(!nextState);
      alert('Error al actualizar servicio a domicilio: ' + res.error);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-stone-900">Puntos de Entrega y Servicios</h1>
        <p className="text-xs font-semibold text-stone-500 mt-1">
          Configura la ubicación de tu caserío, tus puestos en mercados/plazas y el servicio de reparto a domicilio.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Columna Izquierda: Formulario de Punto + Tarjeta de Reparto a Domicilio */}
        <div className="lg:col-span-5 space-y-6">
          {/* Formulario de Creación / Actualización */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-stone-200 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-stone-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-700" /> Añadir o Editar Punto
            </h2>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tipo de Modalidad */}
              <div>
                <label className="block text-xs font-black text-stone-800 uppercase tracking-wider mb-1.5">
                  Tipo de Modalidad
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectType('caserio')}
                    className={`p-2.5 rounded-xl border-2 text-xs font-black transition-all flex flex-col items-center justify-center gap-1 ${
                      selectedType === 'caserio'
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-950 shadow-sm'
                        : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <Store className="w-4 h-4 text-emerald-700" />
                    <span>Recogida en Caserío</span>
                    <span className="text-[9px] font-semibold text-stone-500">(Máximo 1)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectType('sitio_fisico')}
                    className={`p-2.5 rounded-xl border-2 text-xs font-black transition-all flex flex-col items-center justify-center gap-1 ${
                      selectedType === 'sitio_fisico'
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-950 shadow-sm'
                        : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <MapPin className="w-4 h-4 text-emerald-700" />
                    <span>Punto Físico / Mercado</span>
                    <span className="text-[9px] font-semibold text-stone-500">(Plazas, puestos...)</span>
                  </button>
                </div>

                {selectedType === 'caserio' && caserioPoint && (
                  <p className="text-[11px] font-bold text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200 mt-2">
                    ℹ️ Ya tienes un caserío registrado. Guardar este formulario actualizará la dirección y horarios de tu caserío.
                  </p>
                )}
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Nombre del Punto
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={
                    selectedType === 'caserio'
                      ? 'Ej. Caserío Baserria'
                      : 'Ej. Frontón Municipal, Puesto Mercado...'
                  }
                  className="w-full px-3 py-2 border-2 border-stone-300 rounded-xl text-xs font-bold text-stone-900 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              {/* Pueblo y Código Postal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Pueblo / Municipio *
                  </label>
                  <input
                    type="text"
                    required
                    value={town}
                    onChange={(e) => setTown(e.target.value)}
                    placeholder="Ej. Gernika, Bermeo..."
                    className="w-full px-3 py-2 border-2 border-stone-300 rounded-xl text-xs font-bold text-stone-900 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Código Postal (CP) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="Ej. 48300"
                    className="w-full px-3 py-2 border-2 border-stone-300 rounded-xl text-xs font-bold text-stone-900 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Dirección / Indicaciones */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Dirección exacta / Indicaciones *
                </label>
                <textarea
                  required
                  rows={2}
                  value={addressDetails}
                  onChange={(e) => setAddressDetails(e.target.value)}
                  placeholder="Calle, número, barrio, portal o puesto exacto..."
                  className="w-full px-3 py-2 border-2 border-stone-300 rounded-xl text-xs font-bold text-stone-900 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              {/* Días de la semana seleccionables */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700">
                  Días de la semana para recogida:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {WEEKDAYS.map((day) => (
                    <button
                      type="button"
                      key={day.id}
                      onClick={() => toggleDay(day.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                        selectedDays.includes(day.id)
                          ? 'bg-emerald-800 text-white border-emerald-900 shadow-sm'
                          : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Horario: Hora Inicio y Hora Fin */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-700">
                  Horario de apertura y recogida:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-stone-500 block mb-0.5">
                      Hora Inicio:
                    </span>
                    <input
                      type="time"
                      value={openingTime}
                      onChange={(e) => setOpeningTime(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-stone-300 rounded-xl text-xs font-bold bg-white text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-stone-500 block mb-0.5">
                      Hora Fin:
                    </span>
                    <input
                      type="time"
                      value={closingTime}
                      onChange={(e) => setClosingTime(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-stone-300 rounded-xl text-xs font-bold bg-white text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-black py-3 rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
              >
                {loading ? 'Guardando...' : selectedType === 'caserio' && caserioPoint ? 'Actualizar Caserío' : 'Guardar Punto'}
              </button>
            </form>
          </div>

          {/* Tarjeta de Servicio de Envío a Domicilio con Toggle Button */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-stone-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2.5 rounded-2xl ${homeDeliveryActive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-400'}`}>
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-stone-900">
                    Servicio de Envío a Domicilio
                  </h3>
                  <p className="text-[11px] font-semibold text-stone-500">
                    {homeDeliveryActive ? 'Activo: los clientes pueden pedir a domicilio' : 'Inactivo: solo recogida presencial'}
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={handleToggleHomeDelivery}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  homeDeliveryActive ? 'bg-emerald-700' : 'bg-stone-300'
                }`}
                role="switch"
                aria-checked={homeDeliveryActive}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    homeDeliveryActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <p className="text-[11px] font-medium text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
              Al activar este servicio, los compradores podrán seleccionar que entregues sus pedidos directamente en su dirección.
            </p>
          </div>
        </div>

        {/* Columna Derecha: Lista de Puntos Guardados */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-sm font-black text-stone-900 flex items-center justify-between">
            <span>Tus Puntos de Entrega Guardados ({physicalPoints.length})</span>
          </h2>

          {physicalPoints.length > 0 ? (
            <div className="space-y-3">
              {physicalPoints.map((pt) => (
                <div
                  key={pt.id}
                  className="bg-white p-5 rounded-3xl border-2 border-stone-200 shadow-sm flex items-start justify-between gap-4 hover:border-emerald-700 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="p-2 bg-emerald-50 text-emerald-800 rounded-xl">
                        <Store className="w-4 h-4" />
                      </span>
                      <h3 className="font-black text-stone-900 text-sm">{pt.name}</h3>

                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border ${
                          pt.type === 'caserio'
                            ? 'bg-amber-100 text-amber-950 border-amber-300'
                            : 'bg-stone-100 text-stone-700 border-stone-300'
                        }`}
                      >
                        {pt.type === 'caserio' ? '🏡 Caserío Principal' : '📍 Punto Físico'}
                      </span>

                      <span className="text-[10px] font-bold bg-stone-100 text-stone-600 px-2 py-0.5 rounded-lg">
                        {pt.town} {pt.postal_code ? `(${pt.postal_code})` : ''}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-stone-700 pl-8">
                      {pt.address_details}
                    </p>

                    {pt.schedule_notes && (
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-950 bg-emerald-50 p-2 rounded-xl border border-emerald-200 pl-3">
                        <Clock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>{pt.schedule_notes}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDelete(pt.id)}
                      className="p-2 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
                      title="Eliminar punto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-3xl border-2 border-stone-200 text-xs font-bold text-stone-500 p-6 space-y-2">
              <Store className="w-8 h-8 text-stone-300 mx-auto" />
              <p>Aún no has registrado la dirección de tu caserío ni puntos físicos de entrega.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DeliveryPointsManager;
