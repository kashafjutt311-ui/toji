"use client";

import Link from "next/link";
import { Monogram } from "@/components/brand/Monogram";

/** Transparent top bar: CP monogram slot left (#nav-logo, the hero hands over to it), Menu right. */
export function Nav() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex h-[var(--nav-h)] items-center justify-between px-[var(--gutter)]">
      <Link href="/" aria-label="Concept Plus — home" className="pointer-events-auto block">
        <Monogram id="nav-logo" className="h-9 w-auto text-paper md:h-10" aria-hidden="true" />
      </Link>
      <button type="button" className="mono-label pointer-events-auto text-paper" aria-expanded="false" aria-controls="menu">
        Menu
      </button>
    </header>
  );
}
