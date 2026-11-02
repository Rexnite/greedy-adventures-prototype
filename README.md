# Greedy Adventures — Sea View Skydiving

> **WORK IN PROGRESS · PUBLIC SOURCE CHECKPOINT**
> Saved for continued iteration. Source is public; not approved for deployment, a production release or assignment submission.
> No automatic deployment is configured.

A source-grounded hiring-assignment prototype: an editorial skydiving experience, a short randomized GSAP ocean/sky/tide transition, and an assistant-ui concierge backed by Python.

**Status:** local production build and browser checks pass. Live Gemini answers require a valid Gemini API key and approved free-tier access. No live model request or Vercel deployment has been performed. Media requests work without a model key. This is an assignment prototype, not an official Greedy Adventures site.

## Run locally

Requirements: Node 22+, Python 3.11+.

```powershell
npm ci
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend/requirements.txt
Copy-Item .env.example .env.local
node scripts/start-local.mjs
```

Open http://127.0.0.1:3000 and http://127.0.0.1:3000/knowledge. The startup script starts Next.js and Uvicorn, loads `.env.local` for the backend, and disables Next telemetry (avoids a host-specific telemetry file rename issue).

Alternatively, start two terminals from this directory:

```powershell
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --env-file .env.local
```

```powershell
$env:NEXT_TELEMETRY_DISABLED='1'
npm run dev
```

For production locally: `npm run build`, then `npm run start`, with the Python server still running.

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | empty | Server-only Google AI Studio key. Never use a NEXT_PUBLIC key. |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` | Configurable stable model; verify availability for your account. |
| `AI_MODE` | `live` | `live` calls Gemini; `mock` returns visibly labelled source excerpts for local testing only. |
| `BACKEND_URL` | `http://127.0.0.1:8000` | Next.js server-side proxy target. Set this to the hosted Python backend when deploying separately. |

No key means an explicit unavailable response, not a simulated AI answer. Network failures and empty/blocked responses also report unavailability. No paid request was made. Configure a free-tier project before running live tests; the application cannot determine your account's billing tier.

## Stack and structure

Next.js App Router, strict TypeScript, React, Tailwind CSS with custom design tokens, Lucide, GSAP with React lifecycle cleanup, and **actual `@assistant-ui/react` LocalRuntime and primitives**. Three.js supplies the optional immersive POV renderer. FastAPI/Pydantic provide the API. BM25 supplies lightweight lexical retrieval; Gemini is called using its supported REST generateContent endpoint through httpx.

```text
assistant-ui LocalRuntime (bounded in-memory conversation)
  → /api/chat (Next proxy → FastAPI)
    → deterministic Python intent router
      → explicit PDF/video registry for media requests
      → contextual query + BM25 passages + controlled system prompt → Gemini
    → validated response: text + media[] + citations[] + trace
  → assistant-ui message primitives + typed media cards

/knowledge → /api/knowledge (public snapshot + registry)
           → /api/inspect (same router/retrieval, no model call)
```

- `app/page.tsx`: experience sections, FAQ, accessible film dialog and cinematic navigation.
- `components/adventure-transition.tsx`: prewarming, mode selection, fallback and navigation handoff.
- `lib/immersive-renderer.ts`: bounded WebGL renderer, scene resources and GPU warmup.
- `lib/motion-physics.ts`: deterministic fixed-step camera physics.
- `components/concierge.tsx`: model adapter, assistant-ui state/composer/messages, media rendering.
- `backend/intent.py`: normalization, synonyms, regexes, negation and contextual format routing.
- `backend/knowledge.py`: meaningful source sections, stable passage IDs and BM25 ranking.
- `backend/model.py`: server-side Gemini call, bounded context, explicit mock/error modes.
- `backend/media.py`: deterministic multi-asset registry.
- `backend/main.py`: validated API contracts, shared routing used by chat and inspector.
- `backend/data/`: versioned public source snapshot and asset provenance.

Deterministic routing is used for file formats because selecting a known PDF/video should be predictable and independently testable. The language model handles factual explanations and natural follow-ups; keyword matching does not impersonate the model.

Conversation memory stays in the browser's assistant-ui runtime for the current mounted session. Up to 12 prior turns are sent, with the last 10 used in the model prompt. Contextual retrieval resolves the last named package and cheaper comparisons. Nothing is written to a conversation database or public trace endpoint. Refreshing the page clears conversation state.

## Sources and provenance

Primary knowledge and all experience photographs:
https://www.greedyadventures.com/experiences/sea-view-skydiving

Assignment PDF reviewed before implementation:
https://drive.google.com/file/d/1koryFRNQE7MXl9MzsKDyFA_n-l2UxJtN/view

Official film (verified byte-range HTTP 206, video/mp4; played in Chromium):
https://www.greedyadventures.com/greedy/films/sea-view-studio-hero.mp4

The source was captured on **1 November 2026 UTC**; the exact timestamp, title, URL and original extracted text are in `backend/data/source.json`. Five heading-based passages retain stable IDs. Only this page is ingested; there is no crawler and no request-time scraping. Refresh explicitly with `python scripts/refresh_knowledge.py`, review the diff, and restart Python. Asset source URLs are recorded in `backend/data/assets.json`.

The public page names Pattaya and also gives a Rayong address. The FAQ and model system instruction disclose this discrepancy instead of reconciling it. Package prices and inclusions are a captured snapshot, not live availability. Unsupported restrictions, pickup prices and cancellation rules are not invented.

No official brochure was identified on the experience page. `public/media/sea-view-demo-brochure.pdf` is an original one-page, source-backed **DEMO BROCHURE — NOT AN OFFICIAL GREEDY ADVENTURES DOCUMENT**. Open/download controls use this real PDF. Regenerate with `python scripts/create_brochure.py`; review source details and recapture date first.

## Inspector and privacy

Visit `/knowledge` or the footer link. It shows the original public text, capture date, passage IDs, source URL, available media and demo/official labels. A submitted test runs the same `route()` used by chat, displaying actual selected assets, passage IDs, BM25 scores and exact retrieval context. It explicitly shows `model_called: false`: inspecting is not a paid model request. Media requests bypass Gemini. No historical customer conversations, credentials, editing or uploads appear here.

For factual chat, the exact retrieved passages go unchanged into the model payload; a backend test verifies this. The returned per-request chat trace is not stored or globally readable. Source text and user messages are serialized as untrusted data, with a separate system instruction limiting facts to supplied passages. Model output is rendered as text, never as raw HTML. Media and source URLs come from the fixed registry/snapshot rather than model-authored links.

## Motion and accessibility

The primary experience is now an approximately 1.85-second Three.js POV journey. Original photoreal sky and underwater environments are mounted on a perspective scene, with near-field cloud layers, an aircraft doorway, water-surface refraction and depth-sorted bubble particles. A fixed 120 Hz integrator supplies acceleration, linear drag, camera roll and damped lens settling. The browser renders using requestAnimationFrame; React state is not updated per frame. This is a lightweight camera simulation, not a rigid-body world or real recorded dive footage.

The package section appears through a shader-controlled aperture. Its scroll/focus handoff happens before that aperture opens. Three.js, textures and shader programs are loaded and warmed after the initial page render. The transparent framebuffer stays composited so the first click does not pay the surface-allocation cost. Rendering is capped at 1.25 DPR and a 1280-pixel long edge on hardware; software renderers use an 800-pixel cap. Additional quality reduction is available after a slow journey. Rendering stops completely between journeys. If WebGL is unsupported or assets are not ready, the GSAP plane sweeps remain the usable fallback. Reduced-motion users navigate immediately.

All page sections now render visibly on first paint. There are no ScrollTrigger opacity gates that can leave sections blank. Package and gallery images load eagerly to avoid image decoding at the transition handoff. Gallery photos open a native lightbox with previous/next buttons and arrow keys. Header, footer and in-page chat controls open the concierge; a floating launcher no longer overlaps page actions.

The film uses native controls in a native modal dialog, with Escape/close and focus restoration. Chat is a nonmodal accessible region: it focuses its composer when opened, restores the actual trigger when closed, and never traps keyboard focus. It is opened from ordinary page controls rather than a persistent floating launcher. FAQ buttons expose expanded states. Source images have alt text; next/image handles resizing, with below-fold images lazy-loaded.

## Verification

From this directory, start both servers before browser tests:

```powershell
python -m pytest backend/tests -q
npm run typecheck
npm run lint
npm run build
node node_modules/@playwright/test/cli.js install chromium
npm run test:e2e
node scripts/browser-audit.mjs
node scripts/measure-motion.mjs
```

Executed results: **33 Python tests passed; 22 Playwright tests passed** (desktop Chromium and iPhone-sized Chromium), TypeScript passed, ESLint passed without warnings, production build passed. Axe WCAG 2 A/AA + 2.1 AA scans of desktop/mobile page and chat returned zero violations; this does not replace a full manual accessibility audit. Browser console reports had zero errors and no horizontal overflow. Official film playback reached readyState 4 with advancing playback time. See `VERIFICATION.md` for the acceptance checklist and limitations.

The model-payload and model-failure tests use an intercepted HTTP transport, not a live Gemini request. Tests verify intent synonyms, both-media behavior, context, negation, media files, retrieval, trace consistency, input bounds, unavailable model, explicit mock labels and prompt structure.

## Deployment on Vercel

The deliverable preserves the required Next.js + Python stack. It has not been published to Sites hosting, whose Worker runtime does not run this FastAPI backend.

The prepared deployment follows Vercel's current [Python + Next.js Services guide](https://vercel.com/kb/guide/python-backend-on-vercel). Generate a clean deployment workspace:

```powershell
python scripts/prepare_vercel.py
Set-Location work/vercel
vercel deploy
```

Use Vercel CLI 62.1 or newer and an authorized Vercel account. `deployment/vercel.json` declares separate Next.js and FastAPI service roots with a private backend binding. The preparation script copies application source, locked frontend dependencies and public assets into the correct layout; it excludes secrets, caches and installed dependencies. The Python entrypoint remains `backend.main:app`. The `BACKEND_URL` service binding lets the existing same-origin Next proxy reach Python. No database or paid integration is needed.

Set `GEMINI_API_KEY`, `GEMINI_MODEL` and `AI_MODE=live` for the backend environment before validating a preview. Keep the key private and use approved free-tier access. Preview first; check the full acceptance list before promoting to production. **This configuration was prepared and locally packaged, but has not been deployed or verified in a Vercel account.** Vercel account authorization and Gemini credentials were unavailable.

Direct deployment of the repository root uses the simpler frontend-only `vercel.json`; it requires a separately hosted FastAPI origin supplied as `BACKEND_URL`. Use the generated Services package to deploy both together. The Python runtime is set to 3.12 in that package; local tests used Python 3.11.

After deployment, verify health, source loading, media links, chat requests, genuine model answers/follow-ups and model failure handling against the public URL. Update this README with the verified URL. No booking engine, authentication, payments or database are included.

## Integrations, credits and limitations

- Playwright MCP installed as a development dependency and configured in Codex (`codex mcp add playwright -- npx -y @playwright/mcp@latest`). Its MCP browser tool successfully inspected the official page, local experience and knowledge page. Repeatable acceptance tests use the Playwright test runner.
- 21st MCP documentation was reviewed. No API key or account token was available; no paid component or AI credits were used. The UI is original, with no copied component templates.
- Assistant-ui, GSAP, Lucide, Next.js and Tailwind are used under their respective upstream licences. Photography and film are attributed to Greedy Adventures, used as assignment reference material; no ownership is claimed. Confirm rights before any commercial reuse.
- The Sites, PDF and OpenAI Docs skills supported workflow, brochure verification and MCP configuration. This source deliverable remains portable Next.js/FastAPI.
- Anton headline typeface: Google Fonts, bundled locally with its SIL Open Font License in `public/fonts/OFL-Anton.txt`.
- AI coding assistance: Codex implemented and reviewed the prototype and ran the documented checks. No claims of human-authored implementation are made.
- Live Gemini quality, real model follow-ups and Vercel hosting remain unverified without credentials. No public Vercel URL is available.
- Official film is remote and may become unavailable; every video includes a labelled direct viewing link. Source/media status is a captured verification, not a continuous monitor.
- The model can still err despite grounding instructions. Confirm operator policies and exact meeting location directly.
- Browser tests emulate mobile in Chromium; physical devices, Safari and Firefox were not tested.
- Production npm dependency audit: zero known vulnerabilities at verification. Development tooling reports moderate advisories; no forced breaking upgrades were applied.


### Original transition environments

`public/media/pov-sky.webp` and `pov-ocean.webp` are original ImageGen-created photographic-style environments generated for this prototype, not official photographs, live footage or evidence of a scuba offering. They are encoded locally as WebP textures; the two runtime images total approximately 500 KB. They are separate from the official knowledge snapshot and chat-media registry.


### Film handoff and softer landing

Both film triggers force the sky POV before opening the official film. Playback begins muted during the settling phase; the native film dialog and backdrop fade in over 700 ms. Closing restores the actual trigger and cancels any unfinished journey. Package navigation now uses a wider feathered aperture plus a gradual scene-alpha fade, so content blends into view rather than snapping in. Reduced-motion users bypass the journey and decorative entrance.
