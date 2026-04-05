'use client';

import { useState, useTransition } from 'react';
import { addAssessment } from './actions';

type Athlete = {
  id: string;
  first_name: string;
  last_name: string;
  position: string | null;
  teams: {
    id: string;
    name: string;
  } | null;
};

export default function AddAssessmentForm({ athletes }: { athletes: Athlete[] }) {
  const [message, setMessage] = useState('');
  const [pending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setMessage('');

    startTransition(async () => {
      const result = await addAssessment({
        athleteId: String(formData.get('athleteId') || ''),
        assessmentDate: String(formData.get('assessmentDate') || ''),
        weightLbs: String(formData.get('weightLbs') || ''),
        squatMaxLbs: String(formData.get('squatMaxLbs') || ''),
        benchMaxLbs: String(formData.get('benchMaxLbs') || ''),
        cleanMaxLbs: String(formData.get('cleanMaxLbs') || ''),
        sprint20m: String(formData.get('sprint20m') || ''),
        mod505: String(formData.get('mod505') || ''),
        cmj: String(formData.get('cmj') || ''),
        slCmjRight: String(formData.get('slCmjRight') || ''),
        slCmjLeft: String(formData.get('slCmjLeft') || ''),
        sessionNotes: String(formData.get('sessionNotes') || ''),
      });

      if (result?.error) {
        setMessage(result.error);
        return;
      }

      setMessage(`Assessment added for ${result?.athleteName}.`);
    });
  }

  if (!athletes.length) {
    return (
      <section className="border rounded p-4">
        <h2 className="text-2xl font-semibold mb-2">Add Assessment</h2>
        <p>No athletes found. Add athletes first.</p>
      </section>
    );
  }

  return (
    <section className="border rounded p-4 space-y-4">
      <h2 className="text-2xl font-semibold">Add Assessment</h2>

      <form action={handleSubmit} className="space-y-4">
        <select
          name="athleteId"
          className="w-full border rounded p-3"
          required
          defaultValue=""
        >
          <option value="" disabled>
            Select athlete
          </option>
          {athletes.map((athlete) => (
            <option key={athlete.id} value={athlete.id}>
              {athlete.first_name} {athlete.last_name}
              {athlete.teams ? ` — ${athlete.teams.name}` : ''}
              {athlete.position ? ` — ${athlete.position}` : ''}
            </option>
          ))}
        </select>

        <input
          name="assessmentDate"
          type="date"
          className="w-full border rounded p-3"
          defaultValue={new Date().toISOString().slice(0, 10)}
        />

        <input
          name="weightLbs"
          type="number"
          step="0.01"
          placeholder="Weight (lbs)"
          className="w-full border rounded p-3"
        />

        <input
          name="squatMaxLbs"
          type="number"
          step="0.01"
          placeholder="Squat Max (lbs)"
          className="w-full border rounded p-3"
        />

        <input
          name="benchMaxLbs"
          type="number"
          step="0.01"
          placeholder="Bench Max (lbs)"
          className="w-full border rounded p-3"
        />

        <input
          name="cleanMaxLbs"
          type="number"
          step="0.01"
          placeholder="Clean Max (lbs)"
          className="w-full border rounded p-3"
        />

        <input
          name="sprint20m"
          type="number"
          step="0.001"
          placeholder="20m Sprint"
          className="w-full border rounded p-3"
        />

        <input
          name="mod505"
          type="number"
          step="0.001"
          placeholder="Mod 505"
          className="w-full border rounded p-3"
        />

        <input
          name="cmj"
          type="number"
          step="0.01"
          placeholder="CMJ"
          className="w-full border rounded p-3"
        />

        <input
          name="slCmjRight"
          type="number"
          step="0.01"
          placeholder="Single Leg CMJ Right"
          className="w-full border rounded p-3"
        />

        <input
          name="slCmjLeft"
          type="number"
          step="0.01"
          placeholder="Single Leg CMJ Left"
          className="w-full border rounded p-3"
        />

        <textarea
          name="sessionNotes"
          placeholder="Session notes"
          className="w-full border rounded p-3 min-h-[120px]"
        />

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-slate-800 text-white rounded p-3"
        >
          {pending ? 'Adding assessment...' : 'Add Assessment'}
        </button>
      </form>

      {message && <p>{message}</p>}
    </section>
  );
}