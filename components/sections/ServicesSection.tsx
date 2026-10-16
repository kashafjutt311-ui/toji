import { GlassFrame } from "@/components/GlassFrame";
import { SERVICES } from "@/data/services";
import { SERVICES_INTRO } from "@/data/copy";
import { anchorTop, FRAMES, sectionVh } from "@/lib/layout";
import { ServiceButton, ServiceIndex } from "./ServiceIndex";

/**
 * 02 / Services — a large "Our Services" heading straight on the film, then one plaque per
 * discipline, each centred on screen while its sign is in the footage, alternating sides.
 * A small glass index (desktop) tracks the active one.
 * Server component: only the button and the index hydrate.
 */
export function ServicesSection() {
  const count = String(SERVICES.length).padStart(2, "0");
  return (
    <section id="services" aria-labelledby="services-title" className="relative" style={{ height: `${sectionVh("services")}svh` }}>
      <GlassFrame variant="bare" size="feature" side={FRAMES.servicesHeading.side} top={anchorTop.servicesHeading()}>
        <p className="gf-item mono-label flex flex-wrap items-center gap-x-3 gap-y-1 text-paper">
          <span className="whitespace-nowrap">02 / Services</span>
          <span className="h-px w-16 bg-copper max-md:w-8" aria-hidden="true" />
          <span className="whitespace-nowrap">{count} disciplines · 01 house</span>
        </p>
        <h2 id="services-title" className="mt-5">
          <span className="gf-item serif-italic block text-[clamp(2.75rem,6vw,6rem)] leading-none">Our</span>
          {/* Syne's wide caps need ~9.2em for "SERVICES": 10vw keeps it inside the viewport */}
          <span className="gf-item display block whitespace-nowrap text-[clamp(2.4rem,10vw,10.5rem)] leading-[0.84]">Services</span>
        </h2>
        <p className="gf-item serif-italic mt-6 max-w-[28ch] text-[clamp(1.35rem,2vw,1.9rem)] leading-tight text-paper">
          {SERVICES_INTRO.title}
        </p>
      </GlassFrame>

      {SERVICES.map((s) => {
        const f = FRAMES.services[s.slug];
        return (
          <GlassFrame
            key={s.slug}
            as="article"
            id={`service-${s.slug}`}
            variant="plaque"
            side={f.side}
            tone={f.tone}
            top={anchorTop.service(s.slug)}
            aria-labelledby={`service-${s.slug}-title`}
          >
            <p className="gf-item mono-label flex items-center gap-3 text-copper" aria-hidden="true">
              <span className="tabular-nums">
                {s.index} / {count}
              </span>
              <span className="h-px w-8 bg-copper/60" />
              <span className="text-paper/80">Service</span>
            </p>
            {/* sized so the longest word ("MARKETING") fits the frame's measure; never breaks mid-word */}
            <h3
              id={`service-${s.slug}-title`}
              className="gf-item display relative mt-4 text-[7.4vw] leading-[0.92] md:text-[clamp(1.75rem,2.7vw,3.25rem)]"
            >
              {s.title}
            </h3>
            <p className="gf-item serif-italic relative mt-4 max-w-[24ch] text-[clamp(1.35rem,1.8vw,1.65rem)] leading-tight text-paper">
              {s.promise}
            </p>
            <div className="gf-item mt-8 flex items-end justify-between gap-4">
              <ServiceButton slug={s.slug} title={s.title} />
              <span className="plaque-index" aria-hidden="true">
                {s.index}
              </span>
            </div>
          </GlassFrame>
        );
      })}
      <ServiceIndex />
    </section>
  );
}
