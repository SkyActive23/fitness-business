'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteExercise, updateExercise } from '../actions';

type Exercise = {
  id: string;
  slug: string;
  name?: string | null;
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
};

export default function ExerciseDetailActions({
  exercise,
  canEdit,
}: {
  exercise: Exercise;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
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
  });

  if (!canEdit) return null;

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage('');

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => formData.append(key, value));

    startTransition(async () => {
      const result = await updateExercise(formData);

      if (result?.error) {
        setMessage(result.error);
        return;
      }

      setMessage(result?.success || 'Updated.');
      setIsEditing(false);

      if (result?.slug) {
        router.push(`/dashboard/exercise-library/${result.slug}`);
      }

      router.refresh();
    });
  }

  function handleDelete() {
    const confirmed = window.confirm('Delete this exercise?');
    if (!confirmed) return;

    const formData = new FormData();
    formData.append('id', exercise.id);

    startTransition(async () => {
      const result = await deleteExercise(formData);

      if (result?.error) {
        setMessage(result.error);
        return;
      }

      router.push('/dashboard/exercise-library');
      router.refresh();
    });
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setIsEditing((prev) => !prev)}
          className="rounded-lg bg-white px-4 py-2 font-semibold text-slate-800 shadow hover:scale-105 transition"
        >
          {isEditing ? 'Cancel Edit' : 'Edit Exercise'}
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="rounded-lg bg-red-500 px-4 py-2 font-semibold text-white shadow hover:scale-105 transition"
        >
          Delete Exercise
        </button>
      </div>

      {message && (
        <div className="mt-4 rounded-lg bg-slate-700 px-4 py-3 text-slate-100">
          {message}
        </div>
      )}

      {isEditing && (
        <form onSubmit={handleUpdate} className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Name">
            <input name="name" value={form.name} onChange={handleChange} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white outline-none focus:border-white" required />
          </Field>

          <Field label="Category">
            <input name="category" value={form.category} onChange={handleChange} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white outline-none focus:border-white" />
          </Field>

          <Field label="Movement Pattern">
            <input name="movement_pattern" value={form.movement_pattern} onChange={handleChange} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white outline-none focus:border-white" />
          </Field>

          <Field label="Primary Muscle">
            <input name="primary_muscle" value={form.primary_muscle} onChange={handleChange} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white outline-none focus:border-white" />
          </Field>

          <Field label="Secondary Muscle">
            <input name="secondary_muscle" value={form.secondary_muscle} onChange={handleChange} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white outline-none focus:border-white" />
          </Field>

          <Field label="Body Region">
            <input name="body_region" value={form.body_region} onChange={handleChange} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white outline-none focus:border-white" />
          </Field>

          <Field label="Equipment">
            <input name="equipment" value={form.equipment} onChange={handleChange} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white outline-none focus:border-white" />
          </Field>

          <Field label="Force Type">
            <input name="force_type" value={form.force_type} onChange={handleChange} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white outline-none focus:border-white" />
          </Field>

          <Field label="Mechanics">
            <input name="mechanics" value={form.mechanics} onChange={handleChange} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white outline-none focus:border-white" />
          </Field>

          <Field label="Laterality">
            <input name="laterality" value={form.laterality} onChange={handleChange} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white outline-none focus:border-white" />
          </Field>

          <Field label="Skill Level">
            <input name="skill_level" value={form.skill_level} onChange={handleChange} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white outline-none focus:border-white" />
          </Field>

          <Field label="Description" className="md:col-span-2">
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white outline-none focus:border-white" />
          </Field>

          <Field label="Instructions" className="md:col-span-2">
            <textarea name="instructions" value={form.instructions} onChange={handleChange} rows={4} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white outline-none focus:border-white" />
          </Field>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-white px-5 py-3 font-semibold text-slate-800 shadow hover:scale-[1.02] transition"
            >
              {isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}
    </div>
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