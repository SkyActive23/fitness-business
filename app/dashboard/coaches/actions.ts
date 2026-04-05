'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '../../lib/supabase/server';

type CoachTitle = 'Head Coach' | 'Assistant Coach';

type UpdateCoachInput = {
  coachId: string;
  firstName: string;
  lastName: string;
  email: string;
};

type AddAssignmentInput = {
  coachId: string;
  sport: string;
  title: CoachTitle;
};

type UpdateAssignmentTitleInput = {
  assignmentId: string;
  title: CoachTitle;
};

type RemoveAssignmentInput = {
  assignmentId: string;
};

type CreateAssistantCoachInput = {
  firstName: string;
  lastName: string;
  email: string;
  sport: string;
  title: CoachTitle;
};

type SupabaseClientType = Awaited<ReturnType<typeof createClient>>;

type CoachMe = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
};

type CurrentCoachContext =
  | {
      error: string;
      supabase: SupabaseClientType;
    }
  | {
      supabase: SupabaseClientType;
      me: CoachMe;
    };

type SchoolManagerContext =
  | {
      error: string;
      supabase: SupabaseClientType;
      me?: CoachMe;
    }
  | {
      supabase: SupabaseClientType;
      me: CoachMe;
      schoolId: string;
      defaultTeamName: string;
    };

function normalizeText(value: string) {
  return value.trim();
}

function makeJoinCode(teamName: string, sport: string) {
  const raw = `${teamName}_${sport}_${Math.random().toString(36).slice(2, 8)}`;
  return raw.replace(/[^A-Za-z0-9_]/g, '').toUpperCase();
}

async function getCurrentCoachContext(): Promise<CurrentCoachContext> {
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
    .select('id, first_name, last_name, email')
    .eq('auth_user_id', user.id)
    .single();

  if (meError || !me) {
    return { error: 'Coach profile not found.', supabase };
  }

  return { supabase, me };
}

async function getSchoolForManager(): Promise<SchoolManagerContext> {
  const ctx = await getCurrentCoachContext();
  if ('error' in ctx) return ctx;

  const { supabase, me } = ctx;

  const { data: myAssignment, error: myAssignmentError } = await supabase
    .from('coach_assignments')
    .select(`
      id,
      title,
      teams!coach_assignments_team_id_fkey (
        id,
        school_id,
        team_name,
        sport
      )
    `)
    .eq('coach_id', me.id)
    .limit(1)
    .single();

  if (myAssignmentError || !myAssignment) {
    return {
      supabase,
      me,
      error: 'You do not have any team assignments yet.',
    };
  }

  const team = Array.isArray(myAssignment.teams)
    ? myAssignment.teams[0]
    : myAssignment.teams;

  if (!team?.school_id || !team?.team_name) {
    return {
      supabase,
      me,
      error: 'Could not determine school/team from your current assignment.',
    };
  }

  return {
    supabase,
    me,
    schoolId: team.school_id,
    defaultTeamName: team.team_name,
  };
}

async function canManageTeam(teamId: string) {
  const ctx = await getCurrentCoachContext();
  if ('error' in ctx) return ctx;

  const { supabase, me } = ctx;

  const { data: myAssignment, error: myAssignmentError } = await supabase
    .from('coach_assignments')
    .select('id, title')
    .eq('coach_id', me.id)
    .eq('team_id', teamId)
    .single();

  if (myAssignmentError || !myAssignment) {
    return {
      supabase,
      me,
      error: 'You do not have access to manage this team.',
    };
  }

  if (myAssignment.title !== 'Head Coach') {
    return {
      supabase,
      me,
      error: 'Only a Head Coach can manage coaches for this team.',
    };
  }

  return { supabase, me, myAssignment };
}

async function findOrCreateTeamForSport(
  supabase: SupabaseClientType,
  schoolId: string,
  sport: string,
  defaultTeamName: string
) {
  const cleanSport = normalizeText(sport);
  const cleanTeamName = normalizeText(defaultTeamName);

  const { data: existingTeam } = await supabase
    .from('teams')
    .select('id, school_id, team_name, sport')
    .eq('school_id', schoolId)
    .eq('sport', cleanSport)
    .eq('team_name', cleanTeamName)
    .maybeSingle();

  if (existingTeam) {
    return { teamId: existingTeam.id };
  }

  let joinCode = makeJoinCode(cleanTeamName, cleanSport);

  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: teamInsert, error: teamError } = await supabase
      .from('teams')
      .insert({
        school_id: schoolId,
        team_name: cleanTeamName,
        sport: cleanSport,
        join_code: joinCode,
      })
      .select('id')
      .single();

    if (!teamError && teamInsert) {
      return { teamId: teamInsert.id };
    }

    if (
      teamError &&
      !String(teamError.message).toLowerCase().includes('join_code')
    ) {
      return { error: teamError.message };
    }

    joinCode = makeJoinCode(cleanTeamName, cleanSport);
  }

  return { error: 'Unable to create team for that sport.' };
}

export async function updateCoach(input: UpdateCoachInput) {
  const ctx = await getCurrentCoachContext();
  if ('error' in ctx) return { error: ctx.error };

  const { supabase, me } = ctx;

  const coachId = input.coachId.trim();
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const email = input.email.trim().toLowerCase();

  if (!coachId || !firstName || !lastName || !email) {
    return { error: 'All fields are required.' };
  }

  const { data: myAssignments, error: myAssignmentsError } = await supabase
    .from('coach_assignments')
    .select('team_id')
    .eq('coach_id', me.id);

  if (myAssignmentsError || !myAssignments?.length) {
    return { error: 'You do not have permission to edit this coach.' };
  }

  const myTeamIds = myAssignments.map((row: { team_id: string }) => row.team_id);

  const { data: targetAssignments, error: targetAssignmentsError } = await supabase
    .from('coach_assignments')
    .select('team_id')
    .eq('coach_id', coachId);

  if (targetAssignmentsError || !targetAssignments?.length) {
    if (coachId !== me.id) {
      return { error: 'Target coach has no assignments on your teams.' };
    }
  }

  const sharesTeam =
    coachId === me.id ||
    (targetAssignments ?? []).some((row: { team_id: string }) =>
      myTeamIds.includes(row.team_id)
    );

  if (!sharesTeam) {
    return { error: 'You do not have permission to edit this coach.' };
  }

  const { error: updateError } = await supabase
    .from('coaches')
    .update({
      first_name: firstName,
      last_name: lastName,
      email,
    })
    .eq('id', coachId);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/coaches');

  return { success: true };
}

export async function addCoachAssignment(input: AddAssignmentInput) {
  const coachId = input.coachId.trim();
  const sport = normalizeText(input.sport);
  const title = input.title;

  if (!coachId || !sport || !title) {
    return { error: 'Coach, sport, and title are required.' };
  }

  const schoolCtx = await getSchoolForManager();
  if ('error' in schoolCtx) {
    return { error: schoolCtx.error };
  }

  const { supabase, schoolId, defaultTeamName, me } = schoolCtx;

  const teamResult = await findOrCreateTeamForSport(
    supabase,
    schoolId,
    sport,
    defaultTeamName
  );
  if ('error' in teamResult) return { error: teamResult.error };

  const teamId = teamResult.teamId;

  const { data: existingBefore, error: existingBeforeError } = await supabase
    .from('coach_assignments')
    .select('id')
    .eq('coach_id', coachId)
    .eq('team_id', teamId)
    .maybeSingle();

  if (existingBeforeError) {
    return { error: existingBeforeError.message };
  }

  if (existingBefore) {
    return { error: 'That coach is already assigned to this sport.' };
  }

  const permission = await canManageTeam(teamId);

  if ('error' in permission) {
    const { data: meAssignmentCheck, error: meAssignmentCheckError } = await supabase
      .from('coach_assignments')
      .select('id')
      .eq('coach_id', me.id)
      .eq('team_id', teamId)
      .maybeSingle();

    if (meAssignmentCheckError) {
      return { error: meAssignmentCheckError.message };
    }

    if (!meAssignmentCheck) {
      const { error: selfAssignError } = await supabase
        .from('coach_assignments')
        .insert({
          coach_id: me.id,
          team_id: teamId,
          title: 'Head Coach',
        });

      if (selfAssignError) {
        return { error: selfAssignError.message };
      }
    }

    if (coachId === me.id) {
      revalidatePath('/dashboard');
      revalidatePath('/dashboard/coaches');
      return { success: true };
    }
  }

  const { data: existingAfter, error: existingAfterError } = await supabase
    .from('coach_assignments')
    .select('id')
    .eq('coach_id', coachId)
    .eq('team_id', teamId)
    .maybeSingle();

  if (existingAfterError) {
    return { error: existingAfterError.message };
  }

  if (existingAfter) {
    return { error: 'That coach is already assigned to this sport.' };
  }

  const { error: insertError } = await supabase
    .from('coach_assignments')
    .insert({
      coach_id: coachId,
      team_id: teamId,
      title,
    });

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/coaches');

  return { success: true };
}

export async function updateCoachAssignmentTitle(
  input: UpdateAssignmentTitleInput
) {
  const assignmentId = input.assignmentId.trim();
  const title = input.title;

  if (!assignmentId || !title) {
    return { error: 'Assignment and title are required.' };
  }

  const ctx = await getCurrentCoachContext();
  if ('error' in ctx) return { error: ctx.error };

  const { supabase } = ctx;

  const { data: assignment, error: assignmentError } = await supabase
    .from('coach_assignments')
    .select('id, team_id')
    .eq('id', assignmentId)
    .single();

  if (assignmentError || !assignment) {
    return { error: 'Assignment not found.' };
  }

  const permission = await canManageTeam(assignment.team_id);
  if ('error' in permission) return { error: permission.error };

  const { error: updateError } = await supabase
    .from('coach_assignments')
    .update({ title })
    .eq('id', assignmentId);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/coaches');

  return { success: true };
}

export async function removeCoachAssignment(input: RemoveAssignmentInput) {
  const assignmentId = input.assignmentId.trim();

  if (!assignmentId) {
    return { error: 'Assignment is required.' };
  }

  const ctx = await getCurrentCoachContext();
  if ('error' in ctx) return { error: ctx.error };

  const { supabase } = ctx;

  const { data: assignment, error: assignmentError } = await supabase
    .from('coach_assignments')
    .select('id, team_id, coach_id')
    .eq('id', assignmentId)
    .single();

  if (assignmentError || !assignment) {
    return { error: 'Assignment not found.' };
  }

  const permission = await canManageTeam(assignment.team_id);
  if ('error' in permission) return { error: permission.error };

  const { data: remainingAssignments, error: remainingError } = await supabase
    .from('coach_assignments')
    .select('id')
    .eq('coach_id', assignment.coach_id);

  if (
    !remainingError &&
    remainingAssignments &&
    remainingAssignments.length <= 1
  ) {
    return { error: 'You cannot remove the coach’s only assignment.' };
  }

  const { error: deleteError } = await supabase
    .from('coach_assignments')
    .delete()
    .eq('id', assignmentId);

  if (deleteError) {
    return { error: deleteError.message };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/coaches');

  return { success: true };
}

export async function createAssistantCoachAndAssign(
  input: CreateAssistantCoachInput
) {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const email = input.email.trim().toLowerCase();
  const sport = normalizeText(input.sport);
  const title = input.title;

  if (!firstName || !lastName || !email || !sport || !title) {
    return { error: 'All fields are required.' };
  }

  const schoolCtx = await getSchoolForManager();
  if ('error' in schoolCtx) {
    return { error: schoolCtx.error };
  }

  const { supabase, schoolId, defaultTeamName, me } = schoolCtx;

  const teamResult = await findOrCreateTeamForSport(
    supabase,
    schoolId,
    sport,
    defaultTeamName
  );
  if ('error' in teamResult) return { error: teamResult.error };

  const teamId = teamResult.teamId;

  const permission = await canManageTeam(teamId);
  if ('error' in permission) {
    const { data: meAssignmentCheck } = await supabase
      .from('coach_assignments')
      .select('id')
      .eq('coach_id', me.id)
      .eq('team_id', teamId)
      .maybeSingle();

    if (!meAssignmentCheck) {
      const { error: selfAssignError } = await supabase
        .from('coach_assignments')
        .insert({
          coach_id: me.id,
          team_id: teamId,
          title: 'Head Coach',
        });

      if (selfAssignError) {
        return { error: selfAssignError.message };
      }
    }
  }

  const { data: existingCoach, error: coachLookupError } = await supabase
    .from('coaches')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (coachLookupError) {
    return { error: coachLookupError.message };
  }

  let coachId = existingCoach?.id ?? null;

  if (!coachId) {
    const { data: coachInsert, error: coachInsertError } = await supabase
      .from('coaches')
      .insert({
        first_name: firstName,
        last_name: lastName,
        email,
      })
      .select('id')
      .single();

    if (coachInsertError || !coachInsert) {
      return { error: coachInsertError?.message || 'Unable to create coach.' };
    }

    coachId = coachInsert.id;
  }

  const { data: existingAssignment, error: assignmentLookupError } = await supabase
    .from('coach_assignments')
    .select('id')
    .eq('coach_id', coachId)
    .eq('team_id', teamId)
    .maybeSingle();

  if (assignmentLookupError) {
    return { error: assignmentLookupError.message };
  }

  if (existingAssignment) {
    return { error: 'That coach is already assigned to this sport.' };
  }

  const { error: insertError } = await supabase
    .from('coach_assignments')
    .insert({
      coach_id: coachId,
      team_id: teamId,
      title,
    });

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/coaches');

  return { success: true };
}