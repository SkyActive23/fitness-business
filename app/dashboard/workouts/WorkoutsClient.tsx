'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { createWorkoutProgram, updateWorkout, deleteWorkout } from './actions';

const WORKOUT_TYPES = [
  'Strength',
  'Power',
  'Speed',
  'Conditioning',
  'Recovery',
  'Mobility',
  'Hypertrophy',
];

type TeamOption = {
  id: string;
  team_name: string;
  sport: string;
  school_name: string;
  title?: string;
};

type ExerciseOption = {
  id: string;
  name?: string | null;
  slug?: string | null;
  category?: string | null;
  movement_pattern?: string | null;
  primary_muscle?: string | null;
  equipment?: string | null;
  is_system?: boolean | null;
  coach_id?: string | null;
};

type SetPrescriptionForm = {
  setNumber: number;
  percentage: string;
  velocity: string;
};

type WorkoutRow = {
  id: string;
  name: string;
  description?: string | null;
  workout_type?: string | null;
  day_label?: string | null;
  is_active?: boolean;
  team_id: string;
  team_name: string;
  sport: string;
  school_name: string;
  exercises: {
    id: string;
    sort_order: number;
    group_label?: string | null;
    sets?: string | null;
    reps?: string | null;
    rest_seconds?: number | null;
    percentage?: string | null;
    load_notes?: string | null;
    coaching_notes?: string | null;
    exercise_id: string;
    exercise_name: string;
    exercise_slug?: string | null;
    category?: string | null;
    movement_pattern?: string | null;
    primary_muscle?: string | null;
    equipment?: string | null;
    use_advanced_loading?: boolean | null;
    loading_method?: 'percentage' | 'velocity' | null;
    set_prescriptions?: {
      setNumber?: number;
      percentage?: string;
      velocity?: string;
    }[] | null;
  }[];
};

type WorkoutExerciseForm = {
  exerciseId: string;
  sortOrder: number;
  groupLabel: string;
  sets: string;
  reps: string;
  restSeconds: string;
  percentage: string;
  loadNotes: string;
  coachingNotes: string;
  useAdvancedLoading: boolean;
  loadingMethod: 'percentage' | 'velocity' | '';
  setPrescriptions: SetPrescriptionForm[];
};

type WeekDayForm = {
  weekNumber: number;
  dayNumber: number;
  dayLabel: string;
  workoutType: string;
  description: string;
  exercises: WorkoutExerciseForm[];
};

type ProgramFormState = {
  teamId: string;
  programName: string;
  durationWeeks: string;
  trainingDaysPerWeek: string;
  weeks: WeekDayForm[][];
};

type EditFormState = {
  workoutId?: string;
  teamId: string;
  name: string;
  description: string;
  workoutType: string;
  dayLabel: string;
  exercises: WorkoutExerciseForm[];
};

function makeSetPrescription(setNumber: number): SetPrescriptionForm {
  return {
    setNumber,
    percentage: '',
    velocity: '',
  };
}

function buildSetPrescriptions(count: number): SetPrescriptionForm[] {
  const total = Number.isNaN(count) || count < 1 ? 1 : count;
  return Array.from({ length: total }, (_, index) => makeSetPrescription(index + 1));
}

function getGroupLetter(index: number) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return letters[index] ?? 'Z';
}

function isCoreLift(
  exercise?: ExerciseOption | { name?: string | null; movement_pattern?: string | null } | null
) {
  const name = (exercise?.name ?? '').toLowerCase();
  const movement = (exercise?.movement_pattern ?? '').toLowerCase();

  return (
    name.includes('barbell bench press') ||
    name.includes('bench press') ||
    name.includes('barbell squat') ||
    name.includes('barbell squats') ||
    name.includes('back squat') ||
    name.includes('front squat') ||
    name.includes('barbell front squat') ||
    name.includes('deadlift') ||
    name.includes('clean') ||
    name.includes('snatch') ||
    name.includes('jerk') ||
    name.includes('olympic') ||
    movement.includes('olympic')
  );
}

function getExerciseById(exercises: ExerciseOption[], id: string) {
  return exercises.find((exercise) => exercise.id === id);
}

function makeExerciseRow(sortOrder = 0): WorkoutExerciseForm {
  return {
    exerciseId: '',
    sortOrder,
    groupLabel: getGroupLetter(sortOrder),
    sets: '',
    reps: '',
    restSeconds: '',
    percentage: '',
    loadNotes: '',
    coachingNotes: '',
    useAdvancedLoading: false,
    loadingMethod: '',
    setPrescriptions: [makeSetPrescription(1)],
  };
}

function makeDay(weekNumber: number, dayNumber: number): WeekDayForm {
  return {
    weekNumber,
    dayNumber,
    dayLabel: `Week ${weekNumber} Day ${dayNumber}`,
    workoutType: '',
    description: '',
    exercises: [makeExerciseRow(0)],
  };
}

function buildWeeks(durationWeeks: number, trainingDaysPerWeek: number): WeekDayForm[][] {
  return Array.from({ length: durationWeeks }, (_, weekIndex) =>
    Array.from({ length: trainingDaysPerWeek }, (_, dayIndex) =>
      makeDay(weekIndex + 1, dayIndex + 1)
    )
  );
}

const buildEmptyProgramForm = (): ProgramFormState => ({
  teamId: '',
  programName: '',
  durationWeeks: '4',
  trainingDaysPerWeek: '3',
  weeks: buildWeeks(4, 3),
});

const buildEmptyEditForm = (): EditFormState => ({
  teamId: '',
  name: '',
  description: '',
  workoutType: '',
  dayLabel: '',
  exercises: [makeExerciseRow(0)],
});

function syncSetPrescriptions(
  current: SetPrescriptionForm[],
  setsValue: string
): SetPrescriptionForm[] {
  const totalSets = Math.max(1, Number(setsValue) || 1);

  return Array.from({ length: totalSets }, (_, index) => {
    return current[index] ?? makeSetPrescription(index + 1);
  }).map((item, index) => ({
    ...item,
    setNumber: index + 1,
  }));
}

function buildEditState(workout: WorkoutRow): EditFormState {
  return {
    workoutId: workout.id,
    teamId: workout.team_id,
    name: workout.name ?? '',
    description: workout.description ?? '',
    workoutType: workout.workout_type ?? '',
    dayLabel: workout.day_label ?? '',
    exercises:
      workout.exercises.length > 0
        ? workout.exercises.map((exercise, index) => ({
            exerciseId: exercise.exercise_id,
            sortOrder: exercise.sort_order ?? index,
            groupLabel: exercise.group_label ?? getGroupLetter(index),
            sets: exercise.sets ?? '',
            reps: exercise.reps ?? '',
            restSeconds:
              exercise.rest_seconds == null ? '' : String(exercise.rest_seconds),
            percentage: exercise.percentage ?? '',
            loadNotes: exercise.load_notes ?? '',
            coachingNotes: exercise.coaching_notes ?? '',
            useAdvancedLoading: Boolean(exercise.use_advanced_loading),
            loadingMethod: exercise.loading_method ?? '',
            setPrescriptions:
              exercise.set_prescriptions && exercise.set_prescriptions.length > 0
                ? exercise.set_prescriptions.map((set, setIndex) => ({
                    setNumber: set.setNumber ?? setIndex + 1,
                    percentage: set.percentage ?? '',
                    velocity: set.velocity ?? '',
                  }))
                : buildSetPrescriptions(Number(exercise.sets) || 1),
          }))
        : [makeExerciseRow(0)],
  };
}

export default function WorkoutsClient({
  teams = [],
  workouts = [],
  exercises = [],
}: {
  teams?: TeamOption[];
  workouts?: WorkoutRow[];
  exercises?: ExerciseOption[];
}) {
  const [message, setMessage] = useState('');
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [deleteWorkoutId, setDeleteWorkoutId] = useState<string | null>(null);

  const [programForm, setProgramForm] = useState<ProgramFormState>(buildEmptyProgramForm());
  const [editForm, setEditForm] = useState<EditFormState>(buildEmptyEditForm());

  const [exerciseSearch, setExerciseSearch] = useState('');
  const [activeWeekIndex, setActiveWeekIndex] = useState(0);
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  function openCreateModal() {
    setMessage('');
    setMode('create');
    setEditingWorkoutId(null);
    setProgramForm(buildEmptyProgramForm());
    setExerciseSearch('');
    setActiveWeekIndex(0);
    setActiveDayIndex(0);
    setIsFormModalOpen(true);
  }

  function openEditModal(workout: WorkoutRow) {
    setMessage('');
    setMode('edit');
    setEditingWorkoutId(workout.id);
    setEditForm(buildEditState(workout));
    setExerciseSearch('');
    setIsFormModalOpen(true);
  }

  function closeFormModal() {
    if (isPending) return;
    setIsFormModalOpen(false);
    setEditingWorkoutId(null);
    setProgramForm(buildEmptyProgramForm());
    setEditForm(buildEmptyEditForm());
    setExerciseSearch('');
    setActiveWeekIndex(0);
    setActiveDayIndex(0);
  }

  const filteredExercises = useMemo(() => {
    const q = exerciseSearch.trim().toLowerCase();
    if (!q) return exercises;

    return exercises.filter((exercise) =>
      [
        exercise.name,
        exercise.category,
        exercise.movement_pattern,
        exercise.primary_muscle,
        exercise.equipment,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [exercises, exerciseSearch]);

  function rebuildWeeks(
  currentWeeks: WeekDayForm[][],
  durationWeeks: number,
  trainingDaysPerWeek: number
) {
  return Array.from({ length: durationWeeks }, (_, weekIndex) =>
    Array.from({ length: trainingDaysPerWeek }, (_, dayIndex) => {
      const existingDay = currentWeeks[weekIndex]?.[dayIndex];

      return {
        ...(existingDay ?? makeDay(weekIndex + 1, dayIndex + 1)),
        weekNumber: weekIndex + 1,
        dayNumber: dayIndex + 1,
      };
    })
  );
}

  function handleProgramInputChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;

    setProgramForm((prev) => {
      const next = { ...prev, [name]: value };
      const durationWeeks =
        name === 'durationWeeks' ? Math.max(1, Number(value) || 1) : Number(prev.durationWeeks);
      const trainingDaysPerWeek =
        name === 'trainingDaysPerWeek'
          ? Math.min(7, Math.max(1, Number(value) || 1))
          : Number(prev.trainingDaysPerWeek);

      if (name === 'durationWeeks' || name === 'trainingDaysPerWeek') {
        return {
          ...next,
          durationWeeks: String(durationWeeks),
          trainingDaysPerWeek: String(trainingDaysPerWeek),
          weeks: rebuildWeeks(prev.weeks, durationWeeks, trainingDaysPerWeek),
        };
      }

      return next;
    });
  }

  function handleEditInputChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleWeekDayChange(
    weekIndex: number,
    dayIndex: number,
    key: keyof WeekDayForm,
    value: string
  ) {
    setProgramForm((prev) => ({
      ...prev,
      weeks: prev.weeks.map((week, currentWeekIndex) =>
        currentWeekIndex === weekIndex
          ? week.map((day, currentDayIndex) =>
              currentDayIndex === dayIndex ? { ...day, [key]: value } : day
            )
          : week
      ),
    }));
  }

  function handleProgramExerciseRowChange(
    weekIndex: number,
    dayIndex: number,
    rowIndex: number,
    key: keyof WorkoutExerciseForm,
    value: string | number | boolean
  ) {
    setProgramForm((prev) => ({
      ...prev,
      weeks: prev.weeks.map((week, currentWeekIndex) => {
        if (currentWeekIndex !== weekIndex) return week;

        return week.map((day, currentDayIndex) => {
          if (currentDayIndex !== dayIndex) return day;

          return {
            ...day,
            exercises: day.exercises.map((row, currentRowIndex) => {
              if (currentRowIndex !== rowIndex) return row;

              const nextRow = { ...row, [key]: value } as WorkoutExerciseForm;

              if (key === 'sets') {
                nextRow.setPrescriptions = syncSetPrescriptions(
                  row.setPrescriptions,
                  String(value)
                );
              }

              if (key === 'useAdvancedLoading' && !value) {
                nextRow.loadingMethod = '';
              }

              if (key === 'loadingMethod') {
                nextRow.useAdvancedLoading = value === 'percentage' || value === 'velocity';
                nextRow.setPrescriptions = syncSetPrescriptions(
                  row.setPrescriptions,
                  nextRow.sets
                );
              }

              if (key === 'exerciseId') {
                const selectedExercise = getExerciseById(exercises, String(value));
                if (!isCoreLift(selectedExercise)) {
                  nextRow.useAdvancedLoading = false;
                  nextRow.loadingMethod = '';
                }
              }

              return nextRow;
            }),
          };
        });
      }),
    }));
  }

  function handleProgramSetPrescriptionChange(
    weekIndex: number,
    dayIndex: number,
    rowIndex: number,
    setIndex: number,
    key: 'percentage' | 'velocity',
    value: string
  ) {
    setProgramForm((prev) => ({
      ...prev,
      weeks: prev.weeks.map((week, currentWeekIndex) => {
        if (currentWeekIndex !== weekIndex) return week;

        return week.map((day, currentDayIndex) => {
          if (currentDayIndex !== dayIndex) return day;

          return {
            ...day,
            exercises: day.exercises.map((row, currentRowIndex) => {
              if (currentRowIndex !== rowIndex) return row;

              return {
                ...row,
                setPrescriptions: row.setPrescriptions.map((set, currentSetIndex) =>
                  currentSetIndex === setIndex ? { ...set, [key]: value } : set
                ),
              };
            }),
          };
        });
      }),
    }));
  }

  function addProgramExerciseRow(weekIndex: number, dayIndex: number) {
    setProgramForm((prev) => ({
      ...prev,
      weeks: prev.weeks.map((week, currentWeekIndex) => {
        if (currentWeekIndex !== weekIndex) return week;

        return week.map((day, currentDayIndex) => {
          if (currentDayIndex !== dayIndex) return day;

          return {
            ...day,
            exercises: [...day.exercises, makeExerciseRow(day.exercises.length)],
          };
        });
      }),
    }));
  }

  function removeProgramExerciseRow(weekIndex: number, dayIndex: number, rowIndex: number) {
    setProgramForm((prev) => ({
      ...prev,
      weeks: prev.weeks.map((week, currentWeekIndex) => {
        if (currentWeekIndex !== weekIndex) return week;

        return week.map((day, currentDayIndex) => {
          if (currentDayIndex !== dayIndex) return day;

          const nextRows =
            day.exercises.length === 1
              ? [makeExerciseRow(0)]
              : day.exercises
                  .filter((_, currentRowIndex) => currentRowIndex !== rowIndex)
                  .map((row, newIndex) => ({
                    ...row,
                    sortOrder: newIndex,
                    groupLabel: row.groupLabel || getGroupLetter(newIndex),
                  }));

          return {
            ...day,
            exercises: nextRows,
          };
        });
      }),
    }));
  }

  function copyPreviousWeek(weekIndex: number) {
    if (weekIndex === 0) return;

    setProgramForm((prev) => {
      const previousWeek = prev.weeks[weekIndex - 1];
      if (!previousWeek) return prev;

      const clonedWeek = previousWeek.map((day, dayIndex) => ({
        ...day,
        weekNumber: weekIndex + 1,
        dayNumber: dayIndex + 1,
        dayLabel: `Week ${weekIndex + 1} Day ${dayIndex + 1}`,
        exercises: day.exercises.map((exercise, exerciseIndex) => ({
          ...exercise,
          sortOrder: exerciseIndex,
          setPrescriptions: exercise.setPrescriptions.map((set, setIndex) => ({
            ...set,
            setNumber: setIndex + 1,
          })),
        })),
      }));

      return {
        ...prev,
        weeks: prev.weeks.map((week, currentWeekIndex) =>
          currentWeekIndex === weekIndex ? clonedWeek : week
        ),
      };
    });
  }

  function handleEditExerciseRowChange(
    index: number,
    key: keyof WorkoutExerciseForm,
    value: string | number | boolean
  ) {
    setEditForm((prev) => ({
      ...prev,
      exercises: prev.exercises.map((row, rowIndex) => {
        if (rowIndex !== index) return row;

        const nextRow = { ...row, [key]: value } as WorkoutExerciseForm;

        if (key === 'sets') {
          nextRow.setPrescriptions = syncSetPrescriptions(
            row.setPrescriptions,
            String(value)
          );
        }

        if (key === 'useAdvancedLoading' && !value) {
          nextRow.loadingMethod = '';
        }

        if (key === 'loadingMethod') {
          nextRow.useAdvancedLoading = value === 'percentage' || value === 'velocity';
          nextRow.setPrescriptions = syncSetPrescriptions(
            row.setPrescriptions,
            nextRow.sets
          );
        }

        if (key === 'exerciseId') {
          const selectedExercise = getExerciseById(exercises, String(value));
          if (!isCoreLift(selectedExercise)) {
            nextRow.useAdvancedLoading = false;
            nextRow.loadingMethod = '';
          }
        }

        return nextRow;
      }),
    }));
  }

  function handleEditSetPrescriptionChange(
    rowIndex: number,
    setIndex: number,
    key: 'percentage' | 'velocity',
    value: string
  ) {
    setEditForm((prev) => ({
      ...prev,
      exercises: prev.exercises.map((row, currentRowIndex) => {
        if (currentRowIndex !== rowIndex) return row;

        return {
          ...row,
          setPrescriptions: row.setPrescriptions.map((set, currentSetIndex) =>
            currentSetIndex === setIndex ? { ...set, [key]: value } : set
          ),
        };
      }),
    }));
  }

  function addEditExerciseRow() {
    setEditForm((prev) => ({
      ...prev,
      exercises: [...prev.exercises, makeExerciseRow(prev.exercises.length)],
    }));
  }

  function removeEditExerciseRow(index: number) {
    setEditForm((prev) => ({
      ...prev,
      exercises:
        prev.exercises.length === 1
          ? [makeExerciseRow(0)]
          : prev.exercises
              .filter((_, rowIndex) => rowIndex !== index)
              .map((row, rowIndex) => ({
                ...row,
                sortOrder: rowIndex,
                groupLabel: row.groupLabel || getGroupLetter(rowIndex),
              })),
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage('');

    if (mode === 'create') {
      setPendingKey('create-program');

      startTransition(async () => {
        const payload = {
          teamId: programForm.teamId,
          programName: programForm.programName,
          durationWeeks: Number(programForm.durationWeeks),
          trainingDaysPerWeek: Number(programForm.trainingDaysPerWeek),
          weeks: programForm.weeks.map((week, weekIndex) =>
            week.map((day, dayIndex) => ({
              weekNumber: weekIndex + 1,
              dayNumber: dayIndex + 1,
              dayLabel: day.dayLabel,
              workoutType: day.workoutType,
              description: day.description,
              exercises: day.exercises.map((exercise, exerciseIndex) => ({
                ...exercise,
                sortOrder: exerciseIndex,
              })),
            }))
          ),
        };

        console.log('CREATE PROGRAM PAYLOAD:', payload);

        const result = await createWorkoutProgram(payload);

        console.log('CREATE PROGRAM RESULT:', result);

        if (result?.error) {
          setMessage(result.error);
          setPendingKey(null);
          return;
        }

        setMessage('Workout program created successfully.');
        setPendingKey(null);
        setIsFormModalOpen(false);
        setProgramForm(buildEmptyProgramForm());
        setExerciseSearch('');
        setActiveWeekIndex(0);
        setActiveDayIndex(0);
      });

      return;
    }

    if (!editingWorkoutId) return;

    setPendingKey(`update-${editingWorkoutId}`);

    startTransition(async () => {
      const result = await updateWorkout({
        workoutId: editingWorkoutId,
        teamId: editForm.teamId,
        name: editForm.name,
        description: editForm.description,
        workoutType: editForm.workoutType,
        dayLabel: editForm.dayLabel,
        exercises: editForm.exercises.map((exercise, index) => ({
          ...exercise,
          sortOrder: index,
        })),
      });

      console.log('UPDATE WORKOUT RESULT:', result);

      if (result?.error) {
        setMessage(result.error);
        setPendingKey(null);
        return;
      }

      setMessage('Workout updated successfully.');
      setPendingKey(null);
      setIsFormModalOpen(false);
      setEditingWorkoutId(null);
      setEditForm(buildEmptyEditForm());
      setExerciseSearch('');
    });
  }

  async function handleDeleteConfirm() {
    if (!deleteWorkoutId) return;

    setMessage('');
    setPendingKey(`delete-${deleteWorkoutId}`);

    startTransition(async () => {
      const result = await deleteWorkout({ workoutId: deleteWorkoutId });

      if (result?.error) {
        setMessage(result.error);
        setPendingKey(null);
        return;
      }

      setMessage('Workout deleted successfully.');
      setPendingKey(null);
      setDeleteWorkoutId(null);
    });
  }

  const activeWeek = programForm.weeks[activeWeekIndex] ?? [];
  const activeDay = activeWeek[activeDayIndex];

  return (
    <section className="w-full space-y-8">
      <section className="space-y-6 rounded-2xl border border-slate-600 bg-slate-800/95 p-6 shadow-2xl sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Workout Builder
            </h2>
            <p className="mt-2 text-slate-300">
              Build multi-week programs with week-by-week progression.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-xl bg-white px-5 py-3 font-semibold text-slate-800 shadow-lg transition hover:scale-[1.01]"
          >
            Add Workout Program
          </button>
        </div>
      </section>

      {message && (
        <div className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-slate-100 shadow-lg">
          {message}
        </div>
      )}

      {!workouts.length ? (
        <section className="rounded-2xl border border-slate-600 bg-slate-800/95 p-8 text-center shadow-2xl">
          <h3 className="text-xl font-bold text-white">No workouts yet</h3>
          <p className="mt-2 text-slate-300">
            Once you create a workout program, it will show up here.
          </p>
        </section>
      ) : (
        <div className="space-y-8">
          {workouts.map((workout) => (
            <section
              key={workout.id}
              className="overflow-hidden rounded-2xl border border-slate-600 bg-slate-800/95 shadow-2xl"
            >
              <div className="flex flex-col gap-4 border-b border-slate-600 bg-slate-800 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white">{workout.name}</h3>
                  <p className="mt-2 text-slate-300">
                    {workout.school_name} — {workout.team_name} — {workout.sport}
                  </p>
                  <p className="mt-2 text-slate-300">
                    {workout.workout_type || '—'}
                    {workout.day_label ? ` • ${workout.day_label}` : ''}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(workout)}
                    className="rounded-lg bg-white px-4 py-2 font-semibold text-slate-800 shadow transition hover:scale-[1.02]"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteWorkoutId(workout.id)}
                    className="rounded-lg bg-red-500 px-4 py-2 font-semibold text-white shadow transition hover:scale-[1.02]"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="space-y-4 p-6">
                <div className="rounded-xl bg-slate-700 p-4">
                  <h4 className="text-lg font-bold text-white">Description</h4>
                  <p className="mt-2 text-slate-200">
                    {workout.description || 'No description provided.'}
                  </p>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-600">
                  <table className="min-w-full text-sm text-white">
                    <thead className="bg-slate-900">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Order</th>
                        <th className="px-4 py-3 text-left font-semibold">Group</th>
                        <th className="px-4 py-3 text-left font-semibold">Exercise</th>
                        <th className="px-4 py-3 text-left font-semibold">Sets</th>
                        <th className="px-4 py-3 text-left font-semibold">Reps</th>
                        <th className="px-4 py-3 text-left font-semibold">Rest</th>
                        <th className="px-4 py-3 text-left font-semibold">Load Method</th>
                        <th className="px-4 py-3 text-left font-semibold">Prescription</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workout.exercises.map((exercise, index) => (
                        <tr
                          key={exercise.id}
                          className={index % 2 === 0 ? 'bg-slate-700' : 'bg-slate-600'}
                        >
                          <td className="px-4 py-3">{exercise.sort_order + 1}</td>
                          <td className="px-4 py-3">{exercise.group_label || '—'}</td>
                          <td className="px-4 py-3">
                            {exercise.exercise_slug ? (
                              <Link
                                href={`/dashboard/exercise-library/${exercise.exercise_slug}`}
                                className="underline underline-offset-4 hover:text-slate-200"
                              >
                                {exercise.exercise_name}
                              </Link>
                            ) : (
                              exercise.exercise_name
                            )}
                          </td>
                          <td className="px-4 py-3">{exercise.sets || '—'}</td>
                          <td className="px-4 py-3">{exercise.reps || '—'}</td>
                          <td className="px-4 py-3">
                            {exercise.rest_seconds == null ? '—' : `${exercise.rest_seconds}s`}
                          </td>
                          <td className="px-4 py-3">
                            {exercise.loading_method === 'percentage'
                              ? 'Percentage'
                              : exercise.loading_method === 'velocity'
                              ? 'Velocity'
                              : exercise.percentage || 'Standard'}
                          </td>
                          <td className="px-4 py-3">
                            {exercise.set_prescriptions && exercise.set_prescriptions.length > 0 ? (
                              <div className="space-y-1">
                                {exercise.set_prescriptions.map((set, setIndex) => (
                                  <div key={setIndex}>
                                    Set {set.setNumber ?? setIndex + 1}:{' '}
                                    {exercise.loading_method === 'percentage'
                                      ? set.percentage || '—'
                                      : set.velocity
                                      ? `${set.velocity} m/s`
                                      : '—'}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              exercise.percentage || '—'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}

      {isFormModalOpen && (
        <ModalShell onClose={closeFormModal}>
          <div className="max-h-[90vh] w-full max-w-7xl overflow-y-auto rounded-2xl bg-slate-800 p-6 text-white shadow-xl">
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold">
                {mode === 'create' ? 'Create Workout Program' : 'Edit Workout'}
              </h2>

              <button
                type="button"
                onClick={closeFormModal}
                className="rounded-lg bg-slate-700 px-4 py-2 font-semibold transition hover:bg-slate-600"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {mode === 'create' ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Field label="Team">
                      <select
                        name="teamId"
                        value={programForm.teamId}
                        onChange={handleProgramInputChange}
                        required
                        className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                      >
                        <option value="" disabled>
                          Select team
                        </option>
                        {teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.school_name} — {team.team_name} — {team.sport}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Program Name">
                      <input
                        name="programName"
                        value={programForm.programName}
                        onChange={handleProgramInputChange}
                        required
                        placeholder="Offseason Strength Block"
                        className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                      />
                    </Field>

                    <Field label="Duration (weeks)">
                      <input
                        type="number"
                        min={1}
                        max={52}
                        name="durationWeeks"
                        value={programForm.durationWeeks}
                        onChange={handleProgramInputChange}
                        required
                        className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                      />
                    </Field>

                    <Field label="Days Per Week">
                      <select
                        name="trainingDaysPerWeek"
                        value={programForm.trainingDaysPerWeek}
                        onChange={handleProgramInputChange}
                        className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                      >
                        {Array.from({ length: 7 }, (_, i) => i + 1).map((num) => (
                          <option key={num} value={num}>
                            {num}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <div className="rounded-xl border border-slate-600 bg-slate-700/60 p-4 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {programForm.weeks.map((_, weekIndex) => (
                        <button
                          key={weekIndex}
                          type="button"
                          onClick={() => {
                            setActiveWeekIndex(weekIndex);
                            setActiveDayIndex(0);
                          }}
                          className={`rounded-lg px-4 py-2 font-semibold transition ${
                            activeWeekIndex === weekIndex
                              ? 'bg-white text-slate-800'
                              : 'bg-slate-800 text-white'
                          }`}
                        >
                          Week {weekIndex + 1}
                        </button>
                      ))}

                      {activeWeekIndex > 0 && (
                        <button
                          type="button"
                          onClick={() => copyPreviousWeek(activeWeekIndex)}
                          className="ml-2 rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-white transition hover:scale-[1.01]"
                        >
                          Copy Previous Week
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {activeWeek.map((day, dayIndex) => (
                        <button
                          key={`${day.weekNumber}-${day.dayNumber}`}
                          type="button"
                          onClick={() => setActiveDayIndex(dayIndex)}
                          className={`rounded-lg px-4 py-2 font-semibold transition ${
                            activeDayIndex === dayIndex
                              ? 'bg-white text-slate-800'
                              : 'bg-slate-800 text-white'
                          }`}
                        >
                          Day {dayIndex + 1}
                        </button>
                      ))}
                    </div>

                    {activeDay && (
                      <div className="space-y-6 rounded-xl border border-slate-600 bg-slate-800 p-4">
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                          <Field label="Day Label">
                            <input
                              value={activeDay.dayLabel}
                              onChange={(e) =>
                                handleWeekDayChange(
                                  activeWeekIndex,
                                  activeDayIndex,
                                  'dayLabel',
                                  e.target.value
                                )
                              }
                              placeholder={`Week ${activeWeekIndex + 1} Day ${activeDayIndex + 1}`}
                              className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                            />
                          </Field>

                          <Field label="Workout Type">
                            <select
                              value={activeDay.workoutType}
                              onChange={(e) =>
                                handleWeekDayChange(
                                  activeWeekIndex,
                                  activeDayIndex,
                                  'workoutType',
                                  e.target.value
                                )
                              }
                              className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                            >
                              <option value="">Select workout type</option>
                              {WORKOUT_TYPES.map((type) => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ))}
                            </select>
                          </Field>

                          <Field label="Description" className="md:col-span-2 xl:col-span-1">
                            <input
                              value={activeDay.description}
                              onChange={(e) =>
                                handleWeekDayChange(
                                  activeWeekIndex,
                                  activeDayIndex,
                                  'description',
                                  e.target.value
                                )
                              }
                              placeholder="Main emphasis for this day"
                              className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                            />
                          </Field>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <h3 className="text-xl font-bold">
                            Week {activeWeekIndex + 1} • Day {activeDayIndex + 1}
                          </h3>

                          <div className="flex flex-col gap-3 sm:flex-row">
                            <input
                              type="text"
                              value={exerciseSearch}
                              onChange={(e) => setExerciseSearch(e.target.value)}
                              placeholder="Search exercise library..."
                              className="rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                            />

                            <button
                              type="button"
                              onClick={() => addProgramExerciseRow(activeWeekIndex, activeDayIndex)}
                              className="rounded-lg bg-white px-4 py-3 font-semibold text-slate-800"
                            >
                              Add Exercise Row
                            </button>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {activeDay.exercises.map((row, rowIndex) => {
                            const selectedExercise = getExerciseById(exercises, row.exerciseId);
                            const rowIsCoreLift = isCoreLift(selectedExercise);

                            return (
                              <div
                                key={rowIndex}
                                className="space-y-4 rounded-xl border border-slate-600 bg-slate-700 p-4"
                              >
                                <div className="flex items-center justify-between">
                                  <h4 className="font-bold text-white">
                                    Exercise {rowIndex + 1}
                                  </h4>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeProgramExerciseRow(
                                        activeWeekIndex,
                                        activeDayIndex,
                                        rowIndex
                                      )
                                    }
                                    className="rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white"
                                  >
                                    Remove
                                  </button>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                  <Field label="Exercise" className="xl:col-span-2">
                                    <select
                                      value={row.exerciseId}
                                      onChange={(e) =>
                                        handleProgramExerciseRowChange(
                                          activeWeekIndex,
                                          activeDayIndex,
                                          rowIndex,
                                          'exerciseId',
                                          e.target.value
                                        )
                                      }
                                      className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                                    >
                                      <option value="">Select exercise</option>
                                      {filteredExercises.map((exercise) => (
                                        <option key={exercise.id} value={exercise.id}>
                                          {exercise.name}
                                          {exercise.movement_pattern
                                            ? ` — ${exercise.movement_pattern}`
                                            : ''}
                                        </option>
                                      ))}
                                    </select>
                                  </Field>

                                  <Field label="Group">
                                    <input
                                      value={row.groupLabel}
                                      onChange={(e) =>
                                        handleProgramExerciseRowChange(
                                          activeWeekIndex,
                                          activeDayIndex,
                                          rowIndex,
                                          'groupLabel',
                                          e.target.value.toUpperCase()
                                        )
                                      }
                                      placeholder="A"
                                      maxLength={10}
                                      className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                                    />
                                  </Field>

                                  <Field label="Sets">
                                    <input
                                      value={row.sets}
                                      onChange={(e) =>
                                        handleProgramExerciseRowChange(
                                          activeWeekIndex,
                                          activeDayIndex,
                                          rowIndex,
                                          'sets',
                                          e.target.value
                                        )
                                      }
                                      placeholder="3"
                                      className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                                    />
                                  </Field>

                                  <Field label="Reps">
                                    <input
                                      value={row.reps}
                                      onChange={(e) =>
                                        handleProgramExerciseRowChange(
                                          activeWeekIndex,
                                          activeDayIndex,
                                          rowIndex,
                                          'reps',
                                          e.target.value
                                        )
                                      }
                                      placeholder="5"
                                      className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                                    />
                                  </Field>

                                  <Field label="Rest (sec)">
                                    <input
                                      value={row.restSeconds}
                                      onChange={(e) =>
                                        handleProgramExerciseRowChange(
                                          activeWeekIndex,
                                          activeDayIndex,
                                          rowIndex,
                                          'restSeconds',
                                          e.target.value
                                        )
                                      }
                                      placeholder="90"
                                      className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                                    />
                                  </Field>

                                  {!row.useAdvancedLoading && (
                                    <Field label="Percentage">
                                      <input
                                        value={row.percentage}
                                        onChange={(e) =>
                                          handleProgramExerciseRowChange(
                                            activeWeekIndex,
                                            activeDayIndex,
                                            rowIndex,
                                            'percentage',
                                            e.target.value
                                          )
                                        }
                                        placeholder="75%"
                                        className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                                      />
                                    </Field>
                                  )}

                                  <Field label="Load Notes" className="md:col-span-2">
                                    <input
                                      value={row.loadNotes}
                                      onChange={(e) =>
                                        handleProgramExerciseRowChange(
                                          activeWeekIndex,
                                          activeDayIndex,
                                          rowIndex,
                                          'loadNotes',
                                          e.target.value
                                        )
                                      }
                                      placeholder="Use last working set + 5 lbs"
                                      className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                                    />
                                  </Field>

                                  <Field label="Coaching Notes" className="md:col-span-2">
                                    <input
                                      value={row.coachingNotes}
                                      onChange={(e) =>
                                        handleProgramExerciseRowChange(
                                          activeWeekIndex,
                                          activeDayIndex,
                                          rowIndex,
                                          'coachingNotes',
                                          e.target.value
                                        )
                                      }
                                      placeholder="Explode up, controlled down"
                                      className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                                    />
                                  </Field>
                                </div>

                                {rowIsCoreLift && (
                                  <div className="space-y-4 rounded-xl border border-slate-500 bg-slate-800/80 p-4">
                                    <h5 className="text-lg font-bold text-white">
                                      Advanced Loading
                                    </h5>

                                    <label className="flex items-center gap-3 text-slate-200">
                                      <input
                                        type="checkbox"
                                        checked={row.useAdvancedLoading}
                                        onChange={(e) =>
                                          handleProgramExerciseRowChange(
                                            activeWeekIndex,
                                            activeDayIndex,
                                            rowIndex,
                                            'useAdvancedLoading',
                                            e.target.checked
                                          )
                                        }
                                      />
                                      Use advanced loading for this core lift
                                    </label>

                                    {row.useAdvancedLoading && (
                                      <>
                                        <div className="flex flex-wrap gap-6">
                                          <label className="flex items-center gap-3 text-slate-200">
                                            <input
                                              type="checkbox"
                                              checked={row.loadingMethod === 'percentage'}
                                              onChange={(e) =>
                                                handleProgramExerciseRowChange(
                                                  activeWeekIndex,
                                                  activeDayIndex,
                                                  rowIndex,
                                                  'loadingMethod',
                                                  e.target.checked ? 'percentage' : ''
                                                )
                                              }
                                            />
                                            Use percentages
                                          </label>

                                          <label className="flex items-center gap-3 text-slate-200">
                                            <input
                                              type="checkbox"
                                              checked={row.loadingMethod === 'velocity'}
                                              onChange={(e) =>
                                                handleProgramExerciseRowChange(
                                                  activeWeekIndex,
                                                  activeDayIndex,
                                                  rowIndex,
                                                  'loadingMethod',
                                                  e.target.checked ? 'velocity' : ''
                                                )
                                              }
                                            />
                                            Use velocity / m/s
                                          </label>
                                        </div>

                                        {row.loadingMethod && (
                                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                            {row.setPrescriptions.map((set, setIndex) => (
                                              <div
                                                key={setIndex}
                                                className="rounded-lg border border-slate-600 bg-slate-700 p-3"
                                              >
                                                <div className="mb-2 font-semibold text-white">
                                                  Set {set.setNumber}
                                                </div>

                                                {row.loadingMethod === 'percentage' ? (
                                                  <input
                                                    value={set.percentage}
                                                    onChange={(e) =>
                                                      handleProgramSetPrescriptionChange(
                                                        activeWeekIndex,
                                                        activeDayIndex,
                                                        rowIndex,
                                                        setIndex,
                                                        'percentage',
                                                        e.target.value
                                                      )
                                                    }
                                                    placeholder="80%"
                                                    className="w-full rounded-lg border border-slate-500 bg-slate-800 px-3 py-2 text-white"
                                                  />
                                                ) : (
                                                  <input
                                                    value={set.velocity}
                                                    onChange={(e) =>
                                                      handleProgramSetPrescriptionChange(
                                                        activeWeekIndex,
                                                        activeDayIndex,
                                                        rowIndex,
                                                        setIndex,
                                                        'velocity',
                                                        e.target.value
                                                      )
                                                    }
                                                    placeholder="0.75"
                                                    className="w-full rounded-lg border border-slate-500 bg-slate-800 px-3 py-2 text-white"
                                                  />
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Team">
                      <select
                        name="teamId"
                        value={editForm.teamId}
                        onChange={handleEditInputChange}
                        required
                        className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                      >
                        <option value="" disabled>
                          Select team
                        </option>
                        {teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.school_name} — {team.team_name} — {team.sport}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Workout Name">
                      <input
                        name="name"
                        value={editForm.name}
                        onChange={handleEditInputChange}
                        required
                        className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                      />
                    </Field>

                    <Field label="Workout Type">
                      <select
                        name="workoutType"
                        value={editForm.workoutType}
                        onChange={handleEditInputChange}
                        className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                      >
                        <option value="">Select workout type</option>
                        {WORKOUT_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Day Label">
                      <input
                        name="dayLabel"
                        value={editForm.dayLabel}
                        onChange={handleEditInputChange}
                        placeholder="Example: Week 1 - Day 1"
                        className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                      />
                    </Field>

                    <Field label="Description" className="md:col-span-2">
                      <textarea
                        name="description"
                        value={editForm.description}
                        onChange={handleEditInputChange}
                        rows={3}
                        className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                      />
                    </Field>
                  </div>

                  <div className="space-y-4 rounded-xl border border-slate-600 bg-slate-700/60 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <h3 className="text-xl font-bold">Workout Exercises</h3>

                      <div className="flex flex-col gap-3 sm:flex-row">
                        <input
                          type="text"
                          value={exerciseSearch}
                          onChange={(e) => setExerciseSearch(e.target.value)}
                          placeholder="Search exercise library..."
                          className="rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                        />

                        <button
                          type="button"
                          onClick={addEditExerciseRow}
                          className="rounded-lg bg-white px-4 py-3 font-semibold text-slate-800"
                        >
                          Add Exercise Row
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {editForm.exercises.map((row, index) => {
                        const selectedExercise = getExerciseById(exercises, row.exerciseId);
                        const rowIsCoreLift = isCoreLift(selectedExercise);

                        return (
                          <div
                            key={index}
                            className="space-y-4 rounded-xl border border-slate-600 bg-slate-800 p-4"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-white">Exercise {index + 1}</h4>

                              <button
                                type="button"
                                onClick={() => removeEditExerciseRow(index)}
                                className="rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white"
                              >
                                Remove
                              </button>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                              <Field label="Exercise" className="xl:col-span-2">
                                <select
                                  value={row.exerciseId}
                                  onChange={(e) =>
                                    handleEditExerciseRowChange(
                                      index,
                                      'exerciseId',
                                      e.target.value
                                    )
                                  }
                                  className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                                >
                                  <option value="">Select exercise</option>
                                  {filteredExercises.map((exercise) => (
                                    <option key={exercise.id} value={exercise.id}>
                                      {exercise.name}
                                      {exercise.movement_pattern
                                        ? ` — ${exercise.movement_pattern}`
                                        : ''}
                                    </option>
                                  ))}
                                </select>
                              </Field>

                              <Field label="Group">
                                <input
                                  value={row.groupLabel}
                                  onChange={(e) =>
                                    handleEditExerciseRowChange(
                                      index,
                                      'groupLabel',
                                      e.target.value.toUpperCase()
                                    )
                                  }
                                  placeholder="A"
                                  maxLength={10}
                                  className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                                />
                              </Field>

                              <Field label="Sets">
                                <input
                                  value={row.sets}
                                  onChange={(e) =>
                                    handleEditExerciseRowChange(index, 'sets', e.target.value)
                                  }
                                  placeholder="3"
                                  className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                                />
                              </Field>

                              <Field label="Reps">
                                <input
                                  value={row.reps}
                                  onChange={(e) =>
                                    handleEditExerciseRowChange(index, 'reps', e.target.value)
                                  }
                                  placeholder="5"
                                  className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                                />
                              </Field>

                              <Field label="Rest (sec)">
                                <input
                                  value={row.restSeconds}
                                  onChange={(e) =>
                                    handleEditExerciseRowChange(index, 'restSeconds', e.target.value)
                                  }
                                  placeholder="90"
                                  className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                                />
                              </Field>

                              {!row.useAdvancedLoading && (
                                <Field label="Percentage">
                                  <input
                                    value={row.percentage}
                                    onChange={(e) =>
                                      handleEditExerciseRowChange(
                                        index,
                                        'percentage',
                                        e.target.value
                                      )
                                    }
                                    placeholder="75%"
                                    className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                                  />
                                </Field>
                              )}

                              <Field label="Load Notes" className="md:col-span-2">
                                <input
                                  value={row.loadNotes}
                                  onChange={(e) =>
                                    handleEditExerciseRowChange(index, 'loadNotes', e.target.value)
                                  }
                                  placeholder="Use last working set + 5 lbs"
                                  className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                                />
                              </Field>

                              <Field label="Coaching Notes" className="md:col-span-2">
                                <input
                                  value={row.coachingNotes}
                                  onChange={(e) =>
                                    handleEditExerciseRowChange(
                                      index,
                                      'coachingNotes',
                                      e.target.value
                                    )
                                  }
                                  placeholder="Explode up, controlled down"
                                  className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                                />
                              </Field>
                            </div>

                            {rowIsCoreLift && (
                              <div className="space-y-4 rounded-xl border border-slate-500 bg-slate-700/70 p-4">
                                <h5 className="text-lg font-bold text-white">
                                  Advanced Loading
                                </h5>

                                <label className="flex items-center gap-3 text-slate-200">
                                  <input
                                    type="checkbox"
                                    checked={row.useAdvancedLoading}
                                    onChange={(e) =>
                                      handleEditExerciseRowChange(
                                        index,
                                        'useAdvancedLoading',
                                        e.target.checked
                                      )
                                    }
                                  />
                                  Use advanced loading for this core lift
                                </label>

                                {row.useAdvancedLoading && (
                                  <>
                                    <div className="flex flex-wrap gap-6">
                                      <label className="flex items-center gap-3 text-slate-200">
                                        <input
                                          type="checkbox"
                                          checked={row.loadingMethod === 'percentage'}
                                          onChange={(e) =>
                                            handleEditExerciseRowChange(
                                              index,
                                              'loadingMethod',
                                              e.target.checked ? 'percentage' : ''
                                            )
                                          }
                                        />
                                        Use percentages
                                      </label>

                                      <label className="flex items-center gap-3 text-slate-200">
                                        <input
                                          type="checkbox"
                                          checked={row.loadingMethod === 'velocity'}
                                          onChange={(e) =>
                                            handleEditExerciseRowChange(
                                              index,
                                              'loadingMethod',
                                              e.target.checked ? 'velocity' : ''
                                            )
                                          }
                                        />
                                        Use velocity / m/s
                                      </label>
                                    </div>

                                    {row.loadingMethod && (
                                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                        {row.setPrescriptions.map((set, setIndex) => (
                                          <div
                                            key={setIndex}
                                            className="rounded-lg border border-slate-600 bg-slate-800 p-3"
                                          >
                                            <div className="mb-2 font-semibold text-white">
                                              Set {set.setNumber}
                                            </div>

                                            {row.loadingMethod === 'percentage' ? (
                                              <input
                                                value={set.percentage}
                                                onChange={(e) =>
                                                  handleEditSetPrescriptionChange(
                                                    index,
                                                    setIndex,
                                                    'percentage',
                                                    e.target.value
                                                  )
                                                }
                                                placeholder="80%"
                                                className="w-full rounded-lg border border-slate-500 bg-slate-700 px-3 py-2 text-white"
                                              />
                                            ) : (
                                              <input
                                                value={set.velocity}
                                                onChange={(e) =>
                                                  handleEditSetPrescriptionChange(
                                                    index,
                                                    setIndex,
                                                    'velocity',
                                                    e.target.value
                                                  )
                                                }
                                                placeholder="0.75"
                                                className="w-full rounded-lg border border-slate-500 bg-slate-700 px-3 py-2 text-white"
                                              />
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-white px-5 py-3 font-semibold text-slate-800 shadow transition hover:scale-[1.02]"
                >
                  {isPending
                    ? mode === 'create'
                      ? 'Creating Program...'
                      : 'Saving...'
                    : mode === 'create'
                    ? 'Create Program'
                    : 'Save Workout'}
                </button>

                <button
                  type="button"
                  onClick={closeFormModal}
                  disabled={isPending}
                  className="rounded-lg bg-slate-600 px-5 py-3 font-semibold text-white shadow transition hover:scale-[1.02]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </ModalShell>
      )}

      {deleteWorkoutId && (
        <ModalShell onClose={() => setDeleteWorkoutId(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-slate-800 p-6 text-white shadow-xl">
            <h2 className="text-2xl font-bold">Delete Workout</h2>
            <p className="mt-4 text-slate-300">
              Are you sure you want to delete this workout? This action cannot be undone.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isPending}
                className="rounded-lg bg-red-500 px-5 py-3 font-semibold text-white shadow transition hover:scale-[1.02]"
              >
                {isPending && pendingKey === `delete-${deleteWorkoutId}`
                  ? 'Deleting...'
                  : 'Yes, Delete'}
              </button>

              <button
                type="button"
                onClick={() => setDeleteWorkoutId(null)}
                disabled={isPending}
                className="rounded-lg bg-slate-600 px-5 py-3 font-semibold text-white shadow transition hover:scale-[1.02]"
              >
                Cancel
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </section>
  );
}

function Field({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-semibold text-slate-200">
        {label}
      </label>
      {children}
    </div>
  );
}

function ModalShell({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative z-[101] w-full max-w-7xl animate-in fade-in zoom-in-95 px-4 duration-200">
        {children}
      </div>
    </div>
  );
}