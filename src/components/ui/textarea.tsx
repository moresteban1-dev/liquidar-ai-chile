import * as React from 'react';

import { cn } from '@/lib/utils'

interface TextareaProps extends React.ComponentProps<"textarea"> {
  /** @deprecated Use a separate Label component */
  label?: string;
}

function Textarea({ className, label, id, ...props }: TextareaProps) {
  const textareaId = id || (label ? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  const textareaElement = (
    <textarea
      id={textareaId}
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  );

  if (label) {
    return (
      <div className="space-y-1.5">
        <label
          htmlFor={textareaId}
          className="text-sm font-medium text-foreground/80"
        >
          {label}
        </label>
        {textareaElement}
      </div>
    );
  }

  return textareaElement;
}

export { Textarea }

