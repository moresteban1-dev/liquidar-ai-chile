'use client';

/**
 * ShadCN Dashboard Layout
 * Enhanced layout with ShadCN components + Tailwind CSS
 * Use this for the new dashboard design
 */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { Route } from 'next';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    LayoutDashboard,
    FileText,
    ShoppingCart,
    Settings,
    Menu,
    X,
    LogOut,
    ChevronRight,
    Folder,
    BarChart2,
    Users,
    Globe,
    Package,
    DollarSign,
    CreditCard,
} from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { NotificationCenter } from '@/app/client/components/v2/notification-center';

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
}

interface ShadcnDashboardLayoutProps {
    children: React.ReactNode;
    role: 'admin' | 'vendor' | 'client';
    userName?: string;
    userEmail?: string;
}

const NAV_ITEMS: Record<'admin' | 'vendor' | 'client', NavItem[]> = {
    admin: [
        { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="h-5 w-5" /> },
        { label: 'Catálogo', href: '/admin/catalog', icon: <Package className="h-5 w-5" /> },
        { label: 'Cotizaciones', href: '/admin/quotations', icon: <FileText className="h-5 w-5" /> },
        { label: 'Órdenes', href: '/admin/orders', icon: <ShoppingCart className="h-5 w-5" /> },
        { label: 'Usuarios', href: '/admin/users', icon: <Users className="h-5 w-5" /> },
        { label: 'Finanzas', href: '/admin/finance', icon: <DollarSign className="h-5 w-5" /> },
        { label: 'Pagos', href: '/admin/payments', icon: <CreditCard className="h-5 w-5" /> },
        { label: 'Analíticas', href: '/admin/analytics', icon: <BarChart2 className="h-5 w-5" /> },
    ],
    vendor: [
        { label: 'Dashboard', href: '/vendor', icon: <LayoutDashboard className="h-5 w-5" /> },
        { label: 'Cotizaciones', href: '/vendor/quotations', icon: <FileText className="h-5 w-5" /> },
        { label: 'Órdenes', href: '/vendor/orders', icon: <ShoppingCart className="h-5 w-5" /> },
        { label: 'Inventario', href: '/vendor/inventory', icon: <Package className="h-5 w-5" /> },
        { label: 'Configuración', href: '/vendor/settings', icon: <Settings className="h-5 w-5" /> },
    ],
    client: [
        { label: 'Dashboard', href: '/client', icon: <LayoutDashboard className="h-5 w-5" /> },
        { label: 'Explorar', href: '/client/browse', icon: <Folder className="h-5 w-5" /> },
        { label: 'Mis Cotizaciones', href: '/client/quotations', icon: <FileText className="h-5 w-5" /> },
        { label: 'Mis Pedidos', href: '/client/orders', icon: <ShoppingCart className="h-5 w-5" /> },
    ],
};

const ROLE_LABELS: Record<string, string> = {
    admin: 'Administrador',
    vendor: 'Proveedor',
    client: 'Cliente',
};

export function ShadcnDashboardLayout({ children, role, userName = 'Usuario', userEmail = '' }: ShadcnDashboardLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const navItems = NAV_ITEMS[role];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { unreadCount: __unreadCount } = useNotifications();

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.refresh(); // Refresh server components
        router.push('/'); // Redirect to home
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 w-64 transform bg-card border-r border-border transition-transform duration-200 lg:translate-x-0',
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                {/* Logo */}
                <div className="flex h-16 items-center justify-between px-4 border-b border-border">
                    <Link href={`/${role}`} className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">DS</span>
                        </div>
                        <span className="font-semibold text-foreground">Dropservice</span>
                    </Link>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                        aria-label="Cerrar menú"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== `/${role}` && pathname.startsWith(item.href));

                        return (
                            <Link
                                key={item.href}
                                href={item.href as Route}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                )}
                            >
                                {item.icon}
                                {item.label}
                                {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
                            </Link>
                        );
                    })}
                </nav>

            </aside>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Top header */}
                <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 lg:px-8">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Abrir menú"
                    >
                        <Menu className="h-5 w-5" />
                    </Button>

                    <div className="flex-1" />

                    <div className="mr-2 relative">
                        <NotificationCenter />
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="pl-2 pr-3 gap-3 focus:ring-2 focus:ring-indigo-500 h-10 rounded-full hover:bg-accent/50 transition-all border border-transparent hover:border-border/40" aria-label="Menú de usuario">
                                <Avatar className="h-8 w-8 ring-2 ring-indigo-500/10 shadow-sm transition-transform hover:scale-105">
                                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold">
                                        {getInitials(userName)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="hidden sm:flex flex-col items-start text-left min-w-[100px]">
                                    <span className="text-sm font-semibold text-foreground tracking-tight line-clamp-1">{userName}</span>
                                    <span className="text-[10px] font-medium text-muted-foreground/80 uppercase tracking-wider">{ROLE_LABELS[role]}</span>
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64 p-2">
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{userName}</p>
                                    <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            <DropdownMenuItem asChild>
                                <Link href={`/${role}`} className="cursor-pointer w-full">
                                    <LayoutDashboard className="mr-2 h-4 w-4" />
                                    Panel de Control
                                </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild>
                                <Link href={role === 'client' ? '/client/profile' : `/${role}/settings`} className="cursor-pointer w-full">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Configuración de la cuenta
                                </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild>
                                <Link href="/" className="cursor-pointer w-full">
                                    <Globe className="mr-2 h-4 w-4" />
                                    Sitio Web
                                </Link>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20 cursor-pointer" onClick={handleLogout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                Cerrar Sesión
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>

                {/* Page content */}
                <main className="p-4 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
