"use client";

import Image from "next/image";
import { useRef } from "react";

/** Horizontal strip of frames: native horizontal scroll (touch, trackpad, keyboard) + mouse drag. */
export function GalleryStrip({ images, title }: { images: string[]; title: string }) {
  const el = useRef<HTMLUListElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);

  return (
    <ul
      ref={el}
      tabIndex={0}
      aria-label={`${title} — frames from the walkthrough (scroll horizontally)`}
      data-lenis-prevent
      className="flex cursor-grab snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-[var(--gutter)] pb-4 [scrollbar-width:thin] active:cursor-grabbing"
      onPointerDown={(e) => {
        if (e.pointerType !== "mouse") return;
        drag.current = { x: e.clientX, left: el.current!.scrollLeft, moved: false };
        el.current!.style.scrollSnapType = "none";
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d) return;
        const dx = e.clientX - d.x;
        if (Math.abs(dx) > 3) d.moved = true;
        el.current!.scrollLeft = d.left - dx;
      }}
      onPointerUp={() => {
        drag.current = null;
        el.current!.style.scrollSnapType = "";
      }}
      onPointerLeave={() => {
        drag.current = null;
        if (el.current) el.current.style.scrollSnapType = "";
      }}
    >
      {images.map((src, i) => (
        <li key={src} className="relative aspect-video w-[82vw] shrink-0 snap-start overflow-hidden bg-concrete-900 md:w-[46vw]">
          <Image src={src} alt={`${title}, frame ${i + 1} of ${images.length}`} fill sizes="(max-width: 768px) 82vw, 46vw" className="pointer-events-none object-cover" draggable={false} />
        </li>
      ))}
    </ul>
  );
}
