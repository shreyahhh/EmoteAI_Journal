import React from 'react';
import { Settings, LogOut } from 'lucide-react';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';

export default function UserFooter({ email, compact, onOpenSettings, onLogout }) {
  return (
    <div className={cn('shrink-0', compact ? 'mt-auto border-t border-border pt-3' : 'border-t border-border p-4')}>
      <p className={cn('truncate text-emote-caption text-emote-ink-faint', compact ? 'px-1' : 'px-0')} title={email}>
        {email}
      </p>
      {/* Equal-weight pair instead of an icon-only button on one side and
          bare ghost text pushed to the other — that left "Log out" reading
          as stray unstyled text with no visible affordance. */}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onOpenSettings} className="gap-1.5">
          <Settings className="h-4 w-4" />
          Settings
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onLogout}
          className="gap-1.5 text-[#a8432f] hover:border-[#a8432f]/40 hover:bg-[#a8432f]/10 hover:text-[#a8432f]"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </Button>
      </div>
    </div>
  );
}
