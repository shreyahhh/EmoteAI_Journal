import { BELOW_HERO_STAR_CUT, smoothstep, wrap } from './landingConfig';

/** Scroll parallax per depth layer, so stars drift past faster than the photo but slower than dust. */
const LAYER_PARALLAX = [0.6, 0.8, 1];
// Soft white, lilac, pale blue, warm
const COLORS = ['#F5F3FF', '#C1A0FF', '#A9C4FF', '#FFD978'];

function pickColor() {
  const r = Math.random();
  if (r < 0.66) return 0;
  if (r < 0.84) return 1;
  if (r < 0.97) return 2;
  return 3;
}

function dotSprite(color, size, core) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grd.addColorStop(0, '#ffffff');
  grd.addColorStop(core * 0.5, color);
  grd.addColorStop(core, color + 'aa');
  grd.addColorStop(1, color + '00');
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  return c;
}

/** Thin 4-point sparkle: two crossed lines that taper to nothing. */
function sparkleSprite(color) {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const m = size / 2;
  const h = g.createLinearGradient(0, m, size, m);
  h.addColorStop(0, color + '00');
  h.addColorStop(0.5, color);
  h.addColorStop(1, color + '00');
  g.fillStyle = h;
  g.fillRect(0, m - 0.6, size, 1.2);
  const v = g.createLinearGradient(m, 0, m, size);
  v.addColorStop(0, color + '00');
  v.addColorStop(0.5, color);
  v.addColorStop(1, color + '00');
  g.fillStyle = v;
  g.fillRect(m - 0.6, 0, 1.2, size);
  return c;
}

const noop = () => {};

export function createStarfield(canvas, opts) {
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return { draw: noop, resize: noop, setShootingEnabled: noop };
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0;
  let h = 0;

  const dots = COLORS.map((c) => dotSprite(c, 16, 0.32));
  const halos = COLORS.map((c) => dotSprite(c, 48, 0.14));
  const sparkles = COLORS.map((c) => sparkleSprite(c));
  const headGlow = dotSprite('#E6DAFF', 24, 0.25);

  const stars = [];
  for (let i = 0; i < opts.count; i++) {
    const big = Math.random() < 0.1;
    const period = 2 + Math.random() * 4; // seconds
    stars.push({
      x: Math.random(),
      y: Math.random(),
      r: big ? 0.75 + Math.random() * 0.35 : 0.3 + Math.random() * 0.3,
      freq: (Math.PI * 2) / period,
      phase: Math.random() * Math.PI * 2,
      layer: i % 3,
      color: pickColor(),
      halo: big,
      sparkle: Math.random() < 0.15,
      keep: Math.random(),
    });
  }

  let shootingEnabled = !opts.reducedMotion;
  let shooting = null;
  let nextShootAt = 4 + Math.random() * 6; // seconds of scene time

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
  }
  resize();

  /** Keeps every shooting star clear of the centred headline area. */
  const crossesHeadline = (x, y, ux, uy, dist, tail) => {
    const x0 = w * 0.2;
    const x1 = w * 0.8;
    const y0 = h * 0.26;
    const y1 = h * 0.74;
    for (let d = -tail; d <= dist; d += 12) {
      const px = x + ux * d;
      const py = y + uy * d;
      if (px > x0 && px < x1 && py > y0 && py < y1) return true;
    }
    return false;
  };

  function spawnShooting() {
    for (let attempt = 0; attempt < 16; attempt++) {
      const angle = ((31 + (Math.random() - 0.5) * 16) * Math.PI) / 180;
      const ux = Math.cos(angle);
      const uy = Math.sin(angle);
      const x = w * (-0.05 + Math.random() * 0.75);
      const y = h * (0.02 + Math.random() * 0.46);
      const dist = Math.min(w, 1400) * (0.28 + Math.random() * 0.2);
      const tail = 120 + Math.random() * 80;
      if (crossesHeadline(x, y, ux, uy, dist, tail)) continue;
      shooting = { x, y, ux, uy, dist, tail, life: 0, duration: 0.8 + Math.random() * 0.4 };
      return true;
    }
    return false;
  }

  function drawShooting(dt, time) {
    if (!shooting) {
      if (shootingEnabled && time >= nextShootAt && !spawnShooting()) nextShootAt = time + 2;
      if (!shooting) return;
    }
    const sh = shooting;
    sh.life += dt;
    const p = sh.life / sh.duration;
    if (p >= 1) {
      shooting = null;
      nextShootAt = time + 9 + Math.random() * 7;
      return;
    }
    // Accelerates slightly, then fades out
    const travel = sh.dist * (0.55 * p + 0.45 * p * p);
    const hx = sh.x + sh.ux * travel;
    const hy = sh.y + sh.uy * travel;
    const alpha = Math.min(1, p / 0.12) * (1 - smoothstep(0.5, 1, p));
    const tailLen = sh.tail * Math.min(1, 0.25 + p * 1.5);
    const tx = hx - sh.ux * tailLen;
    const ty = hy - sh.uy * tailLen;
    // Tapered tail: a thin wedge from the head back to a point
    const nx = -sh.uy;
    const ny = sh.ux;
    const headW = 0.9;
    const grd = ctx.createLinearGradient(hx, hy, tx, ty);
    grd.addColorStop(0, 'rgba(255,255,255,0.95)');
    grd.addColorStop(0.25, 'rgba(214,196,255,0.5)');
    grd.addColorStop(1, 'rgba(193,160,255,0)');
    ctx.globalAlpha = alpha;
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.moveTo(hx + nx * headW, hy + ny * headW);
    ctx.lineTo(tx, ty);
    ctx.lineTo(hx - nx * headW, hy - ny * headW);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = alpha * 0.85;
    ctx.drawImage(headGlow, hx - 5, hy - 5, 10, 10);
  }

  /**
   * @param density 1 in the hero, 0 below it: fades out a share of the stars to match the
   *   sparser sky lower down.
   */
  function draw(timeSec, scroll, dtSec, density = 1) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const still = opts.reducedMotion;
    const span = h + 24;

    for (const s of stars) {
      const presence = s.keep < BELOW_HERO_STAR_CUT ? density : 1;
      if (presence <= 0.01) continue;
      // Smooth sine breathing between 0.15 and 1
      const a = still ? 0.6 : 0.5 + 0.5 * Math.sin(timeSec * s.freq + s.phase);
      const alpha = (0.15 + 0.85 * a) * presence;
      const x = s.x * w;
      const y = still ? s.y * h : wrap(s.y * span - scroll * LAYER_PARALLAX[s.layer], span) - 12;
      const boost = s.sparkle ? 1 + 0.35 * a : 1;
      const d = s.r * 2.8 * boost;
      ctx.globalAlpha = alpha;
      ctx.drawImage(dots[s.color], x - d / 2, y - d / 2, d, d);
      if (s.halo) {
        const hd = s.r * 9;
        ctx.globalAlpha = alpha * 0.32;
        ctx.drawImage(halos[s.color], x - hd / 2, y - hd / 2, hd, hd);
      }
      if (s.sparkle && !still) {
        const k = smoothstep(0.78, 1, a);
        if (k > 0.02) {
          const sd = (8 + s.r * 10) * (0.5 + 0.5 * k);
          ctx.globalAlpha = k * 0.75 * presence;
          ctx.drawImage(sparkles[s.color], x - sd / 2, y - sd / 2, sd, sd);
        }
      }
    }

    if (!still) drawShooting(dtSec, timeSec);
    ctx.globalAlpha = 1;
  }

  const setShootingEnabled = (on) => {
    shootingEnabled = on && !opts.reducedMotion;
  };

  return { draw, resize, setShootingEnabled };
}
