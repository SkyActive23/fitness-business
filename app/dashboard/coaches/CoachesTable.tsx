'use client';

import { useState, useTransition } from 'react';
import {
  updateCoach,
  addCoachAssignment,
  updateCoachAssignmentTitle,
  removeCoachAssignment,
  createAssistantCoachAndAssign,
} from './actions';

type CoachTitle = 'Head Coach' | 'Assistant Coach';

type CoachDisplayRow = {
  coach_id: string;
  first_name: string;
  last_name: string;
  email: string;
  assignments: {
    assignment_id: string;
    title: CoachTitle;
    school_name: string;
    team_id: string;
    team_name: string;
    sport: string;
    join_code: string;
  }[];
};

const SPORT_OPTIONS = [
  'Baseball',
  "Women's Basketball",
  "Men's Basketball",
  "Men's Soccer",
  "Women's Soccer",
  'Softball',
  "Men's Volleyball",
  "Women's Volleyball",
  'Track',
  'Tennis',
  'Football',
];

export default function CoachesTable({
  coaches = [],
}: {
  coaches?: CoachDisplayRow[];
}) {
  const [message, setMessage] = useState('');
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [visibleCodes, setVisibleCodes] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();

  function toggleCode(assignmentId: string) {
    setVisibleCodes((prev) => ({
      ...prev,
      [assignmentId]: !prev[assignmentId],
    }));
  }

  async function handleSaveCoach(formData: FormData) {
    const coachId = String(formData.get('coachId') || '');
    setPendingKey(`coach-${coachId}`);
    setMessage('');

    startTransition(async () => {
      const result = await updateCoach({
        coachId,
        firstName: String(formData.get('firstName') || ''),
        lastName: String(formData.get('lastName') || ''),
        email: String(formData.get('email') || ''),
      });

      setMessage(result?.error ?? 'Coach updated successfully.');
      setPendingKey(null);
    });
  }

  async function handleAddAssignment(formData: FormData) {
    const coachId = String(formData.get('coachId') || '');
    setPendingKey(`add-${coachId}`);
    setMessage('');

    startTransition(async () => {
      const result = await addCoachAssignment({
        coachId,
        sport: String(formData.get('sport') || ''),
        title: String(formData.get('title') || 'Assistant Coach') as CoachTitle,
      });

      setMessage(result?.error ?? 'Sport added to coach successfully.');
      setPendingKey(null);
    });
  }

  async function handleUpdateTitle(formData: FormData) {
    const assignmentId = String(formData.get('assignmentId') || '');
    setPendingKey(`title-${assignmentId}`);
    setMessage('');

    startTransition(async () => {
      const result = await updateCoachAssignmentTitle({
        assignmentId,
        title: String(formData.get('title') || 'Assistant Coach') as CoachTitle,
      });

      setMessage(result?.error ?? 'Title updated successfully.');
      setPendingKey(null);
    });
  }

  async function handleRemoveAssignment(formData: FormData) {
    const assignmentId = String(formData.get('assignmentId') || '');
    setPendingKey(`remove-${assignmentId}`);
    setMessage('');

    startTransition(async () => {
      const result = await removeCoachAssignment({ assignmentId });
      setMessage(result?.error ?? 'Coach assignment removed successfully.');
      setPendingKey(null);
    });
  }

  async function handleCreateAssistant(formData: FormData) {
    setPendingKey('create-assistant');
    setMessage('');

    startTransition(async () => {
      const result = await createAssistantCoachAndAssign({
        firstName: String(formData.get('firstName') || ''),
        lastName: String(formData.get('lastName') || ''),
        email: String(formData.get('email') || ''),
        sport: String(formData.get('sport') || ''),
        title: String(formData.get('title') || 'Assistant Coach') as CoachTitle,
      });

      setMessage(result?.error ?? 'Assistant coach added successfully.');
      setPendingKey(null);
    });
  }

  return (
    <section className="w-full bg-slate-800 rounded-lg py-8 px-4 sm:px-8 shadow-xl space-y-8">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white">
          Coaches
        </h2>
        <p className="mt-2 text-slate-200">
          Manage all coaches, assignments, titles, join codes, and sports.
        </p>
      </div>

      <section className="rounded-xl bg-slate-700 p-5 shadow-lg space-y-4">
        <h3 className="text-xl font-bold text-white">Add Assistant Coach</h3>

        <form action={handleCreateAssistant} className="grid gap-4 md:grid-cols-2">
          <input
            name="firstName"
            placeholder="First name"
            className="rounded-lg border border-slate-500 bg-slate-600 px-4 py-3 text-white"
            required
          />
          <input
            name="lastName"
            placeholder="Last name"
            className="rounded-lg border border-slate-500 bg-slate-600 px-4 py-3 text-white"
            required
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            className="rounded-lg border border-slate-500 bg-slate-600 px-4 py-3 text-white md:col-span-2"
            required
          />
          <select
            name="sport"
            className="rounded-lg border border-slate-500 bg-slate-600 px-4 py-3 text-white"
            defaultValue=""
            required
          >
            <option value="" disabled>
              Select sport
            </option>
            {SPORT_OPTIONS.map((sport) => (
              <option key={sport} value={sport}>
                {sport}
              </option>
            ))}
          </select>
          <select
            name="title"
            className="rounded-lg border border-slate-500 bg-slate-600 px-4 py-3 text-white"
            defaultValue="Assistant Coach"
            required
          >
            <option value="Assistant Coach">Assistant Coach</option>
            <option value="Head Coach">Head Coach</option>
          </select>

          <button
            type="submit"
            disabled={isPending && pendingKey === 'create-assistant'}
            className="md:col-span-2 rounded-lg bg-white px-5 py-3 font-semibold text-slate-800 shadow hover:scale-105 transition"
          >
            {isPending && pendingKey === 'create-assistant'
              ? 'Adding...'
              : 'Add Assistant Coach'}
          </button>
        </form>
      </section>

      {!coaches.length ? (
        <p className="text-slate-200">No coaches found.</p>
      ) : (
        <div className="space-y-6">
          {coaches.map((coach) => (
            <div
              key={coach.coach_id}
              className="rounded-xl bg-slate-700 p-5 shadow-lg space-y-5"
            >
              <form action={handleSaveCoach} className="grid gap-4 md:grid-cols-4">
                <input type="hidden" name="coachId" value={coach.coach_id} />

                <input
                  name="firstName"
                  defaultValue={coach.first_name}
                  className="rounded-lg border border-slate-500 bg-slate-600 px-3 py-2 text-white"
                />

                <input
                  name="lastName"
                  defaultValue={coach.last_name}
                  className="rounded-lg border border-slate-500 bg-slate-600 px-3 py-2 text-white"
                />

                <input
                  name="email"
                  defaultValue={coach.email}
                  className="rounded-lg border border-slate-500 bg-slate-600 px-3 py-2 text-white"
                />

                <button
                  type="submit"
                  disabled={isPending && pendingKey === `coach-${coach.coach_id}`}
                  className="bg-white text-slate-800 font-semibold px-4 py-2 rounded-lg shadow hover:scale-105 transition"
                >
                  {isPending && pendingKey === `coach-${coach.coach_id}`
                    ? 'Saving...'
                    : 'Save Coach'}
                </button>
              </form>

              <div className="overflow-x-auto rounded-lg border border-slate-600 bg-slate-700 shadow-lg">
                <table className="min-w-full text-sm text-white">
                  <thead className="bg-slate-900">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Title</th>
                      <th className="px-4 py-3 text-left font-semibold">School</th>
                      <th className="px-4 py-3 text-left font-semibold">Team</th>
                      <th className="px-4 py-3 text-left font-semibold">Sport</th>
                      <th className="px-4 py-3 text-left font-semibold">Join Code</th>
                      <th className="px-4 py-3 text-left font-semibold">Edit Title</th>
                      <th className="px-4 py-3 text-left font-semibold">Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coach.assignments.map((assignment, index) => (
                      <tr
                        key={assignment.assignment_id}
                        className={index % 2 === 0 ? 'bg-slate-700' : 'bg-slate-600'}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">{assignment.title}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{assignment.school_name}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{assignment.team_name}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{assignment.sport}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleCode(assignment.assignment_id)}
                              className="bg-white text-slate-800 font-semibold px-3 py-2 rounded-lg shadow hover:scale-105 transition"
                            >
                              {visibleCodes[assignment.assignment_id] ? 'Hide Code' : 'Show Code'}
                            </button>

                            {visibleCodes[assignment.assignment_id] && (
                              <span className="font-mono bg-slate-900 px-3 py-2 rounded">
                                {assignment.join_code}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <form action={handleUpdateTitle} className="flex items-center gap-2">
                            <input
                              type="hidden"
                              name="assignmentId"
                              value={assignment.assignment_id}
                            />
                            <select
                              name="title"
                              defaultValue={assignment.title}
                              className="rounded-lg border border-slate-500 bg-slate-600 px-3 py-2 text-white"
                            >
                              <option value="Head Coach">Head Coach</option>
                              <option value="Assistant Coach">Assistant Coach</option>
                            </select>
                            <button
                              type="submit"
                              disabled={isPending && pendingKey === `title-${assignment.assignment_id}`}
                              className="bg-white text-slate-800 font-semibold px-3 py-2 rounded-lg shadow hover:scale-105 transition"
                            >
                              {isPending && pendingKey === `title-${assignment.assignment_id}`
                                ? 'Saving...'
                                : 'Save'}
                            </button>
                          </form>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <form action={handleRemoveAssignment}>
                            <input
                              type="hidden"
                              name="assignmentId"
                              value={assignment.assignment_id}
                            />
                            <button
                              type="submit"
                              disabled={isPending && pendingKey === `remove-${assignment.assignment_id}`}
                              className="bg-red-500 text-white font-semibold px-3 py-2 rounded-lg shadow hover:scale-105 transition"
                            >
                              {isPending && pendingKey === `remove-${assignment.assignment_id}`
                                ? 'Removing...'
                                : 'Remove'}
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <form action={handleAddAssignment} className="grid gap-4 md:grid-cols-3">
                <input type="hidden" name="coachId" value={coach.coach_id} />

                <select
                  name="sport"
                  className="rounded-lg border border-slate-500 bg-slate-600 px-4 py-3 text-white"
                  defaultValue=""
                  required
                >
                  <option value="" disabled>
                    Add another sport
                  </option>
                  {SPORT_OPTIONS.filter(
                    (sport) => !coach.assignments.some((a) => a.sport === sport)
                  ).map((sport) => (
                    <option key={sport} value={sport}>
                      {sport}
                    </option>
                  ))}
                </select>

                <select
                  name="title"
                  className="rounded-lg border border-slate-500 bg-slate-600 px-4 py-3 text-white"
                  defaultValue="Assistant Coach"
                  required
                >
                  <option value="Assistant Coach">Assistant Coach</option>
                  <option value="Head Coach">Head Coach</option>
                </select>

                <button
                  type="submit"
                  disabled={isPending && pendingKey === `add-${coach.coach_id}`}
                  className="rounded-lg bg-white px-5 py-3 font-semibold text-slate-800 shadow hover:scale-105 transition"
                >
                  {isPending && pendingKey === `add-${coach.coach_id}`
                    ? 'Adding...'
                    : 'Add Sport'}
                </button>
              </form>
            </div>
          ))}
        </div>
      )}

      {message && <p className="text-slate-200">{message}</p>}
    </section>
  );
}