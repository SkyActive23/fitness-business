'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '../../lib/supabase/server';

type CreateAthleteInput = {
  teamId: string;
  firstName: string;
  lastName: string;
  height: string;
  weight: string;
  position: string;
};

type UpdateAthleteInput = {
  athleteId: string;
  firstName: string;
  lastName: string;
  height: string;
  weight: string;
  position: string;
};

type DeleteAthleteInput = {
  athleteId: string;
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

export async function createAthlete(input: CreateAthleteInput) {
  const teamId = input.teamId.trim();
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const height = input.height.trim();
  const position = input.position.trim();
  const weightValue = input.weight.trim();

  if (!teamId || !firstName || !lastName) {
    return { error: 'Team, first name, and last name are required.' };
  }

  const permission = await canAccessTeam(teamId);
  if ('error' in permission) return { error: permission.error };

  const { supabase } = permission;

  const weight =
    weightValue === '' ? null : Number.isNaN(Number(weightValue)) ? null : Number(weightValue);

  const { error } = await supabase.from('athletes').insert({
    team_id: teamId,
    first_name: firstName,
    last_name: lastName,
    height: height || null,
    weight,
    position: position || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/athletes');
  return { success: true };
}

export async function updateAthlete(input: UpdateAthleteInput) {
  const athleteId = input.athleteId.trim();
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const height = input.height.trim();
  const position = input.position.trim();
  const weightValue = input.weight.trim();

  if (!athleteId || !firstName || !lastName) {
    return { error: 'Athlete, first name, and last name are required.' };
  }

  const ctx = await getCurrentCoach();
  if ('error' in ctx) return { error: ctx.error };

  const { supabase, me } = ctx;

  const { data: athlete, error: athleteError } = await supabase
    .from('athletes')
    .select('id, team_id')
    .eq('id', athleteId)
    .single();

  if (athleteError || !athlete) {
    return { error: 'Athlete not found.' };
  }

  const { data: assignment, error: assignmentError } = await supabase
    .from('coach_assignments')
    .select('id, title')
    .eq('coach_id', me.id)
    .eq('team_id', athlete.team_id)
    .single();

  if (assignmentError || !assignment) {
    return { error: 'You do not have access to edit this athlete.' };
  }

  const weight =
    weightValue === '' ? null : Number.isNaN(Number(weightValue)) ? null : Number(weightValue);

  const { error } = await supabase
    .from('athletes')
    .update({
      first_name: firstName,
      last_name: lastName,
      height: height || null,
      weight,
      position: position || null,
    })
    .eq('id', athleteId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/athletes');
  return { success: true };
}

export async function deleteAthlete(input: DeleteAthleteInput) {
  const athleteId = input.athleteId.trim();

  if (!athleteId) {
    return { error: 'Athlete is required.' };
  }

  const ctx = await getCurrentCoach();
  if ('error' in ctx) return { error: ctx.error };

  const { supabase, me } = ctx;

  const { data: athlete, error: athleteError } = await supabase
    .from('athletes')
    .select('id, team_id')
    .eq('id', athleteId)
    .single();

  if (athleteError || !athlete) {
    return { error: 'Athlete not found.' };
  }

  const { data: assignment, error: assignmentError } = await supabase
    .from('coach_assignments')
    .select('id, title')
    .eq('coach_id', me.id)
    .eq('team_id', athlete.team_id)
    .single();

  if (assignmentError || !assignment) {
    return { error: 'You do not have access to remove this athlete.' };
  }

  const { error } = await supabase.from('athletes').delete().eq('id', athleteId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/athletes');
  return { success: true };
}