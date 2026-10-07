import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SERVICES, serviceBySlug } from "@/data/services";
import { ButtonLink } from "@/components/ui/Button";
import { GalleryStrip } from "@/components/service/GalleryStrip";
import { Footer } from "@/components/Footer";

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/services/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const s = serviceBySlug(slug);
  if (!s) return {};
  return {
    title: s.title,
    description: `${s.promise} ${s.process}`,
    openGraph: { title: `${s.title} — Concept Plus`, description: s.promise, images: [{ url: s.hero, width: 1280, height: 720 }] },
  };
}

/**
 * Service page: normal-flow scrolling, stills only (no video).
 * The slug-dependent body sits in <Suspense> so navigation can show the shell instantly
 * (Next 16 instant navigation); all six slugs are still fully prerendered at build.
 */
export default function ServicePage({ params }: PageProps<"/services/[slug]">) {
  return (
    <>
      <Suspense fallback={<main id="main" className="min-h-svh bg-ink" aria-busy="true" />}>
        <ServiceBody params={params} />
      </Suspense>
      <Footer />
    </>
  );
}

async function ServiceBody({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = serviceBySlug(slug);
  if (!s) notFound();
  const i = SERVICES.indexOf(s);
  const prev = SERVICES[(i - 1 + SERVICES.length) % SERVICES.length];
  const next = SERVICES[(i + 1) % SERVICES.length];

  return (
    <>
      <main id="main" className="bg-ink text-paper">
        {/* 1. full-bleed hero */}
        <section aria-labelledby="svc-title" className="relative flex min-h-svh flex-col justify-end overflow-hidden px-[var(--gutter)] pb-[var(--gutter)] pt-[calc(var(--nav-h)+2rem)]">
          <Image src={s.hero} alt="" fill priority sizes="100vw" className="object-cover" />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/30" />
          <div className="relative">
            <p className="rise mono-label mb-6 flex items-center gap-3 text-paper/90" style={{ animationDelay: "450ms" }}>
              <span className="h-px w-6 bg-copper" aria-hidden="true" />
              Services / {s.index}
            </p>
            <h1 id="svc-title" className="display text-[clamp(3rem,11vw,12rem)] [overflow-wrap:anywhere]">
              <span className="line">
                <span className="rise-line line-inner" style={{ animationDelay: "500ms" }}>
                  {s.title}
                </span>
              </span>
            </h1>
            <p className="rise serif-italic mt-5 max-w-[30ch] text-[clamp(1.5rem,2.6vw,2.5rem)] leading-tight" style={{ animationDelay: "650ms" }}>
              {s.promise}
            </p>
            <nav aria-label="Service navigation" className="rise mono-label mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-hairline pt-5" style={{ animationDelay: "750ms" }}>
              <Link href={`/?s=${s.slug}`} className="hover:text-copper">
                ← All services
              </Link>
              <span className="flex gap-6">
                <Link href={`/services/${prev.slug}`} className="hover:text-copper">
                  ← {prev.title}
                </Link>
                <Link href={`/services/${next.slug}`} className="hover:text-copper">
                  {next.title} →
                </Link>
              </span>
            </nav>
          </div>
        </section>

        {/* 2. what we do */}
        <section aria-labelledby="svc-what" className="px-[var(--gutter)] py-24 md:py-36">
          <h2 id="svc-what" className="mono-label mb-10 flex items-center gap-3 text-paper/80">
            <span>01 / What we do</span>
            <span className="h-px flex-1 bg-hairline" aria-hidden="true" />
          </h2>
          <ul className="grid border-t border-hairline md:grid-cols-3">
            {s.offerings.map((o, k) => (
              <li key={o.title} className="border-b border-hairline py-8 md:border-b-0 md:px-8 md:py-10 md:first:pl-0 md:[&:not(:first-child)]:border-l">
                <p className="mono-label text-paper/60">{String(k + 1).padStart(2, "0")}</p>
                <h3 className="mt-6 font-display text-[clamp(1.5rem,2.2vw,2.25rem)] font-extrabold uppercase leading-none tracking-[-0.03em]">{o.title}</h3>
                <p className="mt-4 max-w-[38ch] leading-relaxed text-paper/80">{o.body}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* 3. how it works */}
        <section aria-labelledby="svc-how" className="bg-concrete-900 px-[var(--gutter)] py-24 md:py-36">
          <h2 id="svc-how" className="mono-label mb-6 flex items-center gap-3 text-paper/80">
            <span>02 / How it works</span>
            <span className="h-px flex-1 bg-hairline" aria-hidden="true" />
          </h2>
          <p className="serif-italic mb-14 max-w-[36ch] text-[clamp(1.5rem,2.4vw,2.25rem)] leading-tight">{s.process}</p>
          <ol className="grid gap-px border border-hairline bg-[var(--hairline)] md:grid-cols-4">
            {s.steps.map((st, k) => (
              <li key={st.title} className="bg-concrete-900 p-6 md:p-8">
                <p className="mono-label text-copper">{String(k + 1).padStart(2, "0")}</p>
                <h3 className="mt-8 font-display text-2xl font-extrabold uppercase tracking-[-0.03em]">{st.title}</h3>
                <p className="mt-3 leading-relaxed text-paper/80">{st.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* 4. gallery strip */}
        <section aria-labelledby="svc-gallery" className="py-24 md:py-36">
          <h2 id="svc-gallery" className="mono-label mb-10 flex items-center gap-3 px-[var(--gutter)] text-paper/80">
            <span>03 / From the house</span>
            <span className="h-px flex-1 bg-hairline" aria-hidden="true" />
          </h2>
          <GalleryStrip images={[s.hero, ...s.gallery]} title={s.title} />
        </section>

        {/* 5. CTA band */}
        <section aria-labelledby="svc-cta" className="border-t border-hairline px-[var(--gutter)] py-24 md:py-32">
          <div className="flex flex-col items-start justify-between gap-10 md:flex-row md:items-end">
            <h2 id="svc-cta" className="display max-w-[14ch] text-[clamp(2.5rem,6vw,6rem)]">
              Start a {s.title} project
            </h2>
            <ButtonLink href="/#contact" variant="solid">
              {s.cta}
            </ButtonLink>
          </div>
        </section>
      </main>
    </>
  );
}
