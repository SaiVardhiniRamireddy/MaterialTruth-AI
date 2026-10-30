import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Filter, Search, Timer } from 'lucide-react';
import { api } from '../services/api.js';
import { Alert, EmptyState, PageLoader } from '../components/ui/Feedback.jsx';
import { CategoryChip, CategoryIcon, CATEGORY } from '../components/ui/Badges.jsx';
import { formatTimeframe } from '../utils/format.js';

const CATEGORIES = ['All', 'Plastic', 'Paper & Fibre', 'Metal', 'Glass', 'Organic', 'Textile', 'Composite'];

function MaterialCard({ m }) {
  const tf = formatTimeframe(m.decomposition?.timeframe);
  return (
    <div className="card overflow-hidden group transition hover:-translate-y-0.5 hover:shadow-lift" id={`material-${m.key}`}>
      <div className="px-5 pt-5 pb-3 flex gap-3">
        <CategoryIcon category={m.category} />
        <div className="flex-1 min-w-0">
          <p className="font-bold leading-tight">{m.name}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <CategoryChip category={m.category} />
            {m.resinCode && <span className="chip bg-ink-100 text-ink-600 text-[10px]">#{m.resinCode}</span>}
            {m.composition === 'Composite' && <span className="chip bg-orange-100 text-orange-700 text-[10px]">Composite</span>}
          </div>
        </div>
      </div>

      <div className="border-t border-ink-100 px-5 py-3 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-ink-400 font-medium mb-0.5">Biodegradability</p>
          <p className="font-semibold">{m.biodegradability?.classification}</p>
        </div>
        <div>
          <p className="text-ink-400 font-medium mb-0.5">Recyclability</p>
          <p className="font-semibold">{m.recyclability?.level}</p>
        </div>
      </div>

      {m.decomposition && (
        <div className="border-t border-ink-100 px-5 py-3">
          <div className="flex items-center gap-1.5 text-xs text-ink-400 mb-1"><Timer size={12} /> Decomposition timeframe</div>
          {tf ? (
            <p className="text-sm font-bold text-brand-600">{tf}</p>
          ) : (
            <p className="text-xs italic text-ink-400">Timeframe unavailable</p>
          )}
          {m.decomposition.description && <p className="mt-1 text-xs text-ink-500 line-clamp-2">{m.decomposition.description}</p>}
        </div>
      )}

      {m.disposal && (
        <div className="border-t border-ink-100 px-5 py-3">
          <p className="text-xs text-ink-400 mb-1">Primary disposal</p>
          <span className="chip bg-brand-100 text-brand-700 text-xs">{m.disposal.primary}</span>
          {m.disposal.steps?.slice(0, 2).map((s, i) => <p key={i} className="mt-1 text-xs text-ink-600">· {s}</p>)}
        </div>
      )}

      {m.commonExamples?.length > 0 && (
        <div className="border-t border-ink-100 px-5 py-3">
          <p className="text-xs text-ink-400 mb-1">Common examples</p>
          <p className="text-xs text-ink-600">{m.commonExamples.slice(0, 3).join(' · ')}</p>
        </div>
      )}

      {m.sources?.length > 0 && (
        <div className="border-t border-ink-100 px-5 py-3">
          <p className="text-[10px] text-ink-300 mb-1 uppercase tracking-wider">Sources</p>
          {m.sources.slice(0, 2).map((s, i) => (
            <a key={i} href={s.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] text-brand-600 hover:underline">
              <ExternalLink size={9} />{s.organisation}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Knowledge() {
  const [materials, setMaterials] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const timer = useRef();

  useEffect(() => {
    api.materials.list().then((d) => { setMaterials(d); setFiltered(d); }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      let f = materials;
      if (category !== 'All') f = f.filter((m) => m.category === category);
      if (search.trim()) {
        const q = search.toLowerCase();
        f = f.filter((m) => m.name.toLowerCase().includes(q) || m.aliases?.some((a) => a.toLowerCase().includes(q)) || m.commonExamples?.some((e) => e.toLowerCase().includes(q)));
      }
      setFiltered(f);
    }, 250);
  }, [search, category, materials]);

  if (error) return <div className="container-page py-16"><Alert type="error">{error}</Alert></div>;
  if (loading) return <PageLoader label="Loading material library…" />;

  return (
    <div className="container-page py-10">
      <div className="mb-8">
        <p className="eyebrow">Material knowledge library</p>
        <h1 className="mt-1 text-3xl font-bold">Verified material information</h1>
        <p className="text-ink-500 max-w-2xl">Decomposition data, environmental impact and disposal guidance sourced from government agencies and peer-reviewed literature. Information here is separate from AI-generated identification.</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, alias or example…" className="input pl-10" id="knowledge-search" />
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input pl-9 pr-8" id="knowledge-category">
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <p className="text-sm text-ink-400 mb-4">{filtered.length} material{filtered.length !== 1 ? 's' : ''}</p>

      {filtered.length === 0 ? (
        <EmptyState icon={Search} title="No materials match your search" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => <MaterialCard key={m.key} m={m} />)}
        </div>
      )}
    </div>
  );
}
