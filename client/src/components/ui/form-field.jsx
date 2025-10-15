import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input } from './input';
import { Label } from './label';

const FormField = React.forwardRef(
  (
    {
      className,
      label,
      error,
      required = false,
      helperText,
      children,
      ...props
    },
    ref
  ) => {
    const id = React.useId();

    return (
      <div className={cn('space-y-2', className)}>
        {label && (
          <Label htmlFor={id} className='text-sm font-medium text-foreground'>
            {label}
            {required && <span className='text-destructive ml-[1px]'>*</span>}
          </Label>
        )}

        <div className='relative'>
          {React.isValidElement(children)
            ? React.cloneElement(children, {
                id,
                className: cn(
                  children.props.className,
                  error &&
                    'border-destructive focus-visible:ring-destructive/20'
                ),
                'aria-invalid': !!error,
                'aria-describedby': error
                  ? `${id}-error`
                  : helperText
                  ? `${id}-helper`
                  : undefined,
                ref,
                ...props,
              })
            : children}
        </div>

        {error && (
          <p id={`${id}-error`} className='text-sm text-destructive'>
            {error}
          </p>
        )}

        {helperText && !error && (
          <p id={`${id}-helper`} className='text-xs text-muted-foreground'>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

// Specific form field components
const FormInput = React.forwardRef(
  ({ label, error, required, helperText, ...props }, ref) => {
    return (
      <FormField
        label={label}
        error={error}
        required={required}
        helperText={helperText}
      >
        <Input ref={ref} {...props} />
      </FormField>
    );
  }
);

FormInput.displayName = 'FormInput';

const FormSelect = React.forwardRef(
  (
    {
      label,
      error,
      required,
      helperText,
      options = [],
      placeholder = 'Select an option...',
      className,
      ...props
    },
    ref
  ) => {
    return (
      <FormField
        label={label}
        error={error}
        required={required}
        helperText={helperText}
      >
        <select
          ref={ref}
          className={cn(
            'flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none',
            'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
            'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
            'aria-invalid:ring-destructive/20 aria-invalid:border-destructive',
            'md:text-sm',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value='' disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FormField>
    );
  }
);

FormSelect.displayName = 'FormSelect';

const FormTextarea = React.forwardRef(
  (
    { label, error, required, helperText, className, rows = 3, ...props },
    ref
  ) => {
    return (
      <FormField
        label={label}
        error={error}
        required={required}
        helperText={helperText}
      >
        <textarea
          ref={ref}
          rows={rows}
          className={cn(
            'flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none',
            'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
            'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
            'aria-invalid:ring-destructive/20 aria-invalid:border-destructive',
            'placeholder:text-muted-foreground',
            'md:text-sm',
            className
          )}
          {...props}
        />
      </FormField>
    );
  }
);

FormTextarea.displayName = 'FormTextarea';

export { FormField, FormInput, FormSelect, FormTextarea };
