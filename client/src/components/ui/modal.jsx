import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { X } from 'lucide-react';

const Modal = React.forwardRef(
  (
    {
      className,
      isOpen,
      onClose,
      title,
      children,
      footer,
      size = 'default',
      closeOnBackdropClick = true,
      showCloseButton = true,
      ...props
    },
    ref
  ) => {
    // Handle escape key
    React.useEffect(() => {
      const handleEscape = (event) => {
        if (event.key === 'Escape' && isOpen) {
          onClose?.();
        }
      };

      if (isOpen) {
        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';
      }

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
      };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizeClasses = {
      sm: 'max-w-md',
      default: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
      full: 'max-w-7xl mx-4',
    };

    return (
      <div className='fixed inset-0 z-50 '>
        {/* Backdrop */}
        <div
          className='fixed inset-0 bg-black/40 backdrop-blur-xs'
          onClick={closeOnBackdropClick ? onClose : undefined}
        />

        {/* Modal */}
        <div className='fixed left-1/2 top-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2 transform flex items-center justify-center'>
          <div
            className={cn(
              'bg-background text-foreground rounded-lg border shadow-lg duration-200 animate-in fade-in-0 zoom-in-95 max-h-[90vh] overflow-hidden flex flex-col',
              sizeClasses[size],
              className
            )}
            {...props}
            ref={ref}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className='flex items-center justify-between p-6 pb-4 border-b'>
                {title && (
                  <h2 className='text-lg font-semibold leading-none tracking-tight'>
                    {title}
                  </h2>
                )}
                {showCloseButton && (
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={onClose}
                    className='h-6 w-6 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
                  >
                    <X className='h-4 w-4' />
                    <span className='sr-only'>Close</span>
                  </Button>
                )}
              </div>
            )}

            {/* Content */}
            <div className='p-6 flex-1 overflow-auto'>{children}</div>

            {/* Footer */}
            {footer && <div className='border-t p-6 pt-4'>{footer}</div>}
          </div>
        </div>
      </div>
    );
  }
);

Modal.displayName = 'Modal';

// Modal composition components
const ModalHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex flex-col space-y-1.5 text-center sm:text-left',
      className
    )}
    {...props}
  />
));
ModalHeader.displayName = 'ModalHeader';

const ModalTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
));
ModalTitle.displayName = 'ModalTitle';

const ModalDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
ModalDescription.displayName = 'ModalDescription';

const ModalContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('grid gap-4', className)} {...props} />
));
ModalContent.displayName = 'ModalContent';

const ModalFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      className
    )}
    {...props}
  />
));
ModalFooter.displayName = 'ModalFooter';

export {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalContent,
  ModalFooter,
};
