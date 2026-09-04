import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../lib/utils';

export default function NavList({ tabs, activeTab, onSelect, onCloseMobile, className = '' }) {
  return (
    <nav className={cn('flex flex-col gap-0.5', className)} aria-label="Main navigation">
      <AnimatePresence initial={false}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              type="button"
              key={tab.id}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onSelect(tab.id);
                onCloseMobile?.();
              }}
              className={cn(
                'flex w-full items-center gap-2.5 overflow-hidden rounded-lg px-2.5 py-2 text-left text-emote-nav font-medium text-muted-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                isActive
                  ? 'bg-accent font-semibold text-foreground'
                  : 'hover:bg-accent/60 hover:text-foreground',
              )}
            >
              <Icon
                className={cn('h-4 w-4 shrink-0', isActive ? 'text-emote-accent-2' : 'text-emote-ink-faint')}
                aria-hidden
              />
              <span>{tab.label}</span>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </nav>
  );
}
