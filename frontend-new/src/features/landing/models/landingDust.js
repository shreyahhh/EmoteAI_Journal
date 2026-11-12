import { wrap } from './landingConfig';

function sprite(inner, outer) {
  const size = 32;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grd.addColorStop(0, inner);
  grd.addColorStop(0.35, outer);
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  return c;
}

const noop = () => {};

export function createDust(canvas, opts) {
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return { draw: noop, resize: noop };
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = window.innerWidth;
  let h = window.innerHeight;
  const white = sprite('rgba(255,255,255,1)', 'rgba(255,255,255,0.35)');
  const lilac = sprite('rgba(236,222,255,1)', 'rgba(190,160,255,0.35)');

  const motes = [];
  const spawn = (m, initial = false) => {
    const next = m ?? {};
    next.x = Math.random() * w;
    next.y = Math.random() * h;
    // 1 to 2.5px across
    next.r = 0.5 + Math.random() * 0.75;
    next.vx = (Math.random() - 0.5) * 6;
    next.vy = -(3 + Math.random() * 6);
    next.sway = 5 + Math.random() * 10;
    next.swaySpeed = 0.15 + Math.random() * 0.3;
    next.phase = Math.random() * Math.PI * 2;
    next.lifespan = 8 + Math.random() * 7;
    next.life = initial ? Math.random() * next.lifespan : 0;
    next.maxAlpha = 0.1 + Math.random() * 0.25;
    next.lilac = Math.random() < 0.45;
    next.ox = next.ox ?? 0;
    next.oy = next.oy ?? 0;
    return next;
  };
  for (let i = 0; i < opts.count; i++) motes.push(spawn(undefined, true));

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
  }
  resize();

  /** mouse in css px, or null when there is no fine pointer */
  function draw(timeSec, scroll, dtSec, mouse) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const span = h + 40;
    const still = opts.reducedMotion;

    for (const m of motes) {
      if (!still) {
        m.life += dtSec;
        if (m.life >= m.lifespan) spawn(m);
        m.x += m.vx * dtSec;
        m.y += m.vy * dtSec;
      }
      const sx = m.x + (still ? 0 : Math.sin(timeSec * m.swaySpeed + m.phase) * m.sway);
      const sy = wrap(m.y - scroll * 1.3, span) - 20;

      // Gentle push away from the cursor
      let tx = 0;
      let ty = 0;
      if (mouse && !still) {
        const dx = sx - mouse.x;
        const dy = sy - mouse.y;
        const dist = Math.hypot(dx, dy);
        const radius = 160;
        if (dist < radius && dist > 0.01) {
          const f = (1 - dist / radius) ** 2 * 28;
          tx = (dx / dist) * f;
          ty = (dy / dist) * f;
        }
      }
      m.ox += (tx - m.ox) * Math.min(1, dtSec * 3);
      m.oy += (ty - m.oy) * Math.min(1, dtSec * 3);

      const lifeP = still ? 0.5 : m.life / m.lifespan;
      const alpha = m.maxAlpha * Math.sin(Math.PI * lifeP);
      if (alpha <= 0.01) continue;
      // The sprite's solid core is about a third of its width
      const size = m.r * 2 * 3;
      ctx.globalAlpha = alpha;
      ctx.drawImage(m.lilac ? lilac : white, sx + m.ox - size / 2, sy + m.oy - size / 2, size, size);
    }
    ctx.globalAlpha = 1;
  }

  return { draw, resize };
}
