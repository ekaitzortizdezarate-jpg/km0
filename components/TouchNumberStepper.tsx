'use client';

import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';

interface TouchNumberStepperProps {
  name: string;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  value?: number;
  onChange?: (val: number) => void;
  unit?: string;
  quickOptions?: number[];
  label?: string;
  disabled?: boolean;
}

export function TouchNumberStepper({
  name,
  min = 1,
  max = 999,
  step = 1,
  defaultValue = 1,
  value: controlledValue,
  onChange,
  unit = '',
  quickOptions,
  label,
  disabled = false,
}: TouchNumberStepperProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState<number>(defaultValue);

  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : uncontrolledValue;

  const updateValue = (newVal: number) => {
    if (disabled) return;
    const clamped = Math.max(min, Math.min(max, Number(newVal.toFixed(2))));
    if (!isControlled) {
      setUncontrolledValue(clamped);
    }
    if (onChange) {
      onChange(clamped);
    }
  };

  const handleDecrement = () => {
    updateValue(currentValue - step);
  };

  const handleIncrement = () => {
    updateValue(currentValue + step);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-black text-stone-900 uppercase tracking-wider">
          {label}
        </label>
      )}

      {/* Stepper Touch Control */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || currentValue <= min}
          className="w-12 h-12 rounded-xl bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-900 font-extrabold flex items-center justify-center border border-stone-300 transition-all disabled:opacity-30 disabled:pointer-events-none touch-manipulation select-none"
          aria-label="Disminuir"
        >
          <Minus className="w-5 h-5 text-stone-800" />
        </button>

        <div className="flex-1 min-w-[90px] h-12 rounded-xl bg-white border-2 border-stone-300 flex items-center justify-center px-3 shadow-inner">
          <input
            type="hidden"
            name={name}
            value={currentValue}
          />
          <span className="text-xl font-black text-stone-900 text-center tracking-tight">
            {currentValue}
            {unit && <span className="text-xs font-bold text-stone-600 ml-1.5">{unit}</span>}
          </span>
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || currentValue >= max}
          className="w-12 h-12 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-extrabold flex items-center justify-center shadow-sm transition-all disabled:opacity-30 disabled:pointer-events-none touch-manipulation select-none"
          aria-label="Aumentar"
        >
          <Plus className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Quick Option Pills */}
      {quickOptions && quickOptions.length > 0 && !disabled && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {quickOptions.map((opt) => (
            <button
              type="button"
              key={opt}
              onClick={() => updateValue(opt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors touch-manipulation border ${
                currentValue === opt
                  ? 'bg-emerald-100 text-emerald-950 border-emerald-400 shadow-sm'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-200'
              }`}
            >
              {opt} {unit}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default TouchNumberStepper;
