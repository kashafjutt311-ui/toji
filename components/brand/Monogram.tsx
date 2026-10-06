import { forwardRef, type SVGProps } from "react";
import { LOGO_PATH, LOGO_VIEWBOX } from "./logo-path";

type Props = SVGProps<SVGSVGElement> & { title?: string; pathProps?: SVGProps<SVGPathElement> };

/** The CP monogram, traced from the film (see scripts/vectorise-logo.mjs). */
export const Monogram = forwardRef<SVGSVGElement, Props>(function Monogram(
  { title = "Concept Plus", pathProps, ...props },
  ref,
) {
  return (
    <svg ref={ref} viewBox={LOGO_VIEWBOX} fill="currentColor" role="img" aria-label={title} {...props}>
      <path fillRule="evenodd" d={LOGO_PATH} {...pathProps} />
    </svg>
  );
});
