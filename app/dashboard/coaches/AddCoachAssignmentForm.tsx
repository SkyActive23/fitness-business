'use client';

import { useState, useTransition } from 'react';
import { addCoachAssignment } from './actions';

type CoachOption = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
};

type TeamOption = {
  id: string;
  name: string;
  school: string;
  sport: string | null;
};

type CoachRole = 'admin' | 'head' | 'assistant';

export default function AddCoachAssignmentForm({
  coaches,
  teams,
}: {
  coaches: CoachOption[];
  teams: TeamOption[];
}) {
  const [message, setMessage] = useState('');
  const [pending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setMessage('');

    startTransition(async () => {
      const result = await addCoachAssignment({
        coachId: String(formData.get('coachId') || ''),
        teamId: String(formData.get('teamId') || ''),
        role: String(formData.get('role') || 'assistant') as CoachRole,
      });

      if (result?.error) {
        setMessage(result.error);
        return;
      }

      setMessage('Coach linked to team successfully.');
    });
  }

  return (
    <section className="w-full bg-slate-800 rounded-lg py-8 px-4 sm:px-8 shadow-xl space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white">
          Link Coach to Team
        </h2>
        <p className="mt-2 text-slate-200">
          Choose a coach, choose a team, choose a role, and save it to the backend.
        </p>
      </div>

      <form action={handleSubmit} className="grid gap-4 md:grid-cols-3">
        <select
          name="coachId"
          required
          defaultValue=""
          className="bg-slate-600 border border-slate-500 px-3 py-2 rounded text-white"
        >
          <option value="" disabled>
            Select coach
          </option>
          {coaches.map((coach) => (
            <option key={coach.id} value={coach.id}>
              {coach.first_name} {coach.last_name} — {coach.email}
            </option>
          ))}
        </select>

        <select
          name="teamId"
          required
          defaultValue=""
          className="bg-slate-600 border border-slate-500 px-3 py-2 rounded text-white"
        >
          <option value="" disabled>
            Select team / sport
          </option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.sport || 'No Sport'} — {team.name}
            </option>
          ))}
        </select>

        <select
          name="role"
          defaultValue="assistant"
          className="bg-slate-600 border border-slate-500 px-3 py-2 rounded text-white"
        >
          <option value="assistant">Assistant Coach</option>
          <option value="head">Head Coach</option>
          <option value="admin">Admin</option>
        </select>

        <button
          type="submit"
          disabled={pending}
          className="md:col-span-3 bg-white text-slate-800 font-semibold px-4 py-2 rounded-lg shadow hover:scale-105 transition"
        >
          {pending ? 'Linking...' : 'Link Coach to Team'}
        </button>
      </form>

      {message && <p className="text-slate-200">{message}</p>}
    </section>
  );
}