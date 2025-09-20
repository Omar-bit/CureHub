import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input } from './input';
import { Button } from './button';
import { Search, X } from 'lucide-react';

const SearchBar = React.forwardRef(
  (
    {
      className,
      placeholder = 'Search...',
      value,
      onChange,
      onClear,
      showClearButton = true,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const handleClear = () => {
      if (onClear) {
        onClear();
      } else if (onChange) {
        onChange({ target: { value: '' } });
      }
    };

    return (
      <div className={cn('relative', className)}>
        <Input
          ref={ref}
          type='text'
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          leftIcon={<Search />}
          className={cn('pr-10', value && showClearButton && 'pr-16')}
          {...props}
        />

        {value && showClearButton && (
          <Button
            type='button'
            variant='ghost'
            size='icon'
            onClick={handleClear}
            disabled={disabled}
            className='absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
          >
            <X className='h-3 w-3' />
            <span className='sr-only'>Clear search</span>
          </Button>
        )}
      </div>
    );
  }
);

SearchBar.displayName = 'SearchBar';

export { SearchBar };
