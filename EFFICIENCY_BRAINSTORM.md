# Website Efficiency Brainstorm

This is a practical, implementation-ready backlog focused on improving runtime performance, loading speed, and maintenance efficiency for the current landing page.

## 1) Quick wins (high impact, low effort)

1. **Lazy-load analytics until user interaction or idle time**
   - Right now `analytics.js` is loaded on every visit via a deferred script.
   - Move to delayed loading (`requestIdleCallback` + fallback timeout) so first paint is prioritized.

2. **Reduce above-the-fold animation cost on mobile**
   - The hero currently combines Lenis smooth scrolling, parallax layers, and an animated canvas.
   - Keep visual quality on desktop, but disable one animation system on mobile (prefer disabling particle canvas first).

3. **Pause all offscreen work aggressively**
   - IntersectionObserver is already used for reveal animations.
   - Extend this approach to parallax and any periodic timers so updates run only while sections are visible.

4. **Preload only critical font weights**
   - Multiple families/weights are requested up front.
   - Start with only the hero/body weights needed for first viewport and load the rest after first render.

5. **Use `content-visibility` for below-the-fold sections**
   - Add `content-visibility: auto; contain-intrinsic-size: ...` to heavy sections (`services`, `results`, etc.) to reduce initial layout/paint costs.

## 2) JavaScript runtime efficiency

1. **Unify scroll work into a single frame loop**
   - Current code handles scroll in several places (Lenis callbacks + native scroll listeners).
   - Centralize all scroll-derived updates in one `requestAnimationFrame` pipeline to avoid duplicated calculations and style writes.

2. **Batch DOM reads then writes**
   - In parallax update logic, `getBoundingClientRect()` and `style.transform` are interleaved per element.
   - Read all rects first, compute transforms, then write styles in one pass to avoid layout thrash.

3. **Gate expensive effects by device capability, not only width**
   - Add lightweight capability checks (`navigator.hardwareConcurrency`, `deviceMemory` where available).
   - Serve “lite” animation profile to low-end devices regardless of viewport size.

4. **Use passive listeners everywhere applicable**
   - Some listeners are already passive; enforce as a project rule for scroll/touch/wheel-related listeners.

5. **Avoid unnecessary string allocations in hot paths**
   - Reuse computed values and avoid repeatedly constructing transform strings unless the value changed.

## 3) CSS and rendering efficiency

1. **Promote only frequently animated elements to compositor layers**
   - Add `will-change: transform, opacity` sparingly (hero animated elements only).
   - Remove `will-change` after transitions complete where possible.

2. **Audit paint-heavy visual effects**
   - Blur/glow gradients and layered effects can be expensive.
   - Keep branding style, but simplify the number of overlapping translucent layers on small devices.

3. **Limit large repaint regions**
   - Encapsulate animated sections with `contain` properties where safe.

## 4) Network/loading efficiency

1. **Self-host and subset fonts**
   - Replace broad Google Fonts request with local subset files (`woff2`) containing only used glyph ranges and weights.

2. **Use modern image formats + responsive sources**
   - Ensure OG and any future trust logos/photos are WebP/AVIF with explicit dimensions.

3. **Long-cache immutable static assets**
   - Configure cache headers for hashed bundles and static media.

4. **Inline truly critical CSS**
   - Inline minimal hero/nav CSS and defer the rest to reduce render blocking.

## 5) Measurement and governance

1. **Set performance budgets in CI**
   - Example budgets: JS < 170KB gzip, CSS < 45KB gzip, LCP < 2.5s on mobile emulation.

2. **Track Core Web Vitals in production**
   - Add RUM collection for LCP/CLS/INP and tie regressions to releases.

3. **Create “performance modes”**
   - `full`, `balanced`, `lite` modes selected at runtime by capability + reduced motion preference.

4. **Run quarterly dependency & bundle audits**
   - Validate Lenis and any future libraries for cost/benefit and tree-shaking quality.

## Suggested rollout order

1. Implement quick wins 1–3 and ship behind a feature flag.
2. Consolidate scroll/parallax work into one loop.
3. Font optimization (subset + self-host).
4. Add Web Vitals instrumentation + budgets.
5. Iterate visual effects based on measured impact, not assumptions.

## Success criteria

- Better Lighthouse Performance score on mobile.
- Lower Total Blocking Time / INP during hero interaction.
- Reduced CPU usage while scrolling.
- No visual regressions in hero brand experience.
