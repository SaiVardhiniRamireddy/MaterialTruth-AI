import { AudioWaveform, Camera, CheckCircle2, Layers, Leaf, Link as LinkIcon, ScanText, ShieldCheck, Thermometer } from 'lucide-react';

const TECH = [
  ['React 18 + Vite', 'Frontend SPA with React Router and Tailwind CSS.'],
  ['Node.js + Express', 'REST API with JWT auth, Zod validation, Multer uploads.'],
  ['MongoDB + Mongoose', 'Document database for users, analyses and material knowledge.'],
  ['Google Gemini', 'Multimodal AI: image vision, label OCR and native audio listening.'],
  ['Web Audio API', 'Browser-side FFT, spectral centroid, decay-time extraction.'],
];

const PRINCIPLES = [
  [CheckCircle2, 'Confirmed vs. suspected', 'Layers are only "Confirmed" when a literal label or code provides direct evidence. All inferred layers are marked "Suspected".'],
  [ShieldCheck, 'AI vs. verified knowledge', 'Material identification is an AI estimate. Environmental data (decomposition, recyclability, sources) comes from a curated database of government and peer-reviewed sources — never from AI generation.'],
  [Layers, 'Explicit uncertainty', 'The system returns Inconclusive results when evidence is insufficient, instead of guessing. Confidence levels are governed by deterministic rules, not just the model\'s self-reported score.'],
  [Leaf, 'Scientific honesty', 'Decomposition timeframes are presented as "commonly cited estimates" with explicit caveats. Timeframes are null and shown as "unavailable" when no reliable range exists.'],
];

const MODALITIES = [
  [Camera, 'Image', 'Visual characteristics, textures, transparency, layer cues, recycling symbols and OCR.'],
  [ScanText, 'Label OCR', 'Deterministic regex detects resin codes (PET, HDPE, ALU, PAP…) and composition phrases before sending to the AI.'],
  [AudioWaveform, 'Audio', 'Browser-side FFT + Gemini native audio. Reports consistency with material families, never certainty.'],
  [Thermometer, 'Sensors', 'Weight + volume → density check; magnet test; temperature context. All validated with strict range checks.'],
];

export default function About() {
  return (
    <div className="container-page max-w-3xl py-14">
      <p className="eyebrow">About the project</p>
      <h1 className="mt-2 text-4xl font-bold leading-tight">Understanding MaterialTruth AI</h1>

      <section className="mt-10">
        <h2 className="text-2xl font-bold">Problem statement</h2>
        <p className="mt-3 text-ink-600">People frequently dispose of products without knowing their actual material composition. Packaging that looks identical can contain very different materials: a paper-looking cup may be plastic-lined; a shiny snack wrapper may bond polypropylene and metallised film. Incorrect waste sorting leads to recycling contamination, landfill and environmental pollution.</p>
        <p className="mt-3 text-ink-600">Identifying materials from appearance alone is difficult. A single sense — sight — is rarely sufficient. MaterialTruth AI combines multiple types of evidence to provide more informative, and more honest, material identification.</p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold">The multimodal approach</h2>
        <p className="mt-3 text-ink-600">Each modality is analysed separately, then combined by a reasoning stage. Only the modalities the user actually provides are processed — no modality is fabricated or assumed.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {MODALITIES.map(([Icon, title, text]) => (
            <div key={title} className="card card-pad">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon size={20} /></span>
              <p className="mt-3 font-bold">{title}</p>
              <p className="mt-1 text-sm text-ink-500">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold">Design principles</h2>
        <div className="mt-5 space-y-4">
          {PRINCIPLES.map(([Icon, title, text]) => (
            <div key={title} className="flex gap-4 rounded-2xl border border-ink-200/70 p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon size={20} /></span>
              <div>
                <p className="font-bold">{title}</p>
                <p className="mt-1 text-sm text-ink-500">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold">Technology stack</h2>
        <div className="mt-5 card divide-y divide-ink-100">
          {TECH.map(([name, desc]) => (
            <div key={name} className="flex gap-4 px-5 py-3">
              <p className="w-48 shrink-0 text-sm font-semibold text-ink-700">{name}</p>
              <p className="text-sm text-ink-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-ink-200/70 bg-ink-50 p-6">
        <h2 className="text-xl font-bold">Limitations</h2>
        <ul className="mt-3 space-y-2 text-sm text-ink-600">
          <li className="flex gap-2"><span className="text-amber-500">·</span>Material identity is an AI estimate from consumer-grade inputs; exact chemical composition cannot be determined from photos or sound alone.</li>
          <li className="flex gap-2"><span className="text-amber-500">·</span>Hidden layers in composite packaging are inferred, not directly observed.</li>
          <li className="flex gap-2"><span className="text-amber-500">·</span>Decomposition timeframes in the knowledge base are commonly cited estimates — actual rates depend on many environmental factors.</li>
          <li className="flex gap-2"><span className="text-amber-500">·</span>Disposal guidance is general; always verify with your local authority, as recycling acceptance varies significantly.</li>
        </ul>
      </section>
    </div>
  );
}
