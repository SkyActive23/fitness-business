import { logoutCoach } from '@/app/auth/actions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons';

type SidebarLogoutButtonProps = {
  compact?: boolean;
};

export default function SidebarLogoutButton({
  compact = false,
}: SidebarLogoutButtonProps) {
  return (
    <form action={logoutCoach}>
      <button
        type="submit"
        className={`w-full font-semibold text-slate-800 bg-white shadow transition-transform hover:scale-[1.02] active:scale-[0.98] ${
          compact
            ? 'rounded-lg px-3 py-3 flex items-center justify-center'
            : 'rounded-lg px-4 py-3'
        }`}
        aria-label="Logout"
        title="Logout"
      >
        {compact ? <FontAwesomeIcon icon={faRightFromBracket} /> : 'Logout'}
      </button>
    </form>
  );
}