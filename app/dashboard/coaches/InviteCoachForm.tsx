'use client';

import { useState, useTransition } from 'react';
import { inviteCoach } from './actions';

type Team = {
  id: string;
  name: string;
  school: string;
};

export default function InviteCoachForm({ teams }: { teams: Team[] }) {
  const [message, setMessage] = useState('');
  const [pending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setMessage('');

    startTransition(async () => {
      const result = await inviteCoach({
        firstName: String(formData.get('firstName') || ''),
        lastName: String(formData.get('lastName') || ''),
        email: String(formData.get('email') || ''),
        role: String(formData.get('role') || 'assistant') as 'head' | 'assistant',
        teamId: String(formData.get('teamId') || ''),
      });

      if (result?.error) {
        setMessage(result.error);
        return;
      }

      setMessage(result?.message || 'Coach invite processed.');
    });
  }

  return (
    <section className="w-full bg-slate-800 rounded-lg py-8 px-4 sm:px-8 shadow-xl space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white">
          Add / Invite Coach
        </h2>
        <p className="mt-2 text-slate-200">
          Link an existing coach by email, or tell a new coach to sign up with your team join code.
        </p>
      </div>

      <form action={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <input
          name="firstName"
          type="text"
          placeholder="First name"
          className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
          required
        />

        <input
          name="lastName"
          type="text"
          placeholder="Last name"
          className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
          required
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white md:col-span-2"
          required
        />

        <select
          name="teamId"
          className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
          defaultValue=""
          required
        >
          <option value="" disabled>
            Select team
          </option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name} — {team.school}
            </option>
          ))}
        </select>

        <select
          name="role"
          className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
          defaultValue="assistant"
          required
        >
          <option value="assistant">Assistant Coach</option>
          <option value="head">Head Coach</option>
        </select>

        <button
          type="submit"
          disabled={pending}
          className="md:col-span-2 bg-white text-slate-800 font-semibold px-5 py-3 rounded-lg shadow hover:scale-105 active:scale-95 transition-transform"
        >
          {pending ? 'Processing...' : 'Add / Invite Coach'}
        </button>
      </form>

      {message && <p className="text-slate-200">{message}</p>}
    </section>
  );
}