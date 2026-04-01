import * as React from 'react';

import { cn } from '@/lib/utils'

interface InputProps extends React.ComponentProps<"input"> {
  /** @deprecated Use a separate Label component */
  label?: string;
}

function Input({ className, type, label, id, ...props }: InputProps) {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  const inputElement = (
    <input
      type={type}
      id={inputId}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-indigo-100 selection:text-indigo-900 border-border h-10 w-full min-w-0 rounded-lg border bg-card/50 px-3 py-2 text-sm shadow-sm transition-all duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 hover:border-indigo-300 dark:hover:border-indigo-700",
        "focus-visible:border-indigo-500 focus-visible:ring-4 focus-visible:ring-indigo-500/10",
        "aria-invalid:ring-red-500/20 aria-invalid:border-red-500",
        className
      )}
      {...props}
    />
  );

  if (label) {
    return (
      <div className="space-y-1.5">
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-foreground/80"
        >
          {label}
        </label>
        {inputElement}
      </div>
    );
  }

  return inputElement;
}

export { Input }

