'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    LayoutDashboard,
    FileText,
    ShoppingCart,
    Settings,
    BarChart2,
    Users,
    Search,
    Menu,
    Sparkles
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { UserRole } from '@/core/domain/auth/UserRole';

// --- Types ---
// type UserRole = 'admin' | 'vendor' | 'client'; // REMOVED

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
}

interface AppSidebarProps {
    role: UserRole;
    className?: string;
}

// --- Navigation Config ---
const NAV_ITEMS: Record<string, NavItem[]> = {
    [UserRole.ADMIN]: [
        { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="h-5 w-5" /> },
        { label: 'Leads Inteligentes', href: '/admin/leads', icon: <Sparkles className="h-5 w-5" /> },
        { label: 'Cotizaciones', href: '/admin/quotations', icon: <FileText className="h-5 w-5" /> },
        { label: 'Órdenes', href: '/admin/orders', icon: <ShoppingCart className="h-5 w-5" /> },
        { label: 'Analíticas', href: '/admin/analytics', icon: <BarChart2 className="h-5 w-5" /> },
        { label: 'Usuarios', href: '/admin/users', icon: <Users className="h-5 w-5" /> },
        { label: 'Configuración', href: '/admin/settings', icon: <Settings className="h-5 w-5" /> },
    ],
    [UserRole.VENDOR]: [
        { label: 'Dashboard', href: '/vendor', icon: <LayoutDashboard className="h-5 w-5" /> },
        { label: 'Cotizaciones', href: '/vendor/quotations', icon: <FileText className="h-5 w-5" /> },
        { label: 'Órdenes', href: '/vendor/orders', icon: <ShoppingCart className="h-5 w-5" /> },
        { label: 'Configuración', href: '/vendor/settings', icon: <Settings className="h-5 w-5" /> },
    ],
    [UserRole.CLIENT]: [
        { label: 'Dashboard', href: '/client', icon: <LayoutDashboard className="h-5 w-5" /> },
        { label: 'Mis Cotizaciones', href: '/client/quotations', icon: <FileText className="h-5 w-5" /> },
        { label: 'Mis Pedidos', href: '/client/orders', icon: <ShoppingCart className="h-5 w-5" /> },
        { label: 'Perfil', href: '/client/profile', icon: <Settings className="h-5 w-5" /> },
    ],
};

// --- Sidebar Content (Reusable for Desktop and Mobile) ---
function SidebarContent({ role }: { role: UserRole }) {
    const pathname = usePathname();

    return (
        <div className="flex h-full flex-col">
            {/* Logo Area */}
            <div className="flex h-16 items-center px-4">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold">
                        DS
                    </div>
                    <span className="font-bold text-lg tracking-tight text-foreground">Dropservice</span>
                </div>
            </div>

            {/* Search Trigger */}
            <div className="px-4 py-2">
                <button
                    className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50/50 px-3 py-2 text-sm text-indigo-400 hover:border-indigo-300 hover:text-indigo-600 dark:border-[#2e345a] dark:bg-[#222847] transition-colors w-full"
                >
                    <Search className="h-4 w-4" />
                    <span>Buscar...</span>
                    <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-indigo-200 bg-white dark:bg-[#2e345a] dark:border-[#2e345a] px-1.5 font-mono text-[10px] font-medium text-indigo-400">
                        <span className="text-xs">⌘</span>K
                    </kbd>
                </button>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 space-y-1 p-2">
                {(NAV_ITEMS[role] || []).map((item) => {
                    const isActive = pathname === item.href || (item.href !== `/${role}` && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            href={item.href as any}
                            className={cn(
                                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors relative",
                                isActive
                                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                                    : "text-muted-foreground hover:bg-accent hover:text-foreground dark:hover:bg-accent/50"
                            )}
                        >
                            {/* Active Indicator */}
                            {isActive && (
                                <div className="absolute left-0 top-1 bottom-1 w-1 rounded-r-full bg-indigo-600" />
                            )}

                            <span className={cn(isActive ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground group-hover:text-foreground/80")}>
                                {item.icon}
                            </span>
                            <span className="truncate">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

        </div>
    );
}

// --- Main AppSidebar Component (Performance Optimized) ---
export function AppSidebar({ role, className }: AppSidebarProps) {
    return (
        <>
            {/* Mobile Header (Solid Background - No Blur) */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-16 bg-white border-b border-indigo-200 dark:bg-[#1a1f3d] dark:border-[#2e345a]">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold">
                        DS
                    </div>
                    <span className="font-bold text-lg text-foreground">Dropservice</span>
                </div>

                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="h-6 w-6 text-muted-foreground" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-64">
                        <SidebarContent role={role} />
                    </SheetContent>
                </Sheet>
            </div>

            {/* Desktop Sidebar (Static - No Animation, Solid Background) */}
            <aside
                className={cn(
                    "hidden lg:flex w-64 h-screen flex-col border-r border-indigo-200 bg-white dark:bg-[#1a1f3d] dark:border-[#2e345a]",
                    className
                )}
            >
                <SidebarContent role={role} />
            </aside>
        </>
    );
}
