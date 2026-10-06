/**
 * Site copy. Lines marked `// source: video @m:ss` are transcribed verbatim from the
 * walls in CPV14.mp4 and are real brand copy. Everything marked `// TODO(copy)` is
 * placeholder written in the house tone and needs sign-off.
 */

export const SITE = {
  name: "Concept Plus",
  email: "hello@conceptplus.example", // TODO(copy): real address
  tagline: "A house of disciplines.", // TODO(copy)
  description:
    "Concept Plus orchestrates development, real estate, brand, media, art and education into a single, coherent system that delivers enduring value.", // source: video @0:40 (condensed)
  est: "EST. —", // TODO(copy): founding year
  socials: [
    { label: "Instagram", href: "#" }, // TODO(copy): real handles
    { label: "LinkedIn", href: "#" },
    { label: "YouTube", href: "#" },
  ],
} as const;

export const HERO = {
  wordmark: ["Concept", "Plus"],
  wordmarkMobile: ["Con", "cept", "Plus"],
  scrollHint: "Scroll to enter",
  meta: ["EST. —", "A house of disciplines"], // TODO(copy): founding year
} as const;

export const ABOUT = {
  headline: "Orchestrating what endures.", // source: video @0:40
  paragraphs: [
    // source: video @0:40, wall text
    "Concept Plus is an orchestrator of development, real estate, brand, media, art, and education.",
    "We bring together the right minds, disciplines, and decisions from day one to create values, narratives, and experiences that stand the test of time.",
    "We operate at the intersection of vision and execution, aligning creativity, commerce, and culture into a single, coherent system that delivers enduring value.",
  ],
  outcome: "Everything we do is built around one outcome: commercial certainty and long-term asset value.", // source: video @0:31
  counters: [
    { value: 6, pad: 2, label: "Disciplines" },
    { value: 1, pad: 2, label: "House" },
    { value: 5, pad: 2, label: "Formats" }, // source: video @2:10 (launch, showcase, academy, lounge, cultural)
  ],
} as const;

export const SERVICES_INTRO = {
  title: "Every discipline, around growth.", // source: video @0:40 "We align every discipline around growth"
  listLabel: "Disciplines",
} as const;

export const PROCESS = {
  title: "One house, many possibilities.", // source: video @1:55
  steps: [
    { title: "Discover", body: "We read the site, the market and the ambition before anything is drawn." }, // TODO(copy)
    { title: "Design", body: "Every discipline sits at one table, so the concept is commercial from the first line." }, // TODO(copy)
    { title: "Deliver", body: "One programme, one owner, from first brick to opening night." }, // TODO(copy)
    { title: "Sustain", body: "We stay on to position, programme and grow the asset long after handover." }, // TODO(copy)
  ],
} as const;

export const CONTACT = {
  line: "One house, many possibilities.", // source: video @1:55
  cta: "Start a project",
  note: "Tell us about the site, the brand or the idea. We answer every enquiry within two working days.", // TODO(copy)
} as const;

export const FOOTER = {
  copyright: `© ${new Date().getFullYear()} Concept Plus. All rights reserved.`, // TODO(copy): legal entity
  address: ["House of CP", "City, Country"], // TODO(copy)
} as const;
