"use client";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import type { ImmersiveEngine } from "@/lib/immersive-renderer";
type Theme = "ocean" | "sky" | "tide";
type TransitionOptions = {
  theme?: Theme;
  onArrive?: () => void;
  onComplete?: () => void;
};
/** Prewarmed WebGL POV journey, with lightweight composited planes as a capability fallback. */
export function useAdventureTransition() {
  const overlay = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<ImmersiveEngine | null>(null);
  const active = useRef<gsap.core.Timeline | null>(null);
  const fallback = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busy = useRef(false);
  const previous = useRef<Theme | null>(null);
  const ready = useRef(false);
  useLayoutEffect(() => {
    ready.current = true;
    const element = overlay.current;
    if (element) element.dataset.ready = "true";
    return () => {
      ready.current = false;
      // Strict Mode replays effects while the node stays mounted. Do not cancel
      // a click replayed during hydration; dispose after a genuine DOM removal.
      queueMicrotask(() => {
        if (element?.isConnected) return;
        busy.current = false;
        active.current?.kill();
        if (fallback.current) clearTimeout(fallback.current);
        if (element) {
          element.style.visibility = "hidden";
          element.style.pointerEvents = "none";
        }
      });
    };
  }, []);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    const element = overlay.current;
    const prepare = async () => {
      if (!canvas.current) return;
      try {
        const { createImmersiveRenderer } =
          await import("@/lib/immersive-renderer");
        if (cancelled || !canvas.current) return;
        const instance = await createImmersiveRenderer(canvas.current);
        if (cancelled) {
          instance.dispose();
          return;
        }
        engine.current = instance;
        if (element) element.dataset.engine = "ready";
      } catch {
        if (element) element.dataset.engine = "fallback";
      }
    };
    const timer = setTimeout(prepare, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      engine.current?.dispose();
      engine.current = null;
    };
  }, []);
  const playAction = useCallback((options: TransitionOptions = {}) => {
    if (!overlay.current || !ready.current) {
      options.onArrive?.();
      options.onComplete?.();
      return;
    }
    if (busy.current) return;
    const scene = overlay.current;
    const layers = scene.querySelectorAll<HTMLElement>(".transition-plane");
    const label = scene.querySelector<HTMLElement>(".transition-label");
    let arrived = false;
    const arrive = () => {
      if (arrived) return;
      arrived = true;
      scene.dataset.stage = "settling";
      if (options.onArrive) {
        options.onArrive();
        return;
      }
      const target = document.getElementById("packages");
      // The destination is moved into place while fully covered, never after the reveal.
      target?.scrollIntoView({ behavior: "instant", block: "start" });
      target?.focus({ preventScroll: true });
      history.replaceState(null, "", "#packages");
    };
    const cleanup = () => {
      if (fallback.current) clearTimeout(fallback.current);
      scene.style.visibility = "hidden";
      scene.style.pointerEvents = "none";
      scene.dataset.active = "false";
      if (label) {
        label.style.opacity = "0";
        label.style.visibility = "hidden";
      }
      layers.forEach((layer) => {
        layer.style.willChange = "auto";
      });
      busy.current = false;
      options.onComplete?.();
    };
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      arrive();
      cleanup();
      return;
    }
    const choices = (["ocean", "sky", "tide"] as Theme[]).filter(
      (theme) => theme !== previous.current,
    );
    const theme =
      options.theme || choices[Math.floor(Math.random() * choices.length)];
    previous.current = theme;
    scene.dataset.theme = theme;
    scene.dataset.stage = "flying";
    if (label)
      label.textContent =
        theme === "sky"
          ? "TAKE THE LEAP."
          : theme === "tide"
            ? "GO BEYOND."
            : "DIVE RIGHT IN.";
    busy.current = true;
    layers.forEach((layer) => {
      layer.style.willChange = "transform";
    });
    scene.style.visibility = "visible";
    scene.style.opacity = "1";
    scene.style.pointerEvents = "auto";
    if (engine.current) {
      scene.dataset.renderer = "webgl";
      scene.dataset.active = "true";
      if (label) {
        label.style.opacity = "0";
        label.style.visibility = "hidden";
      }
      fallback.current = setTimeout(() => {
        engine.current?.stop();
        arrive();
        cleanup();
      }, 2400);
      try {
        engine.current.play(theme, arrive, cleanup);
      } catch {
        engine.current.stop();
        arrive();
        cleanup();
      }
      return;
    }
    scene.dataset.renderer = "fallback";
    // A fresh timeline only animates transform/opacity on already-rasterized SVG planes.
    gsap.set(layers, { yPercent: 115, y: 0, force3D: true });
    gsap.set(label, { autoAlpha: 0 });
    fallback.current = setTimeout(() => {
      active.current?.kill();
      arrive();
      cleanup();
    }, 1800);
    try {
      active.current = gsap
        .timeline({ onComplete: cleanup })
        .to(layers, {
          yPercent: 0,
          duration: 0.54,
          stagger: 0.045,
          ease: "power2.inOut",
          force3D: true,
        })
        .call(arrive)
        .to(label, { autoAlpha: 1, duration: 0.1 }, 0.42)
        .to(label, { autoAlpha: 0, duration: 0.14 }, 0.68)
        .to(
          layers,
          {
            yPercent: -120,
            duration: 0.57,
            stagger: 0.035,
            ease: "power2.inOut",
            force3D: true,
          },
          0.72,
        )
        .to(scene, { opacity: 0, duration: 0.65, ease: "sine.inOut" }, 0.65);
    } catch {
      arrive();
      cleanup();
    }
  }, []);
  const cancelAction = useCallback(() => {
    active.current?.kill();
    engine.current?.stop();
    if (fallback.current) clearTimeout(fallback.current);
    const element = overlay.current;
    if (element) {
      element.style.visibility = "hidden";
      element.style.pointerEvents = "none";
      element.dataset.active = "false";
    }
    busy.current = false;
  }, []);
  const navigate = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (!overlay.current || !ready.current) return; // Preserve native navigation during hydration.
      event.preventDefault();
      playAction();
    },
    [playAction],
  );
  const transition = (
    <div
      className="dive-overlay adventure-transition"
      ref={overlay}
      aria-hidden="true"
      data-theme="ocean"
    >
      <div className="transition-plane transition-back">
        <Wave />
      </div>
      <div className="transition-plane transition-front">
        <Wave />
        <div className="wind-lines">
          <i />
          <i />
          <i />
        </div>
      </div>
      <canvas className="immersive-canvas" ref={canvas} />
      <div className="journey-readout">
        <span className="journey-sky">FREEFALL / 13,000 FT</span>
        <span className="journey-ocean">BELOW THE SURFACE</span>
        <span className="journey-coordinate">GREEDY / POV</span>
      </div>
      <span className="transition-label" />
    </div>
  );
  return { navigate, playAction, cancelAction, transition };
}
function Wave() {
  return (
    <>
      <svg
        className="transition-wave wave-top"
        viewBox="0 0 1440 180"
        preserveAspectRatio="none"
      >
        <path
          className="ocean-curve"
          d="M0 100C240 200 420 -30 760 85S1180 200 1440 45V180H0Z"
        />
        <path
          className="sky-curve"
          d="M0 150C80 40 170 160 280 95C390 -15 470 145 600 65C750 -40 850 150 980 65C1130 -30 1210 110 1440 25V180H0Z"
        />
      </svg>
      <svg
        className="transition-wave wave-bottom"
        viewBox="0 0 1440 180"
        preserveAspectRatio="none"
      >
        <path d="M0 100C240 200 420 -30 760 85S1180 200 1440 45V180H0Z" />
      </svg>
    </>
  );
}
