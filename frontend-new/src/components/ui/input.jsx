import React from 'react';
import { cn } from '../../lib/utils';

const Input = React.forwardRef(({ className, type, ...props }, ref) => (
  <input
    type={type}
    ref={ref}
    className={cn(
      'flex w-full rounded-none border border-transparent border-b-input bg-transparent px-0 py-3 font-sans text-emote-body text-foreground transition-colors placeholder:text-muted-foreground/70 focus:border-b-ring focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    {...props}
  />
));
Input.displayName = 'Input';

export { Input };
