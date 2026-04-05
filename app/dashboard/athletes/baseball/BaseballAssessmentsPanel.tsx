'use client';

import { useState, useTransition } from 'react';
import { createBaseballAssessment } from './actions';

type AthleteOption = {
  id: string;
  first_name: string;
  last_name: string;
  team_name: string;
};

export default function BaseballAssessmentsPanel({
  athletes = [],
}: {
  athletes?: AthleteOption[];
}) {
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setMessage('');

    startTransition(async () => {
      const result = await createBaseballAssessment({
        athleteId: String(formData.get('athleteId') || ''),
        assessmentDate: String(formData.get('assessmentDate') || ''),
        bestVerticalIn: String(formData.get('bestVerticalIn') || ''),
        gripL: String(formData.get('gripL') || ''),
        gripR: String(formData.get('gripR') || ''),
        yd60: String(formData.get('yd60') || ''),
        yd40: String(formData.get('yd40') || ''),
        bench: String(formData.get('bench') || ''),
        squat: String(formData.get('squat') || ''),
        trapBarDl: String(formData.get('trapBarDl') || ''),
        sessionNotes: String(formData.get('sessionNotes') || ''),
      });

      setMessage(result?.error ?? 'Baseball assessment added successfully.');
    });
  }

  return (
    <section className="rounded-2xl bg-slate-800/95 border border-slate-600 shadow-2xl p-6 sm:p-8 space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white">
          Add Baseball Assessment
        </h2>
        <p className="mt-2 text-slate-300">
          Add baseball performance data for pitchers and position players.
        </p>
      </div>

      <form action={handleSubmit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <select
          name="athleteId"
          defaultValue=""
          required
          className="rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white"
        >
          <option value="" disabled>
            Select athlete
          </option>
          {athletes.map((athlete) => (
            <option key={athlete.id} value={athlete.id}>
              {athlete.first_name} {athlete.last_name} — {athlete.team_name}
            </option>
          ))}
        </select>

        <input
          name="assessmentDate"
          type="date"
          className="rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white"
        />

        <input
          name="bestVerticalIn"
          placeholder="Best Vertical (in)"
          className="rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white"
        />

        <input
          name="gripL"
          placeholder="Grip Left"
          className="rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white"
        />

        <input
          name="gripR"
          placeholder="Grip Right"
          className="rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white"
        />

        <input
          name="yd60"
          placeholder="60 yd"
          className="rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white"
        />

        <input
          name="yd40"
          placeholder="40 yd"
          className="rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white"
        />

        <input
          name="bench"
          placeholder="Bench"
          className="rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white"
        />

        <input
          name="squat"
          placeholder="Squat"
          className="rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white"
        />

        <input
          name="trapBarDl"
          placeholder="Trap Bar DL"
          className="rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white"
        />

        <textarea
          name="sessionNotes"
          placeholder="Session notes"
          className="md:col-span-2 xl:col-span-3 rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white min-h-[110px]"
        />

        <button
          type="submit"
          disabled={isPending}
          className="md:col-span-2 xl:col-span-3 rounded-xl bg-white px-5 py-3 font-semibold text-slate-800 shadow-lg hover:scale-[1.01] transition"
        >
          {isPending ? 'Saving...' : 'Add Baseball Assessment'}
        </button>
      </form>

      {message && (
        <div className="rounded-xl bg-slate-700 px-4 py-3 text-slate-100">
          {message}
        </div>
      )}
    </section>
  );
}