'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { updateAssessment } from './actions';

type AssessmentRow = {
  id: string;
  assessment_date: string | null;
  squat: number | null;
  bench: number | null;
  clean: number | null;
  cmj: number | null;
  single_leg_cmj_right: number | null;
  single_leg_cmj_left: number | null;
  sprint_20m: number | null;
  mod_505: number | null;
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

type AthleteGroup = {
  key: string;
  school_name: string;
  team_name: string;
  sport: string;
  athletes: AthleteRow[];
};

type EditState = {
  assessmentDate: string;
  squat: string;
  bench: string;
  clean: string;
  cmj: string;
  singleLegCmjRight: string;
  singleLegCmjLeft: string;
  sprint20m: string;
  mod505: string;
};

function displayValue(value: number | string | null | undefined) {
  return value === null || value === undefined || value === '' ? '—' : value;
}

function buildEditState(latest: AssessmentRow): EditState {
  return {
    assessmentDate: latest.assessment_date ?? '',
    squat: latest.squat == null ? '' : String(latest.squat),
    bench: latest.bench == null ? '' : String(latest.bench),
    clean: latest.clean == null ? '' : String(latest.clean),
    cmj: latest.cmj == null ? '' : String(latest.cmj),
    singleLegCmjRight:
      latest.single_leg_cmj_right == null ? '' : String(latest.single_leg_cmj_right),
    singleLegCmjLeft:
      latest.single_leg_cmj_left == null ? '' : String(latest.single_leg_cmj_left),
    sprint20m: latest.sprint_20m == null ? '' : String(latest.sprint_20m),
    mod505: latest.mod_505 == null ? '' : String(latest.mod_505),
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
      className="w-full min-w-0 rounded-lg border border-slate-500 bg-slate-700 px-3 py-2 text-white outline-none focus:border-white"
    />
  );
}

export default function AthleteAssessmentTable({
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
    squat: '',
    bench: '',
    clean: '',
    cmj: '',
    singleLegCmjRight: '',
    singleLegCmjLeft: '',
    sprint20m: '',
    mod505: '',
  });

  const groupedAthletes: AthleteGroup[] = Object.values(
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
    }, {} as Record<string, AthleteGroup>)
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
      squat: '',
      bench: '',
      clean: '',
      cmj: '',
      singleLegCmjRight: '',
      singleLegCmjLeft: '',
      sprint20m: '',
      mod505: '',
    });
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSave(assessmentId: string) {
    setPendingKey(assessmentId);
    setMessage('');

    startTransition(async () => {
      const result = await updateAssessment({
        assessmentId,
        assessmentDate: editForm.assessmentDate,
        squat: editForm.squat,
        bench: editForm.bench,
        clean: editForm.clean,
        cmj: editForm.cmj,
        singleLegCmjRight: editForm.singleLegCmjRight,
        singleLegCmjLeft: editForm.singleLegCmjLeft,
        sprint20m: editForm.sprint20m,
        mod505: editForm.mod505,
      });

      if (result?.error) {
        setMessage(result.error);
        setPendingKey(null);
        return;
      }

      setMessage('Assessment updated successfully.');
      setPendingKey(null);
      setEditingAssessmentId(null);
    });
  }

  return (
    <section className="w-full space-y-8">
      <section className="rounded-2xl bg-slate-800/95 border border-slate-600 shadow-2xl p-6 sm:p-8 space-y-3">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">
          Athlete Assessment Table
        </h2>
        <p className="text-slate-300">
          View the latest assessment and edit rows only when needed.
        </p>
      </section>

      {message && (
        <div className="rounded-xl bg-slate-800 border border-slate-600 px-4 py-3 text-slate-100 shadow-lg">
          {message}
        </div>
      )}

      {!groupedAthletes.length ? (
        <section className="rounded-2xl bg-slate-800/95 border border-slate-600 shadow-2xl p-8 text-center">
          <h3 className="text-xl font-bold text-white">No athletes found</h3>
          <p className="mt-2 text-slate-300">
            Once athletes and assessments are added, they will show up here.
          </p>
        </section>
      ) : (
        <div className="space-y-8">
          {groupedAthletes.map((group) => (
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
                <table className="min-w-full table-auto text-sm text-white">
                  <thead className="bg-slate-900">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">First Name</th>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Last Name</th>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Position</th>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Height</th>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Weight</th>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Assessment Date</th>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">CMJ</th>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">SL CMJ R</th>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">SL CMJ L</th>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">20m</th>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Mod 505</th>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Squat</th>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Bench</th>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Clean</th>
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
                                href={`/dashboard/athletes/profile/${athlete.id}`}
                                className="font-semibold text-white underline underline-offset-4 hover:text-slate-200"
                              >
                                {athlete.first_name}
                              </Link>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <Link
                                href={`/dashboard/athletes/profile/${athlete.id}`}
                                className="font-semibold text-white underline underline-offset-4 hover:text-slate-200"
                              >
                                {athlete.last_name}
                              </Link>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">{displayValue(athlete.position)}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{displayValue(athlete.height)}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{displayValue(athlete.weight)}</td>
                            <td className="px-4 py-3 text-slate-300" colSpan={10}>
                              No assessment yet. Add one above.
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
                          <td className="px-4 py-3 whitespace-nowrap align-middle">
                            <Link
                              href={`/dashboard/athletes/profile/${athlete.id}`}
                              className="font-semibold text-white underline underline-offset-4 hover:text-slate-200"
                            >
                              {athlete.first_name}
                            </Link>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap align-middle">
                            <Link
                              href={`/dashboard/athletes/profile/${athlete.id}`}
                              className="font-semibold text-white underline underline-offset-4 hover:text-slate-200"
                            >
                              {athlete.last_name}
                            </Link>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap align-middle">
                            {displayValue(athlete.position)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap align-middle">
                            {displayValue(athlete.height)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap align-middle">
                            {displayValue(athlete.weight)}
                          </td>

                          <td className="px-4 py-3 align-middle">
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
                          <td className="px-4 py-3 align-middle">
                            {isEditing ? (
                              <CellInput
                                name="cmj"
                                value={editForm.cmj}
                                onChange={handleInputChange}
                              />
                            ) : (
                              displayValue(latest.cmj)
                            )}
                          </td>
                          <td className="px-4 py-3 align-middle">
                            {isEditing ? (
                              <CellInput
                                name="singleLegCmjRight"
                                value={editForm.singleLegCmjRight}
                                onChange={handleInputChange}
                              />
                            ) : (
                              displayValue(latest.single_leg_cmj_right)
                            )}
                          </td>
                          <td className="px-4 py-3 align-middle">
                            {isEditing ? (
                              <CellInput
                                name="singleLegCmjLeft"
                                value={editForm.singleLegCmjLeft}
                                onChange={handleInputChange}
                              />
                            ) : (
                              displayValue(latest.single_leg_cmj_left)
                            )}
                          </td>
                          <td className="px-4 py-3 align-middle">
                            {isEditing ? (
                              <CellInput
                                name="sprint20m"
                                value={editForm.sprint20m}
                                onChange={handleInputChange}
                              />
                            ) : (
                              displayValue(latest.sprint_20m)
                            )}
                          </td>
                          <td className="px-4 py-3 align-middle">
                            {isEditing ? (
                              <CellInput
                                name="mod505"
                                value={editForm.mod505}
                                onChange={handleInputChange}
                              />
                            ) : (
                              displayValue(latest.mod_505)
                            )}
                          </td>
                          <td className="px-4 py-3 align-middle">
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
                          <td className="px-4 py-3 align-middle">
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
                          <td className="px-4 py-3 align-middle">
                            {isEditing ? (
                              <CellInput
                                name="clean"
                                value={editForm.clean}
                                onChange={handleInputChange}
                              />
                            ) : (
                              displayValue(latest.clean)
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap align-middle">
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