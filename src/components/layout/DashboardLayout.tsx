/**
 * Dashboard Layout Component
 * UI/UX Pro Max: Sidebar + Content area with responsive design
 * Kaizen Standardized Work: Consistent layout across all dashboard pages
 */

import { ReactNode } from 'react';
import { ModeToggle } from '@/components/theme-toggle';

interface DashboardLayoutProps {
    children: ReactNode;
    sidebar: ReactNode;
    header?: ReactNode;
}

export function DashboardLayout({
    children,
    sidebar,
    header,
}: DashboardLayoutProps) {
    return (
        <div className="min-h-screen bg-background">
            {/* Sidebar */}
            <aside className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border z-30">
                {sidebar}
            </aside>

            {/* Main Content */}
            <div className="pl-64">
                {/* Header */}
                {header && (
                    <header className="sticky top-0 z-20 bg-card/80 backdrop-blur-xl border-b border-border flex justify-between items-center pr-6">
                        <div className="flex-1">
                            {header}
                        </div>
                        <div className="flex-none">
                            <ModeToggle />
                        </div>
                    </header>
                )}

                {/* Page Content */}
                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}

/**
 * Sidebar Component
 */
interface SidebarProps {
    logo: ReactNode;
    navigation: ReactNode;
    footer?: ReactNode;
}

export function Sidebar({ logo, navigation, footer }: SidebarProps) {
    return (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-4 border-b border-border">
                {logo}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 overflow-y-auto">
                {navigation}
            </nav>

            {/* Footer */}
            {footer && (
                <div className="p-4 border-t border-border">
                    {footer}
                </div>
            )}
        </div>
    );
}

/**
 * Navigation Item
 */
interface NavItemProps {
    href: string;
    icon: ReactNode;
    label: string;
    active?: boolean;
    badge?: string | number;
}

export function NavItem({ href, icon, label, active = false, badge }: NavItemProps) {
    return (
        <a
            href={href}
            className={`
        flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
        transition-colors duration-150
        ${active
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-muted-foreground hover:bg-accent dark:hover:bg-accent/50'
                }
      `}
        >
            <span className="w-5 h-5">{icon}</span>
            <span className="flex-1">{label}</span>
            {badge !== undefined && (
                <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 rounded-full">
                    {badge}
                </span>
            )}
        </a>
    );
}

/**
 * Page Header
 */
interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
    return (
        <div className="flex items-center justify-between px-6 py-4">
            <div>
                <h1 className="text-xl font-bold text-foreground">
                    {title}
                </h1>
                {description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex items-center gap-3">
                    {actions}
                </div>
            )}
        </div>
    );
}
