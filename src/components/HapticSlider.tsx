'use client';
import { useState } from 'react';

interface HapticSliderProps {
  label?: string;
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export default function HapticSlider({
  label = 'Total Budget',
  value: externalValue,
  onChange,
  min = 500,
  max = 50000,
  step = 100
}: HapticSliderProps) {
  const [internalBudget, setInternalBudget] = useState(externalValue || 1500);
  const budget = externalValue !== undefined ? externalValue : internalBudget;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);

    // Only trigger haptics if value actually changed
    if (newValue !== budget) {
      // Update internal state if uncontrolled
      if (externalValue === undefined) {
        setInternalBudget(newValue);
      }

      // Call external onChange if provided
      onChange?.(newValue);

      // The "Tick" Effect: 5ms vibration
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(5);
      }
    }
  };

  return (
    <div className="w-full rounded-3xl bg-gray-900 p-6 text-white shadow-xl">
      <div className="mb-6 flex items-end justify-between">
        <span className="text-sm font-bold text-gray-400">{label}</span>
        <span className="text-3xl font-black text-green-400">
          ${budget.toLocaleString()}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={budget}
        onChange={handleChange}
        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 accent-green-500 hover:accent-green-400"
        style={{
          WebkitAppearance: 'none', // Needed for Chrome/Safari custom styling
        }}
      />

      <div className="mt-2 flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest">
        <span>Budget</span>
        <span>Luxury</span>
      </div>
    </div>
  );
}