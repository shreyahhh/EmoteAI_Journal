import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

import { SECTION_DIMS, dimAt, heroPresence, skyTravel } from './landingConfig';
import { createDust } from './landingDust';
import { setupReveals } from './landingReveal';
import { createStarfield } from './landingStarfield';

/**
 * Boots the whole Emote scene: smooth scroll, the fixed sky stack (scroll-mapped image,
 * Milky Way shimmer, dim, stars, shooting stars, dust), text reveals and the load sequence.
 * Returns a cleanup function.
 */
export function initEmoteScene(root) {
  gsap.registerPlugin(ScrollTrigger, SplitText);
  ScrollTrigger.config({ ignoreMobileResize: true });

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const isMobile = window.matchMedia('(max-width: 767px)').matches;

  const q = (sel) => root.querySelector(sel);
  const qa = (sel) => Array.from(root.querySelectorAll(sel));

  const skyIntro = q('[data-sky-intro]');
  const skyZoom = q('[data-sky-zoom]');
  const skyMouse = q('[data-sky-mouse]');
  const skyScroll = q('[data-sky-scroll]');
  const shimmer = q('[data-shimmer]');
  const dimEl = q('[data-sky-dim]');
  const starCanvas = q('[data-stars]');
  const dustCanvas = q('[data-dust]');
  const sections = qa('[data-section]');

  const cleanups = [];

  // ---------- Smooth scroll (desktop only) ----------
  let lenis = null;
  const lenisRaf = (time) => lenis?.raf(time * 1000);
  if (finePointer && !reducedMotion) {
    lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(lenisRaf);
    gsap.ticker.lagSmoothing(0);
    cleanups.push(() => {
      gsap.ticker.remove(lenisRaf);
      lenis?.destroy();
      lenis = null;
    });
  }

  // ---------- Measurements ----------
  let vh = window.innerHeight;
  let dimAnchors = [];
  let heroHeight = vh;

  const measure = () => {
    vh = window.innerHeight;
    const sy = window.scrollY;
    dimAnchors = sections.map((s) => {
      const r = s.getBoundingClientRect();
      return r.top + sy + r.height / 2 - vh / 2;
    });
    heroHeight = sections[0]?.offsetHeight ?? vh;
  };
  measure();
  ScrollTrigger.addEventListener('refresh', measure);
  cleanups.push(() => ScrollTrigger.removeEventListener('refresh', measure));

  // ---------- Canvases ----------
  const stars = createStarfield(starCanvas, { count: isMobile ? 100 : 220, reducedMotion });
  const dust = createDust(dustCanvas, { count: isMobile ? 12 : 30, reducedMotion });

  let resizeRaf = 0;
  const onResize = () => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      stars.resize();
      dust.resize();
      measure();
      needsStaticDraw = true;
    });
  };
  window.addEventListener('resize', onResize);
  cleanups.push(() => window.removeEventListener('resize', onResize));

  // ---------- Mouse ----------
  const mouseTarget = { x: 0, y: 0 };
  const mouseNow = { x: 0, y: 0 };
  let mousePx = null;
  if (finePointer && !reducedMotion) {
    const onMove = (e) => {
      mouseTarget.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseTarget.y = (e.clientY / window.innerHeight) * 2 - 1;
      mousePx = { x: e.clientX, y: e.clientY };
    };
    const onLeave = () => {
      mouseTarget.x = 0;
      mouseTarget.y = 0;
      mousePx = null;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    cleanups.push(() => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    });
  }

  // ---------- Frame loop (stars, shooting stars, dust, dim, shimmer, mouse) ----------
  let smoothScroll = window.scrollY;
  let elapsed = 0;
  let needsStaticDraw = true;
  // Mobile performance guard for shooting stars
  let frameAvg = 1 / 60;
  let slowFor = 0;

  const tick = (_time, deltaMs) => {
    const dt = Math.min(deltaMs / 1000, 0.05);
    elapsed += dt;
    const scroll = window.scrollY;
    smoothScroll += (scroll - smoothScroll) * (1 - Math.exp(-dt * 4.5));

    const presence = heroPresence(smoothScroll, heroHeight);
    dimEl.style.opacity = dimAt(smoothScroll, dimAnchors, SECTION_DIMS).toFixed(3);
    shimmer.style.opacity = presence.toFixed(3);

    if (isMobile && !reducedMotion) {
      frameAvg += (deltaMs / 1000 - frameAvg) * 0.05;
      slowFor = frameAvg > 1 / 40 ? slowFor + dt : 0;
      if (slowFor > 2) stars.setShootingEnabled(false);
    }

    if (!reducedMotion) {
      if (finePointer) {
        // Mouse parallax on the sky image, max 10px, lerp 0.05 per 60fps frame
        const mk = 1 - Math.pow(0.95, dt * 60);
        mouseNow.x += (mouseTarget.x - mouseNow.x) * mk;
        mouseNow.y += (mouseTarget.y - mouseNow.y) * mk;
        skyMouse.style.transform = `translate3d(${(-mouseNow.x * 10).toFixed(2)}px, ${(-mouseNow.y * 10).toFixed(2)}px, 0)`;
      }
      stars.draw(elapsed, scroll, dt, presence);
      dust.draw(elapsed, scroll, dt, mousePx);
    } else if (needsStaticDraw) {
      stars.draw(0, 0, 0, 1);
      dust.draw(0, 0, 0, null);
      needsStaticDraw = false;
    }
  };
  gsap.ticker.add(tick);
  cleanups.push(() => gsap.ticker.remove(tick));

  // ---------- Pause when hidden ----------
  const onVisibility = () => {
    const hidden = document.hidden;
    document.documentElement.classList.toggle('is-hidden', hidden);
    if (hidden) gsap.ticker.sleep();
    else gsap.ticker.wake();
  };
  document.addEventListener('visibilitychange', onVisibility);
  cleanups.push(() => document.removeEventListener('visibilitychange', onVisibility));

  // ---------- Magnetic buttons ----------
  if (finePointer && !reducedMotion) {
    for (const btn of qa('[data-magnetic]')) {
      const xTo = gsap.quickTo(btn, 'x', { duration: 0.8, ease: 'power3.out' });
      const yTo = gsap.quickTo(btn, 'y', { duration: 0.8, ease: 'power3.out' });
      const move = (e) => {
        const r = btn.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.32);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.4);
      };
      const leave = () => {
        gsap.to(btn, { x: 0, y: 0, duration: 1.2, ease: 'expo.out', overwrite: true });
      };
      btn.addEventListener('pointermove', move);
      btn.addEventListener('pointerleave', leave);
      cleanups.push(() => {
        btn.removeEventListener('pointermove', move);
        btn.removeEventListener('pointerleave', leave);
      });
    }
  }

  // ---------- Sky scroll, text + load sequence ----------
  const ctx = gsap.context(() => {}, root);
  let reveals = null;
  ctx.add(() => {
    // The sky image maps to the whole page: top of the image at the top of the page, bottom
    // at the bottom. Linear mapping, softened by scrub inertia.
    const skyTl = gsap.timeline({
      scrollTrigger: {
        trigger: document.documentElement,
        start: 0,
        end: 'max',
        scrub: 1.5,
        invalidateOnRefresh: true,
      },
    });
    skyTl.fromTo(
      skyScroll,
      { y: 0 },
      { y: () => -skyTravel(skyScroll.offsetHeight, window.innerHeight), ease: 'none', force3D: true },
      0,
    );
    if (!reducedMotion) {
      skyTl.fromTo(skyZoom, { scale: 1 }, { scale: 1.06, ease: 'none', force3D: true }, 0);
    }

    reveals = setupReveals(root, reducedMotion);

    const cue = q('[data-scroll-cue]');
    if (cue && sections[0] && !reducedMotion) {
      gsap.fromTo(
        cue,
        { opacity: 1 },
        {
          opacity: 0,
          y: -20,
          ease: 'power3.out',
          immediateRender: false,
          scrollTrigger: { trigger: sections[0], start: 'top top', end: '25% top', scrub: 1 },
        },
      );
    }
  });

  let cancelled = false;
  const skyImg = skyScroll.querySelector('img');
  const canDecode = skyImg && typeof skyImg.decode === 'function';
  const ready = skyImg
    ? Promise.race([
        skyImg.complete || !canDecode ? Promise.resolve() : skyImg.decode().catch(() => undefined),
        new Promise((r) => setTimeout(r, 1400)),
      ])
    : Promise.resolve();

  ready.then(() => {
    if (cancelled) return;
    ctx.add(() => {
      const tl = gsap.timeline({ delay: 0.1 });
      tl.to(skyIntro, { opacity: 1, duration: 1.5, ease: 'power3.out' }, 0)
        .add(() => reveals?.playHero(), 0.95)
        .to('[data-topbar]', { opacity: 1, duration: 1.4, ease: 'expo.out' }, 2.15)
        .to('[data-scroll-cue-inner]', { opacity: 1, duration: 1.4, ease: 'expo.out' }, 2.35);
    });
  });

  return () => {
    cancelled = true;
    cancelAnimationFrame(resizeRaf);
    reveals?.destroy();
    ctx.revert();
    ScrollTrigger.getAll().forEach((st) => st.kill());
    cleanups.forEach((fn) => fn());
    document.documentElement.classList.remove('is-hidden');
    gsap.ticker.wake();
  };
}
