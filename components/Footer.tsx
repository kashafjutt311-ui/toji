import Link from "next/link";
import { Monogram } from "@/components/brand/Monogram";
import { FOOTER, SITE } from "@/data/copy";
import { SERVICES } from "@/data/services";

const SITEMAP = [
  { label: "About", href: "/#about" },
  { label: "Services", href: "/#services" },
  { label: "How we work", href: "/#process" },
  { label: "Contact", href: "/#contact" },
];

/** Normal-flow footer on solid ink; scrolls up over the held last frame. */
export function Footer() {
  return (
    <footer className="relative z-20 border-t border-hairline bg-ink px-[var(--gutter)] pb-10 pt-16 text-paper md:pt-24">
      <div className="grid gap-12 md:grid-cols-12 md:gap-6">
        <div className="md:col-span-4">
          <Monogram className="h-12 w-auto text-paper" aria-hidden="true" />
          <p className="mt-6 max-w-[32ch] text-[15px] leading-relaxed text-paper/80">{SITE.description}</p>
        </div>
        <nav aria-label="Sitemap" className="md:col-span-2 md:col-start-6">
          <p className="mono-label mb-4 text-paper/60">Sitemap</p>
          <ul className="space-y-2">
            {SITEMAP.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-copper">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Services" className="md:col-span-3">
          <p className="mono-label mb-4 text-paper/60">Services</p>
          <ul className="space-y-2">
            {SERVICES.map((s) => (
              <li key={s.slug}>
                <Link href={`/services/${s.slug}`} className="hover:text-copper">
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="md:col-span-2">
          <p className="mono-label mb-4 text-paper/60">Follow</p>
          <ul className="space-y-2">
            {SITE.socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} className="hover:text-copper" rel="noopener">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="mono-label mt-8 leading-relaxed text-paper/60">
            {FOOTER.address.map((l) => (
              <span key={l} className="block">
                {l}
              </span>
            ))}
          </p>
        </div>
      </div>
      <div className="mono-label mt-16 flex flex-col justify-between gap-3 border-t border-hairline pt-6 text-paper/60 md:flex-row">
        <span>{FOOTER.copyright}</span>
        <a href={`mailto:${SITE.email}`} className="hover:text-paper">
          {SITE.email}
        </a>
      </div>
    </footer>
  );
}
