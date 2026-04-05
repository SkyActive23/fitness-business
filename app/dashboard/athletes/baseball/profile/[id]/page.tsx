import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import BaseballRadarChart from './BaseballRadarChart';
import { buildBaseballRadarScores } from '@/app/lib/baseballNorms';

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
  best_vertical_in: number | null;
  grip_l: number | null;
  grip_r: number | null;
  grip_avg: number | null;
  yd_60: number | null;
  yd_40: number | null;
  bench: number | null;
  squat: number | null;
  trap_bar_dl: number | null;
  rel_bench: number | null;
  rel_squat: number | null;
  rel_dl: number | null;
  session_notes: string | null;
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

export default async function BaseballAthleteProfilePage({
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
      ? buildBaseballRadarScores({
          best_vertical_in: latest.best_vertical_in,
          grip_avg: latest.grip_avg,
          yd_60: latest.yd_60,
          squat: latest.squat,
          bench: latest.bench,
          trap_bar_dl: latest.trap_bar_dl,
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
              href={`/dashboard/athletes/baseball`}
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
                  <span className="font-semibold text-white">Vertical:</span>{' '}
                  {formatNumber(latest.best_vertical_in)}
                </p>
                <p>
                  <span className="font-semibold text-white">Grip L:</span>{' '}
                  {formatNumber(latest.grip_l)}
                </p>
                <p>
                  <span className="font-semibold text-white">Grip R:</span>{' '}
                  {formatNumber(latest.grip_r)}
                </p>
                <p>
                  <span className="font-semibold text-white">Grip Avg:</span>{' '}
                  {formatNumber(latest.grip_avg)}
                </p>
                <p>
                  <span className="font-semibold text-white">60 yd:</span>{' '}
                  {formatNumber(latest.yd_60, 2)}
                </p>
                <p>
                  <span className="font-semibold text-white">40 yd:</span>{' '}
                  {formatNumber(latest.yd_40, 2)}
                </p>
                <p>
                  <span className="font-semibold text-white">Bench:</span>{' '}
                  {formatNumber(latest.bench)}
                </p>
                <p>
                  <span className="font-semibold text-white">Squat:</span>{' '}
                  {formatNumber(latest.squat)}
                </p>
                <p>
                  <span className="font-semibold text-white">Trap Bar DL:</span>{' '}
                  {formatNumber(latest.trap_bar_dl)}
                </p>
                <p>
                  <span className="font-semibold text-white">Rel Bench:</span>{' '}
                  {formatNumber(latest.rel_bench, 2)}
                </p>
                <p>
                  <span className="font-semibold text-white">Rel Squat:</span>{' '}
                  {formatNumber(latest.rel_squat, 2)}
                </p>
                <p>
                  <span className="font-semibold text-white">Rel DL:</span>{' '}
                  {formatNumber(latest.rel_dl, 2)}
                </p>
              </div>
            )}
          </section>

          <section className="w-full bg-slate-800 rounded-lg py-8 px-4 sm:px-8 shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-bold">Performance Spider Chart</h2>

            {!latest ? (
              <p className="mt-4 text-slate-200">No assessment data available yet.</p>
            ) : radarData.length === 0 ? (
              <p className="mt-4 text-slate-200">
                Assessment data loaded, but radar scores could not be built.
              </p>
            ) : (
              <div className="mt-6 space-y-6">
                <BaseballRadarChart data={radarData} />

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
                    <span className="font-semibold text-white">Vertical input:</span>{' '}
                    {displayValue(latest.best_vertical_in)}
                  </div>
                  <div className="rounded bg-slate-700 px-3 py-2">
                    <span className="font-semibold text-white">Grip Avg input:</span>{' '}
                    {displayValue(latest.grip_avg)}
                  </div>
                  <div className="rounded bg-slate-700 px-3 py-2">
                    <span className="font-semibold text-white">60 yd input:</span>{' '}
                    {displayValue(latest.yd_60)}
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
                    <span className="font-semibold text-white">Trap Bar DL input:</span>{' '}
                    {displayValue(latest.trap_bar_dl)}
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
                      <th className="px-4 py-3 text-left font-semibold">Vertical</th>
                      <th className="px-4 py-3 text-left font-semibold">Grip L</th>
                      <th className="px-4 py-3 text-left font-semibold">Grip R</th>
                      <th className="px-4 py-3 text-left font-semibold">Grip Avg</th>
                      <th className="px-4 py-3 text-left font-semibold">60 yd</th>
                      <th className="px-4 py-3 text-left font-semibold">40 yd</th>
                      <th className="px-4 py-3 text-left font-semibold">Bench</th>
                      <th className="px-4 py-3 text-left font-semibold">Squat</th>
                      <th className="px-4 py-3 text-left font-semibold">Trap Bar DL</th>
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
                          {formatNumber(assessment.best_vertical_in)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {formatNumber(assessment.grip_l)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {formatNumber(assessment.grip_r)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {formatNumber(assessment.grip_avg)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {formatNumber(assessment.yd_60, 2)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {formatNumber(assessment.yd_40, 2)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {formatNumber(assessment.bench)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {formatNumber(assessment.squat)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {formatNumber(assessment.trap_bar_dl)}
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