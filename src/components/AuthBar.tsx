import { useEffect, useState } from 'react';
import { currentUser, logout, onAuthChange, type User } from '../lib/auth';

const roleLabel: Record<User['role'], string> = {
  admin: 'Admin',
  supplier: 'Supplier',
  b2b: 'B2B Client',
  retail: 'Retailer',
  b2c: 'Customer',
  guest: 'Guest',
};

type Props = { onSignInClick: () => void };

const AuthBar = ({ onSignInClick }: Props) => {
  const [user, setUser] = useState<User>(() => currentUser());
  useEffect(() => onAuthChange(() => setUser(currentUser())), []);

  if (user.role === 'guest') {
    return (
      <button
        onClick={onSignInClick}
        className="text-xs font-semibold tracking-wide px-4 py-2 rounded-md bg-primary text-surface hover:opacity-90 transition"
      >
        Sign in
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="text-right leading-tight hidden sm:block">
        <div className="text-xs font-semibold text-primary">{user.displayName}</div>
        <div className="text-[10px] uppercase tracking-wider text-on-surface-variant">{roleLabel[user.role]}</div>
      </div>
      <button
        onClick={() => logout()}
        className="text-xs font-semibold tracking-wide px-3 py-2 rounded-md bg-surface-container-low text-primary hover:bg-surface-container transition"
      >
        Sign out
      </button>
    </div>
  );
};

export default AuthBar;
