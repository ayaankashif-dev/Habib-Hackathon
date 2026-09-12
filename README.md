# ScamWatch — Your Digital Guardian Against Scams & Deepfakes

Hackathon MVP for Social Nova Hackathon 2026 ("The Digital Shield"). Full PRD at
[`../SAATHI_PRD.md`](../SAATHI_PRD.md) (original planning doc, kept under its
original filename).

ScamWatch doesn't try to be a perfect deepfake/scam detector. It watches for risk
signals in a message, explains the risk in plain language (never a confidence
score), and — when risk is medium/high — lets the user loop in a trusted human
("Guardian") who sees a minimal evidence card and makes the call.

## One-time setup (required)

Cases (the Victim <-> Guardian relay) persist in **Supabase Postgres** — this
is real, durable storage, not an in-memory demo store. Before the relay will
work, run the migration once:

1. Open the SQL editor for your project:
   https://supabase.com/dashboard/project/nfpwitwhscxawksrkvwj/sql/new
2. Paste the contents of [`supabase/migrations/0001_cases.sql`](supabase/migrations/0001_cases.sql)
   and run it. This creates the `cases` table and its RLS policy.

(This one paste-and-run step can't be scripted from here — creating tables
needs direct SQL-editor/database access, which the app's API keys
intentionally don't have.)

Then copy `.env.example` to `.env.local` and fill in `SUPABASE_URL` /
`SUPABASE_SECRET_KEY` (from your project's API settings) if not already set.

## Running it

```bash
npm install
npm run dev
```

Open http://localhost:3000 (or whichever port Next.js prints, if 3000 is busy).

### Demoing the two-screen relay (the core "wow" moment)

1. On the home screen, tap one of the three example scenarios (or paste your
   own message) and tap **Check this now**.
2. On the verdict screen, tap **Ask my trusted person**.
3. You'll land on a waiting screen with a **guardian link**. Open it in a
   second tab/window (or on your phone) — that's the Guardian's device.
4. On the Guardian screen, tap **STOP IT** or **IT'S SAFE**.
5. The Victim's waiting screen updates instantly (via Server-Sent Events, no
   refresh) with the Guardian's decision. Reload either page any time — the
   case is a real row in Supabase, so state survives refreshes and restarts.

### Free-tier AI (all optional)

The rule-based risk engine and OCR (tesseract.js fallback) work with **zero**
AI keys — see PRD §14.3: the app must never depend on an AI call to be safe.
Setting these adds extra fidelity, all on free tiers (no paid API anywhere):

- `GEMINI_API_KEY` — primary semantic risk-classification pass (Gemini Flash).
  Free at https://aistudio.google.com/apikey.
- `GROQ_API_KEY` — used two ways: (1) fallback for the semantic pass if
  Gemini is unset/unreachable/rate-limited, and (2) transcribing **uploaded**
  voice note files. Free at https://console.groq.com/keys.
- `OCR_API_KEY` — primary OCR provider for screenshot uploads (ocr.space,
  faster than the always-available tesseract.js fallback). Free at
  https://ocr.space/ocrapi.

## Architecture

- **Risk engine** (`lib/riskEngine.ts`): regex-based signal detection (money
  request, urgency, secrecy, impersonation, suspicious link, credential
  request) across English / Urdu script / Roman Urdu — this always runs and
  is the guaranteed fallback. On top of it, an optional semantic pass tries
  Gemini first, then Groq if Gemini is unavailable; either can only **raise**
  risk or improve wording, never lower a rule-confirmed STOP, and any AI
  failure/timeout silently falls back to the rule-based result. Always
  resolves to `SAFE | CHECK | STOP` — never a percentage.
- **Persistence + relay** (`lib/store.ts`, `lib/supabaseAdmin.ts`,
  `app/api/relay/**`): cases live in Supabase Postgres (`cases` table,
  RLS-protected). All writes go through Next.js API routes using the secret
  (service-role) key server-side — no Supabase key is ever exposed to the
  browser. An in-process `EventEmitter` fans state changes out to open SSE
  connections (`/api/relay/[caseId]/stream`) so the Victim's screen updates
  the instant a Guardian decides, without polling.
- **Privacy**: the Guardian never receives the raw message — only a derived
  `guardianEvidenceSummary` built from which signals fired (see
  `buildGuardianSummary`), and only that summary is ever persisted alongside
  the case; the original text/screenshot/audio is never stored at all.
- **i18n** (`lib/i18n.tsx`): English / Urdu / Roman Urdu strings and a
  `useLang()` hook; language choice persists in `localStorage`.
- **OCR** (`app/api/ocr/route.ts`): tries ocr.space first (if `OCR_API_KEY`
  is set), falls back to `tesseract.js` running server-side in Node either
  way — so OCR always works, keyed or not.
- **Voice**: live recording uses the browser's `SpeechRecognition` API
  directly (no upload, no key). `/api/transcribe` is a separate path for
  **uploaded** audio files, using Groq's free Whisper endpoint when
  `GROQ_API_KEY` is set (returns 501 otherwise, and the UI tells the user to
  record instead).
- **Motion** (`framer-motion`): verdict reveal, staggered risk-signal chips,
  page/section entrances, and button press feedback throughout — kept
  subtle and consistent with the low-literacy, high-clarity design goal
  (nothing animates the actual risk verdict's meaning, only its presentation).

## What's mocked / out of scope (matches PRD §6.2 and §9.3)

- No real OS-level SMS/call interception or banking integration.
- One Guardian per case, no escalation policies.
- No end-user auth — a case is reachable by anyone holding its unguessable
  UUID link, consistent with the PRD's non-goal of building enterprise auth
  for the hackathon MVP.
