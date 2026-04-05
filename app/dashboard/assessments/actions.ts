'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/app/lib/supabase/server';

type AddAssessmentInput = {
  athleteId: string;
  assessmentDate: string;
  weightLbs: string;
  squatMaxLbs: string;
  benchMaxLbs: string;
  cleanMaxLbs: string;
  sprint20m: string;
  mod505: string;
  cmj: string;
  slCmjRight: string;
  slCmjLeft: string;
  sessionNotes: string;
};

function toNullableNumber(value: string) {
  const trimmed = value.trim();
  if (trimmed === '') return null;

  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? 'INVALID' : parsed;
}

export async function addAssessment(input: AddAssessmentInput) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: 'You must be logged in.' };
  }

  const athleteId = input.athleteId.trim();
  const assessmentDate = input.assessmentDate.trim();
  const sessionNotes = input.sessionNotes.trim();

  if (!athleteId) {
    return { error: 'Athlete is required.' };
  }

  const weightLbs = toNullableNumber(input.weightLbs);
  const squatMaxLbs = toNullableNumber(input.squatMaxLbs);
  const benchMaxLbs = toNullableNumber(input.benchMaxLbs);
  const cleanMaxLbs = toNullableNumber(input.cleanMaxLbs);
  const sprint20m = toNullableNumber(input.sprint20m);
  const mod505 = toNullableNumber(input.mod505);
  const cmj = toNullableNumber(input.cmj);
  const slCmjRight = toNullableNumber(input.slCmjRight);
  const slCmjLeft = toNullableNumber(input.slCmjLeft);

  const numericValues = [
    ['weight', weightLbs],
    ['squat', squatMaxLbs],
    ['bench', benchMaxLbs],
    ['clean', cleanMaxLbs],
    ['20m sprint', sprint20m],
    ['mod 505', mod505],
    ['cmj', cmj],
    ['single leg cmj right', slCmjRight],
    ['single leg cmj left', slCmjLeft],
  ] as const;

  for (const [label, value] of numericValues) {
    if (value === 'INVALID') {
      return { error: `${label} must be a valid number.` };
    }
  }

  const { data: coach, error: coachError } = await supabase
    .from('coaches')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (coachError || !coach) {
    return { error: 'Coach profile not found.' };
  }

  // Make sure this athlete belongs to one of the coach's teams
  const { data: athlete, error: athleteError } = await supabase
    .from('athletes')
    .select('id, team_id, first_name, last_name')
    .eq('id', athleteId)
    .single();

  if (athleteError || !athlete) {
    return { error: 'Athlete not found.' };
  }

  const { data: teamLink, error: teamLinkError } = await supabase
    .from('coach_team_links')
    .select('id')
    .eq('coach_id', coach.id)
    .eq('team_id', athlete.team_id)
    .single();

  if (teamLinkError || !teamLink) {
    return { error: 'You do not have access to this athlete.' };
  }

  const { data: assessment, error: insertError } = await supabase
    .from('athlete_assessments')
    .insert({
      athlete_id: athleteId,
      assessment_date: assessmentDate || new Date().toISOString().slice(0, 10),
      weight_lbs: weightLbs,
      squat_max_lbs: squatMaxLbs,
      bench_max_lbs: benchMaxLbs,
      clean_max_lbs: cleanMaxLbs,
      sprint_20m: sprint20m,
      mod_505: mod505,
      cmj: cmj,
      sl_cmj_right: slCmjRight,
      sl_cmj_left: slCmjLeft,
      session_notes: sessionNotes || null,
    })
    .select()
    .single();

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/assessments');
  revalidatePath('/dashboard/athletes');

  return {
    success: true,
    assessment,
    athleteName: `${athlete.first_name} ${athlete.last_name}`,
  };
}