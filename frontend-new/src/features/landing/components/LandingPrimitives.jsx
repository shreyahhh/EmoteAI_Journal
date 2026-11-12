import { cn } from '../../../lib/utils';

export function Section({ index, label, visualId, children, manual, slowStagger, scrim, after, keepOnLeave }) {
  return (
    <section
      data-section={index}
      data-reveal={manual ? 'manual' : undefined}
      data-stagger={slowStagger ? 'slow' : undefined}
      data-leave={keepOnLeave ? 'none' : undefined}
      aria-label={label}
      className="relative flex min-h-screen items-center justify-center px-6 py-32 md:px-10"
    >
      {scrim && <div aria-hidden="true" className="hero-scrim pointer-events-none absolute inset-0" />}
      <div data-content className="relative mx-auto flex w-full max-w-[900px] flex-col items-center text-center">
        {children}
      </div>
      <div id={visualId} aria-hidden="true" />
      {after}
    </section>
  );
}

export function Headline({ children, as: Tag = 'h2', className }) {
  return (
    <Tag data-headline className={cn('type-headline reveal-init', className)}>
      {children}
    </Tag>
  );
}

export function Body({ children, className }) {
  return (
    <p data-fade className={cn('type-body reveal-init max-w-[40rem]', className)}>
      {children}
    </p>
  );
}

export function Plain({ children, className }) {
  return (
    <p data-fade className={cn('type-plain reveal-init max-w-[44rem]', className)}>
      {children}
    </p>
  );
}

export function Small({ children, className }) {
  return (
    <p data-fade className={cn('type-small reveal-init', className)}>
      {children}
    </p>
  );
}

export function GalaxyButton({ children, className, onClick }) {
  return (
    <div data-fade className={cn('reveal-init', className)}>
      <button type="button" data-magnetic className="btn-galaxy" onClick={onClick}>
        {children}
      </button>
    </div>
  );
}

export function ScrollCue() {
  return (
    <div data-scroll-cue className="pointer-events-none absolute inset-x-0 bottom-8 flex justify-center md:bottom-10">
      <div data-scroll-cue-inner className="reveal-init flex flex-col items-center gap-3">
        <span className="type-small tracking-[0.18em] uppercase">Drift in</span>
        <span className="cue-line" />
      </div>
    </div>
  );
}
