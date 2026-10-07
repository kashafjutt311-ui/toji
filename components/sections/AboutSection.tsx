import { GlassFrame } from "@/components/GlassFrame";
import { ABOUT } from "@/data/copy";
import { anchorTop, FRAMES, sectionVh } from "@/lib/layout";

/** 01 / About — one frame on the left, arriving as the lobby appears (~0:12). */
export function AboutSection() {
  return (
    <section id="about" aria-labelledby="about-title" className="relative" style={{ height: `${sectionVh("about")}svh` }}>
      <GlassFrame label="01 / About" side={FRAMES.about.side} tone={FRAMES.about.tone} top={anchorTop.about()}>
        <h2 id="about-title" className="gf-item serif-italic text-[clamp(2.25rem,3.4vw,3.25rem)] leading-[1.02]">
          {ABOUT.headline}
        </h2>
        <div className="gf-item my-6 h-px bg-hairline" aria-hidden="true" />
        <div className="space-y-4 text-[15px] leading-relaxed text-paper/90 md:text-base">
          {ABOUT.paragraphs.map((p) => (
            <p key={p} className="gf-item">
              {p}
            </p>
          ))}
        </div>
        <dl className="gf-item mono-label mt-7 grid grid-cols-3 gap-4 border-t border-hairline pt-5">
          {ABOUT.counters.map((c) => (
            <div key={c.label}>
              <dt className="sr-only">{c.label}</dt>
              <dd>
                <span className="block font-display text-[28px] leading-none tracking-[-0.02em] text-paper">
                  {String(c.value).padStart(c.pad, "0")}
                </span>
                <span className="mt-2 block text-paper/90" aria-hidden="true">
                  {c.label}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </GlassFrame>
    </section>
  );
}
