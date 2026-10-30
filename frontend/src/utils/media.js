/**
 * Browser-side signal processing (Web Audio API). The browser can decode
 * WebM/Opus, MP3, M4A, WAV etc. natively, so acoustic features are computed
 * here and sent to the backend as validated JSON alongside the raw audio.
 */

function fftMag(re) {
  // Iterative radix-2 FFT; input length must be a power of two.
  const n = re.length;
  const im = new Float32Array(n);
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) [re[i], re[j]] = [re[j], re[i]];
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    for (let i = 0; i < n; i += len) {
      for (let k = 0; k < len / 2; k++) {
        const wr = Math.cos(ang * k), wi = Math.sin(ang * k);
        const ur = re[i + k], ui = im[i + k];
        const vr = re[i + k + len / 2] * wr - im[i + k + len / 2] * wi;
        const vi = re[i + k + len / 2] * wi + im[i + k + len / 2] * wr;
        re[i + k] = ur + vr; im[i + k] = ui + vi;
        re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
      }
    }
  }
  const mag = new Float32Array(n / 2);
  for (let i = 0; i < n / 2; i++) mag[i] = Math.hypot(re[i], im[i]);
  return mag;
}

export async function extractAcousticFeatures(blob) {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const ctx = new Ctx();
  try {
    const buf = await ctx.decodeAudioData(await blob.arrayBuffer());
    const sr = buf.sampleRate;
    const data = buf.getChannelData(0);
    const N = data.length;

    let peak = 0, sumSq = 0, zc = 0, peakIdx = 0;
    for (let i = 0; i < N; i++) {
      const a = Math.abs(data[i]);
      if (a > peak) { peak = a; peakIdx = i; }
      sumSq += data[i] * data[i];
      if (i && (data[i] >= 0) !== (data[i - 1] >= 0)) zc++;
    }
    const rms = Math.sqrt(sumSq / Math.max(1, N));

    // Envelope in 5 ms frames for onset count and decay time.
    const frame = Math.max(1, Math.round(sr * 0.005));
    const env = [];
    for (let i = 0; i < N; i += frame) {
      let s = 0;
      for (let j = i; j < Math.min(N, i + frame); j++) s += data[j] * data[j];
      env.push(Math.sqrt(s / frame));
    }
    const envMax = Math.max(...env, 1e-9);
    let onsets = 0;
    for (let i = 2; i < env.length; i++) if (env[i] > envMax * 0.3 && env[i] > env[i - 2] * 2.5) { onsets++; i += 6; }

    // Decay: time from the strongest peak until envelope falls 20 dB (to 10%).
    const peakFrame = Math.floor(peakIdx / frame);
    let decayTimeMs = null;
    for (let i = peakFrame; i < env.length; i++) {
      if (env[i] < env[peakFrame] * 0.1) { decayTimeMs = (i - peakFrame) * 5; break; }
    }

    // Spectrum: 8192-sample window centred after the peak.
    const W = 8192;
    const start = Math.max(0, Math.min(N - W, peakIdx - 256));
    const seg = new Float32Array(W);
    for (let i = 0; i < W && start + i < N; i++) seg[i] = data[start + i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (W - 1)));
    const mag = fftMag(seg);
    const binHz = sr / W;
    let total = 0, weighted = 0, hf = 0, maxMag = 0, maxBin = 0;
    for (let i = 1; i < mag.length; i++) {
      const p = mag[i] * mag[i];
      total += p; weighted += p * i * binHz;
      if (i * binHz > 4000) hf += p;
      if (i * binHz > 60 && mag[i] > maxMag) { maxMag = mag[i]; maxBin = i; }
    }
    const edges = [0, 250, 500, 1000, 2000, 4000, 8000, sr / 2];
    const bands = edges.slice(0, -1).map((lo, k) => {
      let e = 0;
      for (let i = Math.ceil(lo / binHz); i < Math.min(mag.length, edges[k + 1] / binHz); i++) e += mag[i] * mag[i];
      return { label: lo < 1000 ? `${lo}` : `${lo / 1000}k`, energy: total ? +(e / total).toFixed(4) : 0 };
    });

    return {
      durationSec: +buf.duration.toFixed(2),
      sampleRate: sr,
      peakAmplitude: +Math.min(1, peak).toFixed(4),
      rms: +Math.min(1, rms).toFixed(4),
      dominantFrequencyHz: Math.round(maxBin * binHz),
      spectralCentroidHz: total ? Math.round(weighted / total) : 0,
      highFreqRatio: total ? +(hf / total).toFixed(4) : 0,
      decayTimeMs,
      onsetCount: onsets,
      zeroCrossingRate: +(zc / Math.max(1, N)).toFixed(4),
      bands,
    };
  } finally {
    ctx.close();
  }
}

/** Downscaled JPEG thumbnail for report previews (avoids storing full images). */
export function makeThumbnail(file, max = 360) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * s);
      c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.75));
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}
