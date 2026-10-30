# MaterialTruth AI

**Multimodal Material Identification & EcoImpact Intelligence Platform**

Identifies everyday object materials using images, sound, packaging text and sensor readings, then explains environmental impact and provides sourced disposal guidance.

---

## Quick start (development)

### Prerequisites
- Node.js 18 or later
- A Google Gemini API key (get one free at https://aistudio.google.com/)
- **No separate MongoDB install required** — the backend starts an embedded database automatically

### 1 · Add your Gemini API key

Edit `backend/.env` and replace `your-gemini-api-key` with your real key:

```
GEMINI_API_KEY=AIza...
```

### 2 · Install dependencies (once)

```powershell
# from the project root:
npm --prefix backend install
npm --prefix frontend install
```

### 3 · Start the backend (Terminal 1)

```powershell
cd backend
npm run dev
```

You should see:
```
[db] Embedded MongoDB URI: mongodb://127.0.0.1:xxxxx/...
[db] Connected to MongoDB
[seed] materials upserted=19 modified=0
[server] MaterialTruth API listening on http://localhost:5000
```

The first run downloads the MongoDB binary (~100 MB). Subsequent starts are instant.

### 4 · Start the frontend (Terminal 2)

```powershell
cd frontend
npm run dev
```

Open http://localhost:5173

---

## Project structure

```
MaterialTruth AI project/
├── backend/
│   ├── src/
│   │   ├── config/        env.js, db.js
│   │   ├── models/        User, Material, Analysis
│   │   ├── middleware/    auth, upload, errorHandler
│   │   ├── routes/        auth, analysis, materials, dashboard
│   │   ├── services/
│   │   │   ├── ai/        geminiClient, schemas, fusionService
│   │   │   ├── processing/ imageService, audioService, textService, sensorService
│   │   │   ├── analysisService.js    (pipeline orchestrator)
│   │   │   ├── confidenceEngine.js
│   │   │   ├── ecoImpactService.js
│   │   │   └── disposalService.js
│   │   └── data/          materials.js (verified knowledge base)
│   └── .env               ← add GEMINI_API_KEY here
└── frontend/
    └── src/
        ├── pages/         Landing, Login, Register, Dashboard, Analyze, Results, History, Knowledge, About
        ├── components/    layout/ + ui/
        ├── context/       AuthContext
        ├── services/      api.js (Axios client)
        └── utils/         media.js (DSP), format.js
```

---

## API endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | — | Server + DB + AI status |
| POST | `/api/auth/register` | — | Register |
| POST | `/api/auth/login` | — | Login |
| GET | `/api/auth/me` | ✓ | Current user |
| POST | `/api/analysis` | ✓ | Run multimodal analysis (multipart) |
| GET | `/api/analysis` | ✓ | List user's analyses |
| GET | `/api/analysis/:id` | ✓ | Get report |
| DELETE | `/api/analysis/:id` | ✓ | Delete report |
| GET | `/api/materials` | — | Material knowledge library |
| GET | `/api/materials/:id` | — | Single material (by id or key) |
| GET | `/api/dashboard/stats` | ✓ | Dashboard aggregations |

### POST /api/analysis — multipart fields

| Field | Type | Notes |
|-------|------|-------|
| `image` | file | Object photo (JPEG/PNG/WebP, max 8 MB) |
| `labelImage` | file | Label/symbol photo |
| `audio` | file | Tap recording (WAV/MP3/WebM/M4A, max 10 MB) |
| `acousticFeatures` | JSON string | Optional DSP data computed in browser |
| `text` | string | Packaging text, max 2000 chars |
| `objectHint` | string | Object description hint, max 120 chars |
| `sensors` | JSON string | `{weightGrams?, volumeCm3?, temperatureC?, ambientTemperatureC?, magnetic?}` |
| `thumbnail` | string | Base64 JPEG thumbnail (max 250 kB) |

At least one of `image`, `labelImage`, `audio` or `text` is required.

---

## Environment variables (backend/.env)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 5000 | API port |
| `MONGODB_URI` | local | Tries local first, falls back to embedded |
| `JWT_SECRET` | generated | Change in production |
| `GEMINI_API_KEY` | — | **Required for analysis** |
| `GEMINI_MODEL` | gemini-2.5-flash | Any Gemini model with multimodal support |
| `MAX_IMAGE_MB` | 8 | Image upload limit |
| `MAX_AUDIO_MB` | 10 | Audio upload limit |

---

## Using a real MongoDB (optional)

Set `MONGODB_URI` in `backend/.env` to any MongoDB 6+ connection string, including MongoDB Atlas:

```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/materialtruth
```

The embedded server is then skipped automatically.

---

## Honest AI design

- Material **identification** is AI-generated and always framed as an estimate.
- Environmental data (decomposition, recyclability, sources) comes from a **curated knowledge database** of EPA, NOAA and peer-reviewed records — never from AI.
- Hidden/bonded layers are always marked **Suspected**, never Confirmed.
- Decomposition timeframes have explicit scientific caveats; missing timeframes are shown as "unavailable".
- The confidence engine uses **deterministic rules** capped by the AI's self-assessment.
- API failures return real errors — the app never shows fake AI results.
