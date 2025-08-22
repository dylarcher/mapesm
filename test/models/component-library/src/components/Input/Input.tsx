// Component Library Pattern - Input Component
import React, { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '../utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  helperText?: string;
  label?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    type = 'text',
    error = false,
    helperText,
    label,
    leftIcon,
    rightIcon,
    id,
    ...props
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const inputClasses = cn(
      // Base styles
      'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
      'file:border-0 file:bg-transparent file:text-sm file:font-medium',
      'placeholder:text-muted-foreground',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50',
      // Icon padding adjustments
      leftIcon && 'pl-10',
      rightIcon && 'pr-10',
      // Error styles
      error && 'border-destructive focus-visible:ring-destructive',
      className
    );

    const containerClasses = cn(
      'space-y-2'
    );

    const labelClasses = cn(
      'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      error && 'text-destructive'
    );

    const helperTextClasses = cn(
      'text-sm',
      error ? 'text-destructive' : 'text-muted-foreground'
    );

    const iconContainerClasses = 'absolute inset-y-0 flex items-center pointer-events-none';

    return (
      <div className={containerClasses}>
        {label && (
          <label htmlFor={inputId} className={labelClasses}>
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className={cn(iconContainerClasses, 'left-0 pl-3')}>
              {leftIcon}
            </div>
          )}

          <input
            type={type}
            className={inputClasses}
            ref={ref}
            id={inputId}
            {...props}
          />

          {rightIcon && (
            <div className={cn(iconContainerClasses, 'right-0 pr-3')}>
              {rightIcon}
            </div>
          )}
        </div>

        {helperText && (
          <p className={helperTextClasses}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
