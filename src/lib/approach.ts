/**
 * Run `build` once, when `el` comes within `margin` of the viewport (docs/27 §7.4). Sections far down
 * the page build their motion on approach instead of during hydration: building the «Una sola visión»
 * timeline and the profile's reveals in the hydration commit added ≈ 80 ms of mobile TBT. Until then
 * the section is its static page (everything visible), so a late build never hides what was seen —
 * with a margin of 1.5 viewports it happens well before the section is reached. Returns a cleanup that
 * cancels a pending build and undoes a done one.
 *
 * It starts watching once the journey has landed (`main[data-started]`): on Back, WebKit first
 * restores its own scroll position — further down the page — before JourneyClient lands on the
 * remembered one; a build (and its ScrollTrigger refresh) triggered by that transient position moved
 * the landed view by 50–100 px (docs/27 §6).
 */
export function onApproach(el: Element, build: () => (() => void) | void, margin = "150% 0px 150% 0px"): () => void {
  let undo: (() => void) | void;
  let io: IntersectionObserver | null = null;
  let mo: MutationObserver | null = null;
  const watch = () => {
    if (typeof IntersectionObserver === "undefined") {
      undo = build();
      return;
    }
    io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io?.disconnect();
        undo = build();
      },
      { rootMargin: margin },
    );
    io.observe(el);
  };
  const main = document.querySelector("main");
  if (!main || main.hasAttribute("data-started")) watch();
  else {
    mo = new MutationObserver(() => {
      if (!main.hasAttribute("data-started")) return;
      mo?.disconnect();
      mo = null;
      watch();
    });
    mo.observe(main, { attributes: true, attributeFilter: ["data-started"] });
  }
  return () => {
    mo?.disconnect();
    io?.disconnect();
    undo?.();
  };
}
