import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import CoachesTable from './CoachesTable';

type RawRow = {
  assignment_id: string;
  title: 'Head Coach' | 'Assistant Coach';
  coaches: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  teams: {
    id: string;
    team_name: string;
    sport: string;
    join_code: string;
    schools: {
      id: string;
      name: string;
    } | null;
  } | null;
};

export default async function CoachesPage() {
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
    .select('team_id')
    .eq('coach_id', me.id);

  if (myAssignmentsError) {
    console.error('COACHES PAGE MY ASSIGNMENTS ERROR:', myAssignmentsError);
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-400 to-slate-700 text-white p-8">
        Unable to load your assignments.
      </main>
    );
  }

  const teamIds = (myAssignments ?? []).map((a) => a.team_id);

  let rawRows: RawRow[] = [];

  if (teamIds.length > 0) {
    const { data: rows, error: rowsError } = await supabase
      .from('coach_assignments')
      .select(`
        id,
        title,
        coaches!coach_assignments_coach_id_fkey (
          id,
          first_name,
          last_name,
          email
        ),
        teams!coach_assignments_team_id_fkey (
          id,
          team_name,
          sport,
          join_code,
          schools!teams_school_id_fkey (
            id,
            name
          )
        )
      `)
      .in('team_id', teamIds)
      .order('title', { ascending: true });

    if (rowsError) {
      console.error('COACHES PAGE ROWS ERROR:', rowsError);
      return (
        <main className="min-h-screen bg-gradient-to-br from-slate-400 to-slate-700 text-white p-8">
          Unable to load coaches.
        </main>
      );
    }

    rawRows = (rows ?? []).map((row: any) => ({
      assignment_id: row.id,
      title: row.title,
      coaches: Array.isArray(row.coaches) ? row.coaches[0] : row.coaches,
      teams: Array.isArray(row.teams) ? row.teams[0] : row.teams,
    }));
  }

  const grouped = Object.values(
    rawRows.reduce((acc, row) => {
      if (!row.coaches || !row.teams) return acc;

      if (!acc[row.coaches.id]) {
        acc[row.coaches.id] = {
          coach_id: row.coaches.id,
          first_name: row.coaches.first_name,
          last_name: row.coaches.last_name,
          email: row.coaches.email,
          assignments: [],
        };
      }

      const school = Array.isArray(row.teams.schools)
        ? row.teams.schools[0]
        : row.teams.schools;

      acc[row.coaches.id].assignments.push({
        assignment_id: row.assignment_id,
        title: row.title,
        school_name: school?.name || '—',
        team_id: row.teams.id,
        team_name: row.teams.team_name,
        sport: row.teams.sport,
        join_code: row.teams.join_code,
      });

      return acc;
    }, {} as Record<string, any>)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-400 to-slate-700 text-white">
      <main className="flex flex-col items-center px-4 py-10 sm:px-12 sm:py-16">
        <div className="w-full max-w-[1400px] space-y-10">
          <section className="flex flex-col gap-6 text-center sm:text-left">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h1 className="text-4xl sm:text-6xl font-extrabold drop-shadow-lg">
                  Coaches
                </h1>
                <p className="mt-4 text-lg sm:text-2xl font-medium drop-shadow-md max-w-3xl">
                  Manage all coaches, assistant coaches, assignments, and titles.
                </p>
              </div>

              <Link
                href="/dashboard"
                className="bg-white text-slate-800 font-semibold px-5 py-3 rounded-lg shadow hover:scale-105 active:scale-95 transition-transform"
              >
                Back to Dashboard
              </Link>
            </div>
          </section>

          <CoachesTable coaches={grouped} />
        </div>
      </main>
    </div>
  );
}