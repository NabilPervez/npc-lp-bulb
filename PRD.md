# PRD — NPC Landing: Idea to Money

Oct 16, 2026 · @Nabil Pervez

## Summary and goals

One landing page that walks a visitor through NPC's process as a single light bulb changes form, from napkin doodle to automated production line, and converts them into a booked call.

**Story:** We take the idea in your head and turn it into money. The bulb is the idea; each scroll stage is one NPC service.

**Problem:** NPC's offer (branding, design, development, automation) reads as a list of services. Visitors don't see the path or what each step costs, so they don't book.

**Goals and metrics** (targets are estimates, set after 30 days of baseline data):

| Goal | Metric | Target |
| --- | --- | --- |
| Book calls | Visitor to booked-call rate | 2% |
| Make the price clear | Pricing section reached | 35% of visitors |
| Sell the bundle | Share of bookings that pick Full Journey | 30% |
| Feel premium, load fast | Mobile LCP | under 2.5 s |

## Audience and positioning

B2B small and mid-size business founders and premium professionals, age 28–55, who have an idea but not the brand or tech to launch it. NPC is *the premium upgrade*: Fortune 500 process, founder-sized engagement.

- **Why:** We love taking ideas out of people's heads and shaping them into reality.
- **How:** A design and build process refined with Fortune 500 teams.
- **What:** Branding, design, development and automation.
- **Voice:** first person to "you", label → promise → proof, every claim carries a number, no emoji.

## Page structure

One sticky bulb figure stays on screen while copy scrolls past; scroll position sets the bulb's stage and slowly turns it. On phones the figure sits above each copy block instead of beside it.

1. **Hero — Napkin.** "Have an idea for your business?" Pen-drawn bulb on a napkin. Primary CTA: Book a free call.
2. **Sketch — Creative Brief.** Bulb redrawn with pencil hatching, construction lines and margin notes. We pin down who it's for and why it wins.
3. **Blueprint — Brand Identity.** Bulb as a logo mark on a drafting sheet with dimensions and numbered callouts. Logo, palette, type, guidelines.
4. **Launch — Go-to-Market.** Fully shaded bulb whose filament lights up. Positioning, messaging, launch plan.
5. **Website — Web Build.** The lit bulb as the product on a mock site in a browser frame. Design, build, SEO, analytics.
6. **Conveyor — AI Automation.** Many bulbs moving down a belt. Lead capture, CRM, follow-ups and content run on their own.
7. **CTA band.** "We can build it for you." Book a call.
8. **Pricing.** Six promo cards, bundle card, configurator (next section).
9. **Final CTA + short FAQ.**

Every stage section carries a small "Start here · $X" link. A sticky "Book a call" button shows after the hero, because most landing-page visitors never reach the bottom.

## Pricing

Six promo cards, one per stage, each showing that stage's bulb as a small live anatomy figure, then a Full Journey bundle card and a configurator. All prices are estimates to confirm against Playbook 1 · Services Offered before launch.

| Stage | Card visual (bulb version) | What you get | Price |
| --- | --- | --- | --- |
| Napkin · Discovery | Pen outline on a napkin | 30-min call, idea teardown, recommended path | Free |
| Sketch · Creative Brief | Pencil-hatched bulb with margin notes | Audience, positioning, competitors, brief doc | $1,500 |
| Blueprint · Brand Identity | Bulb logo on a drafting sheet with callouts | Logo (2–3 directions), palette, type, guidelines | $3,000 |
| Launch · Go-to-Market | Shaded bulb, filament glowing | Messaging, offer, channel and launch plan | $2,500 |
| Website · Web Build | Lit bulb inside a browser frame | Up to 5 pages, responsive, SEO, GA4, hosting setup | from $5,000 |
| Conveyor · AI Automation | Bulbs on a moving belt | 2–3 automations: lead capture, CRM, follow-up | from $4,000 |

**Full Journey bundle:** all five paid stages. Show the separate total ($16,000) struck through, then the bundle price $14,400 (10% off). The bundle card's visual is the full morph playing on hover.

**Entry offer:** the Creative Brief doubles as the "Idea Sprint", a low-risk first purchase that credits toward the bundle if they upgrade within 30 days.

**Card behavior:**

- Cards are flat at rest with a gold hairline; on hover the card lifts 2px, its bulb turns 30° and the siblings fade (NPC signature hover).
- Each card's bulb renders once as a static SVG and animates only on hover or when it scrolls into view on mobile.
- Each card ends in "Book this stage", which opens the scheduler with that stage pre-selected.

**Configurator** (below the cards): toggle stages on and off; a bulb assembles from the chosen stages and a running total updates, applying 10% when all five are on. Button: "Book a call about this build."

## Visual system

The page uses the NPC Design System (near-black navy ink, one champagne-gold accent, Cormorant Garamond headlines, Outfit body, gold hairlines), with /anatomy figures drawn in those tokens.

| Stage | Line and paper treatment |
| --- | --- |
| Napkin | Single wobbly pen stroke, warm off-white napkin texture, no shading |
| Sketch | Graphite hatching (four densities, like the washer's hx1–hx4), construction lines |
| Blueprint | Drafting sheet, gold hairline grid, dimensions and numbered callouts |
| Launch | Solid four-tone shading, gold glow from the filament |
| Website | Same lit bulb, framed in a minimal browser mock in NPC type |
| Conveyor | Repeated bulbs on a belt, steady linear motion |

**Deviation flagged:** a classic blueprint is blue, but the design system allows no third hue. Proposal: render the blueprint stage as gold lines on ink (`--ink-880`) rather than blue. Needs your call.

**Motion:** one curve, `cubic-bezier(.4,0,.2,1)`, no bounce or parallax beyond the bulb turn. Reduced motion shows each stage as a still figure.

## Technical approach

A static site of plain HTML, CSS and JS on Netlify, reusing the /anatomy iso-kit and lathe code from the NPC-WM90 washer.

- **Bulb geometry:** one lathe profile (globe, neck, threaded base) via `G.solidOf`; threads via `G.ribsOf`. Every stage reuses it.
- **Stage styles:** CSS theme variables per stage, so geometry code never forks.
- **Scroll control:** IntersectionObserver picks the active stage; scroll progress inside a stage drives azimuth (reuses `setAzimuth`). Transitions use /anatomy-reveal.
- **Caching:** cache each stage's SVG per azimuth step, as the washer caches door angles.
- **Performance budget:** under 250 KB JS+CSS gzipped; only the on-screen figure animates; promo-card bulbs are pre-rendered static SVG until hover.
- **Accessibility:** each figure has a text label; the configurator is keyboard operable; contrast passes AA.

## CTA and scheduling

Every CTA opens one inline scheduler for a 30-minute discovery call, passing the chosen stage or configurator selection as a pre-filled field.

- **CTA placements:** hero, sticky button, "Start here" per stage, CTA band, each promo card, configurator, final CTA.
- **Scheduler:** Cal.com or Calendly embed (open question) with 3 qualifying fields: business, stage of interest, budget range.
- **After booking:** confirmation screen plus email with a one-page "what to bring" prep sheet.
- **Analytics:** GA4 events for scroll depth at 25/50/75/100%, stage viewed, CTA clicked (with placement), card hovered, configurator changed, call booked.

## Scope, risks and open questions

**Out of scope for v1:** online payment, client portal, blog, case-study pages, CMS.

**Risks:**

- Six live figures are heavy on phones → one live figure at a time, static cards.
- Prices below past work (a $7,000 deck in 2025) could undercut the premium position → confirm the rate card first.
- "Fortune 500" needs proof without breaching NDAs or day-job policy → use outcomes and numbers, check before naming employers.

**Open questions:**

- [ ] Confirm stage prices and the 10% bundle\
Yes and yes.
- [ ] Blueprint stage: gold-on-ink, or allow blue as an exception?\
Blue background. White. whatever looks like a classical blueprint
- [ ] Scheduler: Cal.com or Calendly?\
<https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ0kZar29aYDXn9vfvL2JZVskJndufzirA6liCU2CDAtOy8WH6iAmvJj_05lGjat4NuH2U-QO_4->
- [ ] Which proof points and client names can we show?\
Red Bull

  Paramount Pictures

  Funny Or Die

  LEGO

  The Kraft Group

  Activision Blizzard

  Coca-Cola

  Riot Games
- [ ] Cisco's role on the page (team section, credits)?\
Creative Director\
\
PORTFOLIOS\
<https://nabilpervez.com/portfolio>\
\
<https://www.behance.net/aoecreative>\
[\
https://www.behance.net/blastradius](https://www.behance.net/blastradius)

## Definition of done and build passes

v1 is done when a visitor on a phone can scroll all six stages, compare prices, and book a call in under 2 minutes, with Lighthouse mobile performance 90+ and accessibility 95+.

1. **Bulb profile** plus the Napkin stage, rotating, in NPC tokens.
2. **Remaining five stage styles** and the conveyor scene.
3. **Sticky scroll story** with copy, CTAs and the sticky button.
4. **Pricing:** six promo cards with stage bulbs, bundle card, configurator.
5. **Scheduler and GA4 events** wired and tested.
6. **QA:** mobile, reduced motion, keyboard, performance budget.
7. **Deploy to Netlify**, then write the README.

Next steps in the build order: sprint plan, then AGENTS.md/CLAUDE.md.
