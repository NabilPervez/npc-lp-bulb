# npc-lp-bulb

NPC landing page, **Idea to Money**: one light bulb changes form as you scroll — napkin doodle,
pencil sketch, blueprint, lit bulb, product in a browser, bulbs on a conveyor belt — and each stage
is one NPC service with its price. Spec: [PRD.md](PRD.md).

## Run it

Static site, no build step for the page itself:

```bash
npx http-server -p 5180 .
```

## How it's built

- `build/build.mjs` draws every bulb figure with the Anatomy iso kit (`build/kit/`, MIT): one
  lathe profile of a real A19/E26 bulb (60 mm globe, 108 mm tall, 3.6 mm thread pitch), split
  into parts (tip, insulator, shell, neck, globe, filament) so stages can reveal it apart → together.
  It writes `assets/figures.js`. Re-run after changing geometry: `node build/build.mjs`.
- The bulb is a body of revolution, so it is drawn once per stage; only the plates under it
  (napkin, sheet, blueprint, belt) are cached per azimuth step (9 steps, 24°–72°).
- Stage looks are CSS theme variables in `assets/style.css` (`.fig-card[data-stage=…]`); the
  geometry never forks. Sketch hatching uses four pattern densities (`#hx1`–`#hx4`).
- `assets/app.js`: scroll → stage + azimuth, reveal on stage change, conveyor motion, pricing
  cards, bundle morph, configurator, scheduler modal, GA4 events.

## Before launch

- Set `GA_ID` in `assets/app.js` to switch on GA4 (events already go to `dataLayer`).
- The scheduler is the Google Calendar appointment page. Google can't pre-fill fields, so the
  qualifying answers are shown as a line to paste into the booking notes.
- Confirmation email / prep sheet is configured in Google Calendar, not here.
