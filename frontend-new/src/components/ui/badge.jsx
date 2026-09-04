import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-emote-caption font-semibold ring-1 ring-inset transition',
  {
    variants: {
      variant: {
        default: 'bg-primary/10 text-primary ring-primary/30',
        secondary: 'bg-secondary text-secondary-foreground ring-border',
        outline: 'bg-transparent text-foreground ring-border',
        destructive: 'bg-destructive/10 text-destructive ring-destructive/30',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Badge({ className, variant, style, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} style={style} {...props} />;
}

export { Badge, badgeVariants };
