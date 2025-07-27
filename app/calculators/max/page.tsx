'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function MaxCalculatorPage() {
  const [unit, setUnit] = useState<'lbs' | 'kg'>('lbs');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [max, setMax] = useState<number | null>(null);

  const toggleUnit = () => {
    const next = unit === 'lbs' ? 'kg' : 'lbs';
    setUnit(next);
    setWeight('');
    setReps('');
    setMax(null);
  };

  const calculateMax = () => {
    const w = parseFloat(weight);
    const r = parseInt(reps);
    if (isNaN(w) || isNaN(r) || r <= 0) return;
    const oneRepMax = w * (1 + r / 30);
    const rounded = Math.round(oneRepMax / 5) * 5;
    setMax(rounded);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-400 to-slate-700 text-white px-4 py-10 mt-5 pt-24">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-center mb-8">
            <div className="w-full max-w-md aspect-[4/3] bg-slate-800 rounded-lg shadow-2xl flex items-center justify-center p-6">
                <Image
                src="/images/logos/logoFT.png"
                alt="FineTuned Logo"
                width={250}
                height={250}
                className="object-contain"
                />
            </div>
        </div>

        <hr className="border-t border-4 rounded-full border-slate-200 w-4/5 mx-auto my-12" />

        <h1 className="text-4xl font-bold text-center mt-8 mb-8">1-Rep Max Calculator</h1>

        <div className="flex justify-between items-center mb-4">
          <label className="text-lg font-medium">Unit: {unit.toUpperCase()}</label>
          <button
            onClick={toggleUnit}
            className="bg-slate-600 px-4 py-2 rounded-lg border border-white text-sm"
          >
            Switch to {unit === 'lbs' ? 'KG' : 'LBS'}
          </button>
        </div>

        <label className="block mb-1">Weight Lifted ({unit}):</label>
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="w-full mb-4 px-3 py-2 rounded bg-slate-700 border border-white placeholder-white"
          placeholder={unit === 'lbs' ? 'e.g. 225' : 'e.g. 100'}
        />

        <label className="block mb-1">Repetitions Performed:</label>
        <input
          type="number"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          className="w-full mb-4 px-3 py-2 rounded bg-slate-700 border border-white placeholder-white"
          placeholder="e.g. 5"
        />

        <button
          onClick={calculateMax}
          className="w-full bg-slate-800 py-3 rounded-lg text-white font-bold text-lg hover:bg-slate-300 hover:text-slate-800 transition"
        >
          Calculate 1RM
        </button>

        {max !== null && (
          <p className="text-2xl font-semibold text-center mt-8 mb-4">
            Estimated 1RM: {max} {unit}
          </p>
        )}
      </div>
    </div>
  );
}
