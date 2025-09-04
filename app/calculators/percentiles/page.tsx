'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// Rep mapping for key percents
const PERCENT_REPS: Record<number, number> = {
  97: 1,
  95: 2,
  92: 3,
  90: 4,
  87: 5,
  85: 6,
  82: 7,
  80: 8,
  77: 9,
  75: 10,
  72: 11,
  70: 12,
  67: 15,
  65: 20,
};

// Extra lower percents (no reps shown)
const EXTRA_PERCENTS = [62, 60, 57, 55, 52, 50];

// Full percent list (descending)
const PERCENTAGES = [...Object.keys(PERCENT_REPS).map(Number), ...EXTRA_PERCENTS].sort(
  (a, b) => b - a
);

function buildWeights(start = 60, end = 700, step = 5): number[] {
  const arr: number[] = [];
  for (let w = start; w <= end; w += step) arr.push(w);
  return arr;
}

// Round to nearest 5 or 0
function roundTo5(num: number): number {
  return Math.round(num / 5) * 5;
}

export default function PercentilesPage() {
  const router = useRouter();
  const weights = useMemo(() => buildWeights(60, 700, 5), []);

  // --- Quick Finder state ---
  const [oneRepMax, setOneRepMax] = useState<string>('');
  const [percent, setPercent] = useState<number>(95); // default 95%

  const targetWeight = useMemo(() => {
    const max = parseFloat(oneRepMax);
    if (Number.isNaN(max) || max <= 0) return '';
    return String(roundTo5((max * percent) / 100));
  }, [oneRepMax, percent]);

  const handleRedirect = () => {
    if (!targetWeight) return;
    router.push(`/calculators/plate?target=${targetWeight}`);
  };

  const csv = useMemo(() => {
    const header = ['Weight (lb)', ...PERCENTAGES.map(p => {
      const reps = PERCENT_REPS[p];
      return reps ? `${p}% (${reps} reps)` : `${p}%`;
    })];

    const rows = weights.map(w => [
      w.toString(),
      ...PERCENTAGES.map(p => roundTo5((w * p) / 100).toString()),
    ]);

    const lines = [header, ...rows].map(r =>
      r
        .map(cell => {
          const needsQuotes = /[",\n]/.test(cell);
          const safe = cell.replace(/"/g, '""');
          return needsQuotes ? `"${safe}"` : safe;
        })
        .join(',')
    );
    return lines.join('\n');
  }, [weights]);

  const handleCopyCsv = async () => {
    try {
      await navigator.clipboard.writeText(csv);
      alert('CSV copied to clipboard.');
    } catch {
      alert('Copy failed. Try the download option.');
    }
  };

  const handleDownloadCsv = () => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'weight_percentiles_reps.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-400 to-slate-700 text-white px-4 py-10 pt-24 mt-5">
      <div className="max-w-6xl mx-auto">
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

        <h1 className="text-4xl font-bold text-center mb-6">
          Weight Percentiles with Rep Ranges (60–700 lb)
        </h1>

        {/* --- Quick Finder Card --- */}
        <div className="bg-slate-800/70 border border-white/20 rounded-xl p-4 mb-8 max-w-3xl mx-auto shadow-xl">
          <h2 className="text-2xl font-semibold mb-3 text-center">Quick Finder</h2>
          <p className="text-sm text-slate-200 mb-4 text-center">
            Enter 1RM and select a percentage to get the rounded target weight (ends with 0 or 5).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block mb-1">1RM Max (lb)</label>
              <input
                type="number"
                min={1}
                value={oneRepMax}
                onChange={(e) => setOneRepMax(e.target.value)}
                className="w-full px-3 py-2 rounded bg-slate-700 border border-white placeholder-white"
                placeholder="e.g. 315"
              />
            </div>
            <div>
              <label className="block mb-1">Percentage</label>
              <select
                value={percent}
                onChange={(e) => setPercent(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded bg-slate-700 border border-white"
              >
                {PERCENTAGES.map(p => (
                  <option key={p} value={p}>
                    {p}%{PERCENT_REPS[p] ? ` (${PERCENT_REPS[p]} reps)` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1">Target Weight (lb)</label>
              <input
                type="text"
                value={targetWeight}
                readOnly
                className="w-full px-3 py-2 rounded bg-slate-900 border border-white/50 text-center font-semibold"
                placeholder="—"
              />
            </div>
          </div>
          <div className="flex justify-center">
            <button
              onClick={handleRedirect}
              disabled={!targetWeight}
              className="bg-slate-600 hover:bg-slate-300 hover:text-slate-900 transition px-6 py-2 rounded-lg border border-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Go to Plate Calculator →
            </button>
          </div>
        </div>

        {/* CSV Actions */}
        <div className="flex gap-3 justify-center mb-6">
          <button
            onClick={handleCopyCsv}
            className="bg-slate-800 hover:bg-slate-300 hover:text-slate-900 transition px-4 py-2 rounded-lg border border-white text-sm"
          >
            Copy CSV
          </button>
          <button
            onClick={handleDownloadCsv}
            className="bg-slate-800 hover:bg-slate-300 hover:text-slate-900 transition px-4 py-2 rounded-lg border border-white text-sm"
          >
            Download CSV
          </button>
        </div>

        {/* Table */}
        <div className="rounded-xl shadow-2xl overflow-hidden border border-white/20">
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-sm">
              <thead className="bg-slate-900 sticky top-0">
                <tr>
                  <th className="px-3 py-3 text-left font-semibold border-b border-white/10">
                    Weight (lb)
                  </th>
                  {PERCENTAGES.map(p => (
                    <th
                      key={p}
                      className="px-2 py-3 text-right font-semibold border-b border-white/10"
                    >
                      {p}%{' '}
                      {PERCENT_REPS[p] && (
                        <span className="block text-xs font-normal text-slate-300">
                          {PERCENT_REPS[p]} reps
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-slate-800/60">
                {weights.map((w, i) => (
                  <tr key={w} className={i % 2 === 0 ? 'bg-slate-800/40' : ''}>
                    <td className="px-3 py-2 font-medium border-b border-white/5">{w}</td>
                    {PERCENTAGES.map(p => (
                      <td
                        key={`${w}-${p}`}
                        className="px-2 py-2 text-right tabular-nums border-b border-white/5"
                      >
                        {roundTo5((w * p) / 100)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td
                    colSpan={PERCENTAGES.length + 1}
                    className="px-3 py-3 text-center text-slate-200 bg-slate-900"
                  >
                    Values rounded to nearest 5 lb increment.
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <p className="text-xs text-center mt-4 text-slate-200">
          Tip: Use the CSV with Excel/Sheets to highlight exact targets for athletes.
        </p>
      </div>
    </div>
  );
}
