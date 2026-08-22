'use client';

import { useState } from 'react';
import {
  Plus,
  Trash2,
  Store,
  Truck,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Pencil,
  X,
} from 'lucide-react';
import type { DeliveryPoint } from '@/types/database';
import {
  createDeliveryPoint,
  deleteDeliveryPoint,
  toggleHomeDeliveryService,
} from '@/app/actions/delivery-points';
import { ImageSelector } from '@/components/ImageSelector';
import { LocationSelector } from '@/components/LocationSelector';

interface DeliveryPointsManagerProps {
  initialPoints: DeliveryPoint[];
}

export function DeliveryPointsManager({ initialPoints }: DeliveryPointsManagerProps) {
  const [points, setPoints] = useState<DeliveryPoint[]>(initialPoints);
  const [editingPointId, setEditingPointId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'caserio' | 'sitio_fisico'>('sitio_fisico');
  const [name, setName] = useState('');
  const [town, setTown] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [addressDetails, setAddressDetails] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);

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

  const handleSelectType = (type: 'caserio' | 'sitio_fisico') => {
    setSelectedType(type);
    if (type === 'caserio' && caserioPoint) {
      setEditingPointId(caserioPoint.id);
      setName(caserioPoint.name);
      setTown(caserioPoint.town);
      setPostalCode(caserioPoint.postal_code || '');
      setAddressDetails(caserioPoint.address_details);
      setImageUrl(caserioPoint.image_url || null);
    } else if (type === 'sitio_fisico' && !editingPointId) {
      setName('');
      setAddressDetails('');
      setImageUrl(null);
    }
  };

  const handleStartEdit = (pt: DeliveryPoint) => {
    setEditingPointId(pt.id);
    setSelectedType(pt.type as 'caserio' | 'sitio_fisico');
    setName(pt.name);
    setTown(pt.town);
    setPostalCode(pt.postal_code || '');
    setAddressDetails(pt.address_details);
    setImageUrl(pt.image_url || null);
    setError(null);
    setSuccessMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingPointId(null);
    setSelectedType('sitio_fisico');
    setName('');
    setTown('');
    setPostalCode('');
    setAddressDetails('');
    setImageUrl(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    if (editingPointId) {
      formData.set('point_id', editingPointId);
    }
    formData.set('name', name);
    formData.set('type', selectedType);
    formData.set('town', town);
    formData.set('postal_code', postalCode);
    formData.set('address_details', addressDetails);

    const res = await createDeliveryPoint(formData);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      setSuccessMsg(
        editingPointId || (selectedType === 'caserio' && res.updated)
          ? 'Ubicación actualizada con éxito'
          : 'Punto de entrega guardado correctamente'
      );
      setTimeout(() => setSuccessMsg(null), 3000);

      // Limpiar estado de edición
      setEditingPointId(null);
      if (selectedType === 'sitio_fisico') {
        setName('');
        setAddressDetails('');
        setImageUrl(null);
      }

      window.location.reload();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este punto de entrega?')) return;
    const res = await deleteDeliveryPoint(id);
    if (res.success) {
      setPoints((prev) => prev.filter((p) => p.id !== id));
      if (editingPointId === id) {
        handleCancelEdit();
      }
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Columna Izquierda: Formulario de Punto + Tarjeta de Reparto a Domicilio */}
        <div className="lg:col-span-5 space-y-6">
          {/* Formulario de Creación / Actualización */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-stone-900 flex items-center gap-2">
                {editingPointId ? (
                  <>
                    <Pencil className="w-4 h-4 text-emerald-700" />
                    <span>Editando Ubicación</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-emerald-700" />
                    <span>Añadir Nuevo Punto</span>
                  </>
                )}
              </h2>

              {editingPointId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-xs font-bold text-stone-500 hover:text-stone-800 flex items-center gap-1 bg-stone-100 px-2 py-1 rounded-lg transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Cancelar
                </button>
              )}
            </div>

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
              {editingPointId && (
                <input type="hidden" name="point_id" value={editingPointId} />
              )}

              {/* Tipo de Modalidad */}
              <div>
                <label className="block text-xs font-black text-stone-800 uppercase tracking-wider mb-1.5">
                  Tipo de Ubicación
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
                    <span>Instalaciones Caserío</span>
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

                {selectedType === 'caserio' && caserioPoint && !editingPointId && (
                  <p className="text-[11px] font-bold text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200 mt-2">
                    ℹ️ Ya tienes un caserío registrado. Guardar este formulario actualizará la dirección y foto de tu caserío.
                  </p>
                )}
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Nombre del Punto / Caserío *
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

              {/* Pueblo y Código Postal con selector y autocompletado */}
              <LocationSelector
                key={`${editingPointId || 'new'}_${town}_${postalCode}`}
                defaultProvince="Bizkaia"
                defaultTown={town}
                defaultPostalCode={postalCode}
                showProvince={false}
                showPostalCode={true}
                required={true}
                compact={true}
                labelTown="Pueblo / Municipio *"
                labelPostalCode="Código Postal *"
                onChange={({ town: newTown, postalCode: newCp }) => {
                  setTown(newTown);
                  setPostalCode(newCp);
                }}
              />

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

              {/* Selector de Foto para el Punto de Entrega */}
              <ImageSelector
                key={editingPointId || `new_${selectedType}`}
                name="image_url"
                defaultValue={imageUrl}
                label="Foto del Punto / Caserío"
                type="delivery_point"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-black py-3 rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
              >
                {loading
                  ? 'Guardando...'
                  : editingPointId
                  ? 'Guardar Cambios de la Ubicación'
                  : selectedType === 'caserio' && caserioPoint
                  ? 'Actualizar Caserío'
                  : 'Guardar Punto'}
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
                    {homeDeliveryActive ? 'Activo: puedes ofrecer entrega a domicilio' : 'Inactivo: solo recogida'}
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
              Al activar este servicio, podrás habilitar la entrega a domicilio en los productos que desees.
            </p>
          </div>
        </div>

        {/* Columna Derecha: Lista de Puntos Guardados */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-sm font-black text-stone-900 flex items-center justify-between">
            <span>Tus Ubicaciones Guardadas ({physicalPoints.length})</span>
          </h2>

          {physicalPoints.length > 0 ? (
            <div className="space-y-3">
              {physicalPoints.map((pt) => {
                const isBeingEdited = editingPointId === pt.id;
                return (
                  <div
                    key={pt.id}
                    className={`bg-white p-4 sm:p-5 rounded-3xl border-2 shadow-sm flex flex-col sm:flex-row items-start justify-between gap-4 transition-all ${
                      isBeingEdited
                        ? 'border-emerald-600 ring-2 ring-emerald-500 bg-emerald-50/20'
                        : 'border-stone-200 hover:border-emerald-700'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0 w-full">
                      {pt.image_url ? (
                        <div className="relative shrink-0">
                          <img
                            src={pt.image_url}
                            alt={pt.name}
                            className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-stone-200 shadow-sm"
                          />
                          <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                            📷 Foto
                          </span>
                        </div>
                      ) : (
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-emerald-50 text-emerald-800 flex flex-col items-center justify-center border-2 border-emerald-200 shrink-0 gap-1">
                          {pt.type === 'caserio' ? (
                            <Store className="w-8 h-8" />
                          ) : (
                            <MapPin className="w-8 h-8" />
                          )}
                          <span className="text-[9px] font-bold text-emerald-700">Sin foto</span>
                        </div>
                      )}

                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-black text-stone-900 text-sm truncate">{pt.name}</h3>

                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border ${
                              pt.type === 'caserio'
                                ? 'bg-amber-100 text-amber-950 border-amber-300'
                                : 'bg-stone-100 text-stone-700 border-stone-300'
                            }`}
                          >
                            {pt.type === 'caserio' ? '🏡 Caserío' : '📍 Punto Físico'}
                          </span>

                          <span className="text-[10px] font-bold bg-stone-100 text-stone-600 px-2 py-0.5 rounded-lg">
                            {pt.town} {pt.postal_code ? `(${pt.postal_code})` : ''}
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-stone-700">
                          {pt.address_details}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 self-end sm:self-start">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(pt)}
                        className="p-2 text-stone-500 hover:text-emerald-800 hover:bg-emerald-50 rounded-xl transition-colors"
                        title="Editar punto"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
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
                );
              })}
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
