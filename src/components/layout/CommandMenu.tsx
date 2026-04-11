"use client";

/**
 * CommandMenu — Global Cmd+K / Ctrl+K Command Palette
 * Role-based navigation using cmdk + Radix Dialog.
 * Provides instant keyboard-first access to all platform pages.
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import {
    LayoutDashboard,
    FileText,
    ShoppingCart,
    Users,
    BarChart3,
    Package,
    Star,
    Settings,
    Plus,
} from 'lucide-react';

/** Navigation structure per role */
const NAVIGATION_GROUPS = [
    {
        heading: "Admin",
        items: [
            { label: "Dashboard Admin", href: "/admin", icon: LayoutDashboard },
            { label: "Cotizaciones", href: "/admin/quotations", icon: FileText },
            { label: "Órdenes", href: "/admin/orders", icon: ShoppingCart },
            { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
            { label: "Usuarios", href: "/admin/users", icon: Users },
            { label: "Configuración", href: "/admin/settings", icon: Settings },
        ],
    },
    {
        heading: "Cliente",
        items: [
            { label: "Dashboard Cliente", href: "/client", icon: LayoutDashboard },
            { label: "Nueva Solicitud", href: "/client/quotations/request", icon: Plus },
            { label: "Mis Cotizaciones", href: "/client/quotations", icon: FileText },
        ],
    },
    {
        heading: "Proveedor",
        items: [
            { label: "Dashboard Proveedor", href: "/vendor", icon: LayoutDashboard },
            { label: "Oportunidades", href: "/vendor/quotations", icon: Package },
            { label: "Mis Pedidos", href: "/vendor/orders", icon: ShoppingCart },
            { label: "Calificación", href: "/vendor/rating", icon: Star },
        ],
    },
];

export function CommandMenu() {
    const [open, setOpen] = React.useState(false);
    const router = useRouter();

    React.useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if ((event.metaKey || event.ctrlKey) && event.key === "k") {
                event.preventDefault();
                setOpen((prev) => !prev);
            }
        }

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    const handleSelect = React.useCallback(
        (href: string) => {
            setOpen(false);
             
            router.push(href as any);
        },
        [router]
    );

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Buscar páginas, acciones..." />
            <CommandList>
                <CommandEmpty>Sin resultados.</CommandEmpty>
                {NAVIGATION_GROUPS.map((group, groupIndex) => (
                    <React.Fragment key={group.heading}>
                        {groupIndex > 0 && <CommandSeparator />}
                        <CommandGroup heading={group.heading}>
                            {group.items.map((item) => (
                                <CommandItem
                                    key={item.href}
                                    value={`${group.heading} ${item.label}`}
                                    onSelect={() => handleSelect(item.href)}
                                >
                                    <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <span>{item.label}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </React.Fragment>
                ))}
            </CommandList>
        </CommandDialog>
    );
}
