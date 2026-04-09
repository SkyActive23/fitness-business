'use client';

import { useEffect, useState, useTransition } from 'react';
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

type CreateAssistantFormState = {
  firstName: string;
  lastName: string;
  email: string;
  sport: string;
  title: CoachTitle;
};

type EditCoachFormState = {
  firstName: string;
  lastName: string;
  email: string;
};

const emptyAssistantForm: CreateAssistantFormState = {
  firstName: '',
  lastName: '',
  email: '',
  sport: '',
  title: 'Assistant Coach',
};

const emptyEditCoachForm: EditCoachFormState = {
  firstName: '',
  lastName: '',
  email: '',
};

function buildEditCoachState(coach: CoachDisplayRow): EditCoachFormState {
  return {
    firstName: coach.first_name ?? '',
    lastName: coach.last_name ?? '',
    email: coach.email ?? '',
  };
}

export default function CoachesTable({
  coaches = [],
}: {
  coaches?: CoachDisplayRow[];
}) {
  const [message, setMessage] = useState('');
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [visibleCodes, setVisibleCodes] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createAssistantForm, setCreateAssistantForm] =
    useState<CreateAssistantFormState>(emptyAssistantForm);

  const [editingCoachId, setEditingCoachId] = useState<string | null>(null);
  const [editCoachForm, setEditCoachForm] =
    useState<EditCoachFormState>(emptyEditCoachForm);

  function toggleCode(assignmentId: string) {
    setVisibleCodes((prev) => ({
      ...prev,
      [assignmentId]: !prev[assignmentId],
    }));
  }

  function openCreateModal() {
    setMessage('');
    setCreateAssistantForm(emptyAssistantForm);
    setIsCreateModalOpen(true);
  }

  function closeCreateModal() {
    if (isPending) return;
    setIsCreateModalOpen(false);
  }

  function startEditingCoach(coach: CoachDisplayRow) {
    setMessage('');
    setEditingCoachId(coach.coach_id);
    setEditCoachForm(buildEditCoachState(coach));
  }

  function cancelEditingCoach() {
    if (isPending) return;
    setEditingCoachId(null);
    setEditCoachForm(emptyEditCoachForm);
  }

  function handleCreateInputChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setCreateAssistantForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleEditCoachInputChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const { name, value } = e.target;
    setEditCoachForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleCreateAssistantSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPendingKey('create-assistant');
    setMessage('');

    startTransition(async () => {
      const result = await createAssistantCoachAndAssign({
        firstName: createAssistantForm.firstName,
        lastName: createAssistantForm.lastName,
        email: createAssistantForm.email,
        sport: createAssistantForm.sport,
        title: createAssistantForm.title,
      });

      if (result?.error) {
        setMessage(result.error);
        setPendingKey(null);
        return;
      }

      setMessage('Assistant coach added successfully.');
      setPendingKey(null);
      setIsCreateModalOpen(false);
      setCreateAssistantForm(emptyAssistantForm);
    });
  }

  async function handleSaveCoach(coachId: string) {
    setPendingKey(`coach-${coachId}`);
    setMessage('');

    startTransition(async () => {
      const result = await updateCoach({
        coachId,
        firstName: editCoachForm.firstName,
        lastName: editCoachForm.lastName,
        email: editCoachForm.email,
      });

      if (result?.error) {
        setMessage(result.error);
        setPendingKey(null);
        return;
      }

      setMessage('Coach updated successfully.');
      setPendingKey(null);
      setEditingCoachId(null);
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

  return (
    <section className="w-full space-y-8">
      <section className="rounded-2xl bg-slate-800/95 border border-slate-600 shadow-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Coaches
            </h2>
            <p className="mt-2 text-slate-300">
              Manage coaches, sports, titles, assignments, and join codes.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-xl bg-white px-5 py-3 font-semibold text-slate-800 shadow-lg hover:scale-[1.01] active:scale-[0.99] transition"
          >
            Add Assistant Coach
          </button>
        </div>
      </section>

      {message && (
        <div className="rounded-xl bg-slate-800 border border-slate-600 px-4 py-3 text-slate-100 shadow-lg">
          {message}
        </div>
      )}

      {!coaches.length ? (
        <section className="rounded-2xl bg-slate-800/95 border border-slate-600 shadow-2xl p-8 text-center">
          <h3 className="text-xl font-bold text-white">No coaches found</h3>
          <p className="mt-2 text-slate-300">
            Once coaches are added, they will show up here.
          </p>
        </section>
      ) : (
        <div className="space-y-8">
          {coaches.map((coach) => {
            const isEditing = editingCoachId === coach.coach_id;

            return (
              <section
                key={coach.coach_id}
                className="rounded-2xl bg-slate-800/95 border border-slate-600 shadow-2xl overflow-hidden"
              >
                <div className="px-6 py-5 bg-slate-800 border-b border-slate-600">
                  <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-300">
                          First Name
                        </label>
                        {isEditing ? (
                          <input
                            name="firstName"
                            value={editCoachForm.firstName}
                            onChange={handleEditCoachInputChange}
                            className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                          />
                        ) : (
                          <div className="rounded-lg bg-slate-700 px-4 py-3 text-white">
                            {coach.first_name}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-300">
                          Last Name
                        </label>
                        {isEditing ? (
                          <input
                            name="lastName"
                            value={editCoachForm.lastName}
                            onChange={handleEditCoachInputChange}
                            className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                          />
                        ) : (
                          <div className="rounded-lg bg-slate-700 px-4 py-3 text-white">
                            {coach.last_name}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-300">
                          Email
                        </label>
                        {isEditing ? (
                          <input
                            name="email"
                            type="email"
                            value={editCoachForm.email}
                            onChange={handleEditCoachInputChange}
                            className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                          />
                        ) : (
                          <div className="rounded-lg bg-slate-700 px-4 py-3 text-white break-all">
                            {coach.email}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSaveCoach(coach.coach_id)}
                            disabled={isPending && pendingKey === `coach-${coach.coach_id}`}
                            className="rounded-lg bg-white px-4 py-2 font-semibold text-slate-800 shadow hover:scale-[1.02] transition"
                          >
                            {isPending && pendingKey === `coach-${coach.coach_id}`
                              ? 'Saving...'
                              : 'Save'}
                          </button>

                          <button
                            type="button"
                            onClick={cancelEditingCoach}
                            disabled={isPending}
                            className="rounded-lg bg-slate-500 px-4 py-2 font-semibold text-white shadow hover:scale-[1.02] transition"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEditingCoach(coach)}
                          className="rounded-lg bg-white px-4 py-2 font-semibold text-slate-800 shadow hover:scale-[1.02] transition"
                        >
                          Edit Coach
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
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
                                className="rounded-lg bg-white px-3 py-2 font-semibold text-slate-800 shadow hover:scale-[1.02] transition"
                              >
                                {visibleCodes[assignment.assignment_id] ? 'Hide Code' : 'Show Code'}
                              </button>

                              {visibleCodes[assignment.assignment_id] && (
                                <span className="rounded bg-slate-900 px-3 py-2 font-mono">
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
                                className="rounded-lg bg-white px-3 py-2 font-semibold text-slate-800 shadow hover:scale-[1.02] transition"
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
                                className="rounded-lg bg-red-500 px-3 py-2 font-semibold text-white shadow hover:scale-[1.02] transition"
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

                <div className="px-6 py-5 bg-slate-800 border-t border-slate-600">
                  <h3 className="mb-3 text-lg font-semibold text-white">Add Sport</h3>

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
                      className="rounded-lg bg-white px-5 py-3 font-semibold text-slate-800 shadow hover:scale-[1.02] transition"
                    >
                      {isPending && pendingKey === `add-${coach.coach_id}`
                        ? 'Adding...'
                        : 'Add Sport'}
                    </button>
                  </form>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {isCreateModalOpen && (
        <ModalShell onClose={closeCreateModal}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-800 p-6 text-white shadow-xl">
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold">Add Assistant Coach</h2>

              <button
                type="button"
                onClick={closeCreateModal}
                className="rounded-lg bg-slate-700 px-4 py-2 font-semibold hover:bg-slate-600 transition"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateAssistantSubmit} className="grid gap-4 md:grid-cols-2">
              <ModalField label="First Name">
                <input
                  name="firstName"
                  value={createAssistantForm.firstName}
                  onChange={handleCreateInputChange}
                  className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                  required
                />
              </ModalField>

              <ModalField label="Last Name">
                <input
                  name="lastName"
                  value={createAssistantForm.lastName}
                  onChange={handleCreateInputChange}
                  className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                  required
                />
              </ModalField>

              <ModalField label="Email" className="md:col-span-2">
                <input
                  name="email"
                  type="email"
                  value={createAssistantForm.email}
                  onChange={handleCreateInputChange}
                  className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                  required
                />
              </ModalField>

              <ModalField label="Sport">
                <select
                  name="sport"
                  value={createAssistantForm.sport}
                  onChange={handleCreateInputChange}
                  className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
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
              </ModalField>

              <ModalField label="Title">
                <select
                  name="title"
                  value={createAssistantForm.title}
                  onChange={handleCreateInputChange}
                  className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                  required
                >
                  <option value="Assistant Coach">Assistant Coach</option>
                  <option value="Head Coach">Head Coach</option>
                </select>
              </ModalField>

              <div className="md:col-span-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isPending && pendingKey === 'create-assistant'}
                  className="rounded-lg bg-white px-5 py-3 font-semibold text-slate-800 shadow hover:scale-[1.02] transition"
                >
                  {isPending && pendingKey === 'create-assistant'
                    ? 'Adding...'
                    : 'Add Assistant Coach'}
                </button>

                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={isPending}
                  className="rounded-lg bg-slate-600 px-5 py-3 font-semibold text-white shadow hover:scale-[1.02] transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </ModalShell>
      )}
    </section>
  );
}

function ModalField({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-semibold text-slate-200">
        {label}
      </label>
      {children}
    </div>
  );
}

function ModalShell({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-[101] w-full max-w-2xl px-4 animate-in fade-in zoom-in-95 duration-200">
        {children}
      </div>
    </div>
  );
}