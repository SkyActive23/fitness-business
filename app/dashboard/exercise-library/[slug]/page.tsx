import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import ExerciseDetailActions from './ExerciseDetailActions';

function displayValue(value: string | number | null | undefined) {
  return value === null || value === undefined || value === '' ? '—' : value;
}

export default async function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/auth/login');
  }

  const { data: coach, error: coachError } = await supabase
    .from('coaches')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (coachError || !coach) {
    redirect('/auth/login');
  }

  const { data: exercise, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !exercise) {
    return (
      <main className="px-4 py-10 sm:px-8">
        <div className="mx-auto max-w-5xl rounded-2xl bg-slate-800 p-6 text-white shadow-xl">
          <h1 className="text-3xl font-bold">Exercise not found</h1>
          <p className="mt-4 text-slate-300">
            The exercise you are looking for does not exist.
          </p>
          <Link
            href="/dashboard/exercise-library"
            className="mt-6 inline-block rounded-lg bg-white px-4 py-2 font-semibold text-slate-800"
          >
            Back to Exercise Library
          </Link>
        </div>
      </main>
    );
  }

  const isSystem = Boolean(exercise.is_system);
  const isMine = exercise.coach_id === coach.id;

  return (
    <main className="px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/exercise-library"
            className="rounded-lg bg-white px-4 py-2 font-semibold text-slate-800 shadow hover:scale-105 transition"
          >
            Back to Exercise Library
          </Link>
        </div>

        <section className="rounded-2xl bg-slate-800 p-6 text-white shadow-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold sm:text-4xl">
                {exercise.name}
              </h1>
              <p className="mt-3 text-slate-300">
                {exercise.description || 'No description provided.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  isSystem
                    ? 'bg-slate-600 text-white'
                    : isMine
                    ? 'bg-white text-slate-800'
                    : 'bg-slate-500 text-white'
                }`}
              >
                {isSystem ? 'System Exercise' : isMine ? 'My Exercise' : 'Exercise'}
              </div>

              <ExerciseDetailActions exercise={exercise} canEdit={isMine && !isSystem} />
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-slate-800 p-6 text-white shadow-xl">
          <h2 className="text-2xl font-bold">Exercise Details</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3 text-slate-200">
            <p><span className="font-semibold text-white">Category:</span> {displayValue(exercise.category)}</p>
            <p><span className="font-semibold text-white">Movement Pattern:</span> {displayValue(exercise.movement_pattern)}</p>
            <p><span className="font-semibold text-white">Primary Muscle:</span> {displayValue(exercise.primary_muscle)}</p>
            <p><span className="font-semibold text-white">Secondary Muscle:</span> {displayValue(exercise.secondary_muscle)}</p>
            <p><span className="font-semibold text-white">Body Region:</span> {displayValue(exercise.body_region)}</p>
            <p><span className="font-semibold text-white">Equipment:</span> {displayValue(exercise.equipment)}</p>
            <p><span className="font-semibold text-white">Force Type:</span> {displayValue(exercise.force_type)}</p>
            <p><span className="font-semibold text-white">Mechanics:</span> {displayValue(exercise.mechanics)}</p>
            <p><span className="font-semibold text-white">Laterality:</span> {displayValue(exercise.laterality)}</p>
            <p><span className="font-semibold text-white">Skill Level:</span> {displayValue(exercise.skill_level)}</p>
            <p><span className="font-semibold text-white">Source:</span> {displayValue(exercise.source_name)}</p>
            <p><span className="font-semibold text-white">Slug:</span> {displayValue(exercise.slug)}</p>
          </div>
        </section>

        <section className="rounded-2xl bg-slate-800 p-6 text-white shadow-xl">
          <h2 className="text-2xl font-bold">Instructions</h2>
          <div className="mt-4 whitespace-pre-line text-slate-200 leading-relaxed">
            {exercise.instructions || 'No instructions provided.'}
          </div>
        </section>
      </div>
    </main>
  );
}