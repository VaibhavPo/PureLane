# Purelane — Dawn Theme Conversion Implementation Plan

Convert the existing Shopify Dawn theme to match the supplied reference HTML design.

---

## Visual Verification

I've opened the reference HTML and captured screenshots of every section. Here's what I see:

### Hero Section
![Hero section with "CLEAN THAT LASTS" heading, product bottles, and badge rail](C:\Users\vaibh\.gemini\antigravity\brain\9f557423-af51-4cc0-85da-db143c94d1de\hero_section.png)

### Ingredients + Pillars + Proof Section
![Ingredients grid, pillars cards, and proof section with product rotator](C:\Users\vaibh\.gemini\antigravity\brain\9f557423-af51-4cc0-85da-db143c94d1de\pillars_proof_section.png)

### Bundles Section
![Bundle tier cards - Starter (2), Most Popular (3), Whole Home (5)](C:\Users\vaibh\.gemini\antigravity\brain\9f557423-af51-4cc0-85da-db143c94d1de\bundles_section.png)

### Shop / Product Grid
![4-column product grid with glass cards, badges, prices](C:\Users\vaibh\.gemini\antigravity\brain\9f557423-af51-4cc0-85da-db143c94d1de\shop_section.png)

### Footer + Signup + Trust Bar
![Email signup, trust bar, and footer with 4-column layout](C:\Users\vaibh\.gemini\antigravity\brain\9f557423-af51-4cc0-85da-db143c94d1de\footer_section.png)

---

## Key Visual Observations

After inspecting the live render, here's what I've confirmed:

| Aspect | Detail |
|--------|--------|
| **Background** | Animated gradient (mint greens → teals) with SVG water caustic lines, light shafts, and floating bubbles. Fixed position behind all content. Changes gradient as user scrolls through "scenes" |
| **Nav** | Floating pill-shaped glassmorphism nav bar, fixed ~38px from top. Brand logo + "PURELANE / CLEAN, SIMPLY" on left. 5 nav links centered. Search, account, cart icons on right. Purple badge counter on cart |
| **Ticker** | Scrolling marquee bar at very top: "Free shipping ON EVERY BUNDLE ACROSS INDIA · 100% plant-based AND NON-TOXIC · LOVED BY 30,000+ HAPPY HOMES · BUY 3 AT FLAT ₹499" |
| **Hero** | Left: massive "CLEAN THAT LASTS" heading (Outfit 800, ~112px). "LASTS" in amber/gold. Decorative leaf rule. Lede text. Two CTA buttons (teal primary, glass ghost). Right: 3-slide product rotator showing 1→2→3 bottle SVGs with price tags. Right edge: vertical glassmorphism badge rail (3 badges) |
| **Product images** | SVG bottle illustrations — purple/violet bottle shapes with labels. NOT photographs. These are base64 SVGs defined in CSS custom properties |
| **Glass cards** | White-dominant with ~80% opacity, subtle backdrop-blur, very light purple borders, rounded 26px corners, subtle shadows. `linear-gradient(158deg,rgba(255,255,255,.80),...` |
| **Typography** | Headings: Outfit 800, uppercase, near-black `#17102b`. Body: Inter 400-600, dark purple `rgba(36,26,61,.78)`. Kickers: 11px, 700, `.22em` letter-spacing, uppercase |
| **Buttons** | Primary: teal gradient `#00706a → #004b46`, white text, pill-shaped. Ghost: white 66% bg, purple border, dark text |
| **Colors** | Light mode. Body bg: `#f4f0fb`. Card bg: white/frosted. Accents: amber `#b8701c`, green checks `#4f7d10`, teal buttons `#00706a`, purple ink `#241a3d` |
| **Product grid** | 4×2 grid (8 cards). Row 1: placeholder SVG bottles. Row 2: detailed inline SVG bottles with full label art. Glass card style. Badge pills top-left ("BEST SELLER", "TOP RATED", "NEW"). Star rating, price row with strikethrough |
| **Bundles** | 3-column grid of tier cards. Each has: tag pill, product preview row, large quantity number, pricing with strikethrough, feature checklist with green checks, CTA button. Middle card ("MOST POPULAR") has amber border highlight and teal primary CTA |
| **Reviews** | Auto-scrolling horizontal marquee below hero. Glass-2 cards with stars, title, body, reviewer name. Edge-faded with CSS mask-image |
| **Combos** | Horizontal scroll rail with 5 combo cards. Each has: tray area with product images + "+" signs, body with title/count/description/pricing/CTA |
| **Additional sections** | Ingredients (5-col botanical SVG grid), Pillars (3-col "how it works"), Proof ("Why it works" + product rotator + stats), Full Range (product strip), Why Bundles (4-col benefits), Categories (4 category cards), Trust Bar (4-item icon bar), Signup (email + CTA) |
| **Progress rail** | Fixed right-side dot navigation (visible at ≥1180px) |
| **Sticky CTA** | Fixed bottom bar on mobile (<960px): "Pick any 3, pay ₹499" + "BUILD BUNDLE" button |

---

## User Review Required

> [!IMPORTANT]
> **Scope Clarification — More Than 5 Sections**: The reference page actually has **~12 distinct sections**, not 5. Your brief requested these 5:
> 1. `section.hero` ✅
> 2. `#shop` — Product Grid ✅
> 3. `#combos` — Best-selling Combos ✅
> 4. `#bundles` — Bundles ✅
> 5. `#reviews` — Reviews Rail ✅
>
> But the reference also includes:
> 6. **Ticker** — Scrolling announcement marquee
> 7. **Ingredients** — 5-column botanical ingredient grid
> 8. **Pillars** — "How it works" 3-column cards
> 9. **Proof** — "Why it works" with product rotator + stats
> 10. **Full Range** — Product strip showcase
> 11. **Why Bundles** — 4-column benefits grid
> 12. **Categories** — 4 bundle category cards
> 13. **Trust Bar** — 4-item icon bar
> 14. **Signup** — Email newsletter capture
> 15. **Sticky CTA** — Mobile bottom bar
>
> **Should I implement all 15 sections for pixel-accuracy, or only the 5 you specified?** I recommend all 15 since they're part of the cohesive design.

> [!IMPORTANT]
> **Background Animation**: The reference has an elaborate fixed background with SVG water caustics, animated gradient scenes that change on scroll, floating bubbles, and light shafts. This is ~50KB of inline SVG + ~150 lines of JS. Should I:
> - **(A) Include it** as a layout-level snippet for full pixel-accuracy, or
> - **(B) Omit it** and use a simpler CSS gradient approximation?

> [!IMPORTANT]
> **Nav/Header & Footer**: The reference has custom designs that differ significantly from Dawn's default. Should I:
> - **(A) Create custom Purelane header/footer sections**, or
> - **(B) Keep Dawn's defaults** and only implement the body sections?

> [!WARNING]
> **Product Images**: The reference uses **SVG bottle illustrations** (not photos). In Shopify, products will use `product.featured_image`. The visual appearance will differ until product images are uploaded. I will include the SVG fallbacks for empty products.

---

## Open Questions

1. **All 15 sections or just 5?** (See above)
2. **Products & Collections**: Are Purelane products already in your Shopify store?
3. **Combo products**: Are combos separate Shopify products, or should combos be assembled from individual product picks in the Theme Editor?
4. **Bundle pricing** (₹349/₹499/₹799): Are these Shopify automatic discounts, or display-only from settings?

---

## Proposed Changes

### CSS Foundation

#### [NEW] [purelane.css](file:///d:/Code/pureLane/assets/purelane.css)

Single CSS file with all Purelane styles (~1800 lines), organized:
- CSS custom properties (light theme palette)
- Typography system (Outfit headings + Inter body)
- Glassmorphism classes (`.glass`, `.glass-2`)
- Button system (`.btn-primary` teal, `.btn-ghost` white)
- Animation classes (`.rv` reveal, `@keyframes marq`, `@keyframes tick`)
- All section-specific layout styles
- Fluid responsive (not breakpoint-only)
- `prefers-reduced-motion` support

---

### Reusable Snippets

#### [NEW] [purelane-product-card.liquid](file:///d:/Code/pureLane/snippets/purelane-product-card.liquid)
Glass card with: image area (150px, gradient bg), badge pill, product title, star rating, price/compare-at/discount, "Add to cart" button. Data from Shopify `product` object.

#### [NEW] [purelane-combo-card.liquid](file:///d:/Code/pureLane/snippets/purelane-combo-card.liquid)
Combo card with: tray area (product images + "+" signs + flag badge), body (title, count, description, pricing row, CTA). Horizontally scrollable rail item, 302px flex-basis.

#### [NEW] [purelane-bundle-tier.liquid](file:///d:/Code/pureLane/snippets/purelane-bundle-tier.liquid)
Tier card with: tag pill, product preview row, big quantity number, pricing with strikethrough, per-product cost, feature checklist with green checks, full-width CTA. Middle card gets amber border + primary CTA.

#### [NEW] [purelane-review-card.liquid](file:///d:/Code/pureLane/snippets/purelane-review-card.liquid)
Review card for marquee: stars, title, body text, reviewer attribution with verified check icon. 284px wide, glass-2 style.

---

### Section Files (5 Required + Additional)

#### [NEW] [purelane-hero.liquid](file:///d:/Code/pureLane/sections/purelane-hero.liquid)

Full-viewport hero with:
- Left: 3-line heading ("CLEAN / THAT / LASTS"), decorative leaf rule, lede text, 2 CTA buttons, mobile badge strip
- Right: Product stage with 3 auto-rotating slides (1→2→3 bottles), price tag overlay, dot navigation
- Far right: Vertical glassmorphism badge rail (desktop only, 3 badges)
- Background: transparent (sits over animated scenes background)
- Slide autoplay with IntersectionObserver pause, mouseenter/leave handlers

**Schema**: Heading lines (×3), lede, CTA buttons (×2), badge blocks (max 3), slide blocks (max 3 — each with product picks + pricing)

---

#### [NEW] [purelane-reviews.liquid](file:///d:/Code/pureLane/sections/purelane-reviews.liquid)

Auto-scrolling horizontal marquee:
- Header: kicker, aggregate stars + rating, review count, homes count
- Rail: CSS `@keyframes marq` infinite scroll, edge-masked with `mask-image`
- Cards duplicated for seamless loop, pause on hover/focus

**Schema**: Kicker, rating, count text, review blocks (max 10 — rating, title, body, name, product)

---

#### [NEW] [purelane-combos.liquid](file:///d:/Code/pureLane/sections/purelane-combos.liquid)

Horizontally scrollable combo rail:
- Panel header with kicker, heading, rule, lede
- `scroll-snap-type: x mandatory` rail with combo cards
- Swipe cue + footnote below

**Schema**: Header texts, combo blocks (max 6 — title, products ×3, pricing, flag, CTA style)

---

#### [NEW] [purelane-bundles.liquid](file:///d:/Code/pureLane/sections/purelane-bundles.liquid)

Glass panel with 3-column tier grid:
- Header panel with kicker + heading + lede
- 3 tier cards with product preview images, quantity, pricing, features, CTA
- Middle "best" card highlighted with amber border

**Schema**: Header texts, tier blocks (max 3 — tag, quantity, pricing, features ×3, products ×5, is_best flag)

---

#### [NEW] [purelane-shop.liquid](file:///d:/Code/pureLane/sections/purelane-shop.liquid)

4×2 product grid (8 cards):
- Panel header with "BESTSELLERS" kicker, heading, decorative rule
- Glass product cards via snippet
- 4 columns desktop, 2 columns mobile

**Schema**: Header texts, collection picker or product blocks (max 12), badge text per product

---

#### Additional Sections (if approved)

| Section | File | Description |
|---------|------|-------------|
| Ticker | `purelane-ticker.liquid` | Scrolling marquee announcement bar |
| Ingredients | `purelane-ingredients.liquid` | 5-column botanical ingredient grid in glass panel |
| Pillars | `purelane-pillars.liquid` | 3-column "how it works" cards |
| Proof | `purelane-proof.liquid` | "Why it works" split + product rotator + stats bar |
| Full Range | `purelane-range.liquid` | Product strip showcase |
| Why Bundles | `purelane-why-bundles.liquid` | 4-column benefits grid |
| Categories | `purelane-categories.liquid` | 4 bundle category cards |
| Trust Bar | `purelane-trust.liquid` | 4-item icon bar |
| Signup | `purelane-signup.liquid` | Email newsletter glass panel |
| Sticky CTA | `purelane-sticky-cta.liquid` | Fixed mobile bottom bar |

---

### JS & Template Changes

#### [NEW] [purelane-section.js](file:///d:/Code/pureLane/assets/purelane-section.js)

Shared JS (~200 lines):
- Scroll-reveal IntersectionObserver
- Hero slide rotator (autoplay, pause, dots)
- Product rotator (auto-cycle with dots)
- Review marquee play/pause
- Scene switcher (scroll-driven background changes)
- `shopify:section:load` / `shopify:section:unload` handlers
- `prefers-reduced-motion` guard

#### [MODIFY] [index.json](file:///d:/Code/pureLane/templates/index.json)

Replace current `image_banner` + `featured_collection` with Purelane sections.

#### [MODIFY] [theme.liquid](file:///d:/Code/pureLane/layout/theme.liquid)

Add Google Fonts preconnect + Outfit/Inter stylesheet.

---

## Data Architecture

| Content | Source | Notes |
|---------|--------|-------|
| Product title | `product.title` | Shopify native |
| Product price | `product.price` | Shopify native |
| Compare-at price | `product.compare_at_price` | Shopify native |
| Product image | `product.featured_image` | With `image_url` filter, SVG fallback |
| Product URL | `product.url` | Shopify native |
| Availability | `product.available` | Shopify native |
| Badge text | Block setting | "Best seller", "New", etc. |
| Review content | Block settings | Title, body, name, rating |
| Combo content | Block settings | Custom bundle configurations |
| Bundle tiers | Block settings | Pricing/features for each tier |
| Aggregate stats | Section settings | Rating, review count |

No metafields required for initial implementation.

---

## Implementation Order

| Phase | Task | Est. |
|-------|------|------|
| 1 | CSS foundation (`purelane.css`) | — |
| 2 | Reviews section + review card snippet | — |
| 3 | Shop section + product card snippet | — |
| 4 | Combos section + combo card snippet | — |
| 5 | Bundles section + bundle tier snippet | — |
| 6 | Hero section (most complex) | — |
| 7 | Additional sections (if approved) | — |
| 8 | JS + Theme Editor lifecycle | — |
| 9 | Template integration (`index.json`, `theme.liquid`) | — |
| 10 | Visual validation at all breakpoints | — |

---

## Verification Plan

### Browser Testing
Test at: 375px, 390px, 430px, 768px, 1024px, 1280px, 1440px

### Checks
- [ ] Spacing/typography match reference
- [ ] Glass effects render correctly
- [ ] Product data pulls from Shopify
- [ ] Buttons/hover states work
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Sections work independently in Theme Editor
- [ ] Blocks can be added/removed/reordered
- [ ] Keyboard navigation through all interactive elements
- [ ] Scroll reveal triggers correctly
- [ ] Marquee pauses on hover/focus
