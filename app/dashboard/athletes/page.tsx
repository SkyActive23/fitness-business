import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import AthletesTable from './AthletesTable';

export default async function AthletesPage() {
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
      title,
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
        title: a.title,
      };
    })
    .filter((t: any) => t.id);

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
        height,
        weight,
        position,
        team_id,
        teams!athletes_team_id_fkey (
          id,
          team_name,
          sport,
          schools!teams_school_id_fkey (
            id,
            name
          )
        )
      `)
      .in('team_id', teamIds)
      .order('last_name', { ascending: true });

    if (athletesError) {
      return <main className="p-8 text-white">Unable to load athletes.</main>;
    }

    athletes = (athletesData ?? []).map((a: any) => {
      const team = Array.isArray(a.teams) ? a.teams[0] : a.teams;
      const school = Array.isArray(team?.schools) ? team.schools[0] : team?.schools;
      return {
        id: a.id,
        first_name: a.first_name,
        last_name: a.last_name,
        height: a.height,
        weight: a.weight,
        position: a.position,
        team_id: a.team_id,
        team_name: team?.team_name || '—',
        sport: team?.sport || '—',
        school_name: school?.name || '—',
      };
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-400 to-slate-700 text-white">
      <main className="flex flex-col items-center px-4 py-10 sm:px-12 sm:py-16">
        <div className="w-full max-w-[1400px] space-y-10">
          <section className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl sm:text-6xl font-extrabold drop-shadow-lg">
                Athletes
              </h1>
              <p className="mt-4 text-lg sm:text-2xl font-medium drop-shadow-md max-w-3xl">
                Add and manage athletes for all teams you coach.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="bg-white text-slate-800 font-semibold px-5 py-3 rounded-lg shadow hover:scale-105 transition-transform"
            >
              Back to Dashboard
            </Link>
          </section>

          <AthletesTable teams={uniqueTeams} athletes={athletes} />
        </div>
      </main>
    </div>
  );
}