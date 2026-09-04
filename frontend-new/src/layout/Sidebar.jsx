import React from 'react';
import Logo from '../components/shared/Logo';
import NavList from './NavList';
import UserFooter from './UserFooter';

export default function Sidebar({ navTabs, activeTab, onSelect, email, onOpenSettings, onLogout }) {
  return (
    <aside
      className="relative z-20 hidden h-full min-h-0 w-64 shrink-0 flex-col border-r border-border bg-card lg:flex"
      aria-label="Sidebar"
    >
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <Logo size={20} />
        <span className="emote-title-gradient text-base font-semibold tracking-tight">Emote</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-2">
        <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
          <NavList tabs={navTabs} activeTab={activeTab} onSelect={onSelect} className="shrink-0" />
        </div>
        <UserFooter email={email} compact onOpenSettings={onOpenSettings} onLogout={onLogout} />
      </div>
    </aside>
  );
}
