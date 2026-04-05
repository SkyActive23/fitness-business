'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '../../../lib/supabase/server';

type CreateBaseballAssessmentInput = {
  athleteId: string;
  assessmentDate: string;
  bestVerticalIn: string;
  gripL: string;
  gripR: string;
  yd60: string;
  yd40: string;
  bench: string;
  squat: string;
  trapBarDl: string;
  sessionNotes: string;
};

type UpdateBaseballAssessmentInput = {
  assessmentId: string;
  assessmentDate: string;
  bestVerticalIn: string;
  gripL: string;
  gripR: string;
  yd60: string;
  yd40: string;
  bench: string;
  squat: string;
  trapBarDl: string;
  sessionNotes: string;
};

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

export async function createBaseballAssessment(
  input: CreateBaseballAssessmentInput
) {
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
      weight,
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

  if (team?.sport !== 'Baseball') {
    return { error: 'This page is only for baseball athletes.' };
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

  const bestVerticalIn = toNumberOrNull(input.bestVerticalIn);
  const gripL = toNumberOrNull(input.gripL);
  const gripR = toNumberOrNull(input.gripR);
  const yd60 = toNumberOrNull(input.yd60);
  const yd40 = toNumberOrNull(input.yd40);
  const bench = toNumberOrNull(input.bench);
  const squat = toNumberOrNull(input.squat);
  const trapBarDl = toNumberOrNull(input.trapBarDl);

  const gripAvg =
    gripL !== null && gripR !== null
      ? (gripL + gripR) / 2
      : gripL ?? gripR ?? null;

  const athleteWeight =
    athlete.weight === null || athlete.weight === undefined
      ? null
      : Number(athlete.weight);

  const relBench =
    bench !== null && athleteWeight ? bench / athleteWeight : null;
  const relSquat =
    squat !== null && athleteWeight ? squat / athleteWeight : null;
  const relDl =
    trapBarDl !== null && athleteWeight ? trapBarDl / athleteWeight : null;

  const { error } = await supabase.from('athlete_assessments').insert({
    athlete_id: athleteId,
    assessment_date: input.assessmentDate || null,
    best_vertical_in: bestVerticalIn,
    grip_l: gripL,
    grip_r: gripR,
    grip_avg: gripAvg,
    yd_60: yd60,
    yd_40: yd40,
    bench,
    squat,
    trap_bar_dl: trapBarDl,
    rel_bench: relBench,
    rel_squat: relSquat,
    rel_dl: relDl,
    session_notes: input.sessionNotes || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/athletes/baseball');
  revalidatePath('/dashboard/athletes/baseball/profile');
  return { success: true };
}

export async function updateBaseballAssessment(
  input: UpdateBaseballAssessmentInput
) {
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
        weight,
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

  if (team?.sport !== 'Baseball') {
    return { error: 'Only baseball assessments can be edited here.' };
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

  const bestVerticalIn = toNumberOrNull(input.bestVerticalIn);
  const gripL = toNumberOrNull(input.gripL);
  const gripR = toNumberOrNull(input.gripR);
  const yd60 = toNumberOrNull(input.yd60);
  const yd40 = toNumberOrNull(input.yd40);
  const bench = toNumberOrNull(input.bench);
  const squat = toNumberOrNull(input.squat);
  const trapBarDl = toNumberOrNull(input.trapBarDl);

  const gripAvg =
    gripL !== null && gripR !== null
      ? (gripL + gripR) / 2
      : gripL ?? gripR ?? null;

  const athleteWeight =
    athlete.weight === null || athlete.weight === undefined
      ? null
      : Number(athlete.weight);

  const relBench =
    bench !== null && athleteWeight ? bench / athleteWeight : null;
  const relSquat =
    squat !== null && athleteWeight ? squat / athleteWeight : null;
  const relDl =
    trapBarDl !== null && athleteWeight ? trapBarDl / athleteWeight : null;

  const { error } = await supabase
    .from('athlete_assessments')
    .update({
      assessment_date: input.assessmentDate || null,
      best_vertical_in: bestVerticalIn,
      grip_l: gripL,
      grip_r: gripR,
      grip_avg: gripAvg,
      yd_60: yd60,
      yd_40: yd40,
      bench,
      squat,
      trap_bar_dl: trapBarDl,
      rel_bench: relBench,
      rel_squat: relSquat,
      rel_dl: relDl,
      session_notes: input.sessionNotes || null,
    })
    .eq('id', assessmentId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/athletes/baseball');
  revalidatePath('/dashboard/athletes/baseball/profile');
  return { success: true };
}