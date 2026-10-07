import { GlassFrame } from "@/components/GlassFrame";
import { ButtonLink } from "@/components/ui/Button";
import { CONTACT, SITE } from "@/data/copy";
import { CONTACT_VH, FRAMES } from "@/lib/layout";

/** 04 / Contact — the video has ended and holds on the courtyard billboard. */
export function ContactSection() {
  return (
    <section id="contact" aria-labelledby="contact-title" className="relative" style={{ height: `${CONTACT_VH}svh` }}>
      <GlassFrame label="04 / Contact" size="wide" side={FRAMES.contact.side} tone={FRAMES.contact.tone} top="50svh">
        {/* "POSSIBILITIES." is the longest word: 3.3vw keeps it inside a 45vw frame */}
        <h2 id="contact-title" className="gf-item display text-[7vw] leading-[0.9] md:text-[clamp(2rem,3.3vw,4rem)]">
          {CONTACT.line}
        </h2>
        <div className="gf-item my-6 h-px bg-hairline" aria-hidden="true" />
        <p className="gf-item max-w-[46ch] text-[15px] leading-relaxed text-paper/90 md:text-base">{CONTACT.note}</p>
        <div className="gf-item mt-7 flex flex-wrap items-center gap-x-6 gap-y-4">
          <ButtonLink href={`mailto:${SITE.email}?subject=New%20project`} variant="solid">
            {CONTACT.cta}
          </ButtonLink>
          <a href={`mailto:${SITE.email}`} className="mono-label text-paper underline decoration-paper/40 underline-offset-4 hover:decoration-copper">
            {SITE.email}
          </a>
        </div>
      </GlassFrame>
    </section>
  );
}
