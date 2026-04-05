'use client';

import { useState, useTransition } from 'react';
import { addAthlete } from './actions';

type Team = {
  id: string;
  name: string;
  school: string;
  sport: string;
};

const sports = [
  "Women's Soccer",
  "Men's Soccer",
  'Baseball',
  'Softball',
  'Volleyball',
  'Track',
  'Basketball',
];

export default function AddAthleteForm({ teams }: { teams: Team[] }) {
  const [message, setMessage] = useState('');
  const [pending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setMessage('');

    startTransition(async () => {
      const result = await addAthlete({
        teamId: String(formData.get('teamId') || ''),
        firstName: String(formData.get('firstName') || ''),
        lastName: String(formData.get('lastName') || ''),
        school: String(formData.get('school') || ''),
        position: String(formData.get('position') || ''),
        heightIn: String(formData.get('heightIn') || ''),
        sport: String(formData.get('sport') || ''),
      });

      if (result?.error) {
        setMessage(result.error);
        return;
      }

      setMessage('Athlete added successfully.');
    });
  }

  if (!teams.length) {
    return (
      <section className="border rounded p-4">
        <h2 className="text-2xl font-semibold mb-2">Add Athlete</h2>
        <p>No teams found for this sport.</p>
      </section>
    );
  }

  return (
    <section className="border rounded p-4 space-y-4 bg-white">
      <h2 className="text-2xl font-semibold">Add Athlete</h2>

      <form action={handleSubmit} className="space-y-4">
        <select
          name="teamId"
          className="w-full border rounded p-3"
          required
          defaultValue=""
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
          name="sport"
          className="w-full border rounded p-3"
          required
          defaultValue=""
        >
          <option value="" disabled>
            Select sport
          </option>
          {sports.map((sport) => (
            <option key={sport} value={sport}>
              {sport}
            </option>
          ))}
        </select>

        <input
          name="firstName"
          type="text"
          placeholder="First name"
          className="w-full border rounded p-3"
          required
        />

        <input
          name="lastName"
          type="text"
          placeholder="Last name"
          className="w-full border rounded p-3"
          required
        />

        <input
          name="school"
          type="text"
          placeholder="School"
          className="w-full border rounded p-3"
        />

        <input
          name="position"
          type="text"
          placeholder="Position"
          className="w-full border rounded p-3"
        />

        <input
          name="heightIn"
          type="number"
          step="0.01"
          placeholder="Height (inches)"
          className="w-full border rounded p-3"
        />

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-slate-800 text-white rounded p-3"
        >
          {pending ? 'Adding athlete...' : 'Add Athlete'}
        </button>
      </form>

      {message && <p>{message}</p>}
    </section>
  );
}