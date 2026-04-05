'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '../../../lib/supabase/server';

type CreateAssessmentInput = {
  athleteId: string;
  assessmentDate: string;
  squat: string;
  bench: string;
  clean: string;
  cmj: string;
  singleLegCmjRight: string;
  singleLegCmjLeft: string;
  sprint20m: string;
  mod505: string;
};

type UpdateAssessmentInput = {
  assessmentId: string;
  assessmentDate: string;
  squat: string;
  bench: string;
  clean: string;
  cmj: string;
  singleLegCmjRight: string;
  singleLegCmjLeft: string;
  sprint20m: string;
  mod505: string;
};

const ALLOWED_SOCCER_SPORTS = ["Men's Soccer", "Women's Soccer"];

function toNumberOrNull(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  return Number.isNaN(num) ? null : num;
}

async function getCurrentCoach() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: 'You must be logged in.', supabase };
  }

  const { data: me, error: meError } = await supabase
    .from('coaches')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (meError || !me) {
    return { error: 'Coach profile not found.', supabase };
  }

  return { supabase, me };
}

export async function createAssessment(input: CreateAssessmentInput) {
  const athleteId = input.athleteId.trim();

  if (!athleteId) {
    return { error: 'Athlete is required.' };
  }

  const ctx = await getCurrentCoach();
  if ('error' in ctx) return { error: ctx.error };

  const { supabase, me } = ctx;

  const { data: athlete, error: athleteError } = await supabase
    .from('athletes')
    .select(`
      id,
      team_id,
      teams!athletes_team_id_fkey (
        id,
        sport
      )
    `)
    .eq('id', athleteId)
    .single();

  if (athleteError || !athlete) {
    return { error: 'Athlete not found.' };
  }

  const team = Array.isArray(athlete.teams) ? athlete.teams[0] : athlete.teams;
  const athleteSport = team?.sport ?? '';

  if (!ALLOWED_SOCCER_SPORTS.includes(athleteSport)) {
    return { error: 'Assessments on this page are only available for soccer athletes.' };
  }

  const { data: assignment, error: assignmentError } = await supabase
    .from('coach_assignments')
    .select('id')
    .eq('coach_id', me.id)
    .eq('team_id', athlete.team_id)
    .single();

  if (assignmentError || !assignment) {
    return { error: 'You do not have access to this athlete.' };
  }

  const { error } = await supabase.from('athlete_assessments').insert({
    athlete_id: athleteId,
    assessment_date: input.assessmentDate || undefined,
    squat: toNumberOrNull(input.squat),
    bench: toNumberOrNull(input.bench),
    clean: toNumberOrNull(input.clean),
    cmj: toNumberOrNull(input.cmj),
    single_leg_cmj_right: toNumberOrNull(input.singleLegCmjRight),
    single_leg_cmj_left: toNumberOrNull(input.singleLegCmjLeft),
    sprint_20m: toNumberOrNull(input.sprint20m),
    mod_505: toNumberOrNull(input.mod505),
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/athletes');
  revalidatePath('/dashboard/athletes/sport');

  return { success: true };
}

export async function updateAssessment(input: UpdateAssessmentInput) {
  const assessmentId = input.assessmentId.trim();

  if (!assessmentId) {
    return { error: 'Assessment is required.' };
  }

  const ctx = await getCurrentCoach();
  if ('error' in ctx) return { error: ctx.error };

  const { supabase, me } = ctx;

  const { data: assessment, error: assessmentError } = await supabase
    .from('athlete_assessments')
    .select(`
      id,
      athlete_id,
      athletes!athlete_assessments_athlete_id_fkey (
        id,
        team_id,
        teams!athletes_team_id_fkey (
          id,
          sport
        )
      )
    `)
    .eq('id', assessmentId)
    .single();

  if (assessmentError || !assessment) {
    return { error: 'Assessment not found.' };
  }

  const athlete = Array.isArray(assessment.athletes)
    ? assessment.athletes[0]
    : assessment.athletes;

  if (!athlete?.team_id) {
    return { error: 'Athlete team not found.' };
  }

  const team = Array.isArray(athlete.teams) ? athlete.teams[0] : athlete.teams;
  const athleteSport = team?.sport ?? '';

  if (!ALLOWED_SOCCER_SPORTS.includes(athleteSport)) {
    return { error: 'Only soccer assessments can be edited here.' };
  }

  const { data: assignment, error: assignmentError } = await supabase
    .from('coach_assignments')
    .select('id')
    .eq('coach_id', me.id)
    .eq('team_id', athlete.team_id)
    .single();

  if (assignmentError || !assignment) {
    return { error: 'You do not have access to edit this assessment.' };
  }

  const { error } = await supabase
    .from('athlete_assessments')
    .update({
      assessment_date: input.assessmentDate || null,
      squat: toNumberOrNull(input.squat),
      bench: toNumberOrNull(input.bench),
      clean: toNumberOrNull(input.clean),
      cmj: toNumberOrNull(input.cmj),
      single_leg_cmj_right: toNumberOrNull(input.singleLegCmjRight),
      single_leg_cmj_left: toNumberOrNull(input.singleLegCmjLeft),
      sprint_20m: toNumberOrNull(input.sprint20m),
      mod_505: toNumberOrNull(input.mod505),
    })
    .eq('id', assessmentId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/athletes');
  revalidatePath('/dashboard/athletes/sport');

  return { success: true };
}