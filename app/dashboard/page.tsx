import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../lib/supabase/server';
// import { logoutCoach } from '../auth/actions';

type CoachProfile = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
};

type AssignmentRow = {
  id: string;
  title: 'Head Coach' | 'Assistant Coach';
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

export default async function DashboardPage() {
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
    .select('id, first_name, last_name, email')
    .eq('auth_user_id', user.id)
    .single();

  if (coachError || !coach) {
    redirect('/auth/login');
  }

  const { data: assignmentsData, error: assignmentsError } = await supabase
    .from('coach_assignments')
    .select(`
      id,
      title,
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
    .eq('coach_id', coach.id)
    .order('title', { ascending: true });

  if (assignmentsError) {
    console.error('DASHBOARD ASSIGNMENTS ERROR:', assignmentsError);
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-400 to-slate-700 text-white p-8">
        Unable to load dashboard.
      </main>
    );
  }

  const assignments = (assignmentsData ?? []).map((row: any) => ({
    ...row,
    teams: Array.isArray(row.teams) ? row.teams[0] : row.teams,
  })) as AssignmentRow[];

  const sports = Array.from(
    new Set(assignments.map((a) => a.teams?.sport).filter(Boolean))
  );

  const schools = Array.from(
    new Set(assignments.map((a) => a.teams?.schools?.name).filter(Boolean))
  );

  const teams = Array.from(
    new Set(assignments.map((a) => a.teams?.team_name).filter(Boolean))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-400 to-slate-700 text-white">
      <main className="flex flex-col items-center px-4 py-10 sm:px-12 sm:py-16">
        <div className="w-full max-w-[1400px] space-y-10">
          <section className="flex flex-col gap-6 text-center sm:text-left">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h1 className="text-4xl sm:text-6xl font-extrabold drop-shadow-lg">
                  Coach Dashboard
                </h1>
                <p className="mt-4 text-lg sm:text-2xl font-medium drop-shadow-md max-w-3xl">
                  Welcome back, {coach.first_name} {coach.last_name}
                </p>
                <p className="mt-2 text-base sm:text-lg text-slate-100">
                  {coach.email}
                </p>
              </div>

              {/* <form action={logoutCoach}>
                <button
                  type="submit"
                  className="bg-white text-slate-800 font-semibold px-5 py-3 rounded-lg shadow hover:scale-105 active:scale-95 transition-transform"
                >
                  Logout
                </button>
              </form> */}
            </div>
          </section>

          <section className="w-full bg-slate-800 rounded-lg py-8 px-4 sm:px-8 shadow-xl">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-slate-700 p-5 shadow-lg">
                <h2 className="text-xl font-bold">Schools</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {schools.length ? (
                    schools.map((school) => (
                      <span
                        key={school}
                        className="bg-white text-slate-800 px-3 py-1 rounded-full text-sm font-semibold"
                      >
                        {school}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-300">No schools assigned</span>
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-slate-700 p-5 shadow-lg">
                <h2 className="text-xl font-bold">Teams</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {teams.length ? (
                    teams.map((team) => (
                      <span
                        key={team}
                        className="bg-white text-slate-800 px-3 py-1 rounded-full text-sm font-semibold"
                      >
                        {team}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-300">No teams assigned</span>
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-slate-700 p-5 shadow-lg">
  <h2 className="text-xl font-bold">Sports</h2>
  <div className="mt-3 flex flex-wrap gap-2">
  {sports.length ? (
    sports.map((sport) => {
      const normalizedSport = (sport ?? '').toLowerCase();

      const href =
        normalizedSport === 'baseball'
          ? '/dashboard/athletes/baseball'
          : `/dashboard/athletes/sport/${encodeURIComponent(sport ?? '')}`;

      return (
        <Link
          key={sport}
          href={href}
          className="bg-white text-slate-800 px-3 py-1 rounded-full text-sm font-semibold hover:scale-105 transition"
        >
          {sport}
        </Link>
      );
    })
  ) : (
    <span className="text-slate-300">No sports assigned</span>
  )}
</div>
</div>
            </div>
          </section>

          <section className="w-full bg-slate-800 rounded-lg py-8 px-4 sm:px-8 shadow-xl">
            <div className="flex flex-wrap gap-4">
              <Link
                href="/dashboard/coaches"
                className="bg-white text-slate-800 font-semibold px-5 py-3 rounded-lg shadow hover:scale-105 active:scale-95 transition-transform"
              >
                Manage Coaches
              </Link>
              <Link
  href="/dashboard/athletes"
  className="bg-white text-slate-800 font-semibold px-5 py-3 rounded-lg shadow hover:scale-105 active:scale-95 transition-transform"
>
  Manage Athletes
</Link>
            </div>
          </section>

          <section className="w-full bg-slate-800 rounded-lg py-8 px-4 sm:px-8 shadow-xl space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                My Assignments
              </h2>
            </div>

            {!assignments.length ? (
              <p className="text-slate-200">No assignments found yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-600 bg-slate-700 shadow-lg">
                <table className="min-w-full text-sm text-white">
                  <thead className="bg-slate-900">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Title</th>
                      <th className="px-4 py-3 text-left font-semibold">School</th>
                      <th className="px-4 py-3 text-left font-semibold">Team</th>
                      <th className="px-4 py-3 text-left font-semibold">Sport</th>
                    </tr>
                  </thead>
                  <tbody>
  {assignments.map((assignment, index) => (
    <tr
      key={assignment.id}
      className={index % 2 === 0 ? 'bg-slate-700' : 'bg-slate-600'}
    >
      <td className="px-4 py-3 whitespace-nowrap">{assignment.title}</td>
      <td className="px-4 py-3 whitespace-nowrap">
        {assignment.teams?.schools?.name || '—'}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        {assignment.teams?.team_name || '—'}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        {assignment.teams?.sport || '—'}
      </td>
    </tr>
  ))}
</tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}