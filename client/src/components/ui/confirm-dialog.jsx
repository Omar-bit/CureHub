import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { X, AlertTriangle } from 'lucide-react';

const ConfirmDialog = React.forwardRef(
  (
    {
      className,
      isOpen,
      onClose,
      onConfirm,
      title = 'Confirm Action',
      description,
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      variant = 'destructive',
      icon: Icon = AlertTriangle,
      isLoading = false,
      ...props
    },
    ref
  ) => {
    if (!isOpen) return null;

    return (
      <div className='fixed inset-0 z-50'>
        {/* Backdrop */}
        <div
          className='fixed inset-0 bg-black/50 backdrop-blur-sm'
          onClick={onClose}
        />

        {/* Dialog */}
        <div className='fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 transform'>
          <div
            className={cn(
              'bg-background text-foreground rounded-lg border shadow-lg duration-200 animate-in fade-in-0 zoom-in-95',
              className
            )}
            {...props}
            ref={ref}
          >
            {/* Header */}
            <div className='flex items-center justify-between p-6 pb-0'>
              <div className='flex items-center space-x-3'>
                {Icon && (
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full',
                      variant === 'destructive'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-orange-100 text-orange-600'
                    )}
                  >
                    <Icon className='h-5 w-5' />
                  </div>
                )}
                <h3 className='text-lg font-semibold'>{title}</h3>
              </div>
              <Button
                variant='ghost'
                size='icon'
                onClick={onClose}
                className='h-6 w-6 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100'
              >
                <X className='h-4 w-4' />
                <span className='sr-only'>Close</span>
              </Button>
            </div>

            {/* Content */}
            {description && (
              <div className='px-6 py-4'>
                <p className='text-sm text-muted-foreground'>{description}</p>
              </div>
            )}

            {/* Footer */}
            <div className='flex items-center justify-end space-x-2 p-6 pt-0'>
              <Button variant='outline' onClick={onClose} disabled={isLoading}>
                {cancelText}
              </Button>
              <Button
                variant={variant}
                onClick={onConfirm}
                loading={isLoading}
                disabled={isLoading}
              >
                {confirmText}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ConfirmDialog.displayName = 'ConfirmDialog';

export { ConfirmDialog };
