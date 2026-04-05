'use client';

import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import NavbarLogoutButton from '@/app/Components/Nav/SidebarLogoutButton';

type NavbarUserMenuProps = {
  coachName: string;
  coachEmail: string;
};

export default function NavbarUserMenu({
  coachName,
  coachEmail,
}: NavbarUserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center rounded-lg px-4 py-2 font-semibold hover:bg-slate-700 transition text-white"
      >
        <span className="max-w-[220px] truncate">{coachEmail}</span>
        <FontAwesomeIcon icon={faChevronDown} className="ml-2 h-3 w-3" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 overflow-hidden rounded-lg border border-slate-600 bg-slate-700 shadow-xl">
          <div className="border-b border-slate-600 px-4 py-3">
            <p className="font-semibold text-white">{coachName}</p>
            <p className="mt-1 text-sm text-slate-300 break-all">{coachEmail}</p>
          </div>

          <div className="p-2">
            <NavbarLogoutButton />
          </div>
        </div>
      )}
    </div>
  );
}