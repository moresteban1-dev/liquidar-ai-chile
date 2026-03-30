'use client';

import { siteConfig } from '@/config/site';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

export function WhatsAppButton() {
    const [isHovered, setIsHovered] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleClick = () => {
        window.open(siteConfig.links.whatsapp, '_blank');
    };

    if (!mounted) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex items-center justify-end sm:bottom-8 sm:right-8">
            <Button
                onClick={handleClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={cn(
                    "relative h-14 rounded-full shadow-2xl transition-all duration-500 ease-out",
                    "bg-gradient-to-r from-indigo-600 to-indigo-500",
                    "hover:from-indigo-500 hover:to-indigo-400",
                    "text-white border border-indigo-200/20 backdrop-blur-sm",
                    "flex items-center justify-center overflow-hidden",
                    // Width transition for the "pill" effect
                    isHovered ? "w-[160px] pr-6" : "w-14"
                )}
                aria-label="Contactar Soporte"
            >
                {/* Subtle shine effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 hover:opacity-100 transition-opacity duration-700" />

                <MessageCircle
                    className={cn(
                        "w-7 h-7 shrink-0 transition-transform duration-500",
                        isHovered ? "rotate-12 scale-110" : ""
                    )}
                />

                <span
                    className={cn(
                        "whitespace-nowrap ml-3 font-medium text-base tracking-wide transition-all duration-500 ease-out",
                        isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 absolute"
                    )}
                >
                    Soporte AI
                </span>
            </Button>

            {/* Pulsing ring for attention (only when not hovered) */}
            {!isHovered && (
                <span className="absolute inline-flex h-14 w-14 rounded-full bg-indigo-500 opacity-20 animate-ping -z-10" />
            )}
        </div>
    );
}
