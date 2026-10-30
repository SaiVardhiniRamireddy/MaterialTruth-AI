import { Link } from 'react-router-dom';
import {
  ArrowRight, AudioWaveform, Camera, CheckCircle2, FileSearch, Gauge, Layers, Leaf, Recycle, ScanText, ShieldCheck, Sparkles, Thermometer, TriangleAlert,
} from 'lucide-react';
import hero from '../assets/hero.png';
import { useAuth } from '../context/AuthContext.jsx';

const MODALITIES = [
  { Icon: Camera, title: 'Image', text: 'Texture, transparency, colour, visible layers and recycling symbols.' },
  { Icon: AudioWaveform, title: 'Sound', text: 'Resonance, frequency spread and decay from a safe tap — supporting evidence only.' },
  { Icon: ScanText, title: 'Label text', text: 'OCR of resin codes and composition terms like PET, HDPE, ALU, C/PAP.' },
  { Icon: Thermometer, title: 'Sensors', text: 'Optional weight, volume (density) and magnet tests.' },
];

const FEATURES = [
  { Icon: Layers, title: 'Multilayer detection', text: 'Distinguishes single plastics from paper-plastic and plastic-aluminium laminates, marking each layer as confirmed or suspected.' },
  { Icon: Gauge, title: 'Confidence engine', text: 'High, Medium, Low or Inconclusive — with plain-language reasons. No invented percentages.' },
  { Icon: Leaf, title: 'EcoImpact intelligence', text: 'Decomposition process, qualified timeframes, microplastic risk and landfill impact from a sourced knowledge base.' },
  { Icon: Recycle, title: 'Smart disposal advisor', text: 'Component-level reuse, recycling, composting or specialised-collection guidance.' },
  { Icon: FileSearch, title: 'Evidence breakdown', text: 'See exactly what each modality contributed to the result, and what it could not tell.' },
  { Icon: ShieldCheck, title: 'Honest by design', text: 'Confirmed facts, AI estimates and general guidance are always kept visibly separate.' },
];

const STEPS = [
  ['Capture evidence', 'Photograph the item, record a tap, add label text or readings — any combination.'],
  ['Per-modality extraction', 'Each input is analysed separately: vision, OCR, acoustic DSP and sensor checks.'],
  ['Multimodal reasoning', 'Evidence is fused into a layer-by-layer composition estimate.'],
  ['Confidence & verification', 'Rules cap confidence by evidence; materials map to verified records.'],
  ['EcoImpact & disposal', 'Get decomposition behaviour, impact and disposal guidance — saved to your history.'],
];

export default function Landing() {
  const { user } = useAuth();
  const cta = user ? '/analyze' : '/register';
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-ink-200/60 bg-white">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full bg-brand-100/60 blur-3xl" />
        <div className="container-page relative grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div className="animate-fadeUp">
            <span className="chip bg-brand-50 text-brand-700 ring-1 ring-brand-100"><Sparkles size={13} /> Multimodal AI for material sustainability</span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] sm:text-5xl lg:text-[3.4rem]">
              Know what it’s <span className="text-brand-600">really</span> made of — and where it should go.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-500">
              MaterialTruth AI combines images, tapping sounds, packaging text and sensor readings to estimate an object’s material composition, explain how it
              decomposes, and recommend responsible disposal — with uncertainty made explicit.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={cta} className="btn-primary px-6 py-3 text-base" id="hero-cta">
                Analyse an object <ArrowRight size={18} />
              </Link>
              <Link to="/materials" className="btn-secondary px-6 py-3 text-base" id="hero-library">Explore materials</Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-500">
              {['Image + audio + text + sensors', 'Layer-level results', 'Sourced EcoImpact data'].map((t) => (
                <span key={t} className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-brand-500" /> {t}</span>
              ))}
            </div>
          </div>
          <div className="relative animate-fadeUp [animation-delay:120ms]">
            <div className="overflow-hidden rounded-3xl border border-ink-200/70 shadow-lift">
              <img src={hero} alt="Everyday packaging items — bottle, can, jar, cardboard and wrapper — being analysed" className="aspect-[4/3] w-full object-cover" />
            </div>
            <div className="absolute -bottom-6 left-4 w-64 rounded-2xl border border-ink-200/70 bg-white/95 p-4 shadow-lift backdrop-blur sm:left-[-1.5rem]">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Example result</p>
              <p className="mt-1 font-semibold">Snack wrapper</p>
              <div className="mt-2 space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-ink-500">Outer</span><span className="font-medium">PP film · confirmed</span></div>
                <div className="flex justify-between"><span className="text-ink-500">Inner</span><span className="font-medium">Metallised layer · suspected</span></div>
              </div>
              <span className="chip mt-3 bg-teal-100 text-teal-700">Medium confidence</span>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM / SOLUTION */}
      <section className="container-page py-20">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card card-pad">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-amber-700"><TriangleAlert size={20} /></span>
            <h2 className="mt-4 text-2xl font-bold">The problem</h2>
            <p className="mt-2 text-ink-500">
              Packaging that looks identical can be very different inside. A paper-looking cup may be plastic-lined; a shiny wrapper may bond plastic and
              aluminium. Guesswork leads to recycling contamination, landfill and pollution.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-ink-700">
              {['Single-polymer vs multilayer films look alike', 'Coatings hide inside paper and board', 'Lids, bodies and labels are often different materials'].map((t) => (
                <li key={t} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />{t}</li>
              ))}
            </ul>
          </div>
          <div className="card card-pad">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700"><Sparkles size={20} /></span>
            <h2 className="mt-4 text-2xl font-bold">Our approach</h2>
            <p className="mt-2 text-ink-500">
              No single sense is enough, so MaterialTruth gathers several independent clues and weighs them — and tells you honestly when they are not enough.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {MODALITIES.map(({ Icon, title, text }) => (
                <div key={title} className="rounded-xl bg-ink-50 p-3">
                  <p className="flex items-center gap-2 text-sm font-semibold"><Icon size={16} className="text-brand-600" />{title}</p>
                  <p className="mt-1 text-xs text-ink-500">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-y border-ink-200/60 bg-white py-20">
        <div className="container-page">
          <p className="eyebrow">Features</p>
          <h2 className="mt-2 max-w-2xl text-3xl font-bold">Built for accuracy, honesty and real-world disposal decisions</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ Icon, title, text }) => (
              <div key={title} className="group rounded-2xl border border-ink-200/70 p-6 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white"><Icon size={20} /></span>
                <h3 className="mt-4 font-bold">{title}</h3>
                <p className="mt-1.5 text-sm text-ink-500">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container-page py-20">
        <p className="eyebrow">How it works</p>
        <h2 className="mt-2 text-3xl font-bold">From evidence to responsible disposal</h2>
        <ol className="mt-10 grid gap-4 md:grid-cols-5">
          {STEPS.map(([title, text], i) => (
            <li key={title} className="relative card card-pad">
              <span className="font-display text-3xl font-extrabold text-brand-200">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-2 text-sm font-bold">{title}</h3>
              <p className="mt-1 text-xs text-ink-500">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* SUSTAINABILITY */}
      <section className="container-page pb-4">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-teal-700 p-8 text-white sm:p-12">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h2 className="text-3xl font-bold text-white">Fragmentation is not biodegradation.</h2>
              <p className="mt-3 max-w-2xl text-brand-50/90">
                Plastic that breaks into smaller pieces still persists as microplastics. MaterialTruth explains the actual breakdown process of each material and
                qualifies every timeframe — and says plainly when reliable data does not exist.
              </p>
            </div>
            <div className="flex items-center lg:justify-end">
              <Link to={cta} className="btn bg-white px-6 py-3 text-base text-brand-700 hover:bg-brand-50" id="sustain-cta">
                Start your first analysis <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
