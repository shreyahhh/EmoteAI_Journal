import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';
import MobileNavSheet from './MobileNavSheet';

export default function AppShell({
  navTabs,
  activeTab,
  onSelectTab,
  email,
  onOpenSettings,
  onLogout,
  mobileNavOpen,
  onMobileNavOpenChange,
  title,
  subtitle,
  headerExtra,
  children,
}) {
  // The sidebar (lg+ only) is fixed chrome — let centered dialogs/alerts
  // center against the remaining content area instead of the raw viewport.
  // See the `--dialog-center-offset` rule in index.css.
  React.useEffect(() => {
    document.documentElement.classList.add('has-sidebar');
    return () => document.documentElement.classList.remove('has-sidebar');
  }, []);

  return (
    <div className="relative flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden bg-background text-foreground lg:flex-row">
      <div className="emote-mesh" aria-hidden />

      <Sidebar
        navTabs={navTabs}
        activeTab={activeTab}
        onSelect={onSelectTab}
        email={email}
        onOpenSettings={onOpenSettings}
        onLogout={onLogout}
      />

      <div className="emote-main-canvas min-w-0 pt-14 lg:pt-0">
        <div className="emote-main-scroll">
          <header className="mb-6 border-b border-border pb-5 lg:mb-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-emote-page font-semibold tracking-tight text-foreground">{title}</h2>
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

      <MobileHeader onOpenMenu={() => onMobileNavOpenChange(true)} onOpenSettings={onOpenSettings} />

      <MobileNavSheet
        open={mobileNavOpen}
        onOpenChange={onMobileNavOpenChange}
        navTabs={navTabs}
        activeTab={activeTab}
        onSelect={onSelectTab}
        email={email}
        onOpenSettings={onOpenSettings}
        onLogout={onLogout}
      />
    </div>
  );
}
