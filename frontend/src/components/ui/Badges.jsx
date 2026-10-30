import { Box, CircleDot, FileText, Gem, Leaf, Layers, Package, Shirt, Wine } from 'lucide-react';

export const CONFIDENCE = {
  High: { cls: 'bg-brand-100 text-brand-800 ring-brand-200', dot: 'bg-brand-500', text: 'High confidence' },
  Medium: { cls: 'bg-teal-100 text-teal-700 ring-teal-100', dot: 'bg-teal-500', text: 'Medium confidence' },
  Low: { cls: 'bg-amber-100 text-amber-800 ring-amber-200', dot: 'bg-amber-500', text: 'Low confidence' },
  Inconclusive: { cls: 'bg-ink-100 text-ink-700 ring-ink-200', dot: 'bg-ink-400', text: 'Inconclusive' },
};

export function ConfidenceBadge({ level = 'Inconclusive', short = false }) {
  const c = CONFIDENCE[level] || CONFIDENCE.Inconclusive;
  return (
    <span className={`chip ring-1 ${c.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {short ? level : c.text}
    </span>
  );
}

export const CATEGORY = {
  Plastic: { Icon: Package, color: '#20aeaa', bg: 'bg-teal-50 text-teal-700' },
  'Paper & Fibre': { Icon: FileText, color: '#c08a3e', bg: 'bg-amber-50 text-amber-800' },
  Metal: { Icon: CircleDot, color: '#64748b', bg: 'bg-slate-100 text-slate-700' },
  Glass: { Icon: Wine, color: '#3b82f6', bg: 'bg-sky-50 text-sky-700' },
  Organic: { Icon: Leaf, color: '#279c78', bg: 'bg-brand-50 text-brand-700' },
  Textile: { Icon: Shirt, color: '#a855f7', bg: 'bg-purple-50 text-purple-700' },
  Composite: { Icon: Layers, color: '#e0784b', bg: 'bg-orange-50 text-orange-700' },
  Unknown: { Icon: Gem, color: '#87958f', bg: 'bg-ink-100 text-ink-500' },
};

export function CategoryIcon({ category, size = 18, className = '' }) {
  const c = CATEGORY[category] || CATEGORY.Unknown;
  return (
    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${c.bg} ${className}`}>
      <c.Icon size={size} />
    </span>
  );
}

export function CategoryChip({ category }) {
  const c = CATEGORY[category] || CATEGORY.Unknown;
  return <span className={`chip ${c.bg}`}>{category || 'Unknown'}</span>;
}

export const FallbackBox = Box;
