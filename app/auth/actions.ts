'use server';

import { redirect } from 'next/navigation';
import { createClient } from '../lib/supabase/server';

type SignUpHeadCoachInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  schoolName: string;
  teamName: string;
  sport: string;
};

type SignUpAssistantCoachInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  joinCode: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeText(value: string) {
  return value.trim();
}

function makeJoinCode(teamName: string, sport: string) {
  const raw = `${teamName}_${sport}_${Math.random().toString(36).slice(2, 8)}`;
  return raw.replace(/[^A-Za-z0-9_]/g, '').toUpperCase();
}

export async function signUpHeadCoach(input: SignUpHeadCoachInput) {
  const supabase = await createClient();

  const email = normalizeEmail(input.email);
  const password = input.password;
  const firstName = normalizeText(input.firstName);
  const lastName = normalizeText(input.lastName);
  const schoolName = normalizeText(input.schoolName);
  const teamName = normalizeText(input.teamName);
  const sport = normalizeText(input.sport);

  if (!email || !password || !firstName || !lastName || !schoolName || !teamName || !sport) {
    return { error: 'All fields are required.' };
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    return { error: authError.message };
  }

  const authUserId = authData.user?.id;

  if (!authUserId) {
    return { error: 'Unable to create auth user.' };
  }

  const { data: existingCoach } = await supabase
    .from('coaches')
    .select('id')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  let coachId = existingCoach?.id ?? null;

  if (!coachId) {
    const { data: coachInsert, error: coachError } = await supabase
      .from('coaches')
      .insert({
        auth_user_id: authUserId,
        first_name: firstName,
        last_name: lastName,
        email,
      })
      .select('id')
      .single();

    if (coachError || !coachInsert) {
      return { error: coachError?.message || 'Unable to create coach profile.' };
    }

    coachId = coachInsert.id;
  }

  const { data: existingSchool } = await supabase
    .from('schools')
    .select('id')
    .eq('name', schoolName)
    .maybeSingle();

  let schoolId = existingSchool?.id ?? null;

  if (!schoolId) {
    const { data: schoolInsert, error: schoolError } = await supabase
      .from('schools')
      .insert({
        name: schoolName,
      })
      .select('id')
      .single();

    if (schoolError || !schoolInsert) {
      return { error: schoolError?.message || 'Unable to create school.' };
    }

    schoolId = schoolInsert.id;
  }

  const { data: existingTeam } = await supabase
    .from('teams')
    .select('id')
    .eq('school_id', schoolId)
    .eq('team_name', teamName)
    .eq('sport', sport)
    .maybeSingle();

  let teamId = existingTeam?.id ?? null;

  if (!teamId) {
    let joinCode = makeJoinCode(teamName, sport);

    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: teamInsert, error: teamError } = await supabase
        .from('teams')
        .insert({
          school_id: schoolId,
          team_name: teamName,
          sport,
          join_code: joinCode,
        })
        .select('id')
        .single();

      if (!teamError && teamInsert) {
        teamId = teamInsert.id;
        break;
      }

      if (teamError && !teamError.message.toLowerCase().includes('join_code')) {
        return { error: teamError.message };
      }

      joinCode = makeJoinCode(teamName, sport);
    }

    if (!teamId) {
      return { error: 'Unable to create team. Please try again.' };
    }
  }

  const { data: existingAssignment } = await supabase
    .from('coach_assignments')
    .select('id')
    .eq('coach_id', coachId)
    .eq('team_id', teamId)
    .maybeSingle();

  if (!existingAssignment) {
    const { error: assignmentError } = await supabase
      .from('coach_assignments')
      .insert({
        coach_id: coachId,
        team_id: teamId,
        title: 'Head Coach',
      });

    if (assignmentError) {
      return { error: assignmentError.message };
    }
  }

  redirect('/dashboard');
}

export async function signUpAssistantCoach(input: SignUpAssistantCoachInput) {
  const supabase = await createClient();

  const email = normalizeEmail(input.email);
  const password = input.password;
  const firstName = normalizeText(input.firstName);
  const lastName = normalizeText(input.lastName);
  const joinCode = normalizeText(input.joinCode).toUpperCase();

  if (!email || !password || !firstName || !lastName || !joinCode) {
    return { error: 'All fields are required.' };
  }

  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('id, team_name, sport, join_code')
    .eq('join_code', joinCode)
    .single();

  if (teamError || !team) {
    return { error: 'Invalid join code.' };
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    return { error: authError.message };
  }

  const authUserId = authData.user?.id;

  if (!authUserId) {
    return { error: 'Unable to create auth user.' };
  }

  const { data: existingCoach } = await supabase
    .from('coaches')
    .select('id')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  let coachId = existingCoach?.id ?? null;

  if (!coachId) {
    const { data: coachInsert, error: coachError } = await supabase
      .from('coaches')
      .insert({
        auth_user_id: authUserId,
        first_name: firstName,
        last_name: lastName,
        email,
      })
      .select('id')
      .single();

    if (coachError || !coachInsert) {
      return { error: coachError?.message || 'Unable to create coach profile.' };
    }

    coachId = coachInsert.id;
  }

  const { data: existingAssignment } = await supabase
    .from('coach_assignments')
    .select('id')
    .eq('coach_id', coachId)
    .eq('team_id', team.id)
    .maybeSingle();

  if (!existingAssignment) {
    const { error: assignmentError } = await supabase
      .from('coach_assignments')
      .insert({
        coach_id: coachId,
        team_id: team.id,
        title: 'Assistant Coach',
      });

    if (assignmentError) {
      return { error: assignmentError.message };
    }
  }

  redirect('/dashboard');
}


export async function loginCoach(formData: FormData) {
  const supabase = await createClient();

  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/dashboard');
}

export async function logoutCoach() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/auth/login');
}