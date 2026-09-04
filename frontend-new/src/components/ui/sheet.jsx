import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetPortal = DialogPrimitive.Portal;
const SheetClose = DialogPrimitive.Close;

const SheetOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn('fixed inset-0 z-40 bg-emote-ink/40 backdrop-blur-sm', className)}
    {...props}
  />
));
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName;

const SIDE_MOTION = {
  left: { initial: { x: '-100%' }, animate: { x: 0 } },
  right: { initial: { x: '100%' }, animate: { x: 0 } },
};

const SheetContent = React.forwardRef(({ className, side = 'left', children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content ref={ref} asChild {...props}>
      <motion.div
        initial={SIDE_MOTION[side].initial}
        animate={SIDE_MOTION[side].animate}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          'fixed inset-y-0 z-50 flex w-[min(320px,92vw)] flex-col border-border bg-card text-card-foreground shadow-xl focus:outline-none',
          side === 'left' ? 'left-0 border-r' : 'right-0 border-l',
          className,
        )}
      >
        {children}
      </motion.div>
    </DialogPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = DialogPrimitive.Content.displayName;

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetOverlay };
