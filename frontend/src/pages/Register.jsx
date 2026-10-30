import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert } from '../components/ui/Feedback.jsx';
import Logo from '../components/ui/Logo.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [show, setShow] = useState({ password: false, confirm: false });
  const [errors, setErrors] = useState({});
  const [serverErr, setServerErr] = useState('');
  const [busy, setBusy] = useState(false);

  // Only update the field value on change — do NOT touch errors state here.
  // Clearing errors on every keystroke was causing a re-render that stole focus.
  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
  };

  // Clear a field's error when the user leaves it (blur), not on every keystroke.
  const clearErr = (k) => () => {
    if (errors[k]) setErrors((ev) => ({ ...ev, [k]: '' }));
  };

  // Toggle password visibility without stealing input focus.
  // onMouseDown + preventDefault stops the input from losing focus when clicking the eye icon.
  const toggleShow = (k) => (e) => {
    e.preventDefault();
    setShow((s) => ({ ...s, [k]: !s[k] }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = 'Name must be at least 2 characters.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address.';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters.';
    else if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) e.password = 'Password must include a letter and a number.';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match.';
    return e;
  };

  const submit = async (e) => {
    e.preventDefault();
    setServerErr('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setBusy(true);
    try {
      await register({ name: form.name.trim(), email: form.email.trim().toLowerCase(), password: form.password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err.details) {
        const m = {};
        err.details.forEach((d) => { m[d.field] = d.message; });
        setErrors(m);
      } else {
        setServerErr(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-[calc(100vh-4rem)] place-items-center px-4 py-16">
      <div className="w-full max-w-md animate-fadeUp">
        <div className="mb-8 text-center"><Logo /></div>
        <div className="card p-8">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-ink-500">Start identifying materials and understanding their impact</p>
          {serverErr && <Alert type="error" className="mt-5">{serverErr}</Alert>}
          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>

            {/* Full name */}
            <div>
              <label htmlFor="reg-name" className="label">Full name</label>
              <div className="relative">
                <User size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  id="reg-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={set('name')}
                  onBlur={clearErr('name')}
                  className={`input pl-10${errors.name ? ' input-error' : ''}`}
                  placeholder="Alex Smith"
                  required
                />
              </div>
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="label">Email</label>
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={set('email')}
                  onBlur={clearErr('email')}
                  className={`input pl-10${errors.email ? ' input-error' : ''}`}
                  placeholder="you@example.com"
                  required
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  id="reg-password"
                  name="password"
                  type={show.password ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={set('password')}
                  onBlur={clearErr('password')}
                  className={`input pl-10 pr-11${errors.password ? ' input-error' : ''}`}
                  placeholder="Min. 8 chars, letter + number"
                  required
                />
                <button
                  type="button"
                  onMouseDown={toggleShow('password')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
                  aria-label={show.password ? 'Hide password' : 'Show password'}
                >
                  {show.password ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="reg-confirm" className="label">Confirm password</label>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  id="reg-confirm"
                  name="confirm"
                  type={show.confirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.confirm}
                  onChange={set('confirm')}
                  onBlur={clearErr('confirm')}
                  className={`input pl-10 pr-11${errors.confirm ? ' input-error' : ''}`}
                  placeholder="Re-enter password"
                  required
                />
                <button
                  type="button"
                  onMouseDown={toggleShow('confirm')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
                  aria-label={show.confirm ? 'Hide password' : 'Show password'}
                >
                  {show.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirm && <p className="mt-1 text-xs text-red-600">{errors.confirm}</p>}
            </div>

            <button type="submit" className="btn-primary w-full py-3" disabled={busy} id="register-submit">
              {busy ? <><Loader2 size={16} className="animate-spin" /> Creating account…</> : 'Create account'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-ink-500">
            Already have an account?{' '}<Link to="/login" className="font-semibold text-brand-600 hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
