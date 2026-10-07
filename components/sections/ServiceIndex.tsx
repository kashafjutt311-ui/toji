"use client";

import { useRef, useState } from "react";
import { SERVICES } from "@/data/services";
import { FRAME_AT, serviceAt, timeAt, type ServiceSlug } from "@/lib/choreography";
import { useScrollState } from "@/lib/hooks";
import { scroll } from "@/lib/scroll";
import { rememberService } from "@/lib/return";
import { ButtonLink } from "@/components/ui/Button";

/** Desktop-only glass list, fixed bottom-left while the Services section is on screen. */
export function ServiceIndex() {
  const [active, setActive] = useState<ServiceSlug | null>(null);
  const last = useRef<string>("");

  useScrollState(({ p }) => {
    const a = serviceAt(timeAt(p));
    if (`${a}` !== last.current) {
      last.current = `${a}`;
      setActive(a);
    }
  });
  const inSection = active !== null;

  return (
    <nav
      aria-label="Services index"
      className={`gf fixed bottom-[var(--gutter)] left-[var(--gutter)] z-30 hidden !w-auto !p-0 transition-opacity duration-500 md:block ${
        inSection ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      data-tone="dark"
      data-state="in"
    >
      <ol className="py-2">
        {SERVICES.map((s) => {
          const on = s.slug === active;
          return (
            <li key={s.slug}>
              <button
                type="button"
                tabIndex={inSection ? 0 : -1}
                aria-current={on ? "true" : undefined}
                onClick={() => scroll.scrollToTime(FRAME_AT.services[s.slug])}
                className={`mono-label flex w-full items-center gap-3 px-4 py-1.5 text-left transition-colors ${
                  on ? "text-paper" : "text-paper/60 hover:text-paper"
                }`}
              >
                <span className={`h-px transition-all duration-500 ${on ? "w-6 bg-copper" : "w-3 bg-paper/40"}`} aria-hidden="true" />
                <span className="tabular-nums">{s.index}</span>
                <span>{s.title}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** "Explore …" button; remembers which frame it came from so Back can return to it. */
export function ServiceButton({ slug, title }: { slug: ServiceSlug; title: string }) {
  return (
    <ButtonLink href={`/services/${slug}`} variant="outline" cursorView prefetch onClick={() => rememberService(slug)}>
      Explore {title}
    </ButtonLink>
  );
}
