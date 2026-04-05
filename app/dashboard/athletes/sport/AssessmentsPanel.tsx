'use client';

import { useState, useTransition } from 'react';
import { createAssessment } from './actions';

type AthleteOption = {
  id: string;
  first_name: string;
  last_name: string;
  team_name: string;
};

export default function AssessmentsPanel({
  athletes = [],
  sport,
}: {
  athletes?: AthleteOption[];
  sport: string;
}) {
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setMessage('');

    startTransition(async () => {
      const result = await createAssessment({
        athleteId: String(formData.get('athleteId') || ''),
        assessmentDate: String(formData.get('assessmentDate') || ''),
        squat: String(formData.get('squat') || ''),
        bench: String(formData.get('bench') || ''),
        clean: String(formData.get('clean') || ''),
        cmj: String(formData.get('cmj') || ''),
        singleLegCmjRight: String(formData.get('singleLegCmjRight') || ''),
        singleLegCmjLeft: String(formData.get('singleLegCmjLeft') || ''),
        sprint20m: String(formData.get('sprint20m') || ''),
        mod505: String(formData.get('mod505') || ''),
      });

      setMessage(result?.error ?? 'Assessment added successfully.');
    });
  }

  return (
    <section className="rounded-2xl bg-slate-800/95 border border-slate-600 shadow-2xl p-6 sm:p-8 space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white">
          Add Assessment
        </h2>
        <p className="mt-2 text-slate-300">
          Add testing data for athletes in {sport}.
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

        <input name="squat" placeholder="Squat" className="rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white" />
        <input name="bench" placeholder="Bench" className="rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white" />
        <input name="clean" placeholder="Clean" className="rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white" />
        <input name="cmj" placeholder="CMJ" className="rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white" />
        <input name="singleLegCmjRight" placeholder="Single Leg CMJ Right" className="rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white" />
        <input name="singleLegCmjLeft" placeholder="Single Leg CMJ Left" className="rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white" />
        <input name="sprint20m" placeholder="20m Sprint" className="rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white" />
        <input name="mod505" placeholder="Mod 505" className="rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white" />

        <button
          type="submit"
          disabled={isPending}
          className="md:col-span-2 xl:col-span-3 rounded-xl bg-white px-5 py-3 font-semibold text-slate-800 shadow-lg hover:scale-[1.01] transition"
        >
          {isPending ? 'Saving...' : 'Add Assessment'}
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