'use client';

import { useState } from 'react';
import Image from 'next/image';

const PLATES_LBS = [45, 25, 10, 5, 2.5];
const PLATES_KG = [20, 15, 10, 5, 2.5, 1.25];

const PLATE_COLORS: Record<number, string> = {
  45: 'bg-black',
  25: 'bg-red-700',
  20: 'bg-red-700',
  15: 'bg-orange-500',
  10: 'bg-blue-500',
  5: 'bg-green-500',
  2.5: 'bg-yellow-400',
  1.25: 'bg-purple-500',
};

export default function PlateCalculatorPage() {
  const [totalWeight, setTotalWeight] = useState('');
  const [barbellWeight, setBarbellWeight] = useState('45');
  const [unit, setUnit] = useState<'lbs' | 'kg'>('lbs');
  const [plateCounts, setPlateCounts] = useState<number[]>([]);

  const plates = unit === 'lbs' ? PLATES_LBS : PLATES_KG;

  const toggleUnit = () => {
    const nextUnit = unit === 'lbs' ? 'kg' : 'lbs';
    setUnit(nextUnit);
    setBarbellWeight(nextUnit === 'lbs' ? '45' : '20');
    setPlateCounts([]);
  };

  const calculatePlates = () => {
    const bar = parseFloat(barbellWeight);
    const total = parseFloat(totalWeight);
    if (isNaN(bar) || isNaN(total) || total <= bar) return;

    let sideWeight = (total - bar) / 2;
    const counts: number[] = [];

    for (let plate of plates) {
      const count = Math.floor(sideWeight / plate);
      counts.push(count);
      sideWeight -= count * plate;
    }

    setPlateCounts(counts);
  };

  const renderPlates = (reverse = false) => {
    const plateData = plates.map((plate, idx) => ({
      plate,
      count: plateCounts[idx] || 0,
    }));

    const finalData = reverse ? plateData : [...plateData].reverse();

    return finalData.flatMap(({ plate, count }) =>
      Array.from({ length: count }).map((_, i) => (
        <div
          key={`${reverse ? 'R' : 'L'}-${plate}-${i}`}
          className={`w-6 h-20 mx-0.5 rounded-sm flex items-center justify-center text-white text-xs font-bold ${
            PLATE_COLORS[plate] || 'bg-slate-400'
          }`}
        >
          {plate}
        </div>
      ))
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-400 to-slate-700 text-white px-4 py-10 pt-24 mt-5 ">
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

        <h1 className="text-4xl font-bold text-center mt-8 mb-8">Plate Calculator</h1>

        <div className="flex justify-between items-center mb-4">
          <label className="text-lg font-medium">Unit: {unit.toUpperCase()}</label>
          <button
            onClick={toggleUnit}
            className="bg-slate-600 px-4 py-2 rounded-lg border border-white text-sm"
          >
            Switch to {unit === 'lbs' ? 'KG' : 'LBS'}
          </button>
        </div>

        <label className="block mb-1">Target Weight ({unit})</label>
        <input
          type="number"
          value={totalWeight}
          onChange={(e) => setTotalWeight(e.target.value)}
          className="w-full mb-4 px-3 py-2 rounded bg-slate-700 border border-white placeholder-white"
          placeholder={unit === 'lbs' ? 'e.g. 245' : 'e.g. 100'}
        />

        <label className="block mb-1">Barbell Weight ({unit})</label>
        <input
          type="number"
          value={barbellWeight}
          onChange={(e) => setBarbellWeight(e.target.value)}
          className="w-full mb-4 px-3 py-2 rounded bg-slate-700 border border-white placeholder-white"
          placeholder={unit === 'lbs' ? 'e.g. 45' : 'e.g. 20'}
        />

        <button
          onClick={calculatePlates}
          className="w-full bg-slate-800 py-3 rounded-lg text-white font-bold text-lg hover:bg-slate-300 hover:text-slate-800 transition"
        >
          Calculate
        </button>

        {plateCounts.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-semibold mb-4">Plates per side:</h2>

            {plateCounts.map((count, idx) =>
              count > 0 ? (
                <p key={idx} className="text-white mb-1">
                  {count} × {plates[idx]} {unit}
                </p>
              ) : null
            )}

            <div className="flex items-center justify-center mt-6">
              {renderPlates(false)}
              <div className="w-20 h-2 bg-slate-300 mx-4 rounded" />
              {renderPlates(true)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
