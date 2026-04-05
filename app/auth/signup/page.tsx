'use client';

import { useState, useTransition } from 'react';
import { signUpHeadCoach } from '../actions';

const SPORT_OPTIONS = [
  'Baseball',
  "Women's Basketball",
  "Men's Basketball",
  "Men's Soccer",
  "Women's Soccer",
  'Softball',
  "Men's Volleyball",
  "Women's Volleyball",
  'Track',
  'Tennis',
  'Football',
];

export default function SignUpPage() {
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setMessage('');

    startTransition(async () => {
      const result = await signUpHeadCoach({
        email: String(formData.get('email') || ''),
        password: String(formData.get('password') || ''),
        firstName: String(formData.get('firstName') || ''),
        lastName: String(formData.get('lastName') || ''),
        schoolName: String(formData.get('schoolName') || ''),
        teamName: String(formData.get('teamName') || ''),
        sport: String(formData.get('sport') || ''),
      });

      if (result?.error) {
        setMessage(result.error);
      }
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-400 to-slate-700 text-white">
      <main className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-3xl rounded-xl bg-slate-800 p-8 shadow-xl space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold">Head Coach Sign Up</h1>
            <p className="mt-3 text-slate-200">
              Create your head coach account and set up your school, team, and sport.
            </p>
          </div>

          <form action={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <input
              name="firstName"
              placeholder="First name"
              className="rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
              required
            />

            <input
              name="lastName"
              placeholder="Last name"
              className="rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
              required
            />

            <input
              name="email"
              type="email"
              placeholder="Email"
              className="rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white md:col-span-2"
              required
            />

            <input
              name="password"
              type="password"
              placeholder="Password"
              className="rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white md:col-span-2"
              required
            />

            <input
              name="schoolName"
              placeholder="School name"
              className="rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
              required
            />

            <select
              name="sport"
              defaultValue=""
              className="rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
              required
            >
              <option value="" disabled>
                Select sport
              </option>
              {SPORT_OPTIONS.map((sport) => (
                <option key={sport} value={sport}>
                  {sport}
                </option>
              ))}
            </select>

            <input
              name="teamName"
              placeholder="Team name"
              className="rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white md:col-span-2"
              required
            />

            <button
              type="submit"
              disabled={isPending}
              className="md:col-span-2 rounded-lg bg-white px-5 py-3 font-semibold text-slate-800 shadow hover:scale-105 transition"
            >
              {isPending ? 'Creating account...' : 'Create Head Coach Account'}
            </button>
          </form>

          {message && (
            <p className="text-center text-red-300">{message}</p>
          )}
        </div>
      </main>
    </div>
  );
}