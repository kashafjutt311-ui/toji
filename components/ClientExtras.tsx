"use client";

import dynamic from "next/dynamic";

// Not needed for first paint: load after hydration so they stay off the critical path.
const Cursor = dynamic(() => import("./Cursor").then((m) => m.Cursor), { ssr: false });
const RouteTransition = dynamic(() => import("./RouteTransition").then((m) => m.RouteTransition), { ssr: false });

export function ClientExtras() {
  return (
    <>
      <Cursor />
      <RouteTransition />
    </>
  );
}
