import React from 'react';
import { X } from 'lucide-react';
import { Sheet, SheetContent } from '../components/ui/sheet';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';

function NavGroup({ tabs, activeTab, onSelect }) {
  return (
    <div className="flex flex-col gap-1">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect(tab.id)}
            className="flex items-baseline justify-between gap-4 rounded-lg px-1 py-2 text-left transition hover:bg-accent/40"
          >
            <span
              className={cn('font-display transition', isActive ? 'text-emote-accent' : 'text-emote-ink')}
              style={{ fontSize: 'clamp(1.75rem,4vw,2.5rem)', fontWeight: 400 }}
            >
              {tab.label}
            </span>
            {tab.caption ? (
              <span className="shrink-0 text-emote-muted text-emote-ink-faint">{tab.caption}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/** The nav mockups show no persistent sidebar on any screen size — every
 * page is just a top bar, and this "Contents" panel slides over it from the
 * hamburger. One component for all viewport widths, not a desktop/mobile
 * split. */
export default function NavDrawer({ open, onOpenChange, primaryTabs, secondaryTabs, activeTab, onSelect, onOpenSettings, onLogout }) {
  const handleSelect = (id) => {
    onSelect(id);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[min(380px,88vw)]">
        <div className="flex h-14 items-center justify-between border-b border-border px-5">
          <span className="text-emote-caption font-semibold uppercase tracking-wide text-emote-ink-faint">Contents</span>
          <Button type="button" variant="icon" size="icon" onClick={() => onOpenChange(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-6">
          <NavGroup tabs={primaryTabs} activeTab={activeTab} onSelect={handleSelect} />
          <div className="my-5 border-t border-border" />
          <NavGroup tabs={secondaryTabs} activeTab={activeTab} onSelect={handleSelect} />
          <div className="mt-auto flex gap-2 border-t border-border pt-5">
            <Button
              type="button"
              variant="gradient"
              size="sm"
              onClick={() => {
                onOpenSettings();
                onOpenChange(false);
              }}
              className="flex-1"
            >
              Settings
            </Button>
            <Button type="button" variant="gradient" size="sm" onClick={onLogout} className="flex-1">
              Log out
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
