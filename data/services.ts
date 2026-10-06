import { SERVICE_TIMES, type ServiceSlug } from "@/lib/choreography";

export interface Service {
  slug: ServiceSlug;
  index: string;
  title: string;
  /** one-line promise. Where it exists, this is the line on the wall in the video. */
  promise: string;
  offerings: { title: string; body: string }[];
  process: string;
  steps: { title: string; body: string }[];
  /** /frames/{slug}.jpg is the hero; -1..-3 form the gallery strip (scripts/frames.sh) */
  hero: string;
  gallery: string[];
  cta: string;
}

const frames = (slug: ServiceSlug) => ({
  hero: `/frames/${slug}.jpg`,
  gallery: [1, 2, 3].map((i) => `/frames/${slug}-${i}.jpg`),
});

// Camera order in the video. Names and promises verified against the signage.
export const SERVICES: Service[] = [
  {
    slug: "development",
    index: "01",
    title: "Development",
    promise: "Transforming intent into built reality.", // source: video @0:54
    offerings: [
      // TODO(copy)
      { title: "Feasibility & masterplanning", body: "Site, yield and programme tested against the market before a line is fixed." },
      { title: "Design management", body: "Architects, engineers and consultants held to one brief and one budget." },
      { title: "Delivery", body: "Procurement, construction oversight and handover under a single owner." },
    ],
    process: "Development starts with the outcome: what the asset must be worth, and to whom, on the day it opens.", // TODO(copy)
    steps: [
      // TODO(copy)
      { title: "Discover", body: "Site, planning envelope and market appetite." },
      { title: "Design", body: "A scheme drawn around commercial certainty." },
      { title: "Deliver", body: "Built to programme, cost and standard." },
      { title: "Sustain", body: "Aftercare and asset performance reviews." },
    ],
    cta: "Start a development project",
    ...frames("development"),
  },
  {
    slug: "sales-marketing",
    index: "02",
    title: "Sales & Marketing",
    promise: "Where positioning drives performance.", // source: video @1:00
    offerings: [
      // TODO(copy)
      { title: "Positioning", body: "A clear, defensible story for the asset and the buyer it is built for." },
      { title: "Launch campaigns", body: "Brand, content and media planned as one release." },
      { title: "Sales operations", body: "Pricing, release strategy and a sales suite that converts." },
    ],
    process: "We position before we promote. The story is decided in the boardroom, not the media plan.", // TODO(copy)
    steps: [
      // TODO(copy)
      { title: "Discover", body: "Audience, competition and price tolerance." },
      { title: "Design", body: "Identity, narrative and launch architecture." },
      { title: "Deliver", body: "Campaign, sales suite and release." },
      { title: "Sustain", body: "Pace, reporting and re-positioning." },
    ],
    cta: "Start a sales & marketing project",
    ...frames("sales-marketing"),
  },
  {
    slug: "real-estate",
    index: "03",
    title: "Real Estate",
    promise: "Asset positioning & advisory.", // source: video @1:10
    offerings: [
      // TODO(copy)
      { title: "Acquisition advisory", body: "Opportunities assessed for long-term value, not short-term yield." },
      { title: "Asset positioning", body: "Repositioning strategies that lift occupancy, rent and reputation." },
      { title: "Portfolio strategy", body: "Hold, improve or exit, decided with the full picture." },
    ],
    process: "Every recommendation is tied to one number: long-term asset value.", // TODO(copy)
    steps: [
      // TODO(copy)
      { title: "Discover", body: "Asset audit and market read." },
      { title: "Design", body: "Positioning and investment case." },
      { title: "Deliver", body: "Leasing, works and launch." },
      { title: "Sustain", body: "Ongoing advisory and reporting." },
    ],
    cta: "Start a real estate project",
    ...frames("real-estate"),
  },
  {
    slug: "hospitality",
    index: "04",
    title: "Hospitality",
    promise: "Creating memorable experiences.", // source: video @1:20
    offerings: [
      // TODO(copy)
      { title: "Concept creation", body: "Lounges, cafés and suites with a reason to return." },
      { title: "Operator alignment", body: "The right operator, brief and agreement from day one." },
      { title: "Guest experience", body: "Service design, from arrival to the last detail on the table." },
    ],
    process: "Hospitality is where the brand is felt. We design the moment, then the room around it.", // TODO(copy)
    steps: [
      // TODO(copy)
      { title: "Discover", body: "Guest, location and occasion." },
      { title: "Design", body: "Concept, interiors and service." },
      { title: "Deliver", body: "Fit-out, team and opening." },
      { title: "Sustain", body: "Programming and performance." },
    ],
    cta: "Start a hospitality project",
    ...frames("hospitality"),
  },
  {
    slug: "art",
    index: "05",
    title: "Art",
    promise: "Developing cultural narratives.", // source: video @1:32
    offerings: [
      // TODO(copy)
      { title: "Curation", body: "Collections and commissions that give a place its character." },
      { title: "Gallery programming", body: "Exhibitions, launches and showcases staged in the house." },
      { title: "Artist partnerships", body: "Long-term collaborations, not decoration." },
    ],
    process: "Culture is the long game. We build narratives that make places worth visiting twice.", // TODO(copy)
    steps: [
      // TODO(copy)
      { title: "Discover", body: "Place, audience and story." },
      { title: "Design", body: "Curatorial concept and commissions." },
      { title: "Deliver", body: "Installation and opening programme." },
      { title: "Sustain", body: "A living calendar of shows." },
    ],
    cta: "Start an art project",
    ...frames("art"),
  },
  {
    slug: "academy",
    index: "06",
    title: "Academy",
    promise: "Aligning capability with intent.", // source: video @1:52
    offerings: [
      // source: video @1:44 (wall text), lightly adapted
      { title: "Alignment", body: "The Academy exists to align the ecosystem around the work." },
      { title: "Capability", body: "Strong concepts fail when the people carrying them are misaligned." },
      { title: "Continuity", body: "Education ensures intent survives execution." },
    ],
    process: "Talks, trainings, seminars, briefings and panel discussions, held in the house.", // source: video @2:10 "Academy mode"
    steps: [
      // TODO(copy)
      { title: "Discover", body: "Where intent is getting lost." },
      { title: "Design", body: "A programme built for the team." },
      { title: "Deliver", body: "Sessions in the Academy space." },
      { title: "Sustain", body: "Follow-up and alumni network." },
    ],
    cta: "Start an academy programme",
    ...frames("academy"),
  },
];

export const serviceBySlug = (slug: string) => SERVICES.find((s) => s.slug === slug);

export const serviceTimes = (slug: ServiceSlug) => SERVICE_TIMES[slug];
