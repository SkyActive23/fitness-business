import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import ExerciseLibraryClient from './ExerciseLibraryClient';

export default async function ExerciseLibraryPage() {
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
    .select('id, first_name, last_name')
    .eq('auth_user_id', user.id)
    .single();

  if (coachError || !coach) {
    redirect('/auth/login');
  }

  const { data: exercisesData, error: exercisesError } = await supabase
    .from('exercises')
    .select('*')
    .order('name', { ascending: true });

  if (exercisesError) {
    return (
      <main className="px-4 py-10 sm:px-8">
        <div className="rounded-xl bg-slate-800 p-6 text-white shadow-xl">
          <h1 className="text-3xl font-bold">Exercise Library</h1>
          <p className="mt-4 text-slate-300">Unable to load exercises.</p>
          <p className="mt-2 text-sm text-red-300">{exercisesError.message}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-[1600px] space-y-8">
        <section className="rounded-2xl bg-slate-800 p-6 text-white shadow-xl">
          <h1 className="text-3xl font-extrabold sm:text-4xl">
            Exercise Library
          </h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Create, edit, and manage your exercise library.
          </p>
        </section>

        <ExerciseLibraryClient
          exercises={exercisesData ?? []}
          coachId={coach.id}
        />
      </div>
    </main>
  );
}