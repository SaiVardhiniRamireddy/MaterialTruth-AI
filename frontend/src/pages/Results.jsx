import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle, ArrowLeft, AudioWaveform, BookOpen, CheckCircle2, Clock,
  ExternalLink, HelpCircle, Image, Layers, Leaf, Recycle, ScanText, Shield,
  Thermometer, Timer,
} from 'lucide-react';
import { api } from '../services/api.js';
import { Alert, PageLoader } from '../components/ui/Feedback.jsx';
import { ConfidenceBadge, CategoryChip, CategoryIcon, CATEGORY } from '../components/ui/Badges.jsx';
import LanguageSelector from '../components/ui/LanguageSelector.jsx';
import { formatDateTime, formatTimeframe } from '../utils/format.js';

const STATUS_ICON = {
  Confirmed: <CheckCircle2 size={14} className="text-brand-500 shrink-0" />,
  Suspected: <HelpCircle size={14} className="text-amber-500 shrink-0" />,
};

function Section({ icon: Icon, title, children, className = '' }) {
  return (
    <section className={`card overflow-hidden ${className}`}>
      <div className="flex items-center gap-2.5 border-b border-ink-100 px-5 py-3.5">
        <Icon size={18} className="text-brand-600" /><h2 className="font-bold">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function LayerRow({ layer }) {
  const catInfo = CATEGORY[layer.materialKey] || CATEGORY.Unknown;
  return (
    <div className="rounded-xl border border-ink-100 bg-ink-50 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold">{layer.position}</span>
        <span className={`chip text-xs ${layer.status === 'Confirmed' ? 'bg-brand-100 text-brand-700' : 'bg-amber-100 text-amber-800'}`}>
          {STATUS_ICON[layer.status]} {layer.status}
        </span>
        <ConfidenceBadge level={layer.confidence} short />
      </div>
      <p className="mt-1 text-sm font-semibold text-ink-700">{layer.materialName}</p>
      {layer.role && <p className="mt-0.5 text-xs text-ink-500">Role: {layer.role}</p>}
      {layer.evidence?.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-xs text-ink-500">
          {layer.evidence.map((e, i) => <li key={i} className="flex gap-1.5"><span className="text-ink-300">·</span>{e}</li>)}
        </ul>
      )}
    </div>
  );
}

function EcoCard({ eco }) {
  if (!eco.available) return (
    <div className="rounded-xl border border-dashed border-ink-200 bg-ink-50 p-4 text-sm text-ink-500">
      <p className="font-semibold">{eco.materialKey}</p>
      <p className="mt-0.5">{eco.message}</p>
    </div>
  );
  const tf = formatTimeframe(eco.decomposition?.timeframe);
  return (
    <div className={`rounded-2xl border ${eco.isPrimary ? 'border-brand-200 bg-brand-50/40' : 'border-ink-200 bg-ink-50'} p-5`}>
      <div className="flex flex-wrap items-start gap-3">
        <CategoryIcon category={eco.category} />
        <div className="flex-1">
          <p className="font-bold">{eco.name}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            <CategoryChip category={eco.category} />
            {eco.composition && <span className="chip bg-ink-100 text-ink-600">{eco.composition}</span>}
          </div>
        </div>
        {eco.isPrimary && <span className="chip bg-brand-600 text-white">Primary</span>}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Biodegradability</p>
          <p className="mt-1 text-sm font-medium">{eco.biodegradability?.classification}</p>
          {eco.biodegradability?.notes && <p className="mt-0.5 text-xs text-ink-500">{eco.biodegradability.notes}</p>}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Recyclability</p>
          <p className="mt-1 text-sm font-medium">{eco.recyclability?.level}</p>
          {eco.recyclability?.notes && <p className="mt-0.5 text-xs text-ink-500">{eco.recyclability.notes}</p>}
        </div>
      </div>

      {eco.decomposition && (
        <div className="mt-4 rounded-xl bg-white p-4 border border-ink-100">
          <div className="flex items-center gap-2 mb-2"><Timer size={15} className="text-brand-600" /><p className="text-sm font-semibold">Decomposition</p></div>
          {tf ? (
            <>
              <p className="text-2xl font-extrabold text-brand-600">{tf}</p>
              <p className="text-xs text-ink-400 mt-0.5">{eco.decomposition.timeframe.qualifier}</p>
            </>
          ) : (
            <p className="text-sm italic text-ink-500">{eco.decomposition.timeframe?.qualifier || 'Reliable decomposition timeframe unavailable for this material.'}</p>
          )}
          {eco.decomposition.description && <p className="mt-2 text-xs text-ink-600">{eco.decomposition.description}</p>}
          {eco.decomposition.conditions?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {eco.decomposition.conditions.map((c) => <span key={c} className="chip bg-ink-100 text-ink-600 text-[10px]">{c}</span>)}
            </div>
          )}
        </div>
      )}

      {eco.environmentalImpact && (
        <div className="mt-4 space-y-2">
          {[
            ['Persistence', eco.environmentalImpact.persistence],
            ['Microplastics', eco.environmentalImpact.microplastics],
            ['Wildlife', eco.environmentalImpact.wildlife],
            ['Soil & water', eco.environmentalImpact.soilWater],
            ['Landfill', eco.environmentalImpact.landfill],
            ['Recycling benefits', eco.environmentalImpact.recyclingBenefits],
          ].filter(([, v]) => v).map(([k, v]) => (
            <div key={k}>
              <p className="text-xs font-semibold text-ink-500">{k}</p>
              <p className="text-xs text-ink-700">{v}</p>
            </div>
          ))}
        </div>
      )}

      {eco.sources?.length > 0 && (
        <div className="mt-4 border-t border-ink-100 pt-3 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">Verified sources</p>
          {eco.sources.map((s, i) => (
            <a key={i} href={s.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[11px] text-brand-600 hover:underline">
              <ExternalLink size={10} />{s.organisation}: {s.title}
            </a>
          ))}
          {eco.lastVerified && <p className="text-[10px] text-ink-400">Last verified: {formatDateTime(eco.lastVerified)}</p>}
        </div>
      )}
    </div>
  );
}

const DISPOSAL_ICON = {
  Recycle, 'Home composting': Leaf, 'Industrial composting': Leaf,
  'Reuse': Shield, 'Specialised collection': BookOpen, 'General waste': AlertTriangle,
};

/* ─── helpers to flatten/unflatten translatable strings ─── */
function extractTexts(report) {
  const { composition, disposal, ecoImpact = [], limitations = [], suggestions = [] } = report;
  const t = {};
  if (composition?.summary)       t.comp_summary = composition.summary;
  if (composition?.layers)        composition.layers.forEach((l, i) => { if (l.role) t[`layer_${i}_role`] = l.role; });
  if (disposal?.headline)         t.disp_headline = disposal.headline;
  if (disposal?.steps)            disposal.steps.forEach((s, i) => { t[`disp_step_${i}`] = s; });
  if (disposal?.notice)           t.disp_notice = disposal.notice;
  if (disposal?.components)       disposal.components.forEach((c, i) => {
    if (c.action) t[`dc_action_${i}`] = c.action;
    if (c.note)   t[`dc_note_${i}`]   = c.note;
  });
  ecoImpact.forEach((eco, ei) => {
    if (eco.biodegradability?.notes)           t[`eco_${ei}_bio_notes`]    = eco.biodegradability.notes;
    if (eco.recyclability?.notes)              t[`eco_${ei}_rec_notes`]    = eco.recyclability.notes;
    if (eco.decomposition?.description)        t[`eco_${ei}_decomp_desc`]  = eco.decomposition.description;
    if (eco.environmentalImpact?.persistence)  t[`eco_${ei}_persist`]      = eco.environmentalImpact.persistence;
    if (eco.environmentalImpact?.microplastics) t[`eco_${ei}_micro`]       = eco.environmentalImpact.microplastics;
    if (eco.environmentalImpact?.wildlife)     t[`eco_${ei}_wildlife`]     = eco.environmentalImpact.wildlife;
    if (eco.environmentalImpact?.soilWater)    t[`eco_${ei}_soilwater`]    = eco.environmentalImpact.soilWater;
    if (eco.environmentalImpact?.landfill)     t[`eco_${ei}_landfill`]     = eco.environmentalImpact.landfill;
    if (eco.environmentalImpact?.recyclingBenefits) t[`eco_${ei}_recbene`] = eco.environmentalImpact.recyclingBenefits;
  });
  limitations.forEach((l, i) => { t[`lim_${i}`] = l; });
  suggestions.forEach((s, i) => { t[`sug_${i}`] = s; });
  return t;
}

function applyTranslations(report, tr) {
  if (!tr) return report;
  const r = JSON.parse(JSON.stringify(report)); // deep clone
  const { composition, disposal, ecoImpact = [], limitations = [], suggestions = [] } = r;
  if (tr.comp_summary && composition)  composition.summary = tr.comp_summary;
  composition?.layers?.forEach((l, i) => { if (tr[`layer_${i}_role`]) l.role = tr[`layer_${i}_role`]; });
  if (disposal) {
    if (tr.disp_headline) disposal.headline = tr.disp_headline;
    if (tr.disp_notice)   disposal.notice   = tr.disp_notice;
    disposal.steps?.forEach((_, i) => { if (tr[`disp_step_${i}`]) disposal.steps[i] = tr[`disp_step_${i}`]; });
    disposal.components?.forEach((c, i) => {
      if (tr[`dc_action_${i}`]) c.action = tr[`dc_action_${i}`];
      if (tr[`dc_note_${i}`])   c.note   = tr[`dc_note_${i}`];
    });
  }
  ecoImpact.forEach((eco, ei) => {
    if (tr[`eco_${ei}_bio_notes`]  && eco.biodegradability)   eco.biodegradability.notes   = tr[`eco_${ei}_bio_notes`];
    if (tr[`eco_${ei}_rec_notes`]  && eco.recyclability)      eco.recyclability.notes      = tr[`eco_${ei}_rec_notes`];
    if (tr[`eco_${ei}_decomp_desc`] && eco.decomposition)     eco.decomposition.description = tr[`eco_${ei}_decomp_desc`];
    if (eco.environmentalImpact) {
      if (tr[`eco_${ei}_persist`])  eco.environmentalImpact.persistence      = tr[`eco_${ei}_persist`];
      if (tr[`eco_${ei}_micro`])    eco.environmentalImpact.microplastics     = tr[`eco_${ei}_micro`];
      if (tr[`eco_${ei}_wildlife`]) eco.environmentalImpact.wildlife          = tr[`eco_${ei}_wildlife`];
      if (tr[`eco_${ei}_soilwater`])eco.environmentalImpact.soilWater         = tr[`eco_${ei}_soilwater`];
      if (tr[`eco_${ei}_landfill`]) eco.environmentalImpact.landfill          = tr[`eco_${ei}_landfill`];
      if (tr[`eco_${ei}_recbene`])  eco.environmentalImpact.recyclingBenefits = tr[`eco_${ei}_recbene`];
    }
  });
  limitations.forEach((_, i) => { if (tr[`lim_${i}`]) r.limitations[i] = tr[`lim_${i}`]; });
  suggestions.forEach((_, i) => { if (tr[`sug_${i}`]) r.suggestions[i] = tr[`sug_${i}`]; });
  return r;
}

/* ══════════════════════════════════════════════════════════ */

export default function Results() {
  const { id } = useParams();
  const [report, setReport]         = useState(null);
  const [error, setError]           = useState('');
  const [lang, setLang]             = useState('en');
  const [translating, setTranslating] = useState(false);
  const [translated, setTranslated] = useState(null); // translated overlay
  const cache = useRef({});           // cache[langCode] = translated texts

  useEffect(() => {
    api.analysis.get(id).then((r) => { setReport(r); setTranslated(null); setLang('en'); cache.current = {}; }).catch((e) => setError(e.message));
  }, [id]);

  const handleLangChange = useCallback(async (code) => {
    setLang(code);
    if (code === 'en') { setTranslated(null); return; }
    if (cache.current[code]) { setTranslated(cache.current[code]); return; }
    setTranslating(true);
    try {
      const texts = extractTexts(report);
      const tr = await api.translate.translate(code, texts);
      cache.current[code] = tr;
      setTranslated(tr);
    } catch (e) {
      console.error('Translation failed', e);
    } finally {
      setTranslating(false);
    }
  }, [report]);

  if (error) return <div className="container-page py-16"><Alert type="error">{error}</Alert><Link to="/history" className="btn-secondary mt-4 inline-flex"><ArrowLeft size={16} /> Back</Link></div>;
  if (!report) return <PageLoader label="Loading report…" />;

  const display = lang === 'en' ? report : applyTranslations(report, translated);
  const { objectName, status, composition, confidence, ecoImpact = [], disposal, limitations = [], suggestions = [], evidenceMeta, evidence, model } = display;
  const inconcl = status === 'inconclusive';
  const DispIcon = DISPOSAL_ICON[disposal?.primaryAction] || AlertTriangle;

  return (
    <div className="container-page max-w-4xl py-10">
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <Link to="/history" className="btn-ghost inline-flex text-sm" id="results-back">
          <ArrowLeft size={16} /> Back to history
        </Link>
        <LanguageSelector lang={lang} onLangChange={handleLangChange} loading={translating} />
      </div>

      {/* HEADER */}
      <div className="card card-pad mb-6 flex flex-wrap gap-4">
        {evidenceMeta?.image?.thumbnail && (
          <img src={evidenceMeta.image.thumbnail} alt="object" className="h-24 w-24 shrink-0 rounded-xl object-cover shadow-card" />
        )}
        <div className="flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="eyebrow">Analysis report</p>
              <h1 className="mt-0.5 text-2xl font-bold">{objectName}</h1>
              <p className="text-sm text-ink-400">{formatDateTime(report.createdAt)}</p>
            </div>
            <ConfidenceBadge level={confidence?.level} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {evidenceMeta?.modalities?.map((m) => (
              <span key={m} className="chip bg-ink-100 text-ink-600 capitalize text-[11px]">
                {{ image: <Image size={11} />, audio: <AudioWaveform size={11} />, label: <Image size={11} />, text: <ScanText size={11} />, sensors: <Thermometer size={11} /> }[m] || null} {m}
              </span>
            ))}
          </div>
        </div>
      </div>

      {translating && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-brand-100 bg-brand-50 px-4 py-2.5 text-sm text-brand-700">
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          Translating report…
        </div>
      )}

      {inconcl && (
        <Alert type="warning" title="Inconclusive result" className="mb-6">
          The available evidence was not sufficient to identify the material with reasonable confidence. {suggestions.length > 0 && <><br /><strong>What would help:</strong> {suggestions.join('; ')}</>}
        </Alert>
      )}

      <div className="space-y-6">
        {/* COMPOSITION */}
        <Section icon={Layers} title="Material composition">
          <div className="flex flex-wrap items-start gap-4">
            <CategoryIcon category={composition?.primaryCategory} size={22} className="mt-0.5" />
            <div className="flex-1">
              <p className="text-xl font-bold">{composition?.primaryMaterialName}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <CategoryChip category={composition?.primaryCategory} />
                {composition?.structure && <span className="chip bg-ink-100 text-ink-700">{composition.structure}</span>}
              </div>
              {composition?.summary && <p className="mt-3 text-sm text-ink-600">{composition.summary}</p>}
            </div>
          </div>

          {composition?.layers?.length > 0 && (
            <div className="mt-5">
              <p className="mb-3 text-sm font-bold flex items-center gap-2"><Layers size={15} className="text-brand-600" /> Layer breakdown</p>
              <div className="space-y-3">
                {composition.layers.map((l, i) => <LayerRow key={i} layer={l} />)}
              </div>
            </div>
          )}

          {/* CONFIDENCE REASONING */}
          <div className="mt-5 rounded-xl bg-ink-50 p-4 border border-ink-100">
            <div className="flex items-center gap-2 mb-2">
              <ConfidenceBadge level={confidence?.level} />
              <span className="text-sm font-semibold">confidence</span>
            </div>
            {confidence?.reasons?.map((r, i) => (
              <p key={i} className="text-sm text-ink-600 flex items-start gap-2 mt-1"><span className="text-ink-300 shrink-0 mt-0.5">·</span>{r}</p>
            ))}
          </div>
        </Section>

        {/* EVIDENCE */}
        {evidence && (
          <Section icon={ScanText} title="Evidence breakdown">
            <div className="space-y-4">
              {evidence.image?.analysed && (
                <div>
                  <p className="text-sm font-semibold flex items-center gap-2"><Image size={15} className="text-brand-600" /> Image analysis</p>
                  <p className="mt-1 text-xs text-ink-500">{evidence.image.description}</p>
                  {evidence.image.recyclingSymbols?.length > 0 && (
                    <p className="mt-1 text-xs text-ink-700">Recycling symbols detected: {evidence.image.recyclingSymbols.map((s) => s.readable ? s.code || s.symbol : '(unreadable)').join(', ')}</p>
                  )}
                  {evidence.image.ocrText && <p className="mt-1 font-mono text-[11px] bg-ink-100 rounded-lg p-2 text-ink-600">OCR: {evidence.image.ocrText}</p>}
                  {evidence.image.limitations?.length > 0 && <p className="mt-1 text-xs italic text-amber-700">⚠ {evidence.image.limitations.join(' · ')}</p>}
                </div>
              )}
              {evidence.label?.analysed && (
                <div className="border-t border-ink-100 pt-4">
                  <p className="text-sm font-semibold flex items-center gap-2"><ScanText size={15} className="text-brand-600" /> Label OCR</p>
                  {evidence.label.ocrText && <p className="mt-1 font-mono text-[11px] bg-ink-100 rounded-lg p-2 text-ink-600">{evidence.label.ocrText}</p>}
                  {evidence.label.materialStatements?.length > 0 && (
                    <ul className="mt-1 text-xs text-ink-700 space-y-0.5">{evidence.label.materialStatements.map((s, i) => <li key={i}>· {s}</li>)}</ul>
                  )}
                </div>
              )}
              {evidence.text?.analysed && (
                <div className="border-t border-ink-100 pt-4">
                  <p className="text-sm font-semibold flex items-center gap-2"><ScanText size={15} className="text-brand-600" /> Packaging text</p>
                  <p className="text-xs text-ink-500 mt-1">{evidence.text.note}</p>
                  {evidence.text.detections?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {evidence.text.detections.map((d, i) => <span key={i} className="chip bg-teal-100 text-teal-700 text-[11px]">"{d.matched}" → {d.materialKey}</span>)}
                    </div>
                  )}
                </div>
              )}
              {evidence.audio?.analysed && (
                <div className="border-t border-ink-100 pt-4">
                  <p className="text-sm font-semibold flex items-center gap-2"><AudioWaveform size={15} className="text-brand-600" /> Audio analysis</p>
                  <p className="text-xs text-ink-500 mt-1">{evidence.audio.ai?.description}</p>
                  {evidence.audio.signalAnalysis?.cues?.length > 0 && (
                    <ul className="mt-1 text-xs text-ink-700 space-y-0.5">{evidence.audio.signalAnalysis.cues.map((c, i) => <li key={i}>· {c}</li>)}</ul>
                  )}
                  {evidence.audio.ai?.limitations?.length > 0 && <p className="mt-1 text-xs italic text-amber-700">⚠ {evidence.audio.ai.limitations.join(' · ')}</p>}
                </div>
              )}
              {evidence.sensors?.analysed && (
                <div className="border-t border-ink-100 pt-4">
                  <p className="text-sm font-semibold flex items-center gap-2"><Thermometer size={15} className="text-brand-600" /> Sensor observations</p>
                  <div className="mt-2 space-y-1">
                    {evidence.sensors.observations?.map((o, i) => (
                      <div key={i} className="rounded-lg bg-ink-50 px-3 py-2 text-xs">
                        <span className="font-medium">{o.reading}: {o.value}</span>
                        <p className="text-ink-500 mt-0.5">{o.interpretation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* ECO IMPACT */}
        {ecoImpact?.length > 0 && (
          <Section icon={Leaf} title="EcoImpact Intelligence">
            <Alert type="info" className="mb-4">Environmental information is from a curated database of government and peer-reviewed sources. AI identification and verified knowledge records are kept separate.</Alert>
            <div className="space-y-4">{ecoImpact.map((e, i) => <EcoCard key={i} eco={e} />)}</div>
          </Section>
        )}

        {/* DISPOSAL */}
        {disposal && (
          <Section icon={Recycle} title="Smart disposal recommendation">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-600 text-white shadow-sm"><DispIcon size={22} /></span>
              <div>
                <p className="font-bold text-lg">{disposal.headline}</p>
                <p className="text-sm font-medium text-brand-600 mt-0.5">Primary action: {disposal.primaryAction}</p>
              </div>
            </div>
            {disposal.steps?.length > 0 && (
              <ol className="mt-4 space-y-2">
                {disposal.steps.map((s, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            )}
            {disposal.components?.length > 0 && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {disposal.components.map((c, i) => (
                  <div key={i} className="rounded-xl border border-ink-100 bg-ink-50 p-3">
                    <p className="text-xs font-semibold">{c.component} · {c.status}</p>
                    <p className="text-sm font-medium mt-0.5">{c.material}</p>
                    {c.action && <span className="chip mt-1 bg-brand-100 text-brand-700 text-[10px]">{c.action}</span>}
                    {c.note && <p className="mt-1 text-xs italic text-ink-500">{c.note}</p>}
                    {c.steps && <ul className="mt-1 space-y-0.5 text-xs text-ink-600">{c.steps.map((s, j) => <li key={j}>· {s}</li>)}</ul>}
                  </div>
                ))}
              </div>
            )}
            {disposal.notice && <p className="mt-4 text-xs italic text-ink-400"><AlertTriangle size={12} className="inline mr-1" />{disposal.notice}</p>}
          </Section>
        )}

        {/* LIMITATIONS */}
        {limitations?.length > 0 && (
          <Section icon={AlertTriangle} title="Limitations & uncertainty">
            <ul className="space-y-2">
              {limitations.map((l, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-ink-600">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-500" />{l}
                </li>
              ))}
            </ul>
            {suggestions?.length > 0 && (
              <div className="mt-4 rounded-xl bg-teal-50 border border-teal-100 p-4">
                <p className="text-sm font-semibold text-teal-800">What would improve certainty:</p>
                <ul className="mt-1 space-y-1">
                  {suggestions.map((s, i) => <li key={i} className="text-sm text-teal-700 flex gap-1.5"><span>→</span>{s}</li>)}
                </ul>
              </div>
            )}
          </Section>
        )}

        {model && <p className="text-xs text-center text-ink-300">Analysed with {model} · MaterialTruth AI</p>}
      </div>
    </div>
  );
}
