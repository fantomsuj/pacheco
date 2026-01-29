# Pacheco Landing Page Improvement Plan

## Project Overview
Strategic advisory firm landing page redesign. Premium dark theme with Arizona sunset aesthetics, targeting high-value clients in corporate strategy, venture capital, and public affairs.

**Status:** Planning phase - awaiting client feedback on specific details

---

## Current State Assessment

### Strengths
- Sophisticated particle canvas animation in hero
- Strong color palette (terracotta/gold accents on dark)
- Good typography hierarchy (Playfair Display + Manrope)
- Solid performance optimizations (throttling, visibility API, reduced motion)
- Mobile responsive with hamburger menu

### Areas for Improvement
- [ ] Hero section could have stronger visual impact
- [ ] Trust logos are placeholder/text-based - need real assets
- [ ] Testimonials need verification (celebrity names used)
- [ ] Contact form lacks validation and backend integration
- [ ] No analytics or conversion tracking
- [ ] SEO metadata incomplete
- [ ] No loading states or skeleton screens
- [ ] Accessibility could be enhanced (ARIA labels, focus indicators)

---

## Improvement Roadmap

### Phase 1: Content & Assets (Awaiting Client)

**Client Deliverables Needed:**
- [ ] Actual client logos (Arizona Cardinals, Freeport-McMoRan, APS, Phoenix Suns - or replacements)
- [ ] Verified testimonials with permissions
- [ ] Team photos/headshots (if adding team section)
- [ ] Case study details for portfolio
- [ ] Contact form destination (email, CRM integration?)
- [ ] Brand guidelines (if any beyond current design)
- [ ] Legal copy (privacy policy, terms)

### Phase 2: Design Enhancements

#### Hero Section
- [ ] Add subtle video background option (desert landscape, optional)
- [ ] Improve particle canvas performance on mobile
- [ ] Add scroll-triggered parallax for depth
- [ ] Consider animated text reveal for headline

#### Visual Polish
- [ ] Add micro-interactions to service cards (icon animations)
- [ ] Improve hover states with more feedback
- [ ] Add loading shimmer effects
- [ ] Refine mobile spacing/typography

#### New Sections to Consider
- [ ] **Case Studies:** Before/after outcomes with metrics
- [ ] **Team Section:** Key principals with bios
- [ ] **Process/Timeline:** How engagements work
- [ ] **FAQ:** Common questions about services
- [ ] **Blog/Insights:** Thought leadership (future)

### Phase 3: Technical Improvements

#### Performance
- [ ] Lazy load below-fold content
- [x] Optimize font loading (font-display: swap) - already in place
- [x] Add preconnect hints for Google Fonts - added dns-prefetch for gtag
- [ ] Consider self-hosting fonts
- [ ] Compress and optimize any added images
- [ ] Add critical CSS inlining

#### SEO & Meta
- [x] Complete Open Graph tags (added image dimensions, site_name, locale)
- [x] Add Twitter Card meta (added creator)
- [x] Structured data (Organization, ProfessionalService/LocalBusiness)
- [ ] XML sitemap
- [ ] robots.txt
- [x] Canonical URLs

#### Accessibility
- [x] Full ARIA label audit (nav, buttons, forms, sections)
- [x] Enhanced focus indicators (focus-visible styles)
- [x] Skip navigation improvements (better styling, focus state)
- [x] Screen reader only class (.sr-only)
- [x] Reduced motion preferences support
- [ ] Color contrast verification
- [ ] Screen reader testing

#### Forms & Integration
- [x] Client-side form validation (real-time on blur, submit validation)
- [x] Success/error state handling (visual feedback, messages)
- [ ] Backend integration (Netlify Forms, Formspree, or custom)
- [ ] CAPTCHA/spam protection
- [ ] Email confirmation flow

### Phase 4: Analytics & Conversion

- [x] Google Analytics 4 setup (placeholder ready - replace GA_MEASUREMENT_ID)
- [x] Conversion tracking (form submissions, CTA clicks, phone clicks)
- [x] Scroll depth tracking (25%, 50%, 75%, 100% milestones)
- [x] Section visibility tracking
- [x] Time on page tracking
- [ ] Heatmap integration (Hotjar, Microsoft Clarity)
- [ ] A/B testing infrastructure
- [ ] Core Web Vitals monitoring

### Phase 5: Parallax & Visual Enhancements (NEW)

- [x] Scroll-based parallax for hero elements
- [x] Parallax for sunset atmosphere layers (different speeds)
- [x] Parallax for hero content (eyebrow, title, subtitle, actions)
- [x] Mobile and reduced-motion safe (disabled when appropriate)
- [x] GPU-accelerated transforms

---

## Design System Notes

### Colors (CSS Variables)
```css
--color-accent: #c96c4d      /* Primary terracotta */
--color-gold: #d4a574        /* Secondary gold */
--color-bg-primary: #0a0a0a  /* Dark background */
--color-bg-secondary: #111   /* Card backgrounds */
```

### Typography
- **Display:** Playfair Display (serif)
- **Body:** Manrope (sans-serif)
- **Mono:** JetBrains Mono (accents/labels)

### Animation Timing
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo)
- Standard duration: 300-500ms
- Stagger delay: 100ms

---

## File Structure
```
shanghai/
├── index.html          # Main landing page
├── main.js             # Interactive features & canvas
├── style.css           # All styling (25KB)
├── favicon.svg         # Brand icon
├── newindex.html       # Alternative version (unused?)
├── package.json        # Vite build setup
└── CLAUDE.md           # This file
```

---

## Questions for Client

1. **Testimonials:** Are the current quotes (Larry Fitzgerald, Steve Nash, Jack Selby) real and approved? If not, who should we feature?

2. **Trust Logos:** Can you provide official logo files for featured clients? Current list needs verification.

3. **Contact Form:** Where should form submissions go? Options:
   - Direct email
   - CRM (HubSpot, Salesforce)
   - Slack notification
   - Custom backend

4. **Analytics:** Do you have existing Google Analytics? Should we set up new?

5. **Domain & Hosting:** What's the deployment target? (Vercel, Netlify, custom server)

6. **Additional Pages:** Should we plan for:
   - Individual service pages?
   - About/Team page?
   - Case studies?
   - Blog?

7. **Legal:** Do you have existing privacy policy/terms, or do these need to be created?

---

## Next Steps

1. Gather client feedback on questions above
2. Collect and integrate real assets (logos, photos)
3. Implement Phase 2 design enhancements
4. Set up form backend and analytics
5. Accessibility audit and fixes
6. Final QA and launch

---

*Last updated: 2026-01-29*
