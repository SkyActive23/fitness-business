'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { logoutCoach } from '../auth/actions';
import SportTabs from './athletes/SportTabs';

type Team = {
  id: string;
  name: string;
  school: string;
  sport: string | null;
  join_code: string;
};

type Athlete = {
  id: string;
  first_name: string;
  last_name: string;
  school: string | null;
  position: string | null;
  height_in: number | null;
  sport: string | null;
  team_id: string;
  teams: {
    id: string;
    name: string;
    school: string;
    sport: string | null;
  } | null;
};

type Assessment = {
  id: string;
  athlete_id: string;
  assessment_date: string;
  weight_lbs: number | null;
  squat_max_lbs: number | null;
  bench_max_lbs: number | null;
  clean_max_lbs: number | null;
  rel_squat: number | null;
  rel_bench: number | null;
  rel_clean: number | null;
  sprint_20m: number | null;
  mod_505: number | null;
  cmj: number | null;
  sl_cmj_right: number | null;
  sl_cmj_left: number | null;
};

type CoachRow = {
  id: string;
  role: 'head' | 'assistant';
  coach_id: string;
  team_id: string;
  coaches: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  teams: {
    id: string;
    name: string;
    sport: string | null;
    school: string;
  } | null;
};

type CoachProfile = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
};

function formatNumber(value: number | null | undefined, digits = 2) {
  if (value === null || value === undefined) return '—';
  return Number(value).toFixed(digits);
}

export default function DashboardClient({
  coach,
  teamLinks,
  athletes,
  coachLinks,
  latestAssessmentsMap,
}: {
  coach: CoachProfile;
  teamLinks: { role: 'head' | 'assistant'; teams: Team }[];
  athletes: Athlete[];
  coachLinks: CoachRow[];
  latestAssessmentsMap: Record<string, Assessment>;
}) {
  const sports = useMemo(() => {
    const teamSports = teamLinks
      .map((item) => item.teams.sport)
      .filter(Boolean) as string[];

    const athleteSports = athletes
      .map((athlete) => athlete.sport || athlete.teams?.sport || null)
      .filter(Boolean) as string[];

    return Array.from(new Set([...teamSports, ...athleteSports])).sort();
  }, [teamLinks, athletes]);

  const [selectedSport, setSelectedSport] = useState<string>(sports[0] || '');

  const selectedSportTeamIds = useMemo(() => {
    return teamLinks
      .filter((item) => {
        const teamSport = item.teams.sport || '';
        return selectedSport ? teamSport === selectedSport : true;
      })
      .map((item) => item.teams.id);
  }, [teamLinks, selectedSport]);

  const filteredAthletes = useMemo(() => {
    return athletes.filter((athlete) => {
      const athleteSport = athlete.sport || athlete.teams?.sport || '';
      return selectedSport ? athleteSport === selectedSport : true;
    });
  }, [athletes, selectedSport]);

  const coachesForSport = useMemo(() => {
    return coachLinks.filter((row) => selectedSportTeamIds.includes(row.team_id));
  }, [coachLinks, selectedSportTeamIds]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-400 to-slate-700 text-white">
      <main className="flex flex-col items-center px-4 py-10 sm:px-12 sm:py-16">
        <div className="w-full max-w-[1600px] space-y-10">
          <section className="flex flex-col gap-6 text-center sm:text-left">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h1 className="text-4xl sm:text-6xl font-extrabold drop-shadow-lg">
                  Coach Dashboard
                </h1>
                <p className="mt-4 text-lg sm:text-2xl font-medium drop-shadow-md max-w-3xl">
                  Welcome back, {coach.first_name} {coach.last_name}
                </p>
                <p className="mt-2 text-base sm:text-lg text-slate-100">
                  {coach.email}
                </p>
              </div>

              <form action={logoutCoach}>
                <button
                  type="submit"
                  className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-3 rounded-lg shadow-lg transition"
                >
                  Logout
                </button>
              </form>
            </div>
          </section>

          <hr className="border-t border-4 rounded-full border-slate-200 w-4/5 mx-auto my-6" />

          <section className="w-full bg-slate-800 rounded-lg py-8 px-4 sm:px-8 shadow-xl">
            <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
              <Link
                href="/dashboard/athletes"
                className="bg-white text-slate-800 font-semibold px-5 py-3 rounded-lg shadow hover:scale-105 active:scale-95 transition-transform"
              >
                Manage Athletes
              </Link>

              <Link
                href="/dashboard/assessments"
                className="bg-white text-slate-800 font-semibold px-5 py-3 rounded-lg shadow hover:scale-105 active:scale-95 transition-transform"
              >
                Manage Assessments
              </Link>

              <Link
                href="/dashboard/coaches"
                className="bg-white text-slate-800 font-semibold px-5 py-3 rounded-lg shadow hover:scale-105 active:scale-95 transition-transform"
              >
                Manage Coaches
              </Link>
            </div>
          </section>

          <section className="w-full bg-slate-800 rounded-lg py-8 px-4 sm:px-8 shadow-xl space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Sports
              </h2>
              <p className="mt-2 text-slate-200">
                Select a sport to view coaches and athlete performance data.
              </p>
            </div>

            <SportTabs
              sports={sports}
              selectedSport={selectedSport}
              onSelectSport={setSelectedSport}
            />
          </section>

          <section className="w-full bg-slate-800 rounded-lg py-8 px-4 sm:px-8 shadow-xl space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Coaches
              </h2>
              <p className="mt-2 text-slate-200">
                All head and assistant coaches connected to the selected sport.
              </p>
            </div>

            {!coachesForSport.length ? (
              <p className="text-slate-200">No coaches found for this sport.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-600 bg-slate-700 shadow-lg">
                <table className="min-w-full text-sm text-white">
                  <thead className="bg-slate-900">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Name</th>
                      <th className="px-4 py-3 text-left font-semibold">Email</th>
                      <th className="px-4 py-3 text-left font-semibold">Role</th>
                      <th className="px-4 py-3 text-left font-semibold">Team</th>
                      <th className="px-4 py-3 text-left font-semibold">School</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coachesForSport.map((row, index) => (
                      <tr
                        key={row.id}
                        className={index % 2 === 0 ? 'bg-slate-700' : 'bg-slate-600'}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          {row.coaches
                            ? `${row.coaches.first_name} ${row.coaches.last_name}`
                            : '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {row.coaches?.email || '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              row.role === 'head'
                                ? 'bg-white text-slate-800'
                                : 'bg-slate-500 text-white'
                            }`}
                          >
                            {row.role === 'head' ? 'Head Coach' : 'Assistant Coach'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {row.teams?.name || '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {row.teams?.school || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="w-full bg-slate-800 rounded-lg py-8 px-4 sm:px-8 shadow-xl space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                {selectedSport ? `${selectedSport} Athletes` : 'Athletes'}
              </h2>
              <p className="mt-2 text-slate-200">
                Latest assessment data is shown for each athlete.
              </p>
            </div>

            {!filteredAthletes.length ? (
              <p className="text-slate-200">No athletes found for this sport yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-600 bg-slate-700 shadow-lg">
                <table className="min-w-full text-sm text-white">
                  <thead className="bg-slate-900">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Name</th>
                      <th className="px-4 py-3 text-left font-semibold">Sport</th>
                      <th className="px-4 py-3 text-left font-semibold">Team</th>
                      <th className="px-4 py-3 text-left font-semibold">School</th>
                      <th className="px-4 py-3 text-left font-semibold">Position</th>
                      <th className="px-4 py-3 text-left font-semibold">Height</th>
                      <th className="px-4 py-3 text-left font-semibold">Date</th>
                      <th className="px-4 py-3 text-left font-semibold">Weight</th>
                      <th className="px-4 py-3 text-left font-semibold">Clean</th>
                      <th className="px-4 py-3 text-left font-semibold">Squat</th>
                      <th className="px-4 py-3 text-left font-semibold">Bench</th>
                      <th className="px-4 py-3 text-left font-semibold">CMJ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAthletes.map((athlete, index) => {
                      const latest = latestAssessmentsMap[athlete.id];

                      return (
                        <tr
                          key={athlete.id}
                          className={index % 2 === 0 ? 'bg-slate-700' : 'bg-slate-600'}
                        >
                          <td className="px-4 py-3">
                            <Link
                              href={`/dashboard/athletes/${athlete.id}`}
                              className="
                                inline-block
                                bg-blue-600/30
                                text-blue-200
                                font-semibold
                                px-4 py-2
                                rounded-lg
                                border border-blue-400/40
                                hover:bg-blue-500/50
                                hover:text-white
                                hover:shadow-lg
                                hover:scale-105
                                active:scale-95
                                transition-all duration-200
                              "
                            >
                              {athlete.first_name} {athlete.last_name}
                            </Link>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {athlete.sport || athlete.teams?.sport || '—'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {athlete.teams?.name || '—'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {athlete.school || athlete.teams?.school || '—'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {athlete.position || '—'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {athlete.height_in ? `${athlete.height_in} in` : '—'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {latest?.assessment_date || '—'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {formatNumber(latest?.weight_lbs)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {formatNumber(latest?.clean_max_lbs)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {formatNumber(latest?.squat_max_lbs)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {formatNumber(latest?.bench_max_lbs)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {formatNumber(latest?.cmj)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}