'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
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

function displayValue(value: number | string | null | undefined) {
  return value === null || value === undefined || value === '' ? '—' : value;
}

function CellInput({
  name,
  defaultValue,
  type = 'text',
}: {
  name: string;
  defaultValue: string | number;
  type?: string;
}) {
  return (
    <input
      name={name}
      type={type}
      defaultValue={defaultValue}
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

  async function handleUpdate(formData: FormData) {
    const assessmentId = String(formData.get('assessmentId') || '');
    setPendingKey(assessmentId);
    setMessage('');

    startTransition(async () => {
      const result = await updateAssessment({
        assessmentId,
        assessmentDate: String(formData.get('assessmentDate') || ''),
        squat: String(formData.get('squat') || ''),
        bench: String(formData.get('bench') || ''),
        clean: String(formData.get('clean') || ''),
        cmj: String(formData.get('cmj') || ''),
        singleLegCmjRight: String(formData.get('singleLegCmjRight') || ''),
        singleLegCmjLeft: String(formData.get('singleLegCmjLeft') || ''),
        sprint20m: String(formData.get('sprint20m') || ''),
        mod505: String(formData.get('mod505') || ''),
      });

      setMessage(result?.error ?? 'Assessment updated successfully.');
      setPendingKey(null);
    });
  }

  return (
    <section className="w-full space-y-8">
      <section className="rounded-2xl bg-slate-800/95 border border-slate-600 shadow-2xl p-6 sm:p-8 space-y-3">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">
          Athlete Assessment Table
        </h2>
        <p className="text-slate-300">
          Edit the latest assessment directly inside the table.
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

                      return (
                        <tr
                          key={athlete.id}
                          className={index % 2 === 0 ? 'bg-slate-700' : 'bg-slate-600'}
                        >
                          <td colSpan={15} className="p-0">
                            <form action={handleUpdate}>
                              <input type="hidden" name="assessmentId" value={latest.id} />
                              <table className="min-w-full table-auto text-sm text-white">
                                <tbody>
                                  <tr>
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
                                      <CellInput
                                        name="assessmentDate"
                                        type="date"
                                        defaultValue={latest.assessment_date ?? ''}
                                      />
                                    </td>
                                    <td className="px-4 py-3 align-middle">
                                      <CellInput name="cmj" defaultValue={latest.cmj ?? ''} />
                                    </td>
                                    <td className="px-4 py-3 align-middle">
                                      <CellInput
                                        name="singleLegCmjRight"
                                        defaultValue={latest.single_leg_cmj_right ?? ''}
                                      />
                                    </td>
                                    <td className="px-4 py-3 align-middle">
                                      <CellInput
                                        name="singleLegCmjLeft"
                                        defaultValue={latest.single_leg_cmj_left ?? ''}
                                      />
                                    </td>
                                    <td className="px-4 py-3 align-middle">
                                      <CellInput
                                        name="sprint20m"
                                        defaultValue={latest.sprint_20m ?? ''}
                                      />
                                    </td>
                                    <td className="px-4 py-3 align-middle">
                                      <CellInput name="mod505" defaultValue={latest.mod_505 ?? ''} />
                                    </td>
                                    <td className="px-4 py-3 align-middle">
                                      <CellInput name="squat" defaultValue={latest.squat ?? ''} />
                                    </td>
                                    <td className="px-4 py-3 align-middle">
                                      <CellInput name="bench" defaultValue={latest.bench ?? ''} />
                                    </td>
                                    <td className="px-4 py-3 align-middle">
                                      <CellInput name="clean" defaultValue={latest.clean ?? ''} />
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap align-middle">
                                      <button
                                        type="submit"
                                        disabled={isPending && pendingKey === latest.id}
                                        className="rounded-lg bg-white px-4 py-2 font-semibold text-slate-800 shadow hover:scale-[1.02] transition"
                                      >
                                        {isPending && pendingKey === latest.id ? 'Saving...' : 'Save'}
                                      </button>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </form>
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