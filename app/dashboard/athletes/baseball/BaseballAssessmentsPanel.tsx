'use client';

import { useEffect, useState, useTransition } from 'react';
import { createBaseballAssessment } from './actions';

type AthleteOption = {
  id: string;
  first_name: string;
  last_name: string;
  team_name: string;
};

type CreateFormState = {
  athleteId: string;
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

const emptyForm: CreateFormState = {
  athleteId: '',
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
};

export default function BaseballAssessmentsPanel({
  athletes = [],
}: {
  athletes?: AthleteOption[];
}) {
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<CreateFormState>(emptyForm);

  function openModal() {
    setMessage('');
    setForm(emptyForm);
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isPending) return;
    setIsModalOpen(false);
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage('');

    startTransition(async () => {
      const result = await createBaseballAssessment({
        athleteId: form.athleteId,
        assessmentDate: form.assessmentDate,
        bestVerticalIn: form.bestVerticalIn,
        gripL: form.gripL,
        gripR: form.gripR,
        yd60: form.yd60,
        yd40: form.yd40,
        bench: form.bench,
        squat: form.squat,
        trapBarDl: form.trapBarDl,
        sessionNotes: form.sessionNotes,
      });

      if (result?.error) {
        setMessage(result.error);
        return;
      }

      setMessage('Baseball assessment added successfully.');
      setIsModalOpen(false);
      setForm(emptyForm);
    });
  }

  return (
    <section className="rounded-2xl bg-slate-800/95 border border-slate-600 shadow-2xl p-6 sm:p-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Baseball Assessments
          </h2>
          <p className="mt-2 text-slate-300">
            Add baseball performance data for pitchers and position players.
          </p>
        </div>

        <button
          type="button"
          onClick={openModal}
          className="rounded-xl bg-white px-5 py-3 font-semibold text-slate-800 shadow-lg hover:scale-[1.01] transition"
        >
          Add Baseball Assessment
        </button>
      </div>

      {message && (
        <div className="rounded-xl bg-slate-700 px-4 py-3 text-slate-100">
          {message}
        </div>
      )}

      {isModalOpen && (
        <ModalShell onClose={closeModal}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-800 p-6 text-white shadow-xl">
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold">Add Baseball Assessment</h2>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg bg-slate-700 px-4 py-2 font-semibold hover:bg-slate-600 transition"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <ModalField label="Athlete" className="md:col-span-2">
                <select
                  name="athleteId"
                  value={form.athleteId}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                >
                  <option value="" disabled>
                    Select athlete
                  </option>
                  {athletes.map((athlete) => (
                    <option key={athlete.id} value={athlete.id}>
                      {athlete.first_name} {athlete.last_name} — {athlete.team_name}
                    </option>
                  ))}
                </select>
              </ModalField>

              <ModalField label="Assessment Date">
                <input
                  name="assessmentDate"
                  type="date"
                  value={form.assessmentDate}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                />
              </ModalField>

              <ModalField label="Best Vertical (in)">
                <input
                  name="bestVerticalIn"
                  value={form.bestVerticalIn}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                />
              </ModalField>

              <ModalField label="Grip Left">
                <input
                  name="gripL"
                  value={form.gripL}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                />
              </ModalField>

              <ModalField label="Grip Right">
                <input
                  name="gripR"
                  value={form.gripR}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                />
              </ModalField>

              <ModalField label="60 yd">
                <input
                  name="yd60"
                  value={form.yd60}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                />
              </ModalField>

              <ModalField label="40 yd">
                <input
                  name="yd40"
                  value={form.yd40}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                />
              </ModalField>

              <ModalField label="Bench">
                <input
                  name="bench"
                  value={form.bench}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                />
              </ModalField>

              <ModalField label="Squat">
                <input
                  name="squat"
                  value={form.squat}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                />
              </ModalField>

              <ModalField label="Trap Bar DL">
                <input
                  name="trapBarDl"
                  value={form.trapBarDl}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                />
              </ModalField>

              <ModalField label="Session Notes" className="md:col-span-2">
                <textarea
                  name="sessionNotes"
                  value={form.sessionNotes}
                  onChange={handleChange}
                  className="w-full min-h-[110px] rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                />
              </ModalField>

              <div className="md:col-span-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-white px-5 py-3 font-semibold text-slate-800 shadow-lg hover:scale-[1.01] transition"
                >
                  {isPending ? 'Saving...' : 'Add Baseball Assessment'}
                </button>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isPending}
                  className="rounded-xl bg-slate-600 px-5 py-3 font-semibold text-white shadow-lg hover:scale-[1.01] transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </ModalShell>
      )}
    </section>
  );
}

function ModalField({
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
      if (event.key === 'Escape') {
        onClose();
      }
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
      <div className="relative z-[101] w-full max-w-2xl px-4 animate-in fade-in zoom-in-95 duration-200">
        {children}
      </div>
    </div>
  );
}