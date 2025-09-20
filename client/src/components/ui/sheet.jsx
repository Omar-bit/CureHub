import * as React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Button } from './button';

const Sheet = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('fixed inset-0 z-50', className)} {...props} />
));
Sheet.displayName = 'Sheet';

const SheetTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <Button ref={ref} className={className} {...props} />
));
SheetTrigger.displayName = 'SheetTrigger';

const SheetClose = React.forwardRef(({ className, ...props }, ref) => (
  <Button
    ref={ref}
    variant='ghost'
    size='icon'
    className={cn(
      'absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none',
      className
    )}
    {...props}
  >
    <X className='h-4 w-4' />
    <span className='sr-only'>Close</span>
  </Button>
));
SheetClose.displayName = 'SheetClose';

const SheetOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <div
    className={cn(
      'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = 'SheetOverlay';

const SheetContent = React.forwardRef(
  ({ side = 'right', className, children, onClose, title, ...props }, ref) => {
    const sideClasses = {
      top: 'inset-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
      bottom:
        'inset-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
      left: 'inset-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm',
      right:
        'inset-0    border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm',
    };

    return (
      <div className='absolute inset-0 z-50 '>
        {/* <SheetOverlay onClick={onClose} /> */}
        <div
          className={cn(
            'overflow-y-auto absolute z-50 gap-4 bg-background p-0 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500',
            sideClasses[side],
            'w-full sm:max-w-auto',
            className
          )}
          {...props}
          ref={ref}
        >
          {title && (
            <div className='sticky top-0  border-b border-border px-6 py-4 flex items-center justify-between z-[100] bg-white/80'>
              <h2 className='text-lg font-semibold text-foreground'>{title}</h2>
              <Button
                variant='ghost'
                size='icon'
                onClick={onClose}
                className='h-6 w-6 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
              >
                <X className='h-4 w-4' />
                <span className='sr-only'>Close</span>
              </Button>
            </div>
          )}
          <div className='overflow-y-auto flex-1 p-6 '>{children}</div>
        </div>
      </div>
    );
  }
);
SheetContent.displayName = 'SheetContent';

const SheetHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    className={cn(
      'flex flex-col space-y-2 text-center sm:text-left',
      className
    )}
    {...props}
    ref={ref}
  />
));
SheetHeader.displayName = 'SheetHeader';

const SheetFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      className
    )}
    {...props}
    ref={ref}
  />
));
SheetFooter.displayName = 'SheetFooter';

const SheetTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    className={cn('text-lg font-semibold text-foreground', className)}
    {...props}
    ref={ref}
  />
));
SheetTitle.displayName = 'SheetTitle';

const SheetDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
    ref={ref}
  />
));
SheetDescription.displayName = 'SheetDescription';

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
