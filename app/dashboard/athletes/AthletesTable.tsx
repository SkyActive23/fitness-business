'use client';

import { useState, useTransition } from 'react';
import { createAthlete, updateAthlete, deleteAthlete } from './actions';

type TeamOption = {
  id: string;
  team_name: string;
  sport: string;
  school_name: string;
  title?: string;
};

type AthleteRow = {
  id: string;
  first_name: string;
  last_name: string;
  height: string | null;
  weight: number | null;
  position: string | null;
  team_id: string;
  team_name: string;
  sport: string;
  school_name: string;
};

type AthleteGroup = {
  key: string;
  school_name: string;
  team_name: string;
  sport: string;
  team_id: string;
  athletes: AthleteRow[];
};

function CellInput({
  name,
  defaultValue,
  type = 'text',
}: {
  name: string;
  defaultValue: string | number;
  type?: string;
}) {
  return (
    <input
      name={name}
      type={type}
      defaultValue={defaultValue}
      className="w-full min-w-0 rounded-lg border border-slate-500 bg-slate-700 px-3 py-2 text-white outline-none focus:border-white"
    />
  );
}

export default function AthletesTable({
  teams = [],
  athletes = [],
}: {
  teams?: TeamOption[];
  athletes?: AthleteRow[];
}) {
  const [message, setMessage] = useState('');
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const groupedAthletes: AthleteGroup[] = Object.values(
    athletes.reduce((acc, athlete) => {
      const key = `${athlete.school_name}__${athlete.team_name}__${athlete.sport}`;

      if (!acc[key]) {
        acc[key] = {
          key,
          school_name: athlete.school_name,
          team_name: athlete.team_name,
          sport: athlete.sport,
          team_id: athlete.team_id,
          athletes: [],
        };
      }

      acc[key].athletes.push(athlete);
      return acc;
    }, {} as Record<string, AthleteGroup>)
  );

  async function handleCreate(formData: FormData) {
    setPendingKey('create');
    setMessage('');

    startTransition(async () => {
      const result = await createAthlete({
        teamId: String(formData.get('teamId') || ''),
        firstName: String(formData.get('firstName') || ''),
        lastName: String(formData.get('lastName') || ''),
        height: String(formData.get('height') || ''),
        weight: String(formData.get('weight') || ''),
        position: String(formData.get('position') || ''),
      });

      setMessage(result?.error ?? 'Athlete added successfully.');
      setPendingKey(null);
    });
  }

  async function handleUpdate(formData: FormData) {
    const athleteId = String(formData.get('athleteId') || '');
    setPendingKey(`update-${athleteId}`);
    setMessage('');

    startTransition(async () => {
      const result = await updateAthlete({
        athleteId,
        firstName: String(formData.get('firstName') || ''),
        lastName: String(formData.get('lastName') || ''),
        height: String(formData.get('height') || ''),
        weight: String(formData.get('weight') || ''),
        position: String(formData.get('position') || ''),
      });

      setMessage(result?.error ?? 'Athlete updated successfully.');
      setPendingKey(null);
    });
  }

  async function handleDelete(formData: FormData) {
    const athleteId = String(formData.get('athleteId') || '');
    setPendingKey(`delete-${athleteId}`);
    setMessage('');

    startTransition(async () => {
      const result = await deleteAthlete({ athleteId });
      setMessage(result?.error ?? 'Athlete removed successfully.');
      setPendingKey(null);
    });
  }

  return (
    <section className="w-full space-y-8">
      <section className="rounded-2xl bg-slate-800/95 border border-slate-600 shadow-2xl p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Athlete Roster</h2>
          <p className="mt-2 text-slate-300">
            Add and manage roster information for athletes.
          </p>
        </div>

        <form action={handleCreate} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <select
            name="teamId"
            defaultValue=""
            required
            className="rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white outline-none focus:border-white"
          >
            <option value="" disabled>
              Select team / sport
            </option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.school_name} — {team.team_name} — {team.sport}
              </option>
            ))}
          </select>

          <input
            name="firstName"
            placeholder="First name"
            required
            className="rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white placeholder:text-slate-300 outline-none focus:border-white"
          />

          <input
            name="lastName"
            placeholder="Last name"
            required
            className="rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white placeholder:text-slate-300 outline-none focus:border-white"
          />

          <input
            name="position"
            placeholder="Position"
            className="rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white placeholder:text-slate-300 outline-none focus:border-white"
          />

          <input
            name="height"
            placeholder="Height"
            className="rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white placeholder:text-slate-300 outline-none focus:border-white"
          />

          <input
            name="weight"
            placeholder="Weight"
            className="rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white placeholder:text-slate-300 outline-none focus:border-white"
          />

          <button
            type="submit"
            disabled={isPending && pendingKey === 'create'}
            className="md:col-span-2 xl:col-span-3 rounded-xl bg-white px-5 py-3 font-semibold text-slate-800 shadow-lg hover:scale-[1.01] active:scale-[0.99] transition"
          >
            {isPending && pendingKey === 'create' ? 'Adding...' : 'Add Athlete'}
          </button>
        </form>
      </section>

      {message && (
        <div className="rounded-xl bg-slate-800 border border-slate-600 px-4 py-3 text-slate-100 shadow-lg">
          {message}
        </div>
      )}

      {!groupedAthletes.length ? (
        <section className="rounded-2xl bg-slate-800/95 border border-slate-600 shadow-2xl p-8 text-center">
          <h3 className="text-xl font-bold text-white">No athletes yet</h3>
          <p className="mt-2 text-slate-300">
            Once you add athletes, they will show up here by team and sport.
          </p>
        </section>
      ) : (
        <div className="space-y-8">
          {groupedAthletes.map((group) => (
            <section
              key={group.key}
              className="rounded-2xl bg-slate-800/95 border border-slate-600 shadow-2xl overflow-hidden"
            >
              <div className="flex flex-wrap gap-2 px-6 py-5 bg-slate-800 border-b border-slate-600">
                <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-800">
                  {group.school_name}
                </span>
                <span className="rounded-full bg-slate-600 px-3 py-1 text-sm font-semibold text-white">
                  {group.team_name}
                </span>
                <span className="rounded-full bg-slate-500 px-3 py-1 text-sm font-semibold text-white">
                  {group.sport}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full table-auto text-sm text-white">
                  <thead className="bg-slate-900">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">First Name</th>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Last Name</th>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Position</th>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Height</th>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Weight</th>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.athletes.map((athlete, index) => (
                      <tr
                        key={athlete.id}
                        className={index % 2 === 0 ? 'bg-slate-700' : 'bg-slate-600'}
                      >
                        <td colSpan={6} className="p-0">
                          <form action={handleUpdate}>
                            <input type="hidden" name="athleteId" value={athlete.id} />
                            <table className="min-w-full table-auto text-sm text-white">
                              <tbody>
                                <tr>
                                  <td className="px-4 py-3 align-middle">
                                    <CellInput name="firstName" defaultValue={athlete.first_name} />
                                  </td>
                                  <td className="px-4 py-3 align-middle">
                                    <CellInput name="lastName" defaultValue={athlete.last_name} />
                                  </td>
                                  <td className="px-4 py-3 align-middle">
                                    <CellInput name="position" defaultValue={athlete.position ?? ''} />
                                  </td>
                                  <td className="px-4 py-3 align-middle">
                                    <CellInput name="height" defaultValue={athlete.height ?? ''} />
                                  </td>
                                  <td className="px-4 py-3 align-middle">
                                    <CellInput name="weight" defaultValue={athlete.weight ?? ''} />
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap align-middle">
                                    <button
                                      type="submit"
                                      disabled={isPending && pendingKey === `update-${athlete.id}`}
                                      className="rounded-lg bg-white px-4 py-2 font-semibold text-slate-800 shadow hover:scale-[1.02] transition"
                                    >
                                      {isPending && pendingKey === `update-${athlete.id}`
                                        ? 'Saving...'
                                        : 'Save'}
                                    </button>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-5 bg-slate-800 border-t border-slate-600">
                <h3 className="text-lg font-semibold text-white mb-3">Remove Athlete</h3>

                <form action={handleDelete} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <select
                    name="athleteId"
                    defaultValue=""
                    required
                    className="rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white outline-none focus:border-white min-w-[260px]"
                  >
                    <option value="" disabled>
                      Select athlete to remove
                    </option>
                    {group.athletes.map((athlete) => (
                      <option key={athlete.id} value={athlete.id}>
                        {athlete.first_name} {athlete.last_name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="submit"
                    disabled={isPending && pendingKey?.startsWith('delete-')}
                    className="rounded-xl bg-red-500 px-5 py-3 font-semibold text-white shadow hover:scale-[1.02] transition"
                  >
                    {isPending && pendingKey?.startsWith('delete-')
                      ? 'Removing...'
                      : 'Remove Selected Athlete'}
                  </button>
                </form>
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}