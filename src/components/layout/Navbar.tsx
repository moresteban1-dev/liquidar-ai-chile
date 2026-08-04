'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { UserRole, normalizeRole } from '@/core/domain/auth/UserRole';
import { BrandLogo } from '@/components/shared/BrandLogo';

export function Navbar() {
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<UserRole>(UserRole.CLIENT);
    const { unreadCount } = useNotifications();

    useEffect(() => {
        const supabase = createClient();
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                const role = normalizeRole(profile?.role);
                setUserRole(role);
            }

            setLoading(false);
        };
        checkUser();
    }, []);

    // Don't show Navbar on dashboard, login, or register pages
    if (
        pathname.startsWith('/admin') ||
        pathname.startsWith('/vendor') ||
        pathname.startsWith('/client') ||
        pathname === '/login' ||
        pathname === '/register'
    ) {
        return null;
    }

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <BrandLogo variant="white" size="md" />
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-7">
                        <Link href="/subastas" className="text-sm font-semibold text-muted-foreground hover:text-amber-400 transition-colors">
                            Subastas
                        </Link>
                        <Link href="/sobre-nosotros" className="text-sm font-semibold text-muted-foreground hover:text-amber-400 transition-colors">
                            Sobre Nosotros
                        </Link>
                        <Link href="/vender" className="text-sm font-semibold text-muted-foreground hover:text-amber-400 transition-colors">
                            Vender Stock
                        </Link>
                        <Link href="/como-funciona" className="text-sm font-semibold text-muted-foreground hover:text-amber-400 transition-colors">
                            Cómo Funciona
                        </Link>
                    </div>

                    {/* Auth Buttons */}
                    <div className="flex items-center gap-4">
                        {loading ? (
                            <div className="w-24 h-9 bg-muted rounded-md animate-pulse" />
                        ) : user ? (
                             
                            <Link href={`/${userRole.toLowerCase()}` as any} className="flex items-center gap-4">
                                <div className="relative">
                                    <Bell className="h-5 w-5 text-muted-foreground hover:text-indigo-600 transition-colors" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-white">
                                            {unreadCount}
                                        </span>
                                    )}
                                </div>
                                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20">
                                    Ir a mi Dashboard
                                </Button>
                            </Link>
                        ) : (
                            <>
                                <Link href="/login">
                                    <Button variant="ghost" className="text-muted-foreground hover:text-indigo-600">
                                        Iniciar Sesión
                                    </Button>
                                </Link>
                                <Link href="/register">
                                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20">
                                        Registrarse
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
