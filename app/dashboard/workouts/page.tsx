import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import WorkoutsClient from './WorkoutsClient';

export default async function WorkoutsPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/auth/login');
  }

  const { data: me, error: meError } = await supabase
    .from('coaches')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (meError || !me) {
    redirect('/auth/login');
  }

  const { data: assignments, error: assignmentsError } = await supabase
    .from('coach_assignments')
    .select(`
      id,
      title,
      team_id,
      teams!coach_assignments_team_id_fkey (
        id,
        team_name,
        sport,
        schools!teams_school_id_fkey (
          id,
          name
        )
      )
    `)
    .eq('coach_id', me.id);

  if (assignmentsError) {
    return <main className="p-8 text-white">Unable to load workouts.</main>;
  }

  const teams = (assignments ?? [])
    .map((a: any) => {
      const team = Array.isArray(a.teams) ? a.teams[0] : a.teams;
      const school = Array.isArray(team?.schools) ? team.schools[0] : team?.schools;

      return {
        id: team?.id,
        team_name: team?.team_name || '—',
        sport: team?.sport || '—',
        school_name: school?.name || '—',
        title: a.title,
      };
    })
    .filter((t: any) => t.id);

  const uniqueTeams = Array.from(
    new Map(teams.map((team: any) => [team.id, team])).values()
  );

  const teamIds = uniqueTeams.map((t: any) => t.id);

  let workouts: any[] = [];
  let exercises: any[] = [];

  if (teamIds.length > 0) {
    const { data: workoutData } = await supabase
      .from('workouts')
      .select(`
        *,
        teams!workouts_team_id_fkey (
          id,
          team_name,
          sport,
          schools!teams_school_id_fkey (
            id,
            name
          )
        ),
        workout_exercises (
          id,
          sort_order,
          group_label,
          sets,
          reps,
          rest_seconds,
          percentage,
          load_notes,
          coaching_notes,
          exercise_id,
          use_advanced_loading,
          loading_method,
          uses_velocity,
          set_prescriptions,
          exercises (
            id,
            name,
            slug,
            category,
            movement_pattern,
            primary_muscle,
            equipment
          )
        )
      `)
      .in('team_id', teamIds)
      .order('created_at', { ascending: false });

    workouts = (workoutData ?? []).map((w: any) => {
      const team = Array.isArray(w.teams) ? w.teams[0] : w.teams;
      const school = Array.isArray(team?.schools) ? team.schools[0] : team?.schools;

      return {
        id: w.id,
        name: w.name,
        description: w.description,
        workout_type: w.workout_type,
        day_label: w.day_label,
        is_active: w.is_active,
        team_id: w.team_id,
        team_name: team?.team_name || '—',
        sport: team?.sport || '—',
        school_name: school?.name || '—',
        exercises: (w.workout_exercises ?? [])
          .map((we: any) => {
            const exercise = Array.isArray(we.exercises) ? we.exercises[0] : we.exercises;

            return {
              id: we.id,
              sort_order: we.sort_order,
              group_label: we.group_label,
              sets: we.sets,
              reps: we.reps,
              rest_seconds: we.rest_seconds,
              percentage: we.percentage,
              load_notes: we.load_notes,
              coaching_notes: we.coaching_notes,
              exercise_id: we.exercise_id,
              exercise_name: exercise?.name || '—',
              exercise_slug: exercise?.slug || null,
              category: exercise?.category || null,
              movement_pattern: exercise?.movement_pattern || null,
              primary_muscle: exercise?.primary_muscle || null,
              equipment: exercise?.equipment || null,
              use_advanced_loading: we.use_advanced_loading,
              loading_method: we.loading_method,
              uses_velocity: we.uses_velocity,
              set_prescriptions: we.set_prescriptions ?? null,
            };
          })
          .sort((a: any, b: any) => a.sort_order - b.sort_order),
      };
    });

    const { data: exerciseData } = await supabase
      .from('exercises')
      .select(`
        id,
        name,
        slug,
        category,
        movement_pattern,
        primary_muscle,
        equipment,
        is_system,
        coach_id
      `)
      .order('name', { ascending: true });

    exercises = exerciseData ?? [];
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-400 to-slate-700 text-white">
      <main className="flex flex-col items-center px-4 py-10 sm:px-12 sm:py-16">
        <div className="w-full max-w-[1600px] space-y-10">
          <section className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-4xl font-extrabold drop-shadow-lg sm:text-6xl">
                Workouts
              </h1>
              <p className="mt-4 max-w-3xl text-lg font-medium drop-shadow-md sm:text-2xl">
                Build workouts from your exercise library.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="rounded-lg bg-white px-5 py-3 font-semibold text-slate-800 shadow hover:scale-105 transition-transform"
            >
              Back to Dashboard
            </Link>
          </section>

          <WorkoutsClient
            teams={uniqueTeams}
            workouts={workouts}
            exercises={exercises}
          />
        </div>
      </main>
    </div>
  );
}