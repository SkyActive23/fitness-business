import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import ClassesClient from './ClassesClient';

export default async function ClassesPage() {
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
    .select('id, first_name, last_name')
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
    return <main className="p-8 text-white">Unable to load class data.</main>;
  }

  const availableTeams = (assignments ?? [])
    .map((a: any) => {
      const team = Array.isArray(a.teams) ? a.teams[0] : a.teams;
      const school = Array.isArray(team?.schools) ? team.schools[0] : team?.schools;

      return {
        id: team?.id,
        team_name: team?.team_name || '—',
        sport: team?.sport || '—',
        school_name: school?.name || '—',
        assignment_title: a.title,
      };
    })
    .filter((t: any) => t.id);

  const uniqueTeams = Array.from(
    new Map(availableTeams.map((team: any) => [team.id, team])).values()
  );

  const teamIds = uniqueTeams.map((t: any) => t.id);

  let classes: any[] = [];
  let athletes: any[] = [];
  let coaches: any[] = [];
  let workouts: any[] = [];

  if (teamIds.length > 0) {
    const { data: classesData } = await supabase
      .from('classes')
      .select(`
        *,
        teams!classes_team_id_fkey (
          id,
          team_name,
          sport,
          schools!teams_school_id_fkey (
            id,
            name
          )
        ),
        workouts (
          id,
          name,
          day_label,
          workout_type
        ),
        class_days (
          id,
          day_of_week
        ),
        class_coaches (
          id,
          role,
          coach_id,
          coaches (
            id,
            first_name,
            last_name,
            email
          )
        ),
        class_athletes (
          id,
          athlete_id,
          athletes (
            id,
            first_name,
            last_name,
            position
          )
        )
      `)
      .in('team_id', teamIds)
      .order('created_at', { ascending: false });

    classes = (classesData ?? []).map((item: any) => {
      const team = Array.isArray(item.teams) ? item.teams[0] : item.teams;
      const school = Array.isArray(team?.schools) ? team.schools[0] : team?.schools;
      const linkedWorkout = Array.isArray(item.workouts) ? item.workouts[0] : item.workouts;

      return {
        id: item.id,
        name: item.name,
        description: item.description,
        workout_type: item.workout_type,
        workout_id: item.workout_id,
        workout_name: linkedWorkout?.name || null,
        workout_day_label: linkedWorkout?.day_label || null,
        duration_minutes: item.duration_minutes,
        start_date: item.start_date,
        end_date: item.end_date,
        start_time: item.start_time,
        end_time: item.end_time,
        is_active: item.is_active,
        team_id: item.team_id,
        team_name: team?.team_name || '—',
        sport: team?.sport || '—',
        school_name: school?.name || '—',
        days: (item.class_days ?? []).map((d: any) => d.day_of_week),
        coaches: (item.class_coaches ?? []).map((c: any) => {
          const coach = Array.isArray(c.coaches) ? c.coaches[0] : c.coaches;
          return {
            id: coach?.id,
            first_name: coach?.first_name,
            last_name: coach?.last_name,
            email: coach?.email,
            role: c.role,
          };
        }),
        athletes: (item.class_athletes ?? []).map((a: any) => {
          const athlete = Array.isArray(a.athletes) ? a.athletes[0] : a.athletes;
          return {
            id: athlete?.id,
            first_name: athlete?.first_name,
            last_name: athlete?.last_name,
            position: athlete?.position,
          };
        }),
      };
    });

    const { data: athletesData } = await supabase
      .from('athletes')
      .select(`
        id,
        first_name,
        last_name,
        position,
        team_id,
        teams!athletes_team_id_fkey (
          id,
          team_name,
          sport
        )
      `)
      .in('team_id', teamIds)
      .order('last_name', { ascending: true });

    athletes = (athletesData ?? []).map((a: any) => {
      const team = Array.isArray(a.teams) ? a.teams[0] : a.teams;
      return {
        id: a.id,
        first_name: a.first_name,
        last_name: a.last_name,
        position: a.position,
        team_id: a.team_id,
        team_name: team?.team_name || '—',
        sport: team?.sport || '—',
      };
    });

    const { data: coachesData } = await supabase
      .from('coach_assignments')
      .select(`
        coach_id,
        title,
        team_id,
        coaches (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .in('team_id', teamIds);

    coaches = (coachesData ?? []).map((row: any) => {
      const coach = Array.isArray(row.coaches) ? row.coaches[0] : row.coaches;
      return {
        id: coach?.id,
        first_name: coach?.first_name,
        last_name: coach?.last_name,
        email: coach?.email,
        team_id: row.team_id,
        title: row.title,
      };
    });

    const { data: workoutsData } = await supabase
      .from('workouts')
      .select(`
        id,
        name,
        day_label,
        workout_type,
        team_id
      `)
      .in('team_id', teamIds)
      .order('created_at', { ascending: false });

    workouts = workoutsData ?? [];
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-400 to-slate-700 text-white">
      <main className="flex flex-col items-center px-4 py-10 sm:px-12 sm:py-16">
        <div className="w-full max-w-[1600px] space-y-10">
          <section className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-4xl sm:text-6xl font-extrabold drop-shadow-lg">
                Classes
              </h1>
              <p className="mt-4 text-lg sm:text-2xl font-medium drop-shadow-md max-w-3xl">
                Create and manage training classes for your teams.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="bg-white text-slate-800 font-semibold px-5 py-3 rounded-lg shadow hover:scale-105 transition-transform"
            >
              Back to Dashboard
            </Link>
          </section>

          <ClassesClient
            teams={uniqueTeams}
            classes={classes}
            athletes={athletes}
            coaches={coaches}
            workouts={workouts}
          />
        </div>
      </main>
    </div>
  );
}