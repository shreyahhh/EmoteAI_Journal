import emoteSky from '../../../assets/landing/bg/emote-sky.webp';
import emoteSkyMobile from '../../../assets/landing/bg/emote-sky-mobile.webp';

/** One tall seamless sky: Milky Way across the top, an even starry sky below. */
export const SKY = { desktop: emoteSky, mobile: emoteSkyMobile };

/**
 * Fixed full-screen stack, bottom to top: sky image (with the Milky Way shimmer riding on
 * it), dim, star canvas (twinkles + shooting stars), dust canvas, vignette.
 * Driven by the scene loop and one scrubbed ScrollTrigger.
 */
export function LandingSkyBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-landing-void">
      <div data-sky-intro className="absolute inset-0 opacity-0">
        <div data-sky-zoom className="absolute inset-0 will-change-transform">
          <div data-sky-mouse className="absolute inset-0 will-change-transform">
            <div data-sky-scroll className="sky-scroll">
              <div className="sky-drift">
                <picture>
                  <source media="(max-width: 767px)" srcSet={SKY.mobile} type="image/webp" />
                  <img
                    src={SKY.desktop}
                    alt=""
                    className="sky-img"
                    decoding="async"
                    fetchPriority="high"
                    loading="eager"
                    draggable={false}
                  />
                </picture>

                <div data-shimmer className="sky-shimmer">
                  <div className="shimmer-band">
                    <div className="shimmer-breathe" />
                    <div className="shimmer-travel" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div data-sky-dim className="absolute inset-0 bg-landing-void" style={{ opacity: 0.05 }} />

      <canvas data-stars className="absolute inset-0" />
      <canvas data-dust className="absolute inset-0" />
      <div className="vignette absolute inset-0" />
    </div>
  );
}
