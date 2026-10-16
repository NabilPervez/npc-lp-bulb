// Builds every bulb figure the page uses, as cached SVG strings, from one lathe profile.
// Units are millimetres of a real A19 / E26 bulb: 60 mm globe, 108 mm tall, 26 mm screw shell.
// Output: assets/figures.js (window.NPC_FIG) — stage SVGs per azimuth step, card SVGs, configurator parts.
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "./kit/iso-kit.mjs";
import * as G from "./kit/lathe.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

const W = 520;
const H = 520;
export const AZ = [24, 30, 36, 42, 48, 54, 60, 66, 72];
const UP = [0, 0, 1];

// ── Bulb profile (s = height above the contact tip, r = radius) ────────────────
const GLOBE_FROM = 33;
const GLOBE_MAX_S = 78;
const GLOBE_R = 30;
const TOP = 108;
function globeR(s) {
  if (s >= GLOBE_MAX_S) return Math.sqrt(Math.max(0, GLOBE_R ** 2 - (s - GLOBE_MAX_S) ** 2));
  const t = (s - GLOBE_FROM) / (GLOBE_MAX_S - GLOBE_FROM);
  return 15 + 15 * Math.sin((Math.PI / 2) * t) ** 1.25;
}
const globeProfile = [];
for (let i = 0; i <= 14; i++) {
  const t = i / 14;
  const s = GLOBE_FROM + (TOP - 0.15 - GLOBE_FROM) * (1 - (1 - t) ** 1.35);
  globeProfile.push([s, globeR(s), 1]);
}
// screw shell: thread crests every 3.6 mm (E26 pitch), drawn as a smooth wave
const shellProfile = [];
for (let s = 6; s <= 25.001; s += 0.6) {
  const crest = 0.5 + 0.5 * Math.cos(((s - 6) / 3.6) * Math.PI * 2);
  shellProfile.push([s, 12.6 + 0.9 * crest, 1]);
}

// One bulb, as named part groups painted bottom to top (the explode order of the reveal).
function bulb(P, at = [0, 0, 0], { inside = true } = {}) {
  const F = G.frameOf(at, UP, [1, 0, 0], [0, 1, 0]);
  const S = (paths, style) => k.solidSvg(paths, style);
  const L = (d, style) => k.lineSvg(d, style);
  const p = (z) => [at[0], at[1], at[2] + z];
  const parts = {};
  parts.tip = S(G.solidOf([[0, 3.2], [1.2, 4.6, 1], [2.6, 4.8]], F, P), { tone: "hi", className: "b-tip" });
  parts.insulator = S(G.solidOf([[2.6, 8.6], [4.2, 9.6, 1], [6, 10.2]], F, P), { tone: "mid", className: "b-ins" });
  // E26 screw shell: 26.5 mm across, thread crests every 3.6 mm drawn as visible rings
  const crests = [];
  for (let s = 7.8; s < 25; s += 3.6) crests.push(G.arcOf(F, s, 13.25, P), G.arcOf(F, s + 1.8, 13.25, P));
  parts.shell = S(G.solidOf([[6, 13.25], [25, 13.25]], F, P, { steps: 40 }), {
    tone: "hi",
    className: "b-shell",
    inner: L(crests.filter((_, i) => i % 2 === 0).join(""), { tone: "mid" }) + L(crests.filter((_, i) => i % 2).join(""), { tone: "faint" }),
  });
  parts.neck = S(G.solidOf([[25, 13.4], [27, 14.2, 1], [30, 14.6, 1], [33, 15]], F, P), {
    tone: "hi",
    className: "b-neck",
    inner: L(G.arcOf(F, 28.5, 14.4, P), { tone: "lo" }),
  });
  parts.globe = S(G.solidOf(globeProfile, F, P, { steps: 48, smooth: { rows: 3 } }), {
    tone: "hi",
    className: "b-globe",
    inner: L(G.arcOf(F, GLOBE_MAX_S, GLOBE_R, P), { tone: "faint", className: "b-equator" }),
  });
  if (inside) {
    // stem press, two lead-in wires, a coiled tungsten filament between them, and its glow anchor
    const stem = S(G.solidOf([[33, 5.5], [40, 3.4, 1], [52, 2.6, 1], [55, 3.4]], F, P), { tone: "mid", className: "b-stem" });
    const wires = [-7, 7].map((x) => k.segment(p(0).map((v, i) => v + [x * 0.4, 0, 50][i]), [at[0] + x, at[1], at[2] + 68], P)).join("");
    const coil = [];
    const turns = 9;
    for (let i = 0; i <= turns * 8; i++) {
      const t = i / (turns * 8);
      const a = t * turns * Math.PI * 2;
      coil.push(k.iso([at[0] - 7 + 14 * t, at[1] + Math.sin(a) * 1.4, at[2] + 68 + Math.cos(a) * 1.4 + Math.sin(t * Math.PI) * 3], P));
    }
    const coilD = "M" + coil.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L");
    const ends = [k.iso([at[0] - 7, at[1], at[2] + 68], P), k.iso([at[0] + 7, at[1], at[2] + 68], P)];
    parts.inside =
      `<g class="b-inside">${stem}${L(wires, { tone: "mid" })}<path class="iso-line b-filament" data-tone="lit" d="${coilD}"/>${k.dotsSvg(ends, { size: 0.9, tone: "hi" })}</g>`;
  }
  return parts;
}
const ORDER = ["tip", "insulator", "shell", "neck", "globe", "inside"];
// how far each part rises (mm) at full explode, for the reveal between stages
export const LIFT = { tip: 0, insulator: 5, shell: 12, neck: 22, globe: 46, inside: 34 };
const bulbSvg = (parts) => ORDER.filter((n) => parts[n]).map((n) => `<g data-part="${n}">${parts[n]}</g>`).join("");

// ── Stage scenes ───────────────────────────────────────────────────────────────
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (pts, style) => k.dotsSvg(pts, style);
const halo = (plan, z, h, P) => `<path class="iso-halo" d="${k.haloOf(plan, z, h, P)}"/>`;

function socketRing(P) {
  // the small brass collar every stage bulb stands in
  const F = G.frameOf([0, 0, 0], UP, [1, 0, 0], [0, 1, 0]);
  return S(G.ringBand(-1.5, 1.2, 11, 16, F, P), { tone: "mid", className: "socket" }) + D(G.dotsOf(F, 1.2, 13.5, 8, P), { size: 0.5, tone: "mid" });
}

const SCENES = {
  napkin: {
    bounds: [[-80, -80, -2], [80, 80, -2], [-80, 80, -2], [80, -80, -2], [0, 0, TOP + 4]],
    plate(P) {
      const nap = { x: -72, y: -72, w: 144, d: 144, r: 2 };
      const out = [halo(nap, -2.2, 1, P), S(k.slabOf(nap, -2.2, 0.8, P, 3), { tone: "lo", className: "napkin" })];
      out.push(L(k.planOutline(k.insetPlan(nap, 7), -1.4, P), { tone: "faint", dotted: true }));
      out.push(L(k.lineOnTop([-72, 0], [72, 0], -1.4, P) + k.lineOnTop([0, -72], [0, 72], -1.4, P), { tone: "faint" }));
      // a coffee ring and a few pen tests in the corner
      out.push(L(k.ring(42, -40, 15, -1.4, P, 48) + k.ring(42, -40, 13.4, -1.4, P, 48), { tone: "lo", className: "stain" }));
      out.push(L(k.lineOnTop([-60, 50], [-38, 54], -1.4, P) + k.lineOnTop([-60, 58], [-44, 61], -1.4, P), { tone: "mid", free: true }));
      return out.join("");
    },
    inside: false,
  },
  sketch: {
    bounds: [[-95, -70, -2], [95, 70, -2], [-95, 70, -2], [95, -70, -2], [0, 0, TOP + 8]],
    plate(P) {
      const sheet = { x: -90, y: -64, w: 180, d: 128, r: 1 };
      const out = [halo(sheet, -1.6, 1, P), S(k.slabOf(sheet, -1.6, 0.8, P, 2), { tone: "lo", className: "sheet" })];
      for (let y = -50; y <= 52; y += 9) out.push(L(k.lineOnTop([-86, y], [86, y], -0.8, P), { tone: "faint" }));
      out.push(L(k.lineOnTop([-70, -64], [-70, 64], -0.8, P), { tone: "lo" }));
      // margin notes: short rule lines that stand for handwriting
      [[-86, -40, 12], [-86, -31, 9], [-86, -13, 13], [-86, -4, 7], [50, 30, 28], [50, 39, 20], [50, 48, 24]].forEach(([x, y, w]) =>
        out.push(L(k.lineOnTop([x, y], [x + w, y], -0.8, P), { tone: "mid", free: true })),
      );
      // the pencil lying on the sheet
      const n = Math.hypot(1, 0.18);
      const F = G.frameOf([18, 52, 2.6], [1 / n, -0.18 / n, 0], [0, 0, 1], [0.18 / n, 1 / n, 0]);
      const hex = Array.from({ length: 6 }, (_, i) => [Math.cos((i * Math.PI) / 3) * 3.4, Math.sin((i * Math.PI) / 3) * 3.4]);
      out.push(S(G.prismOf(F, hex, 0, 52, P), { tone: "mid", className: "pencil" }));
      out.push(S(G.solidOf([[52, 3.2], [60, 1.2, 1], [62, 0.4]], F, P), { tone: "hi" }));
      out.push(S(G.disc(-7, 0, 3.4, F, P), { tone: "mid" }));
      return out.join("");
    },
    over(P) {
      // construction lines: the axis and the widest ring of the globe
      const F = G.frameOf([0, 0, 0], UP, [1, 0, 0], [0, 1, 0]);
      return (
        L(k.segment([0, 0, -1], [0, 0, TOP + 8], P), { tone: "mid", dashed: true, className: "construct" }) +
        L(G.circleOf(F, GLOBE_MAX_S, GLOBE_R + 4, P, 72), { tone: "mid", className: "construct" }) +
        L(G.circleOf(F, GLOBE_FROM, 15, P, 48), { tone: "faint", className: "construct" })
      );
    },
    inside: false,
  },
  blueprint: {
    bounds: [[-100, -76, -2], [100, 76, -2], [-100, 76, -2], [100, -76, -2], [0, 0, TOP + 6]],
    plate(P) {
      const sheet = { x: -96, y: -72, w: 192, d: 144, r: 0.5 };
      const out = [halo(sheet, -1.6, 1, P), S(k.slabOf(sheet, -1.6, 0.8, P, 2), { tone: "lo", className: "sheet" })];
      const grid = [];
      for (let x = -90; x <= 90; x += 10) grid.push(k.lineOnTop([x, -72], [x, 72], -0.8, P));
      for (let y = -70; y <= 70; y += 10) grid.push(k.lineOnTop([-96, y], [96, y], -0.8, P));
      out.push(L(grid.join(""), { tone: "faint" }));
      out.push(L(k.planOutline(k.insetPlan(sheet, 5), -0.8, P), { tone: "mid" }));
      // title block, bottom right
      const tb = { x: 40, y: 38, w: 51, d: 29, r: 0 };
      out.push(L(k.planOutline(tb, -0.8, P, 1), { tone: "mid" }));
      [45, 52, 59].forEach((y) => out.push(L(k.lineOnTop([40, y], [91, y], -0.8, P), { tone: "mid" })));
      out.push(k.faceTextSvg(k.topMatrix([43, 43], -0.8, P, "x"), "NPC · A19 / E26", { size: 3.2, tone: "hi" }));
      out.push(k.faceTextSvg(k.topMatrix([43, 50], -0.8, P, "x"), "SHEET 03 · BRAND", { size: 2.6, tone: "mid" }));
      // numbered callouts on the sheet, wired to the part they name
      const calls = [
        [[-70, 30], [0, -GLOBE_R, 78], "1"],
        [[-70, 48], [0, -14.4, 29], "2"],
        [[-52, 60], [0, -13.4, 14], "3"],
        [[-30, 64], [0, -4, 1], "4"],
      ];
      calls.forEach(([[x, y], target, n]) => {
        const a = k.iso([x, y, -0.8], P);
        const b = k.iso(target, P);
        out.push(`<path class="iso-line callout" data-tone="mid" d="M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}"/>`);
        out.push(L(k.ring(x, y, 4.6, -0.8, P, 28), { tone: "hi" }));
        out.push(k.faceTextSvg(k.topMatrix([x - 1.4, y + 1.6], -0.8, P, "x"), n, { size: 4.4, tone: "hi" }));
        out.push(D([b], { size: 1.1, tone: "hi" }));
      });
      return out.join("");
    },
    over(P) {
      // dimension lines: overall height and globe diameter, with end ticks
      const x = 46;
      const d = [];
      d.push(k.segment([x, 0, 0], [x, 0, TOP], P));
      d.push(k.segment([x - 4, 0, 0], [x + 4, 0, 0], P), k.segment([x - 4, 0, TOP], [x + 4, 0, TOP], P));
      d.push(k.segment([0, 0, TOP], [x + 4, 0, TOP], P));
      d.push(k.segment([-GLOBE_R, 0, 124], [GLOBE_R, 0, 124], P));
      d.push(k.segment([-GLOBE_R, 0, 120], [-GLOBE_R, 0, 128], P), k.segment([GLOBE_R, 0, 120], [GLOBE_R, 0, 128], P));
      const mid = k.iso([x + 3, 0, TOP / 2], P);
      const top = k.iso([0, 0, 127], P);
      return (
        L(d.join(""), { tone: "hi", className: "dim" }) +
        `<text class="dim-text" x="${mid[0].toFixed(1)}" y="${mid[1].toFixed(1)}">108</text>` +
        `<text class="dim-text" text-anchor="middle" x="${top[0].toFixed(1)}" y="${(top[1] - 3).toFixed(1)}">Ø60</text>`
      );
    },
    inside: true,
  },
  launch: {
    bounds: [[-60, -60, -16], [60, 60, -16], [-60, 60, -16], [60, -60, -16], [0, 0, TOP + 6]],
    plate(P) {
      const F = G.frameOf([0, 0, 0], UP, [1, 0, 0], [0, 1, 0]);
      const out = [`<path class="iso-halo" d="${k.haloOf({ x: -52, y: -52, w: 104, d: 104, r: 52 }, -16, 1, P)}"/>`];
      out.push(S(G.disc(-16, -10, 50, F, P), { tone: "lo", className: "plinth" }));
      out.push(S(G.disc(-10, -2, 42, F, P), { tone: "mid", className: "plinth" }));
      out.push(L(k.ring(0, 0, 36, -2, P, 96), { tone: "lo", className: "gold-line" }));
      out.push(D(G.dotsOf(F, -2, 39, 12, P, { all: true }), { size: 0.7, tone: "mid" }));
      return out.join("");
    },
    glow: true,
    inside: true,
  },
  website: {
    bounds: [[-50, -50, -12], [50, 50, -12], [-50, 50, -12], [50, -50, -12], [0, 0, TOP + 6]],
    plate(P) {
      const F = G.frameOf([0, 0, 0], UP, [1, 0, 0], [0, 1, 0]);
      const out = [`<path class="iso-halo" d="${k.haloOf({ x: -44, y: -44, w: 88, d: 88, r: 44 }, -12, 1, P)}"/>`];
      out.push(S(G.disc(-12, -2, 40, F, P), { tone: "mid", className: "plinth" }));
      out.push(L(k.ring(0, 0, 33, -2, P, 96), { tone: "lo", className: "gold-line" }));
      return out.join("");
    },
    glow: true,
    inside: true,
  },
};

const BELT = { from: -230, to: 230, y: -26, d: 52, z: 30, h: 7 };
const SLOT = 92;
SCENES.conveyor = {
  bounds: [[BELT.from - 12, -40, 0], [BELT.to + 12, 40, 0], [BELT.from - 12, 40, 0], [BELT.to + 12, -40, 0], [0, 0, BELT.z + BELT.h + TOP + 4]],
  plate(P) {
    const out = [];
    const frame = { x: BELT.from, y: BELT.y - 4, w: BELT.to - BELT.from, d: BELT.d + 8, r: 2 };
    out.push(halo(frame, 0, 1, P));
    // legs with feet
    [BELT.from + 30, 0, BELT.to - 30].forEach((x) =>
      [BELT.y - 2, BELT.y + BELT.d - 2].forEach((y) => {
        out.push(S(k.slabOf({ x: x - 3, y, w: 6, d: 4, r: 0.6 }, 0, BELT.z - 4, P, 2), { tone: "lo" }));
        out.push(S(k.slabOf({ x: x - 6, y: y - 2, w: 12, d: 8, r: 1 }, 0, 2, P, 2), { tone: "lo" }));
      }),
    );
    // rollers at both ends, turned along y
    [BELT.from, BELT.to].forEach((x) => {
      const F = G.frameOf([x, BELT.y - 4, BELT.z + BELT.h / 2], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
      out.push(S(G.disc(0, BELT.d + 8, BELT.h / 2 + 1.5, F, P), { tone: "mid" }));
    });
    out.push(S(k.slabOf({ x: BELT.from, y: BELT.y, w: BELT.to - BELT.from, d: BELT.d, r: 0 }, BELT.z, BELT.h, P, 2), { tone: "mid", className: "belt" }));
    // side rails with bolts
    [BELT.y - 4, BELT.y + BELT.d].forEach((y) => {
      out.push(S(k.slabOf({ x: BELT.from, y, w: BELT.to - BELT.from, d: 4, r: 0.6 }, BELT.z - 2, BELT.h + 5, P, 2), { tone: "lo" }));
      out.push(D([-200, -140, -80, -20, 40, 100, 160, 200].map((x) => k.iso([x, y + 2, BELT.z + BELT.h + 3], P)), { size: 0.7, tone: "mid" }));
    });
    // moving cleats on the belt top, translated by the live code
    const cleats = [];
    for (let x = BELT.from - SLOT; x <= BELT.to; x += SLOT / 4) cleats.push(k.lineOnTop([x, BELT.y + 2], [x, BELT.y + BELT.d - 2], BELT.z + BELT.h, P));
    out.push(`<g data-belt="cleats" clip-path="url(#beltclip)">${L(cleats.join(""), { tone: "lo" })}</g>`);
    const top = k.iso;
    const corners = [[BELT.from, BELT.y], [BELT.to, BELT.y], [BELT.to, BELT.y + BELT.d], [BELT.from, BELT.y + BELT.d]].map(([x, y]) => top([x, y, BELT.z + BELT.h], P));
    out.push(`<clipPath id="beltclip"><path d="M${corners.map((c) => c.map((v) => v.toFixed(1)).join(" ")).join("L")}Z"/></clipPath>`);
    return out.join("");
  },
  inside: true,
  glow: false,
};

function fit(scene, az) {
  // fit once at 45° so every azimuth step shares one scale and origin
  return k.fitProjection(scene.bounds, W, H, { pad: 36, azimuth: az });
}

// The bulb is a body of revolution, so its picture is the same at every azimuth: it is
// drawn once per stage, and only the plate under it (napkin, sheet, plinth, belt) is
// cached per azimuth step. The page stacks plate[step] + bulb + over[step].
function plateSvg(name, P) {
  const scene = SCENES[name];
  const body = [scene.plate(P)];
  if (scene.glow) {
    const c = k.iso([0, 0, 70], P);
    body.push(`<circle class="glow" cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="${(P.scale * 95).toFixed(1)}" fill="url(#glow)"/>`);
  }
  if (name !== "conveyor") body.push(socketRing(P));
  return body.join("");
}
function bulbOnly(name, P) {
  if (name !== "conveyor") return `<g data-bulb>${bulbSvg(bulb(P, [0, 0, 0], { inside: SCENES[name].inside }))}</g>`;
  // one bulb in its cup at x = 0; the page places copies along the belt with <use>
  const F = G.frameOf([0, 0, BELT.z + BELT.h], UP, [1, 0, 0], [0, 1, 0]);
  const cup = S(G.ringBand(0, 3, 13, 17, F, P), { tone: "mid" });
  return cup + bulbSvg(bulb(P, [0, 0, BELT.z + BELT.h + 1.5], { inside: true }));
}

const labels = {
  napkin: "A light bulb drawn as a single pen line on a folded paper napkin, with a coffee ring in the corner.",
  sketch: "The same bulb redrawn in pencil on a ruled sheet, hatched in four densities, with construction lines and margin notes; a pencil lies beside it.",
  blueprint: "The bulb as a drafting on a classic blueprint sheet: white lines on blue, a grid, a title block, a 108 mm height and 60 mm diameter, and four numbered callouts.",
  launch: "The bulb fully shaded on a turned plinth, its filament lit and glowing gold.",
  website: "The lit bulb presented as the product on a small plinth, inside a browser window.",
  conveyor: "Many lit bulbs riding a conveyor belt with rollers, side rails and legs, moving steadily from left to right.",
};

const out = { W, H, AZ, LIFT, SLOT, BELT, stages: {}, scale: {} };
for (const name of Object.keys(SCENES)) {
  const ref = fit(SCENES[name], 48);
  out.scale[name] = {};
  // round plinths look the same at every azimuth too, so those stages cache a single plate
  const round = name === "launch" || name === "website";
  const one = round ? plateSvg(name, ref) : null;
  out.stages[name] = one ? [one] : AZ.map((az) => plateSvg(name, { ...ref, azimuth: az }));
  out.over = out.over || {};
  out.over[name] = SCENES[name].over ? AZ.map((az) => SCENES[name].over({ ...ref, azimuth: az })) : null;
  out.bulb = out.bulb || {};
  out.bulb[name] = bulbOnly(name, ref);
  // per-stage unit vectors so the page can translate along x and z without the kit
  out.scale[name].z = k.axisVector(ref, [0, 0, 1]);
  out.scale[name].x = AZ.map((az) => k.axisVector({ ...ref, azimuth: az }, [1, 0, 0]));
  out.label = out.label || {};
  out.label[name] = labels[name];
}

// configurator: one bulb whose parts each stand for a paid stage
{
  const P = k.fitProjection([[-40, -40, 0], [40, 40, 0], [-40, 40, 0], [40, -40, 0], [0, 0, TOP + 50]], W, H, { pad: 30, azimuth: 42 });
  const parts = bulb(P, [0, 0, 0], { inside: true });
  out.config = { svg: socketRing(P) + `<g data-bulb>${bulbSvg(parts)}</g>`, z: k.axisVector(P, [0, 0, 1]) };
  const c = k.iso([0, 0, 70], P);
  out.config.glow = `<circle class="glow" cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="${(P.scale * 95).toFixed(1)}" fill="url(#glow)"/>`;
}

mkdirSync(join(ROOT, "assets"), { recursive: true });
const js = `window.NPC_FIG=${JSON.stringify(out)};\n`;
writeFileSync(join(ROOT, "assets", "figures.js"), js);
console.log("wrote assets/figures.js", (js.length / 1024).toFixed(0), "KB");
