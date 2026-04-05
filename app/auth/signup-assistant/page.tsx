'use client';

import { useState, useTransition } from 'react';
import { signUpAssistantCoach } from '../actions';

export default function AssistantCoachSignUpPage() {
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setMessage('');

    startTransition(async () => {
      const result = await signUpAssistantCoach({
        email: String(formData.get('email') || ''),
        password: String(formData.get('password') || ''),
        firstName: String(formData.get('firstName') || ''),
        lastName: String(formData.get('lastName') || ''),
        joinCode: String(formData.get('joinCode') || ''),
      });

      if (result?.error) {
        setMessage(result.error);
      }
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-400 to-slate-700 text-white">
      <main className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl rounded-xl bg-slate-800 p-8 shadow-xl space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold">Assistant Coach Sign Up</h1>
            <p className="mt-3 text-slate-200">
              Join your team using the team join code from your head coach.
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
              name="joinCode"
              placeholder="Join code"
              className="rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white md:col-span-2"
              required
            />

            <button
              type="submit"
              disabled={isPending}
              className="md:col-span-2 rounded-lg bg-white px-5 py-3 font-semibold text-slate-800 shadow hover:scale-105 transition"
            >
              {isPending ? 'Creating account...' : 'Create Assistant Coach Account'}
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