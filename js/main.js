/* =========================================================
   WAISS — interações e animações
   ========================================================= */
(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  // As animações são guiadas pelo scroll (o visitante controla o ritmo), então
  // rodam sempre, inclusive no Windows com "Efeitos de animação" desligado.
  // A versão estática fica só como reserva se o GSAP não carregar.
  const animate = hasGsap;

  /* gerador pseudo-aleatório com semente (resultados estáveis) */
  function rng(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const el = (tag, cls) => { const n = document.createElement(tag); if (cls) n.className = cls; return n; };

  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ---------------------------------------------------------
     Smooth scroll (Lenis)
     --------------------------------------------------------- */
  let lenis = null;
  if (animate && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const target = id === "#top" ? 0 : $(id);
      if (target === null) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.6 });
      else if (target === 0) window.scrollTo({ top: 0, behavior: "smooth" });
      else target.scrollIntoView({ behavior: "smooth" });
    });
  });

  /* ---------------------------------------------------------
     Nav: some ao descer, volta ao subir
     --------------------------------------------------------- */
  const nav = $("#nav");
  let lastY = 0;
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle("is-scrolled", y > 10);
    nav.classList.toggle("is-hidden", y > 200 && y > lastY + 2);
    if (y < lastY - 2) nav.classList.remove("is-hidden");
    lastY = y;
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------------------------------------------------------
     Texturas geradas (biscoito triturado / tampa de biscoito)
     --------------------------------------------------------- */
  function crumbCanvas(w, h, seed, scale = 2) {
    const c = el("canvas");
    c.width = Math.ceil(w * scale); c.height = Math.ceil(h * scale);
    const g = c.getContext("2d");
    g.scale(scale, scale);
    const r = rng(seed);
    g.fillStyle = "#93592a";
    g.fillRect(0, 0, w, h);
    const cols = ["#d4934b", "#e3ad66", "#c4823e", "#ecc27f", "#b77838", "#f2cf92", "#d99c57"];
    const count = Math.floor((w * h) / 26);
    for (let i = 0; i < count; i++) {
      const big = r() < 0.08;
      const s = big ? 7 + r() * 9 : 1.6 + Math.pow(r(), 2) * 7;
      const x = r() * w, y = r() * h;
      const k = 4 + Math.floor(r() * 4);
      const rot = r() * Math.PI * 2;
      const pts = [];
      for (let j = 0; j < k; j++) {
        const a = rot + (j / k) * Math.PI * 2 + (r() - 0.5) * 0.7;
        const rr = s * (0.55 + r() * 0.5);
        pts.push([Math.cos(a) * rr, Math.sin(a) * rr * (0.7 + r() * 0.4)]);
      }
      const poly = (ox, oy, sc) => {
        g.beginPath();
        pts.forEach(([px, py], j) => (j ? g.lineTo : g.moveTo).call(g, x + ox + px * sc, y + oy + py * sc));
        g.closePath(); g.fill();
      };
      g.fillStyle = "rgba(38,16,4,.55)"; poly(s * 0.18, s * 0.3, 1.05);       // sombra (luz de cima)
      const q = r();
      g.fillStyle = q < 0.07 ? "#9ba45a" : q < 0.12 ? "#4f2c19" : cols[Math.floor(r() * cols.length)];
      poly(0, 0, 1);                                                        // pedaço
      g.fillStyle = "rgba(255,238,205,.30)"; poly(-s * 0.16, -s * 0.22, 0.5); // brilho
    }
    return c;
  }

  function biscuitCanvas(size, seed) {
    const c = el("canvas"); c.width = c.height = size;
    const g = c.getContext("2d");
    const r = rng(seed), m = size / 2;
    const grad = g.createRadialGradient(m * 0.85, m * 0.8, size * 0.05, m, m, m);
    grad.addColorStop(0, "#efcb8f"); grad.addColorStop(0.65, "#d9a35f"); grad.addColorStop(0.92, "#c4843f"); grad.addColorStop(1, "#a8692f");
    g.fillStyle = grad; g.beginPath(); g.arc(m, m, m, 0, Math.PI * 2); g.fill();
    g.save(); g.beginPath(); g.arc(m, m, m * 0.97, 0, Math.PI * 2); g.clip();
    for (let i = 0; i < size * 7; i++) {           // textura porosa
      const x = r() * size, y = r() * size, s = 0.4 + r() * 1.6;
      g.fillStyle = r() < 0.55 ? `rgba(120,64,20,${0.1 + r() * 0.25})` : `rgba(255,236,196,${0.08 + r() * 0.2})`;
      g.fillRect(x, y, s, s);
    }
    // grade de waffle: células afundadas + frisos dourados (como o Biscotti real)
    const cell = size / 15, rib = cell * 0.2;
    g.translate(m, m); g.rotate(0.1); g.translate(-m, -m);
    for (let gx = -cell; gx < size + cell; gx += cell) {
      for (let gy = -cell; gy < size + cell; gy += cell) {
        const x = gx + rib / 2, y = gy + rib / 2, w = cell - rib;
        g.fillStyle = "rgba(150,82,24,.42)"; g.fillRect(x, y, w, w);
        g.fillStyle = "rgba(90,44,10,.35)"; g.fillRect(x, y, w, rib * 0.55);
        g.fillRect(x, y, rib * 0.55, w);
        g.fillStyle = "rgba(255,226,170,.22)"; g.fillRect(x, y + w - rib * 0.4, w, rib * 0.4);
      }
    }
    g.restore();
    return c;
  }

  /* ---------------------------------------------------------
     HERO — Biscotti Gelato 3D montado no scroll
     --------------------------------------------------------- */
  const B = {};
  const S = { topY: 0, botY: 0, gelX: 0, rot: 0, tilt: -24, scale: 1 };
  const LIGHT = { x: -0.55, z: 0.83 };

  function buildBiscotti() {
    const stage = $(".hero__stage");
    const spin = $("#b3dSpin");
    spin.innerHTML = "";
    const sw = stage.clientWidth, sh = stage.clientHeight;
    const R = Math.round(clamp(Math.min(sw * 0.27, sh * 0.23), 72, 170));
    const H = Math.round(R * 1.02);
    const N = 56;
    const tanv = Math.tan(Math.PI / N);
    stage.style.setProperty("--R", R + "px");
    stage.style.setProperty("--H", H + "px");

    /* gelato (miolo) */
    const gel = el("div", "b3d__group");
    const fw = 2 * R * tanv + 1.2;
    const gelFaces = [];
    for (let i = 0; i < N; i++) {
      const f = el("div", "face face--gel");
      const a = (i * 360) / N;
      f.style.cssText = `--fw:${fw}px;--fh:${H}px;--a:${a}deg;--r:${R}px`;
      f._a = a; gel.appendChild(f); gelFaces.push(f);
    }
    [-H / 2, H / 2].forEach((y) => {
      const c = el("div", "disc disc--cap");
      c.style.cssText = `--d:${2 * R}px;--y:${y}px`;
      gel.appendChild(c);
    });

    /* anel de biscoito triturado */
    const ring = el("div", "b3d__group");
    const Rc = R + Math.max(6, R * 0.075);
    const fwc = 2 * Rc * tanv + 1.2;
    const fhc = H + 4;
    const tex = crumbCanvas(Math.ceil(N * fwc), fhc, 7).toDataURL("image/jpeg", 0.86);
    const ringFaces = [];
    for (let i = 0; i < N; i++) {
      const f = el("div", "face face--crumb");
      const a = (i * 360) / N;
      f.style.cssText = `--fw:${fwc}px;--fh:${fhc}px;--a:${a}deg;--r:${Rc + R * 0.9}px;` +
        `background-image:url(${tex});background-size:${N * fwc}px ${fhc}px;background-position:${-i * fwc}px 0`;
      f._a = a; ring.appendChild(f); ringFaces.push(f);
    }

    /* tampas de biscoito */
    const Rb = Rc + 3, D = 2 * Rb;
    const t = Math.max(5, Math.round(R * 0.065));
    const L = 5;
    const bisTex = biscuitCanvas(Math.min(512, Math.ceil(D * 1.6)), 3).toDataURL("image/png");
    const bisTex2 = biscuitCanvas(Math.min(512, Math.ceil(D * 1.6)), 11).toDataURL("image/png");
    const makeBiscuit = (isTop) => {
      const g = el("div", "b3d__group");
      for (let k = 0; k <= L; k++) {
        const y = isTop ? -(k * t) / L : (k * t) / L;
        const face = (isTop && k === L) || (!isTop && k === 0);
        const bottomFace = (isTop && k === 0) || (!isTop && k === L);
        const d = el("div", "disc " + (face ? "disc--face" : "disc--edge" + (bottomFace ? " dark" : "")));
        d.style.cssText = `--d:${D}px;--y:${y}px` + (face ? `;background-image:url(${isTop ? bisTex : bisTex2})` : "");
        g.appendChild(d);
      }
      return g;
    };
    const top = makeBiscuit(true);
    const bot = makeBiscuit(false);

    spin.append(bot, gel, ring, top);
    Object.assign(B, { R, H, N, Rc, gel, ring, top, bot, gelFaces, ringFaces, spin, tilt: $(".b3d__tilt"), stage, lastRot: null });
  }

  function shadeFaces() {
    if (B.lastRot === S.rot) return;
    B.lastRot = S.rot;
    const list = [B.gelFaces, B.ringFaces];
    for (const faces of list) {
      for (const f of faces) {
        const a = ((f._a + S.rot) * Math.PI) / 180;
        const d = Math.max(0, Math.sin(a) * LIGHT.x + Math.cos(a) * LIGHT.z);
        f.style.setProperty("--s", (0.5 * (1 - d)).toFixed(3));
      }
    }
  }

  function renderBiscotti() {
    B.tilt.style.transform = `scale(${S.scale}) rotateX(${S.tilt}deg)`;
    B.spin.style.transform = `rotateY(${S.rot}deg)`;
    B.top.style.transform = `translate3d(0,${S.topY}px,0)`;
    B.bot.style.transform = `translate3d(0,${S.botY}px,0)`;
    B.gel.style.transform = `translate3d(${S.gelX}px,0,0)`;
    shadeFaces();
  }

  let heroTl = null;
  function initHero() {
    buildBiscotti();
    const { R, H, Rc, ringFaces } = B;
    const gap = R * 0.28;
    const vh = window.innerHeight;

    if (!animate) {
      Object.assign(S, { topY: -H / 2, botY: H / 2, gelX: 0, rot: 24, tilt: -20, scale: 1 });
      ringFaces.forEach((f) => { f.style.opacity = 1; f.style.setProperty("--r", Rc + "px"); });
      $(".hero__shadow").style.opacity = 0.6;
      renderBiscotti();
      return;
    }

    Object.assign(S, { topY: -vh * 1.2, botY: vh * 1.2, gelX: B.stage.clientWidth + R * 2, rot: 0, tilt: -24, scale: 0.94 });
    renderBiscotti();

    gsap.set(".hero__steps li", { autoAlpha: 0, y: 14 });
    gsap.set(".hero__reveal", { autoAlpha: 0, y: 30 });
    gsap.set(".hero__shadow", { opacity: 0, scale: 0.6 });

    const steps = $$(".hero__steps li");
    const showStep = (tl, i, at, out) => {
      tl.to(steps[i], { autoAlpha: 1, y: 0, duration: 0.4 }, at);
      if (out) tl.to(steps[i], { autoAlpha: 0, y: -14, duration: 0.4 }, out);
    };

    heroTl = gsap.timeline({
      defaults: { ease: "none" },
      onUpdate: renderBiscotti,
      scrollTrigger: { trigger: ".hero", start: "top top", end: () => "+=" + Math.round(window.innerHeight * 4.2), scrub: 1, pin: true, anticipatePin: 1 }
    });

    heroTl
      .to(".scroll-hint", { autoAlpha: 0, duration: 0.3 }, 0)
      .to(".hero__copy", { autoAlpha: 0, y: -40, duration: 0.9, ease: "power1.in" }, 0.5)
      // 1. biscoitos chegam de cima e de baixo
      .to(S, { topY: -H / 2 - gap, botY: H / 2 + gap, duration: 1.6, ease: "power3.out" }, 0.05)
      .to(".hero__shadow", { opacity: 0.55, scale: 1, duration: 1.4 }, 0.3)
      // 2. gelato entra pela lateral
      .to(S, { gelX: 0, duration: 1.3, ease: "power3.out" }, 1.8)
      // biscoitos fecham o sanduíche
      .to(S, { topY: -H / 2, botY: H / 2, duration: 0.5, ease: "back.out(2.2)" }, 3.0)
      // 3. gira e os fragmentos crocantes preenchem a lateral
      .to(S, { rot: 540, duration: 3.4, ease: "power1.inOut" }, 3.4)
      .to(S, { tilt: -15, scale: 1.04, duration: 3.4, ease: "power1.inOut" }, 3.4)
      .to(ringFaces, {
        "--r": Rc + "px", opacity: 1, duration: 0.5, ease: "power2.out",
        stagger: { each: 2.3 / ringFaces.length, from: "end" }
      }, 3.6)
      // revelação
      .to(".hero__reveal", { autoAlpha: 1, y: 0, duration: 0.9, ease: "power2.out" }, 6.7)
      .to({}, { duration: 0.6 }, 7.6);

    showStep(heroTl, 0, 0.4, 1.8);
    showStep(heroTl, 1, 2.0, 3.3);
    showStep(heroTl, 2, 3.6, 6.4);
  }

  /* ---------------------------------------------------------
     Calda escorrendo (drips)
     --------------------------------------------------------- */
  function buildDrip(svg, seed) {
    const w = Math.max(320, svg.clientWidth), h = Math.max(80, svg.clientHeight);
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    const r = rng(seed);
    const band = h * 0.2;
    let d = `M0,-2 H${w} V${band}`;
    const waves = Math.max(4, Math.round(w / 220));
    for (let i = waves; i > 0; i--) {
      const x0 = (w * i) / waves, x1 = (w * (i - 1)) / waves;
      d += ` Q${(x0 + x1) / 2},${band + (r() * 14 - 4)} ${x1},${band}`;
    }
    d += " Z";
    let out = `<path class="band" d="${d}"/>`;
    const count = Math.max(5, Math.round(w / 95));
    for (let i = 0; i < count; i++) {
      const x = ((i + 0.2 + r() * 0.6) / count) * w;
      const dw = 14 + r() * 26;
      const len = band + h * (0.18 + Math.pow(r(), 1.4) * 0.72);
      const y0 = band - 6, rb = dw * 0.34;
      const yb = len - rb;
      out += `<path class="drop" d="M${x - dw / 2 - 6},${y0} Q${x - dw / 2},${y0} ${x - dw / 2},${y0 + 8}` +
        ` C${x - dw / 2},${y0 + (yb - y0) * 0.45} ${x - rb},${y0 + (yb - y0) * 0.55} ${x - rb},${yb}` +
        ` A${rb},${rb * 1.12} 0 0 0 ${x + rb},${yb}` +
        ` C${x + rb},${y0 + (yb - y0) * 0.55} ${x + dw / 2},${y0 + (yb - y0) * 0.45} ${x + dw / 2},${y0 + 8}` +
        ` Q${x + dw / 2},${y0} ${x + dw / 2 + 6},${y0} Z"/>`;
      if (r() < 0.45) out += `<circle class="fall" cx="${x}" cy="${len + rb * 1.6}" r="${rb * 0.62}"/>`;
    }
    svg.innerHTML = out;
    svg.querySelectorAll("circle").forEach((c) => (c.style.fill = "currentColor"));
  }

  const dripTweens = [];
  function initDrips() {
    dripTweens.forEach((t) => { t.scrollTrigger && t.scrollTrigger.kill(); t.kill(); });
    dripTweens.length = 0;
    $$(".drip").forEach((svg, i) => {
      buildDrip(svg, 40 + i * 17);
      if (!animate) return;
      const sec = svg.parentElement;
      const drops = svg.querySelectorAll(".drop");
      const falls = svg.querySelectorAll(".fall");
      const tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: "top 92%", end: "top 15%", scrub: 1 } });
      tl.fromTo(svg.querySelector(".band"), { scaleY: 0.2, transformOrigin: "50% 0" }, { scaleY: 1, duration: 0.4 }, 0)
        .fromTo(drops, { scaleY: 0.05 }, { scaleY: 1, duration: 1, ease: "power1.out", stagger: { each: 0.06, from: "random" } }, 0.1)
        .fromTo(falls, { y: -30, opacity: 0, scale: 0.4, transformOrigin: "50% 50%" }, { y: 60, opacity: 1, scale: 1, duration: 0.8, stagger: 0.08 }, 0.7)
        .to(falls, { opacity: 0, duration: 0.3, stagger: 0.08 }, 1.3);
      dripTweens.push(tl);
    });
  }

  /* ---------------------------------------------------------
     Manifesto palavra por palavra
     --------------------------------------------------------- */
  let manifestoWords = [];
  function splitManifesto() {
    const m = $(".manifesto");
    const text = m.textContent.trim();
    m.innerHTML = text.split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(" ");
    manifestoWords = $$(".w", m);
    if (!animate) manifestoWords.forEach((w) => (w.style.opacity = 1));
    else if (manifestoST) manifestoST.update && paintManifesto(manifestoST.progress);
  }
  function paintManifesto(p) {
    const n = manifestoWords.length;
    manifestoWords.forEach((w, i) => {
      const v = clamp(p * (n + 4) - i, 0, 1);
      w.style.opacity = (0.14 + 0.86 * v).toFixed(3);
    });
  }
  let manifestoST = null;

  /* ---------------------------------------------------------
     Barra de chocolate quebrando
     --------------------------------------------------------- */
  let barTl = null;
  function initBar() {
    const bar = $("#bar");
    const mobile = window.innerWidth < 700;
    const cols = mobile ? 3 : 6, rows = mobile ? 5 : 3;
    bar.style.setProperty("--cols", cols);
    bar.innerHTML = "";
    const pieces = [];
    for (let rI = 0; rI < rows; rI++) {
      for (let c = 0; c < cols; c++) {
        const p = el("div", "piece");
        p.innerHTML = "<span>w</span>";
        p._c = c; p._r = rI;
        bar.appendChild(p); pieces.push(p);
      }
    }
    if (!animate) { bar.parentElement.style.display = "none"; $(".choco__hint").style.display = "none"; return; }

    const r = rng(99);
    const cx = (cols - 1) / 2, cy = (rows - 1) / 2;
    const vw = window.innerWidth, vh = window.innerHeight;
    const fly = pieces.map((p) => {
      const dx = p._c - cx + (r() - 0.5) * 0.8, dy = p._r - cy + (r() - 0.5) * 0.8 - 0.4;
      const len = Math.hypot(dx, dy) || 1;
      const dist = 0.55 + r() * 0.5;
      return {
        x: (dx / len) * vw * dist, y: (dy / len) * vh * dist * 0.9 - r() * vh * 0.2,
        z: 150 + r() * 500, rx: (r() - 0.5) * 420, ry: (r() - 0.5) * 420, rz: (r() - 0.5) * 220
      };
    });

    gsap.set(bar, { rotationX: 42, rotationZ: -12, y: 120, scale: 0.86 });
    gsap.set(".choco__behind", { autoAlpha: 0, scale: 0.92 });
    gsap.set(".choco__list li", { autoAlpha: 0, y: 18 });

    barTl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: ".choco__pin", start: "top top", end: () => "+=" + Math.round(window.innerHeight * 2.4), scrub: 1, pin: true, anticipatePin: 1 }
    });
    barTl
      .to(bar, { rotationX: 14, rotationZ: -5, y: 0, scale: 1, duration: 1, ease: "power2.out" }, 0)
      // estalo: os gomos se separam nas linhas
      .to(pieces, {
        x: (i) => (pieces[i]._c - cx) * 7, y: (i) => (pieces[i]._r - cy) * 7,
        rotationZ: () => (r() - 0.5) * 6, duration: 0.5, ease: "power3.out"
      }, 1.05)
      .to(".choco__hint", { autoAlpha: 0, duration: 0.3 }, 1.0)
      .to(bar, { x: -6, duration: 0.05, yoyo: true, repeat: 3 }, 1.0)
      // explode em pedaços
      .to(pieces, {
        x: (i) => fly[i].x, y: (i) => fly[i].y, z: (i) => fly[i].z,
        rotationX: (i) => fly[i].rx, rotationY: (i) => fly[i].ry, rotationZ: (i) => fly[i].rz,
        duration: 1.8, ease: "power2.in", stagger: { each: 0.025, from: "center" }
      }, 1.7)
      .to(pieces, { opacity: 0, duration: 0.5, stagger: { each: 0.025, from: "center" } }, 2.9)
      .to(".choco__behind", { autoAlpha: 1, scale: 1, duration: 1.1, ease: "power2.out" }, 2.2)
      .to(".choco__list li", { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.12 }, 2.9)
      .to({}, { duration: 0.6 }, 3.8);
  }

  /* ---------------------------------------------------------
     Verticais: barra, panettone, gelato, café
     --------------------------------------------------------- */
  function initVerticals() {
    if (!animate) return;
    gsap.fromTo(".cut-napo", { y: 50, rotation: -16, scale: 0.86 }, {
      y: -14, rotation: 7, scale: 1, ease: "none",
      scrollTrigger: { trigger: ".art-choco", start: "top bottom", end: "bottom 35%", scrub: 1 }
    });
    gsap.fromTo(".cut-pan", { y: 40, scale: 0.84, rotation: 4 }, {
      y: -8, scale: 1, rotation: -2, ease: "none",
      scrollTrigger: { trigger: ".art-panettone", start: "top bottom", end: "bottom 35%", scrub: 1 }
    });
    gsap.timeline({ scrollTrigger: { trigger: ".art-gelato", start: "top 78%" } })
      .from(".scoop", { y: -150, opacity: 0, duration: 0.7, ease: "power3.in", stagger: 0.25 })
      .from(".spoon", { rotation: -40, opacity: 0, duration: 0.8, ease: "back.out(2)" }, "-=0.2");
    $$(".scoop").forEach((s, i) => {
      gsap.fromTo(s, { scaleY: 1 }, {
        scaleY: 0.86, scaleX: 1.08, duration: 0.12, yoyo: true, repeat: 1, delay: 0.7 + i * 0.25,
        scrollTrigger: { trigger: ".art-gelato", start: "top 78%" }
      });
    });
    gsap.timeline({ scrollTrigger: { trigger: ".art-coffee", start: "top 78%" } })
      .from(".art-coffee .saucer", { scaleX: 0, opacity: 0, duration: 0.5, ease: "power3.out" })
      .from(".art-coffee .cup", { y: -120, opacity: 0, duration: 0.7, ease: "bounce.out" }, 0.2)
      .from(".art-coffee .bonbon", { x: 90, rotation: 300, opacity: 0, duration: 0.9, ease: "power3.out", transformOrigin: "50% 50%" }, 0.6)
      .from(".vert__flag", { y: -10, opacity: 0, duration: 0.4 }, 0.9);
    gsap.from(".vert", {
      y: 60, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.12,
      scrollTrigger: { trigger: ".verticals", start: "top 82%" }
    });
  }

  /* ---------------------------------------------------------
     Queridinhos (scroll horizontal) + rodapé
     --------------------------------------------------------- */
  function initHighlights() {
    if (!animate) return;
    const mm = gsap.matchMedia();
    mm.add("(min-width: 701px)", () => {
      const track = $("#hlTrack");
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const section = $(".highlights");
      // Só trava quando os cards inteiros (com a descrição) estiverem na tela.
      // Se a seção for mais alta que a tela, espera o fim dela chegar embaixo.
      const startAt = () => (section.offsetHeight > window.innerHeight ? "bottom bottom" : "top top");
      const tween = gsap.to(track, {
        x: () => -dist(), ease: "none",
        scrollTrigger: { trigger: section, start: startAt, end: () => "+=" + dist(), scrub: 1, pin: true, invalidateOnRefresh: true, anticipatePin: 1 }
      });
      // fotos com leve parallax e recortes que giram dentro do scroll horizontal
      $$(".hl__media img").forEach((img) => {
        const cut = img.classList.contains("cut");
        const wide = img.classList.contains("cut--wide");
        const from = cut ? { rotation: wide ? -16 : 14, scale: 0.86 } : { xPercent: -6, scale: 1.14 };
        const to = cut ? { rotation: wide ? -2 : 0, scale: 1 } : { xPercent: 6, scale: 1.14 };
        gsap.fromTo(img, from, {
          ...to, ease: "none",
          scrollTrigger: { trigger: img.closest(".hl"), containerAnimation: tween, start: "left right", end: "right left", scrub: true }
        });
      });
    });
    mm.add("(max-width: 700px)", () => {
      gsap.from(".hl", { y: 40, opacity: 0, duration: 0.9, stagger: 0.1, ease: "power3.out", scrollTrigger: { trigger: ".hl__track", start: "top 85%" } });
    });

    gsap.from(".stores .sec-head > *", {
      y: 40, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.1,
      scrollTrigger: { trigger: ".stores .sec-head", start: "top 85%" }
    });
    gsap.from(".footer__big", { y: 60, opacity: 0, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: ".footer", start: "top 60%" } });
  }

  /* ---------------------------------------------------------
     Lojas
     --------------------------------------------------------- */
  let currentStore = 0;
  const fmtPhone = (p) => {
    const n = p.replace(/^55/, "");
    return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
  };
  function renderStores() {
    const list = $("#storeList");
    const stores = window.WAISS_STORES || [];
    const d = window.WAISS_I18N[lang];
    list.innerHTML = stores.map((s, i) => {
      const enc = encodeURIComponent(s.address);
      const phones = s.phones.map((p, k) =>
        `<a class="btn ${k === 0 ? "btn--dark" : "btn--line"}" href="https://wa.me/${p}" target="_blank" rel="noopener">` +
        `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Z"/></svg>` +
        `${s.phones.length > 1 && k === 0 ? d["st.local"] + " " : ""}${fmtPhone(p)}</a>`).join("");
      return `<div class="store${i === currentStore ? " is-active" : ""}" data-i="${i}">
        <button class="store__head" type="button" aria-expanded="${i === currentStore}" aria-controls="store-more-${i}">
          <span class="store__top"><span class="store__city">${s.city}</span>${s.featured ? `<span class="store__badge">${d["st.home"]}</span>` : ""}</span>
          <span class="store__name">${s.place[lang]}</span>
          <span class="store__addr">${s.address}</span>
        </button>
        <div class="store__more" id="store-more-${i}"><div>
          <ul class="store__hours" aria-label="${d["st.hours"]}">${s.hours[lang].map((h) => `<li>${h}</li>`).join("")}</ul>
          <div class="store__actions">
            ${phones}
            <a class="btn btn--line" href="https://www.google.com/maps/search/?api=1&query=${enc}" target="_blank" rel="noopener">${d["st.route"]} ↗</a>
          </div>
        </div></div>
      </div>`;
    }).join("");
    $$(".store__head", list).forEach((b) => b.addEventListener("click", () => selectStore(+b.parentElement.dataset.i)));
    setMap();
  }
  function selectStore(i) {
    currentStore = i;
    $$(".store").forEach((s, k) => {
      s.classList.toggle("is-active", k === i);
      $(".store__head", s).setAttribute("aria-expanded", k === i);
    });
    setMap();
    if (hasGsap) setTimeout(() => ScrollTrigger.refresh(), 550);
  }
  function setMap() {
    const s = (window.WAISS_STORES || [])[currentStore];
    if (!s) return;
    const src = `https://maps.google.com/maps?q=${encodeURIComponent("Waiss " + s.address)}&z=15&output=embed`;
    const f = $("#storeMap");
    if (f.getAttribute("src") !== src) f.setAttribute("src", src);
  }

  /* ---------------------------------------------------------
     Idiomas
     --------------------------------------------------------- */
  const dict = window.WAISS_I18N;
  let lang = "pt";
  function detectLang() {
    try { const s = localStorage.getItem("waiss-lang"); if (s && dict[s]) return s; } catch (e) { /* sem storage */ }
    const n = (navigator.language || "pt").slice(0, 2).toLowerCase();
    return dict[n] ? n : "pt";
  }
  function setLang(l, refresh) {
    lang = dict[l] ? l : "pt";
    const d = dict[lang];
    document.documentElement.lang = lang === "pt" ? "pt-BR" : lang;
    $$("[data-i18n]").forEach((n) => { const v = d[n.dataset.i18n]; if (v != null) n.textContent = v; });
    $$("[data-i18n-html]").forEach((n) => { const v = d[n.dataset.i18nHtml]; if (v != null) n.innerHTML = v; });
    document.title = d["meta.title"];
    $$(".lang button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    try { localStorage.setItem("waiss-lang", lang); } catch (e) { /* sem storage */ }
    splitManifesto();
    renderStores();
    if (refresh && hasGsap) ScrollTrigger.refresh();
  }
  $$(".lang button").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.lang, true)));

  /* ---------------------------------------------------------
     Init
     --------------------------------------------------------- */
  setLang(detectLang(), false);
  const yr = $("#year"); if (yr) yr.textContent = new Date().getFullYear();

  // ordem da página: hero → queridinhos → barra → essência
  initHero();
  initHighlights();
  initBar();
  if (animate) {
    manifestoST = ScrollTrigger.create({
      trigger: ".manifesto", start: "top 82%", end: "bottom 40%",
      onUpdate: (self) => paintManifesto(self.progress)
    });
  }
  initVerticals();
  initDrips();

  if (hasGsap) {
    window.addEventListener("load", () => ScrollTrigger.refresh());
  }

  // reconstrói cenas 3D quando a largura muda de verdade
  let lastW = window.innerWidth, rt;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      if (Math.abs(window.innerWidth - lastW) < 80) { initDrips(); return; }
      lastW = window.innerWidth;
      if (heroTl) { heroTl.scrollTrigger.kill(true); heroTl.kill(); heroTl = null; }
      if (barTl) { barTl.scrollTrigger.kill(true); barTl.kill(); barTl = null; }
      initHero();
      initBar();
      initDrips();
      if (hasGsap) ScrollTrigger.sort ? (ScrollTrigger.sort(), ScrollTrigger.refresh()) : ScrollTrigger.refresh();
    }, 250);
  });
})();
