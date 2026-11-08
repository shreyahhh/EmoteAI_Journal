import React from 'react';
import { Menu, User } from 'lucide-react';
import Logo from '../components/shared/Logo';
import { Button } from '../components/ui/button';

/** Slim top bar — the only chrome around page content. Navigation lives in
 * the NavDrawer behind the hamburger, not a permanent sidebar, so content
 * always gets the full window width (matches the mockups, where every
 * screen is just "☰ Emote" plus page content, never a fixed side column). */
export default function TopBar({ onOpenMenu, onOpenSettings, label }) {
  return (
    <header className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur-md">
      <span className="flex items-center gap-2.5">
        <Button type="button" variant="icon" size="icon" onClick={onOpenMenu} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
        <Logo size={22} />
        <span className="emote-title-gradient text-emote-section font-bold">Emote</span>
      </span>
      <span className="flex items-center gap-3">
        {label ? <span className="hidden text-emote-caption text-emote-ink-faint sm:inline">{label}</span> : null}
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Account"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-emote-border text-emote-ink-soft transition hover:text-emote-ink"
        >
          <User className="h-4 w-4" />
        </button>
      </span>
    </header>
  );
}
