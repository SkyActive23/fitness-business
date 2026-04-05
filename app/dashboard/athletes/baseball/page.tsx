import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import BaseballAssessmentsPanel from './BaseballAssessmentsPanel';
import BaseballAssessmentTable from './BaseballAssessmentTable';

export default async function BaseballAthletesPage() {
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

  const { data: myAssignments, error: myAssignmentsError } = await supabase
    .from('coach_assignments')
    .select(`
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

  if (myAssignmentsError) {
    return <main className="p-8 text-white">Unable to load teams.</main>;
  }

  const availableTeams = (myAssignments ?? [])
    .map((a: any) => {
      const team = Array.isArray(a.teams) ? a.teams[0] : a.teams;
      const school = Array.isArray(team?.schools) ? team.schools[0] : team?.schools;

      return {
        id: team?.id,
        team_name: team?.team_name,
        sport: team?.sport,
        school_name: school?.name || '—',
      };
    })
    .filter((t: any) => t.id && t.sport === 'Baseball');

  const uniqueTeams = Array.from(
    new Map(availableTeams.map((team: any) => [team.id, team])).values()
  );

  const teamIds = uniqueTeams.map((t: any) => t.id);

  let athletes: any[] = [];

  if (teamIds.length > 0) {
    const { data: athletesData, error: athletesError } = await supabase
      .from('athletes')
      .select(`
        id,
        first_name,
        last_name,
        position,
        height,
        weight,
        team_id,
        teams!athletes_team_id_fkey (
          id,
          team_name,
          sport,
          schools!teams_school_id_fkey (
            id,
            name
          )
        ),
        athlete_assessments (
  id,
  assessment_date,
  best_vertical_in,
  grip_l,
  grip_r,
  grip_avg,
  yd_60,
  yd_40,
  bench,
  squat,
  trap_bar_dl,
  rel_bench,
  rel_squat,
  rel_dl,
  session_notes,
  created_at
)
      `)
      .in('team_id', teamIds)
      .order('last_name', { ascending: true });

    if (athletesError) {
      return <main className="p-8 text-white">Unable to load baseball athletes.</main>;
    }

    athletes = (athletesData ?? []).map((a: any) => {
      const team = Array.isArray(a.teams) ? a.teams[0] : a.teams;
      const school = Array.isArray(team?.schools) ? team.schools[0] : team?.schools;

      const assessments = [...(a.athlete_assessments ?? [])].sort((x: any, y: any) => {
  const dx = new Date(x.assessment_date || x.created_at).getTime();
  const dy = new Date(y.assessment_date || y.created_at).getTime();
  return dy - dx;
});

return {
  id: a.id,
  first_name: a.first_name,
  last_name: a.last_name,
  position: a.position,
  height: a.height,
  weight: a.weight,
  team_id: a.team_id,
  team_name: team?.team_name || '—',
  sport: team?.sport || '—',
  school_name: school?.name || '—',
  latest_assessment: assessments[0] ?? null,
  assessments,
};

    });
    console.log(JSON.stringify(athletes, null, 2));
  }

  const athleteOptions = athletes.map((a: any) => ({
    id: a.id,
    first_name: a.first_name,
    last_name: a.last_name,
    team_name: a.team_name,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-400 to-slate-700 text-white">
      <main className="flex flex-col items-center px-4 py-10 sm:px-12 sm:py-16">
        <div className="w-full max-w-[1600px] space-y-10">
          <section className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl sm:text-6xl font-extrabold drop-shadow-lg">
                Baseball
              </h1>
              <p className="mt-4 text-lg sm:text-2xl font-medium drop-shadow-md max-w-3xl">
                Baseball athlete testing and assessment data.
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                href="/dashboard/athletes"
                className="bg-white text-slate-800 font-semibold px-5 py-3 rounded-lg shadow hover:scale-105 transition-transform"
              >
                All Athletes
              </Link>

              <Link
                href="/dashboard"
                className="bg-white text-slate-800 font-semibold px-5 py-3 rounded-lg shadow hover:scale-105 transition-transform"
              >
                Back to Dashboard
              </Link>
            </div>
          </section>

          <BaseballAssessmentsPanel athletes={athleteOptions} />
          <BaseballAssessmentTable athletes={athletes} />
        </div>
      </main>
    </div>
  );
}