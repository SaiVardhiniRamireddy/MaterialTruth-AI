import { AlertTriangle, CheckCircle2, HelpCircle, Info, Loader2, XCircle } from 'lucide-react';

export function Spinner({ size = 18, className = '' }) {
  return <Loader2 size={size} className={`animate-spin ${className}`} />;
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <div className="flex items-center gap-3 text-ink-500">
        <Spinner className="text-brand-600" /> {label}
      </div>
    </div>
  );
}

const ALERT = {
  error: { cls: 'border-red-200 bg-red-50 text-red-800', Icon: XCircle },
  success: { cls: 'border-brand-200 bg-brand-50 text-brand-800', Icon: CheckCircle2 },
  warning: { cls: 'border-amber-200 bg-amber-50 text-amber-900', Icon: AlertTriangle },
  info: { cls: 'border-teal-100 bg-teal-50 text-teal-700', Icon: Info },
};

export function Alert({ type = 'info', title, children, className = '' }) {
  const { cls, Icon } = ALERT[type];
  return (
    <div role={type === 'error' ? 'alert' : 'status'} className={`flex gap-3 rounded-xl border px-4 py-3 text-sm ${cls} ${className}`}>
      <Icon size={18} className="mt-0.5 shrink-0" />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? 'mt-0.5 opacity-90' : ''}>{children}</div>}
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon = HelpCircle, title, children, action }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-ink-200 bg-white px-6 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600"><Icon size={22} /></span>
      <h3 className="mt-4 text-base font-bold">{title}</h3>
      {children && <p className="mt-1 max-w-sm text-sm text-ink-500">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Modal({ open, title, children, onClose, actions }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/40 p-4 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className="card w-full max-w-md animate-fadeUp p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold">{title}</h3>
        <div className="mt-2 text-sm text-ink-500">{children}</div>
        <div className="mt-6 flex justify-end gap-2">{actions}</div>
      </div>
    </div>
  );
}
