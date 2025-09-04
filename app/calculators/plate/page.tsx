'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';

const PLATES_LBS_BASE = [45, 25, 10, 5, 2.5] as const;
const PLATES_KG = [20, 15, 10, 5, 2.5, 1.25] as const;

const PLATE_COLORS: Record<number, string> = {
  100: 'bg-zinc-900', // 100 lb plate
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
  const searchParams = useSearchParams();

  const [totalWeight, setTotalWeight] = useState('');
  const [barbellWeight, setBarbellWeight] = useState('45');
  const [unit, setUnit] = useState<'lbs' | 'kg'>('lbs');

  const [plateCounts, setPlateCounts] = useState<number[]>([]);
  const [unloadableRemainder, setUnloadableRemainder] = useState<number>(0);

  // 100 lb plate controls
  const [useHundreds, setUseHundreds] = useState<boolean>(false);
  const [hundredsAvailable, setHundredsAvailable] = useState<number>(0); // total across bar

  // Internal flag to auto-run calculate when ?calc=1 is present
  const [autoCalc, setAutoCalc] = useState(false);

  // Build plate list from state
  const plates: number[] = useMemo(() => {
    if (unit === 'lbs') {
      return useHundreds && hundredsAvailable > 0
        ? [100, ...PLATES_LBS_BASE]
        : [...PLATES_LBS_BASE];
    }
    return [...PLATES_KG];
  }, [unit, useHundreds, hundredsAvailable]);

  const toggleUnit = () => {
    const nextUnit = unit === 'lbs' ? 'kg' : 'lbs';
    setUnit(nextUnit);
    setBarbellWeight(nextUnit === 'lbs' ? '45' : '20');
    setPlateCounts([]);
    setUnloadableRemainder(0);

    // 100s only apply in lbs
    if (nextUnit === 'kg') {
      setUseHundreds(false);
      setHundredsAvailable(0);
    }
  };

  const calculatePlates = () => {
    const bar = parseFloat(barbellWeight);
    const total = parseFloat(totalWeight);
    if (isNaN(bar) || isNaN(total) || total <= bar) {
      setPlateCounts([]);
      setUnloadableRemainder(0);
      return;
    }

    // If toggle is on but user didn't specify a valid number, treat as 0 available
    const maxHundredsPerSide =
      unit === 'lbs' && useHundreds ? Math.floor(Math.max(0, hundredsAvailable) / 2) : 0;

    let sideWeight = (total - bar) / 2;
    const counts: number[] = [];

    for (const plate of plates) {
      let count = Math.floor(sideWeight / plate);

      // Cap 100 lb usage per side
      if (unit === 'lbs' && plate === 100) {
        count = Math.min(count, maxHundredsPerSide);
      }

      counts.push(count);
      sideWeight -= count * plate;
    }

    // Clean tiny float residue
    const epsilon = 0.0001;
    const remainder = Math.abs(sideWeight) < epsilon ? 0 : parseFloat(sideWeight.toFixed(2));

    setPlateCounts(counts);
    setUnloadableRemainder(remainder);
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

  const hundredIndex = plates.indexOf(100);
  const usedHundredsPerSide = hundredIndex >= 0 ? (plateCounts[hundredIndex] || 0) : 0;
  const maxHundredsPerSide = unit === 'lbs' && useHundreds ? Math.floor(hundredsAvailable / 2) : 0;
  const cappedByHundreds =
    unit === 'lbs' &&
    useHundreds &&
    hundredIndex >= 0 &&
    maxHundredsPerSide > 0 &&
    usedHundredsPerSide === maxHundredsPerSide;

  // --- Read query params on mount ---
  useEffect(() => {
    const t = searchParams.get('target');
    const u = (searchParams.get('unit') || '').toLowerCase();
    const c = searchParams.get('calc');

    if (u === 'lbs' || u === 'kg') {
      setUnit(u as 'lbs' | 'kg');
      setBarbellWeight(u === 'lbs' ? '45' : '20');
      if (u === 'kg') {
        setUseHundreds(false);
        setHundredsAvailable(0);
      }
    }

    if (t) {
      setTotalWeight(t);
    }

    // Only auto-calc if explicitly requested
    if (c === '1') {
      setAutoCalc(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-calc when requested and we have a target
  useEffect(() => {
    if (autoCalc && totalWeight) {
      calculatePlates();
      setAutoCalc(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCalc, totalWeight, unit, barbellWeight, useHundreds, hundredsAvailable]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-400 to-slate-700 text-white px-4 py-10 pt-24 mt-5 ">
      <div className="max-w-3xl mx-auto">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-full max-w-md aspect-[4/3] bg-slate-800 rounded-lg shadow-2xl flex items-center justify-center p-6">
            <Image
              src="/images/logos/logoFT.png"
              alt="FineTuned Logo"
              width={250}
              height={250}
              className="object-contain"
              priority
            />
          </div>
        </div>

        <hr className="border-t border-4 rounded-full border-slate-200 w-4/5 mx-auto my-12" />

        <h1 className="text-4xl font-bold text-center mt-8 mb-8">Plate Calculator</h1>

        {/* Unit switch */}
        <div className="flex justify-between items-center mb-4">
          <label className="text-lg font-medium">Unit: {unit.toUpperCase()}</label>
          <button
            onClick={toggleUnit}
            className="bg-slate-600 px-4 py-2 rounded-lg border border-white text-sm"
          >
            Switch to {unit === 'lbs' ? 'KG' : 'LBS'}
          </button>
        </div>

        {/* 100 lb toggle + availability (LBS only) */}
        {unit === 'lbs' && (
          <div className="mb-4 space-y-2">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={useHundreds}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setUseHundreds(checked);
                  if (!checked) setHundredsAvailable(0);
                  setPlateCounts([]);
                  setUnloadableRemainder(0);
                }}
                className="w-4 h-4 accent-slate-200 cursor-pointer"
              />
              <span>Use 100 lb plates</span>
            </label>

            {useHundreds && (
              <div>
                <label className="block mb-1">Available 100 lb Plates (total across the bar)</label>
                <input
                  type="number"
                  min={0}
                  value={Number.isNaN(hundredsAvailable) ? 0 : hundredsAvailable}
                  onChange={(e) => {
                    const val = Math.max(0, Math.floor(Number(e.target.value) || 0));
                    setHundredsAvailable(val);
                    setPlateCounts([]);
                    setUnloadableRemainder(0);
                  }}
                  className="w-full px-3 py-2 rounded bg-slate-700 border border-white placeholder-white"
                  placeholder="e.g. 2 or 4"
                />
                <p className="text-sm text-slate-200 mt-1">
                  We’ll use up to <span className="font-semibold">{Math.floor(hundredsAvailable / 2)}</span> per side.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Inputs */}
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

        {/* Calculate */}
        <button
          onClick={calculatePlates}
          className="w-full bg-slate-800 py-3 rounded-lg text-white font-bold text-lg hover:bg-slate-300 hover:text-slate-800 transition"
        >
          Calculate
        </button>

        {/* Results */}
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

            {/* Feedback messages */}
            {unit === 'lbs' && useHundreds && hundredIndex >= 0 && hundredsAvailable > 0 && (
              <p className="mt-2 text-sm text-slate-200">
                Using <span className="font-semibold">{usedHundredsPerSide}</span> × 100 lb per side
                {cappedByHundreds && ` (capped by availability of ${maxHundredsPerSide} per side).`}
              </p>
            )}

            {unloadableRemainder > 0 && (
              <p className="mt-2 text-sm text-yellow-200">
                Remaining per side not loadable with available plates: {unloadableRemainder} {unit}
              </p>
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
