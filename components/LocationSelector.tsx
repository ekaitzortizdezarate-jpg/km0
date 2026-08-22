'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { MapPin, ChevronDown, Check, X, Search } from 'lucide-react';
import {
  PROVINCES,
  BIZKAIA_TOWNS,
  getTownsByProvince,
  findTownData,
  TownData,
} from '@/lib/locations-data';

interface LocationSelectorProps {
  provinceInputName?: string;
  townInputName?: string;
  postalCodeInputName?: string;
  defaultProvince?: string;
  defaultTown?: string;
  defaultPostalCode?: string;
  onChange?: (data: { province: string; town: string; postalCode: string }) => void;
  required?: boolean;
  showProvince?: boolean;
  showPostalCode?: boolean;
  labelTown?: string;
  labelPostalCode?: string;
  labelProvince?: string;
  compact?: boolean;
}

export function LocationSelector({
  provinceInputName = 'province',
  townInputName = 'town',
  postalCodeInputName = 'postal_code',
  defaultProvince = 'Bizkaia',
  defaultTown = '',
  defaultPostalCode = '',
  onChange,
  required = false,
  showProvince = true,
  showPostalCode = true,
  labelTown = 'Pueblo / Municipio *',
  labelPostalCode = 'Código Postal',
  labelProvince = 'Provincia',
  compact = false,
}: LocationSelectorProps) {
  const [province, setProvince] = useState(defaultProvince || 'Bizkaia');
  const [town, setTown] = useState(defaultTown || '');
  const [postalCode, setPostalCode] = useState(defaultPostalCode || '');

  const [isOpenTownDropdown, setIsOpenTownDropdown] = useState(false);
  const [townSearchQuery, setTownSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Lista de pueblos según la provincia seleccionada
  const townsList = useMemo(() => {
    return getTownsByProvince(province);
  }, [province]);

  // Filtrado de pueblos según búsqueda
  const filteredTowns = useMemo(() => {
    if (!townSearchQuery.trim()) return townsList;
    const q = townSearchQuery.trim().toLowerCase();
    return townsList.filter((t) => t.name.toLowerCase().includes(q));
  }, [townsList, townSearchQuery]);

  // Si cambia el defaultTown desde fuera
  useEffect(() => {
    if (defaultTown !== undefined && defaultTown !== town) {
      setTown(defaultTown);
    }
  }, [defaultTown]);

  useEffect(() => {
    if (defaultPostalCode !== undefined && defaultPostalCode !== postalCode) {
      setPostalCode(defaultPostalCode);
    }
  }, [defaultPostalCode]);

  useEffect(() => {
    if (defaultProvince !== undefined && defaultProvince !== province) {
      setProvince(defaultProvince);
    }
  }, [defaultProvince]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpenTownDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectTown = (tData: TownData) => {
    setTown(tData.name);
    // Asignar automáticamente el código postal principal
    const autoPostal = tData.postalCodes[0] || '';
    setPostalCode(autoPostal);
    setIsOpenTownDropdown(false);
    setTownSearchQuery('');

    if (onChange) {
      onChange({
        province,
        town: tData.name,
        postalCode: autoPostal,
      });
    }
  };

  const handleProvinceChange = (newProv: string) => {
    setProvince(newProv);
    if (onChange) {
      onChange({ province: newProv, town, postalCode });
    }
  };

  const handleTownInputChange = (val: string) => {
    setTown(val);
    setTownSearchQuery(val);
    // Si coincide exactamente con un pueblo, rellenar CP
    const found = townsList.find((t) => t.name.toLowerCase() === val.trim().toLowerCase());
    let currentCp = postalCode;
    if (found && found.postalCodes.length > 0) {
      currentCp = found.postalCodes[0];
      setPostalCode(currentCp);
    }

    if (onChange) {
      onChange({ province, town: val, postalCode: currentCp });
    }
  };

  const handlePostalCodeChange = (val: string) => {
    setPostalCode(val);
    if (onChange) {
      onChange({ province, town, postalCode: val });
    }
  };

  // Posibles códigos postales del pueblo seleccionado si tiene varios
  const currentTownData = useMemo(() => {
    return findTownData(town);
  }, [town]);

  return (
    <div className={`space-y-3 ${compact ? 'text-xs' : 'text-sm'}`}>
      <div className={`grid grid-cols-1 ${showProvince ? (showPostalCode ? 'sm:grid-cols-12 gap-3' : 'sm:grid-cols-2 gap-3') : (showPostalCode ? 'sm:grid-cols-2 gap-3' : 'grid-cols-1')}`}>
        {/* PROVINCIA (Opcional) */}
        {showProvince && (
          <div className={`${showPostalCode ? 'sm:col-span-4' : 'sm:col-span-1'}`}>
            <label className="block text-[10px] font-black text-stone-700 uppercase tracking-wider mb-1">
              {labelProvince}
            </label>
            <div className="relative">
              <select
                name={provinceInputName}
                value={province}
                onChange={(e) => handleProvinceChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border-2 border-stone-300 rounded-xl text-xs sm:text-sm font-bold text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none appearance-none pr-8 cursor-pointer shadow-2xs"
              >
                {PROVINCES.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-stone-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}

        {/* PUEBLO / MUNICIPIO CON DESPLEGABLE BUSCADOR */}
        <div
          ref={dropdownRef}
          className={`relative ${
            showProvince && showPostalCode
              ? 'sm:col-span-5'
              : showPostalCode || showProvince
              ? 'sm:col-span-1'
              : 'col-span-1'
          }`}
        >
          <label className="block text-[10px] font-black text-stone-700 uppercase tracking-wider mb-1">
            {labelTown}
          </label>
          <div className="relative">
            <input
              type="text"
              name={townInputName}
              value={town}
              required={required}
              placeholder="Ej. Durango, Bermeo, Bilbao..."
              onChange={(e) => handleTownInputChange(e.target.value)}
              onFocus={() => {
                setTownSearchQuery(town);
                setIsOpenTownDropdown(true);
              }}
              className="w-full px-3 py-2.5 bg-white border-2 border-stone-300 rounded-xl text-xs sm:text-sm font-bold text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none pr-8 shadow-2xs"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setIsOpenTownDropdown(!isOpenTownDropdown)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Menú Desplegable de Pueblos */}
          {isOpenTownDropdown && (
            <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border-2 border-stone-300 rounded-2xl shadow-xl max-h-60 overflow-y-auto divide-y divide-stone-100">
              <div className="p-2 sticky top-0 bg-stone-50 border-b border-stone-200">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={townSearchQuery}
                    onChange={(e) => setTownSearchQuery(e.target.value)}
                    placeholder="Buscar pueblo..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    autoFocus
                  />
                </div>
              </div>

              {filteredTowns.length > 0 ? (
                filteredTowns.map((t) => {
                  const isSelected = t.name.toLowerCase() === town.toLowerCase();
                  return (
                    <button
                      type="button"
                      key={t.name}
                      onClick={() => handleSelectTown(t)}
                      className={`w-full px-3 py-2 text-left text-xs sm:text-sm flex items-center justify-between transition-colors hover:bg-emerald-50 ${
                        isSelected ? 'bg-emerald-50 text-emerald-950 font-black' : 'text-stone-800 font-bold'
                      }`}
                    >
                      <span>{t.name}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-extrabold text-emerald-900 bg-emerald-100/80 px-1.5 py-0.5 rounded-md">
                          {t.postalCodes[0]}
                          {t.postalCodes.length > 1 ? ` (+${t.postalCodes.length - 1})` : ''}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-700 ml-1" />}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-3 text-center text-xs text-stone-500 font-semibold">
                  <p>No se encontró el pueblo.</p>
                  <p className="text-[11px] text-stone-400 mt-0.5">Puedes escribirlo manualmente.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* CÓDIGO POSTAL */}
        {showPostalCode && (
          <div className={`${showProvince ? 'sm:col-span-3' : 'sm:col-span-1'}`}>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] font-black text-stone-700 uppercase tracking-wider">
                {labelPostalCode}
              </label>
              {postalCode && (
                <button
                  type="button"
                  onClick={() => handlePostalCodeChange('')}
                  className="text-[10px] text-stone-400 hover:text-red-600 font-bold"
                  title="Borrar código postal"
                >
                  Borrar
                </button>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                name={postalCodeInputName}
                maxLength={5}
                value={postalCode}
                placeholder="48001"
                onChange={(e) => handlePostalCodeChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border-2 border-stone-300 rounded-xl text-xs sm:text-sm font-bold text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none shadow-2xs"
              />
            </div>

            {/* Selector de códigos postales alternativos si el municipio tiene varios (ej. Bilbao o Getxo) */}
            {currentTownData && currentTownData.postalCodes.length > 1 && (
              <div className="mt-1 flex flex-wrap items-center gap-1">
                <span className="text-[9px] font-bold text-stone-500">Opciones:</span>
                {currentTownData.postalCodes.slice(0, 5).map((cp) => (
                  <button
                    type="button"
                    key={cp}
                    onClick={() => handlePostalCodeChange(cp)}
                    className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border transition-colors ${
                      postalCode === cp
                        ? 'bg-emerald-800 text-white border-emerald-900'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-300'
                    }`}
                  >
                    {cp}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
