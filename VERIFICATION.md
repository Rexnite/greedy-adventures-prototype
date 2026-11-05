# Reproducible acceptance checks

## Local Ollama revision — 5 November 2026

The local example environment now selects Ollama with `qwen2.5:3b`; Gemini remains configurable via `AI_PROVIDER=gemini` and a server-only API key. Production build, lint and TypeScript pass; 38 backend tests and 22 desktop/mobile browser tests pass. Provider contracts include grounded passages, history, offline/empty/malformed response handling and media availability during model failure. Browser failure handling is intercepted explicitly, so the suite does not require disabling your working local model.

Run `python scripts/check_live_model.py` for actual inference through the local frontend, including follow-up and missing-policy checks. This uses the currently configured provider and is separate from deterministic contract tests. CPU inference can be slow; the chat route allows a bounded wait. Vercel deployment is now authorized and complete; the invitation reply remains the owner's action.

## Vercel and visitor-key revision — 5 November 2026

Public production URL: https://greedy-adventures-puce.vercel.app . Next.js and FastAPI deployed as one Vercel Services project. Unauthenticated checks returned HTTP 200 for the page, knowledge page, health endpoint, source endpoint and real PDF. Inspector selected the actual brochure and film; chat returned both formats. Missing keys prompted setup; an invalid test key returned a clear Gemini access/quota error without exposing the key. No valid Gemini key was supplied, so successful Gemini inference remains unverified.

40 backend checks pass, including two distinct visitor keys, absence of key persistence between requests, no key in model prompts or inspector, and invalid-key bounds. Desktop/mobile browser checks verify password masking, request-only transmission, clearing and no localStorage/sessionStorage persistence. Local Ollama remains available separately.

24 Playwright/physics checks passed against the public production URL. A subsequent visual check found Vercel Services image-optimizer 404s; direct CDN delivery fixed them. The two largest photos were reduced from about 3.1 MB together to 462 KB, and a regression check now verifies loaded hero/package images. The final production build is checked again after this correction.

Actual Ollama run through the frontend passed: VIP returned personal cameraman/edited film; “And the cheaper one?” correctly returned DELUXE with video/photos; cancellation returned “The cancellation policy is not provided.” Requests took approximately 40, 32 and 29 seconds respectively on this machine. These are genuine local-model responses; Gemini remains contract-tested only.

Verified locally on 1 November 2026. No Gemini or Vercel credentials were supplied.

| Check | Result |
|---|---|
| Python router/retriever/media/model contracts | 33 passed |
| Desktop and mobile Chromium acceptance scenarios | 22 passed |
| TypeScript strict check | Passed |
| ESLint | Passed, no warnings |
| Next.js production build | Passed |
| Axe page and chat, desktop/mobile | Zero WCAG A/AA violations detected |
| Browser console / horizontal overflow | No errors / no overflow |
| Official MP4 | HTTP 206 video/mp4; 46.037-second film played |
| Actual Gemini completion | Not run: key/free-tier authorization required |
| Vercel preview/production | Not deployed: account authorization required |

Manual reviewer checklist:

1. Open the page at desktop and narrow widths. Inspect the hero, package prices, journey, images and FAQ.
2. Click Experience skydiving. Observe the randomly selected ocean/sky/tide sweep, then package heading focus and `#packages` URL. Click rapidly; confirm no overlapping transitions. The previous theme must not repeat.
3. Emulate reduced motion. Confirm immediate package navigation.
4. Open the concierge by keyboard. Request “Got a pamphlet?” and open/download the resulting real demo PDF.
5. Ask “Can I see the jump footage?” Play the official film or open its source link.
6. Ask “Send the brochure and video”, then “Send both”. Both attachments should be returned together.
7. Without a key, ask “How high is the jump?” Confirm the explicit model-unavailable message. Do not mistake media-routing responses for AI completions.
8. With an approved free-tier key, ask “Tell me about VIP”, “Does it include photos?” and “And the cheaper one?” Confirm source-grounded answers and context. Ask about an unlisted age/weight/cancellation policy; the model should acknowledge missing information.
9. Temporarily use an invalid test key. Confirm honest service-unavailable handling, while media requests still work. Never commit the key.
10. Open `/knowledge`, inspect source text and registry, and submit the same question. Compare passage IDs, text and selected media with `/api/chat` trace in browser developer tools. The inspector does not invoke the model.
11. Close chat and film with Escape. Confirm keyboard focus returns to the actual chat/film trigger.

Automated model-success tests verify the real REST integration contract through an intercepted HTTP transport. They are not evidence of an actual Gemini response. Live acceptance of item 8 is still required before assignment submission.


## Visual and motion revision — 2 November 2026

- Replaced the blurred image-scale animation with randomized ocean, sky and deep-tide SVG plane sweeps. Consecutive themes cannot repeat.
- Destination scrolling takes place while the screen is fully covered; sections render immediately, without opacity gates.
- Six local Chromium runs (desktop/mobile viewport emulation) sampled roughly 16.7 ms median frame intervals, p95 up to 16.8 ms, with no sampled gaps above 33 ms. These are local requestAnimationFrame samples, not a guarantee for physical devices. Reproduce with `node scripts/measure-motion.mjs`.
- Gallery images open a keyboard-accessible lightbox. Package images and names are source links. Header and footer chat triggers replace the overlapping floating launcher.
- Responsive layouts checked at 320, 390, 768, 1024, 1440 and 1920 pixels without horizontal overflow.


## Immersive POV upgrade — 2 November 2026

The current primary renderer uses Three.js with original photoreal environment textures and a fixed-step gravity/drag/spring camera model. Browser checks explicitly verify the WebGL renderer and exercise unavailable-WebGL navigation. Physics tests verify acceleration, braking, roll stability and different medium drag. Performance measurements now wait for engine readiness and report the actual renderer and framebuffer dimensions; they do not mislabel the CSS fallback as WebGL. Software renderer quality is capped deliberately; this is a 60 fps target, not a physical-device guarantee.

Final production WebGL check: six desktop/mobile runs covered sky, ocean and tide. Median frame intervals were approximately 16.7 ms; p95 at most 16.8 ms, with no samples over 33.5 ms. The software-renderer framebuffers were capped at 800 pixels on the long edge. The raw measurement report is saved with the verification artifacts. Hardware and physical-device results can differ.

Film handoff regression checks cover a forced sky theme, genuine advancing muted playback, both film triggers, focus restoration and unchanged page fragments. The destination uses a soft opacity blend and the player uses a 700 ms entrance.
