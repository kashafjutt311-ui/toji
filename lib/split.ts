"use client";

/**
 * Minimal SplitText replacement (no paid GSAP plugins).
 *
 * splitLines(el): wraps each rendered line of `el` in `.line > .line-inner` so lines can
 * slide up from a mask. Lines are measured from word offsets, so call it after fonts load,
 * and again on resize (it reverts first). Text stays in the DOM in reading order.
 */
export function splitLines(el: HTMLElement): { lines: HTMLElement[]; revert: () => void } {
  const original = el.dataset.splitSrc ?? el.innerHTML;
  el.dataset.splitSrc = original;
  el.innerHTML = original;

  const text = el.textContent ?? "";
  const words = text.trim().split(/\s+/);
  el.innerHTML = words.map((w) => `<span class="split-w" style="display:inline-block">${escape(w)}</span>`).join(" ");

  const spans = Array.from(el.querySelectorAll<HTMLElement>(".split-w"));
  const rows: string[][] = [];
  let lastTop = -Infinity;
  for (const s of spans) {
    const top = s.offsetTop;
    if (Math.abs(top - lastTop) > 2) {
      rows.push([]);
      lastTop = top;
    }
    rows[rows.length - 1].push(s.textContent ?? "");
  }

  el.innerHTML = rows
    .map((r) => `<span class="line"><span class="line-inner">${r.map(escape).join(" ")}</span></span>`)
    .join("");
  const lines = Array.from(el.querySelectorAll<HTMLElement>(".line-inner"));
  return {
    lines,
    revert: () => {
      el.innerHTML = original;
    },
  };
}

function escape(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}
