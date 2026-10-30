import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Filter, Layers, PlusCircle, Search, Trash2 } from 'lucide-react';
import { api } from '../services/api.js';
import { Alert, EmptyState, Modal, PageLoader, Spinner } from '../components/ui/Feedback.jsx';
import { CategoryChip, ConfidenceBadge, CATEGORY } from '../components/ui/Badges.jsx';
import { formatDate } from '../utils/format.js';

const CATEGORIES = ['All', 'Plastic', 'Paper & Fibre', 'Metal', 'Glass', 'Organic', 'Textile', 'Composite', 'Inconclusive'];

export default function History() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const searchTimer = useRef();

  const load = useCallback(async (q, cat, pg) => {
    setLoading(true); setError('');
    try {
      const d = await api.analysis.list({ search: q || undefined, category: cat !== 'All' ? cat : undefined, page: pg, limit: 12 });
      setItems(d.items); setTotal(d.total); setPages(d.pages);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(search, category, page); }, [category, page, load]);
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setPage(1); load(search, category, 1); }, 400);
  }, [search]);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.analysis.remove(deleteId);
      setDeleteId(null);
      load(search, category, page);
    } catch (e) { setError(e.message); }
    finally { setDeleting(false); }
  };

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <p className="eyebrow">Analysis history</p>
          <h1 className="mt-1 text-3xl font-bold">Your reports</h1>
          <p className="text-ink-500">{total} report{total !== 1 ? 's' : ''} total</p>
        </div>
        <Link to="/analyze" className="btn-primary" id="history-new"><PlusCircle size={16} /> New analysis</Link>
      </div>

      {/* FILTERS */}
      <div className="mb-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or material…" className="input pl-10" id="history-search" />
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
          <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="input pl-9 pr-8" id="history-category">
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {error && <Alert type="error" className="mb-4">{error}</Alert>}

      {loading ? <div className="grid place-items-center py-16"><Spinner size={28} className="text-brand-600" /></div> : items.length === 0 ? (
        <EmptyState icon={Layers} title={search || category !== 'All' ? 'No matching reports' : 'No analyses yet'}
          action={<Link to="/analyze" className="btn-primary">Run your first analysis</Link>}>
          {search || category !== 'All' ? 'Try different search terms or clear the filter.' : 'Analyse a material to build your history.'}
        </EmptyState>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((a) => {
              const cat = CATEGORY[a.composition?.primaryCategory] || CATEGORY.Unknown;
              return (
                <div key={a._id} className="card overflow-hidden group transition hover:-translate-y-0.5 hover:shadow-lift">
                  {a.evidenceMeta?.image?.thumbnail ? (
                    <img src={a.evidenceMeta.image.thumbnail} alt="" className="h-36 w-full object-cover" />
                  ) : (
                    <div className="h-20 flex items-center justify-center" style={{ background: `${cat.color}18` }}>
                      <cat.Icon size={32} style={{ color: cat.color }} />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-sm leading-tight truncate flex-1">{a.objectName}</p>
                      <button onClick={() => setDeleteId(a._id)} className="shrink-0 text-ink-300 hover:text-red-500 transition" title="Delete" id={`delete-${a._id}`}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <CategoryChip category={a.composition?.primaryCategory} />
                      <ConfidenceBadge level={a.confidence?.level} short />
                    </div>
                    {a.composition?.structure && <p className="mt-1 text-xs text-ink-400">{a.composition.structure}</p>}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-ink-400">{formatDate(a.createdAt)}</span>
                      <Link to={`/results/${a._id}`} className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1" id={`view-${a._id}`}>
                        View report <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* PAGINATION */}
          {pages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-3 py-2 text-sm">←</button>
              {Array.from({ length: pages }, (_, i) => i + 1).filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === pages).map((p, i, arr) => (
                <>
                  {i > 0 && arr[i - 1] !== p - 1 && <span key={`ellipsis-${p}`} className="text-ink-400">…</span>}
                  <button key={p} onClick={() => setPage(p)} className={`btn px-3 py-2 text-sm ${page === p ? 'btn-primary' : 'btn-secondary'}`}>{p}</button>
                </>
              ))}
              <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="btn-secondary px-3 py-2 text-sm">→</button>
            </div>
          )}
        </>
      )}

      <Modal open={!!deleteId} title="Delete report?" onClose={() => setDeleteId(null)}
        actions={<>
          <button onClick={() => setDeleteId(null)} className="btn-secondary" id="cancel-delete">Cancel</button>
          <button onClick={confirmDelete} disabled={deleting} className="btn-danger" id="confirm-delete">{deleting ? <Spinner size={14} /> : null} Delete</button>
        </>}>
        This report will be permanently removed from your history. This cannot be undone.
      </Modal>
    </div>
  );
}
