import React from 'react';
import { Menu, Settings } from 'lucide-react';
import Logo from '../components/shared/Logo';
import { Button } from '../components/ui/button';

export default function MobileHeader({ onOpenMenu, onOpenSettings }) {
  return (
    <header className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur-md lg:hidden">
      <Button type="button" variant="icon" size="icon" onClick={onOpenMenu} aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </Button>
      <span className="flex items-center gap-2">
        <Logo size={22} />
        <span className="emote-title-gradient text-emote-section font-bold">Emote</span>
      </span>
      <Button type="button" variant="icon" size="icon" onClick={onOpenSettings} aria-label="Settings">
        <Settings className="h-5 w-5" />
      </Button>
    </header>
  );
}
