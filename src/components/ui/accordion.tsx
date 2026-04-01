"use client"

import * as React from 'react';
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createContext, useContext, useState } from 'react'

const AccordionContext = createContext<{
    activeItem: string | null;
    toggleItem: (value: string) => void;
} | null>(null);

const Accordion = ({ className, children, collapsible, ...props }: React.HTMLAttributes<HTMLDivElement> & { type?: "single" | "multiple", collapsible?: boolean }) => {
    const [activeItem, setActiveItem] = useState<string | null>(null);
    const toggleItem = (value: string) => {
        setActiveItem(prev => prev === value ? (collapsible ? null : prev) : value);
    };

    return (
        <AccordionContext.Provider value={{ activeItem, toggleItem }}>
            <div className={cn("space-y-1", className)} {...props}>
                {children}
            </div>
        </AccordionContext.Provider>
    )
}

const AccordionItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { value: string }>(({ className, value, children, ...props }, ref) => (
    <div ref={ref} className={cn("border-b", className)} {...props}>
        {React.Children.map(children, child => {
            if (React.isValidElement(child)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return React.cloneElement(child, { value } as any);
            }
            return child;
        })}
    </div>
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { value?: string }>(({ className, children, value, ...props }, ref) => {
    const ctx = useContext(AccordionContext);
    const isOpen = ctx?.activeItem === value;
    return (
        <button
            ref={ref}
            onClick={() => value && ctx?.toggleItem(value)} // Only toggle if value is present
            className={cn(
                "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
                className
            )}
            data-state={isOpen ? "open" : "closed"}
            {...props}
        >
            {children}
            <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
        </button>
    )
})
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { value?: string }>(({ className, children, value, ...props }, ref) => {
    const ctx = useContext(AccordionContext);
    const isOpen = ctx?.activeItem === value;

    if (!isOpen) return null;

    return (
        <div
            ref={ref}
            className={cn("overflow-hidden text-sm pb-4 pt-0", className)}
            {...props}
        >
            {children}
        </div>
    )
})
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
