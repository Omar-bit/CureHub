import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card } from './card';
import { Button } from './button';
import { ChevronRight } from 'lucide-react';

const EntityCard = React.forwardRef(
  (
    {
      className,
      avatar,
      title,
      subtitle,
      description,
      metadata = [],
      actions = [],
      onClick,
      showChevron = true,
      ...props
    },
    ref
  ) => {
    return (
      <Card
        className={cn(
          'p-4 hover:shadow-md transition-all duration-200 cursor-pointer border border-border',
          onClick && 'hover:border-ring/30',
          className
        )}
        onClick={onClick}
        ref={ref}
        {...props}
      >
        <div className='flex items-start justify-between'>
          <div className='flex items-start space-x-3 flex-1 min-w-0'>
            {/* Avatar */}
            {avatar && <div className='flex-shrink-0'>{avatar}</div>}

            {/* Content */}
            <div className='flex-1 min-w-0'>
              {/* Title */}
              {title && (
                <h3 className='text-sm font-medium text-foreground truncate'>
                  {title}
                </h3>
              )}

              {/* Subtitle */}
              {subtitle && (
                <p className='text-sm text-muted-foreground mt-1'>{subtitle}</p>
              )}

              {/* Description */}
              {description && (
                <p className='text-xs text-muted-foreground mt-2 line-clamp-2'>
                  {description}
                </p>
              )}

              {/* Metadata */}
              {metadata.length > 0 && (
                <div className='mt-2 space-y-1'>
                  {metadata.map((item, index) => (
                    <div
                      key={index}
                      className='flex items-center text-xs text-muted-foreground'
                    >
                      {item.icon && (
                        <span className='mr-1 flex-shrink-0'>
                          {React.cloneElement(item.icon, {
                            className: 'w-3 h-3',
                          })}
                        </span>
                      )}
                      <span className={cn('truncate', item.className)}>
                        {item.label && (
                          <span className='font-medium'>{item.label}: </span>
                        )}
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions and Chevron */}
          <div className='flex items-center space-x-2 ml-2 flex-shrink-0'>
            {/* Action Buttons */}
            {actions.map((action, index) => (
              <Button
                key={index}
                variant='ghost'
                size='icon'
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick?.(e);
                }}
                className={cn(
                  'h-8 w-8 text-muted-foreground hover:text-foreground',
                  action.variant === 'destructive' && 'hover:text-destructive',
                  action.className
                )}
                title={action.tooltip}
              >
                {action.icon}
              </Button>
            ))}

            {/* Chevron */}
            {showChevron && onClick && (
              <ChevronRight className='w-4 h-4 text-muted-foreground' />
            )}
          </div>
        </div>
      </Card>
    );
  }
);

EntityCard.displayName = 'EntityCard';

export { EntityCard };
