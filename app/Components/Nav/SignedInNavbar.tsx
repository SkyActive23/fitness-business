'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { getSportHref } from '@/app/lib/getSportHref';
import NavbarUserMenu from '@/app/Components/Nav/NavUserMenu';

type SignedInNavbarProps = {
  coachName: string;
  coachEmail: string;
  sports?: string[];
};

export default function SignedInNavbar({
  coachName,
  coachEmail,
  sports = [],
}: SignedInNavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [assessmentsOpen, setAssessmentsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-600 bg-slate-800 text-white shadow-lg">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Image
            src="/images/logos/logoFT.png"
            alt="FineTuned Performance Logo"
            width={52}
            height={52}
            className="object-contain"
          />
          <div className="hidden sm:block">
            <p className="text-lg font-bold">FineTuned Performance</p>
            {/* <p className="text-sm text-slate-300">{coachName}</p> */}
          </div>
        </div>

        <nav className="hidden w-full items-center justify-end gap-3 md:flex">
          <Link
            href="/dashboard"
            className="rounded-lg px-4 py-2 font-semibold hover:bg-slate-700 transition"
          >
            Dashboard
          </Link>

          <Link
            href="/dashboard/athletes"
            className="rounded-lg px-4 py-2 font-semibold hover:bg-slate-700 transition"
          >
            Athletes
          </Link>

          <Link
            href="/dashboard/coaches"
            className="rounded-lg px-4 py-2 font-semibold hover:bg-slate-700 transition"
          >
            Coaches
          </Link>

          <div className="relative">
            <button
              type="button"
              onClick={() => setAssessmentsOpen((prev) => !prev)}
              className="flex items-center rounded-lg px-4 py-2 font-semibold hover:bg-slate-700 transition"
            >
              Assessments
              <FontAwesomeIcon icon={faChevronDown} className="ml-2 h-3 w-3" />
            </button>

            {assessmentsOpen && (
              <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-lg border border-slate-600 bg-slate-700 shadow-xl z-50">
                {sports?.length ? (
                  sports.map((sport) => (
                    <Link
                      key={sport}
                      href={getSportHref(sport)}
                      className="block px-4 py-3 hover:bg-slate-600 transition"
                      onClick={() => setAssessmentsOpen(false)}
                    >
                      {sport}
                    </Link>
                  ))
                ) : (
                  <div className="px-4 py-3 text-slate-300">No sports assigned</div>
                )}
              </div>
            )}
          </div>

          <div className="ml-2 border-l border-slate-600 pl-3">
            <NavbarUserMenu
              coachName={coachName}
              coachEmail={coachEmail}
            />
          </div>
        </nav>

        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="rounded-lg border border-slate-500 px-3 py-2 text-sm font-semibold md:hidden"
        >
          Menu
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-600 bg-slate-800 px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <Link
              href="/dashboard"
              className="rounded-lg px-4 py-3 font-semibold hover:bg-slate-700 transition"
              onClick={() => setMobileOpen(false)}
            >
              Dashboard
            </Link>

            <Link
              href="/dashboard/athletes"
              className="rounded-lg px-4 py-3 font-semibold hover:bg-slate-700 transition"
              onClick={() => setMobileOpen(false)}
            >
              Athletes
            </Link>

            <Link
              href="/dashboard/coaches"
              className="rounded-lg px-4 py-3 font-semibold hover:bg-slate-700 transition"
              onClick={() => setMobileOpen(false)}
            >
              Coaches
            </Link>

            <div className="rounded-lg bg-slate-700 px-4 py-3">
              <div className="mb-2 font-semibold text-white">Assessments</div>
              <div className="flex flex-col gap-2">
                {sports?.length ? (
                  sports.map((sport) => (
                    <Link
                      key={sport}
                      href={getSportHref(sport)}
                      className="rounded-lg px-3 py-2 text-slate-100 hover:bg-slate-600 transition"
                      onClick={() => setMobileOpen(false)}
                    >
                      {sport}
                    </Link>
                  ))
                ) : (
                  <div className="text-slate-300">No sports assigned</div>
                )}
              </div>
            </div>

            <div className="rounded-lg bg-slate-700 px-4 py-3 text-sm text-slate-200">
              <div className="font-semibold">{coachName}</div>
              <div>{coachEmail}</div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}