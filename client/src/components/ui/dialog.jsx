import React, { createContext, useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './button';

const DialogContext = createContext({});

const Dialog = ({ children, open, onOpenChange, ...props }) => {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      <div {...props}>{children}</div>
    </DialogContext.Provider>
  );
};

const DialogTrigger = ({ children, asChild = false, ...props }) => {
  const { onOpenChange } = useContext(DialogContext);

  const handleClick = () => {
    onOpenChange?.(true);
  };

  if (asChild) {
    return React.cloneElement(children, {
      onClick: handleClick,
      ...props,
    });
  }

  return (
    <button onClick={handleClick} {...props}>
      {children}
    </button>
  );
};

const DialogContent = ({ children, className, ...props }) => {
  const { open, onOpenChange } = useContext(DialogContext);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onOpenChange?.(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return createPortal(
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      {/* Backdrop */}
      <div
        className='fixed inset-0 bg-black/50'
        onClick={() => onOpenChange?.(false)}
      />

      {/* Content */}
      <div
        className={cn(
          'relative bg-white rounded-lg shadow-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden',
          className
        )}
        {...props}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

const DialogHeader = ({ children, className, ...props }) => {
  const { onOpenChange } = useContext(DialogContext);

  return (
    <div
      className={cn(
        'flex items-center justify-between p-6 border-b',
        className
      )}
      {...props}
    >
      <div className='flex-1'>{children}</div>
      <Button
        variant='ghost'
        size='icon'
        onClick={() => onOpenChange?.(false)}
        className='h-8 w-8'
      >
        <X className='h-4 w-4' />
      </Button>
    </div>
  );
};

const DialogTitle = ({ children, className, ...props }) => (
  <h2 className={cn('text-lg font-semibold', className)} {...props}>
    {children}
  </h2>
);

const DialogDescription = ({ children, className, ...props }) => (
  <p className={cn('text-sm text-gray-600 mt-1', className)} {...props}>
    {children}
  </p>
);

const DialogFooter = ({ children, className, ...props }) => (
  <div
    className={cn('flex justify-end gap-2 p-6 border-t', className)}
    {...props}
  >
    {children}
  </div>
);

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
};
