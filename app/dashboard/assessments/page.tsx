import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import AddAssessmentForm from './AddAssessmentForm';

type AthleteRow = {
  id: string;
  first_name: string;
  last_name: string;
  position: string | null;
  team_id: string;
  teams: {
    id: string;
    name: string;
  } | null;
};

type AssessmentRow = {
  id: string;
  assessment_date: string;
  weight_lbs: number | null;
  squat_max_lbs: number | null;
  bench_max_lbs: number | null;
  clean_max_lbs: number | null;
  rel_squat: number | null;
  rel_bench: number | null;
  rel_clean: number | null;
  sprint_20m: number | null;
  mod_505: number | null;
  cmj: number | null;
  sl_cmj_right: number | null;
  sl_cmj_left: number | null;
  athletes: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
};

export default async function AssessmentsPage() {
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

  const { data: teamLinks, error: teamLinksError } = await supabase
    .from('coach_team_links')
    .select('team_id')
    .eq('coach_id', coach.id);

  if (teamLinksError) {
    return <main className="p-6">Unable to load teams.</main>;
  }

  const teamIds = (teamLinks ?? []).map((link) => link.team_id);

  const { data: athletesData, error: athletesError } = await supabase
    .from('athletes')
    .select(`
      id,
      first_name,
      last_name,
      position,
      team_id,
      teams (
        id,
        name
      )
    `)
    .in('team_id', teamIds)
    .order('last_name', { ascending: true });

  const athletes = (athletesData ?? []) as unknown as AthleteRow[];

  const athleteIds = athletes.map((athlete) => athlete.id);

  let assessments: AssessmentRow[] = [];

  if (athleteIds.length > 0) {
    const { data: assessmentsData } = await supabase
      .from('athlete_assessments')
      .select(`
        id,
        assessment_date,
        weight_lbs,
        squat_max_lbs,
        bench_max_lbs,
        clean_max_lbs,
        rel_squat,
        rel_bench,
        rel_clean,
        sprint_20m,
        mod_505,
        cmj,
        sl_cmj_right,
        sl_cmj_left,
        athletes (
          id,
          first_name,
          last_name
        )
      `)
      .in('athlete_id', athleteIds)
      .order('assessment_date', { ascending: false });

    assessments = (assessmentsData ?? []) as unknown as AssessmentRow[];
  }

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Assessments</h1>
        <div className="flex gap-3">
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded bg-slate-200"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/athletes"
            className="px-4 py-2 rounded bg-slate-800 text-white"
          >
            Athletes
          </Link>
        </div>
      </div>

      <AddAssessmentForm athletes={athletes} />

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Recent Assessments</h2>

        {!assessments.length ? (
          <p>No assessments yet.</p>
        ) : (
          <div className="grid gap-4">
            {assessments.map((assessment) => {
              const athlete = assessment.athletes;

              return (
                <div key={assessment.id} className="border rounded p-4">
                  <h3 className="text-xl font-semibold">
                    {athlete
                      ? `${athlete.first_name} ${athlete.last_name}`
                      : 'Unknown Athlete'}
                  </h3>

                  <p>Date: {assessment.assessment_date}</p>
                  <p>Weight: {assessment.weight_lbs ?? '—'}</p>
                  <p>Squat: {assessment.squat_max_lbs ?? '—'}</p>
                  <p>Bench: {assessment.bench_max_lbs ?? '—'}</p>
                  <p>Clean: {assessment.clean_max_lbs ?? '—'}</p>
                  <p>Rel Squat: {assessment.rel_squat ?? '—'}</p>
                  <p>Rel Bench: {assessment.rel_bench ?? '—'}</p>
                  <p>Rel Clean: {assessment.rel_clean ?? '—'}</p>
                  <p>20m: {assessment.sprint_20m ?? '—'}</p>
                  <p>Mod 505: {assessment.mod_505 ?? '—'}</p>
                  <p>CMJ: {assessment.cmj ?? '—'}</p>
                  <p>SL CMJ Right: {assessment.sl_cmj_right ?? '—'}</p>
                  <p>SL CMJ Left: {assessment.sl_cmj_left ?? '—'}</p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}