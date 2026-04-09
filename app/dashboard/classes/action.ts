'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/app/lib/supabase/server';

type CreateClassInput = {
  teamId: string;
  name: string;
  description: string;
  workoutType: string;
  workoutId: string;
  durationMinutes: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  days: string[];
  coachIds: string[];
  athleteIds: string[];
};

type UpdateClassInput = {
  classId: string;
  teamId: string;
  name: string;
  description: string;
  workoutType: string;
  workoutId: string;
  durationMinutes: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  days: string[];
  coachIds: string[];
  athleteIds: string[];
};

type DeleteClassInput = {
  classId: string;
};

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

async function canManageTeam(teamId: string) {
  const ctx = await getCurrentCoach();
  if ('error' in ctx) return ctx;

  const { supabase, me } = ctx;

  const { data: assignment, error } = await supabase
    .from('coach_assignments')
    .select('id, title')
    .eq('coach_id', me.id)
    .eq('team_id', teamId)
    .single();

  if (error || !assignment) {
    return { error: 'You do not have access to this team.', supabase, me };
  }

  if (assignment.title !== 'Head Coach') {
    return {
      error: 'Only the Head Coach can manage classes for this team.',
      supabase,
      me,
    };
  }

  return { supabase, me };
}

async function validateWorkoutForTeam(
  supabase: Awaited<ReturnType<typeof createClient>>,
  teamId: string,
  workoutId: string
) {
  if (!workoutId) return { workoutId: null as string | null };

  const { data: workout, error } = await supabase
    .from('workouts')
    .select('id, team_id')
    .eq('id', workoutId)
    .single();

  if (error || !workout) {
    return { error: 'Selected workout was not found.' };
  }

  if (workout.team_id !== teamId) {
    return { error: 'Selected workout does not belong to this team.' };
  }

  return { workoutId: workout.id as string };
}

export async function createClass(input: CreateClassInput) {
  const teamId = input.teamId.trim();
  const name = input.name.trim();
  const description = input.description.trim();
  const workoutType = input.workoutType.trim();
  const workoutId = input.workoutId.trim();
  const durationMinutes = input.durationMinutes.trim();
  const startDate = input.startDate.trim();
  const endDate = input.endDate.trim();
  const startTime = input.startTime.trim();
  const endTime = input.endTime.trim();
  const days = input.days ?? [];
  const coachIds = input.coachIds ?? [];
  const athleteIds = input.athleteIds ?? [];

  if (!teamId || !name) {
    return { error: 'Team and class name are required.' };
  }

  const permission = await canManageTeam(teamId);
  if ('error' in permission) return { error: permission.error };

  const { supabase, me } = permission;

  const workoutValidation = await validateWorkoutForTeam(supabase, teamId, workoutId);
  if ('error' in workoutValidation) return { error: workoutValidation.error };

  const duration =
    durationMinutes === '' || Number.isNaN(Number(durationMinutes))
      ? null
      : Number(durationMinutes);

  const { data: classInsert, error: classError } = await supabase
    .from('classes')
    .insert({
      team_id: teamId,
      created_by_coach_id: me.id,
      name,
      description: description || null,
      workout_type: workoutType || null,
      workout_id: workoutValidation.workoutId,
      duration_minutes: duration,
      start_date: startDate || null,
      end_date: endDate || null,
      start_time: startTime || null,
      end_time: endTime || null,
      is_active: true,
    })
    .select('id')
    .single();

  if (classError || !classInsert) {
    return { error: classError?.message || 'Unable to create class.' };
  }

  const classId = classInsert.id;

  if (days.length > 0) {
    const { error: daysError } = await supabase.from('class_days').insert(
      days.map((day) => ({
        class_id: classId,
        day_of_week: day,
      }))
    );
    if (daysError) return { error: daysError.message };
  }

  if (coachIds.length > 0) {
    const { error: coachesError } = await supabase.from('class_coaches').insert(
      coachIds.map((coachId) => ({
        class_id: classId,
        coach_id: coachId,
        role: 'Assigned Coach',
      }))
    );
    if (coachesError) return { error: coachesError.message };
  }

  if (athleteIds.length > 0) {
    const { error: athletesError } = await supabase.from('class_athletes').insert(
      athleteIds.map((athleteId) => ({
        class_id: classId,
        athlete_id: athleteId,
      }))
    );
    if (athletesError) return { error: athletesError.message };
  }

  revalidatePath('/dashboard/classes');
  return { success: true };
}

export async function updateClass(input: UpdateClassInput) {
  const classId = input.classId.trim();
  const teamId = input.teamId.trim();
  const name = input.name.trim();
  const description = input.description.trim();
  const workoutType = input.workoutType.trim();
  const workoutId = input.workoutId.trim();
  const durationMinutes = input.durationMinutes.trim();
  const startDate = input.startDate.trim();
  const endDate = input.endDate.trim();
  const startTime = input.startTime.trim();
  const endTime = input.endTime.trim();
  const days = input.days ?? [];
  const coachIds = input.coachIds ?? [];
  const athleteIds = input.athleteIds ?? [];

  if (!classId || !teamId || !name) {
    return { error: 'Class, team, and name are required.' };
  }

  const permission = await canManageTeam(teamId);
  if ('error' in permission) return { error: permission.error };

  const { supabase } = permission;

  const workoutValidation = await validateWorkoutForTeam(supabase, teamId, workoutId);
  if ('error' in workoutValidation) return { error: workoutValidation.error };

  const duration =
    durationMinutes === '' || Number.isNaN(Number(durationMinutes))
      ? null
      : Number(durationMinutes);

  const { error: updateError } = await supabase
    .from('classes')
    .update({
      team_id: teamId,
      name,
      description: description || null,
      workout_type: workoutType || null,
      workout_id: workoutValidation.workoutId,
      duration_minutes: duration,
      start_date: startDate || null,
      end_date: endDate || null,
      start_time: startTime || null,
      end_time: endTime || null,
    })
    .eq('id', classId);

  if (updateError) return { error: updateError.message };

  await supabase.from('class_days').delete().eq('class_id', classId);
  await supabase.from('class_coaches').delete().eq('class_id', classId);
  await supabase.from('class_athletes').delete().eq('class_id', classId);

  if (days.length > 0) {
    const { error: daysError } = await supabase.from('class_days').insert(
      days.map((day) => ({
        class_id: classId,
        day_of_week: day,
      }))
    );
    if (daysError) return { error: daysError.message };
  }

  if (coachIds.length > 0) {
    const { error: coachesError } = await supabase.from('class_coaches').insert(
      coachIds.map((coachId) => ({
        class_id: classId,
        coach_id: coachId,
        role: 'Assigned Coach',
      }))
    );
    if (coachesError) return { error: coachesError.message };
  }

  if (athleteIds.length > 0) {
    const { error: athletesError } = await supabase.from('class_athletes').insert(
      athleteIds.map((athleteId) => ({
        class_id: classId,
        athlete_id: athleteId,
      }))
    );
    if (athletesError) return { error: athletesError.message };
  }

  revalidatePath('/dashboard/classes');
  return { success: true };
}

export async function deleteClass(input: DeleteClassInput) {
  const classId = input.classId.trim();

  if (!classId) {
    return { error: 'Class is required.' };
  }

  const ctx = await getCurrentCoach();
  if ('error' in ctx) return { error: ctx.error };

  const { supabase } = ctx;

  const { data: existingClass, error: classLookupError } = await supabase
    .from('classes')
    .select('id, team_id')
    .eq('id', classId)
    .single();

  if (classLookupError || !existingClass) {
    return { error: 'Class not found.' };
  }

  const permission = await canManageTeam(existingClass.team_id);
  if ('error' in permission) return { error: permission.error };

  const { error: deleteError } = await supabase
    .from('classes')
    .delete()
    .eq('id', classId);

  if (deleteError) return { error: deleteError.message };

  revalidatePath('/dashboard/classes');
  return { success: true };
}