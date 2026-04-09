'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
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

type EditFormState = {
  firstName: string;
  lastName: string;
  position: string;
  height: string;
  weight: string;
};

type CreateFormState = {
  teamId: string;
  firstName: string;
  lastName: string;
  position: string;
  height: string;
  weight: string;
};

const emptyCreateForm: CreateFormState = {
  teamId: '',
  firstName: '',
  lastName: '',
  position: '',
  height: '',
  weight: '',
};

function buildEditState(athlete: AthleteRow): EditFormState {
  return {
    firstName: athlete.first_name ?? '',
    lastName: athlete.last_name ?? '',
    position: athlete.position ?? '',
    height: athlete.height ?? '',
    weight: athlete.weight == null ? '' : String(athlete.weight),
  };
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

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormState>(emptyCreateForm);

  const [editingAthleteId, setEditingAthleteId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({
    firstName: '',
    lastName: '',
    position: '',
    height: '',
    weight: '',
  });

  const groupedAthletes: AthleteGroup[] = useMemo(
    () =>
      Object.values(
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
      ),
    [athletes]
  );

  function openCreateModal() {
    setMessage('');
    setCreateForm(emptyCreateForm);
    setIsCreateModalOpen(true);
  }

  function closeCreateModal() {
    if (isPending) return;
    setIsCreateModalOpen(false);
  }

  function startEditing(athlete: AthleteRow) {
    setMessage('');
    setEditingAthleteId(athlete.id);
    setEditForm(buildEditState(athlete));
  }

  function cancelEditing() {
    if (isPending) return;
    setEditingAthleteId(null);
    setEditForm({
      firstName: '',
      lastName: '',
      position: '',
      height: '',
      weight: '',
    });
  }

  function handleCreateInputChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleEditInputChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleCreateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPendingKey('create');
    setMessage('');

    startTransition(async () => {
      const result = await createAthlete({
        teamId: createForm.teamId,
        firstName: createForm.firstName,
        lastName: createForm.lastName,
        height: createForm.height,
        weight: createForm.weight,
        position: createForm.position,
      });

      if (result?.error) {
        setMessage(result.error);
        setPendingKey(null);
        return;
      }

      setMessage('Athlete added successfully.');
      setPendingKey(null);
      setIsCreateModalOpen(false);
      setCreateForm(emptyCreateForm);
    });
  }

  async function handleSaveAthlete(athleteId: string) {
    setPendingKey(`update-${athleteId}`);
    setMessage('');

    startTransition(async () => {
      const result = await updateAthlete({
        athleteId,
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        height: editForm.height,
        weight: editForm.weight,
        position: editForm.position,
      });

      if (result?.error) {
        setMessage(result.error);
        setPendingKey(null);
        return;
      }

      setMessage('Athlete updated successfully.');
      setPendingKey(null);
      setEditingAthleteId(null);
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Athlete Roster</h2>
            <p className="mt-2 text-slate-300">
              Add and manage roster information for athletes.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-xl bg-white px-5 py-3 font-semibold text-slate-800 shadow-lg hover:scale-[1.01] active:scale-[0.99] transition"
          >
            Add Athlete
          </button>
        </div>
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
                    {group.athletes.map((athlete, index) => {
                      const isEditing = editingAthleteId === athlete.id;

                      return (
                        <tr
                          key={athlete.id}
                          className={index % 2 === 0 ? 'bg-slate-700' : 'bg-slate-600'}
                        >
                          <td className="px-4 py-3 align-middle">
                            {isEditing ? (
                              <RowInput
                                name="firstName"
                                value={editForm.firstName}
                                onChange={handleEditInputChange}
                              />
                            ) : (
                              athlete.first_name
                            )}
                          </td>

                          <td className="px-4 py-3 align-middle">
                            {isEditing ? (
                              <RowInput
                                name="lastName"
                                value={editForm.lastName}
                                onChange={handleEditInputChange}
                              />
                            ) : (
                              athlete.last_name
                            )}
                          </td>

                          <td className="px-4 py-3 align-middle">
                            {isEditing ? (
                              <RowInput
                                name="position"
                                value={editForm.position}
                                onChange={handleEditInputChange}
                              />
                            ) : (
                              athlete.position ?? '—'
                            )}
                          </td>

                          <td className="px-4 py-3 align-middle">
                            {isEditing ? (
                              <RowInput
                                name="height"
                                value={editForm.height}
                                onChange={handleEditInputChange}
                              />
                            ) : (
                              athlete.height ?? '—'
                            )}
                          </td>

                          <td className="px-4 py-3 align-middle">
                            {isEditing ? (
                              <RowInput
                                name="weight"
                                value={editForm.weight}
                                onChange={handleEditInputChange}
                              />
                            ) : (
                              athlete.weight ?? '—'
                            )}
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap align-middle">
                            {isEditing ? (
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleSaveAthlete(athlete.id)}
                                  disabled={isPending && pendingKey === `update-${athlete.id}`}
                                  className="rounded-lg bg-white px-4 py-2 font-semibold text-slate-800 shadow hover:scale-[1.02] transition"
                                >
                                  {isPending && pendingKey === `update-${athlete.id}`
                                    ? 'Saving...'
                                    : 'Save'}
                                </button>

                                <button
                                  type="button"
                                  onClick={cancelEditing}
                                  disabled={isPending}
                                  className="rounded-lg bg-slate-500 px-4 py-2 font-semibold text-white shadow hover:scale-[1.02] transition"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => startEditing(athlete)}
                                className="rounded-lg bg-white px-4 py-2 font-semibold text-slate-800 shadow hover:scale-[1.02] transition"
                              >
                                Edit
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
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

      {isCreateModalOpen && (
        <ModalShell onClose={closeCreateModal}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-800 p-6 text-white shadow-xl">
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold">Add Athlete</h2>

              <button
                type="button"
                onClick={closeCreateModal}
                className="rounded-lg bg-slate-700 px-4 py-2 font-semibold hover:bg-slate-600 transition"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-200">
                  Team / Sport
                </label>
                <select
                  name="teamId"
                  value={createForm.teamId}
                  onChange={handleCreateInputChange}
                  required
                  className="w-full rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white outline-none focus:border-white"
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
              </div>

              <ModalField label="First Name">
                <input
                  name="firstName"
                  value={createForm.firstName}
                  onChange={handleCreateInputChange}
                  required
                  className="w-full rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white outline-none focus:border-white"
                />
              </ModalField>

              <ModalField label="Last Name">
                <input
                  name="lastName"
                  value={createForm.lastName}
                  onChange={handleCreateInputChange}
                  required
                  className="w-full rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white outline-none focus:border-white"
                />
              </ModalField>

              <ModalField label="Position">
                <input
                  name="position"
                  value={createForm.position}
                  onChange={handleCreateInputChange}
                  className="w-full rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white outline-none focus:border-white"
                />
              </ModalField>

              <ModalField label="Height">
                <input
                  name="height"
                  value={createForm.height}
                  onChange={handleCreateInputChange}
                  className="w-full rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white outline-none focus:border-white"
                />
              </ModalField>

              <ModalField label="Weight">
                <input
                  name="weight"
                  value={createForm.weight}
                  onChange={handleCreateInputChange}
                  className="w-full rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white outline-none focus:border-white"
                />
              </ModalField>

              <div className="md:col-span-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isPending && pendingKey === 'create'}
                  className="rounded-xl bg-white px-5 py-3 font-semibold text-slate-800 shadow-lg hover:scale-[1.01] active:scale-[0.99] transition"
                >
                  {isPending && pendingKey === 'create' ? 'Adding...' : 'Add Athlete'}
                </button>

                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={isPending}
                  className="rounded-xl bg-slate-600 px-5 py-3 font-semibold text-white shadow-lg hover:scale-[1.01] active:scale-[0.99] transition"
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

function RowInput({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <input
      name={name}
      value={value}
      onChange={onChange}
      className="w-full min-w-0 rounded-lg border border-slate-500 bg-slate-700 px-3 py-2 text-white outline-none focus:border-white"
    />
  );
}

function ModalField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
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