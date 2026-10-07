import { GlassFrame } from "@/components/GlassFrame";
import { SERVICES } from "@/data/services";
import { SERVICES_INTRO } from "@/data/copy";
import { anchorTop, FRAMES, sectionVh } from "@/lib/layout";
import { ServiceButton, ServiceIndex } from "./ServiceIndex";

/**
 * 02 / Services — one glass frame per discipline, each centred on screen while its sign
 * is in the footage, alternating sides. A small glass index (desktop) tracks the active one.
 * Server component: only the button and the index hydrate.
 */
export function ServicesSection() {
  return (
    <section id="services" aria-labelledby="services-title" className="relative" style={{ height: `${sectionVh("services")}svh` }}>
      <h2 id="services-title" className="sr-only">
        Services — {SERVICES_INTRO.title}
      </h2>
      {SERVICES.map((s) => {
        const f = FRAMES.services[s.slug];
        return (
          <GlassFrame
            key={s.slug}
            as="article"
            id={`service-${s.slug}`}
            label="02 / Services"
            side={f.side}
            tone={f.tone}
            top={anchorTop.service(s.slug)}
            aria-labelledby={`service-${s.slug}-title`}
          >
            <p className="gf-item mono-label flex items-center gap-3 text-paper/90" aria-hidden="true">
              <span className="h-px w-6 bg-copper" />
              {s.index} — {String(SERVICES.length).padStart(2, "0")}
            </p>
            {/* sized so the longest word ("MARKETING") fits the frame's measure; never breaks mid-word */}
            <h3
              id={`service-${s.slug}-title`}
              className="gf-item display mt-3 text-[7.4vw] leading-[0.92] md:text-[clamp(1.75rem,2.7vw,3.25rem)]"
            >
              {s.title}
            </h3>
            <p className="gf-item serif-italic mt-4 text-[clamp(1.35rem,1.8vw,1.65rem)] leading-tight text-paper/95">{s.promise}</p>
            <div className="gf-item my-6 h-px bg-hairline" aria-hidden="true" />
            <div className="gf-item">
              <ServiceButton slug={s.slug} title={s.title} />
            </div>
          </GlassFrame>
        );
      })}
      <ServiceIndex />
    </section>
  );
}
