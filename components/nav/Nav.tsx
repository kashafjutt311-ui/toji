"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Monogram } from "@/components/brand/Monogram";
import { SERVICES } from "@/data/services";
import { SITE } from "@/data/copy";
import { getLenis, lockScroll, scroll } from "@/lib/scroll";
import { sectionAt, timeAt, type SectionId } from "@/lib/choreography";
import { useScrollState } from "@/lib/hooks";

const LINKS = [
  { label: "Home", id: "hero" },
  { label: "About", id: "about" },
  { label: "Services", id: "services" },
  { label: "How we work", id: "process" },
  { label: "Contact", id: "contact" },
];

/**
 * Transparent top bar: CP monogram slot left (#nav-logo — the hero hands over to it),
 * Menu right. Hides on scroll down, returns on scroll up. Full-screen menu with big Syne
 * links; keyboard operable (focus trapped while open, Esc closes, focus returns to Menu).
 */
export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const [active, setActive] = useState<SectionId>("hero");

  // header links highlight the section on screen (home page only)
  useScrollState(({ y, p, videoSpan }) => {
    if (pathname !== "/") return;
    const id = y >= videoSpan - 4 ? "contact" : sectionAt(timeAt(p));
    setActive((prev) => (prev === id ? prev : id));
  });

  // hide on scroll down / show on scroll up
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) < 6) return;
      setHidden(y > last && y > 120);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // open/close animation + scroll lock + focus management
  useEffect(() => {
    // Web Animations API, not GSAP: the Nav ships on every page and GSAP only loads on "/"
    const el = menu.current!;
    const inOut = "cubic-bezier(.7,0,.2,1)";
    const out = "cubic-bezier(.16,1,.3,1)";
    if (open) {
      lockScroll(true);
      el.style.display = "flex";
      el.animate([{ clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)" }], { duration: 600, easing: inOut, fill: "both" });
      el.querySelectorAll<HTMLElement>(".menu-link").forEach((a, i) =>
        a.animate([{ transform: "translateY(110%)" }, { transform: "translateY(0)" }], {
          duration: 800,
          easing: out,
          delay: 250 + i * 60,
          fill: "both",
        }),
      );
      el.querySelector<HTMLElement>("a,button")?.focus();
    } else if (el.style.display === "flex") {
      const a = el.animate([{ clipPath: "inset(0 0 0% 0)" }, { clipPath: "inset(0 0 100% 0)" }], { duration: 500, easing: inOut, fill: "both" });
      a.onfinish = () => {
        el.style.display = "none";
      };
      lockScroll(false);
      toggle.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key !== "Tab") return;
      const f = Array.from(menu.current!.querySelectorAll<HTMLElement>("a,button"));
      const first = f[0],
        lastEl = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const go = (id: string) => (e: React.MouseEvent) => {
    setOpen(false);
    if (pathname === "/") {
      e.preventDefault();
      // wait for the scroll lock to release
      requestAnimationFrame(() => scroll.scrollToSection(id, { duration: getLenis() ? 2 : undefined }));
    }
  };

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-transform duration-500 ease-[var(--ease-out)] ${
          hidden && !open ? "-translate-y-full" : ""
        }`}
      >
        {/* soft scrim so the paper logo/label hold up over pale concrete */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[140%] bg-gradient-to-b from-black/45 to-transparent" />
        <div className="relative flex h-[var(--nav-h)] items-center justify-between px-[var(--gutter)]">
          <Link href="/" aria-label="Concept Plus — home" className="block" onClick={() => setOpen(false)}>
            <Monogram id="nav-logo" className="h-9 w-auto text-paper md:h-10" aria-hidden="true" />
          </Link>
          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-8">
              {LINKS.map((l) => {
                const on = pathname === "/" && active === l.id;
                return (
                  <li key={l.id}>
                    <Link
                      href={`/#${l.id}`}
                      onClick={go(l.id)}
                      aria-current={on ? "location" : undefined}
                      className={`mono-label relative py-2 transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:bg-copper after:transition-transform after:duration-500 ${
                        on ? "text-paper after:scale-x-100" : "text-paper/70 after:scale-x-0 hover:text-paper hover:after:scale-x-100"
                      }`}
                    >
                      {l.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <button
            ref={toggle}
            type="button"
            className="mono-label relative z-50 py-2 text-paper"
            aria-expanded={open}
            aria-controls="menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </header>

      <div
        id="menu"
        ref={menu}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className="fixed inset-0 z-[45] hidden flex-col justify-between bg-ink px-[var(--gutter)] pb-[var(--gutter)] pt-[calc(var(--nav-h)+4vh)] text-paper"
      >
        {/* the header's toggle sits under this overlay, so the menu carries its own close */}
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
          className="group absolute right-[var(--gutter)] top-0 flex h-[var(--nav-h)] items-center gap-3 text-paper"
        >
          <span className="mono-label transition-colors group-hover:text-copper">Close</span>
          <span
            aria-hidden="true"
            className="relative grid size-11 place-items-center border border-hairline transition-[border-color,rotate] duration-500 ease-[var(--ease-out)] group-hover:rotate-90 group-hover:border-copper"
          >
            <span className="absolute h-px w-5 rotate-45 bg-current transition-colors group-hover:bg-copper" />
            <span className="absolute h-px w-5 -rotate-45 bg-current transition-colors group-hover:bg-copper" />
          </span>
        </button>
        <nav aria-label="Main">
          <ul>
            {LINKS.map((l, i) => (
              <li key={l.id} className="line border-b border-hairline">
                <Link
                  href={`/#${l.id}`}
                  onClick={go(l.id)}
                  className="menu-link display group flex items-baseline gap-4 py-2 text-[clamp(2.5rem,min(6.5vw,11vh),6.5rem)] hover:text-copper md:whitespace-nowrap"
                >
                  <span className="mono-label translate-y-[-0.6em] text-paper/60 group-hover:text-copper">0{i + 1}</span>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mono-label flex flex-col gap-6 text-paper/70 md:flex-row md:items-end md:justify-between">
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {SERVICES.map((s) => (
              <li key={s.slug}>
                <Link href={`/services/${s.slug}`} onClick={() => setOpen(false)} className="hover:text-paper">
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
          <a href={`mailto:${SITE.email}`} className="hover:text-paper">
            {SITE.email}
          </a>
        </div>
      </div>
    </>
  );
}
