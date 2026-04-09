'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/app/lib/supabase/server';

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function clean(value: FormDataEntryValue | null) {
  return String(value ?? '').trim();
}

async function getCoachId() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in.' as const };
  }

  const { data: coach, error } = await supabase
    .from('coaches')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (error || !coach) {
    return { error: 'Coach account not found.' as const };
  }

  return { coachId: coach.id, supabase };
}

async function buildUniqueSlug(supabase: Awaited<ReturnType<typeof createClient>>, baseName: string, excludeId?: string) {
  const baseSlug = slugify(baseName);
  let slug = baseSlug;
  let count = 1;

  while (true) {
    let query = supabase
      .from('exercises')
      .select('id')
      .eq('slug', slug)
      .limit(1);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) break;
    if (!data || data.length === 0) break;

    count += 1;
    slug = `${baseSlug}-${count}`;
  }

  return slug;
}

export async function createExercise(formData: FormData) {
  const coachResult = await getCoachId();
  if ('error' in coachResult) return { error: coachResult.error };

  const { coachId, supabase } = coachResult;
  const name = clean(formData.get('name'));

  if (!name) {
    return { error: 'Exercise name is required.' };
  }

  const slug = await buildUniqueSlug(supabase, name);

  const payload = {
    name,
    slug,
    category: clean(formData.get('category')) || null,
    movement_pattern: clean(formData.get('movement_pattern')) || null,
    primary_muscle: clean(formData.get('primary_muscle')) || null,
    secondary_muscle: clean(formData.get('secondary_muscle')) || null,
    body_region: clean(formData.get('body_region')) || null,
    equipment: clean(formData.get('equipment')) || null,
    force_type: clean(formData.get('force_type')) || null,
    mechanics: clean(formData.get('mechanics')) || null,
    laterality: clean(formData.get('laterality')) || null,
    skill_level: clean(formData.get('skill_level')) || null,
    description: clean(formData.get('description')) || null,
    instructions: clean(formData.get('instructions')) || null,
    is_system: false,
    coach_id: coachId,
  };

  const { error } = await supabase.from('exercises').insert(payload);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/exercise-library');
  return { success: 'Exercise created successfully.' };
}

export async function updateExercise(formData: FormData) {
  const coachResult = await getCoachId();
  if ('error' in coachResult) return { error: coachResult.error };

  const { coachId, supabase } = coachResult;
  const id = clean(formData.get('id'));
  const name = clean(formData.get('name'));

  if (!id || !name) {
    return { error: 'Exercise id and name are required.' };
  }

  const slug = await buildUniqueSlug(supabase, name, id);

  const payload = {
    name,
    slug,
    category: clean(formData.get('category')) || null,
    movement_pattern: clean(formData.get('movement_pattern')) || null,
    primary_muscle: clean(formData.get('primary_muscle')) || null,
    secondary_muscle: clean(formData.get('secondary_muscle')) || null,
    body_region: clean(formData.get('body_region')) || null,
    equipment: clean(formData.get('equipment')) || null,
    force_type: clean(formData.get('force_type')) || null,
    mechanics: clean(formData.get('mechanics')) || null,
    laterality: clean(formData.get('laterality')) || null,
    skill_level: clean(formData.get('skill_level')) || null,
    description: clean(formData.get('description')) || null,
    instructions: clean(formData.get('instructions')) || null,
  };

  const { data, error } = await supabase
    .from('exercises')
    .update(payload)
    .eq('id', id)
    .eq('coach_id', coachId)
    .eq('is_system', false)
    .select('slug')
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/exercise-library');
  revalidatePath(`/dashboard/exercise-library/${data.slug}`);
  return { success: 'Exercise updated successfully.', slug: data.slug };
}

export async function deleteExercise(formData: FormData) {
  const coachResult = await getCoachId();
  if ('error' in coachResult) return { error: coachResult.error };

  const { coachId, supabase } = coachResult;
  const id = clean(formData.get('id'));

  if (!id) {
    return { error: 'Exercise id is required.' };
  }

  const { error } = await supabase
    .from('exercises')
    .delete()
    .eq('id', id)
    .eq('coach_id', coachId)
    .eq('is_system', false);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/exercise-library');
  return { success: 'Exercise deleted successfully.' };
}