import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef(
  ({ className, type, leftIcon, rightIcon, ...props }, ref) => {
    // If no icons, render simple input
    if (!leftIcon && !rightIcon) {
      return (
        <input
          type={type}
          data-slot='input'
          className={cn(
            'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
            'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
            'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
            className
          )}
          ref={ref}
          {...props}
        />
      );
    }

    // Render input with icon wrapper
    return (
      <div className='relative'>
        {leftIcon && (
          <div className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground [&>svg]:size-4'>
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          data-slot='input'
          className={cn(
            'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
            'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
            'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            !leftIcon && !rightIcon && 'px-3',
            className
          )}
          ref={ref}
          {...props}
        />
        {rightIcon && (
          <div className='absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground [&>svg]:size-4'>
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
