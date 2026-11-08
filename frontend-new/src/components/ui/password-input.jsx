import React from 'react';
import { Input } from './input';
import { cn } from '../../lib/utils';

const PasswordInput = React.forwardRef(({ className, ...props }, ref) => {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="relative">
      <Input ref={ref} type={visible ? 'text' : 'password'} className={cn('pr-14', className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        className="absolute inset-y-0 right-4 flex items-center text-[13px] text-muted-foreground transition hover:text-foreground"
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? 'Hide' : 'Show'}
      </button>
    </div>
  );
});
PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
