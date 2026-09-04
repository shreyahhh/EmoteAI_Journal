import React from 'react';
import { X } from 'lucide-react';
import { Sheet, SheetContent } from '../components/ui/sheet';
import { Button } from '../components/ui/button';
import NavList from './NavList';
import UserFooter from './UserFooter';

export default function MobileNavSheet({ open, onOpenChange, navTabs, activeTab, onSelect, email, onOpenSettings, onLogout }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="lg:hidden">
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <span className="text-emote-card-title font-semibold text-foreground">Menu</span>
          <Button type="button" variant="icon" size="icon" onClick={() => onOpenChange(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 pt-2">
          <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
            <NavList tabs={navTabs} activeTab={activeTab} onSelect={onSelect} onCloseMobile={() => onOpenChange(false)} />
          </div>
          <UserFooter email={email} compact onOpenSettings={onOpenSettings} onLogout={onLogout} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
