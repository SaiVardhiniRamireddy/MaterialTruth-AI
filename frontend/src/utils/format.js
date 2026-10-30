export const formatDate = (d) =>
  new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

export const formatDateTime = (d) =>
  new Date(d).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const formatBytes = (b) => (b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1048576).toFixed(1)} MB`);

export function formatTimeframe(tf) {
  if (!tf || (tf.min == null && tf.max == null)) return null;
  if (tf.max == null) return `${tf.min}+ ${tf.unit}`;
  return `${tf.min}–${tf.max} ${tf.unit}`;
}

/** Converts a timeframe to days for relative visual scaling (log scale on the UI). */
export function timeframeDays(tf) {
  if (!tf || tf.min == null) return null;
  const mult = { days: 1, months: 30, years: 365 }[tf.unit] || 1;
  return { min: tf.min * mult, max: (tf.max ?? tf.min * 1.5) * mult, open: tf.max == null };
}

export const MODALITY_LABEL = { image: 'Image', label: 'Label photo', audio: 'Audio', text: 'Text', sensors: 'Sensors' };
