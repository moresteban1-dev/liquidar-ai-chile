"use client";

import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    footer?: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) {
    // Close on escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-2xl',
    };

    // Portal to body to ensure it's on top of everything
    // Note: In Next.js App Router, we usually just render inline if not using a specific portal root, 
    // but fixed positioning handles z-index well. For simplicity avoiding createPortal if problematic with SSR,
    // but standard React portal is fine in client components.
    // However, to be safe with SSR hydration, we'll just return the JSX (fixed overlay).

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizeClasses[size]} overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
                {title && (
                    <div className="px-6 py-4 border-b border-border flex justify-between items-center">
                        <h3 className="font-semibold text-lg text-foreground">{title}</h3>
                        <button
                            onClick={onClose}
                            className="text-muted-foreground hover:text-foreground transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}

                <div className="p-6">
                    {children}
                </div>

                {footer && (
                    <div className="px-6 py-4 bg-muted/50 border-t border-border flex justify-end gap-3">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
