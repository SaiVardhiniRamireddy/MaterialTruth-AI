export default function Logo({ compact = false }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-teal-600 shadow-sm">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3c-4 3.2-6 6.5-6 9.2a6 6 0 0 0 12 0C18 9.5 16 6.2 12 3z" />
          <path d="M12 9v11M9 14l3 2 3-2" />
        </svg>
      </span>
      {!compact && (
        <span className="font-display text-[17px] font-extrabold tracking-tight text-ink-900">
          MaterialTruth <span className="text-brand-600">AI</span>
        </span>
      )}
    </span>
  );
}
