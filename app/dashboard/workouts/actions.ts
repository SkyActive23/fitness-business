'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/app/lib/supabase/server';

type SetPrescriptionInput = {
  setNumber: number;
  percentage: string;
  velocity: string;
};

type WorkoutExerciseInput = {
  exerciseId: string;
  sortOrder: number;
  groupLabel: string;
  sets: string;
  reps: string;
  restSeconds: string;
  percentage: string;
  loadNotes: string;
  coachingNotes: string;
  useAdvancedLoading?: boolean;
  loadingMethod?: 'percentage' | 'velocity' | '';
  setPrescriptions?: SetPrescriptionInput[];
};

type WeekDayInput = {
  weekNumber: number;
  dayNumber: number;
  dayLabel: string;
  workoutType: string;
  description: string;
  exercises: WorkoutExerciseInput[];
};

type CreateWorkoutProgramInput = {
  teamId: string;
  programName: string;
  durationWeeks: number;
  trainingDaysPerWeek: number;
  weeks: WeekDayInput[][];
};

type UpdateWorkoutInput = {
  workoutId: string;
  teamId: string;
  name: string;
  description: string;
  workoutType: string;
  dayLabel: string;
  exercises: WorkoutExerciseInput[];
};

type DeleteWorkoutInput = {
  workoutId: string;
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

async function canAccessTeam(teamId: string) {
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

  return { supabase, me, assignment };
}

function sanitizeExercises(exercises: WorkoutExerciseInput[]) {
  return (exercises ?? []).filter((e) => e.exerciseId.trim() !== '');
}

function normalizeSetPrescriptions(
  useAdvancedLoading: boolean,
  loadingMethod: 'percentage' | 'velocity' | '' | undefined,
  setPrescriptions: SetPrescriptionInput[] | undefined
) {
  if (!useAdvancedLoading || !loadingMethod) return null;

  const cleaned = (setPrescriptions ?? [])
    .map((set, index) => ({
      setNumber: set.setNumber ?? index + 1,
      percentage: (set.percentage ?? '').trim(),
      velocity: (set.velocity ?? '').trim(),
    }))
    .filter((set) =>
      loadingMethod === 'percentage'
        ? set.percentage !== ''
        : set.velocity !== ''
    );

  return cleaned.length > 0 ? cleaned : null;
}

function buildExerciseRows(workoutId: string, exercises: WorkoutExerciseInput[]) {
  return exercises.map((exercise, index) => {
    const useAdvancedLoading = Boolean(exercise.useAdvancedLoading);
    const loadingMethod =
      useAdvancedLoading &&
      (exercise.loadingMethod === 'percentage' || exercise.loadingMethod === 'velocity')
        ? exercise.loadingMethod
        : null;

    const setPrescriptions = normalizeSetPrescriptions(
      useAdvancedLoading,
      exercise.loadingMethod,
      exercise.setPrescriptions
    );

    return {
      workout_id: workoutId,
      exercise_id: exercise.exerciseId,
      sort_order: exercise.sortOrder ?? index,
      group_label: exercise.groupLabel?.trim() || null,
      sets: exercise.sets?.trim() || null,
      reps: exercise.reps?.trim() || null,
      rest_seconds:
        !exercise.restSeconds?.trim() || Number.isNaN(Number(exercise.restSeconds))
          ? null
          : Number(exercise.restSeconds),
      percentage:
        !useAdvancedLoading && exercise.percentage?.trim()
          ? exercise.percentage.trim()
          : null,
      load_notes: exercise.loadNotes?.trim() || null,
      coaching_notes: exercise.coachingNotes?.trim() || null,
      use_advanced_loading: useAdvancedLoading,
      loading_method: loadingMethod,
      uses_velocity: loadingMethod === 'velocity',
      set_prescriptions: setPrescriptions,
    };
  });
}

export async function createWorkoutProgram(input: CreateWorkoutProgramInput) {
  try {
    const teamId = input.teamId?.trim();
    const programName = input.programName?.trim();
    const durationWeeks = Number(input.durationWeeks);
    const trainingDaysPerWeek = Number(input.trainingDaysPerWeek);
    const weeks = input.weeks ?? [];

    if (!teamId || !programName) {
      return { error: 'Team and program name are required.' };
    }

    if (!Number.isInteger(durationWeeks) || durationWeeks < 1 || durationWeeks > 52) {
      return { error: 'Duration must be between 1 and 52 weeks.' };
    }

    if (
      !Number.isInteger(trainingDaysPerWeek) ||
      trainingDaysPerWeek < 1 ||
      trainingDaysPerWeek > 7
    ) {
      return { error: 'Days per week must be between 1 and 7.' };
    }

    if (weeks.length !== durationWeeks) {
      return { error: 'Week count must match duration in weeks.' };
    }

    for (const week of weeks) {
      if ((week ?? []).length !== trainingDaysPerWeek) {
        return { error: 'Each week must contain the selected number of training days.' };
      }
    }

    const permission = await canAccessTeam(teamId);
    if ('error' in permission) return { error: permission.error };

    const { supabase, me } = permission;

    for (let weekIndex = 0; weekIndex < weeks.length; weekIndex += 1) {
      const week = weeks[weekIndex];

      for (let dayIndex = 0; dayIndex < week.length; dayIndex += 1) {
        const day = week[dayIndex];
        const weekNumber = weekIndex + 1;
        const dayNumber = dayIndex + 1;

        const workoutName = `${programName} - Week ${weekNumber} Day ${dayNumber}`;
        const dayLabel = day.dayLabel?.trim() || `Week ${weekNumber} - Day ${dayNumber}`;
        const description = day.description?.trim() || null;
        const workoutType = day.workoutType?.trim() || null;

        const { data: workoutInsert, error: workoutError } = await supabase
          .from('workouts')
          .insert({
            team_id: teamId,
            created_by_coach_id: me.id,
            name: workoutName,
            description,
            workout_type: workoutType,
            day_label: dayLabel,
            is_active: true,
          })
          .select('id')
          .single();

        if (workoutError || !workoutInsert) {
          console.error('WORKOUT INSERT ERROR:', workoutError);
          return { error: workoutError?.message || 'Unable to create workout.' };
        }

        const exercises = sanitizeExercises(day.exercises ?? []);

        if (exercises.length > 0) {
          const rows = buildExerciseRows(workoutInsert.id, exercises);

          const { error: exerciseError } = await supabase
            .from('workout_exercises')
            .insert(rows);

          if (exerciseError) {
            console.error('WORKOUT_EXERCISES INSERT ERROR:', exerciseError);

            await supabase.from('workouts').delete().eq('id', workoutInsert.id);

            return { error: exerciseError.message };
          }
        }
      }
    }

    revalidatePath('/dashboard/workouts');
    return { success: true };
  } catch (error) {
    console.error('CREATE WORKOUT PROGRAM UNCAUGHT ERROR:', error);
    return { error: 'Something went wrong while creating the program.' };
  }
}

export async function updateWorkout(input: UpdateWorkoutInput) {
  try {
    const workoutId = input.workoutId.trim();
    const teamId = input.teamId.trim();
    const name = input.name.trim();
    const description = input.description.trim();
    const workoutType = input.workoutType.trim();
    const dayLabel = input.dayLabel.trim();
    const exercises = sanitizeExercises(input.exercises ?? []);

    if (!workoutId || !teamId || !name) {
      return { error: 'Workout, team, and name are required.' };
    }

    const permission = await canAccessTeam(teamId);
    if ('error' in permission) return { error: permission.error };

    const { supabase } = permission;

    const { error: updateError } = await supabase
      .from('workouts')
      .update({
        team_id: teamId,
        name,
        description: description || null,
        workout_type: workoutType || null,
        day_label: dayLabel || null,
      })
      .eq('id', workoutId);

    if (updateError) return { error: updateError.message };

    await supabase.from('workout_exercises').delete().eq('workout_id', workoutId);

    if (exercises.length > 0) {
      const rows = buildExerciseRows(workoutId, exercises);

      const { error: exerciseError } = await supabase
        .from('workout_exercises')
        .insert(rows);

      if (exerciseError) {
        console.error('UPDATE WORKOUT_EXERCISES INSERT ERROR:', exerciseError);
        return { error: exerciseError.message };
      }
    }

    revalidatePath('/dashboard/workouts');
    return { success: true };
  } catch (error) {
    console.error('UPDATE WORKOUT UNCAUGHT ERROR:', error);
    return { error: 'Something went wrong while updating the workout.' };
  }
}

export async function deleteWorkout(input: DeleteWorkoutInput) {
  try {
    const workoutId = input.workoutId.trim();

    if (!workoutId) {
      return { error: 'Workout is required.' };
    }

    const ctx = await getCurrentCoach();
    if ('error' in ctx) return { error: ctx.error };

    const { supabase } = ctx;

    const { error } = await supabase.from('workouts').delete().eq('id', workoutId);

    if (error) return { error: error.message };

    revalidatePath('/dashboard/workouts');
    return { success: true };
  } catch (error) {
    console.error('DELETE WORKOUT UNCAUGHT ERROR:', error);
    return { error: 'Something went wrong while deleting the workout.' };
  }
}