import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import TopBar from './TopBar';
import NavDrawer from './NavDrawer';

export default function AppShell({
  primaryTabs,
  secondaryTabs,
  activeTab,
  onSelectTab,
  onOpenSettings,
  onLogout,
  mobileNavOpen,
  onMobileNavOpenChange,
  title,
  subtitle,
  headerExtra,
  children,
}) {
  return (
    <div className="relative flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden bg-background text-foreground">
      <div className="emote-mesh" aria-hidden />

      <div className="emote-main-canvas min-w-0 pt-14">
        <div className="emote-main-scroll">
          <header className="mb-6 border-b border-border pb-5 lg:mb-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-emote-page font-semibold tracking-tight text-foreground">{title}</h2>
              {headerExtra}
            </div>
            <p className="mt-2 max-w-2xl text-emote-muted leading-relaxed text-muted-foreground">{subtitle}</p>
          </header>

          <AnimatePresence mode="wait">
            <motion.main
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.main>
          </AnimatePresence>
        </div>
      </div>

      <TopBar onOpenMenu={() => onMobileNavOpenChange(true)} onOpenSettings={onOpenSettings} label={title} />

      <NavDrawer
        open={mobileNavOpen}
        onOpenChange={onMobileNavOpenChange}
        primaryTabs={primaryTabs}
        secondaryTabs={secondaryTabs}
        activeTab={activeTab}
        onSelect={onSelectTab}
        onOpenSettings={onOpenSettings}
        onLogout={onLogout}
      />
    </div>
  );
}
