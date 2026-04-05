'use client';

import { useState, useTransition } from 'react';
import { updateCoach } from './actions';

type CoachOption = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
};

export default function EditCoachInfoForm({
  coaches,
}: {
  coaches: CoachOption[];
}) {
  const [selectedCoachId, setSelectedCoachId] = useState(coaches[0]?.id ?? '');
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  const selectedCoach =
    coaches.find((coach) => coach.id === selectedCoachId) ?? coaches[0];

  async function handleSubmit(formData: FormData) {
    setMessage('');

    startTransition(async () => {
      const result = await updateCoach({
        coachId: String(formData.get('coachId') || ''),
        firstName: String(formData.get('firstName') || ''),
        lastName: String(formData.get('lastName') || ''),
        email: String(formData.get('email') || ''),
      });

      if (result?.error) {
        setMessage(result.error);
        return;
      }

      setMessage('Coach updated successfully.');
    });
  }

  if (!coaches.length || !selectedCoach) {
    return (
      <section className="w-full bg-slate-800 rounded-lg py-8 px-4 sm:px-8 shadow-xl">
        <p className="text-slate-200">No coaches found.</p>
      </section>
    );
  }

  return (
    <section className="w-full bg-slate-800 rounded-lg py-8 px-4 sm:px-8 shadow-xl space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white">
          Edit Existing Coach
        </h2>
        <p className="mt-2 text-slate-200">
          Update coach information for coaches already in the system.
        </p>
      </div>

      <div className="space-y-4">
        <select
          value={selectedCoachId}
          onChange={(e) => setSelectedCoachId(e.target.value)}
          className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
        >
          {coaches.map((coach) => (
            <option key={coach.id} value={coach.id}>
              {coach.first_name} {coach.last_name} — {coach.email}
            </option>
          ))}
        </select>

        <form action={handleSubmit} className="grid gap-4 md:grid-cols-3">
          <input type="hidden" name="coachId" value={selectedCoach.id} />

          <input
            name="firstName"
            defaultValue={selectedCoach.first_name}
            key={`${selectedCoach.id}-first`}
            className="rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
            placeholder="First name"
            required
          />

          <input
            name="lastName"
            defaultValue={selectedCoach.last_name}
            key={`${selectedCoach.id}-last`}
            className="rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
            placeholder="Last name"
            required
          />

          <input
            name="email"
            type="email"
            defaultValue={selectedCoach.email}
            key={`${selectedCoach.id}-email`}
            className="rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
            placeholder="Email"
            required
          />

          <button
            type="submit"
            disabled={isPending}
            className="md:col-span-3 bg-white text-slate-800 font-semibold px-5 py-3 rounded-lg shadow hover:scale-105 active:scale-95 transition-transform"
          >
            {isPending ? 'Saving...' : 'Save Coach Info'}
          </button>
        </form>
      </div>

      {message && <p className="text-slate-200">{message}</p>}
    </section>
  );
}