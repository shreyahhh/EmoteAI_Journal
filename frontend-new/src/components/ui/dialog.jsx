import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn('fixed inset-0 z-50 bg-emote-ink/40 backdrop-blur-sm', className)}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

/**
 * Radix only renders Content while open, so a plain `motion.div` (no
 * AnimatePresence) still gets its initial->animate entrance each time the
 * dialog opens — exit is instant, which is an acceptable tradeoff for
 * avoiding Radix's forceMount/open-state plumbing in a shared primitive.
 */
const DialogContent = React.forwardRef(
  ({ className, children, showClose = true, ...props }, ref) => (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'fixed left-[calc(50%_+_var(--dialog-center-offset,0px))] top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 focus:outline-none',
          className,
        )}
        {...props}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="relative max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-emote sm:p-8"
        >
          {children}
          {showClose ? (
            <DialogPrimitive.Close asChild>
              <button
                type="button"
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition hover:border-emote-border-strong hover:bg-accent hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogPrimitive.Close>
          ) : null}
        </motion.div>
      </DialogPrimitive.Content>
    </DialogPortal>
  ),
);
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }) => (
  <div className={cn('flex flex-col gap-1.5 pr-8', className)} {...props} />
);

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-emote-card-title font-semibold text-foreground', className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-emote-muted text-muted-foreground', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

const DialogFooter = ({ className, ...props }) => (
  <div className={cn('flex flex-col-reverse gap-3 sm:flex-row sm:justify-end', className)} {...props} />
);

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
