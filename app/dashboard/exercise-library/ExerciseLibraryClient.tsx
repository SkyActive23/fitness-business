'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition, useEffect } from 'react';
import {
  createExercise,
  updateExercise,
  deleteExercise,
} from './actions';

type ExerciseRow = {
  id: string;
  name?: string | null;
  slug?: string | null;
  category?: string | null;
  movement_pattern?: string | null;
  primary_muscle?: string | null;
  secondary_muscle?: string | null;
  body_region?: string | null;
  equipment?: string | null;
  force_type?: string | null;
  mechanics?: string | null;
  laterality?: string | null;
  skill_level?: string | null;
  description?: string | null;
  instructions?: string | null;
  is_system?: boolean | null;
  coach_id?: string | null;
};

type FormState = {
  id?: string;
  name: string;
  category: string;
  movement_pattern: string;
  primary_muscle: string;
  secondary_muscle: string;
  body_region: string;
  equipment: string;
  force_type: string;
  mechanics: string;
  laterality: string;
  skill_level: string;
  description: string;
  instructions: string;
};

const emptyForm: FormState = {
  name: '',
  category: '',
  movement_pattern: '',
  primary_muscle: '',
  secondary_muscle: '',
  body_region: '',
  equipment: '',
  force_type: '',
  mechanics: '',
  laterality: '',
  skill_level: '',
  description: '',
  instructions: '',
};

function toFormState(exercise: ExerciseRow): FormState {
  return {
    id: exercise.id,
    name: exercise.name ?? '',
    category: exercise.category ?? '',
    movement_pattern: exercise.movement_pattern ?? '',
    primary_muscle: exercise.primary_muscle ?? '',
    secondary_muscle: exercise.secondary_muscle ?? '',
    body_region: exercise.body_region ?? '',
    equipment: exercise.equipment ?? '',
    force_type: exercise.force_type ?? '',
    mechanics: exercise.mechanics ?? '',
    laterality: exercise.laterality ?? '',
    skill_level: exercise.skill_level ?? '',
    description: exercise.description ?? '',
    instructions: exercise.instructions ?? '',
  };
}

export default function ExerciseLibraryClient({
  exercises,
  coachId,
}: {
  exercises: ExerciseRow[];
  coachId: string;
}) {
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState<FormState>(emptyForm);

  const [isPending, startTransition] = useTransition();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [exerciseToDelete, setExerciseToDelete] = useState<ExerciseRow | null>(null);

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredExercises = useMemo(() => {
    const q = search.trim().toLowerCase();

    return exercises.filter((exercise) => {
      if (!q) return true;

      return [
        exercise.name,
        exercise.category,
        exercise.movement_pattern,
        exercise.primary_muscle,
        exercise.secondary_muscle,
        exercise.body_region,
        exercise.equipment,
        exercise.force_type,
        exercise.mechanics,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [exercises, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredExercises.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedExercises = filteredExercises.slice(startIndex, endIndex);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function openCreateModal() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage('');
    setIsFormModalOpen(true);
  }

  function openEditModal(exercise: ExerciseRow) {
    setEditingId(exercise.id);
    setForm(toFormState(exercise));
    setMessage('');
    setIsFormModalOpen(true);
  }

  function closeFormModal() {
    if (isPending) return;
    setIsFormModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function openDeleteModal(exercise: ExerciseRow) {
    setExerciseToDelete(exercise);
    setMessage('');
    setIsDeleteModalOpen(true);
  }

  function closeDeleteModal() {
    if (isPending) return;
    setIsDeleteModalOpen(false);
    setExerciseToDelete(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage('');

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== undefined) formData.append(key, value);
    });

    startTransition(async () => {
      const result = editingId
        ? await updateExercise(formData)
        : await createExercise(formData);

      if (result?.error) {
        setMessage(result.error);
        return;
      }

      setMessage(result?.success || 'Saved.');
      setIsFormModalOpen(false);
      setEditingId(null);
      setForm(emptyForm);
    });
  }

  function handleConfirmDelete() {
    if (!exerciseToDelete) return;

    setMessage('');

    const formData = new FormData();
    formData.append('id', exerciseToDelete.id);

    startTransition(async () => {
      const result = await deleteExercise(formData);

      if (result?.error) {
        setMessage(result.error);
        return;
      }

      setMessage(result?.success || 'Deleted.');
      setIsDeleteModalOpen(false);
      setExerciseToDelete(null);
    });
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-slate-800 p-6 text-white shadow-xl">
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-2xl font-bold">Exercise Library</h2>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-3xl">
            <input
              type="text"
              placeholder="Search exercises..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white outline-none focus:border-white"
            />

            <button
              type="button"
              onClick={openCreateModal}
              className="rounded-lg bg-white px-5 py-3 font-semibold text-slate-800 shadow hover:scale-[1.02] transition whitespace-nowrap"
            >
              Add Exercise
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-300">
            Showing {filteredExercises.length === 0 ? 0 : startIndex + 1}-
            {Math.min(endIndex, filteredExercises.length)} of {filteredExercises.length} exercises
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-slate-200">
              Per page
            </label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white outline-none focus:border-white"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
            </select>
          </div>
        </div>

        {message && (
          <div className="mb-4 rounded-lg bg-slate-700 px-4 py-3 text-slate-100">
            {message}
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-slate-600">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-900 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Primary</th>
                <th className="px-4 py-3 font-semibold">Equipment</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Owner</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedExercises.map((exercise, index) => {
                const isSystem = Boolean(exercise.is_system);
                const isMine = exercise.coach_id === coachId;

                return (
                  <tr
                    key={exercise.id}
                    className={index % 2 === 0 ? 'bg-slate-800' : 'bg-slate-700'}
                  >
                    <td className="px-4 py-3 font-semibold">
                      {exercise.slug ? (
                        <Link
                          href={`/dashboard/exercise-library/${exercise.slug}`}
                          className="underline underline-offset-4 hover:text-slate-200 transition"
                        >
                          {exercise.name || 'Unnamed'}
                        </Link>
                      ) : (
                        exercise.name || 'Unnamed'
                      )}
                    </td>

                    <td className="px-4 py-3">{exercise.category || '—'}</td>
                    <td className="px-4 py-3">{exercise.primary_muscle || '—'}</td>
                    <td className="px-4 py-3">{exercise.equipment || '—'}</td>
                    <td className="px-4 py-3">{exercise.movement_pattern || '—'}</td>
                    <td className="px-4 py-3">
                      {isSystem ? 'System' : isMine ? 'Mine' : 'Other'}
                    </td>
                    <td className="px-4 py-3">
                      {isSystem || !isMine ? (
                        <span className="text-slate-400">Locked</span>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(exercise)}
                            className="rounded bg-white px-3 py-1 font-semibold text-slate-800"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => openDeleteModal(exercise)}
                            className="rounded bg-red-500 px-3 py-1 font-semibold text-white"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {!paginatedExercises.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-300">
                    No exercises found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredExercises.length > 0 && (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-300">
              Page {safeCurrentPage} of {totalPages}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={safeCurrentPage === 1}
                className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                First
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={safeCurrentPage === 1}
                className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Prev
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={safeCurrentPage === totalPages}
                className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Next
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={safeCurrentPage === totalPages}
                className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>

      {isFormModalOpen && (
        <ModalShell onClose={closeFormModal}>
          <div className="w-full max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-800 p-6 text-white shadow-xl">
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold">
                {editingId ? 'Edit Exercise' : 'Create Exercise'}
              </h2>

              <button
                type="button"
                onClick={closeFormModal}
                className="rounded-lg bg-slate-700 px-4 py-2 font-semibold hover:bg-slate-600 transition"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <input name="id" value={form.id ?? ''} readOnly hidden />

              <Field label="Name">
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white outline-none focus:border-white"
                  required
                />
              </Field>

              <Field label="Category">
                <input
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white outline-none focus:border-white"
                />
              </Field>

              <Field label="Movement Pattern">
                <input
                  name="movement_pattern"
                  value={form.movement_pattern}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white outline-none focus:border-white"
                />
              </Field>

              <Field label="Primary Muscle">
                <input
                  name="primary_muscle"
                  value={form.primary_muscle}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white outline-none focus:border-white"
                />
              </Field>

              <Field label="Secondary Muscle">
                <input
                  name="secondary_muscle"
                  value={form.secondary_muscle}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white outline-none focus:border-white"
                />
              </Field>

              <Field label="Body Region">
                <input
                  name="body_region"
                  value={form.body_region}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white outline-none focus:border-white"
                />
              </Field>

              <Field label="Equipment">
                <input
                  name="equipment"
                  value={form.equipment}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white outline-none focus:border-white"
                />
              </Field>

              <Field label="Force Type">
                <input
                  name="force_type"
                  value={form.force_type}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white outline-none focus:border-white"
                />
              </Field>

              <Field label="Mechanics">
                <input
                  name="mechanics"
                  value={form.mechanics}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white outline-none focus:border-white"
                />
              </Field>

              <Field label="Laterality">
                <input
                  name="laterality"
                  value={form.laterality}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white outline-none focus:border-white"
                />
              </Field>

              <Field label="Skill Level">
                <input
                  name="skill_level"
                  value={form.skill_level}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white outline-none focus:border-white"
                />
              </Field>

              <Field label="Description" className="md:col-span-2">
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white outline-none focus:border-white"
                />
              </Field>

              <Field label="Instructions" className="md:col-span-2">
                <textarea
                  name="instructions"
                  value={form.instructions}
                  onChange={handleChange}
                  rows={4}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white outline-none focus:border-white"
                />
              </Field>

              <div className="md:col-span-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-white px-5 py-3 font-semibold text-slate-800 shadow hover:scale-[1.02] transition"
                >
                  {isPending
                    ? editingId
                      ? 'Updating...'
                      : 'Creating...'
                    : editingId
                    ? 'Update Exercise'
                    : 'Create Exercise'}
                </button>

                <button
                  type="button"
                  onClick={closeFormModal}
                  className="rounded-lg bg-slate-700 px-5 py-3 font-semibold text-white hover:bg-slate-600 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </ModalShell>
      )}

      {isDeleteModalOpen && (
        <ModalShell onClose={closeDeleteModal}>
          <div className="w-full max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-800 p-6 text-white shadow-xl">
            <h2 className="text-2xl font-bold">Delete Exercise</h2>
            <p className="mt-4 text-slate-300">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-white">
                {exerciseToDelete?.name || 'this exercise'}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isPending}
                className="rounded-lg bg-red-500 px-5 py-3 font-semibold text-white shadow hover:scale-[1.02] transition"
              >
                {isPending ? 'Deleting...' : 'Yes, Delete'}
              </button>

              <button
                type="button"
                onClick={closeDeleteModal}
                className="rounded-lg bg-slate-700 px-5 py-3 font-semibold text-white hover:bg-slate-600 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </section>
  );
}

function Field({
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