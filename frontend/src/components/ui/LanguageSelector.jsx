import { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check, Loader2 } from 'lucide-react';

const FLAG = {
  en: '🇬🇧', hi: '🇮🇳', ta: '🇮🇳', te: '🇮🇳', bn: '🇧🇩', ur: '🇵🇰',
  es: '🇪🇸', fr: '🇫🇷', de: '🇩🇪', pt: '🇵🇹', it: '🇮🇹', ru: '🇷🇺',
  ar: '🇸🇦', zh: '🇨🇳', ja: '🇯🇵', ko: '🇰🇷',
};

export const SUPPORTED_LANGUAGES = {
  en: 'English',   hi: 'हिन्दी',     ta: 'தமிழ்',    te: 'తెలుగు',
  bn: 'বাংলা',    ur: 'اردو',       es: 'Español',   fr: 'Français',
  de: 'Deutsch',   pt: 'Português',  it: 'Italiano',  ru: 'Русский',
  ar: 'العربية',  zh: '中文',        ja: '日本語',     ko: '한국어',
};

/**
 * LanguageSelector – a floating dropdown for choosing the report language.
 * @param {string}   lang         Current language code
 * @param {function} onLangChange Called with the new language code
 * @param {boolean}  loading      True while translation is in progress
 */
export default function LanguageSelector({ lang = 'en', onLangChange, loading = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (code) => {
    setOpen(false);
    if (code !== lang) onLangChange(code);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 py-1.5 text-sm font-medium text-ink-700 shadow-sm transition hover:border-brand-400 hover:text-brand-700"
        aria-label="Select language"
        disabled={loading}
        id="lang-selector-btn"
      >
        {loading
          ? <Loader2 size={14} className="animate-spin text-brand-600" />
          : <Globe size={14} className="text-brand-600" />
        }
        <span>{FLAG[lang]} {SUPPORTED_LANGUAGES[lang] || 'English'}</span>
        <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-2xl border border-ink-100 bg-white p-1.5 shadow-xl animate-fadeUp">
          <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-400">
            Choose language
          </p>
          <div className="max-h-72 overflow-y-auto">
            {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
              <button
                key={code}
                type="button"
                onClick={() => select(code)}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition
                  ${code === lang
                    ? 'bg-brand-50 text-brand-700 font-semibold'
                    : 'text-ink-700 hover:bg-ink-50'
                  }`}
              >
                <span className="text-base leading-none">{FLAG[code]}</span>
                <span className="flex-1 text-left">{name}</span>
                {code === lang && <Check size={13} className="text-brand-600 shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
