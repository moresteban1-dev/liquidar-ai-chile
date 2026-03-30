import { cn } from '@/lib/utils';
import React from 'react';

export interface BentoGridProps {
    className?: string;
    children?: React.ReactNode;
}

export const BentoGrid = ({ className, children }: BentoGridProps) => {
    return (
        <div
            className={cn(
                "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mx-auto",
                className
            )}
        >
            {children}
        </div>
    );
};

export interface BentoGridItemProps {
    className?: string;
    children: React.ReactNode;
    span?: "sm" | "md" | "lg" | "xl" | "row";
}

export const BentoGridItem = ({
    className,
    children,
    span = "sm",
}: BentoGridItemProps) => {
    const spanClasses = {
        sm: "col-span-1",
        md: "col-span-1 md:col-span-2",
        lg: "col-span-1 md:col-span-2 lg:col-span-3",
        xl: "col-span-1 md:col-span-2 lg:col-span-4", // Full row
        row: "col-span-full",
    };

    return (
        <div
            className={cn(
                "row-span-1 rounded-xl group/bento transition duration-200 h-full",
                spanClasses[span],
                className
            )}
        >
            {children}
        </div>
    );
};
