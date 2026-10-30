import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Clock, Layers, PlusCircle, Recycle, Sparkles, TrendingUp } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { ConfidenceBadge, CategoryChip, CATEGORY } from '../components/ui/Badges.jsx';
import { PageLoader, Alert, EmptyState } from '../components/ui/Feedback.jsx';
import { formatDate } from '../utils/format.js';

function StatCard({ value, label, sub, color = 'brand' }) {
  const cls = { brand: 'text-brand-600', teal: 'text-teal-600', amber: 'text-amber-600', slate: 'text-slate-600' };
  return (
    <div className="card card-pad">
      <p className={`text-3xl font-extrabold ${cls[color] || cls.brand}`}>{value}</p>
      <p className="mt-0.5 text-sm font-semibold text-ink-900 dark:text-[#e2ebe7]">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-ink-400 dark:text-[#6a8880]">{sub}</p>}
    </div>
  );
}

function AnalysisRow({ a, compact = false }) {
  return (
    <Link to={`/results/${a._id}`} className="group flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-ink-50 dark:hover:bg-white/[.05]" id={`analysis-${a._id}`}>
      {a.evidenceMeta?.image?.thumbnail ? (
        <img src={a.evidenceMeta.image.thumbnail} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
      ) : (
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><Layers size={18} /></span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold group-hover:text-brand-700">{a.objectName}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          <CategoryChip category={a.composition?.primaryCategory} />
          {!compact && <ConfidenceBadge level={a.confidence?.level} short />}
        </div>
      </div>
      <span className="shrink-0 text-xs text-ink-400">{formatDate(a.createdAt)}</span>
    </Link>
  );
}

const PIE_COLORS = Object.entries(CATEGORY).map(([, v]) => v.color);

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.dashboard.stats().then(setStats).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="container-page py-16"><Alert type="error">{error}</Alert></div>;
  if (!stats) return <PageLoader label="Loading dashboard…" />;

  const pieData = stats.byCategory.filter((c) => c.count > 0).map((c) => ({ name: c.category, value: c.count, fill: CATEGORY[c.category]?.color || '#87958f' }));
  const highOrMed = (stats.byConfidence.High || 0) + (stats.byConfidence.Medium || 0);

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1 className="mt-1 text-3xl font-bold">Hello, {user.name.split(' ')[0]} 👋</h1>
          <p className="text-ink-500">Your material analysis workspace</p>
        </div>
        <Link to="/analyze" className="btn-primary" id="dashboard-new-analysis"><PlusCircle size={16} /> New analysis</Link>
      </div>

      {/* STATS */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard value={stats.total} label="Total analyses" sub="All time" />
        <StatCard value={highOrMed} label="High/Medium confidence" sub={`${stats.total ? Math.round((highOrMed / stats.total) * 100) : 0}% of all analyses`} color="teal" />
        <StatCard value={stats.byCategory.length} label="Material categories identified" color="amber" />
        <StatCard value={(stats.byStructure?.['Multilayer composite'] || 0)} label="Composite structures detected" sub="Bonded multilayer items" color="slate" />
      </div>

      {stats.insights.length > 0 && (
        <div className="mt-6 space-y-2">
          {stats.insights.map((ins, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-800 dark:border-brand-700/30 dark:bg-brand-900/20 dark:text-brand-300">
              <Sparkles size={16} className="mt-0.5 shrink-0 text-brand-500" /> {ins}
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* RECENT */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="section-title flex items-center gap-2"><Clock size={18} className="text-brand-600" /> Recent analyses</h2>
            <Link to="/history" className="text-sm font-medium text-brand-600 hover:underline">View all →</Link>
          </div>
          <div className="card mt-3">
            {stats.recent.length === 0 ? (
              <EmptyState icon={TrendingUp} title="No analyses yet" action={<Link to="/analyze" className="btn-primary">Start analysing</Link>}>
                Run your first material analysis to see it here.
              </EmptyState>
            ) : (
              <div className="divide-y divide-ink-100 p-2">
                {stats.recent.map((a) => <AnalysisRow key={a._id} a={a} />)}
              </div>
            )}
          </div>
        </div>

        {/* CATEGORY PIE */}
        <div className="space-y-6">
          <div>
            <h2 className="section-title flex items-center gap-2"><BarChart3 size={18} className="text-brand-600" /> By material category</h2>
            <div className="card mt-3 p-5">
              {pieData.length === 0 ? (
                <p className="py-4 text-center text-sm text-ink-400">No data yet</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={80} dataKey="value" paddingAngle={2} stroke="none">
                        {pieData.map((d, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ borderRadius: 10, border: '1px solid #dfe6e3', fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <ul className="mt-2 space-y-1">
                    {pieData.map((d) => (
                      <li key={d.name} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: d.fill }} />{d.name}</span>
                        <span className="font-semibold">{d.value}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>

          {/* RECYCLABILITY */}
          <div>
            <h2 className="section-title flex items-center gap-2"><Recycle size={18} className="text-brand-600" /> Recyclability summary</h2>
            <div className="card mt-3 divide-y divide-ink-100">
              {Object.entries(stats.recyclability).length === 0 ? (
                <p className="px-4 py-4 text-sm text-ink-400">No data yet</p>
              ) : Object.entries(stats.recyclability).map(([level, count]) => (
                <div key={level} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="text-ink-600 dark:text-[#a8c0b8]">{level}</span>
                  <span className="font-bold text-brand-700 dark:text-brand-400">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RECENTLY VIEWED */}
      {stats.recentlyViewed?.length > 0 && (
        <div className="mt-8">
          <h2 className="section-title flex items-center gap-2"><Clock size={18} className="text-brand-600" /> Recently viewed reports</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stats.recentlyViewed.map((a) => (
              <Link key={a._id} to={`/results/${a._id}`} className="card card-pad group flex items-center justify-between transition hover:-translate-y-0.5 hover:shadow-lift">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold group-hover:text-brand-700">{a.objectName}</p>
                  <p className="text-xs text-ink-400">{formatDate(a.createdAt)}</p>
                </div>
                <ArrowRight size={16} className="shrink-0 text-ink-300 group-hover:text-brand-500" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
