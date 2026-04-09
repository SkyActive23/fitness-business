'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronDown,
  faAnglesLeft,
  faAnglesRight,
  faGaugeHigh,
  faUsers,
  faClipboardList,
  faWrench,
  faDumbbell,
  faUsersRectangle,
} from '@fortawesome/free-solid-svg-icons';
import { getSportHref } from '@/app/lib/getSportHref';
import SidebarLogoutButton from '@/app/Components/Nav/SidebarLogoutButton';

type SidebarProps = {
  sports?: string[];
};

export default function DashboardSidebar({ sports = [] }: SidebarProps) {
  const pathname = usePathname();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openSection, setOpenSection] = useState<'assessments' | 'tools' | null>(null);

  const baseLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: faGaugeHigh },
    { href: '/dashboard/athletes', label: 'Athletes', icon: faUsers },
    { href: '/dashboard/exercise-library', label: 'Exercise Library', icon: faDumbbell },
    { href: '/dashboard/classes', label: 'Classes', icon: faUsersRectangle },
    { href: '/dashboard/workouts', label: 'Workouts', icon: faDumbbell },
  ];

  const assessmentsOpen = openSection === 'assessments';
  const toolsOpen = openSection === 'tools';

  function toggleSection(section: 'assessments' | 'tools') {
    if (isCollapsed) {
      setIsCollapsed(false);
      setOpenSection(section);
      return;
    }

    setOpenSection((prev) => (prev === section ? null : section));
  }

  return (
    <aside
      className={`hidden lg:flex shrink-0 flex-col border-r border-slate-600 bg-slate-800 text-white min-h-[calc(100vh-73px)] transition-all duration-300 ${
        isCollapsed ? 'w-24' : 'w-72'
      }`}
    >
      <div className="flex-1 p-4 space-y-4">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <div>
              <h2 className="text-xl font-bold">Navigation</h2>
              <p className="mt-1 text-sm text-slate-300">
                Coach tools and athlete pages
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className={`rounded-lg bg-slate-700 hover:bg-slate-600 transition ${
              isCollapsed ? 'px-3 py-3' : 'px-3 py-2'
            }`}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <FontAwesomeIcon icon={isCollapsed ? faAnglesRight : faAnglesLeft} />
          </button>
        </div>

        <nav className="space-y-2">
          {baseLinks.map((link) => {
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center rounded-lg font-semibold transition ${
                  isCollapsed
                    ? 'justify-center px-3 py-3'
                    : 'gap-3 px-4 py-3'
                } ${
                  isActive
                    ? 'bg-white text-slate-800'
                    : 'bg-slate-700 text-white hover:bg-slate-600'
                }`}
                title={isCollapsed ? link.label : undefined}
              >
                <FontAwesomeIcon icon={link.icon} />
                {!isCollapsed && <span>{link.label}</span>}
              </Link>
            );
          })}

          <div className="pt-3">
            <button
              type="button"
              onClick={() => toggleSection('assessments')}
              className={`w-full flex items-center rounded-lg font-semibold bg-slate-700 hover:bg-slate-600 transition ${
                isCollapsed ? 'justify-center px-3 py-3' : 'justify-between px-4 py-3'
              }`}
              title={isCollapsed ? 'Assessments' : undefined}
            >
              <div className={`flex items-center ${isCollapsed ? '' : 'gap-3'}`}>
                <FontAwesomeIcon icon={faClipboardList} />
                {!isCollapsed && <span>Assessments</span>}
              </div>

              {!isCollapsed && (
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className={`transition-transform duration-200 ${
                    assessmentsOpen ? 'rotate-180' : ''
                  }`}
                />
              )}
            </button>

            {!isCollapsed && assessmentsOpen && (
              <div className="mt-2 ml-2 space-y-2">
                {sports.length ? (
                  sports.map((sport) => {
                    const href = getSportHref(sport);
                    const isActive = pathname === href;

                    return (
                      <Link
                        key={sport}
                        href={href}
                        className={`block rounded-lg px-4 py-2 font-semibold transition ${
                          isActive
                            ? 'bg-white text-slate-800'
                            : 'hover:bg-slate-600'
                        }`}
                      >
                        {sport}
                      </Link>
                    );
                  })
                ) : (
                  <div className="px-4 py-2 text-slate-400">
                    No sports assigned
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-3">
            <button
              type="button"
              onClick={() => toggleSection('tools')}
              className={`w-full flex items-center rounded-lg font-semibold bg-slate-700 hover:bg-slate-600 transition ${
                isCollapsed ? 'justify-center px-3 py-3' : 'justify-between px-4 py-3'
              }`}
              title={isCollapsed ? 'Tools' : undefined}
            >
              <div className={`flex items-center ${isCollapsed ? '' : 'gap-3'}`}>
                <FontAwesomeIcon icon={faWrench} />
                {!isCollapsed && <span>Tools</span>}
              </div>

              {!isCollapsed && (
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className={`transition-transform duration-200 ${
                    toolsOpen ? 'rotate-180' : ''
                  }`}
                />
              )}
            </button>

            {!isCollapsed && toolsOpen && (
              <div className="mt-2 ml-2 space-y-2">
                <Link
                  href="/calculators/timer"
                  className="block rounded-lg px-4 py-2 hover:bg-slate-600 transition"
                >
                  Interval Timer
                </Link>

                <Link
                  href="/calculators/max"
                  className="block rounded-lg px-4 py-2 hover:bg-slate-600 transition"
                >
                  Max Calculator
                </Link>

                <Link
                  href="/calculators/plate"
                  className="block rounded-lg px-4 py-2 hover:bg-slate-600 transition"
                >
                  Plate Calculator
                </Link>

                <Link
                  href="/calculators/percentiles"
                  className="block rounded-lg px-4 py-2 hover:bg-slate-600 transition"
                >
                  Percentiles
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>

      <div className="border-t border-slate-600 p-4">
        {isCollapsed ? (
          <div title="Logout">
            <SidebarLogoutButton compact />
          </div>
        ) : (
          <SidebarLogoutButton />
        )}
      </div>
    </aside>
  );
}