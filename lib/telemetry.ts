/** Mutable readouts for the dev debug overlay. Written in rAF, read in rAF; never rendered by React. */
export const telemetry = {
  mode: "loading" as "loading" | "video" | "canvas",
  source: "",
  time: 0,
  target: 0,
  latency: null as number | null,
};
