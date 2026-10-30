import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Camera, FileAudio, Image, Info, Mic, MicOff, RefreshCw, Thermometer, Trash2, Upload, X,
} from 'lucide-react';
import { api } from '../services/api.js';
import { Alert, Spinner } from '../components/ui/Feedback.jsx';
import { extractAcousticFeatures, makeThumbnail } from '../utils/media.js';
import { formatBytes } from '../utils/format.js';

const ACCEPT_IMG = 'image/jpeg,image/png,image/webp';
const ACCEPT_AUDIO = 'audio/*';
const MAX_IMG = 8 * 1048576;
const MAX_AUDIO = 10 * 1048576;

function DropZone({ id, accept, maxBytes, label, icon: Icon, helper, file, onFile, onClear }) {
  const ref = useRef();
  const [drag, setDrag] = useState(false);
  const pick = (f) => {
    if (!f) return;
    if (f.size > maxBytes) return alert(`File too large. Limit is ${maxBytes / 1048576} MB.`);
    onFile(f);
  };
  return (
    <div
      className={`relative flex min-h-[140px] flex-col items-center justify-center rounded-2xl border-2 border-dashed transition ${drag ? 'border-brand-400 bg-brand-50' : 'border-ink-200 bg-ink-50 hover:border-brand-300 hover:bg-brand-50/40'}`}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
    >
      {file ? (
        <div className="w-full p-4">
          {file.type?.startsWith('image/') ? (
            <img src={URL.createObjectURL(file)} alt="preview" className="mx-auto max-h-40 rounded-xl object-contain" />
          ) : (
            <div className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-card">
              <FileAudio size={24} className="shrink-0 text-brand-600" />
              <div className="min-w-0"><p className="truncate text-sm font-semibold">{file.name}</p><p className="text-xs text-ink-400">{formatBytes(file.size)}</p></div>
            </div>
          )}
          <button onClick={onClear} className="btn-ghost mt-2 w-full text-xs" id={`clear-${id}`}><X size={14} /> Remove</button>
        </div>
      ) : (
        <button type="button" onClick={() => ref.current.click()} className="flex flex-col items-center gap-2 p-6 text-center" id={`pick-${id}`}>
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-white shadow-card text-brand-600"><Icon size={22} /></span>
          <span className="text-sm font-medium text-ink-700">{label}</span>
          <span className="text-xs text-ink-400">{helper}</span>
        </button>
      )}
      <input ref={ref} type="file" accept={accept} className="sr-only" onChange={(e) => pick(e.target.files[0])} />
    </div>
  );
}

function CameraCapture({ onCapture }) {
  const videoRef = useRef();
  const [active, setActive] = useState(false);
  const [error, setError] = useState('');
  const start = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      videoRef.current.srcObject = stream;
      setActive(true);
    } catch { setError('Camera access denied or unavailable.'); }
  };
  const stop = () => {
    videoRef.current?.srcObject?.getTracks().forEach((t) => t.stop());
    setActive(false);
  };
  const snap = () => {
    const c = document.createElement('canvas');
    c.width = videoRef.current.videoWidth; c.height = videoRef.current.videoHeight;
    c.getContext('2d').drawImage(videoRef.current, 0, 0);
    c.toBlob((blob) => { onCapture(new File([blob], 'capture.jpg', { type: 'image/jpeg' })); stop(); }, 'image/jpeg', 0.9);
  };
  return (
    <div className="rounded-2xl border border-ink-200 p-4">
      <p className="text-sm font-semibold">Camera capture</p>
      {error && <Alert type="warning" className="mt-2 text-xs">{error}</Alert>}
      <video ref={videoRef} autoPlay playsInline muted className={`mt-2 w-full rounded-xl ${active ? '' : 'hidden'}`} />
      <div className="mt-2 flex gap-2">
        {!active ? (
          <button type="button" onClick={start} className="btn-secondary text-xs" id="camera-start"><Camera size={14} /> Open camera</button>
        ) : (
          <>
            <button type="button" onClick={snap} className="btn-primary flex-1 text-xs" id="camera-snap">Capture</button>
            <button type="button" onClick={stop} className="btn-ghost text-xs" id="camera-stop"><X size={14} /> Cancel</button>
          </>
        )}
      </div>
    </div>
  );
}

function AudioRecorder({ onRecording }) {
  const [state, setState] = useState('idle'); // idle | recording | done
  const [seconds, setSeconds] = useState(0);
  const mrRef = useRef(); const timerRef = useRef();
  const chunks = useRef([]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '' });
      mrRef.current = mr; chunks.current = [];
      mr.ondataavailable = (e) => chunks.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunks.current, { type: mr.mimeType || 'audio/webm' });
        const ext = (mr.mimeType || 'audio/webm').split('/')[1]?.split(';')[0] || 'webm';
        onRecording(new File([blob], `recording.${ext}`, { type: blob.type }));
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(timerRef.current); setState('done');
      };
      mr.start(250); setSeconds(0); setState('recording');
      timerRef.current = setInterval(() => setSeconds((s) => { if (s >= 29) { mr.stop(); return 30; } return s + 1; }), 1000);
    } catch { alert('Microphone access denied or unavailable.'); }
  };
  const stop = () => mrRef.current?.stop();

  return (
    <div className="rounded-2xl border border-ink-200 p-4">
      <p className="text-sm font-semibold">Record a tap / handling sound</p>
      <p className="mt-1 text-xs text-ink-400">Safely tap the object and record 1–5 seconds of the resulting sound. Do not burn, heat or damage items.</p>
      <div className="mt-3 flex items-center gap-3">
        {state === 'idle' && <button type="button" onClick={start} className="btn-secondary text-xs" id="record-start"><Mic size={14} /> Start recording</button>}
        {state === 'recording' && (
          <>
            <span className="flex items-center gap-1.5 text-xs text-red-600 font-medium"><span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> {seconds}s</span>
            <button type="button" onClick={stop} className="btn-danger text-xs" id="record-stop"><MicOff size={14} /> Stop</button>
          </>
        )}
        {state === 'done' && <span className="text-xs font-medium text-brand-700">✓ Recording captured — visible in audio section above</span>}
      </div>
    </div>
  );
}

const TAB = ['Image', 'Audio', 'Text & Labels', 'Sensors'];

export default function Analyze() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [image, setImage] = useState(null);
  const [labelImage, setLabelImage] = useState(null);
  const [audio, setAudio] = useState(null);
  const [text, setText] = useState('');
  const [objectHint, setObjectHint] = useState('');
  const [sensors, setSensors] = useState({ weightGrams: '', volumeCm3: '', temperatureC: '', ambientTemperatureC: '', magnetic: 'unknown' });
  const [status, setStatus] = useState('idle'); // idle | processing | done | error
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  const setSensor = (k) => (e) => setSensors((s) => ({ ...s, [k]: e.target.value }));

  const submit = useCallback(async () => {
    if (!image && !labelImage && !audio && !text.trim()) return setError('Please provide at least one input: an image, label photo, audio or packaging text.');
    setError(''); setStatus('processing'); setProgress(0);
    try {
      const fd = new FormData();
      let acousticFeatures = null;
      if (image) {
        fd.append('image', image);
        const thumb = await makeThumbnail(image);
        if (thumb) fd.append('thumbnail', thumb);
      }
      if (labelImage) fd.append('labelImage', labelImage);
      if (audio) {
        fd.append('audio', audio);
        try { acousticFeatures = await extractAcousticFeatures(audio); } catch { /* optional */ }
        if (acousticFeatures) fd.append('acousticFeatures', JSON.stringify(acousticFeatures));
      }
      if (text.trim()) fd.append('text', text.trim());
      if (objectHint.trim()) fd.append('objectHint', objectHint.trim());
      const s = {};
      Object.entries(sensors).forEach(([k, v]) => { if (v !== '' && v !== 'unknown') s[k] = k === 'magnetic' ? v : Number(v); else if (k === 'magnetic' && v !== 'unknown') s[k] = v; });
      if (sensors.magnetic !== 'unknown') s.magnetic = sensors.magnetic;
      if (Object.keys(s).length) fd.append('sensors', JSON.stringify(s));

      const report = await api.analysis.create(fd, (e) => setProgress(Math.round((e.loaded / (e.total || 1)) * 60)));
      navigate(`/results/${report._id}`);
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.');
      setStatus('error');
    }
  }, [image, labelImage, audio, text, objectHint, sensors, navigate]);

  return (
    <div className="container-page max-w-4xl py-10">
      <div className="mb-8">
        <p className="eyebrow">New analysis</p>
        <h1 className="mt-1 text-3xl font-bold">Analyse a material</h1>
        <p className="text-ink-500">Provide any combination of evidence — the more you add, the higher the confidence.</p>
      </div>

      {/* Object hint */}
      <div className="card card-pad mb-6">
        <label htmlFor="object-hint" className="label">Object description (optional)</label>
        <input id="object-hint" type="text" value={objectHint} onChange={(e) => setObjectHint(e.target.value)}
          className="input" placeholder="e.g. crisp packet, glass pasta jar, cotton T-shirt…" maxLength={120} />
        <p className="mt-1 text-xs text-ink-400">Helps the AI context — do not guess the material here, let the evidence speak.</p>
      </div>

      {/* TABS */}
      <div className="flex gap-1 rounded-xl border border-ink-200/70 bg-ink-100/60 p-1">
        {TAB.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} id={`tab-${t.toLowerCase().replace(/\s+/g, '-')}`}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${tab === i ? 'bg-white shadow-sm text-ink-900' : 'text-ink-500 hover:text-ink-900'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-4">
        {tab === 0 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="label">Object photo</p>
                <DropZone id="image" accept={ACCEPT_IMG} maxBytes={MAX_IMG} label="Drop or click to upload" helper="JPEG, PNG, WebP — max 8 MB" icon={Image} file={image} onFile={setImage} onClear={() => setImage(null)} />
              </div>
              <div>
                <p className="label">Label / recycling symbols photo</p>
                <DropZone id="label" accept={ACCEPT_IMG} maxBytes={MAX_IMG} label="Drop or click to upload" helper="Shows recycling code or composition text" icon={Image} file={labelImage} onFile={setLabelImage} onClear={() => setLabelImage(null)} />
              </div>
            </div>
            <CameraCapture onCapture={setImage} />
          </>
        )}

        {tab === 1 && (
          <>
            <div>
              <p className="label">Upload audio file</p>
              <DropZone id="audio" accept={ACCEPT_AUDIO} maxBytes={MAX_AUDIO} label="Drop or click to upload" helper="WAV, MP3, WebM, OGG, M4A — max 10 MB" icon={FileAudio} file={audio} onFile={setAudio} onClear={() => setAudio(null)} />
            </div>
            <AudioRecorder onRecording={setAudio} />
            <Alert type="info">
              <strong>Sound is supporting evidence only.</strong> Tap the item gently (never heat or damage it), record 1–5 seconds. Acoustic analysis cannot identify materials on its own — it narrows down material families.
            </Alert>
          </>
        )}

        {tab === 2 && (
          <>
            <div>
              <label htmlFor="packing-text" className="label">Packaging text / material codes</label>
              <textarea id="packing-text" rows={5} value={text} onChange={(e) => setText(e.target.value)} maxLength={2000}
                className="input font-mono text-xs" placeholder="Paste text from the label, e.g.: 'Made from LDPE (4). Please recycle. Contains: 80% PP outer / 20% metallised BOPP inner.'" />
              <p className="mt-1 text-xs text-ink-400">{text.length}/2000 characters · material codes (PET, HDPE, ALU, PAP…) and recycling symbols are auto-detected</p>
            </div>
            <Alert type="info">Text entered here and OCR of label photos are searched for resin codes and composition terms. Only terms that appear literally are reported — nothing is inferred from context.</Alert>
          </>
        )}

        {tab === 3 && (
          <>
            <div className="card card-pad">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-700"><Thermometer size={16} className="text-brand-600" /> Optional sensor readings</div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="weight" className="label">Weight (g)</label>
                  <input id="weight" type="number" min={0.01} max={50000} step="0.01" value={sensors.weightGrams} onChange={setSensor('weightGrams')} className="input" placeholder="e.g. 18.5" />
                </div>
                <div>
                  <label htmlFor="volume" className="label">Volume / displacement (cm³)</label>
                  <input id="volume" type="number" min={0.01} max={100000} step="0.01" value={sensors.volumeCm3} onChange={setSensor('volumeCm3')} className="input" placeholder="e.g. 20 (fill with water to measure)" />
                  <p className="mt-1 text-xs text-ink-400">Measure the solid material volume only, not the air inside a container.</p>
                </div>
                <div>
                  <label htmlFor="temp" className="label">Surface temperature (°C)</label>
                  <input id="temp" type="number" min={-40} max={150} step="0.1" value={sensors.temperatureC} onChange={setSensor('temperatureC')} className="input" placeholder="e.g. 22.0" />
                </div>
                <div>
                  <label htmlFor="ambient" className="label">Ambient temperature (°C)</label>
                  <input id="ambient" type="number" min={-40} max={60} step="0.1" value={sensors.ambientTemperatureC} onChange={setSensor('ambientTemperatureC')} className="input" placeholder="e.g. 21.0" />
                </div>
                <div>
                  <label htmlFor="magnetic" className="label">Magnet test</label>
                  <select id="magnetic" value={sensors.magnetic} onChange={setSensor('magnetic')} className="input">
                    <option value="unknown">Unknown / not tested</option>
                    <option value="yes">Attracted to magnet (ferrous metal)</option>
                    <option value="no">Not attracted to magnet</option>
                  </select>
                </div>
              </div>
            </div>
            <Alert type="info"><strong>Sensor readings are context only.</strong> Weight + volume → density can narrow down material families. Temperature and weight alone cannot identify a material. A magnet test can confirm or rule out ferrous metal.</Alert>
          </>
        )}
      </div>

      {/* EVIDENCE SUMMARY */}
      <div className="mt-6 rounded-xl border border-ink-200 bg-ink-50 px-4 py-3">
        <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-2">Evidence ready to submit</p>
        <div className="flex flex-wrap gap-2 text-xs">
          {[['Image', image], ['Label photo', labelImage], ['Audio', audio], ['Packaging text', text.trim() || null]].map(([n, v]) =>
            v && <span key={n} className="chip bg-brand-100 text-brand-700">{n} ✓</span>
          )}
          {Object.entries(sensors).some(([k, v]) => k !== 'magnetic' ? v !== '' : v !== 'unknown') && <span className="chip bg-brand-100 text-brand-700">Sensors ✓</span>}
          {!image && !labelImage && !audio && !text.trim() && <span className="text-ink-400 italic">Nothing added yet — add at least one input above.</span>}
        </div>
      </div>

      {error && <Alert type="error" className="mt-4"><AlertTriangle size={16} className="inline" /> {error}</Alert>}

      {status === 'processing' && (
        <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3">
          <div className="flex items-center gap-3 text-sm text-brand-800 font-medium">
            <Spinner className="text-brand-600" /> Analysing — this can take 20–60 seconds…
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-brand-100 overflow-hidden">
            <div className="h-full rounded-full bg-brand-500 transition-all duration-500" style={{ width: `${status === 'processing' ? Math.max(10, progress) : 100}%` }} />
          </div>
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <button onClick={() => { setImage(null); setLabelImage(null); setAudio(null); setText(''); setObjectHint(''); setSensors({ weightGrams: '', volumeCm3: '', temperatureC: '', ambientTemperatureC: '', magnetic: 'unknown' }); setError(''); setStatus('idle'); }}
          className="btn-secondary" id="analyze-clear"><RefreshCw size={16} /> Clear all</button>
        <button onClick={submit} disabled={status === 'processing'} className="btn-primary flex-1 py-3 text-base" id="analyze-submit">
          {status === 'processing' ? <><Spinner /> Analysing…</> : 'Analyse material'}
        </button>
      </div>
    </div>
  );
}
