import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../../../lib/supabase/server';
import AthleteRadarChart from './AthleteRadarChart';
import { buildRadarScores } from '../../../../lib/norms';

type Athlete = {
  id: string;
  first_name: string;
  last_name: string;
  position: string | null;
  height: string | null;
  weight: number | null;
  team_id: string;
  teams: {
    id: string;
    team_name: string;
    sport: string | null;
    schools: {
      id: string;
      name: string;
    } | null;
  } | null;
};

type Assessment = {
  id: string;
  assessment_date: string | null;
  squat: number | null;
  bench: number | null;
  clean: number | null;
  cmj: number | null;
  single_leg_cmj_right: number | null;
  single_leg_cmj_left: number | null;
  sprint_20m: number | null;
  mod_505: number | null;
  created_at: string | null;
};

type RadarDatum = {
  metric: string;
  score: number;
  label: string;
  raw: number | null;
};

function formatNumber(value: number | null | undefined, digits = 2) {
  if (value === null || value === undefined) return '—';
  return Number(value).toFixed(digits);
}

function displayValue(value: string | number | null | undefined) {
  return value === null || value === undefined || value === '' ? '—' : value;
}

export default async function AthleteProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const { data: athleteData, error: athleteError } = await supabase
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
      )
    `)
    .eq('id', id)
    .single();

  if (athleteError || !athleteData) {
    return <main className="p-6 text-white">Athlete not found.</main>;
  }

  const rawTeam = Array.isArray(athleteData.teams)
    ? athleteData.teams[0]
    : athleteData.teams;

  const normalizedSchool = rawTeam
    ? Array.isArray(rawTeam.schools)
      ? rawTeam.schools[0] ?? null
      : rawTeam.schools ?? null
    : null;

  const athlete: Athlete = {
    id: athleteData.id,
    first_name: athleteData.first_name,
    last_name: athleteData.last_name,
    position: athleteData.position,
    height: athleteData.height,
    weight: athleteData.weight,
    team_id: athleteData.team_id,
    teams: rawTeam
      ? {
          id: rawTeam.id,
          team_name: rawTeam.team_name,
          sport: rawTeam.sport,
          schools: normalizedSchool,
        }
      : null,
  };

  const { data: teamAccess, error: teamAccessError } = await supabase
    .from('coach_assignments')
    .select('id')
    .eq('coach_id', coach.id)
    .eq('team_id', athlete.team_id)
    .single();

  if (teamAccessError || !teamAccess) {
    return <main className="p-6 text-white">You do not have access to this athlete.</main>;
  }

  const { data: assessmentsData, error: assessmentsError } = await supabase
    .from('athlete_assessments')
    .select(`
      id,
      assessment_date,
      squat,
      bench,
      clean,
      cmj,
      single_leg_cmj_right,
      single_leg_cmj_left,
      sprint_20m,
      mod_505,
      created_at
    `)
    .eq('athlete_id', athlete.id)
    .order('assessment_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (assessmentsError) {
    return <main className="p-6 text-white">Unable to load assessment history.</main>;
  }

  const assessments = (assessmentsData ?? []) as Assessment[];
  const latest = assessments.length > 0 ? assessments[0] : null;

  const radarData: RadarDatum[] =
    latest
      ? buildRadarScores({
          cmj: latest.cmj,
          mod_505: latest.mod_505,
          sprint_20m: latest.sprint_20m,
          squat_max_lbs: latest.squat,
          bench_max_lbs: latest.bench,
          clean_max_lbs: latest.clean,
        })
      : [];

  const schoolName = athlete.teams?.schools?.name || '—';
  const teamName = athlete.teams?.team_name || '—';
  const sportName = athlete.teams?.sport || '—';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-400 to-slate-700 text-white">
      <main className="flex flex-col items-center px-4 py-10 sm:px-12 sm:py-16">
        <div className="w-full max-w-[1600px] space-y-10">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="bg-white text-slate-800 font-semibold px-5 py-3 rounded-lg shadow hover:scale-105 active:scale-95 transition-transform"
            >
              Back to Dashboard
            </Link>

            <Link
              href={`/dashboard/athletes/sport/${encodeURIComponent(sportName)}`}
              className="bg-white text-slate-800 font-semibold px-5 py-3 rounded-lg shadow hover:scale-105 active:scale-95 transition-transform"
            >
              Back to Sport
            </Link>

            <Link
              href="/dashboard/athletes"
              className="bg-white text-slate-800 font-semibold px-5 py-3 rounded-lg shadow hover:scale-105 active:scale-95 transition-transform"
            >
              All Athletes
            </Link>
          </div>

          <section className="w-full bg-slate-800 rounded-lg py-8 px-4 sm:px-8 shadow-xl">
            <h1 className="text-4xl sm:text-5xl font-extrabold drop-shadow-lg">
              {athlete.first_name} {athlete.last_name}
            </h1>

            <div className="mt-6 grid gap-4 md:grid-cols-2 text-slate-200">
              <p>
                <span className="font-semibold text-white">Sport:</span> {sportName}
              </p>
              <p>
                <span className="font-semibold text-white">Team:</span> {teamName}
              </p>
              <p>
                <span className="font-semibold text-white">School:</span> {schoolName}
              </p>
              <p>
                <span className="font-semibold text-white">Position:</span>{' '}
                {displayValue(athlete.position)}
              </p>
              <p>
                <span className="font-semibold text-white">Height:</span>{' '}
                {displayValue(athlete.height)}
              </p>
              <p>
                <span className="font-semibold text-white">Weight:</span>{' '}
                {displayValue(athlete.weight)}
              </p>
            </div>
          </section>

          <section className="w-full bg-slate-800 rounded-lg py-8 px-4 sm:px-8 shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-bold">Latest Assessment</h2>

            {!latest ? (
              <p className="mt-4 text-slate-200">No assessments found yet.</p>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3 text-slate-200">
                <p>
                  <span className="font-semibold text-white">Date:</span>{' '}
                  {displayValue(latest.assessment_date)}
                </p>
                <p>
                  <span className="font-semibold text-white">Squat:</span>{' '}
                  {formatNumber(latest.squat)}
                </p>
                <p>
                  <span className="font-semibold text-white">Bench:</span>{' '}
                  {formatNumber(latest.bench)}
                </p>
                <p>
                  <span className="font-semibold text-white">Clean:</span>{' '}
                  {formatNumber(latest.clean)}
                </p>
                <p>
                  <span className="font-semibold text-white">20m:</span>{' '}
                  {formatNumber(latest.sprint_20m, 3)}
                </p>
                <p>
                  <span className="font-semibold text-white">Mod 505:</span>{' '}
                  {formatNumber(latest.mod_505, 3)}
                </p>
                <p>
                  <span className="font-semibold text-white">CMJ:</span>{' '}
                  {formatNumber(latest.cmj)}
                </p>
                <p>
                  <span className="font-semibold text-white">SL CMJ Right:</span>{' '}
                  {formatNumber(latest.single_leg_cmj_right)}
                </p>
                <p>
                  <span className="font-semibold text-white">SL CMJ Left:</span>{' '}
                  {formatNumber(latest.single_leg_cmj_left)}
                </p>
              </div>
            )}
          </section>

          <section className="w-full bg-slate-800 rounded-lg py-8 px-4 sm:px-8 shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-bold">Performance Spider Chart</h2>

            {!latest ? (
              <p className="mt-4 text-slate-200">No assessment data available yet.</p>
            ) : radarData.length === 0 ? (
              <p className="mt-4 text-slate-200">Assessment data loaded, but radar scores could not be built.</p>
            ) : (
              <div className="mt-6 space-y-6">
                <AthleteRadarChart data={radarData} />

                <div className="grid gap-2 sm:grid-cols-5 text-sm text-slate-200">
                  <div className="rounded bg-slate-700 px-3 py-2 text-center">1 = Poor</div>
                  <div className="rounded bg-slate-700 px-3 py-2 text-center">
                    2 = Below Average
                  </div>
                  <div className="rounded bg-slate-700 px-3 py-2 text-center">3 = Average</div>
                  <div className="rounded bg-slate-700 px-3 py-2 text-center">4 = Good</div>
                  <div className="rounded bg-slate-700 px-3 py-2 text-center">5 = Elite</div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 text-slate-200">
                  <div className="rounded bg-slate-700 px-3 py-2">
                    <span className="font-semibold text-white">CMJ input:</span>{' '}
                    {displayValue(latest.cmj)}
                  </div>
                  <div className="rounded bg-slate-700 px-3 py-2">
                    <span className="font-semibold text-white">505 input:</span>{' '}
                    {displayValue(latest.mod_505)}
                  </div>
                  <div className="rounded bg-slate-700 px-3 py-2">
                    <span className="font-semibold text-white">20m input:</span>{' '}
                    {displayValue(latest.sprint_20m)}
                  </div>
                  <div className="rounded bg-slate-700 px-3 py-2">
                    <span className="font-semibold text-white">Squat input:</span>{' '}
                    {displayValue(latest.squat)}
                  </div>
                  <div className="rounded bg-slate-700 px-3 py-2">
                    <span className="font-semibold text-white">Bench input:</span>{' '}
                    {displayValue(latest.bench)}
                  </div>
                  <div className="rounded bg-slate-700 px-3 py-2">
                    <span className="font-semibold text-white">Clean input:</span>{' '}
                    {displayValue(latest.clean)}
                  </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-600 bg-slate-700 shadow-lg">
                  <table className="min-w-full text-sm text-white">
                    <thead className="bg-slate-900">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Metric</th>
                        <th className="px-4 py-3 text-left font-semibold">Raw</th>
                        <th className="px-4 py-3 text-left font-semibold">Score</th>
                        <th className="px-4 py-3 text-left font-semibold">Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {radarData.map((item, index) => (
                        <tr
                          key={item.metric}
                          className={index % 2 === 0 ? 'bg-slate-700' : 'bg-slate-600'}
                        >
                          <td className="px-4 py-3">{item.metric}</td>
                          <td className="px-4 py-3">{item.raw ?? '—'}</td>
                          <td className="px-4 py-3">{item.score}</td>
                          <td className="px-4 py-3">{item.label}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          <section className="w-full bg-slate-800 rounded-lg py-8 px-4 sm:px-8 shadow-xl space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold">Assessment History</h2>

            {!assessments.length ? (
              <p className="text-slate-200">No assessment history found.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-600 bg-slate-700 shadow-lg">
                <table className="min-w-full text-sm text-white">
                  <thead className="bg-slate-900">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Date</th>
                      <th className="px-4 py-3 text-left font-semibold">Squat</th>
                      <th className="px-4 py-3 text-left font-semibold">Bench</th>
                      <th className="px-4 py-3 text-left font-semibold">Clean</th>
                      <th className="px-4 py-3 text-left font-semibold">20m</th>
                      <th className="px-4 py-3 text-left font-semibold">Mod 505</th>
                      <th className="px-4 py-3 text-left font-semibold">CMJ</th>
                      <th className="px-4 py-3 text-left font-semibold">SL CMJ R</th>
                      <th className="px-4 py-3 text-left font-semibold">SL CMJ L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessments.map((assessment, index) => (
                      <tr
                        key={assessment.id}
                        className={index % 2 === 0 ? 'bg-slate-700' : 'bg-slate-600'}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          {displayValue(assessment.assessment_date)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {formatNumber(assessment.squat)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {formatNumber(assessment.bench)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {formatNumber(assessment.clean)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {formatNumber(assessment.sprint_20m, 3)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {formatNumber(assessment.mod_505, 3)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {formatNumber(assessment.cmj)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {formatNumber(assessment.single_leg_cmj_right)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {formatNumber(assessment.single_leg_cmj_left)}
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