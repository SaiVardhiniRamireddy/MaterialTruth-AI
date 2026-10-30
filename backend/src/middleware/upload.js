import multer from 'multer';
import { env } from '../config/env.js';
import { ApiError } from '../utils/errors.js';

/**
 * Files are held in memory only (never written to disk) and verified by
 * magic-byte signatures, not by extension or client-supplied MIME type.
 */
const IMAGE_FIELDS = ['image', 'labelImage'];
const AUDIO_FIELDS = ['audio'];

const storage = multer.memoryStorage();

export const analysisUpload = multer({
  storage,
  limits: { fileSize: Math.max(env.maxImageBytes, env.maxAudioBytes), files: 3, fields: 10 },
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'labelImage', maxCount: 1 },
  { name: 'audio', maxCount: 1 },
]);

function startsWith(buf, bytes, offset = 0) {
  if (buf.length < offset + bytes.length) return false;
  return bytes.every((b, i) => b === null || buf[offset + i] === b);
}
const ascii = (s) => [...s].map((c) => c.charCodeAt(0));

export function sniffMime(buf) {
  if (startsWith(buf, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  if (startsWith(buf, ascii('RIFF')) && startsWith(buf, ascii('WEBP'), 8)) return 'image/webp';
  if (startsWith(buf, ascii('RIFF')) && startsWith(buf, ascii('WAVE'), 8)) return 'audio/wav';
  if (startsWith(buf, ascii('ID3')) || startsWith(buf, [0xff, 0xfb]) || startsWith(buf, [0xff, 0xf3]) || startsWith(buf, [0xff, 0xf2]))
    return 'audio/mp3';
  if (startsWith(buf, ascii('OggS'))) return 'audio/ogg';
  if (startsWith(buf, ascii('fLaC'))) return 'audio/flac';
  if (startsWith(buf, [0x1a, 0x45, 0xdf, 0xa3])) return 'audio/webm'; // Matroska/WebM (browser recordings)
  if (startsWith(buf, ascii('ftyp'), 4)) {
    const brand = buf.subarray(8, 12).toString('ascii');
    if (['M4A ', 'M4B ', 'mp42', 'isom', 'mp41', 'dash'].includes(brand)) return 'audio/mp4';
    if (['heic', 'heix', 'mif1'].includes(brand)) return 'image/heic';
  }
  if (startsWith(buf, [0xff, 0xf1]) || startsWith(buf, [0xff, 0xf9])) return 'audio/aac';
  return null;
}

const IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic']);
const AUDIO_MIMES = new Set(['audio/wav', 'audio/mp3', 'audio/ogg', 'audio/flac', 'audio/webm', 'audio/mp4', 'audio/aac']);

/** Validates every uploaded file and attaches `detectedMime`. */
export function verifyUploads(req, _res, next) {
  const files = req.files || {};
  try {
    for (const field of IMAGE_FIELDS) {
      const f = files[field]?.[0];
      if (!f) continue;
      if (f.size > env.maxImageBytes) throw new ApiError(400, `${field}: image exceeds ${env.maxImageBytes / 1048576} MB`);
      const mime = sniffMime(f.buffer);
      if (!IMAGE_MIMES.has(mime)) throw new ApiError(400, `${field}: unsupported or corrupted image. Use JPEG, PNG or WebP.`);
      f.detectedMime = mime;
    }
    for (const field of AUDIO_FIELDS) {
      const f = files[field]?.[0];
      if (!f) continue;
      if (f.size > env.maxAudioBytes) throw new ApiError(400, `audio exceeds ${env.maxAudioBytes / 1048576} MB`);
      const mime = sniffMime(f.buffer);
      if (!AUDIO_MIMES.has(mime)) throw new ApiError(400, 'audio: unsupported or corrupted file. Use WAV, MP3, OGG, WebM, M4A or FLAC.');
      f.detectedMime = mime;
    }
    next();
  } catch (e) {
    next(e);
  }
}
