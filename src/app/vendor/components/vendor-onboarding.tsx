'use client';

/**
 * Vendor Onboarding Stepper - Refactored for Grade A Performance
 */

import { memo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, User, Package, FileText, ArrowRight, X } from 'lucide-react';
import { useVendorOnboarding, OnboardingStep } from './hooks/useVendorOnboarding';
import { cn } from '@/lib/utils';

/**
 * OnboardingStepItem - Atomic component memoized for performance.
 */
const OnboardingStepItem = memo(({ step }: { step: OnboardingStep }) => {
    const icons: Record<string, React.ReactNode> = {
        'profile': <User className="h-4 w-4" />,
        'inventory': <Package className="h-4 w-4" />,
        'bid': <FileText className="h-4 w-4" />,
    };

    return (
        <div
            className={cn(
                "flex items-center gap-3 p-3 rounded-2xl border transition-all duration-300",
                step.isComplete
                    ? 'bg-emerald-500/5 border-emerald-500/20 dark:bg-emerald-500/10'
                    : 'bg-card border-border hover:border-indigo-500/30 hover:shadow-sm'
            )}
        >
            <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
                step.isComplete
                    ? 'bg-emerald-500 text-white'
                    : 'bg-muted text-muted-foreground'
            )}>
                {step.isComplete ? <Check className="h-4 w-4 stroke-[3]" /> : icons[step.id]}
            </div>
            
            <div className="flex-1 min-w-0">
                <p className={cn(
                    "text-sm font-bold tracking-tight",
                    step.isComplete ? 'text-emerald-700 dark:text-emerald-400 line-through opacity-60' : 'text-foreground'
                )}>
                    {step.label}
                </p>
                <p className="text-[11px] text-muted-foreground truncate font-medium">{step.description}</p>
            </div>

            {!step.isComplete && (
                <Link href={step.href as any} passHref>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-indigo-500 hover:text-white transition-all">
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </Link>
            )}
        </div>
    );
});

OnboardingStepItem.displayName = 'OnboardingStepItem';

/**
 * Core VendorOnboarding component
 */
export function VendorOnboarding({ hasProfile, hasInventory, hasBids }: {
    hasProfile: boolean;
    hasInventory: boolean;
    hasBids: boolean;
}) {
    const { 
        dismissed, 
        progress, 
        completedCount, 
        steps, 
        handleDismiss 
    } = useVendorOnboarding(hasProfile, hasInventory, hasBids);

    const allComplete = hasProfile && hasInventory && hasBids;
    if (dismissed || allComplete) return null;

    return (
        <Card className="bg-gradient-to-br from-indigo-500/5 via-card to-purple-500/5 border-indigo-500/10 shadow-xl shadow-indigo-500/5 rounded-3xl overflow-hidden">
            <CardHeader className="pb-4 flex flex-row items-start justify-between">
                <div className="space-y-1">
                    <CardTitle className="text-xl font-black tracking-tighter text-foreground flex items-center gap-2">
                        🚀 ¡Bienvenido a Liquidar.cl!
                    </CardTitle>
                    <CardDescription className="text-xs font-bold text-muted-foreground/80 uppercase tracking-widest">
                        Completa tu configuración para vender
                    </CardDescription>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDismiss}
                    className="h-8 w-8 rounded-full hover:bg-red-500/10 hover:text-red-500 transition-colors"
                >
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>
            
            <CardContent className="space-y-6">
                {/* Progress Visualizer */}
                <div className="space-y-2">
                    <div className="flex justify-between items-end">
                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                            {completedCount} / {steps.length} PASOS COMPLETADOS
                        </span>
                        <span className="text-lg font-black text-foreground">{progress}%</span>
                    </div>
                    <div className="h-3 bg-muted/30 rounded-full p-0.5 border border-border/50">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out shadow-lg shadow-indigo-500/40"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Steps Grid */}
                <div className="grid gap-3">
                    {steps.map((step) => (
                        <OnboardingStepItem key={step.id} step={step} />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
