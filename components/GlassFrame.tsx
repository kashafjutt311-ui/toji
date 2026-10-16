"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { registerFrame } from "@/lib/frames";
import type { Side, Tone } from "@/lib/layout";

interface Props {
  children: ReactNode;
  /** mono section label, e.g. "01 / About" */
  label?: string;
  tone?: Tone;
  /** horizontal placement inside its section (ignored on mobile: full width) */
  side?: Side;
  /** CSS `top` inside the parent section; frame is centred on it (lib/layout.ts anchorTop) */
  top?: string;
  /** "text" = max ~520px; "step" = narrow column for the process row; "wide" = contact; "feature" = About */
  size?: "text" | "step" | "wide" | "feature";
  /**
   * Surface style. "glass" = the plain sheet; "premium" = deeper glass with a lit edge and
   * sheen (About); "plaque" = darker, chamfered corner, copper edge (service cards);
   * "bare" = no surface, type straight on the film over a soft scrim (section headings).
   */
  variant?: "glass" | "premium" | "plaque" | "bare";
  /** entrance animation (off for frames that live inside an already-animated group) */
  animate?: boolean;
  /** extra entrance delay in ms (staggering sibling frames) */
  delay?: number;
  className?: string;
  as?: "div" | "article" | "aside";
  id?: string;
  style?: CSSProperties;
  "aria-labelledby"?: string;
}

/**
 * A plain sheet of dark glass over the video. Square corners, 1px hairline, no shadow,
 * no glow. Tint / blur come from the `.gf` rules in globals.css (desktop vs mobile vs
 * bright tone vs no-backdrop-filter fallback).
 *
 * Children marked with `.gf-item` stagger in 70ms apart when the frame enters.
 */
export function GlassFrame({
  children,
  label,
  tone = "dark",
  side = "left",
  top,
  size = "text",
  variant = "glass",
  animate = true,
  delay = 0,
  className = "",
  as: Tag = "div",
  id,
  style,
  ...aria
}: Props) {
  const frame = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // stagger index for each animated child
    content.current?.querySelectorAll<HTMLElement>(".gf-item").forEach((el, i) => el.style.setProperty("--i", String(i)));
    return registerFrame(frame.current!, content.current, animate);
  }, [animate]);

  const surface = (
    <Tag
      ref={frame as never}
      id={id}
      data-tone={tone}
      data-size={size}
      data-variant={variant}
      className={`gf relative ${className}`}
      style={{ ...(top === undefined ? style : undefined), ...(delay ? ({ "--d": `${delay}ms` } as CSSProperties) : null) }}
      {...aria}
    >
      <div ref={content} className="gf-content">
        {label && (
          <p className="gf-item mono-label mb-5 flex items-center gap-3 text-paper/90 md:mb-6">
            <span>{label}</span>
            <span className="h-px flex-1 bg-hairline" aria-hidden="true" />
          </p>
        )}
        {children}
      </div>
    </Tag>
  );

  if (top === undefined) return surface;

  // positioning wrapper: centred on `top`, placed by side. The glass inside animates on
  // its own `translate`, so the two never fight.
  const place =
    side === "center"
      ? "md:left-1/2 md:-translate-x-1/2"
      : side === "right"
        ? "md:right-[var(--gutter)] md:left-auto"
        : "md:left-[var(--gutter)] md:right-auto";
  return (
    <div className={`absolute inset-x-4 -translate-y-1/2 md:inset-x-auto ${place}`} style={{ top, ...style }}>
      {surface}
    </div>
  );
}
