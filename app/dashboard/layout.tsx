import { redirect } from 'next/navigation';
import { createClient } from '../lib/supabase/server';
import SignedInNavbar from '@/app/Components/Nav/SignedInNavbar';
import DashboardSidebar from '@/app/Components/Nav/DashboardSidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  const { data: assignmentsData } = await supabase
    .from('coach_assignments')
    .select(`
      id,
      teams!coach_assignments_team_id_fkey (
        id,
        team_name,
        sport
      )
    `)
    .eq('coach_id', coach.id);

  const assignments = (assignmentsData ?? []).map((row: any) => ({
    ...row,
    teams: Array.isArray(row.teams) ? row.teams[0] : row.teams,
  }));

  const sports: string[] = Array.from(
    new Set(
      assignments
        .map((a: any) => a.teams?.sport)
        .filter(
          (sport: unknown): sport is string =>
            typeof sport === 'string' && sport.length > 0
        )
    )
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-400 to-slate-700 text-white">
      <SignedInNavbar
        coachName={`${coach.first_name} ${coach.last_name}`}
        coachEmail={coach.email}
        sports={sports}
      />

      <div className="flex">
        <DashboardSidebar sports={sports} />

        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}