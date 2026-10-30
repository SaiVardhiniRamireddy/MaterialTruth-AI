import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Calendar, LogOut, Menu, Moon, Settings, Sun, User, X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import Logo from '../ui/Logo.jsx';

/* Avatar initials bubble */
function Avatar({ name, size = 'md' }) {
  const initials = name
    ? name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';
  const sz = size === 'lg' ? 'h-11 w-11 text-sm' : 'h-8 w-8 text-xs';
  return (
    <span className={`grid ${sz} shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 font-bold text-white shadow-sm`}>
      {initials}
    </span>
  );
}

/* Theme toggle button */
function ThemeToggle({ compact = false }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';
  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 transition hover:bg-ink-100 dark:text-[#c8d9d3] dark:hover:bg-white/[.08]"
        id="theme-toggle-menu"
      >
        {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-brand-500" />}
        {isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={toggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="grid h-9 w-9 place-items-center rounded-full border border-ink-200 bg-white text-ink-500 shadow-sm transition hover:border-brand-300 hover:text-brand-600 dark:border-white/10 dark:bg-white/5 dark:text-[#8fa89e] dark:hover:border-brand-500/40 dark:hover:text-brand-300"
      id="theme-toggle-btn"
    >
      {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
    </button>
  );
}

/* Profile dropdown */
function ProfileMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const joined = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : null;

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full p-0.5 pr-3 border border-transparent transition hover:border-brand-200 hover:bg-brand-50 dark:hover:border-brand-700/40 dark:hover:bg-brand-900/20"
        id="profile-menu-btn"
        aria-label="Open profile menu"
      >
        <Avatar name={user?.name} />
        <span className="text-sm font-semibold text-ink-700 dark:text-[#c8d9d3]">
          {user?.name?.split(' ')[0]}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 animate-fadeUp rounded-2xl border border-ink-200/70 bg-white shadow-lift dark:border-white/[.08] dark:bg-[#142019]">
          {/* User info card */}
          <div className="border-b border-ink-100 p-4 dark:border-white/[.07]">
            <div className="flex items-center gap-3">
              <Avatar name={user?.name} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-ink-900 dark:text-[#e5e5e5]">{user?.name}</p>
                <p className="truncate text-xs text-ink-500 dark:text-[#6a8880]">{user?.email}</p>
              </div>
            </div>
            {joined && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-ink-400 dark:text-[#5a7068]">
                <Calendar size={12} />
                Member since {joined}
              </div>
            )}
          </div>

          {/* Menu items */}
          <div className="p-2">
            <ThemeToggle compact />
            <div className="my-1 h-px bg-ink-100 dark:bg-white/[.06]" />
            <button
              type="button"
              onClick={() => { setOpen(false); onLogout(); }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              id="profile-logout-btn"
            >
              <LogOut size={15} />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const links = user
    ? [
        ['/dashboard', 'Dashboard'],
        ['/analyze', 'Analyze'],
        ['/history', 'History'],
        ['/materials', 'Materials'],
        ['/about', 'About'],
      ]
    : [
        ['/materials', 'Materials'],
        ['/about', 'About'],
      ];

  const linkCls = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition
     ${isActive
       ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
       : 'text-ink-500 hover:text-ink-900 hover:bg-ink-100 dark:text-[#8fa89e] dark:hover:text-[#e5e5e5] dark:hover:bg-white/[.08]'
     }`;

  const doLogout = () => {
    logout();
    setOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200/70 bg-white/[.85] backdrop-blur dark:border-white/[.07] dark:bg-[#000000]/90">
      <nav className="container-page flex h-16 items-center justify-between" aria-label="Main">
        <Link to={user ? '/dashboard' : '/'} id="nav-logo" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} className={linkCls} id={`nav-${label.toLowerCase()}`}>
              {label}
            </NavLink>
          ))}
        </div>

        {/* Desktop right */}
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <ThemeToggle />
              <ProfileMenu user={user} onLogout={doLogout} />
            </>
          ) : (
            <>
              <ThemeToggle />
              <Link to="/login" className="btn-ghost" id="nav-login">Log in</Link>
              <Link to="/register" className="btn-primary" id="nav-register">Get started</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="btn-ghost md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          id="nav-menu-toggle"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-ink-200 bg-white md:hidden dark:border-white/[.07] dark:bg-[#000000]">
          <div className="container-page flex flex-col gap-1 py-3">
            {/* Mobile user card */}
            {user && (
              <div className="mb-2 flex items-center gap-3 rounded-xl border border-ink-100 bg-ink-50 p-3 dark:border-white/[.06] dark:bg-white/5">
                <Avatar name={user.name} size="lg" />
                <div className="min-w-0">
                  <p className="truncate font-bold text-ink-900 dark:text-[#e5e5e5]">{user.name}</p>
                  <p className="truncate text-xs text-ink-500 dark:text-[#6a8880]">{user.email}</p>
                </div>
              </div>
            )}

            {links.map(([to, label]) => (
              <NavLink key={to} to={to} className={linkCls} onClick={() => setOpen(false)}>
                {label}
              </NavLink>
            ))}

            <div className="mt-2 space-y-1 border-t border-ink-100 pt-3 dark:border-white/[.06]">
              <ThemeToggle compact />
              {user ? (
                <button
                  onClick={doLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <LogOut size={15} /> Log out
                </button>
              ) : (
                <div className="flex gap-2">
                  <Link to="/login" className="btn-secondary flex-1" onClick={() => setOpen(false)}>Log in</Link>
                  <Link to="/register" className="btn-primary flex-1" onClick={() => setOpen(false)}>Get started</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
