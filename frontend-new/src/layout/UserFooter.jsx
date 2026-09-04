import React from 'react';
import { Settings } from 'lucide-react';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';

export default function UserFooter({ email, compact, onOpenSettings, onLogout }) {
  return (
    <div className={cn('shrink-0', compact ? 'mt-auto border-t border-border pt-3' : 'border-t border-border p-4')}>
      <p className={cn('truncate text-emote-caption text-emote-ink-faint', compact ? 'px-1' : 'px-0')} title={email}>
        {email}
      </p>
      <div className="mt-2 flex items-center gap-1">
        <Button
          type="button"
          variant="icon"
          size="icon"
          onClick={onOpenSettings}
          title="Settings"
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onLogout} className="ml-auto">
          Log out
        </Button>
      </div>
    </div>
  );
}
