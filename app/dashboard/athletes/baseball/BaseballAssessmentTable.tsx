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

function displayValue(value: number | string | null | undefined) {
  return value === null || value === undefined || value === '' ? '—' : value;
}

function formatDecimal(value: number | null | undefined, digits = 2) {
  return value == null ? '—' : value.toFixed(digits);
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

  async function handleUpdate(formData: FormData) {
    const assessmentId = String(formData.get('assessmentId') || '');
    setPendingKey(assessmentId);
    setMessage('');

    startTransition(async () => {
      const result = await updateBaseballAssessment({
        assessmentId,
        assessmentDate: String(formData.get('assessmentDate') || ''),
        bestVerticalIn: String(formData.get('bestVerticalIn') || ''),
        gripL: String(formData.get('gripL') || ''),
        gripR: String(formData.get('gripR') || ''),
        yd60: String(formData.get('yd60') || ''),
        yd40: String(formData.get('yd40') || ''),
        bench: String(formData.get('bench') || ''),
        squat: String(formData.get('squat') || ''),
        trapBarDl: String(formData.get('trapBarDl') || ''),
        sessionNotes: String(formData.get('sessionNotes') || ''),
      });

      setMessage(result?.error ?? 'Baseball assessment updated successfully.');
      setPendingKey(null);
    });
  }

  return (
    <section className="w-full space-y-8">
      <section className="rounded-2xl bg-slate-800/95 border border-slate-600 shadow-2xl p-6 sm:p-8 space-y-3">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">
          Baseball Assessment Table
        </h2>
        <p className="text-slate-300">
          Edit the latest baseball assessment directly inside the table.
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

                      return (
                        <tr
                          key={athlete.id}
                          className={index % 2 === 0 ? 'bg-slate-700' : 'bg-slate-600'}
                        >
                          <td colSpan={20} className="p-0">
                            <form action={handleUpdate}>
                              <input type="hidden" name="assessmentId" value={latest.id} />
                              <table className="min-w-full text-sm text-white">
                                <tbody>
                                  <tr>
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
                                      <CellInput
                                        name="assessmentDate"
                                        type="date"
                                        defaultValue={latest.assessment_date ?? ''}
                                      />
                                    </td>
                                    <td className="px-4 py-3">
                                      <CellInput
                                        name="bestVerticalIn"
                                        defaultValue={latest.best_vertical_in ?? ''}
                                      />
                                    </td>
                                    <td className="px-4 py-3">
                                      <CellInput name="gripL" defaultValue={latest.grip_l ?? ''} />
                                    </td>
                                    <td className="px-4 py-3">
                                      <CellInput name="gripR" defaultValue={latest.grip_r ?? ''} />
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      {displayValue(latest.grip_avg)}
                                    </td>
                                    <td className="px-4 py-3">
                                      <CellInput name="yd60" defaultValue={latest.yd_60 ?? ''} />
                                    </td>
                                    <td className="px-4 py-3">
                                      <CellInput name="yd40" defaultValue={latest.yd_40 ?? ''} />
                                    </td>
                                    <td className="px-4 py-3">
                                      <CellInput name="bench" defaultValue={latest.bench ?? ''} />
                                    </td>
                                    <td className="px-4 py-3">
                                      <CellInput name="squat" defaultValue={latest.squat ?? ''} />
                                    </td>
                                    <td className="px-4 py-3">
                                      <CellInput
                                        name="trapBarDl"
                                        defaultValue={latest.trap_bar_dl ?? ''}
                                      />
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
                                      <textarea
                                        name="sessionNotes"
                                        defaultValue={latest.session_notes ?? ''}
                                        className="w-full rounded-lg border border-slate-500 bg-slate-700 px-3 py-2 text-white outline-none focus:border-white min-h-[42px]"
                                      />
                                    </td>
                                    <td className="px-4 py-3">
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