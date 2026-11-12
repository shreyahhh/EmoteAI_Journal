import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

/**
 * Text choreography shared by every section:
 * - headlines split into masked lines that slide up 40px and fade in (stagger 0.08, 1.2s, expo.out)
 * - body / plain lines fade up after, staggered
 * - on leaving, the section content drifts up and fades (scroll-scrubbed)
 * - headlines carry a slight scroll parallax so they trail the body text
 */
export function setupReveals(root, reducedMotion) {
  const heroPlayers = [];
  const splits = [];

  const sections = Array.from(root.querySelectorAll('[data-section]'));

  for (const section of sections) {
    const content = section.querySelector('[data-content]');
    if (!content) continue;
    const manual = section.dataset['reveal'] === 'manual';
    const keepOnLeave = section.dataset['leave'] === 'none';
    const stagger = section.dataset['stagger'] === 'slow' ? 0.38 : 0.12;
    const headlines = Array.from(content.querySelectorAll('[data-headline]'));
    const fades = Array.from(content.querySelectorAll('[data-fade]'));

    let revealed = false;
    const lineTweens = [];

    if (reducedMotion) {
      if (headlines.length + fades.length) gsap.set([...headlines, ...fades], { opacity: 0 });
    } else {
      headlines.forEach((el, i) => {
        const split = SplitText.create(el, {
          type: 'lines',
          mask: 'lines',
          linesClass: 'split-line',
          autoSplit: true,
          onSplit(self) {
            gsap.set(el, { opacity: 1 });
            const tw = gsap.fromTo(
              self.lines,
              { y: 40, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 1.2,
                ease: 'expo.out',
                stagger: 0.08,
                paused: true,
              },
            );
            if (revealed) tw.progress(1);
            lineTweens[i] = tw;
            return tw;
          },
        });
        splits.push(split);
      });
      if (fades.length) gsap.set(fades, { opacity: 0, y: 28 });
    }

    const play = () => {
      if (revealed) return;
      revealed = true;
      if (reducedMotion) {
        if (headlines.length + fades.length) gsap.to([...headlines, ...fades], { opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.1 });
        return;
      }
      lineTweens.forEach((tw, i) => tw?.delay(i * 0.15).play());
      const lineCount = lineTweens.reduce((n, tw) => n + (tw ? tw.targets().length : 0), 0);
      if (fades.length) gsap.to(fades, {
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: 'expo.out',
        stagger,
        delay: headlines.length ? 0.35 + Math.min(lineCount, 4) * 0.06 : 0,
      });
    };

    if (manual) {
      heroPlayers.push(play);
    } else {
      const st = ScrollTrigger.create({
        trigger: content,
        start: 'top 82%',
        once: true,
        onEnter: play,
      });
      if (st.progress > 0) play();
    }

    if (reducedMotion) continue;

    // Leaving: content drifts up and fades as it heads off the top of the screen.
    if (!keepOnLeave) gsap.fromTo(
      content,
      { y: 0, opacity: 1 },
      {
        y: -90,
        opacity: 0,
        ease: 'power3.out',
        immediateRender: false,
        scrollTrigger: manual
          ? { trigger: section, start: 'top top', end: '75% top', scrub: 1 }
          : { trigger: content, start: 'center 28%', end: 'bottom top', scrub: 1 },
      },
    );

    // Headline parallax: trails behind the rest of the text.
    headlines.forEach((el) => {
      gsap.fromTo(
        el,
        { y: -36 },
        {
          y: 36,
          ease: 'none',
          scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: 1 },
        },
      );
    });
  }

  return {
    playHero: () => heroPlayers.forEach((p) => p()),
    destroy: () => splits.forEach((s) => s.revert()),
  };
}
