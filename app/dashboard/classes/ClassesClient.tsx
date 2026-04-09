'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { createClass, updateClass, deleteClass } from './action';

const WORKOUT_TYPES = [
  'Strength',
  'Power',
  'Speed',
  'Conditioning',
  'Recovery',
  'Mobility',
  'Hypertrophy',
] as const;

const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

const DAYS_MONDAY_FIRST = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

type CalendarViewMode = 'day' | 'week' | 'month';

type TeamOption = {
  id: string;
  team_name: string;
  sport: string;
  school_name: string;
  assignment_title?: string;
};

type AthleteOption = {
  id: string;
  first_name: string;
  last_name: string;
  position?: string | null;
  team_id: string;
  team_name: string;
  sport: string;
};

type CoachOption = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  team_id: string;
  title: string;
};

type WorkoutOption = {
  id: string;
  name: string;
  day_label?: string | null;
  workout_type?: string | null;
  team_id: string;
};

type ClassRow = {
  id: string;
  name: string;
  description?: string | null;
  workout_type?: string | null;
  workout_id?: string | null;
  workout_name?: string | null;
  workout_day_label?: string | null;
  duration_minutes?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  is_active?: boolean;
  team_id: string;
  team_name: string;
  sport: string;
  school_name: string;
  days: string[];
  coaches: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  }[];
  athletes: {
    id: string;
    first_name: string;
    last_name: string;
    position?: string | null;
  }[];
};

type FormState = {
  classId?: string;
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

type CalendarOccurrence = {
  classItem: ClassRow;
  date: Date;
};

const emptyForm: FormState = {
  teamId: '',
  name: '',
  description: '',
  workoutType: '',
  workoutId: '',
  durationMinutes: '',
  startDate: '',
  endDate: '',
  startTime: '',
  endTime: '',
  days: [],
  coachIds: [],
  athleteIds: [],
};

function buildEditState(item: ClassRow): FormState {
  return {
    classId: item.id,
    teamId: item.team_id,
    name: item.name ?? '',
    description: item.description ?? '',
    workoutType: item.workout_type ?? '',
    workoutId: item.workout_id ?? '',
    durationMinutes:
      item.duration_minutes == null ? '' : String(item.duration_minutes),
    startDate: item.start_date ?? '',
    endDate: item.end_date ?? '',
    startTime: item.start_time ?? '',
    endTime: item.end_time ?? '',
    days: item.days ?? [],
    coachIds: item.coaches.map((c) => c.id),
    athleteIds: item.athletes.map((a) => a.id),
  };
}

function normalizeTimeLabel(time?: string | null) {
  if (!time) return '—';
  const [hourRaw, minute] = time.split(':');
  const hour = Number(hourRaw);
  if (Number.isNaN(hour)) return time;
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const normalizedHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${normalizedHour}:${minute} ${suffix}`;
}

function sortClassesByTime(items: ClassRow[]) {
  return [...items].sort((a, b) => {
    const timeA = a.start_time ?? '99:99';
    const timeB = b.start_time ?? '99:99';
    return timeA.localeCompare(timeB);
  });
}

function sortOccurrencesByTime(items: CalendarOccurrence[]) {
  return [...items].sort((a, b) => {
    const timeA = a.classItem.start_time ?? '99:99';
    const timeB = b.classItem.start_time ?? '99:99';
    return timeA.localeCompare(timeB);
  });
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeekMonday(date: Date) {
  const next = startOfDay(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(next, diff);
}

function endOfWeekMonday(date: Date) {
  return endOfDay(addDays(startOfWeekMonday(date), 6));
}

function startOfMonthGrid(date: Date) {
  const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  return startOfWeekMonday(firstOfMonth);
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseSafeDate(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getDayName(date: Date) {
  return DAYS[date.getDay()];
}

function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function occursOnDate(item: ClassRow, date: Date) {
  const target = startOfDay(date);
  const start = parseSafeDate(item.start_date);
  const end = parseSafeDate(item.end_date);

  if (start && target < startOfDay(start)) return false;
  if (end && target > endOfDay(end)) return false;

  const dayName = getDayName(target);
  return item.days.includes(dayName);
}

function getOccurrencesInRange(
  items: ClassRow[],
  rangeStart: Date,
  rangeEnd: Date
): CalendarOccurrence[] {
  const occurrences: CalendarOccurrence[] = [];
  let cursor = startOfDay(rangeStart);
  const finalDay = endOfDay(rangeEnd);

  while (cursor <= finalDay) {
    for (const item of items) {
      if (occursOnDate(item, cursor)) {
        occurrences.push({
          classItem: item,
          date: new Date(cursor),
        });
      }
    }
    cursor = addDays(cursor, 1);
  }

  return occurrences;
}

function classCardMeta(item: ClassRow) {
  const linkedWorkout = item.workout_name
    ? `${item.workout_name}${item.workout_day_label ? ` • ${item.workout_day_label}` : ''}`
    : null;

  return {
    time: `${normalizeTimeLabel(item.start_time)} - ${normalizeTimeLabel(item.end_time)}`,
    workout: linkedWorkout,
  };
}

function ClassCard({
  item,
  compact = false,
  onEdit,
  onDelete,
}: {
  item: ClassRow;
  compact?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const meta = classCardMeta(item);

  return (
    <div
      className={`rounded-xl border border-slate-500 bg-slate-700 shadow ${
        compact ? 'p-3' : 'p-4'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={`${compact ? 'text-sm' : 'text-base'} font-bold text-white`}>
            {item.name}
          </div>
          <div className="mt-1 text-xs text-slate-200">{meta.time}</div>
        </div>
      </div>

      <div className="mt-2 text-xs text-slate-200">
        {item.team_name} — {item.sport}
      </div>

      <div className="mt-2 text-xs text-slate-200">
        {item.workout_type || '—'}
        {item.duration_minutes != null ? ` • ${item.duration_minutes} min` : ''}
      </div>

      {meta.workout && (
        <div className="mt-2 rounded-lg bg-slate-800 px-2 py-1 text-xs text-slate-100">
          Workout: {meta.workout}
        </div>
      )}

      {!compact && item.description && (
        <div className="mt-2 text-xs text-slate-300 line-clamp-3">{item.description}</div>
      )}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-800"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default function ClassesClient({
  teams = [],
  classes = [],
  athletes = [],
  coaches = [],
  workouts = [],
}: {
  teams?: TeamOption[];
  classes?: ClassRow[];
  athletes?: AthleteOption[];
  coaches?: CoachOption[];
  workouts?: WorkoutOption[];
}) {
  const [message, setMessage] = useState('');
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [deleteClassId, setDeleteClassId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const [viewMode, setViewMode] = useState<CalendarViewMode>('week');
  const [selectedDate, setSelectedDate] = useState<Date>(() => startOfDay(new Date()));

  function openCreateModal() {
    setMessage('');
    setEditingClassId(null);
    setForm(emptyForm);
    setIsFormModalOpen(true);
  }

  function openEditModal(item: ClassRow) {
    setMessage('');
    setEditingClassId(item.id);
    setForm(buildEditState(item));
    setIsFormModalOpen(true);
  }

  function closeFormModal() {
    if (isPending) return;
    setIsFormModalOpen(false);
    setEditingClassId(null);
    setForm(emptyForm);
  }

  function toggleArrayValue(
    key: 'days' | 'coachIds' | 'athleteIds',
    value: string
  ) {
    setForm((prev) => {
      const exists = prev[key].includes(value);
      return {
        ...prev,
        [key]: exists
          ? prev[key].filter((item) => item !== value)
          : [...prev[key], value],
      };
    });
  }

  function handleInputChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;

    setForm((prev) => {
      if (name === 'teamId') {
        return {
          ...prev,
          teamId: value,
          workoutId: '',
          coachIds: [],
          athleteIds: [],
        };
      }

      return { ...prev, [name]: value };
    });
  }

  function goToToday() {
    setSelectedDate(startOfDay(new Date()));
  }

  function goToPrevious() {
    setSelectedDate((prev) => {
      if (viewMode === 'day') return addDays(prev, -1);
      if (viewMode === 'week') return addDays(prev, -7);
      return new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
    });
  }

  function goToNext() {
    setSelectedDate((prev) => {
      if (viewMode === 'day') return addDays(prev, 1);
      if (viewMode === 'week') return addDays(prev, 7);
      return new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
    });
  }

  const filteredAthletes = useMemo(() => {
    if (!form.teamId) return [];
    return athletes.filter((a) => a.team_id === form.teamId);
  }, [athletes, form.teamId]);

  const filteredCoaches = useMemo(() => {
    if (!form.teamId) return [];
    return coaches.filter((c) => c.team_id === form.teamId);
  }, [coaches, form.teamId]);

  const filteredWorkouts = useMemo(() => {
    if (!form.teamId) return [];
    return workouts.filter((w) => w.team_id === form.teamId);
  }, [workouts, form.teamId]);

  const dayOccurrences = useMemo(() => {
    const results = getOccurrencesInRange(classes, selectedDate, selectedDate);
    return sortOccurrencesByTime(results);
  }, [classes, selectedDate]);

  const weekStart = useMemo(() => startOfWeekMonday(selectedDate), [selectedDate]);
  const weekColumns = useMemo(() => {
    return DAYS_MONDAY_FIRST.map((day, index) => {
      const date = addDays(weekStart, index);
      const items = sortOccurrencesByTime(
        getOccurrencesInRange(classes, date, date)
      );

      return {
        day,
        date,
        items,
      };
    });
  }, [classes, weekStart]);

  const monthGrid = useMemo(() => {
    const gridStart = startOfMonthGrid(selectedDate);
    const cells = Array.from({ length: 42 }, (_, index) => {
      const date = addDays(gridStart, index);
      const items = sortOccurrencesByTime(getOccurrencesInRange(classes, date, date));

      return {
        date,
        items,
        inCurrentMonth: date.getMonth() === selectedDate.getMonth(),
      };
    });

    return cells;
  }, [classes, selectedDate]);

  const toolbarLabel = useMemo(() => {
    if (viewMode === 'day') return formatLongDate(selectedDate);
    if (viewMode === 'week') {
      const weekEnd = addDays(weekStart, 6);
      return `${formatShortDate(weekStart)} - ${formatLongDate(weekEnd)}`;
    }
    return formatMonthLabel(selectedDate);
  }, [viewMode, selectedDate, weekStart]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage('');
    setPendingKey(editingClassId ? `update-${editingClassId}` : 'create');

    startTransition(async () => {
      const result = editingClassId
        ? await updateClass({
            classId: editingClassId,
            teamId: form.teamId,
            name: form.name,
            description: form.description,
            workoutType: form.workoutType,
            workoutId: form.workoutId,
            durationMinutes: form.durationMinutes,
            startDate: form.startDate,
            endDate: form.endDate,
            startTime: form.startTime,
            endTime: form.endTime,
            days: form.days,
            coachIds: form.coachIds,
            athleteIds: form.athleteIds,
          })
        : await createClass({
            teamId: form.teamId,
            name: form.name,
            description: form.description,
            workoutType: form.workoutType,
            workoutId: form.workoutId,
            durationMinutes: form.durationMinutes,
            startDate: form.startDate,
            endDate: form.endDate,
            startTime: form.startTime,
            endTime: form.endTime,
            days: form.days,
            coachIds: form.coachIds,
            athleteIds: form.athleteIds,
          });

      if (result?.error) {
        setMessage(result.error);
        setPendingKey(null);
        return;
      }

      setMessage(editingClassId ? 'Class updated successfully.' : 'Class created successfully.');
      setPendingKey(null);
      setIsFormModalOpen(false);
      setEditingClassId(null);
      setForm(emptyForm);
    });
  }

  async function handleDeleteConfirm() {
    if (!deleteClassId) return;

    setMessage('');
    setPendingKey(`delete-${deleteClassId}`);

    startTransition(async () => {
      const result = await deleteClass({ classId: deleteClassId });

      if (result?.error) {
        setMessage(result.error);
        setPendingKey(null);
        return;
      }

      setMessage('Class deleted successfully.');
      setPendingKey(null);
      setDeleteClassId(null);
    });
  }

  return (
    <section className="w-full space-y-8">
      <section className="rounded-2xl bg-slate-800/95 border border-slate-600 shadow-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Training Classes
            </h2>
            <p className="mt-2 text-slate-300">
              Head coaches can create classes, assign coaches, assign athletes, and attach saved workouts.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-600">
              {(['day', 'week', 'month'] as CalendarViewMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    viewMode === mode
                      ? 'bg-white text-slate-800'
                      : 'text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  {mode[0].toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="rounded-xl bg-white px-5 py-3 font-semibold text-slate-800 shadow-lg hover:scale-[1.01] transition"
            >
              Add Class
            </button>
          </div>
        </div>
      </section>

      {message && (
        <div className="rounded-xl bg-slate-800 border border-slate-600 px-4 py-3 text-slate-100 shadow-lg">
          {message}
        </div>
      )}

      <section className="rounded-2xl bg-slate-800/95 border border-slate-600 shadow-2xl overflow-hidden">
        <div className="border-b border-slate-600 bg-slate-900 px-6 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">Calendar</h3>
            <p className="mt-1 text-slate-300">{toolbarLabel}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={goToPrevious}
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600 transition"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={goToToday}
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:scale-[1.02] transition"
            >
              Today
            </button>
            <button
              type="button"
              onClick={goToNext}
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600 transition"
            >
              Next
            </button>
          </div>
        </div>

        {viewMode === 'day' && (
          <div className="p-4 sm:p-6">
            <div className="mb-4 rounded-xl bg-slate-900 border border-slate-600 px-4 py-3">
              <div className="text-lg font-bold text-white">{formatLongDate(selectedDate)}</div>
            </div>

            <div className="space-y-4">
              {dayOccurrences.length ? (
                dayOccurrences.map(({ classItem }, index) => (
                  <ClassCard
                    key={`${classItem.id}-${index}`}
                    item={classItem}
                    onEdit={() => openEditModal(classItem)}
                    onDelete={() => setDeleteClassId(classItem.id)}
                  />
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-600 bg-slate-800/70 p-6 text-sm text-slate-400">
                  No classes scheduled for this day.
                </div>
              )}
            </div>
          </div>
        )}

        {viewMode === 'week' && (
          <div className="overflow-x-auto">
            <div className="grid min-w-[1200px] grid-cols-7">
              {weekColumns.map((column) => (
                <div
                  key={formatDateKey(column.date)}
                  className="min-h-[520px] border-r border-slate-600 last:border-r-0 bg-slate-800"
                >
                  <div className="sticky top-0 z-10 border-b border-slate-600 bg-slate-900 px-4 py-3">
                    <h4 className="text-base font-bold text-white">{column.day}</h4>
                    <p className="mt-1 text-xs text-slate-300">{formatShortDate(column.date)}</p>
                  </div>

                  <div className="space-y-3 p-3">
                    {column.items.length ? (
                      column.items.map(({ classItem }, index) => (
                        <ClassCard
                          key={`${column.day}-${classItem.id}-${index}`}
                          item={classItem}
                          compact
                          onEdit={() => openEditModal(classItem)}
                          onDelete={() => setDeleteClassId(classItem.id)}
                        />
                      ))
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-600 bg-slate-800/70 p-4 text-sm text-slate-400">
                        No classes
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {viewMode === 'month' && (
          <div className="overflow-x-auto">
            <div className="grid min-w-[1200px] grid-cols-7 border-b border-slate-600 bg-slate-900">
              {DAYS_MONDAY_FIRST.map((day) => (
                <div key={day} className="px-4 py-3 text-sm font-bold text-white border-r border-slate-600 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid min-w-[1200px] grid-cols-7">
              {monthGrid.map((cell) => (
                <div
                  key={formatDateKey(cell.date)}
                  className={`min-h-[180px] border-r border-b border-slate-600 p-2 last:border-r-0 ${
                    cell.inCurrentMonth ? 'bg-slate-800' : 'bg-slate-900/70'
                  } ${sameDay(cell.date, new Date()) ? 'ring-1 ring-inset ring-white/30' : ''}`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div
                      className={`text-sm font-bold ${
                        cell.inCurrentMonth ? 'text-white' : 'text-slate-500'
                      }`}
                    >
                      {cell.date.getDate()}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {cell.items.slice(0, 3).map(({ classItem }, index) => (
                      <button
                        key={`${classItem.id}-${index}`}
                        type="button"
                        onClick={() => openEditModal(classItem)}
                        className="block w-full rounded-lg bg-slate-700 px-2 py-2 text-left text-xs text-slate-100 hover:bg-slate-600 transition"
                      >
                        <div className="font-semibold truncate">{classItem.name}</div>
                        <div className="mt-1 text-slate-300">
                          {normalizeTimeLabel(classItem.start_time)}
                        </div>
                      </button>
                    ))}

                    {cell.items.length > 3 && (
                      <div className="text-xs text-slate-300">
                        +{cell.items.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {!classes.length ? (
        <section className="rounded-2xl bg-slate-800/95 border border-slate-600 shadow-2xl p-8 text-center">
          <h3 className="text-xl font-bold text-white">No classes yet</h3>
          <p className="mt-2 text-slate-300">
            Once a head coach creates a class, it will show up here.
          </p>
        </section>
      ) : (
        <div className="space-y-8">
          {classes.map((item) => (
            <section
              key={item.id}
              className="rounded-2xl bg-slate-800/95 border border-slate-600 shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-5 bg-slate-800 border-b border-slate-600 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-white">{item.name}</h3>
                  <p className="mt-2 text-slate-300">
                    {item.school_name} — {item.team_name} — {item.sport}
                  </p>
                  <p className="mt-2 text-slate-300">
                    {item.workout_type || '—'} • {item.duration_minutes ?? '—'} min
                  </p>
                  <p className="mt-2 text-slate-300">
                    Time: {normalizeTimeLabel(item.start_time)} - {normalizeTimeLabel(item.end_time)}
                  </p>
                  <p className="mt-2 text-slate-300">
                    Days: {item.days.length ? item.days.join(', ') : '—'}
                  </p>
                  {item.workout_name && (
                    <p className="mt-2 text-slate-300">
                      Linked Workout: {item.workout_name}
                      {item.workout_day_label ? ` — ${item.workout_day_label}` : ''}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    className="rounded-lg bg-white px-4 py-2 font-semibold text-slate-800 shadow hover:scale-[1.02] transition"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteClassId(item.id)}
                    className="rounded-lg bg-red-500 px-4 py-2 font-semibold text-white shadow hover:scale-[1.02] transition"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="grid gap-6 p-6 lg:grid-cols-3">
                <div className="rounded-xl bg-slate-700 p-4">
                  <h4 className="text-lg font-bold text-white">Description</h4>
                  <p className="mt-2 text-slate-200">
                    {item.description || 'No description provided.'}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-700 p-4">
                  <h4 className="text-lg font-bold text-white">Assigned Coaches</h4>
                  <div className="mt-2 space-y-2 text-slate-200">
                    {item.coaches.length ? (
                      item.coaches.map((coach) => (
                        <div key={coach.id}>
                          {coach.first_name} {coach.last_name}
                        </div>
                      ))
                    ) : (
                      <div>None assigned.</div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl bg-slate-700 p-4">
                  <h4 className="text-lg font-bold text-white">Assigned Athletes</h4>
                  <div className="mt-2 space-y-2 text-slate-200 max-h-48 overflow-y-auto">
                    {item.athletes.length ? (
                      item.athletes.map((athlete) => (
                        <div key={athlete.id}>
                          {athlete.first_name} {athlete.last_name}
                          {athlete.position ? ` — ${athlete.position}` : ''}
                        </div>
                      ))
                    ) : (
                      <div>None assigned.</div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}

      {isFormModalOpen && (
        <ModalShell onClose={closeFormModal}>
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-800 p-6 text-white shadow-xl">
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold">
                {editingClassId ? 'Edit Class' : 'Create Class'}
              </h2>

              <button
                type="button"
                onClick={closeFormModal}
                className="rounded-lg bg-slate-700 px-4 py-2 font-semibold hover:bg-slate-600 transition"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <Field label="Team">
                <select
                  name="teamId"
                  value={form.teamId}
                  onChange={handleInputChange}
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

              <Field label="Class Name">
                <input
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                  required
                />
              </Field>

              <Field label="Workout Type">
                <select
                  name="workoutType"
                  value={form.workoutType}
                  onChange={handleInputChange}
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

              <Field label="Attach Saved Workout">
                <select
                  name="workoutId"
                  value={form.workoutId}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                >
                  <option value="">No linked workout</option>
                  {filteredWorkouts.map((workout) => (
                    <option key={workout.id} value={workout.id}>
                      {workout.name}
                      {workout.day_label ? ` — ${workout.day_label}` : ''}
                      {workout.workout_type ? ` — ${workout.workout_type}` : ''}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Duration (minutes)">
                <input
                  name="durationMinutes"
                  value={form.durationMinutes}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                />
              </Field>

              <Field label="Start Date">
                <input
                  name="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                />
              </Field>

              <Field label="End Date">
                <input
                  name="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                />
              </Field>

              <Field label="Start Time">
                <input
                  name="startTime"
                  type="time"
                  value={form.startTime}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                />
              </Field>

              <Field label="End Time">
                <input
                  name="endTime"
                  type="time"
                  value={form.endTime}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                />
              </Field>

              <Field label="Description" className="md:col-span-2">
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                />
              </Field>

              <Field label="Days of Week" className="md:col-span-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {DAYS_MONDAY_FIRST.map((day) => (
                    <label
                      key={day}
                      className="flex items-center gap-2 rounded-lg bg-slate-700 px-3 py-2"
                    >
                      <input
                        type="checkbox"
                        checked={form.days.includes(day)}
                        onChange={() => toggleArrayValue('days', day)}
                      />
                      <span>{day}</span>
                    </label>
                  ))}
                </div>
              </Field>

              <Field label="Assign Coaches" className="md:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-56 overflow-y-auto rounded-lg bg-slate-700 p-3">
                  {filteredCoaches.length ? (
                    filteredCoaches.map((coach) => (
                      <label key={coach.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={form.coachIds.includes(coach.id)}
                          onChange={() => toggleArrayValue('coachIds', coach.id)}
                        />
                        <span>
                          {coach.first_name} {coach.last_name} — {coach.title}
                        </span>
                      </label>
                    ))
                  ) : (
                    <div className="text-slate-300">Select a team first.</div>
                  )}
                </div>
              </Field>

              <Field label="Assign Athletes" className="md:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto rounded-lg bg-slate-700 p-3">
                  {filteredAthletes.length ? (
                    filteredAthletes.map((athlete) => (
                      <label key={athlete.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={form.athleteIds.includes(athlete.id)}
                          onChange={() => toggleArrayValue('athleteIds', athlete.id)}
                        />
                        <span>
                          {athlete.first_name} {athlete.last_name}
                          {athlete.position ? ` — ${athlete.position}` : ''}
                        </span>
                      </label>
                    ))
                  ) : (
                    <div className="text-slate-300">Select a team first.</div>
                  )}
                </div>
              </Field>

              <div className="md:col-span-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-white px-5 py-3 font-semibold text-slate-800 shadow hover:scale-[1.02] transition"
                >
                  {isPending && pendingKey
                    ? editingClassId
                      ? 'Saving...'
                      : 'Creating...'
                    : editingClassId
                    ? 'Save Class'
                    : 'Create Class'}
                </button>

                <button
                  type="button"
                  onClick={closeFormModal}
                  disabled={isPending}
                  className="rounded-lg bg-slate-600 px-5 py-3 font-semibold text-white shadow hover:scale-[1.02] transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </ModalShell>
      )}

      {deleteClassId && (
        <ModalShell onClose={() => setDeleteClassId(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-slate-800 p-6 text-white shadow-xl">
            <h2 className="text-2xl font-bold">Delete Class</h2>
            <p className="mt-4 text-slate-300">
              Are you sure you want to delete this class? This action cannot be undone.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isPending}
                className="rounded-lg bg-red-500 px-5 py-3 font-semibold text-white shadow hover:scale-[1.02] transition"
              >
                {isPending && pendingKey === `delete-${deleteClassId}` ? 'Deleting...' : 'Yes, Delete'}
              </button>

              <button
                type="button"
                onClick={() => setDeleteClassId(null)}
                disabled={isPending}
                className="rounded-lg bg-slate-600 px-5 py-3 font-semibold text-white shadow hover:scale-[1.02] transition"
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
      <div className="relative z-[101] w-full max-w-4xl px-4 animate-in fade-in zoom-in-95 duration-200">
        {children}
      </div>
    </div>
  );
}