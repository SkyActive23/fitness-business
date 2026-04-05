'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { loginCoach } from '../actions';

export default function LoginPage() {
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  async function handleLogin(formData: FormData) {
    setMessage('');

    startTransition(async () => {
      const result = await loginCoach(formData);

      if (result?.error) {
        setMessage(result.error);
      }
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-400 to-slate-700 text-white">
      <main className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-xl bg-slate-800 p-8 shadow-xl space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold">Coach Login</h1>
            <p className="mt-3 text-slate-200">
              Sign in to manage coaches, teams, and athletes.
            </p>
          </div>

          <form action={handleLogin} className="space-y-4">
            <input
              name="email"
              type="email"
              placeholder="Email"
              required
              className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
            />

            <input
              name="password"
              type="password"
              placeholder="Password"
              required
              className="w-full rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-white"
            />

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg bg-white px-5 py-3 font-semibold text-slate-800 shadow hover:scale-105 transition"
            >
              {isPending ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="space-y-2 text-center text-sm text-slate-200">
            <p>
              Need a head coach account?{' '}
              <Link
                href="/auth/signup"
                className="font-semibold text-white underline underline-offset-4"
              >
                Sign up here
              </Link>
            </p>

            <p>
              Joining as an assistant?{' '}
              <Link
                href="/auth/signup-assistant"
                className="font-semibold text-white underline underline-offset-4"
              >
                Assistant sign up
              </Link>
            </p>
          </div>

          {message && (
            <p className="text-center text-red-300">{message}</p>
          )}
        </div>
      </main>
    </div>
  );
}