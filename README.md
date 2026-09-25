# VOXORA AI — Multilingual Voice & Text Assistant

> **"Speak. Translate. Create."**  
> *One voice. Every language.*

VOXORA AI is a production-grade, full-stack AI web application for real-time multilingual voice recording, speech-to-text, context-aware translation, text-to-speech, and authorized same-speaker voice preservation.

---

## 🌟 Key Features

1. **Browser Voice Recording**: High-fidelity microphone capture via MediaRecorder API with real-time Web Audio API frequency visualizer, `00:00:00` timer, pause, resume, and instant audio playback.
2. **Audio & Video Upload**: Client and server-side validated uploads (MP3, WAV, M4A, AAC, FLAC, OGG, WebM, MP4). Automatic speech extraction from uploaded video files.
3. **Speech-to-Text & Language Detection**: Automatic language detection with confidence scoring across 30+ global and Indian languages (Tamil, Hindi, Telugu, Malayalam, Kannada, Bengali, Marathi, Gujarati, Punjabi, Urdu, Spanish, French, German, Japanese, and more) plus manual override.
4. **Context-Aware Translation**: Meaning-preserving translation retaining tone, numbers, formatting, and paragraphs without naive word substitutions.
5. **Natural Text-to-Speech (TTS)**: Lifelike speech generation with style presets (*Natural, Professional, Friendly, Narrator, Assistant*) and speed/tempo controls (0.75x to 2.0x).
6. **Authorized Voice Preservation / Same-Speaker Translation**:
   - Ethical, consent-verified voice studio.
   - Requires explicit speaker confirmation:  
     > *"Voice cloning requires permission from the speaker. Only upload or clone a voice that you own or have explicit authorization to use."*
   - Analyzes speaker timbre, pitch, and cadence.
   - Speaks translated sentences preserving original speaker characteristics.
   - All cloned audio outputs feature the safety label: **"AI-generated voice"**.
7. **Studio Audio Player**: Seekable waveform visualizer canvas, play/pause, restart, volume control, playback rate selector, and one-click MP3 download.
8. **Project History & Management**: Full project lifecycle management with search, category filtering (*Voice, Translation, Text, Audio*), renaming, duplication, and cascade deletion.
9. **Authentication & Security**: Google OAuth via Auth.js / NextAuth, instant preview login, path traversal prevention, rate limiting, and GDPR account deletion.

---

## 🏗 Architecture & Tech Stack

```
voxora-ai/
├── src/
│   ├── app/                    # Next.js App Router Pages & API Routes
│   │   ├── page.tsx            # Landing Page with Live Audio Visualizer
│   │   ├── dashboard/          # User Dashboard & Quick Actions
│   │   ├── workspace/          # Unified Studio Workspace (Voice, Text, Upload)
│   │   ├── studio/             # Voice Studio & Consent Profiling
│   │   ├── projects/           # Projects Archive & CRUD
│   │   ├── settings/           # Account, Preferences, Storage & Privacy
│   │   └── api/                # Production REST APIs (Auth, Transcribe, Translate, Speech, Voices, Projects)
│   ├── components/             # Reusable Studio Components
│   │   ├── audio/              # StudioAudioPlayer with Waveform Canvas
│   │   ├── voice/              # VoiceRecorder with Web Audio Analyser
│   │   ├── upload/             # FileUploader for Audio/Video
│   │   ├── text/               # TextEditor with Word/Char Counters
│   │   └── layout/             # Top Navbar with Profile Dropdown
│   ├── lib/
│   │   ├── ai/                 # Clean Provider Abstraction Layer
│   │   │   ├── transcription/  # TranscriptionProvider (Whisper, Groq, Local)
│   │   │   ├── translation/    # TranslationProvider (OpenAI, Neural)
│   │   │   ├── tts/            # TTSProvider (OpenAI, Neural Speech)
│   │   │   └── voice/          # VoiceCloningProvider (ElevenLabs, Timbre Profile)
│   │   ├── storage/            # Secure Object & Disk Storage Provider
│   │   ├── db.ts               # Prisma Client Singleton
│   │   ├── auth.ts             # NextAuth Configuration
│   │   ├── languages.ts        # Language Dictionary & Unicode Script Detector
│   │   ├── rate-limit.ts       # In-Memory Rate Limiting
│   │   └── logger.ts           # Redacting Structured Server Logger
│   └── types/                  # TypeScript Definitions
├── prisma/
│   ├── schema.prisma           # Relational Database Schema (SQLite / PostgreSQL)
│   └── schema.postgresql.prisma# Dedicated PostgreSQL Production Schema
├── public/uploads/             # Secure Audio Asset Repository
└── tests/                      # Automated Verification Test Suite
```

---

## 🚀 Quick Start & Development

### 1. Prerequisites
- **Node.js**: v20.15.0 or later
- **npm**: v10.7.0 or later

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Sync
The project comes pre-configured with zero-dependency SQLite for immediate local execution, while fully supporting PostgreSQL for production:
```bash
npx prisma db push
```

### 4. Run Automated Verification Suite
Run the 16-point end-to-end verification test suite:
```bash
npx tsx tests/e2e-verification.mjs
```

### 5. Launch Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## ⚙️ Environment Variables (`.env`)

Copy `.env.example` to `.env`:

```env
# Database
DATABASE_URL="file:./dev.db" # Or postgresql://user:pass@host:5432/voxora?schema=public

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-32-char-random-secret-key"

# Google OAuth (Optional: If empty, use "Continue as Demo User")
GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# AI Provider Keys (Optional: when provided, system uses premium OpenAI/Groq/ElevenLabs models)
OPENAI_API_KEY=""
GROQ_API_KEY=""
ELEVENLABS_API_KEY=""

# Storage Configuration
STORAGE_PROVIDER="local"
STORAGE_LOCAL_DIR="./public/uploads"

# Demo Mode Indicator
DEMO_MODE="false"
```

---

## 🔒 Security & Privacy Architecture

- **Path Traversal Protection**: Uploaded files receive cryptographically random UUID names; original user filenames are never used as disk paths.
- **Server-Side Validation**: All uploads undergo strict MIME, file size (max 50MB), and extension verification.
- **Data Erasure Compliance**: Deleting a project or account cascades and removes all associated audio files from disk.
- **Speaker Consent Records**: Voice profiles cannot be created without user-verified authorization. Every profile preserves a tamper-proof timestamp record.
- **Rate Limiting**: Integrated sliding-window limiter prevents API abuse.

---

## 📦 Production Deployment

To build and run in production:
```bash
npm run build
npm start
```

For PostgreSQL deployments (e.g. AWS RDS, Supabase, Neon):
1. In `prisma/schema.prisma`, change `provider = "sqlite"` to `provider = "postgresql"`.
2. Set `DATABASE_URL="postgresql://user:password@host:5432/voxora?schema=public"`.
3. Run `npx prisma db push`.
