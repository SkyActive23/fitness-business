'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { updateBaseballAssessment } from './actions';

type AssessmentRow = {
  id: string;
  assessment_date: string | null;
  best_vertical_in: number | null;
  grip_l: number | null;
  grip_r: number | null;
  grip_avg: number | null;
  yd_60: number | null;
  yd_40: number | null;
  bench: number | null;
  squat: number | null;
  trap_bar_dl: number | null;
  rel_bench: number | null;
  rel_squat: number | null;
  rel_dl: number | null;
  session_notes: string | null;
};

type AthleteRow = {
  id: string;
  first_name: string;
  last_name: string;
  position: string | null;
  height: string | null;
  weight: number | null;
  school_name: string;
  team_name: string;
  sport: string;
  latest_assessment?: AssessmentRow | null;
};

type Group = {
  key: string;
  school_name: string;
  team_name: string;
  sport: string;
  athletes: AthleteRow[];
};

type EditState = {
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

function displayValue(value: number | string | null | undefined) {
  return value === null || value === undefined || value === '' ? '—' : value;
}

function formatDecimal(value: number | null | undefined, digits = 2) {
  return value == null ? '—' : value.toFixed(digits);
}

function buildEditState(latest: AssessmentRow): EditState {
  return {
    assessmentDate: latest.assessment_date ?? '',
    bestVerticalIn: latest.best_vertical_in == null ? '' : String(latest.best_vertical_in),
    gripL: latest.grip_l == null ? '' : String(latest.grip_l),
    gripR: latest.grip_r == null ? '' : String(latest.grip_r),
    yd60: latest.yd_60 == null ? '' : String(latest.yd_60),
    yd40: latest.yd_40 == null ? '' : String(latest.yd_40),
    bench: latest.bench == null ? '' : String(latest.bench),
    squat: latest.squat == null ? '' : String(latest.squat),
    trapBarDl: latest.trap_bar_dl == null ? '' : String(latest.trap_bar_dl),
    sessionNotes: latest.session_notes ?? '',
  };
}

function CellInput({
  name,
  value,
  type = 'text',
  onChange,
}: {
  name: string;
  value: string;
  type?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <input
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      className="w-full min-w-[72px] rounded-lg border border-slate-500 bg-slate-700 px-2 py-2 text-white outline-none focus:border-white"
    />
  );
}

export default function BaseballAssessmentTable({
  athletes = [],
}: {
  athletes?: AthleteRow[];
}) {
  const [message, setMessage] = useState('');
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [editingAssessmentId, setEditingAssessmentId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditState>({
    assessmentDate: '',
    bestVerticalIn: '',
    gripL: '',
    gripR: '',
    yd60: '',
    yd40: '',
    bench: '',
    squat: '',
    trapBarDl: '',
    sessionNotes: '',
  });

  const grouped: Group[] = Object.values(
    athletes.reduce((acc, athlete) => {
      const key = `${athlete.school_name}__${athlete.team_name}__${athlete.sport}`;
      if (!acc[key]) {
        acc[key] = {
          key,
          school_name: athlete.school_name,
          team_name: athlete.team_name,
          sport: athlete.sport,
          athletes: [],
        };
      }
      acc[key].athletes.push(athlete);
      return acc;
    }, {} as Record<string, Group>)
  );

  function startEditing(latest: AssessmentRow) {
    setMessage('');
    setEditingAssessmentId(latest.id);
    setEditForm(buildEditState(latest));
  }

  function cancelEditing() {
    if (isPending) return;
    setEditingAssessmentId(null);
    setEditForm({
      assessmentDate: '',
      bestVerticalIn: '',
      gripL: '',
      gripR: '',
      yd60: '',
      yd40: '',
      bench: '',
      squat: '',
      trapBarDl: '',
      sessionNotes: '',
    });
  }

  function handleInputChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSave(assessmentId: string) {
    setPendingKey(assessmentId);
    setMessage('');

    startTransition(async () => {
      const result = await updateBaseballAssessment({
        assessmentId,
        assessmentDate: editForm.assessmentDate,
        bestVerticalIn: editForm.bestVerticalIn,
        gripL: editForm.gripL,
        gripR: editForm.gripR,
        yd60: editForm.yd60,
        yd40: editForm.yd40,
        bench: editForm.bench,
        squat: editForm.squat,
        trapBarDl: editForm.trapBarDl,
        sessionNotes: editForm.sessionNotes,
      });

      if (result?.error) {
        setMessage(result.error);
        setPendingKey(null);
        return;
      }

      setMessage('Baseball assessment updated successfully.');
      setPendingKey(null);
      setEditingAssessmentId(null);
    });
  }

  return (
    <section className="w-full space-y-8">
      <section className="rounded-2xl bg-slate-800/95 border border-slate-600 shadow-2xl p-6 sm:p-8 space-y-3">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">
          Baseball Assessment Table
        </h2>
        <p className="text-slate-300">
          View the latest baseball assessment and edit rows only when needed.
        </p>
      </section>

      {message && (
        <div className="rounded-xl bg-slate-800 border border-slate-600 px-4 py-3 text-slate-100 shadow-lg">
          {message}
        </div>
      )}

      {!grouped.length ? (
        <section className="rounded-2xl bg-slate-800/95 border border-slate-600 shadow-2xl p-8 text-center">
          <h3 className="text-xl font-bold text-white">No baseball athletes found</h3>
        </section>
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <section
              key={group.key}
              className="rounded-2xl bg-slate-800/95 border border-slate-600 shadow-2xl overflow-hidden"
            >
              <div className="flex flex-wrap gap-2 px-6 py-5 bg-slate-800 border-b border-slate-600">
                <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-800">
                  {group.school_name}
                </span>
                <span className="rounded-full bg-slate-600 px-3 py-1 text-sm font-semibold text-white">
                  {group.team_name}
                </span>
                <span className="rounded-full bg-slate-500 px-3 py-1 text-sm font-semibold text-white">
                  {group.sport}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-white">
                  <thead className="bg-slate-900">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">First</th>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Last</th>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Pos</th>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Ht</th>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Wt</th>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Date</th>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Vert</th>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Grip L</th>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Grip R</th>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Grip Avg</th>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">60 yd</th>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">40 yd</th>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Bench</th>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Squat</th>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Trap DL</th>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Rel Bench</th>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Rel Squat</th>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Rel DL</th>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Notes</th>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.athletes.map((athlete, index) => {
                      const latest = athlete.latest_assessment ?? null;

                      if (!latest) {
                        return (
                          <tr
                            key={athlete.id}
                            className={index % 2 === 0 ? 'bg-slate-700' : 'bg-slate-600'}
                          >
                            <td className="px-4 py-3 whitespace-nowrap">
                              <Link
                                href={`/dashboard/athletes/baseball/profile/${athlete.id}`}
                                className="font-semibold text-white underline underline-offset-4 hover:text-slate-200"
                              >
                                {athlete.first_name}
                              </Link>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <Link
                                href={`/dashboard/athletes/baseball/profile/${athlete.id}`}
                                className="font-semibold text-white underline underline-offset-4 hover:text-slate-200"
                              >
                                {athlete.last_name}
                              </Link>
                            </td>
                            <td className="px-4 py-3">{displayValue(athlete.position)}</td>
                            <td className="px-4 py-3">{displayValue(athlete.height)}</td>
                            <td className="px-4 py-3">{displayValue(athlete.weight)}</td>
                            <td className="px-4 py-3 text-slate-300" colSpan={15}>
                              No baseball assessment yet. Add one above.
                            </td>
                          </tr>
                        );
                      }

                      const isEditing = editingAssessmentId === latest.id;

                      return (
                        <tr
                          key={athlete.id}
                          className={index % 2 === 0 ? 'bg-slate-700' : 'bg-slate-600'}
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Link
                              href={`/dashboard/athletes/baseball/profile/${athlete.id}`}
                              className="font-semibold text-white underline underline-offset-4 hover:text-slate-200"
                            >
                              {athlete.first_name}
                            </Link>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Link
                              href={`/dashboard/athletes/baseball/profile/${athlete.id}`}
                              className="font-semibold text-white underline underline-offset-4 hover:text-slate-200"
                            >
                              {athlete.last_name}
                            </Link>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {displayValue(athlete.position)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {displayValue(athlete.height)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {displayValue(athlete.weight)}
                          </td>

                          <td className="px-4 py-3">
                            {isEditing ? (
                              <CellInput
                                name="assessmentDate"
                                type="date"
                                value={editForm.assessmentDate}
                                onChange={handleInputChange}
                              />
                            ) : (
                              displayValue(latest.assessment_date)
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {isEditing ? (
                              <CellInput
                                name="bestVerticalIn"
                                value={editForm.bestVerticalIn}
                                onChange={handleInputChange}
                              />
                            ) : (
                              displayValue(latest.best_vertical_in)
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {isEditing ? (
                              <CellInput
                                name="gripL"
                                value={editForm.gripL}
                                onChange={handleInputChange}
                              />
                            ) : (
                              displayValue(latest.grip_l)
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {isEditing ? (
                              <CellInput
                                name="gripR"
                                value={editForm.gripR}
                                onChange={handleInputChange}
                              />
                            ) : (
                              displayValue(latest.grip_r)
                            )}
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap">
                            {displayValue(latest.grip_avg)}
                          </td>

                          <td className="px-4 py-3">
                            {isEditing ? (
                              <CellInput
                                name="yd60"
                                value={editForm.yd60}
                                onChange={handleInputChange}
                              />
                            ) : (
                              displayValue(latest.yd_60)
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {isEditing ? (
                              <CellInput
                                name="yd40"
                                value={editForm.yd40}
                                onChange={handleInputChange}
                              />
                            ) : (
                              displayValue(latest.yd_40)
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {isEditing ? (
                              <CellInput
                                name="bench"
                                value={editForm.bench}
                                onChange={handleInputChange}
                              />
                            ) : (
                              displayValue(latest.bench)
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {isEditing ? (
                              <CellInput
                                name="squat"
                                value={editForm.squat}
                                onChange={handleInputChange}
                              />
                            ) : (
                              displayValue(latest.squat)
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {isEditing ? (
                              <CellInput
                                name="trapBarDl"
                                value={editForm.trapBarDl}
                                onChange={handleInputChange}
                              />
                            ) : (
                              displayValue(latest.trap_bar_dl)
                            )}
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap">
                            {formatDecimal(latest.rel_bench, 2)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {formatDecimal(latest.rel_squat, 2)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {formatDecimal(latest.rel_dl, 2)}
                          </td>

                          <td className="px-4 py-3 min-w-[220px]">
                            {isEditing ? (
                              <textarea
                                name="sessionNotes"
                                value={editForm.sessionNotes}
                                onChange={handleInputChange}
                                className="w-full rounded-lg border border-slate-500 bg-slate-700 px-3 py-2 text-white outline-none focus:border-white min-h-[42px]"
                              />
                            ) : (
                              displayValue(latest.session_notes)
                            )}
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap">
                            {isEditing ? (
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleSave(latest.id)}
                                  disabled={isPending && pendingKey === latest.id}
                                  className="rounded-lg bg-white px-4 py-2 font-semibold text-slate-800 shadow hover:scale-[1.02] transition"
                                >
                                  {isPending && pendingKey === latest.id ? 'Saving...' : 'Save'}
                                </button>

                                <button
                                  type="button"
                                  onClick={cancelEditing}
                                  disabled={isPending}
                                  className="rounded-lg bg-slate-500 px-4 py-2 font-semibold text-white shadow hover:scale-[1.02] transition"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => startEditing(latest)}
                                className="rounded-lg bg-white px-4 py-2 font-semibold text-slate-800 shadow hover:scale-[1.02] transition"
                              >
                                Edit
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}