import { GlassFrame } from "@/components/GlassFrame";
import { ABOUT } from "@/data/copy";
import { anchorTop, FRAMES, sectionVh } from "@/lib/layout";

/**
 * 01 / About — one wide premium glass card on the left, arriving as the lobby appears
 * (~0:12). Two columns on desktop: headline + counters | the three wall paragraphs.
 */
export function AboutSection() {
  return (
    <section id="about" aria-labelledby="about-title" className="relative" style={{ height: `${sectionVh("about")}svh` }}>
      <GlassFrame
        label="01 / About"
        side={FRAMES.about.side}
        tone={FRAMES.about.tone}
        top={anchorTop.about()}
        size="feature"
        variant="premium"
      >
        <div className="grid gap-8 md:grid-cols-[1.05fr_1fr] md:gap-14">
          <div className="flex flex-col">
            <h2 id="about-title" className="gf-item serif-italic text-[clamp(2.6rem,4.6vw,4.75rem)] leading-[0.98]">
              {ABOUT.headline}
            </h2>
            <p className="gf-item mt-6 max-w-[34ch] text-[15px] font-semibold leading-snug text-paper md:text-[17px]">
              {ABOUT.outcome}
            </p>
            <dl className="gf-item mt-auto grid grid-cols-3 gap-4 border-t border-hairline pt-6 max-md:mt-8">
              {ABOUT.counters.map((c) => (
                <div key={c.label}>
                  <dt className="sr-only">{c.label}</dt>
                  <dd>
                    <span className="block font-display text-[clamp(2rem,3vw,2.75rem)] font-extrabold leading-none tracking-[-0.03em] text-paper">
                      {String(c.value).padStart(c.pad, "0")}
                    </span>
                    <span className="mono-label mt-2 block text-paper/90" aria-hidden="true">
                      {c.label}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="space-y-5 border-hairline text-[16px] font-medium leading-relaxed text-paper md:border-l md:pl-14 md:text-[18px]">
            {ABOUT.paragraphs.map((p, i) => (
              <p key={p} className={`gf-item ${i === 0 ? "font-semibold" : "text-paper/95"}`}>
                {p}
              </p>
            ))}
          </div>
        </div>
      </GlassFrame>
    </section>
  );
}
