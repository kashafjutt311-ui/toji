import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "solid" | "outline";

interface Common {
  children: ReactNode;
  variant?: Variant;
  /** show the cursor "View" state over this button */
  cursorView?: boolean;
  className?: string;
}

const base =
  "btn group relative inline-flex items-center gap-3 overflow-hidden border px-5 py-3.5 font-mono text-[12px] uppercase tracking-[0.12em] transition-colors duration-[400ms] ease-[var(--ease-in-out)]";
const variants: Record<Variant, string> = {
  // copper fill; wipe brings in paper
  solid: "border-copper bg-copper text-ink hover:text-ink",
  // transparent; wipe brings in paper, label turns ink
  outline: "border-paper/70 text-paper hover:text-ink",
};

function Inner({ children }: { children: ReactNode }) {
  return (
    <>
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-paper [clip-path:inset(0_100%_0_0)] transition-[clip-path] duration-[400ms] ease-[var(--ease-in-out)] group-hover:[clip-path:inset(0_0_0_0)] group-focus-visible:[clip-path:inset(0_0_0_0)]"
      />
      <span className="relative">{children}</span>
      <svg
        aria-hidden="true"
        viewBox="0 0 16 10"
        className="relative h-2.5 w-4 transition-transform duration-[400ms] ease-[var(--ease-in-out)] group-hover:translate-x-1.5 group-focus-visible:translate-x-1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
      >
        <path d="M0 5h14M10 1l4 4-4 4" />
      </svg>
    </>
  );
}

/** Square-cornered button with a left-to-right fill wipe and a nudging arrow. */
export function ButtonLink({
  href,
  children,
  variant = "solid",
  cursorView,
  className = "",
  ...rest
}: Common & Omit<ComponentProps<typeof Link>, "className" | "children">) {
  return (
    <Link href={href} className={`${base} ${variants[variant]} ${className}`} data-cursor={cursorView ? "view" : undefined} {...rest}>
      <Inner>{children}</Inner>
    </Link>
  );
}

export function Button({
  children,
  variant = "solid",
  cursorView,
  className = "",
  ...rest
}: Common & Omit<ComponentProps<"button">, "className" | "children">) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} data-cursor={cursorView ? "view" : undefined} {...rest}>
      <Inner>{children}</Inner>
    </button>
  );
}
