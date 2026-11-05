# Assignment audit — 5 November 2026

The supplied PDF is the acceptance brief. The owner authorized Vercel deployment on 5 November 2026 and chose visitor-supplied Gemini keys for hosted inference, with Ollama used in their recorded local demo.

| Requirement | Implementation / status |
|---|---|
| Next.js and TypeScript experience page; redesigned hero/packages | Implemented with responsive layout, keyboard controls and reduced-motion navigation. |
| assistant-ui connected to working AI | Actual assistant-ui runtime, FastAPI backend; local Ollama added alongside Gemini API. |
| Grounded text, source links and follow-ups | Shared retrieval and bounded conversation context passed to either provider; source citations supplied by backend. |
| PDF, video and both | Deterministic media registry, real demo PDF with open/download controls, official video and viewing link. |
| Missing information/files, loading and errors | Grounding instruction, explicit unavailable-file and provider-failure responses, chat running state. |
| Read-only backend knowledge view | `/knowledge`: title, URL, capture date, actual source text, assets, and same router/retrieval used by chat. |
| Actual source context for test questions | `/api/inspect` returns real retrieved passages and selected assets without making a model call; `/api/chat` trace uses identical passages. |
| Secrets, input validation and safe rendering | Server-only provider configuration, Pydantic bounds, text rendering, no private conversations in public inspector. |
| Separation and prototype scope | Separate UI, retrieval, model, intent and media modules. No bookings, payments, auth or database. |
| README, sources, flow, limitations, AI assistance | Included in README and verification notes. |
| Repeatable checks | Backend contracts/failures/media, browser acceptance, and opt-in real-provider script. |
| Reviewer-accessible source | Public GitHub repository: https://github.com/Rexnite/greedy-adventures-prototype |
| Vercel demo link | Live: https://greedy-adventures-puce.vercel.app — Next.js and FastAPI deployed together. |
| Reply to invitation | Pending; no email sent or assignment submitted. |

## Local AI

Use `.env.example` as the configuration reference. `AI_PROVIDER=ollama` uses the installed `qwen2.5:3b`; `AI_PROVIDER=gemini` retains the API path with server-only `GEMINI_API_KEY` and `GEMINI_MODEL`. Neither route silently falls back to a paid service. The same system instruction, exact retrieved passages and recent history are supplied to both models. Local model output is real inference, not mock mode.

The native Ollama request follows https://docs.ollama.com/api/chat . CPU-only inference is selected by default because partial GPU offload was unusually slow on this machine; `OLLAMA_NUM_GPU` can override it. Chat has a dedicated server route with a bounded wait to accommodate local cold starts.

Run `python scripts/check_live_model.py` with both servers running for real answers, a cheaper-package follow-up and an unavailable-policy question. This is opt-in: selecting a hosted API may consume requests. Read the printed answers to assess factual quality, beyond the transport assertions.

Verified locally: all three real Ollama questions passed after switching to native conversation turns. The cheaper-package follow-up returned DELUXE and the cancellation question explicitly acknowledged absent information. See VERIFICATION.md for timings and test results.

## Hosted reviewer access

The concierge exposes “Use your own Gemini API key.” Keys remain in tab memory, are sent through the app server to Google, and are neither persisted nor placed in model prompts, responses or inspector data. Media and knowledge inspection require no key. This intentionally adds reviewer setup compared with an owner-funded model; successful hosted Gemini completion needs a valid visitor key and has not been tested without one. Missing/invalid key behavior is verified against the public deployment. Local Ollama is verified separately.
