// NPC Landing · Idea to Money — live behaviour.
// Figures come prebuilt from build/build.mjs as window.NPC_FIG (SVG strings cached per azimuth step).
(() => {
  "use strict";
  const FIG = window.NPC_FIG;
  const GA_ID = ""; // e.g. "G-XXXXXXXXXX" — leave empty until the GA4 property exists
  const SCHEDULER = "https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ0kZar29aYDXn9vfvL2JZVskJndufzirA6liCU2CDAtOy8WH6iAmvJj_05lGjat4NuH2U-QO_4-";
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  const phone = matchMedia("(max-width: 860px)");
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  const STAGES = [
    { id: "napkin", n: 1, title: "Napkin · Discovery", price: 0, label: "Free", get: ["30-min call", "Idea teardown", "Recommended path"] },
    { id: "sketch", n: 2, title: "Sketch · Creative Brief", price: 1500, label: "$1,500", get: ["Audience and positioning", "Competitor review", "Brief document"] },
    { id: "blueprint", n: 3, title: "Blueprint · Brand Identity", price: 3000, label: "$3,000", get: ["Logo, 2–3 directions", "Palette and type", "Guidelines"] },
    { id: "launch", n: 4, title: "Launch · Go-to-Market", price: 2500, label: "$2,500", get: ["Messaging and offer", "Channel plan", "Launch plan"] },
    { id: "website", n: 5, title: "Website · Web Build", price: 5000, label: "$5,000", from: true, get: ["Up to 5 pages, responsive", "SEO and GA4", "Hosting setup"] },
    { id: "conveyor", n: 6, title: "Conveyor · AI Automation", price: 4000, label: "$4,000", from: true, get: ["2–3 automations", "Lead capture to CRM", "Automated follow-up"] },
  ];
  const byId = Object.fromEntries(STAGES.map((s) => [s.id, s]));

  // ── analytics ───────────────────────────────────────────────────────────
  if (GA_ID) {
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(s);
    gtag("js", new Date());
    gtag("config", GA_ID);
  }
  const track = (name, params = {}) => gtag("event", name, params);

  // ── figure assembly ─────────────────────────────────────────────────────
  let uid = 0;
  function figureSvg(stage, step, label) {
    const plates = FIG.stages[stage];
    const plate = plates[Math.min(step, plates.length - 1)];
    const over = FIG.over[stage] ? FIG.over[stage][step] : "";
    let bulb = FIG.bulb[stage];
    if (stage === "conveyor") {
      const id = "cb" + ++uid;
      const xs = [];
      for (let x = FIG.BELT.from - FIG.SLOT + 10; x <= FIG.BELT.to; x += FIG.SLOT) xs.push(x);
      // painter's order along the belt: nearer bulbs (larger depth) last
      bulb = `<defs><g id="${id}">${bulb}</g></defs><g data-belt="bulbs">${xs.map((x) => `<use href="#${id}" data-x="${x}"/>`).join("")}</g>`;
    }
    return `<svg viewBox="0 0 ${FIG.W} ${FIG.H}" class="iso-svg" aria-hidden="true">${plate}${bulb}${over}</svg>`;
  }
  const vec = (v, s) => `translate(${(v[0] * s).toFixed(2)} ${(v[1] * s).toFixed(2)})`;
  function placeBelt(root, stage, step, phase) {
    if (stage !== "conveyor") return;
    const xv = FIG.scale.conveyor.x[step];
    $$("use", root).forEach((u) => {
      const x = +u.dataset.x + phase;
      u.setAttribute("transform", vec(xv, x));
      // fade in and out at the rollers rather than popping
      const edge = Math.min(x - (FIG.BELT.from + 8), FIG.BELT.to - 8 - x);
      u.style.opacity = Math.max(0, Math.min(1, edge / 30)).toFixed(2);
    });
    const cleats = $('[data-belt="cleats"] path', root);
    if (cleats) cleats.setAttribute("transform", vec(xv, phase % (FIG.SLOT / 4)));
  }

  // ── the sticky story figure ─────────────────────────────────────────────
  const card = $(".stage-figure .fig-card");
  const holder = $(".stage-figure .fig-stage");
  const steps = $$(".step");
  let current = null;
  let azStep = 3;
  let layer = null;
  let explode = 0;
  let beltPhase = 0;
  let figVisible = true;

  function liftParts(root, stage, e) {
    const z = FIG.scale[stage].z;
    $$("[data-bulb] > [data-part]", root).forEach((g) => {
      const lift = FIG.LIFT[g.dataset.part] * e;
      g.setAttribute("transform", lift ? vec(z, lift) : "");
      g.style.opacity = g.dataset.part === "globe" || g.dataset.part === "inside" ? (1 - e * 0.5).toFixed(2) : "";
    });
  }

  function render(stage, step, fresh) {
    if (fresh) {
      const next = document.createElement("div");
      next.className = "layer out";
      next.innerHTML = figureSvg(stage, step);
      holder.appendChild(next);
      const old = layer;
      layer = next;
      void next.offsetWidth; // commit the hidden state so the crossfade runs
      next.classList.remove("out");
      if (old) {
        old.classList.add("out");
        setTimeout(() => old.remove(), 500);
      }
    } else {
      layer.innerHTML = figureSvg(stage, step);
    }
    liftParts(layer, stage, explode);
    placeBelt(layer, stage, step, beltPhase);
  }

  function setStage(id) {
    if (id === current) return;
    current = id;
    const s = byId[id];
    card.dataset.stage = id;
    $("[data-fig-n]").textContent = s.n;
    $("[data-fig-title]").textContent = s.title;
    $("[data-readout]").textContent = `stage ${s.n} of 6 · ${s.from ? "from " : ""}${s.label.toLowerCase()}`;
    holder.setAttribute("aria-label", FIG.label[id]);
    steps.forEach((el) => el.classList.toggle("is-active", el.dataset.step === id));
    explode = still.matches ? 0 : 1; // the reveal: parts arrive apart and settle together
    render(id, azStep, true);
    kick();
    track("stage_viewed", { stage: id });
  }

  // scroll: which step is active, and how far through it (sets the azimuth step)
  function onScroll() {
    const mid = innerHeight * (phone.matches ? 0.62 : 0.5);
    let active = steps[0];
    for (const el of steps) if (el.getBoundingClientRect().top <= mid) active = el;
    setStage(active.dataset.step);
    if (still.matches) return;
    const r = active.getBoundingClientRect();
    const t = Math.max(0, Math.min(1, (mid - r.top) / r.height));
    const next = Math.round(t * (FIG.AZ.length - 1));
    if (next !== azStep) {
      azStep = next;
      render(current, azStep, false);
    }
  }

  // one rAF loop, only while something moves and the figure is on screen
  let frame = 0;
  let last = 0;
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 1 / 60;
    last = now;
    let moving = false;
    if (explode > 0) {
      explode = explode < 0.002 ? 0 : explode * Math.exp(-dt / 0.22);
      liftParts(layer, current, explode);
      moving = true;
    }
    if (current === "conveyor" && !still.matches) {
      beltPhase = (beltPhase + dt * 26) % FIG.SLOT; // 26 mm/s: a steady line, no bounce
      placeBelt(layer, current, azStep, beltPhase);
      moving = true;
    }
    frame = moving && figVisible ? requestAnimationFrame(tick) : 0;
  }
  function kick() {
    if (!frame && figVisible) {
      last = 0;
      frame = requestAnimationFrame(tick);
    }
  }
  new IntersectionObserver((e) => {
    figVisible = e[e.length - 1].isIntersecting;
    if (figVisible) kick();
  }).observe(card);

  // ── pricing cards ───────────────────────────────────────────────────────
  const cards = $("[data-cards]");
  cards.innerHTML = STAGES.map(
    (s) => `<article class="card" data-card="${s.id}">
      <div class="fig-card card-fig iso" data-stage="${s.id}" role="img" aria-label="${FIG.label[s.id]}">
        <div class="layer rest">${figureSvg(s.id, 3)}</div><div class="layer turn">${figureSvg(s.id, 8)}</div>
      </div>
      <div class="card-body">
        <p class="stage-name">${s.title.split(" · ")[0]}</p>
        <h3>${s.title.split(" · ")[1]}</h3>
        <ul>${s.get.map((g) => `<li>${g}</li>`).join("")}</ul>
        <p class="price">${s.from ? "<small>from</small>" : ""}${s.label}</p>
        <button class="btn btn-ghost" data-book="card-${s.id}" data-stage-pick="${s.title}">Book this stage</button>
      </div></article>`,
  ).join("");
  $$(".card").forEach((c) => {
    placeBelt(c, c.dataset.card, 3, 40);
    placeBelt($(".turn", c), c.dataset.card, 8, 40);
    c.addEventListener("mouseenter", () => track("card_hovered", { stage: c.dataset.card }), { once: true });
  });
  // on phones, a card's bulb turns when it scrolls into view
  const cardIO = new IntersectionObserver((entries) => entries.forEach((e) => e.target.classList.toggle("in-view", phone.matches && e.intersectionRatio > 0.6)), { threshold: [0, 0.6] });
  $$(".card").forEach((c) => cardIO.observe(c));

  // ── bundle: the full morph plays on hover ───────────────────────────────
  const bundleFig = $("[data-bundle-fig]");
  bundleFig.innerHTML = STAGES.map((s, i) => `<div class="layer fig-card" data-stage="${s.id}" style="opacity:${i ? 0 : 1}">${figureSvg(s.id, 3)}</div>`).join("");
  $$(".layer", bundleFig).forEach((l) => placeBelt(l, l.dataset.stage, 3, 40));
  let morph = 0;
  let morphAt = 0;
  const showMorph = (i) => $$(".layer", bundleFig).forEach((l, j) => (l.style.opacity = j === i ? 1 : 0));
  const bundle = $("[data-bundle]");
  const startMorph = () => {
    if (still.matches || morph) return;
    morph = setInterval(() => showMorph((morphAt = (morphAt + 1) % STAGES.length)), 900);
  };
  const stopMorph = () => {
    clearInterval(morph);
    morph = 0;
  };
  bundle.addEventListener("mouseenter", startMorph);
  bundle.addEventListener("focusin", startMorph);
  bundle.addEventListener("mouseleave", stopMorph);
  bundle.addEventListener("focusout", stopMorph);
  new IntersectionObserver((e) => (phone.matches && e[0].isIntersecting ? startMorph() : stopMorph()), { threshold: 0.5 }).observe(bundle);

  // ── configurator: the bulb assembles from the stages you pick ───────────
  const PAID = STAGES.slice(1);
  const PART_OF = { sketch: ["tip", "insulator"], blueprint: ["shell"], launch: ["neck"], website: ["globe"], conveyor: ["inside"] };
  const configFig = $("[data-config-fig]");
  configFig.innerHTML = `<svg viewBox="0 0 ${FIG.W} ${FIG.H}" class="iso-svg" aria-hidden="true">${FIG.config.glow}${FIG.config.svg}</svg>`;
  const toggles = $("[data-toggles]");
  toggles.insertAdjacentHTML(
    "beforeend",
    PAID.map((s) => `<label class="toggle"><input type="checkbox" checked value="${s.id}"><span>${s.title}</span><b>${s.from ? "from " : ""}${s.label}</b></label>`).join(""),
  );
  const fmt = (n) => "$" + n.toLocaleString("en-US");
  function updateConfig(e) {
    const on = $$("input:checked", toggles).map((i) => i.value);
    const sum = PAID.filter((s) => on.includes(s.id)).reduce((a, s) => a + s.price, 0);
    const all = on.length === PAID.length;
    $("[data-total]").textContent = fmt(all ? sum * 0.9 : sum);
    const was = $("[data-total-was]");
    was.hidden = !all;
    was.textContent = fmt(sum);
    PAID.forEach((s) =>
      PART_OF[s.id].forEach((p) => {
        const g = $(`[data-part="${p}"]`, configFig);
        const off = !on.includes(s.id);
        g.classList.toggle("off", off);
        g.setAttribute("transform", off ? vec(FIG.config.z, FIG.LIFT[p] * 0.6 + 14) : "");
      }),
    );
    $(".glow", configFig).style.opacity = on.includes("conveyor") && on.includes("website") ? 1 : 0;
    configFig.setAttribute("aria-label", `A light bulb assembled from ${on.length} of 5 stages. Estimated total ${$("[data-total]").textContent}.`);
    if (e) track("configurator_changed", { stages: on.join(","), total: all ? sum * 0.9 : sum });
    return on;
  }
  toggles.addEventListener("change", updateConfig);
  updateConfig();

  // ── scheduler ───────────────────────────────────────────────────────────
  const dlg = $("dialog.sched");
  const stageSelect = $("[data-stage-select]");
  stageSelect.innerHTML =
    `<option value="">Choose a stage</option>` + STAGES.map((s) => `<option>${s.title}</option>`).join("") + `<option>Full Journey bundle</option><option>Custom build (configurator)</option>`;
  let placement = "";
  function openScheduler(btn) {
    placement = btn.dataset.book;
    let pick = btn.dataset.stagePick || "";
    if (placement === "configurator") pick = "Custom build (configurator)";
    stageSelect.value = pick;
    $('[data-sched="form"]').hidden = false;
    $('[data-sched="book"]').hidden = true;
    track("cta_clicked", { placement, stage: pick });
    dlg.showModal();
  }
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-book]");
    if (btn) openScheduler(btn);
    const link = e.target.closest("[data-cta]");
    if (link) track("cta_clicked", { placement: link.dataset.cta });
  });
  $("[data-qualify]").addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    if (data.stage === "Custom build (configurator)") data.stage += ": " + updateConfig().join(", ");
    $("[data-sched-sum]").textContent = `${data.business} · ${data.stage} · ${data.budget}. Pick a time below and paste this line into the booking notes.`;
    const frame = $("[data-sched-frame]");
    if (!frame.src) frame.src = SCHEDULER + "?gv=true";
    $("[data-sched-link]").href = SCHEDULER;
    $('[data-sched="form"]').hidden = true;
    $('[data-sched="book"]').hidden = false;
    track("call_booking_started", { placement, stage: data.stage, budget: data.budget });
  });

  // ── sticky button after the hero, and scroll depth ──────────────────────
  const sticky = $(".sticky-book");
  new IntersectionObserver((e) => (sticky.hidden = e[0].isIntersecting), { threshold: 0 }).observe($(".hero-cta"));
  const depths = new Set();
  let ticking = false;
  addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        onScroll();
        const pct = (scrollY + innerHeight) / document.documentElement.scrollHeight;
        [25, 50, 75, 100].forEach((d) => {
          if (pct >= d / 100 - 0.01 && !depths.has(d)) {
            depths.add(d);
            track("scroll_depth", { percent: d });
          }
        });
      });
    },
    { passive: true },
  );
  new IntersectionObserver((e) => e[0].isIntersecting && track("pricing_reached"), { threshold: 0.1 }).observe($("#pricing"));

  onScroll();
})();
