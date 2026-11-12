import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/utils';

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetPortal = DialogPrimitive.Portal;
const SheetClose = DialogPrimitive.Close;

const SheetOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn('fixed inset-0 z-40 bg-black/60', className)}
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

/**
 * Mobile bottom sheet: 28px top corners, a drag handle, and drag-to-dismiss.
 * Used for Cycle's Log sheet / Day detail on narrow viewports; the desktop
 * layout renders the same content inline instead of in a sheet.
 */
const BottomSheet = ({ open, onOpenChange, children, className }) => {
  const prefersReducedMotion = useReducedMotion();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetPortal>
        <SheetOverlay />
        <DialogPrimitive.Content asChild onOpenAutoFocus={(e) => e.preventDefault()}>
          <motion.div
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onOpenChange(false);
            }}
            initial={prefersReducedMotion ? { y: 0 } : { y: '100%' }}
            animate={{ y: 0 }}
            exit={prefersReducedMotion ? { y: 0 } : { y: '100%' }}
            transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', damping: 32, stiffness: 300 }}
            className={cn(
              'fixed inset-x-0 bottom-0 z-50 flex max-h-[88vh] flex-col rounded-t-[28px] border-t border-border bg-card text-card-foreground shadow-xl focus:outline-none',
              className,
            )}
          >
            <div className="flex shrink-0 justify-center pb-2 pt-2.5">
              <span className="h-1 w-9 rounded-full bg-emote-border-strong" aria-hidden />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              {children}
            </div>
          </motion.div>
        </DialogPrimitive.Content>
      </SheetPortal>
    </Sheet>
  );
};

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetOverlay, BottomSheet };
