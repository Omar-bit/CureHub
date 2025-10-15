import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input } from './input';
import { Button } from './button';
import { Select } from './select';
import { Search, X, ChevronDown } from 'lucide-react';

const CategorizedSearchBar = React.forwardRef(
  (
    {
      className,
      placeholder,
      value,
      onChange,
      onClear,
      onCategoryChange,
      selectedCategory,
      categories = [],
      showClearButton = true,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const dropdownRef = React.useRef(null);

    React.useEffect(() => {
      const handleClickOutside = (event) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleClear = () => {
      if (onClear) {
        onClear();
      } else if (onChange) {
        onChange({ target: { value: '' } });
      }
    };

    const handleCategorySelect = (category) => {
      if (onCategoryChange) {
        onCategoryChange(category);
      }
      setIsOpen(false);
    };

    const selectedCategoryData =
      categories.find((cat) => cat.value === selectedCategory) || categories[0];

    // Generate context-aware placeholder
    const getPlaceholder = () => {
      if (placeholder) return placeholder;
      const categoryLabel = selectedCategoryData?.label || 'items';
      return `Search by ${categoryLabel.toLowerCase()}...`;
    };

    return (
      <div className={cn('relative', className)}>
        <div className='relative flex'>
          {/* Category Dropdown */}
          <div className='relative' ref={dropdownRef}>
            <button
              type='button'
              onClick={() => setIsOpen(!isOpen)}
              disabled={disabled}
              className={cn(
                'flex h-9 items-center justify-between rounded-l-md border border-r-0 border-input bg-background px-3 py-1 text-sm transition-colors hover:bg-accent focus:outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
                'min-w-[130px] text-muted-foreground font-medium'
              )}
            >
              <span className='truncate'>
                {selectedCategoryData?.label || 'Category'}
              </span>
              <ChevronDown
                className={cn(
                  'ml-2 h-3 w-3 transition-transform',
                  isOpen && 'rotate-180'
                )}
              />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
              <div className='absolute left-0 top-full z-50 mt-1 w-full min-w-[180px] rounded-md border border-input bg-popover shadow-lg'>
                <div className='py-1'>
                  {categories.map((category) => (
                    <button
                      key={category.value}
                      type='button'
                      onClick={() => handleCategorySelect(category.value)}
                      className={cn(
                        'flex w-full items-center px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground text-left',
                        selectedCategory === category.value &&
                          'bg-accent text-accent-foreground font-medium'
                      )}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Search Input */}
          <div className='relative flex-1'>
            <Input
              ref={ref}
              type='text'
              placeholder={getPlaceholder()}
              value={value}
              onChange={onChange}
              disabled={disabled}
              leftIcon={<Search />}
              className={cn(
                'rounded-l-none border-l-0 pr-10',
                value && showClearButton && 'pr-16'
              )}
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
        </div>
      </div>
    );
  }
);

CategorizedSearchBar.displayName = 'CategorizedSearchBar';

export { CategorizedSearchBar };
