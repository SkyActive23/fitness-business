'use client';

import { useEffect, useState, useTransition } from 'react';
import { createAssessment } from './actions';

type AthleteOption = {
  id: string;
  first_name: string;
  last_name: string;
  team_name: string;
};

type CreateFormState = {
  athleteId: string;
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

const emptyForm: CreateFormState = {
  athleteId: '',
  assessmentDate: '',
  squat: '',
  bench: '',
  clean: '',
  cmj: '',
  singleLegCmjRight: '',
  singleLegCmjLeft: '',
  sprint20m: '',
  mod505: '',
};

export default function AssessmentsPanel({
  athletes = [],
  sport,
}: {
  athletes?: AthleteOption[];
  sport: string;
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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage('');

    startTransition(async () => {
      const result = await createAssessment({
        athleteId: form.athleteId,
        assessmentDate: form.assessmentDate,
        squat: form.squat,
        bench: form.bench,
        clean: form.clean,
        cmj: form.cmj,
        singleLegCmjRight: form.singleLegCmjRight,
        singleLegCmjLeft: form.singleLegCmjLeft,
        sprint20m: form.sprint20m,
        mod505: form.mod505,
      });

      if (result?.error) {
        setMessage(result.error);
        return;
      }

      setMessage('Assessment added successfully.');
      setIsModalOpen(false);
      setForm(emptyForm);
    });
  }

  return (
    <section className="rounded-2xl bg-slate-800/95 border border-slate-600 shadow-2xl p-6 sm:p-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Assessments
          </h2>
          <p className="mt-2 text-slate-300">
            Add testing data for athletes in {sport}.
          </p>
        </div>

        <button
          type="button"
          onClick={openModal}
          className="rounded-xl bg-white px-5 py-3 font-semibold text-slate-800 shadow-lg hover:scale-[1.01] transition"
        >
          Add Assessment
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
              <h2 className="text-2xl font-bold">Add Assessment</h2>

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

              <ModalField label="Squat">
                <input
                  name="squat"
                  value={form.squat}
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

              <ModalField label="Clean">
                <input
                  name="clean"
                  value={form.clean}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                />
              </ModalField>

              <ModalField label="CMJ">
                <input
                  name="cmj"
                  value={form.cmj}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                />
              </ModalField>

              <ModalField label="Single Leg CMJ Right">
                <input
                  name="singleLegCmjRight"
                  value={form.singleLegCmjRight}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                />
              </ModalField>

              <ModalField label="Single Leg CMJ Left">
                <input
                  name="singleLegCmjLeft"
                  value={form.singleLegCmjLeft}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                />
              </ModalField>

              <ModalField label="20m Sprint">
                <input
                  name="sprint20m"
                  value={form.sprint20m}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                />
              </ModalField>

              <ModalField label="Mod 505">
                <input
                  name="mod505"
                  value={form.mod505}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-white"
                />
              </ModalField>

              <div className="md:col-span-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-white px-5 py-3 font-semibold text-slate-800 shadow-lg hover:scale-[1.01] transition"
                >
                  {isPending ? 'Saving...' : 'Add Assessment'}
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
      <div className="relative z-[101] w-full max-w-2xl px-4 animate-in fade-in zoom-in-95 duration-200">
        {children}
      </div>
    </div>
  );
}