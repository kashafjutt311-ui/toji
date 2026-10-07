import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-svh flex-col justify-center bg-ink px-[var(--gutter)] pt-[var(--nav-h)] text-paper">
      <p className="mono-label mb-6 text-paper/70">404 / Not found</p>
      <h1 className="display text-[clamp(3rem,12vw,13rem)]">No such room.</h1>
      <p className="serif-italic mt-6 max-w-[32ch] text-[clamp(1.5rem,2.4vw,2.25rem)] leading-tight text-paper/90">
        The house is large, but this door doesn&rsquo;t lead anywhere.
      </p>
      <div className="mt-12">
        <ButtonLink href="/" variant="outline">
          Back to the house
        </ButtonLink>
      </div>
    </main>
  );
}
