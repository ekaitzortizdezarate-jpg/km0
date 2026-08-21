'use client';

import { useState, useRef, useEffect } from 'react';
import { Delete, Check, RotateCcw } from 'lucide-react';

interface TouchNumberInputProps {
  name: string;
  value: number;
  onChange: (val: number) => void;
  label?: string;
  unit?: string;
  min?: number;
  max?: number;
  quickOptions?: number[];
  disabled?: boolean;
}

export function TouchNumberInput({
  name,
  value,
  onChange,
  label,
  unit = '',
  min = 1,
  max = 9999,
  quickOptions = [5, 10, 20, 50, 100],
  disabled = false,
}: TouchNumberInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleDigitClick = (digit: string) => {
    const currentStr = value.toString();
    let nextStr: string;
    if (currentStr === '0' || currentStr === '') {
      nextStr = digit;
    } else {
      nextStr = currentStr + digit;
    }

    const num = parseInt(nextStr, 10);
    if (!isNaN(num) && num <= max) {
      onChange(Math.max(min, num));
    }
  };

  const handleBackspace = () => {
    const currentStr = value.toString();
    const nextStr = currentStr.slice(0, -1);
    const num = parseInt(nextStr, 10);
    onChange(isNaN(num) ? min : Math.max(min, num));
  };

  const handleClear = () => {
    onChange(min);
  };

  const handlePreset = (preset: number) => {
    onChange(preset);
  };

  return (
    <div ref={containerRef} className="space-y-2 relative">
      {label && (
        <label className="block text-xs font-black text-stone-900 uppercase tracking-wider">
          {label}
        </label>
      )}

      {/* Caja de selección táctil */}
      <div
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        className={`w-full h-13 px-4 py-2.5 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all bg-white shadow-sm ${
          isOpen
            ? 'border-emerald-700 ring-2 ring-emerald-600'
            : 'border-stone-300 hover:border-stone-400'
        }`}
      >
        <input type="hidden" name={name} value={value} />
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-stone-900 tracking-tight">
            {value}
          </span>
          {unit && <span className="text-xs font-bold text-stone-600">{unit}</span>}
        </div>

        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
          {isOpen ? 'Ocultar teclado' : 'Tocar para elegir número'}
        </span>
      </div>

      {/* TECLADO / DIALPAD NUMÉRICO EN PANTALLA */}
      {isOpen && (
        <div className="p-4 bg-stone-900 text-white rounded-3xl shadow-xl border border-stone-800 space-y-3 animate-fadeIn z-20">
          {/* Cabecera del teclado con valor actual y presets */}
          <div className="flex items-center justify-between pb-2 border-b border-stone-800">
            <div className="flex items-baseline gap-1">
              <span className="text-xs text-stone-400 font-semibold">Valor seleccionado:</span>
              <span className="text-2xl font-black text-emerald-400">
                {value} {unit}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1 transition-colors"
            >
              <Check className="w-3.5 h-3.5" /> Listo
            </button>
          </div>

          {/* Pastillas de números rápidos */}
          {quickOptions && quickOptions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {quickOptions.map((opt) => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => handlePreset(opt)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    value === opt
                      ? 'bg-emerald-500 text-stone-950 font-black'
                      : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700'
                  }`}
                >
                  {opt} {unit}
                </button>
              ))}
            </div>
          )}

          {/* Rejilla de Números 0-9 */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                type="button"
                key={digit}
                onClick={() => handleDigitClick(digit)}
                className="h-12 bg-stone-800 hover:bg-stone-700 active:bg-emerald-700 active:text-white text-stone-100 font-black text-xl rounded-2xl border border-stone-700 transition-all flex items-center justify-center select-none touch-manipulation"
              >
                {digit}
              </button>
            ))}

            {/* Fila Inferior: Borrar todo, Cero, Retroceso */}
            <button
              type="button"
              onClick={handleClear}
              className="h-12 bg-stone-800/80 hover:bg-stone-700 text-stone-400 font-bold text-xs rounded-2xl border border-stone-700 transition-all flex items-center justify-center gap-1 select-none touch-manipulation"
              title="Borrar todo"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => handleDigitClick('0')}
              className="h-12 bg-stone-800 hover:bg-stone-700 active:bg-emerald-700 active:text-white text-stone-100 font-black text-xl rounded-2xl border border-stone-700 transition-all flex items-center justify-center select-none touch-manipulation"
            >
              0
            </button>

            <button
              type="button"
              onClick={handleBackspace}
              className="h-12 bg-stone-800/80 hover:bg-stone-700 text-stone-300 font-bold text-xs rounded-2xl border border-stone-700 transition-all flex items-center justify-center select-none touch-manipulation"
              title="Borrar dígito"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TouchNumberInput;
