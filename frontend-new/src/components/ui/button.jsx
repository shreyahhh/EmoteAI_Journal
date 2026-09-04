import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold font-sans transition disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  {
    variants: {
      variant: {
        gradient: 'bg-emote-accent-2 text-primary-foreground shadow-sm hover:bg-emote-accent',
        default: 'bg-primary text-primary-foreground shadow-sm hover:brightness-105',
        outline:
          'rounded-xl border border-border bg-card text-secondary-foreground shadow-sm hover:border-emote-border-strong hover:bg-accent',
        ghost: 'rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground',
        destructive:
          'rounded-xl text-destructive hover:bg-destructive/10 focus-visible:ring-destructive',
        icon: 'h-10 w-10 rounded-xl border border-border bg-card text-muted-foreground shadow-sm hover:border-emote-border-strong hover:bg-accent hover:text-foreground',
      },
      size: {
        default: 'px-6 py-2.5 text-emote-muted',
        sm: 'px-4 py-2 text-emote-muted',
        lg: 'px-8 py-3 text-emote-body',
        icon: 'h-10 w-10 shrink-0',
      },
    },
    compoundVariants: [
      {
        variant: 'icon',
        size: 'default',
        class: 'p-0',
      },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />;
});
Button.displayName = 'Button';

export { Button, buttonVariants };
