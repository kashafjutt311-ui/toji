"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { HERO as HERO_T } from "@/lib/choreography";
import { HERO } from "@/data/copy";
import { useScrollState } from "@/lib/hooks";
import { Monogram } from "@/components/brand/Monogram";

function Word({ text }: { text: string }) {
  return (
    <span className="line" aria-hidden="true">
      {text.split("").map((c, i) => (
        <span key={i} className="hero-letter inline-block will-change-transform">
          {c}
        </span>
      ))}
    </span>
  );
}

/**
 * 01 HERO — giant wordmark on the black void. Load: letters rise from masks.
 * Scroll: wordmark scales 1→1.6 and fades while the CP monogram resolves at centre,
 * then the monogram flies into the nav slot (#nav-logo) and hands over to it.
 */
export function HeroOverlay({ entered }: { entered: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const wordmark = useRef<HTMLHeadingElement>(null);
  const mono = useRef<SVGSVGElement>(null);
  const hints = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);

  // Intro, played as the curtain starts lifting. The letters are NOT hidden beforehand:
  // they paint normally on first render (under the preloader) so that paint is the LCP,
  // and only drop below their masks at the instant the reveal starts — still covered, so
  // the effect on screen is identical.
  useEffect(() => {
    if (!entered) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".hero-letter",
        { yPercent: 110 },
        { yPercent: 0, duration: 0.9, ease: "expo.out", delay: 0.35, stagger: { each: 0.035, from: "start" } },
      );
      gsap.fromTo(
        ".hero-copy",
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 0.9, ease: "expo.out", delay: 0.75, stagger: 0.12 },
      );
      gsap.fromTo(
        hints.current!.children,
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: 0.9, ease: "expo.out", delay: 0.95, stagger: 0.08 },
      );
    }, root);
    return () => ctx.revert();
  }, [entered]);

  // scroll timeline (progress driven by the stage store)
  useEffect(() => {
    const build = () => {
      tl.current?.kill();
      const nav = document.getElementById("nav-logo");
      const m = mono.current!;
      gsap.set(m, { clearProps: "transform" });
      const from = m.getBoundingClientRect();
      const to = nav?.getBoundingClientRect();
      const dx = to ? to.left + to.width / 2 - (from.left + from.width / 2) : 0;
      const dy = to ? to.top + to.height / 2 - (from.top + from.height / 2) : 0;
      const s = to ? to.width / from.width : 0.2;

      const t = gsap.timeline({ paused: true, defaults: { ease: "none" } });
      const [w0, w1] = HERO_T.wordmark;
      const [m0, m1] = HERO_T.monogramIn;
      const [n0, n1] = HERO_T.monogramToNav;
      t.fromTo(wordmark.current, { scale: 1 }, { scale: HERO_T.wordmarkScale, duration: w1 - w0 }, w0)
        .fromTo(wordmark.current, { autoAlpha: 1 }, { autoAlpha: 0, duration: (w1 - w0) * 0.7 }, w0 + (w1 - w0) * 0.3)
        .fromTo(hints.current, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.15 }, 0)
        // heading + description leave first, rising slightly, before the wordmark grows
        .fromTo(copy.current, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -40, duration: 0.25 }, 0)
        .fromTo(m, { autoAlpha: 0, filter: "blur(18px)", scale: 0.92 }, { autoAlpha: 1, filter: "blur(0px)", scale: 1, duration: m1 - m0, ease: "power1.out" }, m0)
        .to(m, { x: dx, y: dy, scale: s, duration: n1 - n0, ease: "power2.inOut" }, n0)
        // hand over to the real nav logo at the very end
        .set(m, { autoAlpha: 0 }, 0.999);
      if (nav) t.set(nav, { autoAlpha: 0 }, 0).set(nav, { autoAlpha: 1 }, 0.999);
      t.to({}, { duration: 0.001 }, 0.999);
      tl.current = t;
    };
    build();
    const onResize = () => {
      const p = tl.current?.progress() ?? 0;
      build();
      tl.current?.progress(p);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      tl.current?.kill();
      const nav = document.getElementById("nav-logo");
      if (nav) gsap.set(nav, { clearProps: "opacity,visibility" });
    };
  }, []);

  // the overlay is fixed; its timeline runs across the hero section's own scroll height
  useScrollState(({ heroP }) => {
    tl.current?.progress(heroP);
    const el = root.current;
    if (el) el.style.visibility = heroP >= 1 ? "hidden" : "";
  });

  return (
    <div
      ref={root}
      className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-center px-[var(--gutter)]"
    >
      <h1
        id="hero-title"
        ref={wordmark}
        aria-label="Concept Plus"
        className="display text-shadow-soft origin-center text-paper will-change-transform"
      >
        {/* "CONCEPT" in Syne ExtraBold is ~8.7em wide, so size from the space between the
            gutters, less the section rail (a flat vw clipped the T at ~1000px wide) */}
        <span className="hidden whitespace-nowrap text-[min(15rem,calc((100vw-2*var(--gutter)-56px)/8.9))] md:block">
          {HERO.wordmark.map((w) => (
            <Word key={w} text={w} />
          ))}
        </span>
        <span className="block whitespace-nowrap text-[min(9rem,calc((100vw-2*var(--gutter))/5.3))] md:hidden">
          {HERO.wordmarkMobile.map((w) => (
            <Word key={w} text={w} />
          ))}
        </span>
      </h1>

      <div ref={copy} className="mt-[clamp(1.5rem,4vh,3rem)] max-w-[52rem]">
        <p className="hero-copy font-sans text-[clamp(1.6rem,3.6vw,3.4rem)] font-light uppercase leading-[1.05] tracking-[0.01em] text-copper">
          {HERO.heading}
        </p>
        <p className="hero-copy mt-4 max-w-[46ch] font-sans text-[clamp(0.95rem,1.35vw,1.3rem)] font-medium uppercase leading-snug tracking-[0.02em] text-paper">
          {HERO.description}
        </p>
      </div>

      <Monogram
        ref={mono}
        aria-hidden="true"
        className="invisible absolute left-1/2 top-1/2 w-[clamp(96px,16vw,220px)] -translate-x-1/2 -translate-y-1/2 text-paper opacity-0 will-change-transform"
      />

      <div
        ref={hints}
        className="mono-label absolute bottom-[var(--gutter)] left-[var(--gutter)] right-[var(--gutter)] flex items-end justify-between text-paper/80"
      >
        <span className="flex items-center gap-3">
          <span className="relative block h-px w-12 overflow-hidden bg-paper/25">
            <span className="absolute inset-y-0 left-0 w-1/2 animate-[scrollhint_1.8s_var(--ease-in-out)_infinite] bg-paper" />
          </span>
          {HERO.scrollHint}
        </span>
        {/* bottom-right belongs to the floor plan */}
      </div>
    </div>
  );
}
